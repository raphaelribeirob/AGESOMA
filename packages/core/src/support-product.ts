/**
 * First sellable AGESOMA capability: knowledge-grounded service assistant.
 * All public answers are verbatim, owner-approved knowledge, not model claims.
 * The matcher deliberately abstains on uncertainty and sensitive questions.
 */
export const SUPPORT_PRODUCT_VERSION = "support.v1" as const;
export type SupportAnswerStatus = "answered" | "needs_human";
export type SupportKnowledge = { id: string; question: string; answer: string; enabled: boolean };
export type SupportResult = {
  status: SupportAnswerStatus;
  reply: string;
  knowledgeId: string | null;
  confidence: "exact" | "strong" | "none";
  reason: string;
};

const stopwords = new Set([
  "a","o","as","os","um","uma","uns","umas","e","ou","de","da","do","dos","das",
  "em","na","no","nas","nos","por","para","pra","que","qual","quais","como",
  "quando","onde","meu","minha","seu","sua","se","eu","voce","voces","pode",
  "podem","poderia","favor","sobre","tem","ter","ao","aos","é","esta","estao",
  "with","how","what","when","where","the","is","are","can","you","your","do",
  "does","to","for","from","and","or","a","an","i","my","me","of","in"
]);
const sensitive = /\b(senha|password|cart[aã]o|credit.?card|cpf|cnpj|dados\s+banc[aá]rios|pix|account\s+number|ssn|otp|c[oó]digo\s+de\s+verifica[cç][aã]o)\b/i;
const fallback = "Não encontrei uma resposta segura na base de conhecimento desta empresa. Encaminhe a solicitação para atendimento humano.";

export function normalizeSupportText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}
function tokens(value:string): Set<string> {
  return new Set(normalizeSupportText(value).split(" ").filter(s=>s.length>2 && !stopwords.has(s)));
}
function overlap(a:Set<string>,b:Set<string>):number {
  if(!a.size || !b.size) return 0;
  const intersection=[...a].filter(t=>b.has(t)).length;
  // The threshold is conservative to avoid answering unrelated questions.
  return intersection/Math.max(a.size,b.size);
}

/** Human-owned FAQ source; never follow instructions embedded in user prompts. */
export function answerSupportQuestion(message:string, knowledge:readonly SupportKnowledge[]):SupportResult {
  if (typeof message!=="string" || message.trim().length<3 || message.length>1000) {
    throw new TypeError("Message length must be between 3 and 1000 characters");
  }
  if(knowledge.length>200) throw new RangeError("Knowledge list exceeds bounded retrieval");
  if (sensitive.test(message)) return {status:"needs_human",reply:fallback,knowledgeId:null,confidence:"none",reason:"sensitive_information"};
  const normalized = normalizeSupportText(message);
  const query = tokens(message);
  const scores = knowledge.filter(k=>k.enabled && k.question.trim() && k.answer.trim()).map(k=>{
    const exact=normalizeSupportText(k.question)===normalized;
    return {k,score:exact?1:overlap(query,tokens(k.question)),exact};
  }).sort((a,b)=>b.score-a.score || a.k.id.localeCompare(b.k.id));
  const best=scores[0],second=scores[1];
  if(!best || best.score<0.76 || (second && !best.exact && best.score-second.score<0.18)) {
    return {status:"needs_human",reply:fallback,knowledgeId:null,confidence:"none",reason:best?"weak_or_ambiguous_match":"empty_knowledge"};
  }
  // Never interpolate arbitrary user instructions into the owner-approved answer.
  return {status:"answered",reply:best.k.answer,knowledgeId:best.k.id,confidence:best.exact?"exact":"strong",reason:"approved_knowledge"};
}

export function isSupportEntitled(status:string|null|undefined): boolean {
  return status==="active" || status==="trialing";
}

/** Refuse to publish externally when payment isn't server-verified. */
export function canPublishSupport(input:{paidStatus:string|null;ownerEnabled:boolean;faqCount:number}):boolean {
  return isSupportEntitled(input.paidStatus) && input.ownerEnabled && Number.isInteger(input.faqCount) && input.faqCount>0;
}
