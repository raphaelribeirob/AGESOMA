import type { RequestDomain, RequestPlan } from "./request-router";

export type AgentTemplateKey =
  | "sales"
  | "marketing"
  | "service"
  | "finance"
  | "operations"
  | "research";

export type AgentTemplate = {
  key: AgentTemplateKey;
  name: string;
  roleTitle: string;
  domain: RequestDomain;
  purpose: string;
  responsibilities: string[];
  skills: string[];
  preferredResources: string[];
};

export const DEFAULT_AGENT_PACKAGE: readonly AgentTemplate[] = [
  {
    key: "sales",
    name: "Agente de Vendas",
    roleTitle: "Especialista comercial digital",
    domain: "sales",
    purpose: "Aumentar receita acompanhando oportunidades, leads, propostas e follow-ups.",
    responsibilities: ["qualificar leads", "recuperar oportunidades", "preparar propostas", "acompanhar pipeline"],
    skills: ["crm", "follow-up", "propostas", "qualificação", "conversão"],
    preferredResources: ["crm", "whatsapp", "email", "calendar"]
  },
  {
    key: "marketing",
    name: "Agente de Marketing",
    roleTitle: "Especialista de crescimento digital",
    domain: "marketing",
    purpose: "Gerar demanda e melhorar aquisição usando evidências da empresa e dos canais.",
    responsibilities: ["analisar aquisição", "preparar campanhas", "avaliar canais", "produzir ativos de marketing"],
    skills: ["marketing", "campanhas", "conteúdo", "aquisição", "ads"],
    preferredResources: ["web", "files", "email"]
  },
  {
    key: "service",
    name: "Agente de Atendimento",
    roleTitle: "Especialista de relacionamento com clientes",
    domain: "service",
    purpose: "Resolver demandas de clientes com rapidez, contexto e consistência.",
    responsibilities: ["responder clientes", "acompanhar tickets", "identificar risco de churn", "organizar retornos"],
    skills: ["atendimento", "suporte", "whatsapp", "email", "retenção"],
    preferredResources: ["whatsapp", "email", "crm"]
  },
  {
    key: "finance",
    name: "Agente Financeiro",
    roleTitle: "Especialista financeiro digital",
    domain: "finance",
    purpose: "Acompanhar cobranças, recebimentos, custos e sinais financeiros que exigem ação.",
    responsibilities: ["acompanhar cobranças", "analisar recebimentos", "preparar conciliações", "sinalizar riscos financeiros"],
    skills: ["financeiro", "cobrança", "faturas", "margem", "recebimentos"],
    preferredResources: ["finance", "files", "email", "whatsapp"]
  },
  {
    key: "operations",
    name: "Agente de Operações",
    roleTitle: "Especialista de operações digitais",
    domain: "operations",
    purpose: "Fazer processos, rotinas e trabalho interno avançarem com menos coordenação manual.",
    responsibilities: ["organizar processos", "preparar documentos", "acompanhar tarefas", "resolver rotinas operacionais"],
    skills: ["operações", "processos", "documentos", "planilhas", "coordenação"],
    preferredResources: ["files", "web", "email", "calendar"]
  },
  {
    key: "research",
    name: "Agente de Pesquisa",
    roleTitle: "Analista digital da empresa",
    domain: "general",
    purpose: "Investigar perguntas abertas, comparar evidências e preparar decisões para o Jarvis.",
    responsibilities: ["pesquisar", "comparar evidências", "resumir contexto", "preparar recomendações"],
    skills: ["pesquisa", "análise", "síntese", "benchmark", "documentação"],
    preferredResources: ["web", "files"]
  }
] as const;

const byDomain = new Map<RequestDomain, AgentTemplate>(
  DEFAULT_AGENT_PACKAGE.map((agent) => [agent.domain, agent] as const)
);

export function agentTemplateForPlan(plan: RequestPlan): AgentTemplate {
  return byDomain.get(plan.domain) ?? DEFAULT_AGENT_PACKAGE.find((agent) => agent.key === "research")!;
}

export function agentTemplateByKey(key: string): AgentTemplate | null {
  return DEFAULT_AGENT_PACKAGE.find((agent) => agent.key === key) ?? null;
}
