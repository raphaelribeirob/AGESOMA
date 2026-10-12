import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBusinessContextSnapshot, COMPANY_ENTITY_TYPES } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const uuid = z.string().uuid();
const isoTime = z.string().refine(value => Number.isFinite(Date.parse(value)), "Invalid date");
const entitySchema = z.object({
  action: z.literal("register_entity"),
  entityType: z.enum(COMPANY_ENTITY_TYPES),
  canonicalName: z.string().trim().min(2).max(160),
  externalReference: z.string().trim().regex(/^[a-z0-9._:-]{2,120}$/i)
});
const factSchema = z.object({
  action: z.literal("record_fact"),
  entityId: uuid,
  factKey: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
  factValue: z.string().trim().min(1).max(2000),
  evidenceRef: z.string().trim().min(1).max(320),
  idempotencyKey: z.string().regex(/^[a-z0-9_-]{12,80}$/i),
  validFrom: isoTime.nullish(),
  validTo: isoTime.nullish()
}).refine(x => !x.validFrom || !x.validTo || Date.parse(x.validFrom) < Date.parse(x.validTo), {
  message: "validTo must be later than validFrom"
});
const postSchema = z.union([entitySchema, factSchema]);
const reviewSchema = z.object({
  factId: uuid,
  status: z.enum(["owner_confirmed", "disputed"]),
  reviewNote: z.string().trim().min(5).max(1000)
});

type EntityRow = { id: string; entity_type: string; canonical_name: string; status: string };
type FactRow = {
  id: string; tenant_id: string; entity_id: string; fact_key: string; fact_value: string;
  evidence_ref: string; source_event_id: string; status: "unreviewed" | "owner_confirmed" | "disputed";
  observed_at: Date | string; valid_from: Date | string | null;
  valid_to: Date | string | null; reviewed_at: Date | string | null;
};
type RelationRow = { source_entity_id: string; target_entity_id: string; relation_type: string; confidence: number; attributes: unknown };
const time = (v: Date | string | null) => v ? new Date(v).toISOString() : null;
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });
const canWrite = (role: string) => role === "owner" || role === "admin";

export async function GET() {
  const user = await resolveAuthenticatedWorkspace();
  if (!user) return jsonError("Sessão inválida.", 401);
  const tenant = user.tenantId;
  const entitiesPlus = await tenantSql<EntityRow>(tenant,
    "select id,entity_type,canonical_name,status from company_entities where tenant_id=$1 and status='active' order by updated_at desc limit 51",
    [tenant]);
  const entities = entitiesPlus.slice(0, 50);
  const ids = entities.map(e => e.id);
  if (!ids.length) return NextResponse.json({
    entities: [], relations: [], snapshot: buildBusinessContextSnapshot(tenant, [], new Date().toISOString()),
    truncated: false, note: "Facts do not authorize actions."
  });
  const [factsPlus, relationsPlus] = await Promise.all([
    tenantSql<FactRow>(tenant,
      "select id,tenant_id,entity_id,fact_key,fact_value,status,evidence_ref,source_event_id,observed_at,valid_from,valid_to,reviewed_at from business_facts where tenant_id=$1 and entity_id=any($2::uuid[]) order by observed_at desc limit 501",
      [tenant, ids]),
    tenantSql<RelationRow>(tenant,
      "select source_entity_id,target_entity_id,relation_type,confidence,attributes from company_relations where tenant_id=$1 and source_entity_id=any($2::uuid[]) and target_entity_id=any($2::uuid[]) order by created_at desc limit 201",
      [tenant, ids])
  ]);
  const facts = factsPlus.slice(0,500).map(row => ({
    id: row.id, tenantId: row.tenant_id, entityId: row.entity_id,
    factKey: row.fact_key, factValue: row.fact_value, status: row.status,
    evidenceRef: row.evidence_ref, sourceEventId: row.source_event_id,
    observedAt: time(row.observed_at)!,
    validFrom: time(row.valid_from), validTo: time(row.valid_to),
    reviewedAt: time(row.reviewed_at)
  }));
  return NextResponse.json({
    entities,
    relations: relationsPlus.slice(0,200).map(r => ({ ...r, trustLevel: "unverified_context_not_authority" })),
    snapshot: buildBusinessContextSnapshot(tenant, facts, new Date().toISOString()),
    truncated: entitiesPlus.length > 50 || factsPlus.length > 500 || relationsPlus.length > 200,
    note: "Owner review is NOT document verification. Graph relations are unverified; no context grants permission."
  });
}

