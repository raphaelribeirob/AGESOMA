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

  const baseUrl = process.env.HERMES_BASE_URL?.replace(/\/$/, "");
  const token = process.env.HERMES_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    checks.hermes = { ok: false, detail: "not configured" };
  } else {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
        cache: "no-store"
      });
      checks.hermes = { ok: response.ok };
    } catch {
      checks.hermes = { ok: false, detail: "unreachable" };
    }
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return NextResponse.json({ ok, service: "agesoma-web", checks }, { status: ok ? 200 : 503 });
}
