import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../../lib/auth-workspace";

export const dynamic = "force-dynamic";

const companyFields = z.object({
  companyName: z.string().trim().min(2).max(160),
  website: z.union([z.literal(""), z.string().trim().url().max(320).refine(
    (v) => {
      const url = new URL(v);
      return url.protocol === "https:" && !url.username && !url.password;
    }, "Website must be a public HTTPS URL with no embedded credentials"
  )]),
  sector: z.string().trim().min(2).max(120),
  offer: z.string().trim().min(10).max(1200),
  customers: z.string().trim().min(5).max(1200),
  operations: z.string().trim().min(5).max(1200),
  challenge: z.string().trim().min(5).max(1200),
  objective: z.string().trim().min(5).max(1200)
}).strict();

const submitSchema = companyFields.extend({ action: z.literal("save_draft") }).strict();
const confirmSchema = z.object({
  action: z.literal("confirm"),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  consent: z.literal(true)
}).strict();

type CompanyFields = z.infer<typeof companyFields>;
type IntakeRow = { id: string; attributes: unknown; updated_at: Date | string };
type IntakeAttributes = {
  version: 1;
  source: "owner_manual_intake";
  fields: CompanyFields;
  fingerprint: string;
  draftSavedAt: string;
  review: null | { status: "owner_confirmed"; reviewerId: string; at: string; fingerprint: string };
  sourceEventId: string;
};
const PRIMARY_KEY = "agesoma:ceo:company-profile:v1";

const canEdit = (role: string) => role === "owner" || role === "admin";
const err = (error: string, status: number) => NextResponse.json({ error }, { status });
const ownRow = (tenantId: string) => tenantSql<IntakeRow>(tenantId, `
  select id,attributes,updated_at from company_entities
  where tenant_id=$1 and entity_type='company' and canonical_key=$2 and status='active'
  limit 1
`, [tenantId, PRIMARY_KEY]);

function parseAttributes(value: unknown): IntakeAttributes | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<IntakeAttributes>;
  if (raw.version !== 1 || raw.source !== "owner_manual_intake" || typeof raw.fingerprint !== "string") return null;
  if (!companyFields.safeParse(raw.fields).success) return null;
  return raw as IntakeAttributes;
}

function responseFor(row: IntakeRow | undefined, editable: boolean) {
  const data = parseAttributes(row?.attributes);
  return NextResponse.json({
    status: !data ? "not_started" : data.review?.status === "owner_confirmed"
      && data.review.fingerprint === data.fingerprint ? "owner_confirmed" : "draft",
    fields: data?.fields ?? null,
    fingerprint: data?.fingerprint ?? null,
    source: data ? "owner_manual_intake" : null,
    canEdit: editable,
    note: "Informações declaradas pelo proprietário. Confirmação humana não comprova documentos nem autoriza operações."
  }, { headers: { "cache-control": "no-store" } });
}

export async function GET() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return err("Sessão inválida.", 401);
  const [row] = await ownRow(workspace.tenantId);
  if (!canEdit(workspace.role)) {
    const attrs = parseAttributes(row?.attributes);
    // A colleague can view confirmed company context, not the owner's unreviewed draft.
    if (!attrs || attrs.review?.status !== "owner_confirmed"
        || attrs.review.fingerprint !== attrs.fingerprint) {
      return responseFor(undefined, false);
    }
  }
  return responseFor(row, canEdit(workspace.role));
}

export async function POST(req: Request) {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return err("Sessão inválida.", 401);
  if (!canEdit(workspace.role)) return err("Somente owner/admin pode registrar o contexto da empresa.", 403);
  const body = submitSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return err("Informações incompletas ou inválidas.", 400);

  const { action: _action, ...fields } = body.data;
  const serialized = JSON.stringify(fields);
  const fingerprint = createHash("sha256").update(serialized).digest("hex");
  const attributes = {
    version: 1,
    source: "owner_manual_intake",
    fields,
    fingerprint,
    draftSavedAt: new Date().toISOString(),
    review: null
  };
  const [row] = await tenantSql<IntakeRow>(workspace.tenantId, `
    with source_event as (
      insert into ontology_source_events (
        tenant_id, provider, event_type, external_event_id, payload_hash, payload
      ) values ($1,'agesoma.ceo','owner_company_intake',$5,$6,
        jsonb_build_object('actorId',$7::text,'classification','owner_supplied_unreviewed'))
      returning id
    ), draft as (
      insert into company_entities (
        tenant_id, entity_type, canonical_name, canonical_key, status, attributes
      )
      select $1,'company',$3,$2,'active',
        $4::jsonb || jsonb_build_object('sourceEventId',source_event.id::text)
      from source_event
      on conflict (tenant_id,entity_type,canonical_key)
        where canonical_key is not null and status <> 'merged'
      do update set
        canonical_name=excluded.canonical_name,
        attributes=excluded.attributes,
        updated_at=now()
      returning id,attributes,updated_at
    )
    select id,attributes,updated_at from draft
  `, [workspace.tenantId,PRIMARY_KEY,fields.companyName,JSON.stringify(attributes),
      randomUUID(),fingerprint,workspace.actorId]);
  if (!row) return err("Não foi possível salvar o rascunho.", 500);
  return responseFor(row, true);
}

export async function PATCH(req: Request) {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return err("Sessão inválida.", 401);
  if (!canEdit(workspace.role)) return err("A confirmação exige owner/admin.", 403);
  const body = confirmSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return err("Confirmação explícita e versão atual do perfil são obrigatórias.", 400);

  const [row] = await tenantSql<IntakeRow>(workspace.tenantId, `
    update company_entities
    set attributes=jsonb_set(
      attributes,'{review}',jsonb_build_object(
        'status','owner_confirmed','reviewerId',$4::text,
        'at',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'fingerprint',$3::text
      ),true
    ),updated_at=now()
    where tenant_id=$1 and entity_type='company' and canonical_key=$2
      and status='active'
      and attributes->>'source'='owner_manual_intake'
      and attributes->>'fingerprint'=$3
      and attributes->'review'='null'::jsonb
    returning id,attributes,updated_at
  `, [workspace.tenantId,PRIMARY_KEY,body.data.fingerprint,workspace.actorId]);
  if (!row) return err("Perfil alterado ou já confirmado. Recarregue antes de confirmar.", 409);
  return responseFor(row, true);
}
