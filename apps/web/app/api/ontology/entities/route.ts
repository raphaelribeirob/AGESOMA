import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COMPANY_ENTITY_TYPES } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../lib/auth-workspace";

const bodySchema = z.object({
  provider: z.string().trim().min(1).max(80),
  eventType: z.string().trim().min(1).max(120),
  externalEventId: z.string().trim().min(1).max(240).optional(),
  observedAt: z.string().datetime().optional(),
  sourcePayload: z.record(z.string(), z.unknown()).default({}),
  entityType: z.enum(COMPANY_ENTITY_TYPES),
  canonicalName: z.string().trim().min(1).max(300),
  attributes: z.record(z.string(), z.unknown()).default({}),
  externalType: z.string().trim().min(1).max(120),
  externalId: z.string().trim().min(1).max(300),
  label: z.string().trim().max(300).optional(),
  confidence: z.number().min(0).max(1).default(1)
});

export async function POST(req: Request) {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid ontology entity", details: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const sourcePayload = JSON.stringify(input.sourcePayload);
  const payloadHash = createHash("sha256").update(sourcePayload).digest("hex");
  const observedAt = input.observedAt ?? new Date().toISOString();

  const rows = await tenantSql<{ entity_id: string }>(workspace.tenantId, `
    with source_event as (
      insert into ontology_source_events(
        tenant_id,provider,event_type,external_event_id,payload_hash,payload,observed_at
      ) values ($1,$2,$3,$4,$5,$6::jsonb,$14::timestamptz)
      on conflict (tenant_id,provider,external_event_id) where external_event_id is not null
      do update set payload_hash=excluded.payload_hash,payload=excluded.payload,observed_at=excluded.observed_at
      returning id
    ), existing as (
      select entity_id
      from company_entity_aliases
      where tenant_id=$1 and provider=$2 and external_type=$10 and external_id=$11
      limit 1
    ), updated as (
      update company_entities e
      set canonical_name=$8,
          attributes=e.attributes || $9::jsonb,
          last_seen_event_id=(select id from source_event),
          updated_at=now()
      where e.tenant_id=$1 and e.id=(select entity_id from existing)
      returning e.id
    ), inserted as (
      insert into company_entities(
        tenant_id,entity_type,canonical_name,attributes,first_seen_event_id,last_seen_event_id
      )
      select $1,$7,$8,$9::jsonb,s.id,s.id
      from source_event s
      where not exists (select 1 from existing)
      returning id
    ), chosen as (
      select id from updated
      union all
      select id from inserted
      limit 1
    ), alias_upsert as (
      insert into company_entity_aliases(
        tenant_id,entity_id,provider,external_type,external_id,label,confidence,source_event_id,observed_at
      )
      select $1,c.id,$2,$10,$11,$12,$13,s.id,$14::timestamptz
      from chosen c cross join source_event s
      on conflict (tenant_id,provider,external_type,external_id)
      do update set
        entity_id=excluded.entity_id,
        label=excluded.label,
        confidence=excluded.confidence,
        source_event_id=excluded.source_event_id,
        observed_at=excluded.observed_at,
        updated_at=now()
      returning entity_id
    )
    select entity_id from alias_upsert
  `, [
    workspace.tenantId,
    input.provider,
    input.eventType,
    input.externalEventId ?? null,
    payloadHash,
    sourcePayload,
    input.entityType,
    input.canonicalName,
    JSON.stringify(input.attributes),
    input.externalType,
    input.externalId,
    input.label ?? null,
    input.confidence,
    observedAt
  ]);

  return NextResponse.json({ entityId: rows[0]?.entity_id, tenantId: workspace.tenantId });
}
