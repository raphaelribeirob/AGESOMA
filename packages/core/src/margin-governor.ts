export interface MarginInput {
  expectedValueCents: number;
  expectedCostCents: number;
  expectedLossCents: number;
  confidence: number;
}

export interface MarginConfig {
  minimumNetValueCents?: number;
  maxTaskCostCents?: number;
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
  const expectedNetValueCents = input.expectedValueCents - input.expectedCostCents - input.expectedLossCents;
  const riskAdjustedValueCents = Math.round(expectedNetValueCents * input.confidence);

  if (input.expectedCostCents > maxCost) {
    return { decision: "REVIEW", expectedNetValueCents, riskAdjustedValueCents, reason: "Expected task cost exceeds the configured P0 ceiling." };
  }
  if (riskAdjustedValueCents < minimum) {
    return { decision: "REPLAN", expectedNetValueCents, riskAdjustedValueCents, reason: "Risk-adjusted net value is below the economic execution threshold." };
  }
  return { decision: "EXECUTE", expectedNetValueCents, riskAdjustedValueCents, reason: "Policy-approved task has positive risk-adjusted economics." };
}
