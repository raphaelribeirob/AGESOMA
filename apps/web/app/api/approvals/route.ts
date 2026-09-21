import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCapabilityScope, getActionPolicy, serializeCapabilityScope } from "@agesoma/core";
import {
  createApprovalGrant,
  findTaskForApproval,
  listPendingApprovalTasks,
  setTaskQueued,
  type StoredTask
} from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  taskId: z.string().uuid()
});

function canApprove(role: string | undefined) {
  return role === "owner" || role === "admin";
}

function canonicalScope(task: StoredTask) {
  const scope = buildCapabilityScope({
    taskId: task.id,
    action: task.action_type,
    payload: task.payload
  });
  const policy = getActionPolicy(task.action_type);

  if (!policy) return { error: "Unknown action", scope: null, policy: null } as const;

  if (policy.riskClass === "R2" || policy.riskClass === "R3") {
    if (!scope.destination || !scope.operation || !scope.resource) {
      return {
        error: "Consequential action is not fully resolved",
        scope: null,
        policy
      } as const;
    }

    if (policy.riskClass === "R3" && scope.amountCents === null) {
      return {
        error: "Commit action is missing an explicit amount",
        scope: null,
        policy
      } as const;
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

  const tasks = await listPendingApprovalTasks(tenantId);
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
      summary: typeof task.payload.proposedSummary === "string"
        ? task.payload.proposedSummary
        : task.payload.objective,
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid approval request" }, { status: 400 });
  }

  const input = parsed.data;
  const actor = await requireTenantActor(req, input.tenantId);

  if (actor.error || !actor.actorId) return actor.error!;
  if (!canApprove(actor.role)) {
    return NextResponse.json({ error: "Owner or admin approval is required" }, { status: 403 });
  }

  const task = await findTaskForApproval(input.tenantId, input.taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 409 });
  }

  const resolved = canonicalScope(task);
  if (resolved.error || !resolved.scope) {
    return NextResponse.json(
      { error: resolved.error ?? "Approval scope is invalid" },
      { status: 409 }
    );
  }

  const serializedScope = serializeCapabilityScope(resolved.scope);
  const scopeHash = createHash("sha256").update(serializedScope).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const nonce = randomUUID();

  const grant = await createApprovalGrant({
    tenantId: input.tenantId,
    taskId: input.taskId,
    actionClass: task.action_type,
    scope: serializedScope,
    scopeHash,
    approvedBy: actor.actorId,
    nonce,
    expiresAt
  });

  await setTaskQueued(input.tenantId, input.taskId);

  return NextResponse.json({
    grantId: grant.id,
    taskStatus: "queued",
    expiresAt,
    scope: resolved.scope
  }, { status: 201 });
}
