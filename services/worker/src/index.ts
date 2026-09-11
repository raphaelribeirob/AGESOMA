import { PgBoss } from "pg-boss";
import { evaluateMargin, evaluateSentinel } from "@agesoma/core";
import { sql } from "@agesoma/db";
import { executeWithHermes } from "./hermes";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("pg-boss", error));
await boss.start();
await boss.createQueue("agesoma.execute");

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
    }, { singletonKey: task.id, retryLimit: 3, retryDelay: 5 });

    if (jobId) {
      await sql(`update tasks set dispatched_at=now(), updated_at=now() where id=$1 and tenant_id=$2 and status='queued'`, [task.id, task.tenant_id]);
    }
  }
}

await boss.work("agesoma.execute", async ([job]) => {
  const data = job.data as {
    taskId: string;
    tenantId: string;
    action: string;
    riskClass: "R0" | "R1" | "R2" | "R3" | "R4";
    reversible: boolean;
    external: boolean;
    expectedValueCents: number;
    expectedCostCents: number;
    expectedLossCents: number;
    confidence: number;
    payload: Record<string, unknown>;
  };

  const grants = await sql<{ id: string }>(`
    select id from approval_grants
    where tenant_id=$1 and task_id=$2 and action_class=$3
      and revoked_at is null and (expires_at is null or expires_at > now())
    order by created_at desc limit 1
  `, [data.tenantId, data.taskId, data.action]);

  const policy = evaluateSentinel({ ...data, type: data.action, hasScopedGrant: grants.length > 0 });
  await sql(`insert into policy_decisions (tenant_id, task_id, action_class, risk_class, decision, reason) values ($1,$2,$3,$4,$5,$6)`, [
    data.tenantId, data.taskId, data.action, data.riskClass, policy.decision, policy.reason
  ]);

  if (policy.decision === "DENY") {
    await sql(`update tasks set status='denied', failure_reason=$3, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId, policy.reason]);
    return { status: "denied", reason: policy.reason };
  }
  if (policy.decision === "REVIEW") {
    await sql(`update tasks set status='awaiting_approval', updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);
    return { status: "awaiting_approval", reason: policy.reason };
  }

  const margin = evaluateMargin(data);
  if (margin.decision !== "EXECUTE") {
    await sql(`update tasks set status='failed', failure_reason=$3, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId, margin.reason]);
    return { status: "replan", reason: margin.reason };
  }

  await sql(`update tasks set status='running', execution_started_at=now(), failure_reason=null, updated_at=now() where id=$1 and tenant_id=$2`, [data.taskId, data.tenantId]);

  try {
    const result = await executeWithHermes({ taskId: data.taskId, tenantId: data.tenantId, action: data.action, payload: data.payload, grantRef: grants[0]?.id });
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

await dispatchQueuedTasks();
setInterval(() => {
  dispatchQueuedTasks().catch((error) => console.error("AGESOMA dispatcher", error));
}, 5_000).unref();

console.log("AGESOMA worker listening on agesoma.execute");
