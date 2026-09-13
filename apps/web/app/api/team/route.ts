import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson, requireTenantActor } from "../../../lib/security";

const createSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(120),
  roleTitle: z.string().min(2).max(120),
  department: z.string().max(120).optional(),
  responsibilities: z.array(z.string().min(1).max(160)).max(30).default([]),
  skills: z.array(z.string().min(1).max(120)).max(30).default([]),
  weeklyCapacityHours: z.number().int().min(0).max(168).optional()
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

  const members = await tenantSql(tenantId, `
    select id,name,role_title,department,responsibilities,skills,availability,weekly_capacity_hours,created_at,updated_at
    from team_members
    where tenant_id=$1
    order by case availability when 'active' then 0 when 'away' then 1 else 2 end, name asc
  `, [tenantId]);
  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid team member" }, { status: 400 });
  const input = parsed.data;
  const actor = await requireTenantActor(req, input.tenantId);
  if (actor.error) return actor.error;
  if (actor.role !== "owner" && actor.role !== "admin") {
    return NextResponse.json({ error: "Only owner or admin can change the team" }, { status: 403 });
  }

  const [member] = await tenantSql(input.tenantId, `
    insert into team_members (
      tenant_id,name,role_title,department,responsibilities,skills,weekly_capacity_hours
    ) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)
    on conflict (tenant_id, (lower(name))) do update set
      role_title=excluded.role_title,
      department=excluded.department,
      responsibilities=excluded.responsibilities,
      skills=excluded.skills,
      weekly_capacity_hours=excluded.weekly_capacity_hours,
      availability='active',
      updated_at=now()
    returning id,name,role_title,department,responsibilities,skills,availability,weekly_capacity_hours
  `, [
    input.tenantId,
    input.name,
    input.roleTitle,
    input.department ?? null,
    JSON.stringify(input.responsibilities),
    JSON.stringify(input.skills),
    input.weeklyCapacityHours ?? null
  ]);

  return NextResponse.json(member, { status: 201 });
}
