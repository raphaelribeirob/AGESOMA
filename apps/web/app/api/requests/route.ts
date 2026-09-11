import { NextResponse } from "next/server";
import { z } from "zod";
import { getActionPolicy, routeBusinessRequest } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  request: z.string().min(3).max(4000),
  expectedValueCents: z.number().int().nonnegative().max(1_000_000_000).optional(),
  expectedCostCents: z.number().int().nonnegative().max(100_000_000).optional(),
  expectedLossCents: z.number().int().nonnegative().max(1_000_000_000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  targetValueCents: z.number().int().nonnegative().max(10_000_000_000).optional(),
  horizonDays: z.number().int().positive().max(3650).optional()
});

type CreatedRequest = {
  goal_id: string;
  workflow_id: string;
  task_id: string;
  task_status: string;
};

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid business request" }, { status: 400 });
  const input = parsed.data;

  const [tenant] = await tenantSql<{ id: string }>(
    input.tenantId,
    `select id from tenants where id=$1 limit 1`,
    [input.tenantId]
  );
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let plan;
  try {
    plan = routeBusinessRequest(input.request);
  } catch {
    return NextResponse.json({ error: "Unable to route business request" }, { status: 400 });
  }

  const policy = getActionPolicy(plan.action);
  if (!policy) return NextResponse.json({ error: "Planner produced an unsupported action" }, { status: 500 });

  const taskStatus = plan.requiresApproval ? "awaiting_approval" : "queued";
  const planJson = JSON.stringify(plan);
  const payload = JSON.stringify({
    objective: plan.originalRequest,
    destination: null,
    operation: plan.operation,
    resource: plan.resource,
    requestPlan: plan
  });

  const [created] = await tenantSql<CreatedRequest>(input.tenantId, `
    with new_goal as (
      insert into goals (tenant_id, title, status, objective_key, target_value_cents, horizon_days, config)
      values ($1,$2,'active',$3,$4,$5,$6::jsonb)
      returning id
    ), new_workflow as (
      insert into workflows (tenant_id, key, version, status, config)
      select $1, 'request-' || replace(id::text, '-', ''), 1, 'active', jsonb_build_object(
        'source', 'natural_request',
        'plan', $6::jsonb
      )
      from new_goal
      returning id
    ), new_task as (
      insert into tasks (
        tenant_id, workflow_id, status, action_type, risk_class, reversible, external,
        expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
      )
      select $1, id, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb
      from new_workflow
      returning id, workflow_id, status
    )
    select g.id as goal_id, w.id as workflow_id, t.id as task_id, t.status as task_status
    from new_goal g
    cross join new_workflow w
    cross join new_task t
  `, [
    input.tenantId,
    plan.title,
    plan.domain,
    input.targetValueCents ?? null,
    input.horizonDays ?? null,
    planJson,
    taskStatus,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    input.expectedValueCents ?? 0,
    input.expectedCostCents ?? 0,
    input.expectedLossCents ?? 0,
    input.confidence ?? 0,
    payload
  ]);

  return NextResponse.json({
    goalId: created.goal_id,
    workflowId: created.workflow_id,
    taskId: created.task_id,
    taskStatus: created.task_status,
    plan,
    economics: {
      status: input.expectedValueCents === undefined ? "unknown" : "provided",
      expectedValueCents: input.expectedValueCents ?? null,
      expectedCostCents: input.expectedCostCents ?? null,
      expectedLossCents: input.expectedLossCents ?? null,
      confidence: input.confidence ?? null
    }
  }, { status: 201 });
}
