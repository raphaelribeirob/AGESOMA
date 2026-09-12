import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCapabilityScope } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  taskId: z.string().uuid(),
  decision: z.enum(["allow", "block"])
});

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid autonomy request" }, { status: 400 });
  const input = parsed.data;
  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error || !actor.actorId) return actor.error!;

  const [task] = await tenantSql<{
    id: string;
    status: string;
    action_type: string;
    payload: Record<string, unknown>;
  }>(input.tenantId, `select id, status, action_type, payload from tasks where id=$1 and tenant_id=$2 limit 1`, [input.taskId, input.tenantId]);

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 409 });
  }

  const scope = buildCapabilityScope({ taskId: task.id, action: task.action_type, payload: task.payload });
  const ruleDecision = input.decision === "allow" ? "ALLOW" : "DENY";
  const [rule] = await tenantSql<{ id: string }>(input.tenantId, `
    insert into autonomy_rules (
      tenant_id, action_class, destination, operation, resource_pattern,
      decision, max_amount_cents, approved_by
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)
    returning id
  `, [input.tenantId, task.action_type, scope.destination, scope.operation, scope.resource, ruleDecision, scope.amountCents, actor.actorId]);

  if (input.decision === "allow") {
    await tenantSql(input.tenantId, `update tasks set status='queued', dispatched_at=null, updated_at=now() where id=$1 and tenant_id=$2`, [task.id, input.tenantId]);
    return NextResponse.json({ ruleId: rule.id, taskStatus: "queued" }, { status: 201 });
  }

  await tenantSql(input.tenantId, `update tasks set status='denied', failure_reason='Owner blocked this action', updated_at=now() where id=$1 and tenant_id=$2`, [task.id, input.tenantId]);
  return NextResponse.json({ ruleId: rule.id, taskStatus: "denied" }, { status: 201 });
}
