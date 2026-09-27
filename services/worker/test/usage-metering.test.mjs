import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHermesUsage } from "../src/usage-metering.ts";

test("normalizes token and cents usage", () => {
  const usage = normalizeHermesUsage({
    usage: {
      input_tokens: 1200,
      output_tokens: 300,
      total_tokens: 1500,
      total_cost_cents: 7
    }
  });

  assert.equal(usage.inputTokens, 1200);
  assert.equal(usage.outputTokens, 300);
  assert.equal(usage.totalTokens, 1500);
  assert.equal(usage.actualCostCents, 7);
  assert.equal(usage.costSource, "hermes_actual");
});

test("converts explicit USD cost to cents", () => {
  const usage = normalizeHermesUsage({ total_cost_usd: 0.123 });
  assert.equal(usage.actualCostCents, 12);
});

test("does not invent cost when provider omits price", () => {
  const usage = normalizeHermesUsage({ input_tokens: 100, output_tokens: 50 });
  assert.equal(usage.actualCostCents, null);
  assert.equal(usage.costSource, "reservation_estimate");
});
