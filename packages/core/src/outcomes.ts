export interface OutcomeCosts {
  modelCostCents: number;
  apiCostCents: number;
  messagingCostCents: number;
  browserCostCents: number;
  humanCostCents: number;
  attributedRevenueCents: number;
  outcomeValueCents: number;
}

export function computeOutcomeEconomics(input: OutcomeCosts) {
  const totalCostCents = input.modelCostCents + input.apiCostCents + input.messagingCostCents + input.browserCostCents + input.humanCostCents;
  const economicValueCents = Math.max(input.attributedRevenueCents, input.outcomeValueCents);
  const netValueCents = economicValueCents - totalCostCents;
  const grossMarginBps = economicValueCents === 0 ? 0 : Math.round((netValueCents / economicValueCents) * 10_000);
  return { totalCostCents, economicValueCents, netValueCents, grossMarginBps };
}

export interface OutcomeLearningInput extends OutcomeCosts {
  outcomeId: string;
  outcomeType: string;
  attributionConfidence: number;
  evidenceSource: string;
  verifiedAt: Date | string;
}

export function buildOutcomeLearning(input: OutcomeLearningInput) {
  const economics = computeOutcomeEconomics(input);
  const verifiedAt = input.verifiedAt instanceof Date ? input.verifiedAt.toISOString() : new Date(input.verifiedAt).toISOString();
  return {
    kind: "verified_outcome",
    outcomeId: input.outcomeId,
    outcomeType: input.outcomeType,
    economicValueCents: economics.economicValueCents,
    totalCostCents: economics.totalCostCents,
    netValueCents: economics.netValueCents,
    attributionConfidence: input.attributionConfidence,
    evidenceSource: input.evidenceSource,
    verifiedAt
  };
}
