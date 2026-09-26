import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { isIP } from "node:net";
import {
  buildCapabilityScope,
  matchAutonomyRule,
  serializeCapabilityScope,
  type AutonomyRule,
  type CapabilityScope
} from "@agesoma/core";

type Taint="clean"|"public"|"personal"|"sensitive"|"credential";
type Effect="read"|"control"|"write"|"commit";
type Decision="ALLOW"|"REVIEW"|"DENY";

type AuthorizeRequest={
  tenantId:string;taskId:string;destination:string;operation:string;method:string;
  path?:string;protocol?:string;resolvedIp:string;effect:Effect;dataTaint?:Taint;
  containsUserData?:boolean;grantRef?:string|null;capabilityHash?:string|null;
  requestMeta?:Record<string,unknown>;
};

type TaskRow={
  id:string;action_type:string|null;risk_class:string;status:string;data_taint:Taint;
  payload:Record<string,unknown>;
};

type ContextResponse={
  task:TaskRow|null;
  approvalGrant:null|Record<string,unknown>;
  autonomyGrant:null|Record<string,unknown>;
  autonomyRules:Array<Record<string,unknown>>;
};

const port=Number(process.env.PORT??8081);
const serviceToken=process.env.SENTINEL_SERVICE_TOKEN?.trim()??"";
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const trustStoreUrl=(process.env.TRUST_STORE_URL??"http://trust-store:8084").replace(/\/$/,"");
const trustStoreToken=process.env.TRUST_STORE_TENANT_TOKEN?.trim()??"";
const controlHosts=new Set(
  (process.env.SENTINEL_CONTROL_HOSTS??"api.steel.dev")
    .split(",").map((item)=>item.trim().toLowerCase()).filter(Boolean)
);

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

function sameSecret(a:string,b:string){
  const left=Buffer.from(a); const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function authorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-sentinel-token"];
  return typeof supplied==="string"&&sameSecret(supplied,serviceToken);
}

async function readBody(req:IncomingMessage){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>128*1024) throw new Error("request_too_large");chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function parse(value:unknown):AuthorizeRequest{
  if(!value||typeof value!=="object"||Array.isArray(value)) throw new Error("invalid_request");
  const input=value as Record<string,unknown>;
  for(const key of ["tenantId","taskId","destination","operation","method","resolvedIp","effect"]){
    if(typeof input[key]!=="string"||!(input[key] as string).trim()) throw new Error("invalid_request");
  }
  const effect=String(input.effect) as Effect;
  if(!["read","control","write","commit"].includes(effect)) throw new Error("invalid_effect");
  const dataTaint=typeof input.dataTaint==="string"?input.dataTaint as Taint:undefined;
  if(dataTaint&&!["clean","public","personal","sensitive","credential"].includes(dataTaint)) throw new Error("invalid_taint");
  return {
    tenantId:String(input.tenantId),taskId:String(input.taskId),destination:String(input.destination),
    operation:String(input.operation),method:String(input.method).toUpperCase(),
    path:typeof input.path==="string"?input.path:undefined,
    protocol:typeof input.protocol==="string"?input.protocol:undefined,
    resolvedIp:String(input.resolvedIp),effect,dataTaint,
    containsUserData:input.containsUserData===true,
    grantRef:typeof input.grantRef==="string"?input.grantRef:null,
    capabilityHash:typeof input.capabilityHash==="string"?input.capabilityHash:null,
    requestMeta:input.requestMeta&&typeof input.requestMeta==="object"&&!Array.isArray(input.requestMeta)
      ? input.requestMeta as Record<string,unknown>:{}
  };
}

function unsafeIp(address:string){
  if(isIP(address)===4){
    const [a,b]=address.split(".").map(Number);
    return a===0||a===10||a===127||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||
      (a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===198&&(b===18||b===19))||a>=224;
  }
  if(isIP(address)===6){
    const ip=address.toLowerCase();
    return ip==="::"||ip==="::1"||ip.startsWith("fc")||ip.startsWith("fd")||/^fe[89ab]/.test(ip);
  }
  return true;
}

