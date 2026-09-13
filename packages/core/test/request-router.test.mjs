import assert from "node:assert/strict";
import test from "node:test";
import { evaluateMargin } from "../src/margin-governor.ts";
import { buildOutcomeLearning } from "../src/outcomes.ts";
import { buildOwnerAwareContext } from "../src/personalization.ts";
import { routeBusinessRequest } from "../src/request-router.ts";

test("broad sales goal starts with observation", () => {
  const plan = routeBusinessRequest("Quero vender mais este mês");
  assert.equal(plan.domain, "sales");
  assert.equal(plan.action, "business.observe");
  assert.equal(plan.requiresApproval, false);
  assert.equal(plan.verticalWorkPack, null);
});

test("consorcio sales request activates the first vertical work pack", () => {
  const plan = routeBusinessRequest("Encontre e qualifique 50 leads para consórcio");
  assert.equal(plan.domain, "sales");
  assert.equal(plan.action, "business.observe");
  assert.equal(plan.verticalWorkPack?.id, "consorcio_sales_v1");
  assert.equal(plan.verticalWorkPack?.market, "consorcio");
  assert.ok(plan.verticalWorkPack?.stages.includes("qualify_interest"));
  assert.ok(plan.verticalWorkPack?.successSignals.includes("meeting_booked"));
});

test("consorcio WhatsApp request keeps approval boundary and vertical context", () => {
  const plan = routeBusinessRequest("Recupere os leads de consórcio parados e fale com eles no WhatsApp");
  assert.equal(plan.resource, "whatsapp");
  assert.equal(plan.action, "business.act");
  assert.equal(plan.requiresApproval, true);
  assert.equal(plan.verticalWorkPack?.id, "consorcio_sales_v1");
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

test("explicit user-origin external action may run after policy approval within cost ceiling", () => {
  const result = evaluateMargin({
    action: "business.act",
    riskClass: "R2",
    expectedValueCents: 0,
    expectedCostCents: 0,
    expectedLossCents: 0,
    confidence: 0,
    payload: { ownerRequested: true }
  });
  assert.equal(result.decision, "EXECUTE");
});

test("verified outcome learning stores useful economics without raw evidence", () => {
  const learning = buildOutcomeLearning({
    outcomeId: "outcome-1",
    outcomeType: "meeting_confirmed",
    outcomeValueCents: 50000,
    attributedRevenueCents: 0,
    modelCostCents: 20,
    apiCostCents: 10,
    messagingCostCents: 5,
    browserCostCents: 0,
    humanCostCents: 0,
    attributionConfidence: 0.9,
    evidenceSource: "calendar",
    verifiedAt: "2026-09-11T12:00:00.000Z"
  });

  assert.equal(learning.kind, "verified_outcome");
  assert.equal(learning.economicValueCents, 50000);
  assert.equal(learning.totalCostCents, 35);
  assert.equal(learning.netValueCents, 49965);
  assert.equal(Object.hasOwn(learning, "evidence"), false);
});

test("owner-aware context keeps preferences, rules and experience separate", () => {
  const context = buildOwnerAwareContext([
    { lesson_type: "owner_preference", content: { preference: "concise updates" }, created_at: "2026-09-11T10:00:00Z" },
    { lesson_type: "business_rule", content: { rule: "preserve margin" }, created_at: "2026-09-11T09:00:00Z" },
    { lesson_type: "business_fact", content: { fact: "CRM is source of truth" }, created_at: "2026-09-11T08:00:00Z" },
    { lesson_type: "verified_outcome", content: { outcome: "meeting_confirmed" }, created_at: "2026-09-11T07:00:00Z" }
  ]);

  assert.equal(context.owner.length, 1);
  assert.equal(context.rules.length, 1);
  assert.equal(context.business.length, 1);
  assert.equal(context.experience.length, 1);
});
