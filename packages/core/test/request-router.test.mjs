import assert from "node:assert/strict";
import test from "node:test";
import { routeBusinessRequest } from "../src/request-router.ts";
import { DEFAULT_AGENT_PACKAGE, agentTemplateForPlan } from "../src/agent-registry.ts";

test("business requests stay general", () => {
  const plan = routeBusinessRequest("Quero vender mais este mês");
  assert.equal(plan.domain, "sales");
  assert.equal(plan.action, "business.observe");
});

test("team organization is normal business work", () => {
  const plan = routeBusinessRequest("Organize a equipe e distribua as prioridades de hoje");
  assert.equal(plan.domain, "operations");
  assert.equal(plan.action, "business.work");
});

test("marketing requests route to the marketing specialist", () => {
  const plan = routeBusinessRequest("Crie uma campanha de marketing para Instagram");
  assert.equal(plan.domain, "marketing");
  assert.equal(agentTemplateForPlan(plan).key, "marketing");
});

test("AGESOMA package contains the canonical six specialists", () => {
  assert.deepEqual(DEFAULT_AGENT_PACKAGE.map((agent) => agent.key), [
    "sales",
    "marketing",
    "service",
    "finance",
    "operations",
    "research"
  ]);
});

test("general work falls back to the research specialist", () => {
  const plan = routeBusinessRequest("Pesquise concorrentes e prepare uma comparação");
  assert.equal(plan.domain, "general");
  assert.equal(agentTemplateForPlan(plan).key, "research");
});
