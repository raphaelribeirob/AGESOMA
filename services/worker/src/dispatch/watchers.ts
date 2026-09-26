import { sql } from "@agesoma/db";
import type { DueWatcher } from "../types";

type ProactivityPreference = {
  enabled: boolean;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  max_interruptions_per_day: number;
  allowed_kinds: unknown;
  local_time: string;
};

function cadenceMs(cadence: string | null) {
  if (cadence === "15m") return 15 * 60_000;
  if (cadence === "1h") return 60 * 60_000;
  if (cadence === "1d") return 24 * 60 * 60_000;
  if (cadence === "7d") return 7 * 24 * 60 * 60_000;
  return 6 * 60 * 60_000;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function inQuietHours(localTime: string, start: string | null, end: string | null) {
  if (!start || !end) return false;
  const current = localTime.slice(0, 5);
  const from = start.slice(0, 5);
  const to = end.slice(0, 5);
  if (from === to) return true;
  return from < to
    ? current >= from && current < to
    : current >= from || current < to;
}

async function preferencesForTenant(tenantId: string) {
  const [preferences] = await sql<ProactivityPreference>(`
    select
      enabled,
      timezone,
      quiet_hours_start::text,
      quiet_hours_end::text,
      max_interruptions_per_day,
      allowed_kinds,
      (now() at time zone timezone)::time::text as local_time
    from proactivity_preferences
    where tenant_id=$1
    limit 1
  `, [tenantId]);
  return preferences ?? null;
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
    returning w.id, w.tenant_id, w.goal_id, w.cadence, w.config,
      w.connected_service_id, w.interrupt_policy
  `);

  for (const watcher of watchers) {
    let objective = typeof watcher.config.objective === "string"
      ? watcher.config.objective
      : "Observe mudanças relevantes e traga apenas o que exigir atenção.";

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

    const preferences = await preferencesForTenant(watcher.tenant_id);
    const nextCheckAt = new Date(Date.now() + cadenceMs(watcher.cadence));

    if (!preferences?.enabled) {
      await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [
        watcher.id,
        watcher.tenant_id,
        nextCheckAt
      ]);
      continue;
    }

    const proactivityKind = typeof watcher.config.proactivityKind === "string"
      ? watcher.config.proactivityKind
      : "general";
    const allowedKinds = stringList(preferences.allowed_kinds);
    if (!allowedKinds.includes(proactivityKind)) {
      await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [
        watcher.id,
        watcher.tenant_id,
        nextCheckAt
      ]);
      continue;
    }

    if (watcher.connected_service_id) {
      const [service] = await sql<{ status: string }>(`
        select status from connected_services
        where id=$1 and tenant_id=$2
        limit 1
      `, [watcher.connected_service_id, watcher.tenant_id]);
      if (!service || service.status !== "active") {
        await sql(`update watchers set status='paused', updated_at=now() where id=$1 and tenant_id=$2`, [
          watcher.id,
          watcher.tenant_id
        ]);
        continue;
      }
    }

    const active = await sql<{ id: string }>(`
      select id from tasks
      where tenant_id=$1 and status in ('queued','running') and payload->>'watcherId'=$2
      limit 1
    `, [watcher.tenant_id, watcher.id]);

    if (active[0]) {
      await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [
        watcher.id,
        watcher.tenant_id,
        nextCheckAt
      ]);
      continue;
    }

    const quiet = inQuietHours(
      preferences.local_time,
      preferences.quiet_hours_start,
      preferences.quiet_hours_end
    );

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
      connectedServiceId: watcher.connected_service_id,
      interruptPolicy: watcher.interrupt_policy,
      proactivityKind,
      suppressInterruptions: quiet || watcher.interrupt_policy === "silent",
      maxInterruptionsPerDay: preferences.max_interruptions_per_day,
      timezone: preferences.timezone,
      outputContract: {
        opportunities: "Return evidence-backed opportunities only when they are materially useful.",
        attention: "Return attention with novelty, importance and urgency from 0 to 1, requiresUser boolean, concise reason and summary. Do not inflate scores to force a notification.",
        artifact: "Return a useful result artifact even when no interruption is warranted.",
        toolRecipe: "Propose reusable reversible tool sequences as draft recipes only."
      }
    })]);

    await sql(`update watchers set next_check_at=$3, updated_at=now() where id=$1 and tenant_id=$2`, [
      watcher.id,
      watcher.tenant_id,
      nextCheckAt
    ]);
  }
}
