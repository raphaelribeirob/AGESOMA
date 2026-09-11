export interface MarginInput {
  expectedValueCents: number;
  expectedCostCents: number;
  expectedLossCents: number;
  confidence: number;
  action?: string;
  riskClass?: "R0" | "R1" | "R2" | "R3" | "R4";
}

export interface MarginConfig {
  minimumNetValueCents?: number;
  maxTaskCostCents?: number;
  maxDiscoveryCostCents?: number;
}

export interface MarginResult {
  decision: "EXECUTE" | "REVIEW" | "REPLAN";
  expectedNetValueCents: number;
  riskAdjustedValueCents: number;
  reason: string;
}

export function evaluateMargin(input: MarginInput, config: MarginConfig = {}): MarginResult {
  const minimum = config.minimumNetValueCents ?? 100;
  const maxCost = config.maxTaskCostCents ?? 500;
  const maxDiscoveryCost = config.maxDiscoveryCostCents ?? 100;
  const expectedNetValueCents = input.expectedValueCents - input.expectedCostCents - input.expectedLossCents;
  const riskAdjustedValueCents = Math.round(expectedNetValueCents * input.confidence);

  const boundedDiscovery = input.action === "business.observe" && input.riskClass === "R0";
  if (boundedDiscovery && input.expectedValueCents === 0 && input.expectedLossCents === 0) {
    if (input.expectedCostCents > maxDiscoveryCost) {
      return {
        decision: "REVIEW",
        expectedNetValueCents,
        riskAdjustedValueCents,
        reason: "Discovery cost exceeds the configured observation ceiling."
      };
    }
    return {
      decision: "EXECUTE",
      expectedNetValueCents,
      riskAdjustedValueCents,
      reason: "Bounded read-only discovery may run before business value is known."
    };
  }

  if (input.expectedCostCents > maxCost) {
    return { decision: "REVIEW", expectedNetValueCents, riskAdjustedValueCents, reason: "Expected task cost exceeds the configured P0 ceiling." };
  }
  if (riskAdjustedValueCents < minimum) {
    return { decision: "REPLAN", expectedNetValueCents, riskAdjustedValueCents, reason: "Risk-adjusted net value is below the economic execution threshold." };
  }
  return { decision: "EXECUTE", expectedNetValueCents, riskAdjustedValueCents, reason: "Policy-approved task has positive risk-adjusted economics." };
}
