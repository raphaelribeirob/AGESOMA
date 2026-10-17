import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  PRODUCT_FAMILIES, PLATFORM_PRODUCTS,
  getPlatformProduct, productsForFamily, isValidFamilyProductScope
} from "../packages/core/src/product-families.ts";
import { evaluatePlatformAdapterRequest } from "../packages/core/src/platform-adapter-policy.ts";

const root=path.resolve(import.meta.dirname,"..");
const read=p=>readFileSync(path.join(root,p),"utf8");

test("Instant is the first independent family; Dots remains second",()=>{
  assert.deepEqual(Object.keys(PRODUCT_FAMILIES),["instant","dots"]);
  assert.deepEqual(productsForFamily("instant").map(x=>x.id),
    ["instantspeak","instantstudy","instantbible"]);
  assert.deepEqual(productsForFamily("dots").map(x=>x.id),["dotspeak"]);
  assert.equal(PRODUCT_FAMILIES.instant.availability,"catalog_only");
  assert.equal(PRODUCT_FAMILIES.dots.availability,"catalog_only");
  for(const family of Object.values(PRODUCT_FAMILIES)) {
    assert.equal(family.designPolicy,"independent_product_design");
    assert.equal(family.dataSharingPolicy,"no_implicit_cross_product_access");
    assert.equal(family.billingPolicy,"separate_verified_entitlements");
  }
});

test("every product has exclusive data/entitlement scopes and its own canonical design",()=>{
  const namespaces=PLATFORM_PRODUCTS.map(x=>x.entitlementNamespace);
  const data=PLATFORM_PRODUCTS.map(x=>x.dataNamespace);
  assert.equal(new Set(namespaces).size,PLATFORM_PRODUCTS.length);
  assert.equal(new Set(data).size,PLATFORM_PRODUCTS.length);
  assert.equal(new Set(PLATFORM_PRODUCTS.map(x=>x.repo)).size,PLATFORM_PRODUCTS.length);
  for(const p of PLATFORM_PRODUCTS){
    assert.equal(p.designSource,"DESIGN.md");
    assert.equal(p.authIntegration,"separate_until_explicit_link");
    assert.equal(p.releaseStatus,"unverified_external_repository");
    assert.match(p.repo,/^raphaelribeirob\/(InstantSpeak|InstantStudy|InstantBible|DotSpeak)$/);
    assert.equal(getPlatformProduct(p.id)?.id,p.id);
    assert.ok(p.recommendedSharedCapabilities.length>=3);
  }
  assert.equal(getPlatformProduct("unknown"),null);
});

test("a different family/product or entitlement namespace cannot be substituted",()=>{
  assert.equal(isValidFamilyProductScope("instant","instantspeak","instantspeak","instant.speak"),true);
  assert.equal(isValidFamilyProductScope("instant","instantspeak","instantstudy","instant.speak"),false);
  assert.equal(isValidFamilyProductScope("instant","instantspeak","instantspeak","dots.speak"),false);
  assert.equal(isValidFamilyProductScope("dots","dotspeak","dotspeak","dots.speak"),true);
  assert.equal(isValidFamilyProductScope("instant","dotspeak","dotspeak","dots.speak"),false);
});

const valid={
  family:"instant",productId:"instantspeak",accountProductId:"instantspeak",
  tenantId:"company_1",verifiedTenantId:"company_1",namespace:"instant.speak",
  capability:"usage_metering",verifiedIdentity:true,verifiedEntitlement:true,
  guardianConsentVerified:false
};
test("future adapter preflight requires verified product, account, tenant, entitlement and declared capability",()=>{
  const pass=evaluatePlatformAdapterRequest(valid);
  assert.equal(pass.allowed,true);
  if(pass.allowed){
    assert.equal(pass.billTo,"instant.speak:company_1");
    assert.equal(pass.dataPartition,"instant.speak:company_1");
  }
  for(const diff of [
    {accountProductId:"instantstudy"},
    {family:"dots"},
    {tenantId:"company_2"},
    {verifiedTenantId:"company_2"},
    {namespace:"instant.study"},
    {verifiedEntitlement:false},
    {verifiedIdentity:false},
    {tenantId:""},
    {capability:"safe_workflows"}
  ]){
    const d=evaluatePlatformAdapterRequest({...valid,...diff});
    assert.equal(d.allowed,false,JSON.stringify(diff));
  }
});
test("child-facing DotSpeak requires guardian consent in adapter contract",()=>{
  const dot={...valid,
    family:"dots",productId:"dotspeak",accountProductId:"dotspeak",
    namespace:"dots.speak",capability:"usage_metering"
  };
  assert.deepEqual(evaluatePlatformAdapterRequest(dot),{allowed:false,reason:"guardian_consent_required"});
  const permitted=evaluatePlatformAdapterRequest({...dot,guardianConsentVerified:true});
  assert.equal(permitted.allowed,true);
  if(permitted.allowed)assert.equal(permitted.dataPartition,"dots.speak:company_1");
});

test("family pages use separated styling, distinct brand assets and honest integration state",()=>{
  const instant=read("apps/web/app/instant/page.tsx");
  const dots=read("apps/web/app/dots/page.tsx");
  const hub=read("apps/web/app/families/family-home.tsx");
  const css=read("apps/web/app/families/family-home.module.css");
  assert.match(instant,/<FamilyHome family="instant"/);
  assert.match(dots,/<FamilyHome family="dots"/);
  assert.match(hub,/data-platform-family=\{family\}/);
  assert.match(hub,/Disponibilidade comercial ainda não verificada/);
  assert.match(hub,/app não integrado aqui/);
  assert.match(css,/\.instant\s*\{/);
  assert.match(css,/\.dots\s*\{/);
  assert.match(css,/#ffffff/);
  assert.match(css,/#fbf7f2/);
  assert.doesNotMatch(hub,/className="ageTheme"/);
  assert.doesNotMatch(hub,/Paddle.*checkout|premium ativo|agentes online/);
  const classes=[...new Set([...hub.matchAll(/styles\.([A-Za-z][\w]*)/g)].map(m=>m[1]))];
  assert.ok(classes.length>15);
  for(const key of classes){
    assert.match(css,new RegExp("\\."+key+"(?=[\\s:.,{>])"),key);
  }
});
test("public root enters Instant while private AGE Workforce remains unchanged",()=>{
  const home=read("apps/web/app/page.tsx");
  const workforce=read("apps/web/app/workforce/page.tsx");
  const layout=read("apps/web/app/layout.tsx");
  assert.match(home,/if \(!authenticated\) redirect\("\/instant"\)/);
  assert.match(home,/redirect\("\/workforce\/ceo"\)/);
  assert.match(workforce,/resolveAuthenticatedWorkspace/);
  assert.match(layout,/Instant — plataforma de produtos/);
  assert.match(read("apps/web/app/start/page.tsx"),/AGESOMA Atendimento/);
});
test("a scoped neutral platform can preserve all legacy AGE modes while adapting one product at a time",()=>{
  const midnight=read("apps/web/app/linear-midnight.css");
  const familyStyles=read("apps/web/app/families/family-home.module.css");
  const agents=read("AGENTS.md");
  assert.match(midnight,/\.ageTheme\s*\{/);
  assert.doesNotMatch(familyStyles,/\.ageTheme/);
  assert.match(agents,/PLATFORM_FAMILIES|PRODUCT_FAMILIES|Instant\/Dots/i);
});
