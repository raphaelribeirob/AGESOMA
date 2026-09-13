import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const patchSchema = z.object({
  tenantId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  status: z.enum(["assigned","in_progress","blocked","completed","cancelled"])
});

export async function GET(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const tenantId = new URL(req.url).searchParams.get("tenantId");
  if (!tenantId || !z.string().uuid().safeParse(tenantId).success) {
    return NextResponse.json({ error: "Valid tenantId is required" }, { status: 400 });
  }
  const actor = await requireTenantActor(req, tenantId);
  if (actor.error) return actor.error;

  const assignments = await tenantSql(tenantId, `
    select a.id,a.task_id,a.executor_type,a.status,a.reason,a.due_at,a.created_at,a.updated_at,
      m.id as team_member_id,m.name as team_member_name,m.role_title,
      t.payload,t.execution_result,t.failure_reason
    from work_assignments a
    join tasks t on t.id=a.task_id and t.tenant_id=a.tenant_id
    left join team_members m on m.id=a.team_member_id and m.tenant_id=a.tenant_id
    where a.tenant_id=$1
    order by case a.status when 'blocked' then 0 when 'in_progress' then 1 when 'assigned' then 2 else 3 end,
      a.updated_at desc
    limit 100
  `, [tenantId]);
  return NextResponse.json({ assignments });
}

export async function PATCH(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assignment update" }, { status: 400 });
  const input = parsed.data;
  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error) return actor.error;

  const [assignment] = await tenantSql(input.tenantId, `
    update work_assignments
    set status=$3,updated_at=now()
    where id=$1 and tenant_id=$2
    returning id,task_id,executor_type,team_member_id,status,reason,updated_at
  `, [input.assignmentId, input.tenantId, input.status]);
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  return NextResponse.json(assignment);
}
