import { PgBoss } from "pg-boss";
import { evaluateMargin, evaluateSentinel } from "@agesoma/core";
import { sql } from "@agesoma/db";
import { executeWithHermes } from "./hermes";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("pg-boss", error));
await boss.start();
await boss.createQueue("agesoma.execute");

type ExecutionJob = {
  taskId: string;
  tenantId: string;
  action: string;
  riskClass: "R0" | "R1" | "R2" | "R3" | "R4";
  reversible: boolean;
  external: boolean;
  hasScopedGrant: boolean;
  grantRef?: string;
  expectedValueCents: number;
  expectedCostCents: number;
  expectedLossCents: number;
  confidence: number;
  payload: Record<string, unknown>;
};

async function recordPolicy(task: ExecutionJob, decision: string, reason: string, metadata: Record<string, unknown> = {}) {
  await sql(
    `insert into policy_decisions (tenant_id, task_id, decision, reason, metadata)
     values ($1, $2, $3, $4, $5)`,
    [task.tenantId, task.taskId, decision, reason, metadata]
  );
}

async function setTaskState(taskId: string, status: string, extras: { result?: unknown; failure?: string } = {}) {
  await sql(
    `update tasks
       set status = $2,
           execution_started_at = case when $2 = 'running' then coalesce(execution_started_at, now()) else execution_started_at end,
           execution_finished_at = case when $2 in ('completed', 'failed', 'denied') then now() else execution_finished_at end,
           execution_result = case when $3::jsonb is not null then $3::jsonb else execution_result end,
           failure_reason = case when $4::text is not null then $4::text else failure_reason end,
           updated_at = now()
     where id = $1`,
    [taskId, status, extras.result ? JSON.stringify(extras.result) : null, extras.failure ?? null]
  );
}

async function dispatchQueuedTasks() {
  const tasks = await sql<ExecutionJob>(`
    with candidates as (
      select t.id
      from tasks t
      where t.status = 'queued'
      order by t.created_at asc
      limit 25
      for update skip locked
    )
    update tasks t
       set status = 'scheduled', updated_at = now()
      from candidates c
      left join approval_grants g on g.id = t.grant_ref
     where t.id = c.id
     returning
       t.id as "taskId",
       t.tenant_id as "tenantId",
       coalesce(t.action_type, 'unspecified') as action,
       t.risk_class as "riskClass",
       t.reversible,
       t.external,
       (g.id is not null and (g.expires_at is null or g.expires_at > now())) as "hasScopedGrant",
       g.id::text as "grantRef",
       t.expected_value_cents::int as "expectedValueCents",
       t.expected_cost_cents::int as "expectedCostCents",
       t.expected_loss_cents::int as "expectedLossCents",
       t.confidence::float8 as confidence,
       t.payload
  `);

  for (const task of tasks) {
    try {
      await boss.send("agesoma.execute", task);
    } catch (error) {
      console.error("dispatch failed", task.taskId, error);
      await sql(`update tasks set status = 'queued', updated_at = now() where id = $1`, [task.taskId]);
    }
  }
}

async function recoverOrphanedSchedules() {
  await sql(`
    update tasks
       set status = 'queued', updated_at = now()
     where status = 'scheduled'
       and updated_at < now() - interval '5 minutes'
  `);
}

await boss.work("agesoma.execute", async ([job]) => {
  const data = job.data as ExecutionJob;

  const policy = evaluateSentinel(data);
  await recordPolicy(data, policy.decision, policy.reason, { source: "worker", grantRef: data.grantRef ?? null });

  if (policy.decision === "DENY") {
    await setTaskState(data.taskId, "denied", { failure: policy.reason });
    return { status: "denied", reason: policy.reason };
  }
  if (policy.decision === "REVIEW") {
    await setTaskState(data.taskId, "awaiting_approval");
    return { status: "awaiting_approval", reason: policy.reason };
  }

  const margin = evaluateMargin(data);
  if (margin.decision === "REVIEW") {
    await setTaskState(data.taskId, "awaiting_economic_review");
    return { status: "awaiting_economic_review", reason: margin.reason };
  }
  if (margin.decision === "REPLAN") {
    await setTaskState(data.taskId, "needs_replan");
    return { status: "needs_replan", reason: margin.reason };
  }

  await setTaskState(data.taskId, "running");
  try {
    const result = await executeWithHermes({
      taskId: data.taskId,
      tenantId: data.tenantId,
      action: data.action,
      payload: data.payload,
      grantRef: data.grantRef
    });
    await setTaskState(data.taskId, "completed", { result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setTaskState(data.taskId, "failed", { failure: message });
    throw error;
  }
});

await recoverOrphanedSchedules();
await dispatchQueuedTasks();
setInterval(() => {
  void recoverOrphanedSchedules().then(dispatchQueuedTasks).catch((error) => console.error("dispatcher", error));
}, 2_000).unref();

console.log("AGESOMA worker listening on agesoma.execute");
