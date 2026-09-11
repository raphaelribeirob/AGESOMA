import { NextResponse } from "next/server";
import { sql } from "@agesoma/db";
import { requireInternalApi } from "../../../lib/security";

export async function GET(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;

  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  try {
    const [row] = await sql<{ tasks: string | null }>("select to_regclass('agesoma_p0.tasks')::text as tasks");
    checks.database = { ok: row?.tasks === "agesoma_p0.tasks" };
  } catch {
    checks.database = { ok: false, detail: "database unavailable" };
  }

  try {
    const [heartbeat] = await sql<{ last_seen_at: Date | string; hermes_configured: boolean }>(`
      select last_seen_at, coalesce((metadata->>'hermesConfigured')::boolean, false) as hermes_configured
      from runtime_heartbeats
      where service='agesoma-worker'
      limit 1
    `);

    const lastSeen = heartbeat ? new Date(heartbeat.last_seen_at).getTime() : 0;
    const fresh = lastSeen > 0 && Date.now() - lastSeen <= 90_000;
    checks.worker = {
      ok: Boolean(heartbeat && fresh && heartbeat.hermes_configured),
      detail: heartbeat ? (fresh ? "active" : "stale") : "not seen"
    };
  } catch {
    checks.worker = { ok: false, detail: "heartbeat unavailable" };
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return NextResponse.json({ ok, service: "agesoma-web", checks }, { status: ok ? 200 : 503 });
}
