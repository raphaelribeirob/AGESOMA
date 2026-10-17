import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SMB_SKILLS, skillForArea, routeSmbOwnerRequest, parseLocalCsv,
  analyzeCashCsv, analyzeLeadCsv, buildLocalBusinessPulse, scopeReadOnlyConnector
} from "../packages/core/src/smb-skills.ts";

const root=path.resolve(import.meta.dirname,"..");
const source=(file)=>readFileSync(path.join(root,file),"utf8");

test("six predefined SME capabilities have accountable 4-agent ownership and honest status",()=>{
  assert.deepEqual(SMB_SKILLS.map(s=>s.id),[
    "smb-onboard","smb-router","business-pulse",
    "cash-flow-snapshot","lead-triage","build-connector"
  ]);
  assert.deepEqual([...new Set(SMB_SKILLS.map(s=>s.owner))].sort(),[
    "executive","finance","growth","product"
  ]);
  assert.equal(SMB_SKILLS.filter(s=>s.state==="active_local_only").length,2);
  assert.ok(SMB_SKILLS.every(s=>s.externalSideEffects===false));
  assert.equal(skillForArea("finance"),"cash-flow-snapshot");
  assert.equal(skillForArea("sales"),"lead-triage");
  assert.equal(skillForArea("operations"),"business-pulse");
  assert.equal(skillForArea("technology"),"build-connector");
});

test("plain Portuguese requests route to only relevant safe capability",()=>{
  assert.equal(routeSmbOwnerRequest("Estou preocupado com meu fluxo de caixa"),"cash-flow-snapshot");
  assert.equal(routeSmbOwnerRequest("Preciso priorizar leads"),"lead-triage");
  assert.equal(routeSmbOwnerRequest("Quero conectar meu ERP"),"build-connector");
  assert.equal(routeSmbOwnerRequest("Me dê um panorama da empresa"),"business-pulse");
  assert.equal(routeSmbOwnerRequest("Pague automaticamente minhas contas"),null);
  assert.equal(routeSmbOwnerRequest("publique anúncios"),null);
});

test("CSV uses safe, bounded semicolon parsing including Brazilian decimal commas",()=>{
  const parsed=parseLocalCsv("data;tipo;valor;descricao\r\n2026-09-01;entrada;1.250,00;\"Venda; varejo\"\r\n2026-09-02;saida;380,00;Fornecedor");
  assert.equal(parsed.acceptedRows,2);
  assert.equal(parsed.records[0].descricao,"Venda; varejo");
  const cash=analyzeCashCsv(parsed);
  assert.deepEqual([cash.incomeCents,cash.expenseCents,cash.netChangeCents],[125000,38000,87000]);
  assert.deepEqual([cash.periodStart,cash.periodEnd],["2026-09-01","2026-09-02"]);
  assert.equal(cash.startingBalanceKnown,false);
  assert.equal(cash.forecastAvailable,false);
  assert.match(cash.note,/não saldo bancário/);
});

test("CSV supports quoted commas and English headers without uploading anything",()=>{
  const parsed=parseLocalCsv('date,type,amount,description\n2026-10-01,income,12.50,"Sale, shop"');
  assert.equal(parsed.records[0].description,"Sale, shop");
  assert.equal(analyzeCashCsv(parsed).netChangeCents,1250);
});

test("fail closed on malformed CSV, money and dates",()=>{
  for (const csv of [
    "", "one;two", "a;a\n1;2", "a;b\n1;2;3", 'a;b\n"unterminated;value',
    "a;b\n1", "a;b\n1;2\n3", "a;b\n1;2".repeat(30_000)
  ]) assert.throws(()=>parseLocalCsv(csv),Error);
  for (const [date,type,amount] of [
    ["2026-02-30","entrada","30"],["2026-10-01","retorno","30"],
    ["2026-10-01","entrada","-500"],["2026-10-01","saida","NaN"],
    ["2026-10-01","entrada","10.234"]
  ]) {
    const data=parseLocalCsv(`data;tipo;valor\n${date};${type};${amount}`);
    assert.throws(()=>analyzeCashCsv(data),Error);
  }
});

test("CSV maximum 1,000 records applies even without a trailing newline",()=>{
  const raw="data;tipo;valor\\n"+Array.from({length:1001},(_,i)=>`2026-10-01;entrada;${i+1}`).join("\\n");
  assert.throws(()=>parseLocalCsv(raw),/1\\.000 linhas/);
});

