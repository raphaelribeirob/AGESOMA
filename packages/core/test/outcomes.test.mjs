import assert from "node:assert/strict";
import test from "node:test";
import { buildOutcomeLearning, computeOutcomeEconomics } from "../src/outcomes.ts";

test("outcome economics aggregates execution costs and net value", () => {
  const result = computeOutcomeEconomics({
    modelCostCents: 100,
    apiCostCents: 50,
    messagingCostCents: 25,
    browserCostCents: 25,
    humanCostCents: 300,
    attributedRevenueCents: 5000,
    outcomeValueCents: 4000
  });

  assert.equal(result.totalCostCents, 500);
  assert.equal(result.economicValueCents, 5000);
  assert.equal(result.netValueCents, 4500);
  assert.equal(result.grossMarginBps, 9000);
});

test("outcome value can represent value when attributed revenue is lower", () => {
  const result = computeOutcomeEconomics({
    modelCostCents: 100,
    apiCostCents: 0,
    messagingCostCents: 0,
    browserCostCents: 0,
    humanCostCents: 0,
    attributedRevenueCents: 0,
    outcomeValueCents: 1000
  });

  assert.equal(result.economicValueCents, 1000);
  assert.equal(result.netValueCents, 900);
});

test("zero-value outcomes avoid division-by-zero margins", () => {
  const result = computeOutcomeEconomics({
    modelCostCents: 0,
    apiCostCents: 0,
    messagingCostCents: 0,
    browserCostCents: 0,
    humanCostCents: 0,
    attributedRevenueCents: 0,
    outcomeValueCents: 0
  });

  assert.equal(result.grossMarginBps, 0);
});

test("verified outcome learning preserves evidence and normalized time", () => {
  const result = buildOutcomeLearning({
    outcomeId: "outcome-1",
    outcomeType: "meeting_booked",
    attributionConfidence: 0.9,
    evidenceSource: "calendar-provider",
    verifiedAt: "2026-09-20T12:00:00Z",
    modelCostCents: 10,
    apiCostCents: 10,
    messagingCostCents: 10,
    browserCostCents: 10,
    humanCostCents: 10,
    attributedRevenueCents: 500,
    outcomeValueCents: 0
  });

  assert.equal(result.kind, "verified_outcome");
  assert.equal(result.evidenceSource, "calendar-provider");
  assert.equal(result.totalCostCents, 50);
  assert.equal(result.netValueCents, 450);
  assert.equal(result.verifiedAt, "2026-09-20T12:00:00.000Z");
});
