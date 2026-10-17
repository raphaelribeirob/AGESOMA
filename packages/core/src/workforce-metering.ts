/**
 * AGESOMA Workforce — deterministic USD cost estimator.
 *
 * A quote does NOT charge a customer, grant authorization, run a computer,
 * reserve balance or represent a reconciled provider invoice.
 *
 * All money uses integer micro-US-dollars (1 USD = 1,000,000 microUSD).
 * Provider rates are integer microUSD per 1 million tokens, never floating
 * point money. AI inputTokens INCLUDES cacheReadTokens and cacheWriteTokens.
 */
export interface TokenUsage {
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
}

export interface TokenRates {
  inputMicrosPerMillion: number;
  cacheReadMicrosPerMillion: number;
  cacheWriteMicrosPerMillion: number;
  outputMicrosPerMillion: number;
}

export interface ExecutionUsage extends TokenUsage {
  /** Actual active computer time only. Do not count an idle or hibernated VM. */
  computerMilliseconds: number;
  /** Verified third-party tool/Search charges, in microUSD. */
  toolCostMicros: number;
  /** Actual metered data, storage, voice, etc., in microUSD. */
  otherCostMicros: number;
}

export interface ExecutionRates extends TokenRates {
  /** Fully loaded computer host rate, microUSD per HOUR. */
  computerMicrosPerHour: number;
}

export interface ExecutionQuote {
  modelCostMicros: bigint;
  computerCostMicros: bigint;
  thirdPartyCostMicros: bigint;
  providerCostMicros: bigint;
  /** Customer consumption in 1-cent credits. This is NOT provider tokens. */
  customerCreditsCents: bigint;
  /** Target contribution margin on metered costs, excluding payment fees/tax. */
  targetContributionMarginBps: number;
}

function nonNegativeSafeInt(value: number, field: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(field + " must be a nonnegative safe integer");
  }
  return BigInt(value);
}

function ceilDiv(n: bigint, d: bigint): bigint {
  if (d <= 0n || n < 0n) throw new RangeError("invalid integer division");
  return (n + d - 1n) / d;
}

/** No account state changes. Never trust a client-supplied cost or token count. */
export function quoteWorkforceExecution(
  usage: ExecutionUsage,
  rates: ExecutionRates,
  targetContributionMarginBps = 6000
): ExecutionQuote {
  if (!Number.isSafeInteger(targetContributionMarginBps) ||
      targetContributionMarginBps < 0 || targetContributionMarginBps >= 10000) {
    throw new RangeError("targetContributionMarginBps must be an integer in [0,10000)");
  }
  const input = nonNegativeSafeInt(usage.inputTokens, "inputTokens");
  const cached = nonNegativeSafeInt(usage.cacheReadTokens, "cacheReadTokens");
  const written = nonNegativeSafeInt(usage.cacheWriteTokens, "cacheWriteTokens");
  const output = nonNegativeSafeInt(usage.outputTokens, "outputTokens");
  if (cached + written > input) throw new RangeError("cached and cache-written inputs exceed total input");
  const uncached = input - cached - written;
  const tokenNumerator =
    uncached * nonNegativeSafeInt(rates.inputMicrosPerMillion, "inputMicrosPerMillion") +
    cached * nonNegativeSafeInt(rates.cacheReadMicrosPerMillion, "cacheReadMicrosPerMillion") +
    written * nonNegativeSafeInt(rates.cacheWriteMicrosPerMillion, "cacheWriteMicrosPerMillion") +
    output * nonNegativeSafeInt(rates.outputMicrosPerMillion, "outputMicrosPerMillion");
  const modelCostMicros = ceilDiv(tokenNumerator, 1_000_000n);
  const computerCostMicros = ceilDiv(
    nonNegativeSafeInt(usage.computerMilliseconds, "computerMilliseconds") *
    nonNegativeSafeInt(rates.computerMicrosPerHour, "computerMicrosPerHour"),
    3_600_000n
  );
  const thirdPartyCostMicros =
    nonNegativeSafeInt(usage.toolCostMicros, "toolCostMicros") +
    nonNegativeSafeInt(usage.otherCostMicros, "otherCostMicros");
  const providerCostMicros = modelCostMicros + computerCostMicros + thirdPartyCostMicros;
  // 1 customer credit cent = 10,000 microUSD of retail price.
  const customerCreditsCents = ceilDiv(
    providerCostMicros,
    BigInt(10000 - targetContributionMarginBps)
  );
  return {
    modelCostMicros, computerCostMicros, thirdPartyCostMicros,
    providerCostMicros, customerCreditsCents, targetContributionMarginBps
  };
}

export function wouldExceedCredits(
  alreadySpentCents: bigint,
  reservedCents: bigint,
  requestedCents: bigint,
  maximumBudgetCents: bigint
): boolean {
  for (const [value, field] of [
    [alreadySpentCents, "alreadySpentCents"],
    [reservedCents, "reservedCents"],
    [requestedCents, "requestedCents"],
    [maximumBudgetCents, "maximumBudgetCents"]
  ] as const) if (value < 0n) throw new RangeError(field + " cannot be negative");
  return alreadySpentCents + reservedCents + requestedCents > maximumBudgetCents;
}
