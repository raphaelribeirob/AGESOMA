import { tenantSql } from "@agesoma/db";

export type PersistentWorkerRef = {
  id: string;
  agent_id: string;
  worker_key: string;
  name: string;
  session_namespace: string;
  browser_profile_ref: string | null;
  file_namespace: string;
  memory_namespace: string;
  credential_namespace: string;
  runtime_strategy: "shared_cell" | "dedicated_cell";
};

export type AgentForWorker = {
  id: string;
  template_key: string;
  name: string;
  memory_namespace: string;
};

function namespaces(agent: AgentForWorker) {
  const key = agent.template_key.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  return {
    session: `worker:${key}`,
    browser: `browser:${key}`,
    files: `worker:${key}:files`,
    memory: agent.memory_namespace || `agent:${key}`,
    credentials: `worker:${key}:credentials`
  };
}

export async function ensurePersistentWorker(
  tenantId: string,
  agent: AgentForWorker
): Promise<PersistentWorkerRef> {
  const ns = namespaces(agent);

  const [workCell] = await tenantSql<{ id: string }>(tenantId, `
    select id
    from work_cells
    where tenant_id=$1 and status in ('ready','provisioning','degraded')
    order by case status when 'ready' then 0 when 'provisioning' then 1 else 2 end, updated_at desc
    limit 1
  `, [tenantId]);

  const [worker] = await tenantSql<PersistentWorkerRef>(tenantId, `
    insert into persistent_workers (
      tenant_id,agent_id,work_cell_id,worker_key,name,runtime_strategy,
      session_namespace,browser_profile_ref,file_namespace,memory_namespace,
      credential_namespace,last_active_at
    ) values ($1,$2,$3,$4,$5,'shared_cell',$6,$7,$8,$9,$10,now())
    on conflict (tenant_id,agent_id) do update set
      work_cell_id=coalesce(excluded.work_cell_id,persistent_workers.work_cell_id),
      worker_key=excluded.worker_key,
      name=excluded.name,
      session_namespace=excluded.session_namespace,
      browser_profile_ref=coalesce(persistent_workers.browser_profile_ref,excluded.browser_profile_ref),
      file_namespace=excluded.file_namespace,
      memory_namespace=excluded.memory_namespace,
      credential_namespace=excluded.credential_namespace,
      status=case when persistent_workers.status='retired' then persistent_workers.status else 'active' end,
      updated_at=now()
    returning id,agent_id,worker_key,name,session_namespace,browser_profile_ref,
      file_namespace,memory_namespace,credential_namespace,runtime_strategy
  `, [
    tenantId,
    agent.id,
    workCell?.id ?? null,
    agent.template_key,
    agent.name,
    ns.session,
    ns.browser,
    ns.files,
    ns.memory,
    ns.credentials
  ]);

  if (!worker) throw new Error("Persistent worker could not be provisioned");
  return worker;
}

export function workerTemplateForRoutine(kind: string, resource?: string | null) {
  const input = `${kind} ${resource ?? ""}`.toLowerCase();
  if (/paid_media|meta|facebook|google_ads|ads|tráfego|trafego/.test(input)) return "paid_media";
  if (/email|gmail|whatsapp|communication|atendimento|support/.test(input)) return "service";
  if (/calendar|agenda|operations|operacao|operação|files|drive/.test(input)) return "operations";
  if (/finance|invoice|billing|pagamento|cobran/.test(input)) return "finance";
  if (/marketing|content|conteudo|conteúdo|growth/.test(input)) return "marketing";
  if (/sales|crm|lead|vendas/.test(input)) return "sales";
  return "research";
}

export async function ensurePersistentWorkerByTemplate(
  tenantId: string,
  templateKey: string
): Promise<PersistentWorkerRef | null> {
  const [agent] = await tenantSql<AgentForWorker>(tenantId, `
    select id,template_key,name,memory_namespace
    from digital_agents
    where tenant_id=$1 and template_key=$2 and status='active'
    limit 1
  `, [tenantId,templateKey]);

  if (!agent) return null;
  return await ensurePersistentWorker(tenantId,agent);
}
