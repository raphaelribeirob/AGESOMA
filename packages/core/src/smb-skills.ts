/**
 * AGESOMA-native SME skills, inspired by workflow concepts in Anthropic's
 * Apache-2.0 knowledge-work-plugins (small-business), not Claude runtime code.
 * Source: https://github.com/anthropics/knowledge-work-plugins/tree/main/small-business
 *
 * MVP executes ONLY local read-only tabular diagnostics (cash + lead triage).
 * The other skills are capability contracts, NOT claims of working connectors.
 */
export type SmbSkillId =
  | "smb-onboard" | "smb-router" | "business-pulse"
  | "cash-flow-snapshot" | "lead-triage" | "build-connector";
export type SmbArea = "finance" | "sales" | "operations" | "technology";
export type SmbSkill = {
  id: SmbSkillId;
  owner: "executive" | "finance" | "growth" | "product";
  state: "active_local_only" | "partial" | "planned";
  externalSideEffects: false;
  userPromise: string;
};

export const SMB_SKILLS: readonly SmbSkill[] = [
  { id: "smb-onboard", owner: "executive", state: "partial", externalSideEffects: false,
    userPromise: "Mostra uma análise local antes de pedir o perfil completo." },
  { id: "smb-router", owner: "executive", state: "partial", externalSideEffects: false,
    userPromise: "Indica um único workflow para uma necessidade comum." },
  { id: "business-pulse", owner: "executive", state: "partial", externalSideEffects: false,
    userPromise: "Resumo parcial a partir de dados efetivamente fornecidos." },
  { id: "cash-flow-snapshot", owner: "finance", state: "active_local_only", externalSideEffects: false,
    userPromise: "Soma entradas/saídas históricas de CSV; sem saldo bancário ou previsão." },
  { id: "lead-triage", owner: "growth", state: "active_local_only", externalSideEffects: false,
    userPromise: "Organiza leads fornecidos em CSV sem envio nem atualização de CRM." },
  { id: "build-connector", owner: "product", state: "partial", externalSideEffects: false,
    userPromise: "Prepara escopo de leitura e aprovação; não conecta sistemas." }
] as const;

export function skillForArea(area: SmbArea): SmbSkillId {
  return area === "finance" ? "cash-flow-snapshot"
    : area === "sales" ? "lead-triage"
    : area === "technology" ? "build-connector" : "business-pulse";
}
export function routeSmbOwnerRequest(text: string): SmbSkillId | null {
  const value = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(caixa|fluxo de caixa|despesas|contas a receber|recebiveis|pagamentos atrasados)\b/.test(value))
    return "cash-flow-snapshot";
  if (/\b(leads|clientes potenciais|prospects|prospeccao|quem (devo|preciso) ligar|prioriz(ar|e) contatos)\b/.test(value))
    return "lead-triage";
  if (/\b(integrar|conectar|integracao|sistema de gestao|meu erp)\b/.test(value))
    return "build-connector";
  if (/\b(como vai o negocio|resumo da semana|briefing|panorama da empresa)\b/.test(value))
    return "business-pulse";
  return null;
}

