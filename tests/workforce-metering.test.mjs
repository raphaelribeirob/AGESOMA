import test from "node:test";
import assert from "node:assert/strict";
import { quoteWorkforceExecution, wouldExceedCredits } from "../packages/core/src/workforce-metering.ts";

const commonUsage = {
  inputTokens: 100000, cacheReadTokens: 0, cacheWriteTokens: 0,
  outputTokens: 20000, computerMilliseconds: 15 * 60 * 1000,
  toolCostMicros: 5000, otherCostMicros: 0
};
const computeRate = 100000; // Example only: $0.10 per active VM hour.

test("100k/20k low-cost token run + 15min computer + tools quotes $0.05 cost, 13 cents retail", () => {
  const q = quoteWorkforceExecution(commonUsage, {
    inputMicrosPerMillion: 100000, cacheReadMicrosPerMillion: 10000,
    cacheWriteMicrosPerMillion: 125000, outputMicrosPerMillion: 500000,
    computerMicrosPerHour: computeRate
  });
  assert.equal(q.modelCostMicros, 20000n);
  assert.equal(q.computerCostMicros, 25000n);
  assert.equal(q.thirdPartyCostMicros, 5000n);
  assert.equal(q.providerCostMicros, 50000n);
  assert.equal(q.customerCreditsCents, 13n);
});

test("same usage using premium tokens is much more expensive and has separate pricing", () => {
  const q = quoteWorkforceExecution(commonUsage, {
    inputMicrosPerMillion: 2000000, cacheReadMicrosPerMillion: 100000,
    cacheWriteMicrosPerMillion: 2500000, outputMicrosPerMillion: 10000000,
    computerMicrosPerHour: computeRate
  });
  assert.equal(q.modelCostMicros, 400000n);
  assert.equal(q.providerCostMicros, 430000n);
  assert.equal(q.customerCreditsCents, 108n);
});

test("cache read/write tokens are not counted again as ordinary input", () => {
  const q = quoteWorkforceExecution({
    ...commonUsage, inputTokens: 200000, cacheReadTokens: 120000,
    cacheWriteTokens: 30000, outputTokens: 10000,
    computerMilliseconds: 0, toolCostMicros: 0
  }, {
    inputMicrosPerMillion: 100000, cacheReadMicrosPerMillion: 10000,
    cacheWriteMicrosPerMillion: 125000, outputMicrosPerMillion: 500000,
    computerMicrosPerHour: computeRate
  });
  // (50k * .10 + 120k * .01 + 30k * .125 + 10k * .50) / 1M dollars
  assert.equal(q.modelCostMicros, 14950n);
});

test("sleeping computer or zero-token work does not generate idle charges", () => {
  const q = quoteWorkforceExecution({
    inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0,
    computerMilliseconds: 0, toolCostMicros: 0, otherCostMicros: 0
  }, {
    inputMicrosPerMillion: 100000, cacheReadMicrosPerMillion: 10000,
    cacheWriteMicrosPerMillion: 125000, outputMicrosPerMillion: 500000,
    computerMicrosPerHour: computeRate
  });
  assert.equal(q.providerCostMicros, 0n);
  assert.equal(q.customerCreditsCents, 0n);
});

test("invalid numbers, negative charges, fake caches, or excessive gross margin fail closed", () => {
  const rates = {
    inputMicrosPerMillion: 100000, cacheReadMicrosPerMillion: 10000,
    cacheWriteMicrosPerMillion: 125000, outputMicrosPerMillion: 500000,
    computerMicrosPerHour: computeRate
  };
  assert.throws(() => quoteWorkforceExecution({ ...commonUsage, inputTokens: -5 }, rates));
  assert.throws(() => quoteWorkforceExecution({ ...commonUsage, toolCostMicros: 1.3 }, rates));
  assert.throws(() => quoteWorkforceExecution({ ...commonUsage, inputTokens: 10, cacheReadTokens: 20 }, rates));
  assert.throws(() => quoteWorkforceExecution(commonUsage, { ...rates, outputMicrosPerMillion: NaN }));
  assert.throws(() => quoteWorkforceExecution(commonUsage, rates, 10000));
  assert.throws(() => quoteWorkforceExecution(commonUsage, rates, 3999.5));
});

test("hard task budget checks include both spent and in-flight reserved credits", () => {
  assert.equal(wouldExceedCredits(600n, 200n, 150n, 1000n), false);
  assert.equal(wouldExceedCredits(600n, 200n, 201n, 1000n), true);
  assert.equal(wouldExceedCredits(0n, 0n, 0n, 0n), false);
  assert.throws(() => wouldExceedCredits(-1n, 0n, 1n, 5n));
});
