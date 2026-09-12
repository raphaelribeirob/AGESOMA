import { NextResponse } from "next/server";
import { z } from "zod";
import { getActionPolicy, routeBusinessRequest } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

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
  watcher_id: string | null;
};

type BusinessMemory = {
  lesson_type: string;
  content: Record<string, unknown>;
  created_at: string;
};

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid business request" }, { status: 400 });
  const input = parsed.data;

  const [tenant] = await tenantSql<{ id: string }>(input.tenantId, `select id from tenants where id=$1 limit 1`, [input.tenantId]);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error) return actor.error;

  let plan;
  try {
    plan = routeBusinessRequest(input.request);
  } catch {
    return NextResponse.json({ error: "Unable to route business request" }, { status: 400 });
  }

  const intendedPolicy = getActionPolicy(plan.action);
  if (!intendedPolicy) return NextResponse.json({ error: "Planner produced an unsupported action" }, { status: 500 });

  // Consequential work is never approved while destination/parameters are unresolved.
  // First run a reversible resolution task. Hermes may inspect authorized context and
  // return one canonical proposedAction. Only that concrete capability can be approved.
  const executionAction = plan.requiresApproval ? "business.work" : plan.action;
  const executionPolicy = getActionPolicy(executionAction);
  if (!executionPolicy) return NextResponse.json({ error: "Resolution action is unsupported" }, { status: 500 });

  const memories = await tenantSql<BusinessMemory>(input.tenantId, `
    select lesson_type, content, created_at
    from learning_records
    where tenant_id=$1
    order by created_at desc
    limit 8
  `, [input.tenantId]);

  const businessMemory = memories.map((memory) => ({
    type: memory.lesson_type,
    content: memory.content,
    createdAt: memory.created_at
  }));

  const taskStatus = "queued";
  const planJson = JSON.stringify(plan);
  const payload = JSON.stringify({
    objective: plan.originalRequest,
    destination: null,
    operation: plan.requiresApproval ? "resolve_capability" : plan.operation,
    resource: plan.resource,
    requestPlan: plan,
    requestedAction: plan.action,
    requiresResolution: plan.requiresApproval,
    businessMemory,
    requestedBy: actor.actorId,
    ownerRequested: true,
    outputContract: {
      artifact: "Return a result artifact suited to the business job.",
      opportunities: "Return evidence-backed opportunities only when discovered.",
      proposedAction: plan.requiresApproval
        ? "Resolve exactly one concrete consequential action. Return action, destination, operation, resource, parameters and amountCents when relevant. Do not execute the side effect."
        : "Do not invent a consequential action unless the objective actually requires one.",
      outcome: "Outcome claims are unverified until a separate provider-backed verifier confirms them.",
      toolRecipe: "Reusable reversible tool sequences may be proposed as draft recipes only."
    }
  });

  const [created] = await tenantSql<CreatedRequest>(input.tenantId, `
    with new_goal as (
      insert into goals (tenant_id, title, status, objective_key, target_value_cents, horizon_days, config)
      values ($1,$2,'active',$3,$4,$5,$6::jsonb)
      returning id
    ), new_watcher as (
      insert into watchers (tenant_id, goal_id, kind, status, cadence, config, next_check_at)
      select $1, id, 'watch', 'active', $19,
        jsonb_build_object('source','natural_request','objective',$2),
        case $19
          when '15m' then now() + interval '15 minutes'
          when '1h' then now() + interval '1 hour'
          when '1d' then now() + interval '1 day'
          when '7d' then now() + interval '7 days'
          else now() + interval '6 hours'
        end
      from new_goal
      where $18::boolean
      returning id
    ), new_workflow as (
      insert into workflows (tenant_id, key, version, status, config)
      select $1, 'request-' || replace(id::text, '-', ''), 1, 'active', jsonb_build_object(
        'source', 'natural_request',
        'plan', $6::jsonb,
        'memory_count', $17::int,
        'intended_action', $20::text,
        'resolution_required', $18::boolean
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
    select g.id as goal_id, w.id as workflow_id, t.id as task_id, t.status as task_status,
      (select id from new_watcher limit 1) as watcher_id
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
    executionPolicy.type,
    executionPolicy.riskClass,
    executionPolicy.reversible,
    executionPolicy.external,
    input.expectedValueCents ?? 0,
    input.expectedCostCents ?? 0,
    input.expectedLossCents ?? 0,
    input.confidence ?? 0,
    payload,
    businessMemory.length,
    plan.watch,
    plan.cadence,
    intendedPolicy.type
  ]);

  return NextResponse.json({
    goalId: created.goal_id,
    workflowId: created.workflow_id,
    taskId: created.task_id,
    taskStatus: created.task_status,
    watcherId: created.watcher_id,
    plan,
    executionAction,
    resolutionRequired: plan.requiresApproval,
    memoryCount: businessMemory.length,
    economics: {
      status: input.expectedValueCents === undefined ? "unknown" : "provided",
      expectedValueCents: input.expectedValueCents ?? null,
      expectedCostCents: input.expectedCostCents ?? null,
      expectedLossCents: input.expectedLossCents ?? null,
      confidence: input.confidence ?? null
    }
  }, { status: 201 });
}
