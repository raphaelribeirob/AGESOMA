import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type Taint="clean"|"public"|"personal"|"sensitive"|"credential";
type BrowserContext={
  task:{id:string;action_type:string|null;data_taint:Taint;internal_handoff?:boolean};
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
const subagentUrl=(process.env.BROWSER_SUBAGENT_URL??"http://browser-subagent:8087").replace(/\/$/,"");
const subagentToken=process.env.BROWSER_SUBAGENT_TOKEN?.trim()??"";
const safetyUrl=(process.env.BROWSER_SAFETY_URL??"http://browser-safety:8089").replace(/\/$/,"");
const safetyToken=process.env.BROWSER_SAFETY_TOKEN?.trim()??"";

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

async function sessionContext(taskId:string,sessionId:string){
  return await trust("/v1/browser/session-context",{taskId,sessionId}) as {
    provider_session_id:string;data_taint:Taint;last_url:string|null;safety_state:unknown;
  };
}

async function subagent(path:string,body:Record<string,unknown>){
  const response=await fetch(`${subagentUrl}${path}`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-browser-subagent-token":subagentToken
    },
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(45_000)
  });
  const result=await response.json().catch(()=>null) as Record<string,unknown>|null;
  if(!response.ok||!result) throw new Error(`browser_subagent_rejected:${response.status}`);
  return result;
}

