import type { RequestDomain, RequestMode, WatchCadence } from "./types";
import { includesAny } from "./text";

export function inferDomain(text: string): RequestDomain {
  if (includesAny(text, [
    "trafego pago", "tráfego pago", "paid media", "meta ads", "facebook ads",
    "instagram ads", "google ads", "gestor de trafego", "gestor de tráfego",
    "midia paga", "mídia paga", "campanha paga", "campanhas pagas"
  ])) return "paid_media";
  if (includesAny(text, ["venda", "vender", "vendendo", "lead", "cliente potencial", "proposta", "pipeline", "crm", "comercial", "prospect"])) return "sales";
  if (includesAny(text, ["marketing", "campanha", "anuncio", "anúncio", "ads", "criativo", "conteudo", "conteúdo", "aquisição", "aquisicao", "trafego", "tráfego", "instagram", "tiktok", "seo"])) return "marketing";
  if (includesAny(text, ["atendimento", "suporte", "cliente", "reclamacao", "chamado", "responder clientes", "whatsapp"])) return "service";
  if (includesAny(text, ["pagar", "pagamento", "cobranca", "financeiro", "fatura", "nota fiscal", "pix", "custo", "receita", "margem"])) return "finance";
  if (includesAny(text, ["operacao", "processo", "estoque", "fornecedor", "planilha", "arquivo", "tarefa", "rotina", "equipe", "funcionario"])) return "operations";
  return "general";
}

export function inferResource(text: string) {
  if (includesAny(text, ["meta ads", "facebook ads", "instagram ads"])) return "facebook";
  if (text.includes("google ads")) return "google_ads";
  if (includesAny(text, ["trafego pago", "tráfego pago", "paid media", "midia paga", "mídia paga"])) return "paid_media";
  if (text.includes("whatsapp")) return "whatsapp";
  if (includesAny(text, ["agenda", "calendario", "reuniao", "meeting"])) return "calendar";
  if (text.includes("crm")) return "crm";
  if (includesAny(text, ["email", "e-mail", "mail"])) return "email";
  if (includesAny(text, ["planilha", "arquivo", "documento", "pdf", "csv"])) return "files";
  if (includesAny(text, ["site", "painel", "portal", "navegador", "web"])) return "web";
  if (includesAny(text, ["pagamento", "pagar", "pix", "fatura", "banco"])) return "finance";
  return null;
}

export function inferMode(text: string): RequestMode {
  const commitTerms = [
    "pague", "pagar", "pagamento", "faca um pix", "faça um pix", "transfira", "transferir",
    "compre", "comprar", "contrate", "contratar", "assine contrato", "mude o preco", "mudar o preco",
    "altere o preco", "alterar o preco", "desconto", "condicao comercial", "condição comercial",
    "mude a senha", "alterar senha", "permissao", "permissão", "publique", "publicar",
    "aumente o orcamento", "aumentar o orcamento", "mude o orcamento", "mudar o orcamento",
    "altere o orcamento", "alterar o orcamento", "ative a campanha", "ativar a campanha"
  ];
  if (includesAny(text, commitTerms)) return "commit";

  const actTerms = [
    "responda", "responder", "envie", "enviar", "mande mensagem", "mandar mensagem", "fale com",
    "agende", "agendar", "marque reuniao", "marcar reuniao", "marque reunião", "marcar reunião",
    "atualize o crm", "atualizar o crm", "whatsapp",
    "pause a campanha", "pausar a campanha", "pause o anuncio", "pausar o anuncio"
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

export function inferWatch(text: string): { watch: boolean; cadence: WatchCadence | null } {
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

export function planSteps(mode: RequestMode, watch: boolean) {
  const recurring = watch
    ? " Manter acompanhamento recorrente na cadência solicitada."
    : "";

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
    "Entender o estado atual e reunir evidências relevantes.",
    "Identificar o que precisa acontecer e qual capacidade deve assumir.",
    `Trazer ao usuário somente o que exigir decisão ou mudança de prioridade.${recurring}`
  ];
}
