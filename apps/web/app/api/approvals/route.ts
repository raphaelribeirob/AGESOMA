import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCapabilityScope, getActionPolicy, serializeCapabilityScope } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  taskId: z.string().uuid()
});

type ApprovalTask = {
  id: string;
  status: string;
  tenant_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  created_at?: string;
};

function canApprove(role: string | undefined) {
  return role === "owner" || role === "admin";
}

function canonicalScope(task: ApprovalTask) {
  const scope = buildCapabilityScope({ taskId: task.id, action: task.action_type, payload: task.payload });
  const policy = getActionPolicy(task.action_type);
  if (!policy) return { error: "Unknown action", scope: null, policy: null } as const;
  if (policy.riskClass === "R2" || policy.riskClass === "R3") {
    if (!scope.destination || !scope.operation || !scope.resource) {
      return { error: "Consequential action is not fully resolved", scope: null, policy } as const;
    }
    if (policy.riskClass === "R3" && scope.amountCents === null) {
      return { error: "Commit action is missing an explicit amount", scope: null, policy } as const;
    }
  }
  return { error: null, scope, policy } as const;
}

export async function GET(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") ?? "";
  if (!z.string().uuid().safeParse(tenantId).success) {
    return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });
  }

  const actor = await requireTenantActor(req, tenantId);
  if (actor.error) return actor.error;

  const tasks = await tenantSql<ApprovalTask>(tenantId, `
    select id, status, tenant_id, action_type, payload, created_at
    from tasks
    where tenant_id=$1 and status='awaiting_approval'
    order by created_at asc
    limit 50
  `, [tenantId]);

  const approvals = tasks.flatMap((task) => {
    const resolved = canonicalScope(task);
    if (resolved.error || !resolved.scope || !resolved.policy) return [];
    return [{
      taskId: task.id,
      action: task.action_type,
      riskClass: resolved.policy.riskClass,
      destination: resolved.scope.destination,
      operation: resolved.scope.operation,
      resource: resolved.scope.resource,
      amountCents: resolved.scope.amountCents,
      parameters: task.payload.parameters ?? {},
      summary: typeof task.payload.proposedSummary === "string" ? task.payload.proposedSummary : task.payload.objective,
      evidence: task.payload.resolutionEvidence ?? {},
      createdAt: task.created_at ?? null,
      approvableByCurrentActor: canApprove(actor.role)
    }];
  });

  return NextResponse.json({ approvals });
}

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
  if (!canApprove(actor.role)) return NextResponse.json({ error: "Owner or admin approval is required" }, { status: 403 });

  const [task] = await tenantSql<ApprovalTask>(input.tenantId, `
    select id, status, tenant_id, action_type, payload
    from tasks where id=$1 and tenant_id=$2 limit 1
  `, [input.taskId, input.tenantId]);

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 409 });
  }

  const resolved = canonicalScope(task);
  if (resolved.error || !resolved.scope) {
    return NextResponse.json({ error: resolved.error ?? "Approval scope is invalid" }, { status: 409 });
  }

  const serializedScope = serializeCapabilityScope(resolved.scope);
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
  return NextResponse.json({ grantId: grant.id, taskStatus: "queued", expiresAt, scope: resolved.scope }, { status: 201 });
}
