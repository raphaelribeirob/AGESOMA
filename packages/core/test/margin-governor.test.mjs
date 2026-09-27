import assert from "node:assert/strict";
import test from "node:test";
import { evaluateMargin } from "../src/margin-governor.ts";

test("explicit personal-assistant work can execute before economic value is known", () => {
  const result = evaluateMargin({
    action: "business.work",
    riskClass: "R1",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0,
    payload: { ownerRequested: true }
  });

  assert.equal(result.decision, "EXECUTE");
  assert.match(result.reason, /Explicit user-requested work/);
});

test("bounded internal handoff can execute without invented ROI", () => {
  const result = evaluateMargin({
    action: "business.work",
    riskClass: "R1",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0,
    payload: {
      handoffFromTaskId: "00000000-0000-0000-0000-000000000001",
      workerHandoffDepth: 1
    }
  });

  assert.equal(result.decision, "EXECUTE");
  assert.match(result.reason, /Bounded internal specialist work/);
});

test("internal handoff cost ceiling is still enforced", () => {
  const result = evaluateMargin({
    action: "business.work",
    riskClass: "R1",
    expectedValueCents: 0,
    expectedCostCents: 201,
    expectedLossCents: 0,
    confidence: 0,
    payload: {
      handoffFromTaskId: "00000000-0000-0000-0000-000000000001",
      workerHandoffDepth: 1
    }
  });

  assert.equal(result.decision, "REVIEW");
});

test("autonomous ordinary work still requires positive risk-adjusted economics", () => {
  const result = evaluateMargin({
    action: "business.work",
    riskClass: "R1",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0,
    payload: {}
  });

  assert.equal(result.decision, "REPLAN");
});
