import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const createSchema = z.object({
  title: z.string().min(2).max(240),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low","normal","high"]).default("normal"),
  dueAt: z.string().datetime().optional()
});

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(240).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["low","normal","high"]).optional(),
  progress: z.number().min(0).max(1).optional(),
  status: z.enum(["active","completed","paused"]).optional(),
  dueAt: z.string().datetime().nullable().optional()
});

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const goals = await tenantSql(authenticated.tenantId, `
    select id,title,description,status,priority,progress,due_at,source,created_at,updated_at
    from goals
    where tenant_id=$1 and archived_at is null
    order by case priority when 'high' then 0 when 'normal' then 1 else 2 end,
      case status when 'active' then 0 when 'paused' then 1 else 2 end,
      updated_at desc
  `, [authenticated.tenantId]);

  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Meta inválida." }, { status: 400 });

  const input = parsed.data;
  const [goal] = await tenantSql(authenticated.tenantId, `
    insert into goals (tenant_id,title,description,status,priority,progress,due_at,source,config)
    values ($1,$2,$3,'active',$4,0,$5,'user','{}'::jsonb)
    returning id,title,description,status,priority,progress,due_at,source,created_at,updated_at
  `, [authenticated.tenantId,input.title.trim(),input.description?.trim() || null,input.priority,input.dueAt ? new Date(input.dueAt) : null]);

  await tenantSql(authenticated.tenantId, `
    insert into activity_events (tenant_id,goal_id,event_type,title,summary,status,metadata)
    values ($1,$2,'goal','Meta criada',$3,'info',$4::jsonb)
  `, [authenticated.tenantId,goal.id,input.title.trim(),JSON.stringify({ requestedBy: authenticated.actorId })]);

  return NextResponse.json(goal,{ status: 201 });
}

export async function PATCH(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });
  const input = parsed.data;

  const [goal] = await tenantSql(authenticated.tenantId, `
    update goals set
      title=coalesce($3,title),
      description=case when $4::boolean then $5 else description end,
      priority=coalesce($6,priority),
      progress=coalesce($7,progress),
      status=coalesce($8,status),
      due_at=case when $9::boolean then $10 else due_at end,
      updated_at=now()
    where tenant_id=$1 and id=$2 and archived_at is null
    returning id,title,description,status,priority,progress,due_at,source,created_at,updated_at
  `, [
    authenticated.tenantId,input.id,input.title?.trim() ?? null,
    Object.prototype.hasOwnProperty.call(input,"description"),input.description?.trim() || null,
    input.priority ?? null,input.progress ?? null,input.status ?? null,
    Object.prototype.hasOwnProperty.call(input,"dueAt"),input.dueAt ? new Date(input.dueAt) : null
  ]);

  if (!goal) return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });
  return NextResponse.json(goal);
}

export async function DELETE(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  const id=new URL(req.url).searchParams.get("id");
  if(!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({error:"Meta inválida."},{status:400});

  const [goal]=await tenantSql(authenticated.tenantId,`
    update goals set archived_at=now(),updated_at=now()
    where tenant_id=$1 and id=$2 and archived_at is null
    returning id
  `,[authenticated.tenantId,id]);
  if(!goal) return NextResponse.json({error:"Meta não encontrada."},{status:404});
  return NextResponse.json({archived:true});
}
