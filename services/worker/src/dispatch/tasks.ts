import type { PgBoss } from "pg-boss";
import { sql } from "@agesoma/db";
import type { QueuedTask } from "../types";

export async function dispatchQueuedTasks(boss: PgBoss) {
  const tasks = await sql<QueuedTask>(`
    select id, tenant_id, workflow_id, worker_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    from tasks
    where status='queued' and action_type is not null and dispatched_at is null
    order by created_at asc
    limit 25
  `);

  const workerIds = [...new Set(tasks.map((task) => task.worker_id).filter((id): id is string => Boolean(id)))];
  const workerCapacity = new Map<string, { limit: number; inflight: number }>();

  if (workerIds.length) {
    const capacities = await sql<{ id: string; max_parallel_jobs: string | number; inflight: string | number }>(`
      select
        pw.id,
        pw.max_parallel_jobs,
        count(t.id) filter (
          where t.status='running'
             or (t.status='queued' and t.dispatched_at is not null)
        ) as inflight
      from persistent_workers pw
      left join tasks t
        on t.worker_id=pw.id and t.tenant_id=pw.tenant_id
      where pw.id = any($1::uuid[]) and pw.status='active'
      group by pw.id,pw.max_parallel_jobs
    `, [workerIds]);

    for (const row of capacities) {
      workerCapacity.set(row.id, {
        limit: Math.max(1, Number(row.max_parallel_jobs) || 1),
        inflight: Math.max(0, Number(row.inflight) || 0)
      });
    }
  }

  for (const task of tasks) {
    const capacity = task.worker_id ? workerCapacity.get(task.worker_id) : null;
    if (task.worker_id && !capacity) continue;
    if (capacity && capacity.inflight >= capacity.limit) continue;

    const jobId = await boss.send("agesoma.execute", {
      taskId: task.id,
      tenantId: task.tenant_id
    }, { singletonKey: task.id, retryLimit: 3, retryDelay: 5 });

    if (jobId) {
      const updated = await sql<{ id: string }>(
        `update tasks set dispatched_at=now(), updated_at=now()
         where id=$1 and tenant_id=$2 and status='queued' and dispatched_at is null
         returning id`,
        [task.id, task.tenant_id]
      );
      if (updated[0] && capacity) capacity.inflight += 1;
    }
  }
}
