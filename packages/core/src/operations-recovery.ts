/**
 * AGESOMA Operations: read-only recovery case assessment.
 *
 * This function never sends claims, moves money, or grants approval.
 * Evidence must be marked verified by a separate trusted workflow;
 * callers must not treat an LLM assertion as verification.
 */
export type RecoveryStatus = "detected" | "validated" | "approved" | "submitted" | "recovered" | "rejected";
export type RecoveryEvidenceKind = "contract" | "freight_document" | "settlement";

export interface RecoveryEvidence {
  kind: RecoveryEvidenceKind;
  reference: string;
  verified: boolean;
}

export interface RecoveryCase {
  caseId: string;
  tenantId: string;
  status: RecoveryStatus;
  contractedChargeCents: number;
  billedChargeCents: number;
  evidence: readonly RecoveryEvidence[];
  /** Reference to an independently authorized, task-scoped permission. */
  scopedApprovalId?: string | null;
  recoveredAmountCents?: number | null;
  successFeeBps: number;
}

export interface RecoveryAssessment {
  potentialLeakageCents: number;
  evidenceReady: boolean;
  canSubmitClaim: boolean;
  verifiedRecoveredCents: number;
  billableSuccessFeeCents: number;
  blockers: string[];
}

function requireNonnegativeCents(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(name + " must be a non-negative safe integer (cents)");
  }
}

export function assessRecoveryCase(input: RecoveryCase): RecoveryAssessment {
  if (!input.caseId?.trim() || !input.tenantId?.trim()) {
    throw new Error("Case and tenant IDs are required");
  }
  requireNonnegativeCents(input.contractedChargeCents, "contractedChargeCents");
  requireNonnegativeCents(input.billedChargeCents, "billedChargeCents");
  requireNonnegativeCents(input.recoveredAmountCents ?? 0, "recoveredAmountCents");
  if (!Number.isSafeInteger(input.successFeeBps) || input.successFeeBps < 0 || input.successFeeBps > 10_000) {
    throw new RangeError("successFeeBps must be between 0 and 10000");
  }

  const evidence = input.evidence ?? [];
  const hasVerified = (kind: RecoveryEvidenceKind) =>
    evidence.some(item => item.kind === kind && item.verified === true && item.reference.trim().length > 0);
  const evidenceReady = hasVerified("contract") && hasVerified("freight_document");
  const potentialLeakageCents = Math.max(0, input.billedChargeCents - input.contractedChargeCents);
  const approvalPresent = Boolean(input.scopedApprovalId?.trim());
  const canSubmitClaim = potentialLeakageCents > 0 &&
    evidenceReady &&
    approvalPresent &&
    (input.status === "approved" || input.status === "submitted" || input.status === "recovered");

  const requestedRecovery = input.recoveredAmountCents ?? 0;
  const settlementReady = hasVerified("settlement");
  const recoverable = canSubmitClaim &&
    input.status === "recovered" &&
    settlementReady &&
    requestedRecovery > 0 &&
    requestedRecovery <= potentialLeakageCents;
  const verifiedRecoveredCents = recoverable ? requestedRecovery : 0;
  // The fee is eligible only after a separately verified settlement, never on a detection.
  const billableSuccessFeeCents = Math.floor(verifiedRecoveredCents * input.successFeeBps / 10_000);
  const blockers: string[] = [];
  if (potentialLeakageCents === 0) blockers.push("no_positive_discrepancy");
  if (!evidenceReady) blockers.push("missing_verified_contract_or_freight_document");
  if (!approvalPresent) blockers.push("missing_scoped_approval");
  if (!["approved", "submitted", "recovered"].includes(input.status)) blockers.push("not_approved_for_claim");
  if (input.status === "recovered" && !settlementReady) blockers.push("missing_verified_settlement");
  if (input.status === "recovered" && (requestedRecovery <= 0 || requestedRecovery > potentialLeakageCents)) {
    blockers.push("invalid_recovered_amount");
  }
  return {
    potentialLeakageCents,
    evidenceReady,
    canSubmitClaim,
    verifiedRecoveredCents,
    billableSuccessFeeCents,
    blockers
  };
}