async function trust(path:string,body:Record<string,unknown>){
  const response=await fetch(`${trustStoreUrl}${path}`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-trust-token":trustStoreToken},
    body:JSON.stringify({tenantId,...body}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok) throw new Error(`trust_store_rejected:${response.status}`);
  return result;
}

async function context(input:AuthorizeRequest){
  return await trust("/v1/sentinel/context",{taskId:input.taskId,grantRef:input.grantRef??null}) as ContextResponse;
}

function hashScope(scope:CapabilityScope){
  return createHash("sha256").update(serializeCapabilityScope(scope)).digest("hex");
}

function number(value:unknown){
  const parsed=typeof value==="number"?value:Number(value);
  return Number.isFinite(parsed)?parsed:null;
}

function autonomyRule(raw:Record<string,unknown>):AutonomyRule|null{
  if(typeof raw.id!=="string"||typeof raw.action_class!=="string") return null;
  return {
    id:raw.id,
    actionClass:raw.action_class,
    destination:typeof raw.destination==="string"?raw.destination:null,
    operation:typeof raw.operation==="string"?raw.operation:null,
    resourcePattern:typeof raw.resource_pattern==="string"?raw.resource_pattern:null,
    decision:raw.decision==="DENY"?"DENY":"ALLOW",
    maxAmountCents:number(raw.max_amount_cents),
    expiresAt:raw.expires_at?new Date(String(raw.expires_at)):null,
    revokedAt:raw.revoked_at?new Date(String(raw.revoked_at)):null
  };
}

function normalizedPhone(value:unknown){
  return typeof value==="string"?value.replace(/\D/g,""):"";
}

function object(value:unknown){
  return value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:null;
}

function text(value:unknown){
  return typeof value==="string"&&value.trim()?value.trim():null;
}

function sha(value:string){
  return createHash("sha256").update(value).digest("hex");
}

function equalScalar(a:unknown,b:unknown){
  if(typeof a==="number"||typeof b==="number") return number(a)===number(b);
  return JSON.stringify(a)===JSON.stringify(b);
}

function approvedParamsCovered(actual:Record<string,unknown>,approved:Record<string,unknown>){
  for(const [key,value] of Object.entries(approved)){
    if(!Object.prototype.hasOwnProperty.call(actual,key)||!equalScalar(actual[key],value)) return false;
  }
  for(const [key,value] of Object.entries(actual)){
    if(Object.prototype.hasOwnProperty.call(approved,key)) continue;
    if(key==="status"&&String(value).toLowerCase()==="paused") continue;
    return false;
  }
  return true;
}

function concreteRequestMatches(input:AuthorizeRequest,task:TaskRow,scope:CapabilityScope){
  const meta=input.requestMeta??{};
  if(input.operation==="whatsapp.send"){
    if(String(scope.resource??"").toLowerCase()!=="whatsapp") return false;
    const allowedOps=new Set(["send","send_message","send_text","message"]);
    if(!scope.operation||!allowedOps.has(scope.operation.toLowerCase())) return false;
    if(normalizedPhone(meta.recipient)!==normalizedPhone(scope.destination)) return false;
    const parameters=object(task.payload.parameters)??{};
    const message=text(parameters.text)??text(parameters.message);
    return Boolean(message)&&meta.messageSha256===sha(message!);
  }

  if(input.operation==="paid_media.write"){
    if(!task.action_type?.startsWith("paid_media.")) return false;
    if(text(meta.account)!==scope.destination) return false;
    if(text(meta.providerAction)!==scope.operation) return false;
    const actual=object(meta.providerParams)??{};
    const approved=object(task.payload.parameters)??{};
    if(!approvedParamsCovered(actual,approved)) return false;
    if(["set_campaign_budget","set_adset_budget"].includes(scope.operation??"")){
      return scope.amountCents!=null&&number(actual.amount)===scope.amountCents;
    }
    return true;
  }

  if(input.operation==="paid_media.read"){
    return input.method==="GET";
  }

  if(input.operation.startsWith("api.tool_read:")){
    return task.action_type==="api.tool_read"&&["GET","HEAD"].includes(input.method);
  }

  if(input.operation==="browser.scrape.control"){
    const target=text(meta.targetUrl);
    const targetIp=text(meta.targetResolvedIp);
    if(!target||!targetIp||unsafeIp(targetIp)) return false;
    try{return new URL(target).protocol==="https:";}catch{return false;}
  }

  if(input.operation==="browser.session.create"||input.operation==="browser.session.release"){
    return input.effect==="control";
  }

  return input.effect==="read";
}

function authority(input:AuthorizeRequest,ctx:ContextResponse,scope:CapabilityScope,scopeHash:string){
  const now=Date.now();
  const matchingRules=ctx.autonomyRules
    .map(autonomyRule).filter((rule):rule is AutonomyRule=>Boolean(rule))
    .filter((rule)=>matchAutonomyRule(rule,scope,new Date(now)));
  const deny=matchingRules.find((rule)=>rule.decision==="DENY");
  if(deny) return {kind:"deny" as const,id:deny.id};

  if(input.grantRef?.startsWith("autonomy:")){
    const id=input.grantRef.slice("autonomy:".length);
    const raw=ctx.autonomyGrant;
    const rule=raw?autonomyRule(raw):null;
    if(!rule||rule.id!==id||rule.decision!=="ALLOW"||!matchAutonomyRule(rule,scope,new Date(now))) return null;
    return {kind:"autonomy" as const,id};
  }

  if(input.grantRef){
    const grant=ctx.approvalGrant;
    if(!grant) return null;
    if(grant.task_id!==scope.taskId||grant.action_class!==scope.action) return null;
    if(grant.revoked_at||!grant.consumed_at) return null;
    if(grant.expires_at&&new Date(String(grant.expires_at)).getTime()<=now) return null;
    if(grant.scope_hash!==scopeHash) return null;
    return {kind:"approval" as const,id:String(grant.id)};
  }

  const allow=matchingRules.find((rule)=>rule.decision==="ALLOW");
  return allow?{kind:"autonomy" as const,id:allow.id}:null;
}

async function record(input:AuthorizeRequest,task:TaskRow|null,decision:Decision,reason:string,scopeHash:string|null){
  const result=await trust("/v1/sentinel/record",{
    taskId:input.taskId,destination:input.destination,operation:input.operation,
    actionClass:task?.action_type??"unknown",decision,reason,capabilityHash:scopeHash,
    method:input.method,path:input.path??null,protocol:input.protocol??null,resolvedIp:input.resolvedIp,
    dataTaint:input.dataTaint??task?.data_taint??"clean",
    requestMeta:{...(input.requestMeta??{}),authorityRef:input.grantRef??null},
    grantRef:input.grantRef&&!input.grantRef.startsWith("autonomy:")?input.grantRef:null,
    policyVersion:"sentinel-v3"
  }) as {decisionId?:string};
  return result.decisionId??null;
}

async function decide(input:AuthorizeRequest){
  if(input.tenantId!==tenantId) return {decision:"DENY" as const,reason:"tenant_mismatch",task:null,scopeHash:null};
  let url:URL;
  try{url=new URL(input.destination);}catch{return {decision:"DENY" as const,reason:"invalid_destination",task:null,scopeHash:null};}
  if(url.protocol!=="https:"||(input.protocol&&input.protocol!=="https")) return {decision:"DENY" as const,reason:"https_required",task:null,scopeHash:null};
  if(unsafeIp(input.resolvedIp)) return {decision:"DENY" as const,reason:"private_or_reserved_ip",task:null,scopeHash:null};

  const ctx=await context(input);
  const task=ctx.task;
  if(!task) return {decision:"DENY" as const,reason:"task_not_found",task:null,scopeHash:null};
  if(!["running","queued"].includes(task.status)) return {decision:"DENY" as const,reason:"task_not_executable",task,scopeHash:null};
  if(!task.action_type) return {decision:"DENY" as const,reason:"task_action_missing",task,scopeHash:null};

  const scope=buildCapabilityScope({taskId:task.id,action:task.action_type,payload:task.payload});
  const scopeHash=hashScope(scope);
  if((input.effect==="write"||input.effect==="commit")&&input.capabilityHash!==scopeHash){
    return {decision:"DENY" as const,reason:"capability_hash_mismatch",task,scopeHash};
  }
  if(!concreteRequestMatches(input,task,scope)){
    return {decision:"DENY" as const,reason:"concrete_request_outside_task_scope",task,scopeHash};
  }

  const auth=authority(input,ctx,scope,scopeHash);
  if(auth?.kind==="deny") return {decision:"DENY" as const,reason:"explicit_autonomy_deny",task,scopeHash};

  const taint=input.dataTaint??task.data_taint;
  if(input.containsUserData&&["personal","sensitive","credential"].includes(taint)&&!auth){
    return {decision:"REVIEW" as const,reason:"tainted_data_egress_requires_authority",task,scopeHash};
  }

  if(input.effect==="write"||input.effect==="commit"||task.risk_class==="R2"||task.risk_class==="R3"){
    if(!auth) return {decision:"REVIEW" as const,reason:"scoped_authority_required",task,scopeHash};
    return {decision:"ALLOW" as const,reason:`valid_${auth.kind}_authority`,task,scopeHash};
  }

  if(input.effect==="control"){
    if(!controlHosts.has(url.hostname.toLowerCase())) return {decision:"DENY" as const,reason:"control_plane_destination_not_allowlisted",task,scopeHash};
    return {decision:"ALLOW" as const,reason:"allowlisted_control_plane_operation",task,scopeHash};
  }

  if(input.effect==="read"&&["GET","HEAD"].includes(input.method)){
    return {decision:"ALLOW" as const,reason:"read_only_public_https",task,scopeHash};
  }
  return {decision:"DENY" as const,reason:"unsupported_effect_or_method",task,scopeHash};
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,policy:"sentinel-v3",databaseCredential:false});
    if(!authorized(req)) return json(res,403,{error:"forbidden"});
    if(req.method!=="POST"||req.url!=="/v1/authorize") return json(res,404,{error:"not_found"});
    const input=parse(await readBody(req));
    const result=await decide(input);
    const decisionId=await record(input,result.task,result.decision,result.reason,result.scopeHash);
    return json(res,200,{decision:result.decision,reason:result.reason,decisionId});
  }catch(error){
    const message=error instanceof Error?error.message:"sentinel_error";
    return json(res,message==="request_too_large"?413:400,{error:message});
  }
});

if(!serviceToken) throw new Error("SENTINEL_SERVICE_TOKEN is required");
if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!trustStoreToken) throw new Error("TRUST_STORE_TENANT_TOKEN is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA Sentinel v3 listening on ${port}`));
