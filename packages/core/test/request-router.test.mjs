import assert from "node:assert/strict";
import test from "node:test";
import { routeBusinessRequest } from "../src/request-router.ts";

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
