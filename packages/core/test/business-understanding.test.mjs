import assert from "node:assert/strict";
import test from "node:test";
import { buildBusinessContextSnapshot, isFactEffective } from "../src/business-understanding.ts";

const fact = {
  id: "fact-1",
  tenantId: "tenant-a",
  entityId: "contract-1",
  factKey: "payment_terms",
  factValue: "Net 30",
  status: "owner_confirmed",
  evidenceRef: "contract-v3-page-2",
  sourceEventId: "source-1",
  observedAt: "2026-09-01T12:00:00Z",
  validFrom: "2026-01-01T00:00:00Z",
  validTo: "2027-01-01T00:00:00Z",
  reviewedAt: "2026-09-02T12:00:00Z"
};

test("makes owner-confirmed contextual claims with provenance, never authority", () => {
  const snapshot = buildBusinessContextSnapshot("tenant-a", [fact], "2026-10-12T00:00:00Z");
  assert.equal(snapshot.authority, "none");
  assert.equal(snapshot.confirmedFacts.length, 1);
  assert.deepEqual(snapshot.confirmedFacts[0].evidenceRefs, ["contract-v3-page-2"]);
});

test("ignores unreviewed, disputed and future-effective assertions", () => {
  const snapshot = buildBusinessContextSnapshot("tenant-a", [
    { ...fact, id: "a", status: "unreviewed" },
    { ...fact, id: "b", status: "disputed" },
    { ...fact, id: "c", validFrom: "2027-12-01T00:00:00Z" }
  ], "2026-10-12T00:00:00Z");
  assert.equal(snapshot.confirmedFacts.length, 0);
  assert.equal(snapshot.unreviewedCount, 1);
  assert.equal(snapshot.disputedCount, 1);
});

test("blocks cross-tenant fact mixing even if caller passes it", () => {
  assert.throws(() => buildBusinessContextSnapshot("tenant-a", [{ ...fact, tenantId: "tenant-b" }], "2026-10-12T00:00:00Z"), /Cross-tenant/);
});

test("fails closed on contradictory confirmed facts for same active period", () => {
  const snapshot = buildBusinessContextSnapshot("tenant-a", [fact,
    { ...fact, id: "fact-2", sourceEventId: "source-2", factValue: "Net 90" }
  ], "2026-10-12T00:00:00Z");
  assert.equal(snapshot.confirmedFacts.length, 0);
  assert.deepEqual(snapshot.conflictingKeys[0].values, ["Net 30", "Net 90"]);
});

test("effective windows use exclusive end and honor observation date", () => {
  assert.equal(isFactEffective(fact, "2027-01-01T00:00:00Z"), false);
  assert.equal(isFactEffective(fact, "2026-08-01T00:00:00Z"), false);
  assert.equal(isFactEffective(fact, "2026-10-01T00:00:00Z"), true);
});

test("a review timestamp later than snapshot cannot inform the past", () => {
  const snapshot = buildBusinessContextSnapshot("tenant-a", [
    { ...fact, reviewedAt: "2026-11-01T00:00:00Z" }
  ], "2026-10-12T00:00:00Z");
  assert.equal(snapshot.confirmedFacts.length, 0);
});
