import assert from "node:assert/strict";
import { test } from "node:test";
import { WORKFORCE_PROFILES } from "../apps/web/app/workforce/workforce-profiles.ts";
import {
  EXECUTIVE_TITLES,
  EXECUTIVE_KEYS,
  EXECUTIVE_OWNERSHIP,
  executiveOwnerForCapability
} from "../packages/core/src/executive-workforce.ts";
import { DEFAULT_AGENT_PACKAGE } from "../packages/core/src/agent-registry.ts";

const owners = {
  CEO: "executive",
  COO: "executive",
  CFO: "finance",
  CMO: "growth",
  CRO: "growth",
  CTO: "product",
  CPO: "product"
};

test("exactly four visible agents cover seven unique executive responsibilities", () => {
  assert.equal(WORKFORCE_PROFILES.length, 4);
  assert.equal(new Set(WORKFORCE_PROFILES.map((agent) => agent.id)).size, 4);
  assert.deepEqual(WORKFORCE_PROFILES.map((agent) => agent.id), EXECUTIVE_KEYS);
  const positions = WORKFORCE_PROFILES.flatMap((agent) => agent.positions);
  assert.equal(positions.length, 7);
  assert.equal(new Set(positions).size, 7);
  assert.deepEqual([...positions].sort(), [...EXECUTIVE_TITLES].sort());
  for (const agent of WORKFORCE_PROFILES) {
    assert.deepEqual(agent.positions, EXECUTIVE_OWNERSHIP[agent.id].titles);
    for (const title of agent.positions) assert.equal(agent.id, owners[title]);
  }
});

test("all existing seven specialist capabilities have exactly one executive owner", () => {
  const capabilities = DEFAULT_AGENT_PACKAGE.map((template) => template.key);
  assert.equal(capabilities.length, 7);
  const assigned = EXECUTIVE_KEYS.flatMap((key) => EXECUTIVE_OWNERSHIP[key].capabilities);
  assert.deepEqual([...assigned].sort(), [...capabilities].sort());
  assert.equal(new Set(assigned).size, assigned.length);
  for (const key of EXECUTIVE_KEYS) {
    assert.equal(EXECUTIVE_OWNERSHIP[key].key, key);
    for (const capability of EXECUTIVE_OWNERSHIP[key].capabilities) {
      assert.equal(executiveOwnerForCapability(capability), key);
    }
  }
});

test("unknown capability never gets privileged fallback ownership", () => {
  for (const input of ["", "unknown", "root", "sysadmin", "__proto__", "CTO"]) {
    assert.equal(executiveOwnerForCapability(input), null);
  }
});

test("roles keep useful read sources, task definitions, explicit boundaries", () => {
  for (const agent of WORKFORCE_PROFILES) {
    assert.ok(agent.title.length > 0);
    assert.ok(agent.mission.length > 25);
    assert.ok(agent.tasks.length >= 3);
    assert.ok(agent.sources.length >= 3);
    assert.ok(agent.boundaries.length >= 2);
  }
});

test("support belongs to CEO+COO; sales and paid-media belong to CMO+CRO", () => {
  assert.equal(executiveOwnerForCapability("service"), "executive");
  assert.equal(executiveOwnerForCapability("operations"), "executive");
  assert.equal(executiveOwnerForCapability("finance"), "finance");
  assert.equal(executiveOwnerForCapability("sales"), "growth");
  assert.equal(executiveOwnerForCapability("paid_media"), "growth");
  assert.deepEqual(EXECUTIVE_OWNERSHIP.product.capabilities, []);
});
