import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";

const root=process.cwd();
const file=(path)=>readFileSync(resolve(root,path),"utf8");
const exists=(path)=>existsSync(resolve(root,path));

test("REA baseline: the canonical reverse-engineering matrix includes every requirement",()=>{
 const doc=file("engenharia reversa.md");
 for(let id=1;id<=18;id++){
  const key="REA-"+String(id).padStart(2,"0");
  assert.match(doc,new RegExp("\\| "+key+" \\|"),key+" absent from traceability");
 }
 assert.match(doc,/CI.*nunca substitui E2E|Teste isolado nunca substitui E2E/i);
 assert.match(doc,/não.*100% de paridade|100% de paridade.*não/i);
 assert.ok(exists("docs/WONDERFUL_REVERSE_ENGINEERING.md"));
 assert.ok(exists("docs/SELFSERVE_RELEASE_GATE.md"));
});
test("REA security invariant: no public support without versioned QA and signed payment",()=>{
 const publicRoute=file("apps/web/app/api/support/public/route.ts");
 const page=file("apps/web/app/support/[slug]/page.tsx");
 const session=file("apps/web/app/api/support/session/route.ts");
 const release=file("packages/core/src/support-release.ts");
 for(const code of [publicRoute,page,session])assert.match(code,/latestSupportRelease/);
 assert.match(publicRoute,/ReleaseRevoked/);
 assert.match(publicRoute,/supportReleaseAssessment/);
 assert.match(release,/SUPPORT_SKILL_VERSION/);
 assert.match(release,/hasAnswer&&hasAbstain/);
 assert.match(file("packages/db/migrations/0027_support_skill_release_gate.sql"),/bump_support_content_version/);
 assert.match(file("apps/web/app/api/billing/webhook/route.ts"),/verifyPaddleWebhook/);
});
test("REA outcome invariant: operator closure never silently counts as verified customer resolution",()=>{
 const migration=file("packages/db/migrations/0028_support_verified_outcomes.sql");
 assert.match(migration,/support_customer_outcomes/);
 assert.match(migration,/ticket_id uuid not null unique/);
 assert.match(file("apps/web/app/api/support/feedback/route.ts"),/status='resolved'/);
 assert.match(file("apps/web/app/api/support/feedback/route.ts"),/lookup_hash=\$1/);
 const metrics=file("apps/web/app/api/support/metrics/route.ts");
 assert.match(metrics,/confirmed/);
 assert.match(metrics,/operator_resolved_count/);
 assert.match(metrics,/not_resolved/);
 assert.ok(exists("tests/support-outcomes-db.test.mjs"));
});
test("REA commercial release: production gates remain unchecked until external evidence exists",()=>{
 const gate=file("docs/SELFSERVE_RELEASE_GATE.md");
 assert.match(gate,/NOT READY FOR CUSTOMER SALES/);
 assert.match(gate,/- \[ \] Confirm the intended Vercel team/);
 assert.match(gate,/- \[ \] Verify Paddle Sandbox purchase/);
 assert.ok(exists("apps/web/app/api/billing/checkout/route.ts"));
});
