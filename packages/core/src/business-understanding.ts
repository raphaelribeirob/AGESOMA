/**
 * Business Understanding Engine: a conservative, read-only projection of
 * tenant-scoped, provenance-bearing facts. Does NOT authorize actions.
 *
 * Owner-confirmed means reviewed by the tenant owner, NOT independently
 * verified against a contract, ERP, bank, or third-party source.
 */
export type BusinessFactStatus = "unreviewed" | "owner_confirmed" | "disputed";

export interface BusinessFactRecord {
  id: string;
  tenantId: string;
  entityId: string;
  factKey: string;
  factValue: string;
  status: BusinessFactStatus;
  evidenceRef: string;
  sourceEventId: string;
  observedAt: string;
  validFrom: string | null;
  validTo: string | null;
  reviewedAt: string | null;
}

export interface BusinessContextFact {
  entityId: string;
  factKey: string;
  factValue: string;
  evidenceRefs: string[];
  sourceEventIds: string[];
  observedAt: string;
}

export interface BusinessContextSnapshot {
  tenantId: string;
  asOf: string;
  confirmedFacts: BusinessContextFact[];
  conflictingKeys: { entityId: string; factKey: string; values: string[] }[];
  unreviewedCount: number;
  disputedCount: number;
  authority: "none";
}

function asDate(value: string, field: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(field + " must be an ISO date");
  return time;
}

export function isFactEffective(fact: BusinessFactRecord, asOf: string): boolean {
  const time = asDate(asOf, "asOf");
  return (
    asDate(fact.observedAt, "observedAt") <= time &&
    (fact.validFrom === null || asDate(fact.validFrom, "validFrom") <= time) &&
    (fact.validTo === null || time < asDate(fact.validTo, "validTo"))
  );
}

/**
 * Fail closed: never merge data from two tenants; never promote pending facts
 * or pick an arbitrary winner when current confirmed values conflict.
 */
export function buildBusinessContextSnapshot(
  tenantId: string,
  facts: readonly BusinessFactRecord[],
  asOf: string
): BusinessContextSnapshot {
  if (!tenantId.trim()) throw new Error("tenantId is required");
  const date = new Date(asDate(asOf, "asOf")).toISOString();
  const groups = new Map<string, BusinessFactRecord[]>();
  let unreviewedCount = 0;
  let disputedCount = 0;

  for (const fact of facts) {
    if (fact.tenantId !== tenantId) throw new Error("Cross-tenant business context is prohibited");
    if (!isFactEffective(fact, date)) continue;
    if (fact.status === "unreviewed") {
      unreviewedCount++;
      continue;
    }
    if (fact.status === "disputed") {
      disputedCount++;
      continue;
    }
    if (fact.status !== "owner_confirmed" || !fact.reviewedAt || !fact.evidenceRef || !fact.sourceEventId) continue;
    if (asDate(fact.reviewedAt, "reviewedAt") > asDate(date, "asOf")) continue;
    const key = JSON.stringify([fact.entityId, fact.factKey]);
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  }

  const confirmedFacts: BusinessContextFact[] = [];
  const conflictingKeys: BusinessContextSnapshot["conflictingKeys"] = [];

  for (const entries of groups.values()) {
    const first = entries[0];
    const values = [...new Set(entries.map(item => item.factValue))];
    if (values.length > 1) {
      conflictingKeys.push({ entityId: first.entityId, factKey: first.factKey, values: values.sort() });
      continue;
    }
    const newest = [...entries].sort((a,b) => asDate(b.observedAt,"observedAt") - asDate(a.observedAt,"observedAt"))[0];
    confirmedFacts.push({
      entityId: first.entityId,
      factKey: first.factKey,
      factValue: values[0],
      evidenceRefs: [...new Set(entries.map(item => item.evidenceRef))].sort(),
      sourceEventIds: [...new Set(entries.map(item => item.sourceEventId))].sort(),
      observedAt: newest.observedAt
    });
  }

  confirmedFacts.sort((a,b) => a.entityId.localeCompare(b.entityId) || a.factKey.localeCompare(b.factKey));
  conflictingKeys.sort((a,b) => a.entityId.localeCompare(b.entityId) || a.factKey.localeCompare(b.factKey));

  return { tenantId, asOf: date, confirmedFacts, conflictingKeys, unreviewedCount, disputedCount, authority: "none" };
}
