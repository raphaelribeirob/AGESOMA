import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  isCeoBusinessQuestion,
  answerCeoBusinessQuestion,
  projectConfirmedCompanyForCapability
} from "../packages/core/src/ceo-conversation.ts";

const profile = {
  companyName: "Mercearia Azul",
  sector: "varejo",
  offer: "Cestas básicas e produtos para consumo doméstico.",
  customers: "Famílias e compradores da região.",
  operations: "Loja, estoque e ponto de venda.",
  challenge: "Não conseguimos prever as quebras de estoque.",
  objective: "Reduzir perdas em 20% no próximo trimestre.",
  website: "https://mercearia.example"
};

const root=path.resolve(import.meta.dirname,"..");
const source=p=>readFileSync(path.join(root,p),"utf8");

test("CEO recognizes common business-context questions in Brazilian Portuguese",()=>{
  for(const question of [
    "Como está minha empresa?", "O que você sabe sobre minha empresa?",
    "Quem são meus clientes?", "Qual meu objetivo?",
    "Me diga sobre a empresa", "Qual a prioridade da nossa empresa?",
    "Resuma meu negócio"
  ]) {
    assert.equal(isCeoBusinessQuestion(question),true,question);
  }
  for(const question of ["Qual a hora agora?","Qual o clima?","Envie um email"]) {
    assert.equal(isCeoBusinessQuestion(question),false,question);
  }
});

test("unconfirmed business returns onboarding step and does not allow execution",()=>{
  assert.match(answerCeoBusinessQuestion("Como está minha empresa?",null),/\/workforce\/ceo/);
  assert.match(answerCeoBusinessQuestion("Como está minha empresa?",null),/não vou iniciar tarefas/i);
});

test("CEO cites owner confirmation and never fabricates financial measurements",()=>{
  const answer=answerCeoBusinessQuestion("Como está minha empresa?",profile);
  assert.match(answer,/Mercearia Azul/);
  assert.match(answer,/Reduzir perdas em 20%/);
  assert.match(answer,/informações declaradas e confirmadas/);
  assert.match(answer,/não tenho acesso automático a dados financeiros/);
  assert.doesNotMatch(answer,/faturamento é R\$|lucro cresceu|vendi mais de/i);
});

test("CEO can answer specific customers or priorities without inventing external data",()=>{
  const customers=answerCeoBusinessQuestion("Quem são meus clientes?",profile);
  assert.match(customers,/Famílias e compradores/);
  assert.doesNotMatch(customers,/Loja, estoque/);
  const objective=answerCeoBusinessQuestion("Qual meu objetivo?",profile);
  assert.match(objective,/Reduzir perdas/);
  assert.match(objective,/não tenho indicadores atuais/);
});

test("specialists get only allowlisted business fields, never website, operations or hidden other fields",()=>{
  const finance=projectConfirmedCompanyForCapability(profile,"finance");
  const sales=projectConfirmedCompanyForCapability(profile,"sales");
  const service=projectConfirmedCompanyForCapability(profile,"service");
  assert.ok(finance && sales && service);
  assert.deepEqual(Object.keys(finance.fields),["companyName","sector","challenge","objective"]);
  assert.equal(finance.fields.offer,undefined);
  assert.equal(finance.fields.operations,undefined);
  assert.equal(finance.fields.website,undefined);
  assert.equal(sales.fields.customers,profile.customers);
  assert.equal(sales.fields.challenge,undefined);
  assert.equal(service.fields.offer,profile.offer);
  assert.equal(service.fields.objective,undefined);
  for(const scope of [finance,sales,service]){
    assert.equal(scope.trust,"owner_confirmed_not_independently_verified");
    assert.equal(scope.grantsAuthorization,false);
  }
});

test("unknown roles cannot receive business context",()=>{
  for(const role of ["","root","system","__proto__","cto","finance-admin"]) {
    assert.equal(projectConfirmedCompanyForCapability(profile,role),null);
  }
});

test("onboarding is required for new work but current approval actions remain routable",()=>{
  const route=source("apps/web/app/api/agesoma/route.ts");
  const home=source("apps/web/app/page.tsx");
  const reader=source("apps/web/lib/ceo-context.ts");
  assert.match(route,/loadConfirmedCompanyProfile\(tenantId\)/);
  assert.match(route,/if \(!profile\) \{/);
  assert.match(route,/Nenhuma tarefa foi criada/);
  assert.match(route,/projectConfirmedCompanyForCapability\(profile, selectedAgent.template_key\)/);
  assert.ok(route.indexOf("if (parsed.data.action === \"approve\"") < route.indexOf("const result = (looksLikeQuestion"));
  assert.match(home,/redirect\("\/workforce\/ceo"\)/);
  assert.match(home,/Number\(state.summary.approvals\) === 0/);
  assert.match(reader,/where tenant_id=\$1/);
  assert.match(reader,/parseConfirmedCompanyProfile/);
  assert.match(reader,/fingerprint !== calculated/);
  assert.match(reader,/review.fingerprint !== calculated/);
});
