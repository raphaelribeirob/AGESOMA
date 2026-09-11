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
