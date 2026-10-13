import { createHash } from "node:crypto";

/**
 * Reusable deployment blueprint for an outcome-as-a-service company.
 * This is a PLANNING primitive. A plan is NOT a signed engagement, trusted
 * source verification, Sentinel grant, activated agent or verified outcome.
 */
export const ENTERPRISE_TEMPLATE_VERSION = "freight-recovery.v1" as const;
export const REQUIRED_FREIGHT_SOURCES = ["contract", "rateTable", "cte", "invoice"] as const;
export type FreightSource = (typeof REQUIRED_FREIGHT_SOURCES)[number];
export type DeploymentStage = "discover" | "reconcile" | "verify" | "approve" | "recover" | "settle";
export type DeploymentGate =
  | "signed_scope"
  | "data_processing_rights"
  | "trusted_document_ingestion"
  | "tenant_isolation_e2e"
  | "independent_prooftree"
  | "scoped_sentinel_approval"
  | "settlement_reconciliation"
  | "paid_pilot_economics";

export interface EnterpriseIntake {
  companyName: string;
  outcome: string;
  ownerRole: "cfo" | "controller" | "logistics";
  monthlyFreightSpendCents: number | null;
  sources: Partial<Record<FreightSource, string>>;
}

export interface EnterpriseAgentStage {
  id: DeploymentStage;
  operator: string;
  purpose: string;
  requires: string[];
  produces: string;
  autonomy: "read_only" | "propose_only" | "requires_scoped_approval";
}

export interface EnterpriseDeploymentPlan {
  templateVersion: typeof ENTERPRISE_TEMPLATE_VERSION;
  service: "freight_recovery";
  companyName: string;
  businessOutcome: string;
  ownerRole: EnterpriseIntake["ownerRole"];
  costBaseline: { monthlyFreightSpendCents: number | null; status: "client_reported_unverified" | "unknown" };
  sourceCoverage: { provided: FreightSource[]; missing: FreightSource[]; trust: "client_references_unverified" };
  stages: EnterpriseAgentStage[];
  gates: { key: DeploymentGate; status: "not_verified"; requiredForProduction: true }[];
  metrics: { detectedLeakageCents: null; verifiedRecoveredCents: null; realizedGrossMargin: null; evidence: "not_measured" };
  state: "draft_only";
  permittedActions: "none";
  warning: string;
}

const STAGES: readonly EnterpriseAgentStage[] = [
  { id: "discover", operator: "Business Understanding", purpose: "Mapeia contrato, fornecedor, regras e lacunas", requires: ["escopo contratado", "fontes com proveniência"], produces: "mapa de processos e fontes", autonomy: "read_only" },
  { id: "reconcile", operator: "Freight Auditor", purpose: "Recalcula cobrança contra tarifa vigente", requires: ["tarifas verificadas", "CT-e e faturas verificadas"], produces: "divergência reproduzível", autonomy: "read_only" },
  { id: "verify", operator: "ProofTree Auditor", purpose: "Exige provas independentes e cálculo determinístico", requires: ["evidências originais", "verificadores independentes"], produces: "PASS, REVIEW ou BLOCK", autonomy: "read_only" },
  { id: "approve", operator: "Sentinel", purpose: "Exige autorização específica antes de contestar", requires: ["ProofTree PASS", "autorização limitada do cliente"], produces: "autorização vinculada ao caso", autonomy: "propose_only" },
  { id: "recover", operator: "Claims Operator", purpose: "Acompanha contestação autorizada, com idempotência", requires: ["canal autorizado", "aprovação vigente"], produces: "protocolo de contestação", autonomy: "requires_scoped_approval" },
  { id: "settle", operator: "Settlement Verifier", purpose: "Confere recebimento e elegibilidade do fee", requires: ["comprovante independente de liquidação"], produces: "valor recuperado e custo por caso", autonomy: "read_only" }
];

const GATES: readonly DeploymentGate[] = [
  "signed_scope", "data_processing_rights", "trusted_document_ingestion",
  "tenant_isolation_e2e", "independent_prooftree",
  "scoped_sentinel_approval", "settlement_reconciliation", "paid_pilot_economics"
];

function nonblank(value: string, label: string, max: number) {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > max) {
    throw new TypeError(label + " must be between 2 and " + max + " characters");
  }
  return value.trim();
}

/** Only business references are accepted; never customer-supplied evidence flags. */
export function normalizeEnterpriseIntake(input: EnterpriseIntake): EnterpriseIntake {
  if (!input || !["cfo", "controller", "logistics"].includes(input.ownerRole)) {
    throw new TypeError("A supported accountable owner role is required");
  }
  const amount = input.monthlyFreightSpendCents;
  if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000_000)) {
    throw new RangeError("monthlyFreightSpendCents must be nonnegative safe integer cents or null");
  }
  const sources: Partial<Record<FreightSource,string>> = {};
  for (const name of REQUIRED_FREIGHT_SOURCES) {
    const value = input.sources?.[name];
    if (value !== undefined && value !== null && value.trim() !== "") {
      sources[name] = nonblank(value, name, 320);
    }
  }
  return {
    companyName: nonblank(input.companyName, "companyName", 160),
    outcome: nonblank(input.outcome, "outcome", 500),
    ownerRole: input.ownerRole,
    monthlyFreightSpendCents: amount,
    sources
  };
}

export function compileEnterpriseDeployment(raw: EnterpriseIntake): EnterpriseDeploymentPlan {
  const input = normalizeEnterpriseIntake(raw);
  const provided = REQUIRED_FREIGHT_SOURCES.filter(key => Boolean(input.sources[key]));
  const missing = REQUIRED_FREIGHT_SOURCES.filter(key => !input.sources[key]);
  return {
    templateVersion: ENTERPRISE_TEMPLATE_VERSION,
    service: "freight_recovery",
    companyName: input.companyName,
    businessOutcome: input.outcome,
    ownerRole: input.ownerRole,
    costBaseline: {
      monthlyFreightSpendCents: input.monthlyFreightSpendCents,
      status: input.monthlyFreightSpendCents === null ? "unknown" : "client_reported_unverified"
    },
    sourceCoverage: { provided: [...provided], missing: [...missing], trust: "client_references_unverified" },
    stages: STAGES.map(stage => ({ ...stage, requires: [...stage.requires] })),
    gates: GATES.map(key => ({ key, status: "not_verified", requiredForProduction: true })),
    metrics: { detectedLeakageCents: null, verifiedRecoveredCents: null, realizedGrossMargin: null, evidence: "not_measured" },
    state: "draft_only",
    permittedActions: "none",
    warning: "Plano não executa agentes, não valida documentos, não autoriza ações e não demonstra recuperação financeira."
  };
}

/** Stable fingerprint for idempotency; untrusted intake cannot claim approval. */
export function enterpriseIntakeHash(input: EnterpriseIntake): string {
  const canonical = normalizeEnterpriseIntake(input);
  return createHash("sha256").update(JSON.stringify({
    templateVersion: ENTERPRISE_TEMPLATE_VERSION,
    ...canonical,
    sources: Object.fromEntries(REQUIRED_FREIGHT_SOURCES.map(key => [key, canonical.sources[key] ?? null]))
  })).digest("hex");
}
