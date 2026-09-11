import { createHash } from "node:crypto";
import { PgBoss } from "pg-boss";
import {
  buildCapabilityScope,
  evaluateMargin,
  evaluateSentinel,
  getActionPolicy,
  serializeCapabilityScope
} from "@agesoma/core";
import { sql } from "@agesoma/db";
import { executeWithHermes } from "./hermes";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("pg-boss", error));
await boss.start();
await boss.createQueue("agesoma.execute");

const instanceId = process.env.HOSTNAME ?? `worker-${process.pid}`;

async function reportHeartbeat() {
  await sql(`
    insert into runtime_heartbeats (service, instance_id, metadata, last_seen_at)
    values ('agesoma-worker', $1, $2::jsonb, now())
    on conflict (service) do update
      set instance_id=excluded.instance_id,
          metadata=excluded.metadata,
          last_seen_at=excluded.last_seen_at
  `, [instanceId, JSON.stringify({ hermesConfigured: Boolean(process.env.HERMES_BASE_URL && process.env.HERMES_SERVICE_TOKEN) })]);
}

type QueuedTask = {
  id: string;
  tenant_id: string;
  action_type: string;
  risk_class: "R0" | "R1" | "R2" | "R3" | "R4";
  reversible: boolean;
  external: boolean;
  expected_value_cents: string | number;
  expected_cost_cents: string | number;
  expected_loss_cents: string | number;
  confidence: string | number;
  payload: Record<string, unknown>;
};

async function dispatchQueuedTasks() {
  const tasks = await sql<QueuedTask>(`
    select id, tenant_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    from tasks
    where status='queued' and action_type is not null and dispatched_at is null
    order by created_at asc
    limit 25
  `);

  for (const task of tasks) {
    const jobId = await boss.send("agesoma.execute", {
      taskId: task.id,
      tenantId: task.tenant_id
    }, { singletonKey: task.id, retryLimit: 3, retryDelay: 5 });

    if (jobId) {
      await sql(`update tasks set dispatched_at=now(), updated_at=now() where id=$1 and tenant_id=$2 and status='queued'`, [task.id, task.tenant_id]);
    }
  }
}

await boss.work("agesoma.execute", async ([job]) => {
  const queued = job.data as { taskId: string; tenantId: string };

  const [task] = await sql<QueuedTask>(`
    select id, tenant_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    from tasks
    where id=$1 and tenant_id=$2 and status='queued'
    limit 1
  `, [queued.taskId, queued.tenantId]);

  if (!task) return { status: "stale", reason: "Task is no longer queued" };

  const data = {
    taskId: task.id,
    tenantId: task.tenant_id,
    action: task.action_type,
    riskClass: task.risk_class,
    reversible: task.reversible,
    external: task.external,
    expectedValueCents: Number(task.expected_value_cents),
    expectedCostCents: Number(task.expected_cost_cents),
    expectedLossCents: Number(task.expected_loss_cents),
    confidence: Number(task.confidence),
    payload: task.payload
  };

  const capabilityScope = buildCapabilityScope({ taskId: data.taskId, action: data.action, payload: data.payload });
  const capabilityHash = createHash("sha256").update(serializeCapabilityScope(capabilityScope)).digest("hex");

  const grants = await sql<{ id: string }>(`
    select id from approval_grants
    where tenant_id=$1 and task_id=$2 and action_class=$3 and scope_hash=$4
      and revoked_at is null and consumed_at is null and expires_at > now()
    order by created_at desc limit 1
  `, [data.tenantId, data.taskId, data.action, capabilityHash]);

  const policy = evaluateSentinel({ ...data, type: data.action, hasScopedGrant: grants.length > 0 });
  await sql(`insert into policy_decisions (tenant_id, task_id, action_class, risk_class, decision, reason) values ($1,$2,$3,$4,$5,$6)`, [
    data.tenantId, data.taskId, data.action, data.riskClass, policy.decision, policy.reason
  ]);

  if (policy.decision === "DENY") {
    await sql(`update tasks set status='denied', failure_reason=$3, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId, policy.reason]);
    return { status: "denied", reason: policy.reason };
  }
  if (policy.decision === "REVIEW") {
    await sql(`update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);
    return { status: "awaiting_approval", reason: policy.reason };
  }

  const margin = evaluateMargin(data);
  if (margin.decision !== "EXECUTE") {
    await sql(`update tasks set status='failed', failure_reason=$3, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId, margin.reason]);
    return { status: "replan", reason: margin.reason };
  }

  const registeredAction = getActionPolicy(data.action);
  let grantRef: string | undefined;
  if (registeredAction?.riskClass === "R2" || registeredAction?.riskClass === "R3") {
    const grantId = grants[0]?.id;
    if (!grantId) {
      await sql(`update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);
      return { status: "awaiting_approval", reason: "Exact approval grant missing" };
    }

    const consumed = await sql<{ id: string }>(`
      update approval_grants set consumed_at=now()
      where id=$1 and tenant_id=$2 and task_id=$3 and action_class=$4 and scope_hash=$5
        and revoked_at is null and consumed_at is null and expires_at > now()
      returning id
    `, [grantId, data.tenantId, data.taskId, data.action, capabilityHash]);

    if (!consumed[0]) {
      await sql(`update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);
      return { status: "awaiting_approval", reason: "Approval grant expired, consumed or scope changed" };
    }
    grantRef = consumed[0].id;
  }

  await sql(`update tasks set status='running', execution_started_at=now(), failure_reason=null, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);

  try {
    const result = await executeWithHermes({ taskId: data.taskId, tenantId: data.tenantId, action: data.action, payload: data.payload, grantRef });
    await sql(`update tasks set status='completed', execution_finished_at=now(), execution_result=$3::jsonb, updated_at=now() where id=$1 and tenant_id=$2`, [
      data.taskId, data.tenantId, JSON.stringify(result)
    ]);
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Execution failed";
    await sql(`update tasks set status='failed', execution_finished_at=now(), failure_reason=$3, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId, reason]);
    throw error;
  }
});

await reportHeartbeat();
await dispatchQueuedTasks();
setInterval(() => {
  reportHeartbeat().catch((error) => console.error("InstantWork heartbeat", error));
}, 30_000).unref();
setInterval(() => {
  dispatchQueuedTasks().catch((error) => console.error("InstantWork dispatcher", error));
}, 5_000).unref();

console.log("InstantWork worker listening on agesoma.execute");