test("lead list is a transparent heuristic, not fabricated when there is no signal",()=>{
  const input=parseLocalCsv("nome;empresa;status;ultimo_contato\nPessoa A;Empresa A;interessado;2026-10-10\nPessoa B;Empresa B;proposta;2026-10-01");
  const ranked=analyzeLeadCsv(input,"2026-10-16");
  assert.equal(ranked.hasRanking,true);
  assert.equal(ranked.leads[0].name,"Pessoa B");
  assert.equal(ranked.leads[0].daysSinceContact,15);
  assert.match(ranked.note,/heurística|heuristica/);
  const flat=analyzeLeadCsv(parseLocalCsv("nome;status\nPessoa A;novo\nPessoa B;novo"),"2026-10-16");
  assert.equal(flat.hasRanking,false);
  assert.deepEqual(flat.leads.map(l=>l.name),["Pessoa A","Pessoa B"]);
  assert.ok(flat.leads.every(l=>l.score===null));
});

test("future contact, invalid name and missing stage are rejected",()=>{
  for(const csv of [
    "nome;status;ultimo_contato\nA;proposta;2026-12-10",
    "nome;status\n;proposta",
    "nome;status\nPessoa;"
  ]) assert.throws(()=>analyzeLeadCsv(parseLocalCsv(csv),"2026-10-16"));
});

test("first value is visible before the eight-field survey and never transmits CSV",()=>{
  const intake=source("apps/web/app/workforce/ceo/ceo-intake.tsx");
  const ui=source("apps/web/app/workforce/ceo/ceo-quick-win.tsx");
  const css=source("apps/web/app/workforce/ceo/ceo-quick-win.module.css");
  const core=source("packages/core/src/index.ts");
  assert.ok(intake.indexOf("<CeoQuickWin")>0 && intake.indexOf("<CeoQuickWin")<intake.indexOf('className={styles.layout}'));
  assert.match(ui,/file\.text\(\)/);
  assert.match(ui,/analyzeCashCsv/);
  assert.match(ui,/analyzeLeadCsv/);
  assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|FormData/);
  assert.match(ui,/processado somente neste navegador/);
  assert.match(ui,/sem conexão|sem conectar sistemas/);
  assert.match(css,/prefers-reduced-motion: reduce/);
  assert.match(core,/export \* from "\.\/smb-skills";/);
  const classes=[...new Set([...ui.matchAll(/styles\.([\w]+)/g)].map(m=>m[1]))];
  assert.ok(classes.length>15);
  for(const name of classes)assert.match(css,new RegExp("\\."+name+"(?=[\\s:.,{>])"),name);
});

test("CEO one-source pulse never invents revenue forecast or an audited cash balance",()=>{
  const data=parseLocalCsv("data;tipo;valor\n2026-10-01;saida;900\n2026-10-02;entrada;100");
  const pulse=buildLocalBusinessPulse(analyzeCashCsv(data));
  assert.equal(pulse.status,"partial");
  assert.equal(pulse.source,"local_csv");
  assert.match(pulse.headline,/saídas registradas superam/);
  assert.match(pulse.limits,/não conciliação financeira/);
  const leads=parseLocalCsv("nome;status\nA;novo\nB;novo");
  const leadPulse=buildLocalBusinessPulse(analyzeLeadCsv(leads,"2026-10-16"));
  assert.match(leadPulse.headline,/não fornece sinais suficientes/);
  assert.match(leadPulse.limits,/Nenhuma mensagem foi enviada/);
});

test("CTO connector only prepares read-only authorized plan without taking credentials",()=>{
  const plan=scopeReadOnlyConnector("Bling","Ler pedidos pagos e não entregues diariamente");
  assert.equal(plan.state,"proposal_only");
  assert.equal(plan.desiredPermission,"read_only");
  assert.equal(plan.approvalRequired,true);
  assert.equal(plan.steps.length,4);
  for(const phrase of [
    ["ERP","Me envie sua senha: abc"],
    ["https://erp.exemplo.com","Ler pedidos"],
    ["ERP","Colocar token secret aqui"]
  ])assert.throws(()=>scopeReadOnlyConnector(...phrase));
  assert.throws(()=>scopeReadOnlyConnector("","Ler vendas"));
});

test("CEO frontend presents partial pulse and no-connection CTO proposal",()=>{
  const ui=source("apps/web/app/workforce/ceo/ceo-quick-win.tsx");
  assert.match(ui,/buildLocalBusinessPulse\(result\)/);
  assert.match(ui,/scopeReadOnlyConnector\(systemName,readGoal\)/);
  assert.match(ui,/Nenhuma ação externa foi realizada/);
  assert.match(ui,/nenhuma conexão foi realizada/i);
});
