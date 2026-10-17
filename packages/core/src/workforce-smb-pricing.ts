/**
 * AGESOMA SMB proposal — denominated in BRL, NOT an active billing SKU.
 * IMPORTANT: 4 executive identities never imply four always-on computers.
 * 1 AGE usage credit = 1 Brazilian centavo of RETAIL metered work.
 */
export type SmbTier = "essencial" | "crescimento" | "pro";

export interface SmbPlan {
  readonly id: SmbTier;
  readonly monthlyPriceCentsBrl: number;
  readonly includedUsageCreditsCentsBrl: number;
  readonly executiveAgentCount: 4;
  readonly maxConcurrentComputers: number;
  readonly maximumUnapprovedOverageCentsBrl: 0;
}

export const SMB_LAUNCH_PLANS: Readonly<Record<SmbTier, SmbPlan>> = Object.freeze({
  essencial: Object.freeze({
    id: "essencial", monthlyPriceCentsBrl: 4900,
    includedUsageCreditsCentsBrl: 800, executiveAgentCount: 4,
    maxConcurrentComputers: 1, maximumUnapprovedOverageCentsBrl: 0
  }),
  crescimento: Object.freeze({
    id: "crescimento", monthlyPriceCentsBrl: 12900,
    includedUsageCreditsCentsBrl: 3000, executiveAgentCount: 4,
    maxConcurrentComputers: 2, maximumUnapprovedOverageCentsBrl: 0
  }),
  pro: Object.freeze({
    id: "pro", monthlyPriceCentsBrl: 24900,
    includedUsageCreditsCentsBrl: 7500, executiveAgentCount: 4,
    maxConcurrentComputers: 4, maximumUnapprovedOverageCentsBrl: 0
  })
});

/** The free CEO intake is manual and read-only; it does not deploy 4 live agents. */
export const FREE_CEO_DIAGNOSTIC = Object.freeze({
  monthlyPriceCentsBrl: 0,
  includedUsageCreditsCentsBrl: 0,
  maxAutonomousTasks: 0,
  maxActiveComputers: 0,
  description: "Cadastro e confirmação manual do perfil da empresa, sem execução autônoma."
});

function exactNonnegative(value: number, label: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(label + " must be a nonnegative safe integer");
  return BigInt(value);
}
const ceil = (n: bigint, d: bigint) => (n + d - 1n) / d;

/**
 * Convert actual provider cost in microUSD to retail AGE credits in BRL.
 *
 * fxMicroBrlPerUsd: 5_500_000 means an illustrative R$5.50 for US$1,
 * supplied by a trusted server-side versioned FX snapshot. Never by the client.
 * contingencyBps is an internal FX/rate cushion; all charges are disclosed in
 * centavo credits. Does not include payment fees, tax, or shared fixed infra.
 */
export function quoteBrlWorkCredits(
  providerCostMicroUsd: bigint,
  fxMicroBrlPerUsd: number,
  marginBps = 6000,
  contingencyBps = 1000
): {
  providerCostMicroBrl: bigint;
  riskAdjustedCostMicroBrl: bigint;
  customerCreditsCentsBrl: bigint;
} {
  if (providerCostMicroUsd < 0n) throw new RangeError("cost cannot be negative");
  const fx = exactNonnegative(fxMicroBrlPerUsd, "fxMicroBrlPerUsd");
  if (fx === 0n) throw new RangeError("FX must be positive");
  const margin = exactNonnegative(marginBps, "marginBps");
  const reserve = exactNonnegative(contingencyBps, "contingencyBps");
  if (margin >= 10000n || reserve > 10000n) throw new RangeError("invalid margin or contingency");

  // (microUSD / 1e6) * (microBRL / USD) = microBRL
  const providerCostMicroBrl = ceil(providerCostMicroUsd * fx, 1_000_000n);
  const riskAdjustedCostMicroBrl = ceil(providerCostMicroBrl * (10000n + reserve), 10000n);
  // One credit is BRL 0.01 = 10000 microBRL.
  const customerCreditsCentsBrl = ceil(riskAdjustedCostMicroBrl, 10000n - margin);
  return { providerCostMicroBrl, riskAdjustedCostMicroBrl, customerCreditsCentsBrl };
}

/**
 * Sample plan fee cost estimate for scenario planning only.
 * A provider's USD fixed fee requires an FX assumption. Not a tax calculation.
 */
export function hypotheticalMonthlyContribution(
  plan: SmbPlan,
  usageCostCentsBrl: number,
  paymentFeeCentsBrl: number,
  infraAllocationCentsBrl: number
): { contributionCentsBrl: bigint; contributionMarginBps: bigint } {
  const revenue = exactNonnegative(plan.monthlyPriceCentsBrl, "plan price");
  const cogs = exactNonnegative(usageCostCentsBrl, "usage cost");
  const fees = exactNonnegative(paymentFeeCentsBrl, "payment fees");
  const infra = exactNonnegative(infraAllocationCentsBrl, "infra cost");
  const contribution = revenue - cogs - fees - infra;
  const margin = revenue > 0n ? contribution * 10000n / revenue : 0n;
  return { contributionCentsBrl: contribution, contributionMarginBps: margin };
}
