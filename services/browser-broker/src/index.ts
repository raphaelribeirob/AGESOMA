import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import Steel from "steel-sdk";
import { sql } from "@agesoma/db";

type Taint = "clean"|"public"|"personal"|"sensitive"|"credential";

const port=Number(process.env.PORT??8082);
const tenantId=process.env.AGESOMA_TENANT_ID?.trim()??"";
const authdUrl=(process.env.AUTHD_URL??"http://authd:8083").replace(/\/$/,"");
const authdToken=process.env.AUTHD_SERVICE_TOKEN?.trim()??"";
const sentinelUrl=(process.env.SENTINEL_URL??"http://sentinel:8081").replace(/\/$/,"");
const sentinelToken=process.env.SENTINEL_SERVICE_TOKEN?.trim()??"";
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

async function publicResolution(hostname:string){
  if(hostname==="localhost"||hostname.endsWith(".local")||hostname.endsWith(".internal")) throw new Error("private_destination");
  const addresses=await lookup(hostname,{all:true,verbatim:true});
  if(!addresses.length) throw new Error("destination_did_not_resolve");
  for(const item of addresses) if(unsafeIp(item.address)) throw new Error("private_destination");
  return addresses[0].address;
}

async function taskContext(taskId:string){
  const [task]=await sql<{id:string;data_taint:Taint}>(`
    select id,data_taint from tasks
    where tenant_id=$1 and id=$2 and status in ('running','queued')
    limit 1
  `,[tenantId,taskId]);
  if(!task) throw new Error("task_not_executable");
  return task;
}

