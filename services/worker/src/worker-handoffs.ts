import { sql } from "@agesoma/db";

type HandoffSpec = {
  targetWorkerKey: string;
  objective: string;
  reason: string;
};

type TargetWorker = {
  id: string;
  agent_id: string;
  worker_key: string;
  name: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseOutput(value: unknown): Record<string, unknown> | null {
  const outer = record(value);
  const candidate = outer?.output ?? value;
  if (typeof candidate === "string") {
    try { return record(JSON.parse(candidate)); } catch { return null; }
  }
  return record(candidate);
}

function specs(value: unknown): HandoffSpec[] {
  const output = parseOutput(value);
  const raw = output?.handoffs ?? output?.handoffRequests;
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 2).flatMap((item) => {
    const entry = record(item);
    const targetWorkerKey = typeof entry?.targetWorkerKey === "string" ? entry.targetWorkerKey.trim() : "";
    const objective = typeof entry?.objective === "string" ? entry.objective.trim() : "";
    const reason = typeof entry?.reason === "string" ? entry.reason.trim() : "";
    if (!targetWorkerKey || objective.length < 3 || objective.length > 1200) return [];
    return [{
      targetWorkerKey,
      objective,
      reason: reason.slice(0, 600) || "Specialist worker can complete an independent internal subtask."
    }];
  });
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
}

export async function scheduleWorkerHandoffs(input: {
  tenantId: string;
  sourceTaskId: string;
  sourceWorkerId: string | null;
  sourcePayload: Record<string, unknown>;
  executionResult: unknown;
}) {
  if (!input.sourceWorkerId) return [];

  const depthRaw = input.sourcePayload.workerHandoffDepth;
  const depth = typeof depthRaw === "number" && Number.isFinite(depthRaw) ? Math.max(0, Math.trunc(depthRaw)) : 0;
  if (depth >= 2) return [];

  const chain = new Set([
    ...stringList(input.sourcePayload.workerChain),
    input.sourceWorkerId
  ]);

  const requested = specs(input.executionResult);
  if (!requested.length) return [];

  const created: Array<{ handoffId: string; taskId: string; workerKey: string }> = [];

  for (const spec of requested) {
    const [target] = await sql<TargetWorker>(`
      select pw.id,pw.agent_id,pw.worker_key,pw.name
      from persistent_workers pw
      where pw.tenant_id=$1
        and pw.worker_key=$2
        and pw.status='active'
        and pw.id<>$3
      limit 1
    `, [input.tenantId,spec.targetWorkerKey,input.sourceWorkerId]);

    if (!target || chain.has(target.id)) continue;

    const existing = await sql<{ id: string }>(`
      select id
      from worker_handoffs
      where tenant_id=$1 and source_task_id=$2 and target_worker_id=$3
      limit 1
    `, [input.tenantId,input.sourceTaskId,target.id]);
    if (existing[0]) continue;

    const payload = {
      objective: spec.objective,
      requestedAction: "business.work",
      operation: "prepare",
      resource: null,
      workerHandoffDepth: depth + 1,
      workerChain: [...chain],
      handoffFromTaskId: input.sourceTaskId,
      handoffReason: spec.reason,
      outputContract: {
        artifact: "Return a concrete internal work product that helps AGESOMA complete the parent objective.",
        outcome: "Do not claim external side effects or verified outcomes.",
        handoffs: "Only request another specialist when strictly necessary. Never request more than two handoffs."
      }
    };

    const [task] = await sql<{ id: string }>(`
      insert into tasks (
        tenant_id,worker_id,status,action_type,risk_class,reversible,external,
        expected_value_cents,expected_cost_cents,expected_loss_cents,confidence,payload
      ) values ($1,$2,'queued','business.work','R1',true,false,0,0,0,0,$3::jsonb)
      returning id
    `, [input.tenantId,target.id,JSON.stringify(payload)]);
    if (!task) continue;

    await sql(`
      insert into agent_task_assignments (tenant_id,task_id,agent_id,assigned_reason)
      values ($1,$2,$3,$4)
      on conflict (task_id) do nothing
    `, [input.tenantId,task.id,target.agent_id,`Internal handoff to ${target.name}`]);

    await sql(`
      insert into work_assignments (
        tenant_id,task_id,executor_type,team_member_id,status,reason,assigned_by
      ) values ($1,$2,'hermes',null,'assigned',$3,'agesoma')
      on conflict (task_id) do nothing
    `, [input.tenantId,task.id,`Persistent worker handoff: ${spec.reason}`]);

    const [handoff] = await sql<{ id: string }>(`
      insert into worker_handoffs (
        tenant_id,source_worker_id,target_worker_id,source_task_id,target_task_id,
        status,reason,context,accepted_at
      ) values ($1,$2,$3,$4,$5,'accepted',$6,$7::jsonb,now())
      on conflict (source_task_id,target_worker_id) where source_task_id is not null
      do nothing
      returning id
    `, [
      input.tenantId,
      input.sourceWorkerId,
      target.id,
      input.sourceTaskId,
      task.id,
      spec.reason,
      JSON.stringify({ objective: spec.objective, depth: depth + 1 })
    ]);

    if (!handoff) continue;

    await sql(`
      insert into activity_events (tenant_id,task_id,event_type,title,summary,status,metadata)
      values ($1,$2,'system','Trabalho coordenado internamente',$3,'info',$4::jsonb)
    `, [
      input.tenantId,
      task.id,
      spec.objective,
      JSON.stringify({ handoffId: handoff.id, sourceTaskId: input.sourceTaskId, workerKey: target.worker_key })
    ]);

    created.push({ handoffId: handoff.id, taskId: task.id, workerKey: target.worker_key });
  }

  return created;
}
