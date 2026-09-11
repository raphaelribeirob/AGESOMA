import assert from "node:assert/strict";
import test from "node:test";
import { routeBusinessRequest } from "./request-router.ts";

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