export async function POST(req: Request) {
  const user = await resolveAuthenticatedWorkspace();
  if (!user) return jsonError("Sessão inválida.", 401);
  if (!canWrite(user.role)) return jsonError("Somente responsáveis pelo espaço podem registrar contexto.", 403);
  const result = postSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) return jsonError("Entrada inválida.", 400);
  const data = result.data;
  if (data.action === "register_entity") {
    const key = "manual:" + data.entityType + ":" + data.externalReference.toLowerCase();
    const sql = [
      "insert into company_entities (tenant_id,entity_type,canonical_name,canonical_key,status,attributes)",
      "values ($1,$2,$3,$4,'active','{}'::jsonb)",
      "on conflict (tenant_id,entity_type,canonical_key) where canonical_key is not null and status <> 'merged'",
      "do update set updated_at=company_entities.updated_at",
      "returning id,entity_type,canonical_name,status"
    ].join(" ");
    const [entity] = await tenantSql<EntityRow>(user.tenantId, sql,
      [user.tenantId,data.entityType,data.canonicalName,key]);
    return NextResponse.json({ entity, note: "Client-provided, unverified entity." }, { status: 201 });
  }

  // Do not accept caller-supplied 'verified' flags, source provider, tenant or actor.
  const serialized = JSON.stringify({
    entityId: data.entityId, factKey: data.factKey, factValue: data.factValue,
    evidenceRef: data.evidenceRef, validFrom: data.validFrom ?? null, validTo: data.validTo ?? null
  });
  const hash = createHash("sha256").update(serialized).digest("hex");
  const eventMetadata = JSON.stringify({
    entityId: data.entityId, factKey: data.factKey, evidenceRef: data.evidenceRef,
    classification: "manual_unreviewed"
  });
  const sql = [
    "with evt as (",
    "insert into ontology_source_events (tenant_id,provider,event_type,external_event_id,payload_hash,payload)",
    "values ($1,'agesoma.manual','business_fact_assertion',$2,$3,$4::jsonb)",
    "on conflict (tenant_id,provider,external_event_id) where external_event_id is not null",
    "do update set observed_at=ontology_source_events.observed_at",
    "returning id,payload_hash",
    ")",
    "insert into business_facts (tenant_id,entity_id,fact_key,fact_value,source_event_id,evidence_ref,valid_from,valid_to,created_by)",
    "select $1,$5,$6,$7,evt.id,$8,$9::timestamptz,$10::timestamptz,$11",
    "from evt join company_entities ce on ce.tenant_id=$1 and ce.id=$5 and ce.status='active'",
    "where evt.payload_hash=$3",
    "on conflict (tenant_id,entity_id,fact_key,source_event_id)",
    "do update set updated_at=business_facts.updated_at returning id,status"
  ].join(" ");
  const [fact] = await tenantSql<{ id: string; status: string }>(user.tenantId,sql,[
    user.tenantId,data.idempotencyKey,hash,eventMetadata,
    data.entityId,data.factKey,data.factValue,data.evidenceRef,
    data.validFrom ?? null,data.validTo ?? null,user.actorId
  ]);
  if (!fact) return jsonError("Entidade ausente ou chave de idempotência reutilizada com dados diferentes.", 409);
  return NextResponse.json({ fact, note: "Unreviewed assertion; never execution authority." }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await resolveAuthenticatedWorkspace();
  if (!user) return jsonError("Sessão inválida.", 401);
  if (!canWrite(user.role)) return jsonError("Revisão exige responsável pelo espaço.", 403);
  const result = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) return jsonError("Revisão inválida.", 400);
  const data = result.data;
  const sql = [
    "update business_facts set status=$3,reviewed_by=$4,review_note=$5,reviewed_at=now(),updated_at=now()",
    "where tenant_id=$1 and id=$2 returning id,status"
  ].join(" ");
  const [fact] = await tenantSql<{ id: string; status: string }>(user.tenantId,sql,
    [user.tenantId,data.factId,data.status,user.actorId,data.reviewNote]);
  if (!fact) return jsonError("Fato não encontrado.", 404);
  return NextResponse.json({ fact, note: "Only client confirmation, not independent proof or permission." });
}
