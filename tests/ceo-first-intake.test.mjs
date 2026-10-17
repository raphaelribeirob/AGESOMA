import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const source = (path) => readFileSync(resolve(root,path),"utf8");
const route = source("apps/web/app/api/workforce/ceo/intake/route.ts");
const page = source("apps/web/app/workforce/ceo/page.tsx");
const client = source("apps/web/app/workforce/ceo/ceo-intake.tsx");
const css = source("apps/web/app/workforce/ceo/ceo-intake.module.css");
const workforce = source("apps/web/app/workforce/workforce-preview.tsx");

test("CEO is the first gated flow rather than seven unconfigured bots", () => {
  assert.match(workforce, /href="\/workforce\/ceo"/);
  assert.match(workforce, /Começar pelo CEO/);
  assert.match(workforce, /selected\.id === "executive"/);
  assert.match(page, /resolveAuthenticatedWorkspace\(\)/);
  assert.match(page, /redirect\("\/sign-in"\)/);
  assert.match(client, /Primeiro, o CEO entende seu negócio/);
  assert.match(client, /Mapa inicial da empresa/);
});

test("GET/POST/PATCH never trust a client-provided tenant or action authority", () => {
  assert.match(route, /resolveAuthenticatedWorkspace\(\)/g);
  assert.match(route, /canEdit\(workspace\.role\)/);
  assert.match(route, /role === "owner" \|\| role === "admin"/);
  assert.match(route, /\.strict\(\)/);
  assert.match(route, /companyFields/);
  assert.match(route, /tenant_id=\$1/g);
  assert.match(route, /tenantSql<IntakeRow>\(workspace\.tenantId/);
  assert.doesNotMatch(route, /(?:body\.data|data|body)\.tenantId|role:\s*req\./);
  assert.doesNotMatch(route, /executeAutomation|ensurePersistentWorker|OpenSandbox|grantAuthorization/);
});

test("company facts have provenance and explicit independent owner confirmation", () => {
  assert.match(route, /"owner_manual_intake"/);
  assert.match(route, /ontology_source_events/);
  assert.match(route, /payload_hash/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /review: null/);
  assert.match(route, /fingerprint: z\.string\(\)\.regex/);
  assert.match(route, /consent: z\.literal\(true\)/);
  assert.match(route, /'owner_confirmed'/);
  assert.match(route, /attributes->>'fingerprint'=\$3/);
  assert.match(route, /attributes->'review'='null'::jsonb/);
  assert.match(route, /owner_confirmed" : "draft"/);
  assert.match(route, /não comprova documentos nem autoriza operações/);
});

test("no automated website crawl or documents are presented as already read", () => {
  assert.doesNotMatch(route, /fetch\(|axios|cheerio|playwright/);
  assert.match(client, /ainda não será rastreada automaticamente/);
  assert.match(client, /nenhuma fonte externa foi verificada/i);
  assert.match(client, /nenhuma ação externa/i);
  assert.match(client, /confirmado pelo proprietário/i);
});

test("AGE frontend exposes accessible fields and safe confirmation UI", () => {
  assert.match(client, /<label htmlFor=\{question\.field\}>/);
  assert.match(client, /<form onSubmit=/);
  assert.match(client, /type="checkbox"/);
  assert.match(client, /disabled=\{!editable \|\| saving \|\| !consent \|\| dirty/);
  assert.match(client, /role="alert"/);
  assert.match(client, /aria-label="Mapa da empresa confirmado"/);
  assert.match(css, /--age-accent/);
  assert.match(css, /min-height: 48px/);
  assert.match(css, /max-width: 599px/);
  const classes=[...new Set([...client.matchAll(/styles\.([A-Za-z][\w]*)/g)].map(m=>m[1]))];
  assert.ok(classes.length>=10);
  for (const name of classes) assert.match(css,new RegExp("\\."+name+"(?=[\\s:.,{>])"),"Missing CSS "+name);
});

test("unreviewed drafts stay private to owner/admin until explicit confirmation", () => {
  assert.match(route, /A colleague can view confirmed company context/);
  assert.match(route, /return responseFor\(undefined, false\)/);
  assert.match(route, /attrs\.review\?\.status !== "owner_confirmed"/);
});
