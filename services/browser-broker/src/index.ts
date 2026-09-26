import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type Taint="clean"|"public"|"personal"|"sensitive"|"credential";
type BrowserContext={
  task:{id:string;action_type:string|null;data_taint:Taint};
  browserProfileRef:string|null;sessionCount:number;scrapeCount:number;
};

const port=Number(process.env.PORT??8082);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const trustStoreUrl=(process.env.TRUST_STORE_URL??"http://trust-store:8084").replace(/\/$/,"");
const trustStoreToken=process.env.TRUST_STORE_TENANT_TOKEN?.trim()??"";
const authdUrl=(process.env.AUTHD_URL??"http://authd:8083").replace(/\/$/,"");
const authdToken=process.env.AUTHD_BROWSER_TOKEN?.trim()??"";
const egressUrl=(process.env.EGRESS_GATEWAY_URL??"http://egress-gateway:8085").replace(/\/$/,"");
const egressToken=process.env.EGRESS_BROWSER_TOKEN?.trim()??"";
const steelBaseUrl=(process.env.STEEL_BASE_URL??"https://api.steel.dev").replace(/\/$/,"");

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

async function readJson(req:IncomingMessage,max=64*1024){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>max) throw new Error("request_too_large");chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
}

async function trust(path:string,body:Record<string,unknown>){
  const response=await fetch(`${trustStoreUrl}${path}`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-trust-caller":"browser_broker",
      "x-agesoma-trust-token":trustStoreToken
    },
    body:JSON.stringify({tenantId,...body}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok) throw new Error(`trust_store_rejected:${response.status}`);
  return result;
}

async function context(taskId:string){
  const result=await trust("/v1/browser/context",{taskId}) as BrowserContext;
  if(!["business.observe","business.work"].includes(result.task.action_type??"")) throw new Error("browser_capability_not_granted");
  return result;
}

async function steelCredential(taskId:string){
  const response=await fetch(`${authdUrl}/v1/resolve`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-authd-caller":"browser_broker",
      "x-agesoma-authd-token":authdToken
    },
    body:JSON.stringify({tenantId,taskId,surrogate:"cred://steel/default",purpose:"browser.provider"}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {credential?:string}|null;
  if(!response.ok||!result?.credential) throw new Error("steel_credential_unavailable");
  return result.credential;
}

async function egress(input:{
  taskId:string;destination:string;operation:string;method:"POST";
  dataTaint:Taint;containsUserData?:boolean;headers:Record<string,string>;
  body:string;requestMeta?:Record<string,unknown>;
}){
  const response=await fetch(`${egressUrl}/v1/fetch`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-egress-caller":"browser_broker",
      "x-agesoma-egress-token":egressToken
    },
    body:JSON.stringify({
      tenantId,taskId:input.taskId,destination:input.destination,operation:input.operation,
      method:input.method,effect:"control",dataTaint:input.dataTaint,
      containsUserData:input.containsUserData===true,headers:input.headers,body:input.body,
      requestMeta:input.requestMeta??{},maxResponseBytes:2*1024*1024
    }),
    signal:AbortSignal.timeout(50_000)
  });
  const result=await response.json().catch(()=>null) as {
    status?:number;bodyBase64?:string;headers?:Record<string,string>
  }|null;
  if(!response.ok||typeof result?.status!=="number"||typeof result.bodyBase64!=="string"){
    throw new Error(`egress_gateway_rejected:${response.status}`);
  }
  const raw=Buffer.from(result.bodyBase64,"base64").toString("utf8");
  if(result.status<200||result.status>=300) throw new Error(`steel_request_failed:${result.status}`);
  return raw?JSON.parse(raw) as Record<string,unknown>:{};
}

async function createSession(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  if(!taskId) throw new Error("task_id_required");
  const ctx=await context(taskId);
  if(ctx.sessionCount>=2) throw new Error("browser_session_limit_reached");
  const key=await steelCredential(taskId);

  const body:Record<string,unknown>={
    persistProfile:true,timeout:600_000,inactivityTimeout:120_000,
    debugConfig:{interactive:false}
  };
  if(ctx.browserProfileRef) body.profileId=ctx.browserProfileRef;

  const session=await egress({
    taskId,destination:`${steelBaseUrl}/v1/sessions`,operation:"browser.session.create",
    method:"POST",dataTaint:ctx.task.data_taint,headers:{"steel-api-key":key,"content-type":"application/json"},
    body:JSON.stringify(body)
  });
  const sessionId=typeof session.id==="string"?session.id:"";
  if(!sessionId) throw new Error("steel_session_id_missing");
  const profileId=typeof session.profileId==="string"?session.profileId:ctx.browserProfileRef;
  await trust("/v1/browser/session-created",{taskId,sessionId,profileId,dataTaint:ctx.task.data_taint});
  return {sessionId,profileId,interactive:false,cdpExposed:false,viewerExposed:false};
}

async function releaseSession(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  if(!taskId||!sessionId) throw new Error("task_and_session_required");
  const ctx=await context(taskId);
  const key=await steelCredential(taskId);
  await egress({
    taskId,destination:`${steelBaseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/release`,
    operation:"browser.session.release",method:"POST",dataTaint:ctx.task.data_taint,
    headers:{"steel-api-key":key,"content-type":"application/json"},body:"{}"
  });
  await trust("/v1/browser/session-released",{taskId,sessionId});
  return {released:true,sessionId};
}

async function scrape(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const targetRaw=typeof input.url==="string"?input.url:"";
  if(!taskId||!targetRaw) throw new Error("task_and_url_required");
  const target=new URL(targetRaw);
  if(target.protocol!=="https:") throw new Error("https_required");
  const ctx=await context(taskId);
  if(ctx.scrapeCount>=20) throw new Error("browser_scrape_limit_reached");
  const key=await steelCredential(taskId);
  const format=Array.isArray(input.format)
    ? input.format.filter((item):item is string=>typeof item==="string").slice(0,4)
    : ["markdown"];

  const result=await egress({
    taskId,destination:`${steelBaseUrl}/v1/scrape`,operation:"browser.scrape.control",
    method:"POST",dataTaint:ctx.task.data_taint,
    containsUserData:!["clean","public"].includes(ctx.task.data_taint)&&Boolean(target.search),
    headers:{"steel-api-key":key,"content-type":"application/json"},
    body:JSON.stringify({url:target.toString(),format}),
    requestMeta:{browserProvider:"steel"}
  });
  await trust("/v1/browser/scrape-event",{taskId,host:target.hostname,dataTaint:ctx.task.data_taint});
  return {provider:"steel",target:target.toString(),trust:"external_untrusted",instructionsAreAuthority:false,result};
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,provider:"steel",forcedEgress:true,databaseCredential:false,cdpExposed:false});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    if(req.url==="/v1/sessions") return json(res,201,await createSession(input));
    if(req.url==="/v1/sessions/release") return json(res,200,await releaseSession(input));
    if(req.url==="/v1/scrape") return json(res,200,await scrape(input));
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"browser_broker_error";
    const status=["browser_capability_not_granted","https_required"].includes(message)?403:
      message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!trustStoreToken||!authdToken||!egressToken) throw new Error("Browser Broker trust-boundary tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser broker listening on ${port}`));
