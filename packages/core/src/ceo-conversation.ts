/**
 * CEO-first owner conversation: deterministic answers from a single explicitly
 * confirmed company profile. Never executes work, estimates money or claims
 * any observation by ERP/CRM, website crawler, browser or AI model.
 */
export type ConfirmedCompanySummary = {
  companyName: string;
  sector: string;
  offer: string;
  customers: string;
  operations: string;
  challenge: string;
  objective: string;
  website?: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const companyTopics = /\b(minha empresa|meu negocio|nosso negocio|sobre a empresa|sobre o negocio|o que vendemos|quem sao (nossos|meus) clientes|qual (a |o )?(nossa |meu )?(prioridade|objetivo)|como (esta|vai) (a |minha |nossa )?empresa|diagnostico (da empresa|do negocio)|resumo (da empresa|do negocio)|contexto (da empresa|do negocio)|o que voce sabe (sobre|da) (a |minha |nossa )?(empresa|negocio)|o que aprendeu (sobre|da) (a |minha |nossa )?(empresa|negocio))\b/;

export function isCeoBusinessQuestion(message: string): boolean {
  return companyTopics.test(normalize(message));
}

export function answerCeoBusinessQuestion(
  question: string,
  profile: ConfirmedCompanySummary | null
): string {
  if (!profile) {
    return "Antes de coordenar sua empresa, preciso conhecê-la. Abra a etapa 'Começar pelo CEO' em /workforce/ceo, preencha o mapa empresarial e confirme as informações. Até lá não vou iniciar tarefas automáticas.";
  }

  const n = normalize(question);
  const provenance = "Fonte: informações declaradas e confirmadas pelo responsável. Ainda não verificadas em sistemas externos.";
  if (/clientes|publico/.test(n)) {
    return `Você informou que os clientes de ${profile.companyName} são: ${profile.customers}\n\n${provenance}`;
  }
  if (/prioridade|objetivo/.test(n)) {
    return `Seu objetivo declarado: ${profile.objective}\n\nPrincipal dificuldade informada: ${profile.challenge}\n\nAinda não tenho indicadores atuais para confirmar o progresso. ${provenance}`;
  }
  if (/o que vendemos|produtos|servicos|oferta/.test(n)) {
    return `Sua empresa informou esta oferta: ${profile.offer}\n\n${provenance}`;
  }
  return [
    `Conheço o ponto de partida declarado de ${profile.companyName}.`,
    `Setor: ${profile.sector}.`,
    `O que vende: ${profile.offer}`,
    `Clientes: ${profile.customers}`,
    `Operação: ${profile.operations}`,
    `Dificuldade prioritária: ${profile.challenge}`,
    `Objetivo do dono: ${profile.objective}`,
    "",
    "Posso ajudar a estruturar metas e propostas para CFO, CMO+CRO e CTO+CPO. Ainda não tenho acesso automático a dados financeiros, CRM ou ERP; não vou afirmar resultados que não observei.",
    provenance
  ].join("\n");
}
