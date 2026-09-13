import { NextResponse } from "next/server";
import { z } from "zod";
import { decideExecutor, getActionPolicy, routeBusinessRequest, type TeamMemberForCoordination } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  request: z.string().min(3).max(4000)
});

type TeamRow = {
  id: string;
  name: string;
  role_title: string;
  department: string | null;
  responsibilities: unknown;
  skills: unknown;
  availability: string;
};

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid coordination request" }, { status: 400 });
  const input = parsed.data;

  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error) return actor.error;

  const plan = routeBusinessRequest(input.request);
  const rows = await tenantSql<TeamRow>(input.tenantId, `
    select id,name,role_title,department,responsibilities,skills,availability
    from team_members
    where tenant_id=$1 and availability='active'
    order by name asc
  `, [input.tenantId]);

  const team: TeamMemberForCoordination[] = rows.map((member) => ({
    id: member.id,
    name: member.name,
    roleTitle: member.role_title,
    department: member.department,
    responsibilities: list(member.responsibilities),
    skills: list(member.skills),
    availability: member.availability
  }));
  const decision = decideExecutor(plan, team);

  const action = decision.executorType === "hermes" && plan.requiresApproval ? "business.work" : plan.action;
  const policy = getActionPolicy(action);
  if (!policy) return NextResponse.json({ error: "Unsupported work" }, { status: 400 });

  const [workflow] = await tenantSql<{ id: string }>(input.tenantId, `
    insert into workflows (tenant_id,key,version,status,config)
    values ($1,$2,1,'active',$3::jsonb)
    returning id
  `, [input.tenantId, `coord-${Date.now()}`, JSON.stringify({ source: "agesoma_coordination", plan })]);

  const payload = JSON.stringify({
    objective: plan.originalRequest,
    requestedAction: plan.action,
    coordination: decision,
    requestedBy: actor.actorId,
    ownerRequested: true
  });

  const [task] = await tenantSql<{ id: string; status: string }>(input.tenantId, `
    insert into tasks (
      tenant_id,workflow_id,status,action_type,risk_class,reversible,external,payload,dispatched_at
    ) values ($1,$2,'queued',$3,$4,$5,$6,$7::jsonb,$8)
    returning id,status
  `, [
    input.tenantId,
    workflow.id,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    payload,
    decision.executorType === "human" ? new Date() : null
  ]);

  await tenantSql(input.tenantId, `
    insert into work_assignments (tenant_id,task_id,executor_type,team_member_id,status,reason,assigned_by)
    values ($1,$2,$3,$4,'assigned',$5,$6)
  `, [input.tenantId, task.id, decision.executorType, decision.teamMemberId, decision.reason, actor.actorId]);

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
    responsible: decision.executorType === "human" ? decision.teamMemberName : "AGESOMA",
    type: decision.executorType,
    plan
  }, { status: 201 });
}
