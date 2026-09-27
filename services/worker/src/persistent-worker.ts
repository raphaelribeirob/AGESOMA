import { sql } from "@agesoma/db";

export type PersistentWorkerRuntime = {
  id: string;
  workerKey: string;
  name: string;
  sessionNamespace: string;
  browserProfileRef: string | null;
  fileNamespace: string;
  memoryNamespace: string;
  credentialNamespace: string;
  runtimeStrategy: "shared_cell" | "dedicated_cell";
  recentWork: Array<{
    taskId: string;
    action: string;
    objective: string | null;
    completedAt: string | null;
    resultSnapshot: string | null;
  }>;
  agent: {
    id: string;
    templateKey: string;
    roleTitle: string;
    domain: string;
    purpose: string;
    responsibilities: unknown;
    skills: unknown;
    preferredResources: unknown;
  };
};

type WorkerRow = {
  id: string;
  worker_key: string;
  name: string;
  session_namespace: string;
  browser_profile_ref: string | null;
  file_namespace: string;
  memory_namespace: string;
  credential_namespace: string;
  runtime_strategy: "shared_cell" | "dedicated_cell";
  agent_id: string;
  template_key: string;
  role_title: string;
  domain: string;
  purpose: string;
  responsibilities: unknown;
  skills: unknown;
  preferred_resources: unknown;
};

function runtime(row: WorkerRow, recentWork: PersistentWorkerRuntime["recentWork"]): PersistentWorkerRuntime {
  return {
    id: row.id,
    workerKey: row.worker_key,
    name: row.name,
    sessionNamespace: row.session_namespace,
    browserProfileRef: row.browser_profile_ref,
    fileNamespace: row.file_namespace,
    memoryNamespace: row.memory_namespace,
    credentialNamespace: row.credential_namespace,
    runtimeStrategy: row.runtime_strategy,
    recentWork,
    agent: {
      id: row.agent_id,
      templateKey: row.template_key,
      roleTitle: row.role_title,
      domain: row.domain,
      purpose: row.purpose,
      responsibilities: row.responsibilities,
      skills: row.skills,
      preferredResources: row.preferred_resources
    }
  };
}

export async function loadPersistentWorkerForTask(input: {
  tenantId: string;
  taskId: string;
  workerId?: string | null;
}): Promise<PersistentWorkerRuntime | null> {
  const rows = await sql<WorkerRow>(`
    select
      pw.id,pw.worker_key,pw.name,pw.session_namespace,pw.browser_profile_ref,
      pw.file_namespace,pw.memory_namespace,pw.credential_namespace,pw.runtime_strategy,
      a.id as agent_id,a.template_key,a.role_title,a.domain,a.purpose,
      a.responsibilities,a.skills,a.preferred_resources
    from persistent_workers pw
    join digital_agents a
      on a.id=pw.agent_id and a.tenant_id=pw.tenant_id
    where pw.tenant_id=$1
      and pw.status='active'
      and (
        ($3::uuid is not null and pw.id=$3::uuid)
        or (
          $3::uuid is null
          and exists (
            select 1
            from agent_task_assignments ata
            where ata.tenant_id=$1 and ata.task_id=$2 and ata.agent_id=pw.agent_id
          )
        )
      )
    order by case when pw.id=$3::uuid then 0 else 1 end, pw.updated_at desc
    limit 1
  `, [input.tenantId,input.taskId,input.workerId ?? null]);

  const row = rows[0];
  if (!row) return null;

  if (!input.workerId) {
    await sql(`
      update tasks set worker_id=$3,updated_at=now()
      where id=$1 and tenant_id=$2 and worker_id is null
    `, [input.taskId,input.tenantId,row.id]);
  }

  await sql(`
    update persistent_workers set last_active_at=now(),updated_at=now()
    where id=$1 and tenant_id=$2
  `, [row.id,input.tenantId]);

  const recentRows = await sql<{
    id: string;
    action_type: string;
    objective: string | null;
    completed_at: Date | string | null;
    result_snapshot: string | null;
  }>(`
    select
      id,
      action_type,
      nullif(payload->>'objective','') as objective,
      execution_finished_at as completed_at,
      left(execution_result::text,2000) as result_snapshot
    from tasks
    where tenant_id=$1
      and worker_id=$2
      and id<>$3
      and status='completed'
    order by execution_finished_at desc nulls last,updated_at desc
    limit 6
  `, [input.tenantId,row.id,input.taskId]);

  const recentWork = recentRows.map((item) => ({
    taskId: item.id,
    action: item.action_type,
    objective: item.objective,
    completedAt: item.completed_at ? new Date(item.completed_at).toISOString() : null,
    resultSnapshot: item.result_snapshot
  }));

  return runtime(row,recentWork);
}
