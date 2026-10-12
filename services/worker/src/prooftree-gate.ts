import { evaluateProofTree, assessRecoveryCase, recoveryProofSubjectHash } from "@agesoma/core";
import type { ProofTreeDecision, RecoveryCase } from "@agesoma/core";
import { sql } from "@agesoma/db";

/**
 * Trusted server-side ProofTree gateway. The browser, tenant API and the LLM
 * cannot create trusted evidence or attestations via this adapter.
 */
type RunRow = {
  id: string;
  executor_id: string;
  risk: "low" | "moderate" | "high" | "critical";
  status: string;
  human_reviewed: boolean;
  human_reviewer_id: string | null;
  human_reviewed_at: Date | null;
};
type EvidenceRow = {
  evidence_key: string;
  kind: "source_document" | "calculation" | "external_settlement" | "policy";
  origin: "trusted_connector" | "deterministic_rule" | "human_review" | "model_claim";
  reference: string;
  content_hash: string;
  verified: boolean;
};
type AttestationRow = {
  id: string;
  verifier_id: string;
  method: "source_check" | "deterministic_recalculation" | "policy_check" | "model_review";
  decision: "pass" | "fail" | "abstain";
  evidence_keys: string[];
};

export async function loadAndEvaluateProofTree(input: {
  tenantId: string;
  taskId: string;
  subjectHash: string;
  risk: "high" | "critical";
}): Promise<ProofTreeDecision | null> {
  // Case-specific exact hash + tenant + task binding prevents stale proof replay.
  const [run] = await sql<RunRow>([
    "select id,executor_id,risk,status,human_reviewed,human_reviewer_id,human_reviewed_at",
    "from prooftree_runs where tenant_id=$1 and task_id=$2 and subject_hash=$3",
    "limit 1"
  ].join(" "), [input.tenantId,input.taskId,input.subjectHash]);
  if (!run || run.status !== "ready" || run.risk !== input.risk) return null;

  const [rawEvidence, rawAttestations] = await Promise.all([
    sql<EvidenceRow>([
      "select evidence_key,kind,origin,reference,content_hash,verified",
      "from prooftree_evidence where tenant_id=$1 and run_id=$2 order by evidence_key limit 65"
    ].join(" "),[input.tenantId,run.id]),
    sql<AttestationRow>([
      "select id,verifier_id,method,decision,evidence_keys",
      "from prooftree_attestations where tenant_id=$1 and run_id=$2 order by created_at limit 9"
    ].join(" "),[input.tenantId,run.id])
  ]);
  // Never accidentally PASS on silently truncated attestation/evidence collections.
  if (rawEvidence.length > 64 || rawAttestations.length > 8) return null;
  const binding = { tenantId:input.tenantId,taskId:input.taskId,subjectHash:input.subjectHash };
  const decision = evaluateProofTree({
    ...binding,executorId:run.executor_id,risk:run.risk,
    humanReviewed:run.human_reviewed === true &&
      Boolean(run.human_reviewer_id?.trim()) &&
      run.human_reviewer_id !== run.executor_id &&
      run.human_reviewed_at !== null,
    evidence:rawEvidence.map(item=>({
      ...binding,id:item.evidence_key,kind:item.kind,origin:item.origin,
      reference:item.reference,contentHash:item.content_hash,verified:item.verified
    })),
    attestations:rawAttestations.map(item=>({
      ...binding,id:item.id,verifierId:item.verifier_id,method:item.method,
      decision:item.decision,evidenceIds:item.evidence_keys
    }))
  });

  await sql([
    "insert into prooftree_decisions (tenant_id,run_id,decision,reasons,evidence_ids,verifier_ids)",
    "values ($1,$2,$3,$4::text[],$5::text[],$6::text[])",
    "on conflict (tenant_id,run_id) do update set",
    "decision=excluded.decision,reasons=excluded.reasons,",
    "evidence_ids=excluded.evidence_ids,verifier_ids=excluded.verifier_ids,assessed_at=now()"
  ].join(" "),[
    input.tenantId,run.id,decision.decision,decision.reasons,
    decision.acceptedEvidenceIds,decision.acceptedVerifierIds
  ]);
  return decision;
}

/**
 * The only live-safe recovery evaluator: fail closed when a trusted stored
 * ProofTree decision is absent. Business recovery case input MUST itself come
 * from verified ingestion (not a model/user JSON payload).
 */
export async function assessRecoveryFromTrustedRecords(input: RecoveryCase) {
  const subjectHash = recoveryProofSubjectHash(input);
  const proof = await loadAndEvaluateProofTree({
    tenantId:input.tenantId,taskId:input.caseId,subjectHash,
    risk:input.status === "recovered" ? "critical" : "high"
  });
  return { ...assessRecoveryCase(input, proof ?? undefined), proofTree: proof };
}
