/**
 * AGESOMA / Wonderful-inspired reusable runtime capability.
 * The declaration is used by both real message processing and release evals.
 * It does not imply any external ERP/CRM connector or general-purpose LLM.
 */
export const SUPPORT_SKILL={
 id:"agesoma.support.faq-human-handoff",
 version:"1.0.0",
 entrypoint:"answerSupportQuestion",
 sourceOfTruth:"tenant_owner_approved_knowledge",
 tools:["knowledge.lookup","human_ticket.open","human_ticket.respond"],
 decisionClasses:["answered","needs_human"],
 sideEffects:["internal_ticket_insert_only"],
 externalActions:"none",
 requiredEvalCases:["answered","needs_human"],
 releasePolicy:"fail_closed_on_evals_or_content_change"
} as const;
export const SUPPORT_SKILL_VERSION=SUPPORT_SKILL.id+"@"+SUPPORT_SKILL.version;

export interface ReleaseEvidence {
 content_version:number|string;
 skill_version:string;
 cases_count:number;
 passed_count:number;
 details:unknown;
}
export function supportReleaseAssessment(currentVersion:number|string|undefined, evidence:ReleaseEvidence|null|undefined){
 if(currentVersion===undefined||currentVersion===null||!evidence){
  return {ready:false,reason:"no_verified_evaluation"} as const;
 }
 const current=Number(currentVersion);
 const runVersion=Number(evidence.content_version);
 if(!Number.isSafeInteger(current)||current<1||!Number.isSafeInteger(runVersion)||runVersion!==current){
  return {ready:false,reason:"content_changed_since_evaluation"} as const;
 }
 if(evidence.skill_version!==SUPPORT_SKILL_VERSION){
  return {ready:false,reason:"skill_version_not_evaluated"} as const;
 }
 if(!Number.isInteger(evidence.cases_count)||evidence.cases_count<2||
    evidence.passed_count!==evidence.cases_count){
  return {ready:false,reason:"quality_criteria_not_met"} as const;
 }
 if(!Array.isArray(evidence.details)||evidence.details.length!==evidence.cases_count){
  return {ready:false,reason:"missing_evaluation_evidence"} as const;
 }
 const rows=evidence.details;
 const hasAnswer=rows.some((row:unknown)=>
  Boolean(row&&typeof row==="object"&&
   (row as {expected?:string}).expected==="answered"&&(row as {passed?:boolean}).passed===true));
 const hasAbstain=rows.some((row:unknown)=>
  Boolean(row&&typeof row==="object"&&
   (row as {expected?:string}).expected==="needs_human"&&(row as {passed?:boolean}).passed===true));
 return hasAnswer&&hasAbstain
  ?{ready:true,reason:"passed_release_evaluations"} as const
  :{ready:false,reason:"missing_positive_or_negative_case"} as const;
}
