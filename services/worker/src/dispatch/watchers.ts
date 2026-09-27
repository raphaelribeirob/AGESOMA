import { sql } from "@agesoma/db";
import type { DueWatcher } from "../types";
import { evaluateRoutine, queueRoutineObservation } from "./routine-runtime";

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
      where status='active'
        and trigger_kind='cadence'
        and coalesce(next_check_at,now()) <= now()
      order by coalesce(next_check_at,created_at) asc
      for update skip locked
      limit 20
    )
    update watchers w
      set next_check_at=now() + interval '5 minutes',updated_at=now()
    from due
    where w.id=due.id
    returning w.id,w.tenant_id,w.goal_id,w.cadence,w.config,
      w.connected_service_id,w.worker_id,w.trigger_kind,w.trigger_config,
      w.interrupt_policy
  `);

  for (const watcher of watchers) {
    const nextCheckAt = new Date(Date.now()+cadenceMs(watcher.cadence));
    const eligibility = await evaluateRoutine(watcher);

    if (!eligibility.ready) {
      await sql(`
        update watchers set next_check_at=$3,updated_at=now()
        where id=$1 and tenant_id=$2 and status='active'
      `, [watcher.id,watcher.tenant_id,nextCheckAt]);
      continue;
    }

    await queueRoutineObservation({watcher,eligibility,event:null});

    await sql(`
      update watchers
      set next_check_at=$3,last_checked_at=now(),updated_at=now()
      where id=$1 and tenant_id=$2
    `, [watcher.id,watcher.tenant_id,nextCheckAt]);
  }
}
