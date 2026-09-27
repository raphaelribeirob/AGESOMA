import { execFile } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { promisify } from "node:util";

const execFileAsync=promisify(execFile);
const port=Number(process.env.PORT??8087);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const serviceToken=process.env.BROWSER_SUBAGENT_TOKEN?.trim()??"";
const cdpBase=(process.env.BROWSER_CDP_URL??"ws://browser-cdp-gateway:8088/v1/cdp").replace(/\?$/,"");
const cdpToken=process.env.BROWSER_CDP_TOKEN?.trim()??"";

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}
function sameSecret(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}
function authorized(req:IncomingMessage){
  const supplied=req.headers["x-agesoma-browser-subagent-token"];
  return typeof supplied==="string"&&sameSecret(supplied,serviceToken);
}
async function readJson(req:IncomingMessage,max=128*1024){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;if(size>max) throw new Error("request_too_large");chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
}
function sessionName(sessionId:string){
  return `agesoma-${createHash("sha256").update(sessionId).digest("hex").slice(0,24)}`;
}
function cdpUrl(taskId:string,sessionId:string){
  const url=new URL(cdpBase);
  url.searchParams.set("taskId",taskId);
  url.searchParams.set("sessionId",sessionId);
  url.searchParams.set("token",cdpToken);
  return url.toString();
}
function scalar(value:unknown):string|null{
  if(typeof value==="string") return value;
  if(value&&typeof value==="object"&&!Array.isArray(value)){
    const record=value as Record<string,unknown>;
    for(const key of ["value","text","url","title"]){
      if(typeof record[key]==="string") return record[key] as string;
    }
  }
  return null;
}
async function run(taskId:string,sessionId:string,args:string[],timeout=30_000){
  const env={
    ...process.env,
    AGENT_BROWSER_SESSION:sessionName(sessionId),
    AGENT_BROWSER_CDP:cdpUrl(taskId,sessionId),
    AGENT_BROWSER_JSON:"1",
    AGENT_BROWSER_NO_WEBMCP:"1"
  };
  try{
    const {stdout}=await execFileAsync("agent-browser",["--session",sessionName(sessionId),"--json",...args],{
      env,timeout,maxBuffer:6*1024*1024
    });
    const parsed=JSON.parse(stdout) as Record<string,unknown>;
    if(parsed.success===false) throw new Error("agent_browser_command_failed");
    return parsed;
  }catch(error){
    if(error instanceof Error&&error.message==="agent_browser_command_failed") throw error;
    throw new Error("browser_subagent_command_failed");
  }
}
function data(record:Record<string,unknown>){
  return record.data&&typeof record.data==="object"&&!Array.isArray(record.data)
    ? record.data as Record<string,unknown>:record;
}
async function snapshot(taskId:string,sessionId:string){
  const snap=data(await run(taskId,sessionId,["snapshot","-c","-d","8"]));
  const urlResult=data(await run(taskId,sessionId,["get","url"]));
  const titleResult=data(await run(taskId,sessionId,["get","title"]));
  const snapshotText=typeof snap.snapshot==="string"?snap.snapshot:"";
  const refs=snap.refs&&typeof snap.refs==="object"&&!Array.isArray(snap.refs)
    ? snap.refs as Record<string,Record<string,unknown>>:{};
  return {
    snapshot:snapshotText,
    refs,
    url:scalar(urlResult)??"",
    title:scalar(titleResult)??"",
    source:"accessibility_tree",
    rawDomExposed:false,
    javascriptExecution:false,
    cdpExposed:false
  };
}
async function navigate(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  const target=typeof input.url==="string"?input.url:"";
  if(!taskId||!sessionId||!target) throw new Error("task_session_url_required");
  const url=new URL(target);
  if(url.protocol!=="https:"||url.username||url.password) throw new Error("unsafe_navigation_target");
  await run(taskId,sessionId,["open",url.toString()],45_000);
  await run(taskId,sessionId,["wait","--load","domcontentloaded"],20_000).catch(()=>null);
  return await snapshot(taskId,sessionId);
}
async function act(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  const action=typeof input.action==="string"?input.action.toLowerCase():"";
  const ref=typeof input.ref==="string"?input.ref.replace(/^@/,""):"";
  const value=typeof input.value==="string"?input.value:"";
  if(!taskId||!sessionId||!action) throw new Error("task_session_action_required");

  const refArg=ref?`@${ref}`:"";
  if(action==="click"&&refArg) await run(taskId,sessionId,["click",refArg]);
  else if(action==="fill"&&refArg) await run(taskId,sessionId,["fill",refArg,value]);
  else if(action==="select"&&refArg) await run(taskId,sessionId,["select",refArg,value]);
  else if(action==="check"&&refArg) await run(taskId,sessionId,["check",refArg]);
  else if(action==="uncheck"&&refArg) await run(taskId,sessionId,["uncheck",refArg]);
  else if(action==="press"&&value) await run(taskId,sessionId,["press",value]);
  else if(action==="scroll"){
    const direction=value==="up"?"up":"down";
    const amount=typeof input.amount==="number"&&Number.isFinite(input.amount)
      ? String(Math.max(100,Math.min(1500,Math.trunc(input.amount)))):"500";
    await run(taskId,sessionId,["scroll",direction,amount]);
  }else throw new Error("unsupported_browser_action");

  return await snapshot(taskId,sessionId);
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health"){
      return json(res,200,{ok:true,mode:"aria-ref-browser-subagent",webmcp:false,rawDom:false,eval:false});
    }
    if(!authorized(req)) return json(res,403,{error:"forbidden"});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    const taskId=typeof input.taskId==="string"?input.taskId:"";
    const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
    if(req.url==="/v1/snapshot"){
      if(!taskId||!sessionId) return json(res,400,{error:"task_and_session_required"});
      return json(res,200,await snapshot(taskId,sessionId));
    }
    if(req.url==="/v1/navigate") return json(res,200,await navigate(input));
    if(req.url==="/v1/action") return json(res,200,await act(input));
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"browser_subagent_error";
    const status=["unsafe_navigation_target","unsupported_browser_action"].includes(message)?403:
      message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!serviceToken||!cdpToken) throw new Error("Browser Subagent tokens are required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser subagent listening on ${port}`));
