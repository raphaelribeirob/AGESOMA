import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireTenantActor } from "../../../lib/security";

const querySchema = z.object({ tenantId: z.string().uuid() });

export async function GET(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ tenantId: url.searchParams.get("tenantId") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });
  const { tenantId } = parsed.data;
  const actor = await requireTenantActor(req, tenantId);
  if (actor.error) return actor.error;

  const [opportunities, tasks, artifacts, approvals] = await Promise.all([
    tenantSql(tenantId, `select id, title, summary, confidence, created_at from opportunities where tenant_id=$1 and status='open' order by created_at desc limit 8`, [tenantId]),
    tenantSql(tenantId, `select id, status, action_type, payload, created_at, updated_at from tasks where tenant_id=$1 and status in ('queued','running','failed') order by updated_at desc limit 8`, [tenantId]),
    tenantSql(tenantId, `select id, task_id, kind, title, content, evidence, created_at from artifacts where tenant_id=$1 order by created_at desc limit 8`, [tenantId]),
    tenantSql(tenantId, `select id, action_type, payload, created_at from tasks where tenant_id=$1 and status='awaiting_approval' order by created_at desc limit 8`, [tenantId])
  ]);

  return NextResponse.json({ opportunities, tasks, artifacts, approvals, needsOwner: approvals.length > 0 });
}
