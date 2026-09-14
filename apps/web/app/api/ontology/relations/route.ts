import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COMPANY_RELATION_TYPES } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../lib/auth-workspace";

const bodySchema = z.object({
  provider: z.string().trim().min(1).max(80),
  eventType: z.string().trim().min(1).max(120),
  externalEventId: z.string().trim().min(1).max(240).optional(),
  observedAt: z.string().datetime().optional(),
  sourcePayload: z.record(z.string(), z.unknown()).default({}),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  relationType: z.enum(COMPANY_RELATION_TYPES),
  confidence: z.number().min(0).max(1).default(1),
  attributes: z.record(z.string(), z.unknown()).default({}),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional()
}).refine((value) => value.sourceEntityId !== value.targetEntityId, {
  message: "Ontology relations cannot point to the same entity",
  path: ["targetEntityId"]
});

export async function POST(req: Request) {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid ontology relation", details: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const sourcePayload = JSON.stringify(input.sourcePayload);
  const payloadHash = createHash("sha256").update(sourcePayload).digest("hex");
  const observedAt = input.observedAt ?? new Date().toISOString();

  const rows = await tenantSql<{ relation_id: string }>(workspace.tenantId, `
    with source_event as (
      insert into ontology_source_events(
        tenant_id,provider,event_type,external_event_id,payload_hash,payload,observed_at
      ) values ($1,$2,$3,$4,$5,$6::jsonb,$13::timestamptz)
      on conflict (tenant_id,provider,external_event_id) where external_event_id is not null
      do update set payload_hash=excluded.payload_hash,payload=excluded.payload,observed_at=excluded.observed_at
      returning id
    ), valid_entities as (
      select count(*)::int as count
      from company_entities
      where tenant_id=$1 and id in ($7::uuid,$8::uuid) and status <> 'merged'
    ), inserted as (
      insert into company_relations(
        tenant_id,source_entity_id,target_entity_id,relation_type,confidence,attributes,
        source_event_id,valid_from,valid_to
      )
      select $1,$7::uuid,$8::uuid,$9,$10,$11::jsonb,s.id,$12::timestamptz,$14::timestamptz
      from source_event s cross join valid_entities v
      where v.count=2
      returning id
    )
    select id as relation_id from inserted
  `, [
    workspace.tenantId,
    input.provider,
    input.eventType,
    input.externalEventId ?? null,
    payloadHash,
    sourcePayload,
    input.sourceEntityId,
    input.targetEntityId,
    input.relationType,
    input.confidence,
    JSON.stringify(input.attributes),
    input.validFrom ?? null,
    observedAt,
    input.validTo ?? null
  ]);

  if (!rows[0]) return NextResponse.json({ error: "Both entities must exist in the authenticated tenant" }, { status: 409 });
  return NextResponse.json({ relationId: rows[0].relation_id, tenantId: workspace.tenantId });
}
