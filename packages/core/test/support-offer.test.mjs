import test from "node:test";
import assert from "node:assert/strict";
import {SUPPORT_OFFER,demonstrateSupport} from "../src/support-offer.ts";
test("public sales promise is bounded to genuine hosted support capabilities",()=>{
 assert.equal(SUPPORT_OFFER.quotas.maxDailyMessages,200);
 assert.equal(SUPPORT_OFFER.quotas.maxHourlyMessages,40);
 assert.equal(SUPPORT_OFFER.quotas.maxDailyMessagesPerVisitor,12);
 assert.ok(SUPPORT_OFFER.exclusions.includes("CRM/ERP"));
 assert.ok(SUPPORT_OFFER.exclusions.includes("agentes autônomos"));
});
test("demonstration invokes actual FAQ matcher and safely abstains",()=>{
 const matched=demonstrateSupport("Qual é o prazo de entrega?");
 assert.equal(matched.status,"answered");assert.equal(matched.knowledgeId,"prazo-demo");
 assert.equal(matched.simulation,true);assert.equal(matched.externallyExecuted,false);
 const escalated=demonstrateSupport("Posso alterar um pedido pago?");
 assert.equal(escalated.status,"needs_human");assert.equal(escalated.knowledgeId,null);
 assert.equal(escalated.persisted,false);
});
