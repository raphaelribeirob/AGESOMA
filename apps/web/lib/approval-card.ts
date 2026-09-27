import { buildCapabilityScope, getActionPolicy } from "@agesoma/core";

export type ApprovalTaskLike={
  id:string;
  status:string;
  action_type:string;
  payload:Record<string,unknown>;
};

const actionTitles:Record<string,string>={
  "whatsapp.send":"Enviar mensagem",
  "calendar.create":"Criar compromisso",
  "calendar.update":"Alterar compromisso",
  "email.send":"Enviar e-mail",
  "paid_media.create_campaign":"Criar campanha",
  "paid_media.create_adset":"Criar conjunto de anúncios",
  "paid_media.create_ad":"Criar anúncio",
  "paid_media.pause_campaign":"Pausar campanha",
  "paid_media.activate_campaign":"Ativar campanha",
  "paid_media.set_campaign_budget":"Alterar orçamento da campanha",
  "paid_media.set_adset_budget":"Alterar orçamento do conjunto"
};

function text(value:unknown){
  return typeof value==="string"&&value.trim()?value.trim():null;
}

export function approvalCard(task:ApprovalTaskLike){
  const policy=getActionPolicy(task.action_type);
  if(!policy) return null;
  const scope=buildCapabilityScope({taskId:task.id,action:task.action_type,payload:task.payload});
  if((policy.riskClass==="R2"||policy.riskClass==="R3")&&(!scope.destination||!scope.operation||!scope.resource)) return null;
  if(policy.riskClass==="R3"&&scope.amountCents===null) return null;

  const summary=text(task.payload.proposedSummary)
    ?? text(task.payload.objective)
    ?? "Há uma ação aguardando sua autorização.";

  return {
    taskId:task.id,
    title:actionTitles[task.action_type]??"Autorizar ação",
    summary,
    actionType:task.action_type,
    riskClass:policy.riskClass,
    destination:scope.destination,
    operation:scope.operation,
    resource:scope.resource,
    amountCents:scope.amountCents,
    parameters:task.payload.parameters&&typeof task.payload.parameters==="object"&&!Array.isArray(task.payload.parameters)
      ? task.payload.parameters as Record<string,unknown>:{}
  };
}
