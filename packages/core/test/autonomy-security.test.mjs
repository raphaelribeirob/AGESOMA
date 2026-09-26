import assert from "node:assert/strict";
import test from "node:test";
import { buildCapabilityScope, matchAutonomyRule } from "../src/index.ts";

test("capped autonomy rule requires an explicit amount", () => {
  const scope = buildCapabilityScope({
    taskId: "11111111-1111-1111-1111-111111111111",
    action: "paid_media.set_campaign_budget",
    payload: {
      destination: "act_123",
      operation: "set_campaign_budget",
      resource: "facebook",
      parameters: { amount: 5000 }
    }
  });

  const rule = {
    id: "rule-1",
    actionClass: "paid_media.set_campaign_budget",
    destination: "act_123",
    operation: "set_campaign_budget",
    resourcePattern: "facebook",
    decision: "ALLOW",
    maxAmountCents: 10000,
    expiresAt: null,
    revokedAt: null
  };

  assert.equal(matchAutonomyRule(rule, scope), false);
});

test("capped autonomy rule accepts an amount inside the cap", () => {
  const scope = buildCapabilityScope({
    taskId: "11111111-1111-1111-1111-111111111111",
    action: "paid_media.set_campaign_budget",
    payload: {
      destination: "act_123",
      operation: "set_campaign_budget",
      resource: "facebook",
      amountCents: 5000,
      parameters: { amount: 5000 }
    }
  });

  const rule = {
    id: "rule-1",
    actionClass: "paid_media.set_campaign_budget",
    destination: "act_123",
    operation: "set_campaign_budget",
    resourcePattern: "facebook",
    decision: "ALLOW",
    maxAmountCents: 10000,
    expiresAt: null,
    revokedAt: null
  };

  assert.equal(matchAutonomyRule(rule, scope), true);
});
