import { buildBusinessContextSnapshot, type BusinessFactRecord } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";

type FactRow = {
  id: string;
  tenant_id: string;
  entity_id: string;
  fact_key: string;
  fact_value: string;
  status: "owner_confirmed" | "disputed";
  evidence_ref: string;
  source_event_id: string;
  observed_at: Date | string;
  valid_from: Date | string | null;
  valid_to: Date | string | null;
  reviewed_at: Date | string | null;
};

export type CeoFactExcerpt = {
  key: string;
  value: string;
  source: string;
  observedAt: string;
};

export type CeoFactSnapshot = {
  facts: CeoFactExcerpt[];
  conflictingFacts: number;
  truncated: boolean;
};

/**
 * Read only explicitly reviewed, effective tenant facts with provenance.
 * The Business Understanding Engine suppresses conflicting values.
 * This is user-reviewed context, not audited external proof.
 */
export async function loadCeoApprovedFacts(tenantId: string): Promise<CeoFactSnapshot> {
  const rows = await tenantSql<FactRow>(tenantId, `
    select id,tenant_id,entity_id,fact_key,fact_value,status,
           evidence_ref,source_event_id,observed_at,valid_from,valid_to,reviewed_at
    from business_facts
    where tenant_id=$1 and status in ('owner_confirmed','disputed')
    order by observed_at desc
    limit 101
  `, [tenantId]);
  const toIso = (value: Date | string | null) =>
    value ? new Date(value).toISOString() : null;
  const records: BusinessFactRecord[] = rows.slice(0,100).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    entityId: row.entity_id,
    factKey: row.fact_key,
    factValue: row.fact_value,
    status: row.status,
    evidenceRef: row.evidence_ref,
    sourceEventId: row.source_event_id,
    observedAt: toIso(row.observed_at)!,
    validFrom: toIso(row.valid_from),
    validTo: toIso(row.valid_to),
    reviewedAt: toIso(row.reviewed_at)
  }));
  const snapshot = buildBusinessContextSnapshot(tenantId, records, new Date().toISOString());
  return {
    facts: snapshot.confirmedFacts.slice(0, 8).map((fact) => ({
      key: fact.factKey,
      value: fact.factValue.slice(0, 240),
      source: fact.evidenceRefs[0] ?? "owner_reviewed",
      observedAt: fact.observedAt
    })),
    conflictingFacts: snapshot.conflictingKeys.length,
    truncated: rows.length > 100 || snapshot.confirmedFacts.length > 8
  };
}