export type TabularData = {
  headers: string[];
  records: Record<string, string>[];
  acceptedRows: number;
};
/** Bounded CSV parser with quoted semicolons/newlines and duplicate-header checks. */
export function parseLocalCsv(input: string): TabularData {
  if (input.length === 0 || input.length > 200_000) throw new Error("Arquivo vazio ou acima de 200 KB.");
  const txt = input.replace(/^\uFEFF/, "");
  const first = txt.split(/\r?\n/, 1)[0] ?? "";
  const separator = first.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '"') {
      if (quoted && txt[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && cell === "") quoted = true;
      else if (quoted) quoted = false;
      else throw new Error("Aspas inválidas no CSV.");
    } else if (!quoted && (ch === separator || ch === "\n" || ch === "\r")) {
      row.push(cell.trim()); cell = "";
      if (ch !== separator) {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (ch === "\r" && txt[i+1] === "\n") i++;
        if (rows.length > 1001) throw new Error("Limite de 1.000 linhas por análise.");
      }
    } else cell += ch;
  }
  if (quoted) throw new Error("Aspas não fechadas.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error("Inclua cabeçalho e ao menos uma linha.");
  const headers = rows.shift()!.map((h) => h.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_"));
  if (headers.some((h) => !h) || new Set(headers).size !== headers.length) throw new Error("Cabeçalhos vazios ou repetidos.");
  if (headers.length > 20) throw new Error("Use até 20 colunas.");
  for (const r of rows) if (r.length !== headers.length) throw new Error("Linhas com quantidades diferentes de colunas.");
  return {
    headers,
    acceptedRows: rows.length,
    records: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
  };
}

function field(record: Record<string,string>, ...names: string[]) {
  for(const name of names) if (Object.prototype.hasOwnProperty.call(record,name)) return record[name];
  return undefined;
}
function moneyCents(raw: string): number {
  let value = raw.trim().replace(/^R\$\s?/, "").replace(/\s/g, "");
  if (!value || /[^0-9.,-]/.test(value) || value.startsWith("-")) throw new Error("Valor monetário inválido.");
  if (value.includes(",") && value.includes(".")) value = value.replace(/\./g,"").replace(",",".");
  else if (value.includes(",")) value = value.replace(",",".");
  if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(value)) throw new Error("Use valores com até duas casas decimais.");
  const [major, minor = ""] = value.split(".");
  const cents = Number(major)*100 + Number(minor.padEnd(2,"0"));
  if (!Number.isSafeInteger(cents) || cents > 100_000_000_000) throw new Error("Valor monetário fora do limite.");
  return cents;
}
export type CashSnapshot = {
  skill:"cash-flow-snapshot";
  source:"local_csv";
  rowCount:number;
  incomeCents:number;
  expenseCents:number;
  netChangeCents:number;
  periodStart:string;
  periodEnd:string;
  startingBalanceKnown:false;
  forecastAvailable:false;
  note:string;
};
const isoDate=(raw:string)=>{
  const s=raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+"T00:00:00Z").toISOString().slice(0,10)!==s)
    throw new Error("Datas devem estar no formato AAAA-MM-DD e ser válidas.");
  return s;
};
export function analyzeCashCsv(data: TabularData):CashSnapshot {
  if (data.acceptedRows < 1) throw new Error("CSV sem movimentos.");
  let income=0,expense=0; const dates:string[]=[];
  for(const rec of data.records) {
    const date=field(rec,"data","date");
    const kind=field(rec,"tipo","type");
    const amount=field(rec,"valor","amount");
    if (!date || !kind || amount === undefined) throw new Error("Colunas obrigatórias: data, tipo, valor.");
    const checkedDate=isoDate(date),cents=moneyCents(amount);
    const k=kind.trim().toLowerCase();
    if (["entrada","receita","income"].includes(k)) income+=cents;
    else if(["saida","despesa","expense"].includes(k)) expense+=cents;
    else throw new Error("Tipo precisa ser entrada ou saída.");
    if(!Number.isSafeInteger(income)||!Number.isSafeInteger(expense)) throw new Error("Somatório fora do limite.");
    dates.push(checkedDate);
  }
  dates.sort();
  return {
    skill:"cash-flow-snapshot",source:"local_csv",rowCount:dates.length,
    incomeCents:income,expenseCents:expense,netChangeCents:income-expense,
    periodStart:dates[0],periodEnd:dates[dates.length-1],
    startingBalanceKnown:false,forecastAvailable:false,
    note:"Mudança líquida dos lançamentos informados, não saldo bancário, lucro contábil nem previsão."
  };
}

