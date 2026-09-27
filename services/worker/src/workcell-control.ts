import { createHmac } from "node:crypto";

export type WorkcellService = "hermes" | "broker" | "egress";

function tenantUrl(template:string,tenantId:string,name:string){
  if(!template.includes("{tenantId}")) throw new Error(`${name} must contain {tenantId}`);
  return template.replaceAll("{tenantId}",encodeURIComponent(tenantId)).replace(/\/$/,"");
}

function directTemplate(service:WorkcellService){
  if(service==="hermes") return process.env.HERMES_BASE_URL_TEMPLATE?.trim()??"";
  if(service==="broker") return process.env.CREDENTIAL_BROKER_BASE_URL_TEMPLATE?.trim()??"";
  return process.env.EGRESS_GATEWAY_BASE_URL_TEMPLATE?.trim()??"";
}

export function workcellControlToken(tenantId:string){
  const master=process.env.WORKCELL_CONTROL_MASTER_SECRET?.trim();
  const template=process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE?.trim();
  if(!master||!template) return null;
  return createHmac("sha256",master).update(`workcell-control:${tenantId}`).digest("hex");
}

export function resolveWorkcellServiceBaseUrl(tenantId:string,service:WorkcellService){
  const gatewayTemplate=process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE?.trim();
  const gatewayToken=workcellControlToken(tenantId);
  if(gatewayTemplate&&gatewayToken){
    return `${tenantUrl(gatewayTemplate,tenantId,"WORKCELL_CONTROL_BASE_URL_TEMPLATE")}/v1/${service}`;
  }

  if(process.env.AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK==="true"){
    const template=directTemplate(service);
    if(template) return tenantUrl(template,tenantId,`${service.toUpperCase()}_BASE_URL_TEMPLATE`);
    if(service==="hermes"&&process.env.AGESOMA_ALLOW_SHARED_HERMES==="true"){
      const shared=process.env.HERMES_BASE_URL?.trim();
      if(shared) return shared.replace(/\/$/,"");
    }
  }

  throw new Error("Work Cell control gateway is required; direct tenant-network access is disabled");
}

export function workcellControlHeaders(tenantId:string): Record<string,string> {
  const token=workcellControlToken(tenantId);
  if (!token) return {};
  return {"x-agesoma-workcell-token":token};
}
