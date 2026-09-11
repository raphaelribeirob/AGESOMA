import assert from "node:assert/strict";
import test from "node:test";
import { evaluateMargin } from "../src/margin-governor.ts";
import { routeBusinessRequest } from "../src/request-router.ts";

test("broad sales goal starts with observation", () => {
  const plan = routeBusinessRequest("Quero vender mais este mês");
  assert.equal(plan.domain, "sales");
  assert.equal(plan.action, "business.observe");
  assert.equal(plan.requiresApproval, false);
});

test("WhatsApp reply becomes an external action", () => {
  const plan = routeBusinessRequest("Responda meus clientes no WhatsApp e tente marcar reuniões");
  assert.equal(plan.domain, "service");
  assert.equal(plan.resource, "whatsapp");
  assert.equal(plan.action, "business.act");
  assert.equal(plan.requiresApproval, true);
});

test("reversible document work stays in work envelope", () => {
  const plan = routeBusinessRequest("Crie uma planilha com os leads do CRM");
  assert.equal(plan.domain, "sales");
  assert.equal(plan.resource, "crm");
  assert.equal(plan.action, "business.work");
  assert.equal(plan.requiresApproval, false);
});

test("money movement is always commit", () => {
  const plan = routeBusinessRequest("Pague a fatura do fornecedor por PIX");
  assert.equal(plan.domain, "finance");
  assert.equal(plan.resource, "finance");
  assert.equal(plan.action, "business.commit");
  assert.equal(plan.requiresApproval, true);
});

test("research request remains read-only", () => {
  const plan = routeBusinessRequest("Pesquise meus concorrentes e encontre oportunidades");
  assert.equal(plan.action, "business.observe");
  assert.equal(plan.requiresApproval, false);
});

test("bounded read-only discovery can run before value is known", () => {
  const result = evaluateMargin({
    action: "business.observe",
    riskClass: "R0",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0
  });
  assert.equal(result.decision, "EXECUTE");
});

test("unpriced external action still cannot bypass economics", () => {
  const result = evaluateMargin({
    action: "business.act",
    riskClass: "R2",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0
  });
  assert.equal(result.decision, "REPLAN");
});
