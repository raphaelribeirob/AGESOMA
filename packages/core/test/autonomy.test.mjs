import assert from "node:assert/strict";
import test from "node:test";
import { matchAutonomyRule, resolveAutonomy } from "../src/autonomy.ts";

const scope = {
  taskId: "task-1",
  action: "business.act",
  destination: "whatsapp",
  operation: "send",
  resource: "customer:123",
  amountCents: 5000,
  payload: {}
};

test("autonomy matches exact and wildcard scopes", () => {
  const rule = {
    id: "allow-1",
    actionClass: "business.act",
    destination: "whatsapp",
    operation: "send",
    resourcePattern: "customer:*",
    decision: "ALLOW",
    maxAmountCents: 10000,
    expiresAt: null,
    revokedAt: null
  };
  assert.equal(matchAutonomyRule(rule, scope), true);
});

test("autonomy rejects revoked, expired and over-limit rules", () => {
  const base = {
    id: "allow-1",
    actionClass: "business.act",
    destination: "whatsapp",
    operation: "send",
    resourcePattern: "customer:*",
    decision: "ALLOW",
    maxAmountCents: 1000,
    expiresAt: null,
    revokedAt: null
  };

  assert.equal(matchAutonomyRule(base, scope), false);
  assert.equal(matchAutonomyRule({...base, maxAmountCents: 10000, revokedAt: new Date()}, scope), false);
  assert.equal(matchAutonomyRule({...base, maxAmountCents: 10000, expiresAt: new Date("2020-01-01T00:00:00.000Z")}, scope, new Date("2021-01-01T00:00:00.000Z")), false);
});

test("deny rules take precedence over allow rules", () => {
  const allow = {
    id: "allow-1",
    actionClass: "business.act",
    destination: "whatsapp",
    operation: "send",
    resourcePattern: "customer:*",
    decision: "ALLOW",
    maxAmountCents: 10000,
    expiresAt: null,
    revokedAt: null
  };
  const deny = {...allow, id: "deny-1", decision: "DENY"};

  const result = resolveAutonomy([allow, deny], scope);
  assert.deepEqual(result, {decision: "DENY", ruleId: "deny-1"});
});

test("no matching autonomy rule returns NONE", () => {
  const result = resolveAutonomy([], scope);
  assert.deepEqual(result, {decision: "NONE", ruleId: null});
});