async function authorize(input:{
  taskId:string;destination:string;operation:string;method:string;
  effect:"read"|"control";dataTaint:Taint;containsUserData?:boolean;
  requestMeta?:Record<string,unknown>;
}){
  const url=new URL(input.destination);
  const resolvedIp=await publicResolution(url.hostname);
  const response=await fetch(`${sentinelUrl}/v1/authorize`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-sentinel-token":sentinelToken},
    body:JSON.stringify({
      tenantId,taskId:input.taskId,destination:input.destination,operation:input.operation,
      method:input.method,path:`${url.pathname}${url.search}`,protocol:url.protocol.replace(":",""),
      resolvedIp,effect:input.effect,dataTaint:input.dataTaint,
      containsUserData:input.containsUserData===true,requestMeta:input.requestMeta??{}
    }),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {decision?:string;reason?:string}|null;
  if(!response.ok||result?.decision!=="ALLOW") throw new Error(`sentinel_${result?.decision?.toLowerCase()??"error"}:${result?.reason??response.status}`);
}

async function steelCredential(taskId:string){
  const response=await fetch(`${authdUrl}/v1/resolve`,{
    method:"POST",
    headers:{"content-type":"application/json","x-agesoma-authd-token":authdToken},
    body:JSON.stringify({tenantId,taskId,surrogate:"cred://steel/default",purpose:"browser.provider"}),
    signal:AbortSignal.timeout(10_000)
  });
  const result=await response.json().catch(()=>null) as {credential?:string}|null;
  if(!response.ok||!result?.credential) throw new Error("steel_credential_unavailable");
  return result.credential;
}

function steelClient(key:string){
  return new Steel({steelAPIKey:key,baseURL:steelBaseUrl});
}

async function createSession(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  if(!taskId) throw new Error("task_id_required");
  const task=await taskContext(taskId);
  const [sessionUsage]=await sql<{ count: string | number }>(`
    select count(*) as count from browser_sessions
    where tenant_id=$1 and task_id=$2
  `,[tenantId,taskId]);
  if(Number(sessionUsage?.count??0)>=2) throw new Error("browser_session_limit_reached");

  const controlUrl=`${steelBaseUrl}/v1/sessions`;
  await authorize({
    taskId,destination:controlUrl,operation:"browser.session.create",method:"POST",
    effect:"control",dataTaint:task.data_taint,containsUserData:false
  });
  const key=await steelCredential(taskId);
  const [cell]=await sql<{browser_profile_ref:string|null}>(`
    select browser_profile_ref from work_cells where tenant_id=$1 limit 1
  `,[tenantId]);

  const client=steelClient(key);
  const options:Record<string,unknown>={
    persistProfile:true,
    timeout:600_000,
    inactivityTimeout:120_000,
    debugConfig:{interactive:false}
  };
  if(cell?.browser_profile_ref) options.profileId=cell.browser_profile_ref;

  const session=await client.sessions.create(options as never);
  const profileId=typeof (session as unknown as Record<string,unknown>).profileId==="string"
    ? String((session as unknown as Record<string,unknown>).profileId)
    : cell?.browser_profile_ref??null;
  await sql(`
    insert into browser_sessions (
      tenant_id,task_id,provider,provider_session_id,profile_ref,mode,interactive,status,data_taint
    ) values ($1,$2,'steel',$3,$4,'brokered',false,'live',$5)
  `,[tenantId,taskId,session.id,profileId,task.data_taint]);

  if(profileId){
    await sql(`update work_cells set browser_profile_ref=$2,last_active_at=now(),updated_at=now() where tenant_id=$1`,[tenantId,profileId]);
  }
  await sql(`
    insert into runtime_events (tenant_id,task_id,session_ref,event_type,trust_zone,summary,metadata)
    values ($1,$2,$3,'browser_session_created','browser_broker','Steel session created',$4::jsonb)
  `,[tenantId,taskId,session.id,JSON.stringify({provider:"steel",profileId,interactive:false,cdpExposedToRuntime:false})]);

  return {sessionId:session.id,profileId,interactive:false,cdpExposed:false,viewerExposed:false};
}

async function releaseSession(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const sessionId=typeof input.sessionId==="string"?input.sessionId:"";
  if(!taskId||!sessionId) throw new Error("task_and_session_required");
  const task=await taskContext(taskId);
  const [stored]=await sql<{id:string}>(`
    select id from browser_sessions
    where tenant_id=$1 and provider_session_id=$2 and status='live'
    limit 1
  `,[tenantId,sessionId]);
  if(!stored) throw new Error("browser_session_not_found");

  await authorize({
    taskId,destination:`${steelBaseUrl}/v1/sessions/${encodeURIComponent(sessionId)}`,
    operation:"browser.session.release",method:"POST",effect:"control",
    dataTaint:task.data_taint,containsUserData:false
  });
  const key=await steelCredential(taskId);
  const client=steelClient(key);
  await client.sessions.release(sessionId);

  await sql(`
    update browser_sessions set status='released',released_at=now(),updated_at=now()
    where tenant_id=$1 and provider_session_id=$2
  `,[tenantId,sessionId]);
  await sql(`
    insert into runtime_events (tenant_id,task_id,session_ref,event_type,trust_zone,summary)
    values ($1,$2,$3,'browser_session_released','browser_broker','Steel session released')
  `,[tenantId,taskId,sessionId]);
  return {released:true,sessionId};
}

async function scrape(input:Record<string,unknown>){
  const taskId=typeof input.taskId==="string"?input.taskId:"";
  const targetRaw=typeof input.url==="string"?input.url:"";
  if(!taskId||!targetRaw) throw new Error("task_and_url_required");
  const task=await taskContext(taskId);
  const [scrapeUsage]=await sql<{ count: string | number }>(`
    select count(*) as count from runtime_events
    where tenant_id=$1 and task_id=$2 and event_type='browser_scrape'
  `,[tenantId,taskId]);
  if(Number(scrapeUsage?.count??0)>=20) throw new Error("browser_scrape_limit_reached");

  const target=new URL(targetRaw);
  if(target.protocol!=="https:") throw new Error("https_required");
  await publicResolution(target.hostname);
  const containsUserData=task.data_taint!=="clean"&&task.data_taint!=="public"&&Boolean(target.search);
  await authorize({
    taskId,destination:target.toString(),operation:"browser.scrape.target",method:"GET",
    effect:"read",dataTaint:task.data_taint,containsUserData,
    requestMeta:{browserProvider:"steel"}
  });
  await authorize({
    taskId,destination:`${steelBaseUrl}/v1/scrape`,operation:"browser.scrape.control",method:"POST",
    effect:"control",dataTaint:task.data_taint,containsUserData:false,
    requestMeta:{targetHost:target.hostname}
  });

  const key=await steelCredential(taskId);
  const format=Array.isArray(input.format)
    ? input.format.filter((item):item is string=>typeof item==="string").slice(0,4)
    : ["markdown"];
  const response=await fetch(`${steelBaseUrl}/v1/scrape`,{
    method:"POST",
    headers:{"steel-api-key":key,"content-type":"application/json"},
    body:JSON.stringify({url:target.toString(),format}),
    signal:AbortSignal.timeout(45_000)
  });
  const raw=await response.text();
  if(Buffer.byteLength(raw,"utf8")>2*1024*1024) throw new Error("browser_response_too_large");
  if(!response.ok) throw new Error(`steel_scrape_failed:${response.status}`);
  const result=JSON.parse(raw) as unknown;

  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'browser_scrape','browser_broker','Brokered browser scrape completed',$3::jsonb)
  `,[tenantId,taskId,JSON.stringify({host:target.hostname,dataTaint:task.data_taint})]);
  return {
    provider:"steel",
    target:target.toString(),
    trust:"external_untrusted",
    instructionsAreAuthority:false,
    result
  };
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,provider:"steel",cdpExposed:false});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    if(req.url==="/v1/sessions") return json(res,201,await createSession(input));
    if(req.url==="/v1/sessions/release") return json(res,200,await releaseSession(input));
    if(req.url==="/v1/scrape") return json(res,200,await scrape(input));
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"browser_broker_error";
    const status=message.startsWith("sentinel_")?403:
      ["private_destination","https_required","task_not_executable","browser_session_not_found"].includes(message)?403:
      message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
if(!authdToken) throw new Error("AUTHD_SERVICE_TOKEN is required");
if(!sentinelToken) throw new Error("SENTINEL_SERVICE_TOKEN is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA browser broker listening on ${port}`));
