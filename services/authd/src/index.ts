import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";

type Caller="browser_broker"|"browser_cdp_gateway"|"privsep_broker";

const port=Number(process.env.PORT??8083);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const trustStoreUrl=(process.env.TRUST_STORE_URL??"http://trust-store:8084").replace(/\/$/,"");
const trustStoreToken=process.env.TRUST_STORE_TENANT_TOKEN?.trim()??"";
const callerTokens:Record<Caller,string>={
  browser_broker:process.env.AUTHD_BROWSER_TOKEN?.trim()??"",
  browser_cdp_gateway:process.env.AUTHD_BROWSER_CDP_TOKEN?.trim()??"",
  privsep_broker:process.env.AUTHD_PRIVSEP_TOKEN?.trim()??""
};

const policy:Record<Caller,Record<string,Set<string>>>={
  browser_broker:{steel:new Set(["browser.provider"])},
  browser_cdp_gateway:{steel:new Set(["browser.cdp"])},
  privsep_broker:{
    whatsapp:new Set(["whatsapp.send"]),
    windsor:new Set(["paid_media.read","paid_media.write"])
  }
};

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

function sameSecret(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function caller(req:IncomingMessage){
  const name=req.headers["x-agesoma-authd-caller"];
  const token=req.headers["x-agesoma-authd-token"];
  if((name!=="browser_broker"&&name!=="browser_cdp_gateway"&&name!=="privsep_broker")||typeof token!=="string") throw new Error("forbidden");
  if(!sameSecret(token,callerTokens[name])) throw new Error("forbidden");
  return name as Caller;
}

async function readJson(req:IncomingMessage){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>16*1024) throw new Error("request_too_large");chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
}

function providerFromSurrogate(surrogate:string){
  return surrogate.slice("cred://".length).split("/")[0].toLowerCase();
}

function secretFor(provider:string){
  if(provider==="steel") return process.env.STEEL_API_KEY?.trim()??"";
  if(provider==="whatsapp") return process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim()??"";
  if(provider==="windsor") return process.env.WINDSOR_API_KEY?.trim()??"";
  return "";
}

async function trust(body:Record<string,unknown>){
  const response=await fetch(`${trustStoreUrl}/v1/authd/context`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-trust-caller":"authd",
      "x-agesoma-trust-token":trustStoreToken
    },
    body:JSON.stringify({tenantId,...body}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok) throw new Error(`trust_store_rejected:${response.status}`);
  return result;
}

async function resolveCredential(req:IncomingMessage,input:Record<string,unknown>){
  const requestTenant=typeof input.tenantId==="string"?input.tenantId:"";
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const surrogate=typeof input.surrogate==="string"?input.surrogate:"";
  const purpose=typeof input.purpose==="string"?input.purpose:"";
  if(requestTenant!==tenantId) throw new Error("tenant_mismatch");
  if(!taskId||!/^cred:\/\/[a-z0-9_-]+\/[a-z0-9._-]+$/i.test(surrogate)||!purpose) throw new Error("invalid_request");

  const callerName=caller(req);
  const provider=providerFromSurrogate(surrogate);
  if(!policy[callerName][provider]?.has(purpose)) throw new Error("caller_provider_scope_denied");

  await trust({taskId,provider,handle:surrogate,caller:callerName,purpose});
  const credential=secretFor(provider);
  if(!credential) throw new Error("credential_not_configured");
  return {provider,credential};
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"caller-scoped-surrogates",databaseCredential:false});
    if(req.method!=="POST"||req.url!=="/v1/resolve") return json(res,404,{error:"not_found"});
    return json(res,200,await resolveCredential(req,await readJson(req)));
  }catch(error){
    const message=error instanceof Error?error.message:"authd_error";
    const status=["forbidden","tenant_mismatch","caller_provider_scope_denied"].includes(message)?403:
      message==="credential_not_configured"?503:message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!trustStoreToken) throw new Error("TRUST_STORE_TENANT_TOKEN is required");
if(!callerTokens.browser_broker||!callerTokens.browser_cdp_gateway||!callerTokens.privsep_broker) throw new Error("Caller-scoped Authd tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA Authd listening on ${port}`));
