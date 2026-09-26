import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";

const port = Number(process.env.PORT ?? 8080);
const tenantId = process.env.AGESOMA_TENANT_ID?.trim() ?? "";
const authdUrl = (process.env.AUTHD_URL ?? "http://authd:8083").replace(/\/$/,"");
const authdToken = process.env.AUTHD_SERVICE_TOKEN?.trim() ?? "";
const sentinelUrl = (process.env.SENTINEL_URL ?? "http://sentinel:8081").replace(/\/$/,"");
const sentinelToken = process.env.SENTINEL_SERVICE_TOKEN?.trim() ?? "";
const brokerToken = process.env.CREDENTIAL_BROKER_SERVICE_TOKEN?.trim() ?? "";
const whatsappVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() ?? "v23.0";
const whatsappPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim() ?? "";

function sameSecret(a:string,b:string){
  const left=Buffer.from(a); const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function brokerAuthorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-broker-token"];
  return typeof supplied==="string"&&sameSecret(supplied,brokerToken);
}

function json(res: ServerResponse,status:number,value:unknown) {
  const body=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(body)});
  res.end(body);
}

async function readBody(req:IncomingMessage,max=128*1024) {
  const chunks:Buffer[]=[]; let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;
    if(size>max) throw new Error("request_too_large");
    chunks.push(data);
  }
  return Buffer.concat(chunks);
}

function header(req:IncomingMessage,name:string) {
  const value=req.headers[name.toLowerCase()];
  return typeof value==="string"&&value.trim()?value.trim():null;
}

async function publicIp(hostname:string) {
  const addresses=await lookup(hostname,{all:true,verbatim:true});
  const first=addresses[0];
  if(!first) throw new Error("destination_did_not_resolve");
  return first.address;
}

async function authorize(input:{
  taskId:string; destination:string; operation:string; method:string;
  effect:"read"|"control"|"write"|"commit"; grantRef?:string|null;
  containsUserData?:boolean; requestMeta?:Record<string,unknown>;
}) {
  const url=new URL(input.destination);
  const resolvedIp=await publicIp(url.hostname);
  const response=await fetch(`${sentinelUrl}/v1/authorize`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-sentinel-token":sentinelToken},
    body:JSON.stringify({
      tenantId,taskId:input.taskId,destination:input.destination,
      operation:input.operation,method:input.method,path:`${url.pathname}${url.search}`,
      protocol:url.protocol.replace(":",""),resolvedIp,effect:input.effect,
      grantRef:input.grantRef??null,containsUserData:input.containsUserData===true,
      requestMeta:input.requestMeta??{}
    }),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {decision?:string;reason?:string}|null;
  if(!response.ok||result?.decision!=="ALLOW") {
    throw new Error(`sentinel_${result?.decision?.toLowerCase()??"error"}:${result?.reason??response.status}`);
  }
}

async function credential(taskId:string,surrogate:string,purpose:string) {
  const response=await fetch(`${authdUrl}/v1/resolve`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-authd-token":authdToken},
    body:JSON.stringify({tenantId,taskId,surrogate,purpose}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {credential?:string}|null;
  if(!response.ok||!result?.credential) throw new Error("authd_resolution_failed");
  return result.credential;
}

async function proxyJson(res:ServerResponse,response:Response) {
  const raw=Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status,{
    "content-type":response.headers.get("content-type")??"application/json",
    "content-length":raw.length
  });
  res.end(raw);
}

async function whatsapp(req:IncomingMessage,res:ServerResponse) {
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  const taskId=header(req,"x-agesoma-task-id");
  const grantRef=header(req,"x-agesoma-grant-ref");
  if(!taskId||!grantRef) return json(res,403,{error:"scoped_grant_required"});
  if(!whatsappPhoneId) return json(res,503,{error:"whatsapp_phone_not_configured"});

  const raw=await readBody(req);
  const destination=`https://graph.facebook.com/${whatsappVersion}/${whatsappPhoneId}/messages`;
  await authorize({taskId,destination,operation:"whatsapp.send",method:"POST",effect:"write",grantRef,containsUserData:true});
  const token=await credential(taskId,"cred://whatsapp/default","whatsapp.send");
  const response=await fetch(destination,{
    method:"POST",
    headers:{"authorization":`Bearer ${token}`,"content-type":"application/json"},
    body:raw,
    signal:AbortSignal.timeout(20_000)
  });
  return proxyJson(res,response);
}

function windsorConnector(pathname:string) {
  if(pathname==="/v1/paid-media/facebook/data") return {connector:"facebook",write:false};
  if(pathname==="/v1/paid-media/google_ads/data") return {connector:"google_ads",write:false};
  if(pathname==="/v1/paid-media/all/data") return {connector:"all",write:false};
  if(pathname==="/v1/paid-media/facebook/actions") return {connector:"facebook",write:true};
  return null;
}

async function windsor(req:IncomingMessage,res:ServerResponse,url:URL,route:{connector:string;write:boolean}) {
  const taskId=header(req,"x-agesoma-task-id");
  const grantRef=header(req,"x-agesoma-grant-ref");
  if(!taskId) return json(res,403,{error:"task_id_required"});
  if(route.write&&(!grantRef||req.method!=="POST")) return json(res,403,{error:"scoped_grant_required"});
  if(!route.write&&req.method!=="GET") return json(res,405,{error:"method_not_allowed"});

  const endpoint=new URL(`https://connectors.windsor.ai/${route.connector}${route.write?"/actions":""}`);
  for(const [key,value] of url.searchParams) endpoint.searchParams.append(key,value);
  await authorize({
    taskId,destination:endpoint.toString(),
    operation:route.write?"paid_media.write":"paid_media.read",
    method:route.write?"POST":"GET",
    effect:route.write?"write":"read",
    grantRef:grantRef??null,
    containsUserData:false,
    requestMeta:{connector:route.connector}
  });
  const token=await credential(taskId,"cred://windsor/default",route.write?"paid_media.write":"paid_media.read");
  endpoint.searchParams.set("api_key",token);
  const raw=route.write?await readBody(req):undefined;
  const response=await fetch(endpoint,{
    method:route.write?"POST":"GET",
    headers:route.write?{"content-type":"application/json"}:undefined,
    body:raw,
    signal:AbortSignal.timeout(30_000)
  });
  return proxyJson(res,response);
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"privsep-authd-sentinel"});
    if(!brokerAuthorized(req)) return json(res,403,{error:"forbidden"});
    const url=new URL(req.url??"/","http://privsep.local");
    if(url.pathname==="/v1/whatsapp/messages") return await whatsapp(req,res);
    const route=windsorConnector(url.pathname);
    if(route) return await windsor(req,res,url,route);
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"privsep_error";
    const status=message.startsWith("sentinel_")?403:message==="request_too_large"?413:502;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!authdToken) throw new Error("AUTHD_SERVICE_TOKEN is required");
if(!sentinelToken) throw new Error("SENTINEL_SERVICE_TOKEN is required");
if(!brokerToken) throw new Error("CREDENTIAL_BROKER_SERVICE_TOKEN is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA privsep broker listening on ${port}`));
