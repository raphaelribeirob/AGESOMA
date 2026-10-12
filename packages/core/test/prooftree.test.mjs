import assert from "node:assert/strict";
import test from "node:test";
import { evaluateProofTree, proofRiskFromAction } from "../src/prooftree.ts";

const H = "a".repeat(64);
const source = {
  id: "doc-1", tenantId: "tenant-1", taskId: "task-1", subjectHash: H,
  kind: "source_document", origin: "trusted_connector", reference: "contract:123",
  contentHash: "b".repeat(64), verified: true
};
const math = {
  ...source, id: "calc-1", kind: "calculation", origin: "deterministic_rule",
  reference: "verified-calculation:123", contentHash: "c".repeat(64)
};
const sourceCheck = {
  id: "attestation-1", tenantId: "tenant-1", taskId: "task-1", subjectHash: H,
  verifierId: "source-verifier-1", method: "source_check",
  decision: "pass", evidenceIds: ["doc-1"]
};
const mathCheck = {
  ...sourceCheck, id: "attestation-2", verifierId: "arithmetic-verifier-1",
  method: "deterministic_recalculation", evidenceIds: ["calc-1"]
};
const base = {
  tenantId: "tenant-1", taskId: "task-1", subjectHash: H,
  executorId: "executor-1", risk: "high", evidence: [source, math],
  attestations: [sourceCheck, mathCheck], humanReviewed: false
};

test("low risk: one independent verifiable source is sufficient", () => {
  const result = evaluateProofTree({ ...base, risk: "low", evidence: [source], attestations: [sourceCheck] });
  assert.equal(result.decision, "PASS");
  assert.equal(result.authority, "none");
  assert.equal(result.requiredVerifiers, 1);
});
test("moderate: requires source verification instead of mere model agreement", () => {
  assert.equal(evaluateProofTree({ ...base, risk: "moderate", evidence: [source], attestations: [sourceCheck] }).decision, "PASS");
  assert.ok(evaluateProofTree({ ...base, risk: "moderate", evidence: [math], attestations: [mathCheck] }).reasons.includes("source_check_required"));
});
test("high: two independent methods produce PASS", () => {
  const result = evaluateProofTree(base);
  assert.equal(result.decision, "PASS");
  assert.deepEqual(result.acceptedVerifierIds, ["source-verifier-1", "arithmetic-verifier-1"]);
});
test("critical: independent human review also required; never grants authority", () => {
  const pending = evaluateProofTree({ ...base, risk: "critical" });
  assert.equal(pending.decision, "REVIEW");
  assert.ok(pending.reasons.includes("human_review_required"));
  assert.equal(evaluateProofTree({ ...base, risk: "critical", humanReviewed: true }).decision, "PASS");
});
test("same verifier repeating approval is rejected", () => {
  const result = evaluateProofTree({ ...base, attestations: [sourceCheck, { ...mathCheck, verifierId: sourceCheck.verifierId }] });
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.reasons.includes("non_independent_verifier"));
});
test("executor validating their own output is rejected", () => {
  const result = evaluateProofTree({ ...base, attestations: [{ ...sourceCheck, verifierId: "executor-1" }, mathCheck] });
  assert.equal(result.decision, "BLOCK");
});
test("tenant/task/claim hash mismatch fails closed", () => {
  for (const changed of [
    { evidence: [{ ...source, tenantId: "tenant-b" }, math] },
    { attestations: [{ ...sourceCheck, taskId: "other" }, mathCheck] },
    { evidence: [{ ...source, subjectHash: "0".repeat(64) }, math] }
  ]) {
    assert.equal(evaluateProofTree({ ...base, ...changed }).decision, "BLOCK");
  }
});
test("failed verifier vetoes consensus", () => {
  const result = evaluateProofTree({ ...base, attestations: [sourceCheck, mathCheck, {
    ...sourceCheck, id: "rejection-1", verifierId: "third", decision: "fail"
  }] });
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.reasons.includes("verifier_rejected_claim"));
});
test("unverified sources and model-only agreement cannot establish proof", () => {
  const noProof = evaluateProofTree({ ...base, evidence: [{ ...source, origin: "model_claim" }, math] });
  assert.notEqual(noProof.decision, "PASS");
  const agreed = evaluateProofTree({ ...base, attestations: [sourceCheck, { ...mathCheck, method: "model_review" }] });
  assert.equal(agreed.decision, "REVIEW");
});
test("verification fanout is limited and risk mapping is explicit", () => {
  assert.equal(proofRiskFromAction("R0"), "low");
  assert.equal(proofRiskFromAction("R1"), "moderate");
  assert.equal(proofRiskFromAction("R2"), "high");
  assert.equal(proofRiskFromAction("R3"), "critical");
  assert.equal(proofRiskFromAction("R4"), "critical");
  assert.throws(() => evaluateProofTree({ ...base, attestations: Array.from({length:9}, (_,i) => ({...sourceCheck, id:String(i)})) }), RangeError);
});
