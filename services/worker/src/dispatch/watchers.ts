import { sql } from "@agesoma/db";
import type { DueWatcher } from "../types";

function cadenceMs(cadence: string | null) {
  if (cadence === "15m") return 15 * 60_000;
  if (cadence === "1h") return 60 * 60_000;
  if (cadence === "1d") return 24 * 60 * 60_000;
  if (cadence === "7d") return 7 * 24 * 60 * 60_000;
  return 6 * 60 * 60_000;
}

export async function dispatchDueWatchers() {
  const watchers = await sql<DueWatcher>(`
    with due as (
      select id
      from watchers
      where status='active' and coalesce(next_check_at, now()) <= now()
      order by coalesce(next_check_at, created_at) asc
      for update skip locked
      limit 20
    )
    update watchers w
      set next_check_at=now() + interval '5 minutes', updated_at=now()
    from due
    where w.id=due.id
    returning w.id, w.tenant_id, w.goal_id, w.cadence, w.config
  `);

  for (const watcher of watchers) {
    let objective = typeof watcher.config.objective === "string"
      ? watcher.config.objective
      : "Observe o negócio e encontre mudanças relevantes.";

    if (watcher.goal_id) {
      const [goal] = await sql<{ title: string; status: string }>(`
        select title, status from goals where id=$1 and tenant_id=$2 limit 1
      `, [watcher.goal_id, watcher.tenant_id]);

      if (!goal || goal.status !== "active") {
        await sql(`update watchers set status='paused', updated_at=now() where id=$1 and tenant_id=$2`, [watcher.id, watcher.tenant_id]);
        continue;
      }
      objective = goal.title;
    }

    const active = await sql<{ id: string }>(`
      select id from tasks
      where tenant_id=$1 and status in ('queued','running') and payload->>'watcherId'=$2
      limit 1
    `, [watcher.tenant_id, watcher.id]);

    const nextCheckAt = new Date(Date.now() + cadenceMs(watcher.cadence));
    if (active[0]) {
      await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [watcher.id, watcher.tenant_id, nextCheckAt]);
      continue;
    }

    await sql(`
      insert into tasks (
        tenant_id, status, action_type, risk_class, reversible, external,
        expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
      ) values ($1,'queued','business.observe','R0',true,true,0,0,0,0,$2::jsonb)
    `, [watcher.tenant_id, JSON.stringify({
      objective,
      operation: "discover",
      destination: null,
      resource: typeof watcher.config.resource === "string" ? watcher.config.resource : null,
      watcherId: watcher.id,
      goalId: watcher.goal_id,
      outputContract: {
        opportunities: "Return evidence-backed opportunities when any exist.",
        artifact: "Return a useful result artifact.",
        toolRecipe: "Propose reusable reversible tool sequences as draft recipes only."
      }
    })]);

    await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [watcher.id, watcher.tenant_id, nextCheckAt]);
  }
}