export type LeadRow = {
  name:string;
  company:string;
  status:string;
  lastContact:string | null;
  daysSinceContact:number | null;
  score:number | null;
};
export type LeadSnapshot = {
  skill:"lead-triage";
  source:"local_csv";
  rowCount:number;
  hasRanking:boolean;
  leads:LeadRow[];
  note:string;
};
export function analyzeLeadCsv(data:TabularData, todayIso:string):LeadSnapshot {
  const today=isoDate(todayIso);
  const now=Date.parse(today+"T00:00:00Z");
  if (data.acceptedRows < 1) throw new Error("CSV sem leads.");
  const rows:LeadRow[]=data.records.map(rec=>{
    const name=field(rec,"nome","name");
    const company=field(rec,"empresa","company")??"Não informada";
    const status=(field(rec,"status","etapa","stage")??"").toLowerCase().trim();
    const contact=field(rec,"ultimo_contato","last_contact","ultima_atividade")??"";
    if(!name?.trim())throw new Error("Coluna nome é obrigatória.");
    if(!status)throw new Error("Coluna status/etapa é obrigatória.");
    const lastContact=contact?isoDate(contact):null;
    const days=lastContact?Math.floor((now-Date.parse(lastContact+"T00:00:00Z"))/86_400_000):null;
    if(days!==null&&days<0)throw new Error("Último contato não pode estar no futuro.");
    const urgency = /urgente|quente|proposta|negociacao|negociação/.test(status) ? 30
      : /interessado|qualificado|reuniao|reunião/.test(status) ? 20 : null;
    const recency=days===null?null:days>=7?10:days>=2?5:0;
    return {
      name:name.trim().slice(0,120),company:company.slice(0,120),status:status.slice(0,100),
      lastContact,daysSinceContact:days,
      score:urgency===null||recency===null?null:urgency+recency
    };
  });
  const scores=rows.map(r=>r.score).filter((s):s is number=>s!==null);
  const hasRanking=scores.length===rows.length && Math.max(...scores)-Math.min(...scores)>=10;
  if(hasRanking) rows.sort((a,b)=>(b.score??0)-(a.score??0));
  return {
    skill:"lead-triage",source:"local_csv",rowCount:rows.length,
    hasRanking,leads:rows.slice(0,8),
    note:hasRanking
      ?"Ordenação heurística para revisão humana com base no status e na data informados; não é probabilidade real de venda."
      :"Dados insuficientes para uma classificação confiável; lista na ordem original, sem ranking inventado."
  };
}

/**
 * CEO business-pulse MVP, limited to ONE owner-supplied browser-local CSV.
 * No cross-connector synthesis, forecasting or account balances claimed.
 */
export function buildLocalBusinessPulse(snapshot: CashSnapshot | LeadSnapshot): {
  source:"local_csv";
  status:"partial";
  headline:string;
  nextStep:string;
  limits:string;
} {
  if (snapshot.skill === "cash-flow-snapshot") {
    return {
      source:"local_csv", status:"partial",
      headline:snapshot.netChangeCents < 0
        ? "As saídas registradas superam as entradas no período do arquivo."
        : "Este período apresenta entradas iguais ou superiores às saídas registradas.",
      nextStep:"Conferir se todos os lançamentos foram incluídos e informar o saldo inicial antes de avaliar o caixa.",
      limits:"Amostra local, não conciliação financeira, saldo, rentabilidade ou previsão."
    };
  }
  return {
    source:"local_csv", status:"partial",
    headline:snapshot.hasRanking
      ? "Há sinais suficientes no arquivo para revisar uma ordem sugerida de contatos."
      : "O arquivo não fornece sinais suficientes para priorizar contatos automaticamente.",
    nextStep:"Verificar status e datas dos contatos e autorizar uma consulta ao CRM antes de qualquer abordagem.",
    limits:"Nenhuma mensagem foi enviada; os dados podem estar incompletos ou desatualizados."
  };
}

export type ProposedConnectorScope = {
  state:"proposal_only";
  system:string;
  readObjective:string;
  desiredPermission:"read_only";
  approvalRequired:true;
  steps:readonly string[];
};
/** Local planning only; no network, OAuth, credentials, or remote discovery. */
export function scopeReadOnlyConnector(system:string,readObjective:string):ProposedConnectorScope {
  const trimmedSystem=system.trim(),trimmedObjective=readObjective.trim();
  if(trimmedSystem.length<2||trimmedSystem.length>100 || trimmedObjective.length<10||trimmedObjective.length>300)
    throw new Error("Informe o nome do sistema e um objetivo específico de leitura.");
  if(/https?:\/\/|@|\b(password|senha|token|secret|api[_ -]?key)\b/i.test(trimmedSystem+" "+trimmedObjective))
    throw new Error("Não inclua links, credenciais, senhas ou tokens.");
  return {
    state:"proposal_only",
    system:trimmedSystem,
    readObjective:trimmedObjective,
    desiredPermission:"read_only",
    approvalRequired:true,
    steps:[
      "Verificar se existe um conector oficial ou exportação CSV do sistema escolhido.",
      "Definir escopo mínimo de leitura e revisão das informações da PME.",
      "Solicitar autorização explícita do proprietário antes de qualquer OAuth ou acesso.",
      "Testar a primeira leitura e pedir confirmação da origem e correção dos dados."
    ]
  };
}
