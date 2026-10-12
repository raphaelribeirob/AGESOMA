import assert from "node:assert/strict";
import test from "node:test";
import { assessRecoveryCase } from "../src/operations-recovery.ts";

const base = {
  caseId: "case-1",
  tenantId: "tenant-1",
  status: "detected",
  contractedChargeCents: 10000,
  billedChargeCents: 14000,
  evidence: [
    { kind: "contract", reference: "contract-1", verified: true },
    { kind: "freight_document", reference: "cte-1", verified: true }
  ],
  scopedApprovalId: null,
  recoveredAmountCents: 0,
  successFeeBps: 2000
};

test("detects potential leakage without claiming collected savings", () => {
  const result = assessRecoveryCase(base);
  assert.equal(result.potentialLeakageCents, 4000);
  assert.equal(result.evidenceReady, true);
  assert.equal(result.canSubmitClaim, false);
  assert.equal(result.verifiedRecoveredCents, 0);
  assert.equal(result.billableSuccessFeeCents, 0);
});

test("approved recovery can be submitted but cannot be billed before settlement", () => {
  const result = assessRecoveryCase({ ...base, status: "approved", scopedApprovalId: "sentinel-grant-1" });
  assert.equal(result.canSubmitClaim, true);
  assert.equal(result.billableSuccessFeeCents, 0);
});

test("confirmed settlement is eligible for success fee", () => {
  const result = assessRecoveryCase({
    ...base,
    status: "recovered",
    scopedApprovalId: "sentinel-grant-1",
    recoveredAmountCents: 3000,
    evidence: [...base.evidence, { kind: "settlement", reference: "bank-confirmation-1", verified: true }]
  });
  assert.equal(result.verifiedRecoveredCents, 3000);
  assert.equal(result.billableSuccessFeeCents, 600);
});

test("rejects claims based on unverified evidence or excessive recovered value", () => {
  const withoutProof = assessRecoveryCase({
    ...base,
    status: "recovered",
    scopedApprovalId: "sentinel-grant-1",
    recoveredAmountCents: 3000,
    evidence: [...base.evidence, { kind: "settlement", reference: "unverified", verified: false }]
  });
  assert.equal(withoutProof.billableSuccessFeeCents, 0);
  assert.ok(withoutProof.blockers.includes("missing_verified_settlement"));

  const exceedsDiscrepancy = assessRecoveryCase({
    ...base,
    status: "recovered",
    scopedApprovalId: "sentinel-grant-1",
    recoveredAmountCents: 5000,
    evidence: [...base.evidence, { kind: "settlement", reference: "receipt", verified: true }]
  });
  assert.equal(exceedsDiscrepancy.billableSuccessFeeCents, 0);
  assert.ok(exceedsDiscrepancy.blockers.includes("invalid_recovered_amount"));
});

test("rejects malformed money and fee inputs", () => {
  assert.throws(() => assessRecoveryCase({ ...base, billedChargeCents: -1 }), RangeError);
  assert.throws(() => assessRecoveryCase({ ...base, successFeeBps: 10001 }), RangeError);
  assert.throws(() => assessRecoveryCase({ ...base, contractedChargeCents: 2.5 }), RangeError);
});
