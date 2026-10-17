import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildCeoBrief } from "../apps/web/app/workforce/ceo/ceo-brief.ts";

const profile = Object.freeze({
  companyName: "Mercado Esperança",
  website: "",
  sector: "varejo alimentar",
  offer: "Produtos alimentícios e básicos de supermercado para consumidores locais.",
  customers: "Famílias no bairro com compras semanais.",
  operations: "Loja, estoque e caixa; proprietário acompanha fornecedores.",
  challenge: "Falta controle sobre perda de estoque e vencimentos.",
  objective: "Diminuir perdas com vencimento e entender melhor o giro."
});

const root = path.resolve(import.meta.dirname, "..");
const source = (p) => readFileSync(path.join(root,p),"utf8");

test("CEO never profiles a business from an unconfirmed draft", () => {
  assert.equal(buildCeoBrief(profile, false), null);
  assert.equal(buildCeoBrief({...profile, companyName:" "}, true), null);
});

test("CEO brief attributes facts to owner without claiming external verification", () => {
  const brief = buildCeoBrief(profile, true);
  assert.ok(brief);
  assert.equal(brief?.kind, "owner_supplied_context");
  assert.equal(brief?.verifiedExternally, false);
  assert.equal(brief?.canExecuteAutomatically, false);
  assert.match(brief?.greeting ?? "", /Mercado Esperança/);
  assert.match(brief?.businessSummary ?? "", /varejo alimentar/);
  assert.equal(brief?.primaryObjective, profile.objective);
  assert.equal(brief?.presentChallenge, profile.challenge);
  assert.doesNotMatch(JSON.stringify(brief), /faturamento verificado|receita cresceu|pagamento realizado/i);
});

test("CEO proposals explicitly cover all four owners and cannot execute", () => {
  const brief = buildCeoBrief(profile, true);
  assert.ok(brief);
  assert.equal(brief?.proposals.length, 4);
  assert.deepEqual(brief?.proposals.map(item => item.owner), ["executive","finance","growth","product"]);
  assert.equal(new Set(brief?.proposals.map(item=>item.id)).size,4);
  for(const task of brief?.proposals ?? []) {
    assert.equal(task.authorization,"proposal_only");
    assert.ok(task.needs.length > 10);
  }
  assert.equal(brief?.followUpQuestions.length,3);
});

test("CEO UX only renders after confirmation and does not auto-dispatch", () => {
  const intake = source("apps/web/app/workforce/ceo/ceo-intake.tsx");
  const cockpit = source("apps/web/app/workforce/ceo/ceo-companion.tsx");
  const css = source("apps/web/app/workforce/ceo/ceo-companion.module.css");
  assert.match(intake, /\{confirmed && <CeoCompanion profile=\{fields\} \/>\}/);
  assert.match(cockpit, /buildCeoBrief\(profile, true\)/);
  assert.match(cockpit, /Não houve pesquisa, análise de IA, verificação externa ou execução de tarefas/);
  assert.match(cockpit, /Não iniciado · exige escopo e autorização/);
  assert.doesNotMatch(cockpit, /fetch\(|axios\(|dispatchTask|executeTask/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const names = [...new Set([...cockpit.matchAll(/styles\.([\w]+)/g)].map(x=>x[1]))];
  assert.ok(names.length >= 12);
  for(const name of names) assert.match(css, new RegExp("\\."+name+"(?=[\\s:.,{>])"),name);
});

test("CEO links to existing chat but labels the absence of automatic context sync",()=>{
  const cockpit = source("apps/web/app/workforce/ceo/ceo-companion.tsx");
  assert.match(cockpit, /href="\/" className="ageButton ageButtonSecondary"/);
  assert.match(cockpit, /não recebe automaticamente este briefing/);
});
