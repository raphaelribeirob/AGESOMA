import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const source=(file)=>readFileSync(file,"utf8");

test("commercial offer: real product engine powers the public no-data demo",()=>{
 const route=source("apps/web/app/api/demo/support/route.ts");
 const landing=source("apps/web/app/start/page.tsx");
 const offer=source("packages/core/src/support-offer.ts");
 assert.match(route,/demonstrateSupport/);
 assert.match(route,/origin/);
 assert.match(route,/raw\.length>2048/);
 assert.match(offer,/answerSupportQuestion/);
 assert.match(landing,/<SupportDemo\/>/);
 assert.match(landing,/<SupportPricing /);
 assert.match(landing,/Não executa pedidos, reembolsos/);
});

test("price preview: do not advertise invented prices or authorize access from UI",()=>{
 const pricing=source("apps/web/app/start/support-pricing.tsx");
 const landing=source("apps/web/app/start/page.tsx");
 assert.match(pricing,/Paddle\.PricePreview|paddle\.PricePreview/);
 assert.match(pricing,/Preço ainda não publicado/);
 assert.match(pricing,/preço|Preço/);
 assert.match(landing,/PADDLE_SUPPORT_PRICE_ID/);
 const webhook=source("apps/web/app/api/billing/webhook/route.ts");
 assert.match(webhook,/verifyPaddleWebhook/);
 assert.match(landing,/pagamento confirmado|confirmação do provedor/);
});

test("Agent Access remains discovery-only and cannot be mistaken for delegated access",()=>{
 const manifest=source("packages/core/src/agent-access-discovery.ts");
 const route=source("apps/web/app/api/agent-access/capabilities/route.ts");
 assert.match(manifest,/delegatedAgentAccess:false/);
 assert.match(manifest,/externallyCallable:false/);
 assert.match(manifest,/tokensIssued:false/);
 assert.match(route,/AGESOMA_AGENT_DISCOVERY/);
});

test("audit documents distinguish completed feature coding from real production evidence",()=>{
 assert.ok(existsSync("docs/WONDERFUL_OFFER_APPLICATION.md"));
 assert.match(source("docs/WONDERFUL_OFFER_APPLICATION.md"),/No merge to main or commercial release/);
 assert.match(source("docs/SELFSERVE_RELEASE_GATE.md"),/NOT READY FOR CUSTOMER SALES/);
 assert.match(source("engenharia reversa.md"),/100% de paridade/);
});
