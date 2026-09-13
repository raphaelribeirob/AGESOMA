export type RequestDomain = "sales" | "service" | "operations" | "finance" | "general";
export type RequestMode = "observe" | "work" | "act" | "commit";
export type WatchCadence = "15m" | "1h" | "6h" | "1d" | "7d";
export type LegacyWorkMethod = { stages: string[]; successSignals: string[] };

export type RequestPlan = {
  title: string;
  originalRequest: string;
  domain: RequestDomain;
  mode: RequestMode;
  action: "business.observe" | "business.work" | "business.act" | "business.commit";
  operation: "discover" | "prepare" | "act" | "commit";
  resource: string | null;
  requiresApproval: boolean;
  watch: boolean;
  cadence: WatchCadence | null;
  steps: string[];
  workMethod: LegacyWorkMethod | null;
};

export type TeamMemberForCoordination = {
  id: string;
  name: string;
  roleTitle: string;
  department?: string | null;
  responsibilities?: string[];
  skills?: string[];
  availability?: string;
};

export type ExecutorDecision = {
  executorType: "human" | "hermes";
  teamMemberId: string | null;
  teamMemberName: string | null;
  reason: string;
  confidence: number;
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
  if (includesAny(text, ["venda", "vender", "vendendo", "lead", "cliente potencial", "proposta", "pipeline", "crm", "comercial", "prospect"])) return "sales";
  if (includesAny(text, ["atendimento", "suporte", "cliente", "reclamacao", "chamado", "responder clientes", "whatsapp"])) return "service";
  if (includesAny(text, ["pagar", "pagamento", "cobranca", "financeiro", "fatura", "nota fiscal", "pix", "custo", "receita", "margem"])) return "finance";
  if (includesAny(text, ["operacao", "processo", "estoque", "fornecedor", "planilha", "arquivo", "tarefa", "rotina", "equipe", "funcionario"])) return "operations";
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
    "elaborar", "monte", "montar", "gere", "gerar", "planilha", "relatorio", "relatório", "documento",
    "distribua", "distribuir", "delegue", "delegar", "priorize", "priorizar"
  ];
  if (includesAny(text, workTerms)) return "work";

  return "observe";
}

function inferWatch(text: string): { watch: boolean; cadence: WatchCadence | null } {
  const watch = includesAny(text, [
    "monitore", "monitorar", "monitorando", "acompanhe", "acompanhar", "acompanhando",
    "fique de olho", "continuamente", "continue observando", "continue acompanhando",
    "todo dia", "todos os dias", "diariamente", "toda hora", "a cada hora",
    "toda semana", "semanalmente", "sempre que"
  ]);
  if (!watch) return { watch: false, cadence: null };
  if (includesAny(text, ["a cada 15 minutos", "cada 15 minutos", "15 min"])) return { watch: true, cadence: "15m" };
  if (includesAny(text, ["toda hora", "a cada hora", "de hora em hora"])) return { watch: true, cadence: "1h" };
  if (includesAny(text, ["todo dia", "todos os dias", "diariamente", "diario", "diária", "diaria"])) return { watch: true, cadence: "1d" };
  if (includesAny(text, ["toda semana", "semanalmente", "semanal"])) return { watch: true, cadence: "7d" };
  return { watch: true, cadence: "6h" };
}

function planSteps(mode: RequestMode, watch: boolean) {
  const recurring = watch ? " Manter acompanhamento recorrente na cadência solicitada." : "";
  if (mode === "commit") return [
    "Confirmar responsável, alvo, valor, termos e escopo exatos.",
    "Submeter a decisão concreta à política e à aprovação do dono.",
    `Executar somente o compromisso aprovado e registrar evidência.${recurring}`
  ];
  if (mode === "act") return [
    "Entender quem é o melhor responsável pelo trabalho.",
    "Resolver destinatário, recurso e parâmetros concretos.",
    "Passar pela política/aprovação aplicável antes do efeito externo.",
    `Executar ou atribuir e acompanhar até a conclusão.${recurring}`
  ];
  if (mode === "work") return [
    "Entender o trabalho e a responsabilidade necessária.",
    "Executar digitalmente ou atribuir à pessoa adequada.",
    `Acompanhar até a entrega e registrar o resultado.${recurring}`
  ];
  return [
    "Entender o estado atual da empresa e da equipe.",
    "Identificar o que precisa acontecer e quem deve assumir.",
    `Trazer ao dono somente o que exigir decisão ou mudança de prioridade.${recurring}`
  ];
}

function titleFromRequest(request: string) {
  const compact = request.replace(/\s+/g, " ").trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117).trimEnd()}...`;
}

function memberWords(member: TeamMemberForCoordination) {
  return normalizeText([member.roleTitle, member.department ?? "", ...(member.responsibilities ?? []), ...(member.skills ?? [])].join(" "));
}

export function decideExecutor(plan: RequestPlan, members: TeamMemberForCoordination[]): ExecutorDecision {
  const active = members.filter((member) => !member.availability || member.availability === "active");
  const request = normalizeText(plan.originalRequest);

  for (const member of active) {
    const name = normalizeText(member.name);
    if (name.length >= 2 && request.includes(name)) {
      return { executorType: "human", teamMemberId: member.id, teamMemberName: member.name, reason: "Pessoa indicada no pedido.", confidence: 1 };
    }
  }

  const requestWords = new Set(normalizeText(`${plan.originalRequest} ${plan.domain}`).split(/[^a-z0-9]+/).filter((word) => word.length >= 3));
  const ranked = active.map((member) => {
    const description = memberWords(member);
    let score = 0;
    for (const word of requestWords) if (description.includes(word)) score += 1;
    return { member, score };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (best && best.score > 0 && (plan.mode === "act" || plan.mode === "commit")) {
    return {
      executorType: "human",
      teamMemberId: best.member.id,
      teamMemberName: best.member.name,
      reason: "Melhor correspondência entre responsabilidade e trabalho.",
      confidence: Math.min(0.9, 0.6 + best.score * 0.1)
    };
  }

  return {
    executorType: "hermes",
    teamMemberId: null,
    teamMemberName: null,
    reason: "Trabalho digital, de preparação ou de coordenação executado pela AGESOMA.",
    confidence: 0.85
  };
}

export function routeBusinessRequest(request: string): RequestPlan {
  const originalRequest = request.replace(/\s+/g, " ").trim();
  if (originalRequest.length < 3) throw new Error("Business request is too short");
  if (originalRequest.length > 4000) throw new Error("Business request is too long");

  const text = normalizeText(originalRequest);
  const mode = inferMode(text);
  const monitoring = inferWatch(text);
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
    watch: monitoring.watch,
    cadence: monitoring.cadence,
    steps: planSteps(mode, monitoring.watch),
    workMethod: null
  };
}
