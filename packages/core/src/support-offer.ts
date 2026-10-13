import {answerSupportQuestion, type SupportKnowledge} from "./support-product";

export const SUPPORT_OFFER = {
  sku:"agesoma.support.v1",
  title:"AGESOMA Atendimento",
  promise:"Atenda perguntas comuns com respostas aprovadas e encaminhe exceções para um responsável humano.",
  availableChannels:["chat_web_hospedado"],
  capabilities:["respostas_aprovadas","previsualizacao","fila_humana","protocolo_privado","avaliacoes","assinatura"],
  exclusions:["WhatsApp","e-mail automático","voz","CRM/ERP","agentes autônomos","garantia de resolução"],
  quotas:{maxFaqs:200,maxDailyMessages:200,maxHourlyMessages:40,maxDailyMessagesPerVisitor:12},
  paidActivation:"verified_paddle_subscription_and_approved_quality_gate"
} as const;

const demonstrationKnowledge:readonly SupportKnowledge[]=[
 {id:"prazo-demo",question:"Qual é o prazo de entrega?",answer:"Nesta empresa fictícia, o prazo de entrega é de cinco dias úteis.",enabled:true},
 {id:"horario-demo",question:"Qual é o horário de atendimento?",answer:"Nesta empresa fictícia, o atendimento ocorre de segunda a sexta-feira, das 9h às 18h.",enabled:true}
];

export function demonstrateSupport(question:string){
 const result=answerSupportQuestion(question,demonstrationKnowledge);
 return {
  ...result,simulation:true as const,company:"Empresa fictícia",
  externallyExecuted:false as const,
  persisted:false as const
 };
}
