import assert from "node:assert/strict";
import { test } from "node:test";
import { EXECUTIVE_TITLES, WORKFORCE_PROFILES } from "../apps/web/app/workforce/workforce-profiles.ts";

const owners = {
  CEO: "executive",
  COO: "executive",
  CFO: "finance",
  CMO: "growth",
  CRO: "growth",
  CTO: "product",
  CPO: "product"
};

test("one workforce has exactly four agents and seven unique executive responsibilities", () => {
  assert.equal(WORKFORCE_PROFILES.length, 4);
  assert.equal(new Set(WORKFORCE_PROFILES.map((agent) => agent.id)).size, 4);
  const positions = WORKFORCE_PROFILES.flatMap((agent) => agent.positions);
  assert.equal(positions.length, 7);
  assert.equal(new Set(positions).size, 7);
  assert.deepEqual([...positions].sort(), [...EXECUTIVE_TITLES].sort());
  for (const agent of WORKFORCE_PROFILES) {
    for (const title of agent.positions) assert.equal(agent.id, owners[title]);
  }
});

test("four agents have meaningful tasks, read sources and explicit permission boundaries", () => {
  for (const agent of WORKFORCE_PROFILES) {
    assert.ok(agent.title.length > 0);
    assert.ok(agent.mission.length > 25);
    assert.ok(agent.tasks.length >= 3);
    assert.ok(agent.sources.length >= 3);
    assert.ok(agent.boundaries.length >= 2);
  }
});

test("no fifth customer-facing agent is introduced for support or sales", () => {
  const ids = WORKFORCE_PROFILES.map((agent) => agent.id);
  assert.deepEqual(ids, ["executive", "finance", "growth", "product"]);
  assert.equal(WORKFORCE_PROFILES.find((agent) => agent.id === "executive")?.mission.includes("atendimento"), true);
  assert.equal(WORKFORCE_PROFILES.find((agent) => agent.id === "growth")?.mission.includes("vendas"), true);
});
