import assert from "node:assert/strict";
import test from "node:test";
import { compileEnterpriseDeployment, enterpriseIntakeHash } from "../src/enterprise-deployment.ts";
import { evaluateProofTree } from "../src/prooftree.ts";
import { assessRecoveryCase, recoveryProofSubjectHash } from "../src/operations-recovery.ts";

const intake = {
  companyName: "Transportes Cliente", outcome: "Auditar cobranças de frete",
  ownerRole: "controller", monthlyFreightSpendCents: 45000000,
  sources: { contract: "contract-2026", rateTable: "tariffs-v3", cte: "cte-export", invoice: "invoice-export" }
};
test("reusable blueprint maps six specialist responsibilities and never activates them", () => {
  const plan = compileEnterpriseDeployment(intake);
  assert.equal(plan.templateVersion, "freight-recovery.v1");
  assert.deepEqual(plan.stages.map(x => x.id), ["discover", "reconcile", "verify", "approve", "recover", "settle"]);
  assert.deepEqual(plan.sourceCoverage.missing, []);
  assert.equal(plan.sourceCoverage.trust, "client_references_unverified");
  assert.equal(plan.permittedActions, "none");
  assert.equal(plan.state, "draft_only");
  assert.equal(plan.gates.length, 8);
  assert.ok(plan.gates.every(x => x.status === "not_verified"));
});
test("missing sources are explicit blockers, never silently assumed", () => {
  const plan = compileEnterpriseDeployment({ ...intake, sources: { cte: "cte-123" } });
  assert.deepEqual(plan.sourceCoverage.missing, ["contract", "rateTable", "invoice"]);
  assert.equal(plan.metrics.verifiedRecoveredCents, null);
});
test("intake hash is stable despite untrusted property ordering and whitespace", () => {
  const a = enterpriseIntakeHash(intake);
  const b = enterpriseIntakeHash({
    ...intake, companyName: " Transportes Cliente ",
    sources: { invoice: "invoice-export", cte: "cte-export", rateTable: "tariffs-v3", contract: "contract-2026" }
  });
  assert.equal(a, b);
  assert.notEqual(a, enterpriseIntakeHash({ ...intake, outcome: "Outro escopo" }));
});
test("malformed or forged inputs fail instead of promoting an intake to authority", () => {
  assert.throws(() => compileEnterpriseDeployment({ ...intake, monthlyFreightSpendCents: -5 }), RangeError);
  assert.throws(() => compileEnterpriseDeployment({ ...intake, ownerRole: "agent" }), TypeError);
  assert.throws(() => compileEnterpriseDeployment({ ...intake, sources: { contract: "x" } }), TypeError);
});
test("fixture end-to-end: intake -> independent verification -> recoverable amount; still no live operations", () => {
  const plan = compileEnterpriseDeployment(intake);
  assert.equal(plan.permittedActions, "none");
  const recovery = {
    caseId: "case-1", tenantId: "tenant-1", status: "recovered",
    contractedChargeCents: 100_000, billedChargeCents: 120_000,
    evidence: [
      { kind: "contract", reference: "contract-2026", verified: true },
      { kind: "freight_document", reference: "cte-123", verified: true },
      { kind: "settlement", reference: "bank-credit-456", verified: true }
    ],
    scopedApprovalId: "scoped-approval-1", recoveredAmountCents: 15_000, successFeeBps: 2000
  };
  const H = recoveryProofSubjectHash(recovery);
  const E = [
    { id: "src", tenantId: "tenant-1", taskId: "case-1", subjectHash: H, kind: "source_document", origin: "trusted_connector", reference: "contract-2026", contentHash: "a".repeat(64), verified: true },
    { id: "calc", tenantId: "tenant-1", taskId: "case-1", subjectHash: H, kind: "calculation", origin: "deterministic_rule", reference: "recalculation-1", contentHash: "b".repeat(64), verified: true },
    { id: "settlement", tenantId: "tenant-1", taskId: "case-1", subjectHash: H, kind: "external_settlement", origin: "trusted_connector", reference: "bank-credit-456", contentHash: "c".repeat(64), verified: true }
  ];
  const A = [
    { id: "a1", tenantId: "tenant-1", taskId: "case-1", subjectHash: H, verifierId: "source-checker", method: "source_check", decision: "pass", evidenceIds: ["src", "settlement"] },
    { id: "a2", tenantId: "tenant-1", taskId: "case-1", subjectHash: H, verifierId: "calculator", method: "deterministic_recalculation", decision: "pass", evidenceIds: ["calc"] }
  ];
  // FIXTURE ONLY: identities/verification flags here are simulated, not external proof.
  const pass = evaluateProofTree({ tenantId: "tenant-1", taskId: "case-1", subjectHash: H, executorId: "worker", risk: "critical", humanReviewed: true, evidence: E, attestations: A });
  assert.equal(pass.decision, "PASS");
  const result = assessRecoveryCase(recovery, pass);
  assert.equal(result.potentialLeakageCents, 20_000);
  assert.equal(result.verifiedRecoveredCents, 15_000);
  assert.equal(result.billableSuccessFeeCents, 3_000);
  const missingProof = assessRecoveryCase(recovery);
  assert.equal(missingProof.verifiedRecoveredCents, 0);
  assert.equal(missingProof.billableSuccessFeeCents, 0);
  const wrongTenant = evaluateProofTree({ tenantId: "tenant-2", taskId: "case-1", subjectHash: H, executorId: "worker", risk: "critical", humanReviewed: true, evidence: E, attestations: A });
  assert.equal(wrongTenant.decision, "BLOCK");
  const wrongCase = assessRecoveryCase({ ...recovery, billedChargeCents: 121_000 }, pass);
  assert.equal(wrongCase.verifiedRecoveredCents, 0);
  assert.equal(wrongCase.canSubmitClaim, false);
  const selfApproved = evaluateProofTree({ tenantId: "tenant-1", taskId: "case-1", subjectHash: H, executorId: "source-checker", risk: "critical", humanReviewed: true, evidence: E, attestations: A });
  assert.equal(selfApproved.decision, "BLOCK");
  assert.equal(assessRecoveryCase(recovery, selfApproved).billableSuccessFeeCents, 0);
});
