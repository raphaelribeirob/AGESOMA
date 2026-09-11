import { NextResponse } from "next/server";
import { sql } from "@agesoma/db";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  try {
    const [row] = await sql<{ tasks: string | null }>("select to_regclass('agesoma_p0.tasks')::text as tasks");
    checks.database = { ok: row?.tasks === 'agesoma_p0.tasks', detail: row?.tasks ?? 'schema missing' };
  } catch (error) {
    checks.database = { ok: false, detail: error instanceof Error ? error.message : 'database error' };
  }

  const baseUrl = process.env.HERMES_BASE_URL?.replace(/\/$/, '');
  const token = process.env.HERMES_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    checks.hermes = { ok: false, detail: 'not configured' };
  } else {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
        cache: 'no-store'
      });
      checks.hermes = { ok: response.ok, detail: `HTTP ${response.status}` };
    } catch (error) {
      checks.hermes = { ok: false, detail: error instanceof Error ? error.message : 'unreachable' };
    }
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return NextResponse.json({ ok, service: 'agesoma-web', checks }, { status: ok ? 200 : 503 });
}