async function safety(path:string,body:Record<string,unknown>){
  const response=await fetch(`${safetyUrl}${path}`,{
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-agesoma-browser-safety-token":safetyToken
    },
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {
    decision?:"ALLOW"|"REVIEW"|"BLOCK";reasons?:string[];
  }|null;
  if(!response.ok||!result?.decision) throw new Error(`browser_safety_rejected:${response.status}`);
  return {decision:result.decision,reasons:Array.isArray(result.reasons)?result.reasons:[]};
}

async function recordSafety(input:{
  taskId:string;sessionId?:string;decision:string;reasons:string[];eventType:string;url?:string|null;
}){
  await trust("/v1/browser/safety-event",input);
}

function safetyStop(input:{
  decision:"REVIEW"|"BLOCK";reasons:string[];url?:string|null;eventType:string;
}){
  return {
    blocked:true,
    safety:{decision:input.decision,reasons:input.reasons,eventType:input.eventType},
    url:input.url??null,
    snapshot:null,
    refs:{},
    trust:"external_untrusted",
    instructionsAreAuthority:false,
    requiresUserReview:input.decision==="REVIEW"
  };
}

async function filterSnapshot(taskId:string,sessionId:string,raw:Record<string,unknown>,eventType:string){
  const snapshot=typeof raw.snapshot==="string"?raw.snapshot:"";
  const url=typeof raw.url==="string"?raw.url:null;
  const title=typeof raw.title==="string"?raw.title:null;
  const decision=await safety("/v1/content",{snapshot,url,title});
  await recordSafety({taskId,sessionId,decision:decision.decision,reasons:decision.reasons,eventType,url});
  if(decision.decision!=="ALLOW"){
    return safetyStop({
      decision:decision.decision,reasons:decision.reasons,url,eventType
    });
  }
  return {
    ...raw,
    blocked:false,
    safety:{decision:"ALLOW",reasons:[],eventType},
    trust:"external_untrusted",
    instructionsAreAuthority:false,
    rawDomExposed:false,
    cdpExposed:false
  };
}

async function browserSnapshot(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  if(!taskId||!sessionId) throw new Error("task_and_session_required");
  await context(taskId);
  await sessionContext(taskId,sessionId);
  const raw=await subagent("/v1/snapshot",{taskId,sessionId});
  return await filterSnapshot(taskId,sessionId,raw,"snapshot");
}

async function browserNavigate(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  const url=typeof input.url==="string"?input.url:"";
  if(!taskId||!sessionId||!url) throw new Error("task_session_url_required");
  await context(taskId);
  await sessionContext(taskId,sessionId);

  const actionDecision=await safety("/v1/action",{action:"navigate",url});
  await recordSafety({
    taskId,sessionId,decision:actionDecision.decision,reasons:actionDecision.reasons,
    eventType:"navigation_intent",url
  });
  if(actionDecision.decision!=="ALLOW"){
    return safetyStop({
      decision:actionDecision.decision,reasons:actionDecision.reasons,url,eventType:"navigation_intent"
    });
  }
  const raw=await subagent("/v1/navigate",{taskId,sessionId,url});
  return await filterSnapshot(taskId,sessionId,raw,"navigation_snapshot");
}

async function browserAction(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  const action=typeof input.action==="string"?input.action:"";
  const ref=typeof input.ref==="string"?input.ref:null;
  if(!taskId||!sessionId||!action) throw new Error("task_session_action_required");
  const ctx=await context(taskId);
  await sessionContext(taskId,sessionId);
  if(ctx.task.internal_handoff===true && action!=="scroll"){
    throw new Error("browser_internal_handoff_readonly");
  }

  const pre=await subagent("/v1/snapshot",{taskId,sessionId});
  const preFiltered=await filterSnapshot(taskId,sessionId,pre,"pre_action_snapshot");
  if(preFiltered.blocked===true) return preFiltered;

  const refs=pre.refs&&typeof pre.refs==="object"&&!Array.isArray(pre.refs)
    ? pre.refs as Record<string,Record<string,unknown>>:{};
  const actionDecision=await safety("/v1/action",{
    action,ref,refs,value:input.value,url:typeof pre.url==="string"?pre.url:null
  });
  await recordSafety({
    taskId,sessionId,decision:actionDecision.decision,reasons:actionDecision.reasons,
    eventType:`action_${action}`,url:typeof pre.url==="string"?pre.url:null
  });
  if(actionDecision.decision!=="ALLOW"){
    return safetyStop({
      decision:actionDecision.decision,reasons:actionDecision.reasons,
      url:typeof pre.url==="string"?pre.url:null,eventType:`action_${action}`
    });
  }

  const raw=await subagent("/v1/action",{
    taskId,sessionId,action,ref,value:input.value,amount:input.amount
  });
  return await filterSnapshot(taskId,sessionId,raw,`post_action_${action}`);
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
  const contentDecision=await safety("/v1/content",{
    snapshot:JSON.stringify(result).slice(0,250_000),
    url:target.toString(),
    title:null
  });
  await recordSafety({
    taskId,
    decision:contentDecision.decision,
    reasons:contentDecision.reasons,
    eventType:"scrape_safety",
    url:target.toString()
  });
  if(contentDecision.decision!=="ALLOW"){
    return {
      provider:"steel",target:target.toString(),result:null,blocked:true,
      safety:{decision:contentDecision.decision,reasons:contentDecision.reasons,eventType:"scrape"},
      trust:"external_untrusted",instructionsAreAuthority:false,
      requiresUserReview:contentDecision.decision==="REVIEW"
    };
  }
  return {
    provider:"steel",target:target.toString(),result,blocked:false,
    safety:{decision:"ALLOW",reasons:[],eventType:"scrape"},
    trust:"external_untrusted",instructionsAreAuthority:false
  };
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,provider:"steel",forcedEgress:true,databaseCredential:false,cdpExposed:false});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    if(req.url==="/v1/sessions") return json(res,201,await createSession(input));
    if(req.url==="/v1/sessions/release") return json(res,200,await releaseSession(input));
    if(req.url==="/v1/scrape") return json(res,200,await scrape(input));
    if(req.url==="/v1/snapshot") return json(res,200,await browserSnapshot(input));
    if(req.url==="/v1/navigate") return json(res,200,await browserNavigate(input));
    if(req.url==="/v1/action") return json(res,200,await browserAction(input));
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"browser_broker_error";
    const status=["browser_capability_not_granted","browser_internal_handoff_readonly","https_required"].includes(message)?403:
      message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!trustStoreToken||!authdToken||!egressToken||!subagentToken||!safetyToken) throw new Error("Browser Broker trust-boundary tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser broker listening on ${port}`));
