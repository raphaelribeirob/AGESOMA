import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

type Effect="read"|"control"|"write"|"commit";
type Taint="clean"|"public"|"personal"|"sensitive"|"credential";

const port=Number(process.env.PORT??8085);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
type Caller="browser_broker"|"privsep_broker"|"control_worker";
const callerTokens:Record<Caller,string>={
  browser_broker:process.env.EGRESS_BROWSER_TOKEN?.trim()??"",
  privsep_broker:process.env.EGRESS_PRIVSEP_TOKEN?.trim()??"",
  control_worker:process.env.EGRESS_CONTROL_TOKEN?.trim()??""
};
const sentinelUrl=(process.env.SENTINEL_URL??"http://sentinel:8081").replace(/\/$/,"");
const sentinelToken=process.env.SENTINEL_SERVICE_TOKEN?.trim()??"";

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

function sameSecret(a:string,b:string){
  const left=Buffer.from(a); const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function caller(req:IncomingMessage):Caller{
  const name=req.headers["x-agesoma-egress-caller"];
  const token=req.headers["x-agesoma-egress-token"];
  if((name!=="browser_broker"&&name!=="privsep_broker"&&name!=="control_worker")||typeof token!=="string") throw new Error("forbidden");
  if(!sameSecret(token,callerTokens[name])) throw new Error("forbidden");
  return name;
}

function callerMayUse(name:Caller,operation:string){
  if(name==="browser_broker") return new Set([
    "browser.session.create","browser.session.release","browser.scrape.control"
  ]).has(operation);
  if(name==="privsep_broker") return operation==="whatsapp.send"||operation==="paid_media.read"||operation==="paid_media.write";
  return operation.startsWith("api.tool_read:");
}

async function readJson(req:IncomingMessage,max=5*1024*1024){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;
    if(size>max) throw new Error("request_too_large");
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
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

async function resolvePublic(hostname:string){
  if(hostname==="localhost"||hostname.endsWith(".local")||hostname.endsWith(".internal")) throw new Error("private_destination");
  if(isIP(hostname)){
    if(unsafeIp(hostname)) throw new Error("private_destination");
    return {address:hostname,family:isIP(hostname) as 4|6};
  }
  const addresses=await lookup(hostname,{all:true,verbatim:true});
  if(!addresses.length) throw new Error("destination_did_not_resolve");
  for(const item of addresses) if(unsafeIp(item.address)) throw new Error("private_destination");
  return {address:addresses[0].address,family:addresses[0].family as 4|6};
}

function sha256(value:string){
  return createHash("sha256").update(value).digest("hex");
}

async function concreteMeta(operation:string,destination:string,bodyRaw:string|null,provided:Record<string,unknown>){
  const meta:Record<string,unknown>={...provided};
  if(bodyRaw) meta.bodySha256=sha256(bodyRaw);
  try{
    if(operation==="whatsapp.send"&&bodyRaw){
      const body=JSON.parse(bodyRaw) as Record<string,unknown>;
      const text=body.text&&typeof body.text==="object"&&!Array.isArray(body.text)
        ? body.text as Record<string,unknown>:null;
      meta.recipient=typeof body.to==="string"?body.to:null;
      meta.messageSha256=typeof text?.body==="string"?sha256(text.body):null;
    }
    if(operation==="paid_media.write"&&bodyRaw){
      const body=JSON.parse(bodyRaw) as Record<string,unknown>;
      meta.account=typeof body.account==="string"?body.account:null;
      meta.providerAction=typeof body.action==="string"?body.action:null;
      meta.providerParams=body.params&&typeof body.params==="object"&&!Array.isArray(body.params)?body.params:null;
    }
    if(operation==="browser.scrape.control"&&bodyRaw){
      const body=JSON.parse(bodyRaw) as Record<string,unknown>;
      if(typeof body.url==="string"){
        const target=new URL(body.url);
        if(target.protocol!=="https:") throw new Error("https_required");
        const targetResolved=await resolvePublic(target.hostname);
        meta.targetUrl=target.toString();
        meta.targetResolvedIp=targetResolved.address;
      }
    }
  }catch(error){
    if(error instanceof Error&&["private_destination","https_required"].includes(error.message)) throw error;
    throw new Error("invalid_operation_body");
  }
  if(operation==="paid_media.read"){
    const url=new URL(destination);
    meta.selectAccounts=url.searchParams.get("select_accounts");
    meta.fields=url.searchParams.get("fields");
  }
  return meta;
}

async function sentinel(input:Record<string,unknown>){
  const response=await fetch(`${sentinelUrl}/v1/authorize`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-sentinel-token":sentinelToken},
    body:JSON.stringify(input),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {decision?:string;reason?:string;decisionId?:string}|null;
  if(!response.ok||result?.decision!=="ALLOW") throw new Error(`sentinel_${result?.decision?.toLowerCase()??"error"}:${result?.reason??response.status}`);
  return result;
}

function safeHeaders(value:unknown){
  const input=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const allowed=new Set(["accept","content-type","authorization","steel-api-key","user-agent"]);
  const result:Record<string,string>={};
  for(const [key,raw] of Object.entries(input)){
    const lower=key.toLowerCase();
    if(!allowed.has(lower)||typeof raw!=="string") continue;
    if(raw.length>8192) throw new Error("header_too_large");
    result[lower]=raw;
  }
  return result;
}

async function pinnedRequest(input:{
  url:URL;resolvedIp:string;family:4|6;method:string;headers:Record<string,string>;
  body:string|null;maxResponseBytes:number;
}){
  return await new Promise<{status:number;headers:Record<string,string>;bodyBase64:string}>((resolve,reject)=>{
    const req=httpsRequest({
      protocol:"https:",
      hostname:input.url.hostname,
      port:input.url.port?Number(input.url.port):443,
      path:`${input.url.pathname}${input.url.search}`,
      method:input.method,
      headers:{...input.headers,host:input.url.host},
      servername:input.url.hostname,
      lookup:(_hostname,_options,callback)=>callback(null,input.resolvedIp,input.family)
    },(response)=>{
      const chunks:Buffer[]=[];let size=0;
      response.on("data",(chunk:Buffer)=>{
        size+=chunk.length;
        if(size>input.maxResponseBytes){
          req.destroy(new Error("egress_response_too_large"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end",()=>{
        const headers:Record<string,string>={};
        for(const key of ["content-type","content-length","etag","last-modified"]){
          const value=response.headers[key];
          if(typeof value==="string") headers[key]=value;
        }
        resolve({
          status:response.statusCode??502,
          headers,
          bodyBase64:Buffer.concat(chunks).toString("base64")
        });
      });
    });
    req.on("error",reject);
    req.setTimeout(45_000,()=>req.destroy(new Error("egress_timeout")));
    if(input.body) req.write(input.body);
    req.end();
  });
}

async function execute(callerName:Caller,input:Record<string,unknown>){
  const requestTenant=typeof input.tenantId==="string"?input.tenantId:"";
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const destination=typeof input.destination==="string"?input.destination:"";
  const operation=typeof input.operation==="string"?input.operation:"";
  const method=typeof input.method==="string"?input.method.toUpperCase():"";
  const effect=typeof input.effect==="string"?input.effect as Effect:"read";
  const dataTaint=typeof input.dataTaint==="string"?input.dataTaint as Taint:undefined;
  if(requestTenant!==tenantId) throw new Error("tenant_mismatch");
  if(!taskId||!destination||!operation||!["GET","HEAD","POST"].includes(method)) throw new Error("invalid_request");
  if(!callerMayUse(callerName,operation)) throw new Error("caller_operation_denied");

  const url=new URL(destination);
  if(url.protocol!=="https:"||url.username||url.password) throw new Error("https_required");
  const resolved=await resolvePublic(url.hostname);
  const headers=safeHeaders(input.headers);
  const bodyRaw=typeof input.body==="string"?input.body:null;
  const providedMeta=input.requestMeta&&typeof input.requestMeta==="object"&&!Array.isArray(input.requestMeta)
    ? input.requestMeta as Record<string,unknown>:{};
  const requestMeta=await concreteMeta(operation,url.toString(),bodyRaw,providedMeta);

  let containsUserData=input.containsUserData===true;
  if(operation==="browser.scrape.control"&&typeof requestMeta.targetUrl==="string"){
    containsUserData=containsUserData||new URL(requestMeta.targetUrl).search.length>0;
  }

  const decision=await sentinel({
    tenantId:requestTenant,taskId,destination:url.toString(),operation,method,
    path:`${url.pathname}${url.search}`,protocol:"https",resolvedIp:resolved.address,effect,
    dataTaint,containsUserData,
    grantRef:typeof input.grantRef==="string"?input.grantRef:null,
    capabilityHash:typeof input.capabilityHash==="string"?input.capabilityHash:null,
    requestMeta
  });

  const wireUrl=new URL(url.toString());
  if(input.secretQuery&&typeof input.secretQuery==="object"&&!Array.isArray(input.secretQuery)){
    if(callerName!=="privsep_broker") throw new Error("secret_query_denied");
    for(const [key,value] of Object.entries(input.secretQuery as Record<string,unknown>)){
      if(key!=="api_key"||typeof value!=="string"||!value||value.length>8192) throw new Error("invalid_secret_query");
      wireUrl.searchParams.set(key,value);
    }
  }

  const maxResponseBytes=typeof input.maxResponseBytes==="number"
    ? Math.max(1,Math.min(4*1024*1024,Math.trunc(input.maxResponseBytes)))
    : 2*1024*1024;
  const response=await pinnedRequest({
    url:wireUrl,resolvedIp:resolved.address,family:resolved.family,method,headers,body:bodyRaw,maxResponseBytes
  });
  return {...response,decisionId:decision.decisionId??null,resolvedIp:resolved.address};
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"forced-sentinel-egress",callerScoped:true});
    if(req.method!=="POST"||req.url!=="/v1/fetch") return json(res,404,{error:"not_found"});
    const callerName=caller(req);
    return json(res,200,await execute(callerName,await readJson(req)));
  }catch(error){
    const message=error instanceof Error?error.message:"egress_gateway_error";
    const status=message.startsWith("sentinel_")?403:
      ["forbidden","tenant_mismatch","private_destination","https_required","caller_operation_denied","secret_query_denied"].includes(message)?403:
      message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!callerTokens.browser_broker||!callerTokens.privsep_broker||!callerTokens.control_worker) throw new Error("Caller-scoped egress tokens are required");
if(!sentinelToken) throw new Error("SENTINEL_SERVICE_TOKEN is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA egress gateway listening on ${port}`));
