/**
 * AGESOMA Workforce OS — four visible executive agents, seven officer
 * responsibilities. This is product metadata, not a permission grant,
 * instantiated worker, deployed computer or credential.
 */
export type ExecutiveTitle = "CEO" | "COO" | "CFO" | "CMO" | "CRO" | "CTO" | "CPO";

export type WorkforceProfile = {
  id: "executive" | "finance" | "growth" | "product";
  title: string;
  initials: string;
  role: string;
  positions: readonly ExecutiveTitle[];
  mission: string;
  tone: string;
  tasks: readonly string[];
  sources: readonly string[];
  boundaries: readonly string[];
};

export const WORKFORCE_PROFILES: readonly WorkforceProfile[] = [
  {
    id: "executive",
    title: "CEO + COO",
    initials: "EX",
    role: "Estratégia e Operações",
    positions: ["CEO", "COO"],
    mission: "Define direção, transforma metas em planos de execução, coordena áreas e acompanha prazos, qualidade operacional e resultados. A supervisão de atendimento fica neste núcleo.",
    tone: "#86bce8",
    tasks: [
      "Definir prioridades e metas da empresa",
      "Delegar e acompanhar a execução operacional",
      "Coordenar processos e o atendimento",
      "Consolidar relatórios e decisões"
    ],
    sources: ["Brief estratégico", "Projetos e operações", "Helpdesk e processos", "Indicadores das áreas"],
    boundaries: ["Não aprova seus próprios resultados", "Mudanças sensíveis e destrutivas exigem autorização do proprietário"]
  },
  {
    id: "finance",
    title: "CFO",
    initials: "FI",
    role: "Finanças e Rentabilidade",
    positions: ["CFO"],
    mission: "Lê receitas, despesas, caixa e margens, identifica riscos financeiros e recomenda ações para preservar rentabilidade e liquidez.",
    tone: "#a2b0cf",
    tasks: [
      "Monitorar fluxo de caixa e despesas",
      "Analisar margens, custos e rentabilidade",
      "Preparar previsões e conciliações",
      "Avaliar o impacto financeiro das iniciativas"
    ],
    sources: ["ERP e faturamento", "Faturas e documentos", "Relatórios de receita", "Orçamento autorizado"],
    boundaries: ["Sem transferências ou pagamentos automáticos", "Otimizações dependem de dados verificáveis e limites aprovados"]
  },
  {
    id: "growth",
    title: "CMO + CRO",
    initials: "GR",
    role: "Marketing e Receita",
    positions: ["CMO", "CRO"],
    mission: "Conecta marca, aquisição, funil, vendas e retenção para aumentar receita sem perder visibilidade de CAC, conversão e qualidade comercial.",
    tone: "#b7a6e4",
    tasks: [
      "Planejar posicionamento e campanhas",
      "Analisar canais, CAC e conversão",
      "Acompanhar pipeline, vendas e retenção",
      "Preparar criativos, propostas e follow-ups"
    ],
    sources: ["Analytics e anúncios", "CRM e pipeline", "Catálogo e marca", "Feedback de clientes"],
    boundaries: ["Publicação, disparos em massa e mudanças de orçamento exigem escopo explícito", "Não manipula métricas de venda nem envia mensagens sem autorização"]
  },
  {
    id: "product",
    title: "CTO + CPO",
    initials: "PR",
    role: "Tecnologia e Produto",
    positions: ["CTO", "CPO"],
    mission: "Define evolução do produto e da experiência do usuário, transforma demandas em prioridades técnicas, coordena desenvolvimento, testes, segurança e lançamentos.",
    tone: "#89cbbb",
    tasks: [
      "Priorizar roadmap e experiência do usuário",
      "Especificar e implementar melhorias técnicas",
      "Conduzir testes e monitorar qualidade",
      "Preparar releases, documentação e segurança"
    ],
    sources: ["GitHub e documentação", "Analytics de produto", "Tickets e feedback", "Testes e erros"],
    boundaries: ["Não publica alterações de produção sem aprovação", "Mudanças de infraestrutura, credenciais e dados exigem controles independentes"]
  }
] as const;

export const EXECUTIVE_TITLES: readonly ExecutiveTitle[] = [
  "CEO", "CFO", "CMO", "CTO", "CPO", "COO", "CRO"
] as const;
