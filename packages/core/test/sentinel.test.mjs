import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionTask,
  evaluateSentinel,
  isApprovalGrantValid
} from "../src/sentinel.ts";

test("unknown actions fail closed", () => {
  const result = evaluateSentinel({
    type: "unknown.action",
    riskClass: "R0",
    reversible: true,
    external: false,
    hasScopedGrant: false
  });
  assert.equal(result.decision, "DENY");
});

test("registered low-risk actions are allowed", () => {
  const result = evaluateSentinel({
    type: "business.observe",
    riskClass: "R4",
    reversible: false,
    external: true,
    hasScopedGrant: false
  });
  assert.equal(result.decision, "ALLOW");
});

test("consequential actions require review without a scoped grant", () => {
  const result = evaluateSentinel({
    type: "business.act",
    riskClass: "R0",
    reversible: true,
    external: false,
    hasScopedGrant: false
  });
  assert.equal(result.decision, "REVIEW");
});

test("a scoped grant allows a registered R2 action", () => {
  const result = evaluateSentinel({
    type: "business.act",
    riskClass: "R0",
    reversible: true,
    external: false,
    hasScopedGrant: true
  });
  assert.equal(result.decision, "ALLOW");
});

test("approval grants are bound to tenant, task, action and expiry", () => {
  const grant = {
    id: "grant-1",
    tenantId: "tenant-a",
    taskId: "task-a",
    actionClass: "business.act",
    expiresAt: new Date("2030-01-01T00:00:00.000Z")
  };

  assert.equal(isApprovalGrantValid(grant, {
    tenantId: "tenant-a",
    taskId: "task-a",
    actionClass: "business.act",
    now: new Date("2029-01-01T00:00:00.000Z")
  }), true);

  assert.equal(isApprovalGrantValid(grant, {
    tenantId: "tenant-b",
    taskId: "task-a",
    actionClass: "business.act",
    now: new Date("2029-01-01T00:00:00.000Z")
  }), false);

  assert.equal(isApprovalGrantValid(grant, {
    tenantId: "tenant-a",
    taskId: "task-a",
    actionClass: "business.act",
    now: new Date("2031-01-01T00:00:00.000Z")
  }), false);
});

test("task transitions reject unsafe shortcuts", () => {
  assert.equal(canTransitionTask("queued", "running"), true);
  assert.equal(canTransitionTask("awaiting_approval", "running"), false);
  assert.equal(canTransitionTask("completed", "running"), false);
});
