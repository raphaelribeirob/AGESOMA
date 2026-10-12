/**
 * AGESOMA ProofTree v1 — independent, bounded verification of completed work.
 * Assumptions: only a trusted control-plane service may supply "verified" source
 * evidence and attestations. Model self-reports and user input are NOT proof.
 * Decision PASS is verification of a bounded claim, NOT permission to act.
 */
import type { RiskClass } from "./sentinel";

export type ProofRisk = "low" | "moderate" | "high" | "critical";
export type ProofDecision = "PASS" | "REVIEW" | "BLOCK";
export type ProofEvidenceKind = "source_document" | "calculation" | "external_settlement" | "policy";
export type ProofOrigin = "trusted_connector" | "deterministic_rule" | "human_review" | "model_claim";
export type ProofMethod = "source_check" | "deterministic_recalculation" | "policy_check" | "model_review";

export interface ProofEvidence {
  id: string;
  tenantId: string;
  taskId: string;
  subjectHash: string;
  kind: ProofEvidenceKind;
  origin: ProofOrigin;
  reference: string;
  contentHash: string;
  verified: boolean;
}

export interface ProofAttestation {
  id: string;
  tenantId: string;
  taskId: string;
  subjectHash: string;
  verifierId: string;
  method: ProofMethod;
  decision: "pass" | "fail" | "abstain";
  evidenceIds: readonly string[];
}

export interface ProofTreeInput {
  tenantId: string;
  taskId: string;
  subjectHash: string;
  executorId: string;
  risk: ProofRisk;
  evidence: readonly ProofEvidence[];
  attestations: readonly ProofAttestation[];
  /** Independent human authorization for a specific case; NOT a Sentinel grant. */
  humanReviewed: boolean;
}

export interface ProofTreeDecision {
  tenantId: string;
  taskId: string;
  subjectHash: string;
  risk: ProofRisk;
  decision: ProofDecision;
  reasons: string[];
  acceptedEvidenceIds: string[];
  acceptedVerifierIds: string[];
  requiredVerifiers: number;
  authority: "none";
}

export function proofRiskFromAction(riskClass: RiskClass): ProofRisk {
  const risks: Record<RiskClass, ProofRisk> = {
    R0: "low", R1: "moderate", R2: "high", R3: "critical", R4: "critical"
  };
  return risks[riskClass];
}

export function evaluateProofTree(input: ProofTreeInput): ProofTreeDecision {
  if (!input.tenantId?.trim() || !input.taskId?.trim() ||
      !/^[0-9a-f]{64}$/i.test(input.subjectHash) || !input.executorId?.trim()) {
    throw new TypeError("ProofTree requires tenant, task, executor and SHA-256 subject hash");
  }
  const requirements = {
    low: { count: 1, source: false, deterministic: false },
    moderate: { count: 1, source: true, deterministic: false },
    high: { count: 2, source: true, deterministic: true },
    critical: { count: 2, source: true, deterministic: true }
  }[input.risk];
  if (!requirements) throw new TypeError("Unknown ProofTree risk");
  if (input.evidence.length > 64 || input.attestations.length > 8) {
    throw new RangeError("ProofTree exceeds bounded verification fan-out");
  }

  const reasons: string[] = [];
  const blocked: string[] = [];
  const evidenceById = new Map<string, ProofEvidence>();
  const acceptedEvidenceIds: string[] = [];
  for (const item of input.evidence) {
    if (item.tenantId !== input.tenantId || item.taskId !== input.taskId ||
        item.subjectHash !== input.subjectHash) {
      blocked.push("cross_scope_evidence");
      continue;
    }
    if (!item.id.trim() || evidenceById.has(item.id)) {
      blocked.push("duplicate_or_missing_evidence_id");
      continue;
    }
    evidenceById.set(item.id, item);
    if (item.verified && item.origin !== "model_claim" &&
        item.reference.trim().length > 0 && /^[0-9a-f]{64}$/i.test(item.contentHash)) {
      acceptedEvidenceIds.push(item.id);
    }
  }

  const accepted = new Set(acceptedEvidenceIds);
  if (accepted.size === 0) reasons.push("no_independently_verified_evidence");
  const seenAttestationIds = new Set<string>();
  const seenVerifiers = new Set<string>();
  const approvedMethods = new Set<ProofMethod>();
  const acceptedVerifierIds: string[] = [];

  for (const attestation of input.attestations) {
    if (attestation.tenantId !== input.tenantId || attestation.taskId !== input.taskId ||
        attestation.subjectHash !== input.subjectHash) {
      blocked.push("cross_scope_attestation");
      continue;
    }
    if (!attestation.id.trim() || seenAttestationIds.has(attestation.id)) {
      blocked.push("duplicate_attestation");
      continue;
    }
    seenAttestationIds.add(attestation.id);
    if (!attestation.verifierId.trim() || attestation.verifierId === input.executorId ||
        seenVerifiers.has(attestation.verifierId)) {
      blocked.push("non_independent_verifier");
      continue;
    }
    if (attestation.decision === "fail") {
      blocked.push("verifier_rejected_claim");
      continue;
    }
    if (attestation.decision !== "pass") continue;
    if (attestation.method === "model_review") {
      // Another model agreeing with the executor cannot establish proof.
      continue;
    }
    if (attestation.evidenceIds.length === 0 ||
        attestation.evidenceIds.some(id => !accepted.has(id))) {
      blocked.push("attestation_without_verified_evidence");
      continue;
    }

    const kinds = new Set(attestation.evidenceIds.map(id => evidenceById.get(id)!.kind));
    const origins = new Set(attestation.evidenceIds.map(id => evidenceById.get(id)!.origin));
    if (attestation.method === "source_check" &&
        (!kinds.has("source_document") && !kinds.has("external_settlement") ||
         ![...origins].some(origin => origin === "trusted_connector" || origin === "human_review"))) {
      blocked.push("source_check_missing_trusted_source");
      continue;
    }
    if (attestation.method === "deterministic_recalculation" &&
        (!kinds.has("calculation") || !origins.has("deterministic_rule"))) {
      blocked.push("deterministic_check_missing_calculation");
      continue;
    }
    if (attestation.method === "policy_check" && !kinds.has("policy")) {
      blocked.push("policy_check_missing_policy_evidence");
      continue;
    }

    seenVerifiers.add(attestation.verifierId);
    approvedMethods.add(attestation.method);
    acceptedVerifierIds.push(attestation.verifierId);
  }

  if (acceptedVerifierIds.length < requirements.count) reasons.push("insufficient_independent_verifiers");
  if (requirements.source && !approvedMethods.has("source_check")) reasons.push("source_check_required");
  if (requirements.deterministic && !approvedMethods.has("deterministic_recalculation")) {
    reasons.push("deterministic_recalculation_required");
  }
  if (input.risk === "critical" && input.humanReviewed !== true) reasons.push("human_review_required");

  const decision: ProofDecision = blocked.length > 0 ? "BLOCK" : reasons.length > 0 ? "REVIEW" : "PASS";
  return {
    tenantId: input.tenantId,
    taskId: input.taskId,
    subjectHash: input.subjectHash.toLowerCase(),
    risk: input.risk,
    decision,
    reasons: [...new Set([...blocked, ...reasons])],
    acceptedEvidenceIds: [...accepted].sort(),
    acceptedVerifierIds,
    requiredVerifiers: requirements.count,
    authority: "none"
  };
}
