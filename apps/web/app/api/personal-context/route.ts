import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const createSchema = z.object({
  kind: z.string().min(2).max(80),
  value: z.string().min(1).max(4000),
  sourceType: z.enum(["user_onboarding", "user_statement"]).default("user_statement"),
  sourceRef: z.string().max(160).optional(),
  provenance: z.record(z.string(), z.unknown()).default({})
});

const correctSchema = z.object({
  id: z.string().uuid(),
  value: z.string().min(1).max(4000)
});

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const entries = await tenantSql(authenticated.tenantId, `
    select id,subject,kind,value,source_type,source_ref,provenance,confidence,status,
      supersedes_id,created_at,updated_at
    from personal_context_entries
    where tenant_id=$1 and status='active' and deleted_at is null
    order by created_at desc
  `, [authenticated.tenantId]);

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Contexto inválido." }, { status: 400 });
  const input = parsed.data;

  const sourceRef = input.sourceRef ?? null;
  const [entry] = await tenantSql(authenticated.tenantId, `
    with previous as (
      select id
      from personal_context_entries
      where tenant_id=$1
        and status='active'
        and deleted_at is null
        and $5::text is not null
        and source_ref=$5
      for update
    ),
    superseded as (
      update personal_context_entries
      set status='superseded',updated_at=now()
      where tenant_id=$1 and id in (select id from previous)
      returning id
    )
    insert into personal_context_entries (
      tenant_id,subject,kind,value,source_type,source_ref,provenance,confidence,created_by
    ) values ($1,'self',$2,$3,$4,$5,$6::jsonb,1,$7)
    returning id,subject,kind,value,source_type,source_ref,provenance,confidence,status,created_at
  `, [
    authenticated.tenantId,
    input.kind,
    input.value.trim(),
    input.sourceType,
    sourceRef,
    JSON.stringify(input.provenance),
    authenticated.actorId
  ]);

  return NextResponse.json(entry, { status: 201 });
}

export async function PATCH(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = correctSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Correção inválida." }, { status: 400 });

  const [entry] = await tenantSql(authenticated.tenantId, `
    with previous as (
      select id,subject,kind,source_ref,provenance
      from personal_context_entries
      where tenant_id=$1 and id=$2 and status='active' and deleted_at is null
      for update
    ),
    superseded as (
      update personal_context_entries
      set status='superseded',updated_at=now()
      where tenant_id=$1 and id in (select id from previous)
      returning id
    )
    insert into personal_context_entries (
      tenant_id,subject,kind,value,source_type,source_ref,provenance,confidence,supersedes_id,created_by
    )
    select
      $1,p.subject,p.kind,$3,'user_correction',p.source_ref,
      p.provenance || jsonb_build_object('correctedFrom', p.id::text),
      1,p.id,$4
    from previous p
    returning id,subject,kind,value,source_type,source_ref,provenance,confidence,status,supersedes_id,created_at
  `, [authenticated.tenantId, parsed.data.id, parsed.data.value.trim(), authenticated.actorId]);

  if (!entry) return NextResponse.json({ error: "Esse contexto não existe mais." }, { status: 404 });
  return NextResponse.json(entry);
}

export async function DELETE(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Contexto inválido." }, { status: 400 });
  }

  const [entry] = await tenantSql(authenticated.tenantId, `
    update personal_context_entries
    set status='deleted',deleted_at=now(),updated_at=now()
    where tenant_id=$1 and id=$2 and status <> 'deleted'
    returning id
  `, [authenticated.tenantId, id]);

  if (!entry) return NextResponse.json({ error: "Esse contexto não existe mais." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
