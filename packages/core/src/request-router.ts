export type RequestDomain = "sales" | "service" | "operations" | "finance" | "general";
export type RequestMode = "observe" | "work" | "act" | "commit";

export type RequestPlan = {
  title: string;
  originalRequest: string;
  domain: RequestDomain;
  mode: RequestMode;
  action: "business.observe" | "business.work" | "business.act" | "business.commit";
  operation: "discover" | "prepare" | "act" | "commit";
  resource: string | null;
  requiresApproval: boolean;
  steps: string[];
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function inferDomain(text: string): RequestDomain {
  if (includesAny(text, ["venda", "lead", "cliente potencial", "proposta", "pipeline", "crm", "comercial", "prospect"])) return "sales";
  if (includesAny(text, ["atendimento", "suporte", "cliente", "reclamacao", "chamado", "responder clientes", "whatsapp"])) return "service";
  if (includesAny(text, ["pagar", "pagamento", "cobranca", "financeiro", "fatura", "nota fiscal", "pix", "custo", "receita", "margem"])) return "finance";
  if (includesAny(text, ["operacao", "processo", "estoque", "fornecedor", "planilha", "arquivo", "tarefa", "rotina"])) return "operations";
  return "general";
}

function inferResource(text: string) {
  if (text.includes("whatsapp")) return "whatsapp";
  if (includesAny(text, ["agenda", "calendario", "reuniao", "meeting"])) return "calendar";
  if (text.includes("crm")) return "crm";
  if (includesAny(text, ["email", "e-mail", "mail"])) return "email";
  if (includesAny(text, ["planilha", "arquivo", "documento", "pdf", "csv"])) return "files";
  if (includesAny(text, ["site", "painel", "portal", "navegador", "web"])) return "web";
  if (includesAny(text, ["pagamento", "pagar", "pix", "fatura", "banco"])) return "finance";
  return null;
}

function inferMode(text: string): RequestMode {
  const commitTerms = [
    "pague", "pagar", "pagamento", "faca um pix", "faça um pix", "transfira", "transferir",
    "compre", "comprar", "contrate", "contratar", "assine contrato", "mude o preco", "mudar o preco",
    "altere o preco", "alterar o preco", "desconto", "condicao comercial", "condição comercial",
    "mude a senha", "alterar senha", "permissao", "permissão", "publique", "publicar"
  ];
  if (includesAny(text, commitTerms)) return "commit";

  const actTerms = [
    "responda", "responder", "envie", "enviar", "mande mensagem", "mandar mensagem", "fale com",
    "agende", "agendar", "marque reuniao", "marcar reuniao", "marque reunião", "marcar reunião",
    "atualize o crm", "atualizar o crm", "whatsapp"
  ];
  if (includesAny(text, actTerms)) return "act";

  const workTerms = [
    "crie", "criar", "prepare", "preparar", "organize", "organizar", "redija", "redigir", "elabore",
    "elaborar", "monte", "montar", "gere", "gerar", "planilha", "relatorio", "relatório", "documento"
  ];
  if (includesAny(text, workTerms)) return "work";

  return "observe";
}

function planSteps(mode: RequestMode) {
  if (mode === "commit") return [
    "Confirmar o alvo, valor, termos e escopo exatos do compromisso.",
    "Submeter a capability concreta à política e à aprovação do dono.",
    "Executar somente o compromisso aprovado e registrar evidência."
  ];
  if (mode === "act") return [
    "Reunir o contexto autorizado necessário para a ação.",
    "Resolver destinatário, recurso e parâmetros concretos.",
    "Passar pela política/aprovação aplicável antes do efeito externo.",
    "Executar e registrar evidência do resultado."
  ];
  if (mode === "work") return [
    "Reunir o contexto autorizado necessário.",
    "Produzir o trabalho de forma reversível.",
    "Entregar o artifact ou resultado preparado para revisão/uso."
  ];
  return [
    "Entender o contexto e as fontes autorizadas relevantes.",
    "Observar e reunir evidência sem criar efeitos externos.",
    "Retornar achados e propor o próximo trabalho somente se houver base real."
  ];
}

function titleFromRequest(request: string) {
  const compact = request.replace(/\s+/g, " ").trim();
  if (compact.length <= 120) return compact;
  return `${compact.slice(0, 117).trimEnd()}...`;
}

export function routeBusinessRequest(request: string): RequestPlan {
  const originalRequest = request.replace(/\s+/g, " ").trim();
  if (originalRequest.length < 3) throw new Error("Business request is too short");
  if (originalRequest.length > 4000) throw new Error("Business request is too long");

  const text = normalizeText(originalRequest);
  const mode = inferMode(text);
  const action = mode === "commit"
    ? "business.commit"
    : mode === "act"
      ? "business.act"
      : mode === "work"
        ? "business.work"
        : "business.observe";

  return {
    title: titleFromRequest(originalRequest),
    originalRequest,
    domain: inferDomain(text),
    mode,
    action,
    operation: mode === "observe" ? "discover" : mode === "work" ? "prepare" : mode,
    resource: inferResource(text),
    requiresApproval: mode === "act" || mode === "commit",
    steps: planSteps(mode)
  };
}
