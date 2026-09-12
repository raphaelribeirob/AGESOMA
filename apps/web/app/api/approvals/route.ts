import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCapabilityScope, serializeCapabilityScope } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  taskId: z.string().uuid()
});

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid approval request" }, { status: 400 });
  const input = parsed.data;
  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error || !actor.actorId) return actor.error!;

  const [task] = await tenantSql<{
    id: string;
    status: string;
    tenant_id: string;
    action_type: string;
    payload: Record<string, unknown>;
  }>(input.tenantId, `select id, status, tenant_id, action_type, payload from tasks where id=$1 and tenant_id=$2 limit 1`, [input.taskId, input.tenantId]);

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 409 });
  }

  const scope = buildCapabilityScope({ taskId: task.id, action: task.action_type, payload: task.payload });
  const serializedScope = serializeCapabilityScope(scope);
  const scopeHash = createHash("sha256").update(serializedScope).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const nonce = randomUUID();

  const [grant] = await tenantSql<{ id: string }>(input.tenantId, `
    insert into approval_grants (
      tenant_id, task_id, action_class, scope, scope_hash, approved_by, nonce, expires_at
    ) values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)
    returning id
  `, [input.tenantId, input.taskId, task.action_type, serializedScope, scopeHash, actor.actorId, nonce, expiresAt]);

  await tenantSql(input.tenantId, `update tasks set status='queued', dispatched_at=null, updated_at=now() where id=$1 and tenant_id=$2`, [input.taskId, input.tenantId]);
  return NextResponse.json({ grantId: grant.id, taskStatus: "queued", expiresAt }, { status: 201 });
}
