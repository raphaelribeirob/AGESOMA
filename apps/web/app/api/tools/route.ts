import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const actionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve","disable"])
});

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const tools = await tenantSql(authenticated.tenantId,`
    select
      id,name,description,status,tool_kind,source_url,spec_url,base_url,
      risk_class,auth_mode,validation,permissions,approved_by,approved_at,last_tested_at,
      created_at,updated_at
    from tool_recipes
    where tenant_id=$1
    order by
      case status when 'validated' then 0 when 'approved' then 1 when 'draft' then 2 else 3 end,
      updated_at desc
    limit 100
  `,[authenticated.tenantId]);

  return NextResponse.json({ tools });
}

export async function PATCH(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });

  if (parsed.data.action === "approve") {
    const [tool] = await tenantSql<{
      id: string;
      name: string;
      description: string;
      status: string;
      risk_class: string;
      auth_mode: string;
      validation: unknown;
      permissions: unknown;
      approved_at: string | null;
    }>(authenticated.tenantId,`
      update tool_recipes
      set status='approved',approved_by=$3,approved_at=now(),updated_at=now()
      where tenant_id=$1
        and id=$2
        and status='validated'
        and tool_kind='openapi_readonly'
        and risk_class='R0'
        and auth_mode='none'
        and validation->>'contractValid'='true'
        and validation->>'readOnly'='true'
        and permissions->>'read'='true'
        and coalesce(permissions->>'write','false')='false'
      returning id,name,description,status,risk_class,auth_mode,validation,permissions,approved_at
    `,[authenticated.tenantId,parsed.data.id,authenticated.actorId]);

    if (!tool) {
      return NextResponse.json({
        error: "Somente ferramentas read-only validadas e sem autenticação podem ser aprovadas automaticamente."
      },{ status: 409 });
    }

    await tenantSql(authenticated.tenantId,`
      insert into activity_events (tenant_id,event_type,title,summary,status,metadata)
      values ($1,'system','Ferramenta aprovada',$2,'success',$3::jsonb)
    `,[
      authenticated.tenantId,
      tool.name,
      JSON.stringify({ toolId: tool.id, approvedBy: authenticated.actorId })
    ]);

    return NextResponse.json(tool);
  }

  const [tool] = await tenantSql<{ id: string; name: string; status: string }>(authenticated.tenantId,`
    update tool_recipes
    set status='disabled',updated_at=now()
    where tenant_id=$1 and id=$2 and status <> 'disabled'
    returning id,name,status
  `,[authenticated.tenantId,parsed.data.id]);

  if (!tool) return NextResponse.json({ error: "Ferramenta não encontrada." },{ status: 404 });

  await tenantSql(authenticated.tenantId,`
    insert into activity_events (tenant_id,event_type,title,summary,status,metadata)
    values ($1,'system','Ferramenta desativada',$2,'info',$3::jsonb)
  `,[
    authenticated.tenantId,
    tool.name,
    JSON.stringify({ toolId: tool.id, disabledBy: authenticated.actorId })
  ]);

  return NextResponse.json(tool);
}
