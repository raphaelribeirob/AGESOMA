/**
 * CEO-first experience for small-business owners.
 * A deterministic, source-attributed briefing, NOT an AI inference, market
 * forecast, validated audit or proof of operational execution.
 */
export type OwnerProfile = {
  companyName: string;
  website: string;
  sector: string;
  offer: string;
  customers: string;
  operations: string;
  challenge: string;
  objective: string;
};
export type ExecutiveId = "executive" | "finance" | "growth" | "product";
export type CeoNextStep = {
  id: string;
  owner: ExecutiveId;
  title: string;
  description: string;
  needs: string;
  authorization: "proposal_only";
};
export type CeoBrief = {
  kind: "owner_supplied_context";
  verifiedExternally: false;
  canExecuteAutomatically: false;
  greeting: string;
  businessSummary: string;
  primaryObjective: string;
  presentChallenge: string;
  followUpQuestions: readonly string[];
  proposals: readonly CeoNextStep[];
};

export function buildCeoBrief(profile: OwnerProfile, ownerConfirmed: boolean): CeoBrief | null {
  if (!ownerConfirmed) return null;
  // Never claim verified revenue, customer counts, profitability or live alerts.
  const name = profile.companyName.trim();
  const sector = profile.sector.trim();
  const offer = profile.offer.trim();
  const customers = profile.customers.trim();
  const objective = profile.objective.trim();
  const challenge = profile.challenge.trim();
  const operations = profile.operations.trim();
  if (![name, sector, offer, customers, operations, challenge, objective].every(Boolean)) return null;

  const proposals: readonly CeoNextStep[] = [
    {
      id: "map_operations", owner: "executive",
      title: "Organizar o processo principal",
      description: "Descrever o fluxo operacional e identificar onde faltam responsáveis, etapas ou indicadores.",
      needs: "Revisão do dono e evidências sobre os processos.",
      authorization: "proposal_only"
    },
    {
      id: "cash_baseline", owner: "finance",
      title: "Preparar diagnóstico de caixa",
      description: "Solicitar receitas, custos e despesas autorizados para um panorama financeiro.",
      needs: "Dados financeiros legítimos, período e autorização de leitura; nenhum pagamento.",
      authorization: "proposal_only"
    },
    {
      id: "customer_funnel", owner: "growth",
      title: "Mapear aquisição e vendas",
      description: "Entender os canais de entrada dos clientes e as etapas do funil comercial.",
      needs: "Fonte de leads/vendas e autorização explícita de acesso; nenhuma campanha publicada.",
      authorization: "proposal_only"
    },
    {
      id: "technology_inventory", owner: "product",
      title: "Revisar sistemas e experiência",
      description: "Listar ferramentas utilizadas e pontos de atrito de produto ou atendimento.",
      needs: "Inventário de sistemas e acesso somente leitura antes de qualquer alteração.",
      authorization: "proposal_only"
    }
  ];

  const followUpQuestions = [
    "Qual indicador mostra se sua prioridade está avançando?",
    "Qual é a tarefa repetitiva que mais consome horas da sua equipe?",
    "Quais dados e sistemas podemos consultar com sua autorização?"
  ];

  return {
    kind: "owner_supplied_context",
    verifiedExternally: false,
    canExecuteAutomatically: false,
    greeting: `Conheci o perfil declarado de ${name}. Vamos organizar o que importa primeiro.`,
    businessSummary: `${name} atua em ${sector}. Oferta informada: ${offer}. Clientes descritos: ${customers}.`,
    primaryObjective: objective,
    presentChallenge: challenge,
    followUpQuestions,
    proposals
  };
}
