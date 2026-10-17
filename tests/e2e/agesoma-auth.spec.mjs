import { test, expect } from "@playwright/test";

test.skip(process.env.AGESOMA_QA_FULL_DB !== "1", "Requires disposable full AGESOMA schema, never production DB");

async function signUpOwner(page,label){
  await page.goto("/sign-in");
  await page.getByRole("button",{name:"Ainda não tenho acesso"}).click();
  await expect(page.getByRole("heading",{name:"Crie seu acesso."})).toBeVisible();
  await page.getByRole("textbox",{name:"Seu nome"}).fill("QA Owner "+label);
  await page.getByRole("textbox",{name:"E-mail"}).fill(`qa-${label.toLowerCase()}-${Date.now()}@example.test`);
  await page.getByLabel("Senha").fill("Qa-Password-Only!2026");
  await page.getByRole("button",{name:"Criar acesso"}).click();
  await expect(page).toHaveURL(/\/(?:workforce\/ceo)?(?:\?.*)?$/, {timeout:25_000});
  await page.goto("/workforce/ceo");
  await expect(page.getByRole("heading",{name:"Primeiro, o CEO entende seu negócio."})).toBeVisible();
  await expect(page.getByRole("button",{name:"Salvar mapa inicial"})).toBeEnabled();
}

test("authenticated owner confirms CEO facts and never sees another tenant's company",async({browser,baseURL})=>{
  const contextA=await browser.newContext({baseURL}),contextB=await browser.newContext({baseURL});
  try{
    const a=await contextA.newPage(),b=await contextB.newPage();
    await signUpOwner(a,"Alpha");
    const prefix="Empresa Alfa QA isolada";
    await a.getByLabel("Qual é o nome da empresa?").fill(prefix);
    await a.getByLabel("Em qual setor ela atua?").fill("Serviços empresariais");
    await a.getByLabel("O que a empresa vende?").fill("Serviços de operação e consultoria empresarial.");
    await a.getByLabel("Quem são seus clientes?").fill("Empresas que precisam de atendimento e organização.");
    await a.getByLabel("Como a operação funciona hoje?").fill("Equipe usa planilhas, ERP e atendimento manual.");
    await a.getByLabel("Qual é o maior problema agora?").fill("Falta visibilidade do caixa e acompanhamento.");
    await a.getByLabel("Qual resultado quer alcançar primeiro?").fill("Reduzir o tempo de atendimento em vinte por cento.");
    await a.getByRole("button",{name:"Salvar mapa inicial"}).click();
    await expect(a.getByText("Rascunho salvo. Agora revise e confirme os dados.")).toBeVisible();
    await a.getByRole("checkbox").check();
    await a.getByRole("button",{name:"Confirmar informações"}).click();
    await expect(a.getByRole("heading",{name:"Mapa confirmado pelo proprietário"})).toBeVisible();
    const responseA=await a.request.get("/api/workforce/ceo/intake");
    expect(responseA.status()).toBe(200);
    const dataA=await responseA.json();
    expect(dataA.status).toBe("owner_confirmed");
    expect(JSON.stringify(dataA)).toContain(prefix);
    await signUpOwner(b,"Beta");
    const responseB=await b.request.get("/api/workforce/ceo/intake",{
      headers:{"x-tenant-id":dataA.tenantId||"00000000-0000-0000-0000-000000000001"}
    });
    expect(responseB.status()).toBe(200);
    const dataB=await responseB.json();
    expect(dataB.status).not.toBe("owner_confirmed");
    expect(JSON.stringify(dataB)).not.toContain(prefix);
    await b.reload();
    await expect(b.getByLabel("Qual é o nome da empresa?")).not.toHaveValue(prefix);
  }finally{
    await contextA.close(); await contextB.close();
  }
});
