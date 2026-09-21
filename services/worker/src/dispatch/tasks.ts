import type { PgBoss } from "pg-boss";
import { sql } from "@agesoma/db";
import type { QueuedTask } from "../types";

export async function dispatchQueuedTasks(boss: PgBoss) {
  const tasks = await sql<QueuedTask>(`
    select id, tenant_id, workflow_id, action_type, risk_class, reversible, external,
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
      await sql(
        `update tasks set dispatched_at=now(), updated_at=now()
         where id=$1 and tenant_id=$2 and status='queued'`,
        [task.id, task.tenant_id]
      );
    }
  }
}
