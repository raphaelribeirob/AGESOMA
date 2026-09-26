import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";

const port=Number(process.env.PORT??8080);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const authdUrl=(process.env.AUTHD_URL??"http://authd:8083").replace(/\/$/,"");
const authdToken=process.env.AUTHD_PRIVSEP_TOKEN?.trim()??"";
const egressUrl=(process.env.EGRESS_GATEWAY_URL??"http://egress-gateway:8085").replace(/\/$/,"");
const egressToken=process.env.EGRESS_PRIVSEP_TOKEN?.trim()??"";
const brokerToken=process.env.CREDENTIAL_BROKER_SERVICE_TOKEN?.trim()??"";
const whatsappVersion=process.env.WHATSAPP_GRAPH_VERSION?.trim()??"v23.0";
const whatsappPhoneId=process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim()??"";

function sameSecret(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function brokerAuthorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-broker-token"];
  return typeof supplied==="string"&&sameSecret(supplied,brokerToken);
}

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

async function readBody(req:IncomingMessage,max=128*1024){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>max) throw new Error("request_too_large");chunks.push(data);
  }
  return Buffer.concat(chunks);
}

function header(req:IncomingMessage,name:string){
  const value=req.headers[name.toLowerCase()];
  return typeof value==="string"&&value.trim()?value.trim():null;
}

async function credential(taskId:string,surrogate:string,purpose:string){
  const response=await fetch(`${authdUrl}/v1/resolve`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-authd-caller":"privsep_broker",
      "x-agesoma-authd-token":authdToken
    },
    body:JSON.stringify({tenantId,taskId,surrogate,purpose}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {credential?:string}|null;
  if(!response.ok||!result?.credential) throw new Error("authd_resolution_failed");
  return result.credential;
}

async function gateway(input:Record<string,unknown>){
  const response=await fetch(`${egressUrl}/v1/fetch`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-egress-caller":"privsep_broker",
      "x-agesoma-egress-token":egressToken
    },
    body:JSON.stringify({tenantId,...input}),
    signal:AbortSignal.timeout(50_000)
  });
  const result=await response.json().catch(()=>null) as {
    status?:number;headers?:Record<string,string>;bodyBase64?:string
  }|null;
  if(!response.ok||typeof result?.status!=="number"||typeof result.bodyBase64!=="string"){
    throw new Error(`egress_gateway_rejected:${response.status}`);
  }
  return {
    status:result.status,
    headers:result.headers??{},
    body:Buffer.from(result.bodyBase64,"base64")
  };
}

function relay(res:ServerResponse,result:{status:number;headers:Record<string,string>;body:Buffer}){
  res.writeHead(result.status,{
    "content-type":result.headers["content-type"]??"application/json",
    "content-length":result.body.length
  });
  res.end(result.body);
}

async function whatsapp(req:IncomingMessage,res:ServerResponse){
  if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
  const taskId=header(req,"x-agesoma-task-id");
  const grantRef=header(req,"x-agesoma-grant-ref");
  const capabilityHash=header(req,"x-agesoma-capability-hash");
  if(!taskId||!grantRef||!capabilityHash) return json(res,403,{error:"scoped_capability_required"});
  if(!whatsappPhoneId) return json(res,503,{error:"whatsapp_phone_not_configured"});

  const raw=await readBody(req);
  const token=await credential(taskId,"cred://whatsapp/default","whatsapp.send");
  const destination=`https://graph.facebook.com/${whatsappVersion}/${whatsappPhoneId}/messages`;
  const result=await gateway({
    taskId,destination,operation:"whatsapp.send",method:"POST",effect:"write",
    grantRef,capabilityHash,containsUserData:true,
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:raw.toString("utf8"),maxResponseBytes:1024*1024
  });
  return relay(res,result);
}

function windsorRoute(pathname:string){
  if(pathname==="/v1/paid-media/facebook/data") return {connector:"facebook",kind:"data" as const};
  if(pathname==="/v1/paid-media/google_ads/data") return {connector:"google_ads",kind:"data" as const};
  if(pathname==="/v1/paid-media/all/data") return {connector:"all",kind:"data" as const};
  if(pathname==="/v1/paid-media/facebook/actions") return {connector:"facebook",kind:"actions" as const};
  return null;
}

async function windsor(req:IncomingMessage,res:ServerResponse,url:URL,route:{connector:string;kind:"data"|"actions"}){
  const taskId=header(req,"x-agesoma-task-id");
  const grantRef=header(req,"x-agesoma-grant-ref");
  const capabilityHash=header(req,"x-agesoma-capability-hash");
  if(!taskId) return json(res,403,{error:"task_id_required"});

  const isWrite=route.kind==="actions"&&req.method==="POST";
  const isRead=req.method==="GET";
  if(!isRead&&!isWrite) return json(res,405,{error:"method_not_allowed"});
  if(isWrite&&(!grantRef||!capabilityHash)) return json(res,403,{error:"scoped_capability_required"});

  const endpoint=new URL(`https://connectors.windsor.ai/${route.connector}${route.kind==="actions"?"/actions":""}`);
  for(const [key,value] of url.searchParams) endpoint.searchParams.append(key,value);
  const purpose=isWrite?"paid_media.write":"paid_media.read";
  const token=await credential(taskId,"cred://windsor/default",purpose);
  const raw=isWrite?await readBody(req):null;

  const result=await gateway({
    taskId,destination:endpoint.toString(),
    operation:isWrite?"paid_media.write":"paid_media.read",
    method:isWrite?"POST":"GET",effect:isWrite?"write":"read",
    grantRef:grantRef??null,capabilityHash:capabilityHash??null,
    containsUserData:false,
    headers:isWrite?{"content-type":"application/json"}:{accept:"application/json"},
    body:raw?.toString("utf8")??null,
    secretQuery:{api_key:token},
    requestMeta:{connector:route.connector,routeKind:route.kind},
    maxResponseBytes:2*1024*1024
  });
  return relay(res,result);
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"privsep-forced-egress",databaseCredential:false});
    if(!brokerAuthorized(req)) return json(res,403,{error:"forbidden"});
    const url=new URL(req.url??"/","http://privsep.local");
    if(url.pathname==="/v1/whatsapp/messages") return await whatsapp(req,res);
    const route=windsorRoute(url.pathname);
    if(route) return await windsor(req,res,url,route);
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"privsep_error";
    const status=message==="request_too_large"?413:message.includes("rejected")?403:502;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!authdToken||!egressToken||!brokerToken) throw new Error("Privsep trust-boundary tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA privsep broker listening on ${port}`));
