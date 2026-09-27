import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { sql } from "@agesoma/db";

const port=Number(process.env.PORT??8084);
const masterSecret=process.env.TRUST_STORE_MASTER_SECRET?.trim()??"";

function json(res:ServerResponse,status:number,value:unknown){
  const raw=JSON.stringify(value);
  res.writeHead(status,{"content-type":"application/json","content-length":Buffer.byteLength(raw)});
  res.end(raw);
}

async function readJson(req:IncomingMessage,max=128*1024){
  const chunks:Buffer[]=[]; let size=0;
  for await(const chunk of req){
    const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=data.length;
    if(size>max) throw new Error("request_too_large");
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string,unknown>;
}

function text(input:Record<string,unknown>,key:string){
  const value=input[key];
  return typeof value==="string"&&value.trim()?value.trim():null;
}

type TrustCaller="sentinel"|"authd"|"browser_broker"|"browser_cdp_gateway";

function tenantToken(caller:TrustCaller,tenantId:string){
  return createHmac("sha256",masterSecret).update(`${caller}:${tenantId}`).digest("hex");
}

function sameSecret(a:string,b:string){
  const left=Buffer.from(a); const right=Buffer.from(b);
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function authorizeTenant(req:IncomingMessage,input:Record<string,unknown>){
  const tenantId=text(input,"tenantId");
  const caller=req.headers["x-agesoma-trust-caller"];
  const supplied=req.headers["x-agesoma-trust-token"];
  if((caller!=="sentinel"&&caller!=="authd"&&caller!=="browser_broker"&&caller!=="browser_cdp_gateway")||!tenantId||typeof supplied!=="string") {
    throw new Error("forbidden");
  }
  if(!sameSecret(supplied,tenantToken(caller,tenantId))) throw new Error("forbidden");
  return {tenantId,caller:caller as TrustCaller};
}

function callerMayUse(caller:TrustCaller,path:string){
  if(caller==="sentinel") return path.startsWith("/v1/sentinel/");
  if(caller==="authd") return path.startsWith("/v1/authd/");
  if(caller==="browser_cdp_gateway") return path==="/v1/browser/cdp-context";
  return path.startsWith("/v1/browser/");
}

async function sentinelContext(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const grantRef=text(input,"grantRef");
  if(!taskId) throw new Error("task_id_required");

  const [task]=await sql<{
    id:string; action_type:string|null; risk_class:string; status:string;
    data_taint:string; payload:Record<string,unknown>;
  }>(`
    select id,action_type,risk_class,status,data_taint,payload
    from tasks where tenant_id=$1 and id=$2 limit 1
  `,[tenantId,taskId]);

  let approvalGrant:null|Record<string,unknown>=null;
  let autonomyGrant:null|Record<string,unknown>=null;

  if(grantRef?.startsWith("autonomy:")){
    const id=grantRef.slice("autonomy:".length);
    const [rule]=await sql(`
      select id,action_class,destination,operation,resource_pattern,decision,max_amount_cents,
             approved_by,expires_at,revoked_at,created_at
      from autonomy_rules
      where tenant_id=$1 and id=$2 limit 1
    `,[tenantId,id]);
    autonomyGrant=rule??null;
  }else if(grantRef){
    const [grant]=await sql(`
      select id,task_id,action_class,scope,scope_hash,approved_by,nonce,consumed_at,
             expires_at,revoked_at,created_at
      from approval_grants
      where tenant_id=$1 and id=$2 limit 1
    `,[tenantId,grantRef]);
    approvalGrant=grant??null;
  }

  const autonomyRules=task?.action_type
    ? await sql(`
        select id,action_class,destination,operation,resource_pattern,decision,max_amount_cents,
               approved_by,expires_at,revoked_at,created_at
        from autonomy_rules
        where tenant_id=$1 and action_class=$2
          and revoked_at is null
          and (expires_at is null or expires_at>now())
        order by created_at desc
      `,[tenantId,task.action_type])
    : [];

  let toolRecipe:null|Record<string,unknown>=null;
  if(task?.action_type==="api.tool_read"){
    const recipeId=task.payload&&typeof task.payload==="object"&&!Array.isArray(task.payload)
      && typeof task.payload.recipeId==="string" ? task.payload.recipeId : null;
    if(recipeId){
      const [recipe]=await sql(`
        select id,status,risk_class,auth_mode,base_url,definition
        from tool_recipes
        where tenant_id=$1 and id=$2
        limit 1
      `,[tenantId,recipeId]);
      toolRecipe=recipe??null;
    }
  }

  return {task:task??null,approvalGrant,autonomyGrant,autonomyRules,toolRecipe};
}

async function sentinelRecord(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  if(!taskId) throw new Error("task_id_required");

  const [task]=await sql<{id:string}>(`
    select id from tasks where tenant_id=$1 and id=$2 limit 1
  `,[tenantId,taskId]);
  if(!task) throw new Error("task_not_found");

  const grantRef=text(input,"grantRef");
  if(grantRef){
    const [grant]=await sql<{id:string}>(`
      select id from approval_grants
      where tenant_id=$1 and task_id=$2 and id=$3
      limit 1
    `,[tenantId,taskId,grantRef]);
    if(!grant) throw new Error("grant_not_found");
  }

  const [row]=await sql<{id:string}>(`
    insert into egress_decisions (
      tenant_id,task_id,destination,operation,action_class,decision,reason,capability_hash,
      method,path,protocol,resolved_ip,data_taint,request_meta,grant_ref,policy_version
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::inet,$13,$14::jsonb,$15::uuid,$16)
    returning id
  `,[
    tenantId,taskId,text(input,"destination")??"unknown",text(input,"operation"),
    text(input,"actionClass")??"unknown",text(input,"decision")??"DENY",
    text(input,"reason")??"unspecified",text(input,"capabilityHash"),
    text(input,"method"),text(input,"path"),text(input,"protocol"),text(input,"resolvedIp"),
    text(input,"dataTaint")??"clean",JSON.stringify(input.requestMeta??{}),
    grantRef,text(input,"policyVersion")??"sentinel-v3"
  ]);

  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'egress_decision','sentinel',$3,$4::jsonb)
  `,[
    tenantId,taskId,`${text(input,"decision")??"DENY"}: ${text(input,"operation")??"unknown"}`,
    JSON.stringify({decisionId:row.id,destination:text(input,"destination"),reason:text(input,"reason")})
  ]);
  return {decisionId:row.id};
}

async function authdContext(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const provider=text(input,"provider");
  const handle=text(input,"handle");
  const caller=text(input,"caller");
  const purpose=text(input,"purpose");
  if(!taskId||!provider||!handle||!caller||!purpose) throw new Error("authd_context_incomplete");

  const [task]=await sql<{id:string}>(`
    select id from tasks
    where tenant_id=$1 and id=$2 and status in ('running','queued')
    limit 1
  `,[tenantId,taskId]);
  if(!task) throw new Error("task_not_executable");

  const [credential]=await sql<{id:string;scopes:unknown}>(`
    select id,scopes from credential_handles
    where tenant_id=$1 and provider=$2 and handle=$3 and status='active'
    limit 1
  `,[tenantId,provider,handle]);
  if(!credential) throw new Error("surrogate_not_active");

  const scopes=Array.isArray(credential.scopes)
    ? credential.scopes.filter((item):item is string=>typeof item==="string")
    : [];
  const requestedScope=`${caller}:${purpose}`;
  if(!scopes.includes(requestedScope)) throw new Error("credential_scope_denied");

  await sql(`
    update credential_handles set last_used_at=now(),updated_at=now()
    where tenant_id=$1 and id=$2
  `,[tenantId,credential.id]);
  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'credential_resolved','authd',$3,$4::jsonb)
  `,[
    tenantId,taskId,`Authorized surrogate for ${provider}`,
    JSON.stringify({provider,handle,caller,purpose,credentialExposedToRuntime:false})
  ]);
  return {allowed:true,credentialHandleId:credential.id,scopes};
}

async function browserContext(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  if(!taskId) throw new Error("task_id_required");
  const [task]=await sql<{id:string;action_type:string|null;data_taint:string;worker_id:string|null}>(`
    select id,action_type,data_taint,worker_id from tasks
    where tenant_id=$1 and id=$2 and status in ('running','queued')
    limit 1
  `,[tenantId,taskId]);
  if(!task) throw new Error("task_not_executable");
  const [worker]=task.worker_id
    ? await sql<{browser_profile_ref:string|null}>(`
        select browser_profile_ref
        from persistent_workers
        where tenant_id=$1 and id=$2 and status='active'
        limit 1
      `,[tenantId,task.worker_id])
    : [];
  const [cell]=!worker
    ? await sql<{browser_profile_ref:string|null}>(`
        select browser_profile_ref from work_cells where tenant_id=$1 limit 1
      `,[tenantId])
    : [];
  const [sessions]=await sql<{count:string|number}>(`
    select count(*) as count from browser_sessions where tenant_id=$1 and task_id=$2
  `,[tenantId,taskId]);
  const [scrapes]=await sql<{count:string|number}>(`
    select count(*) as count from runtime_events
    where tenant_id=$1 and task_id=$2 and event_type='browser_scrape'
  `,[tenantId,taskId]);
  return {
    task,
    browserProfileRef:worker?.browser_profile_ref??cell?.browser_profile_ref??null,
    sessionCount:Number(sessions?.count??0),
    scrapeCount:Number(scrapes?.count??0)
  };
}

async function browserSessionContext(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const sessionId=text(input,"sessionId");
  if(!taskId||!sessionId) throw new Error("task_and_session_required");

  const [row]=await sql<{
    provider_session_id:string;data_taint:string;last_url:string|null;safety_state:unknown;
    action_type:string|null;task_status:string;
  }>(`
    select bs.provider_session_id,bs.data_taint,bs.last_url,bs.safety_state,
           t.action_type,t.status as task_status
    from browser_sessions bs
    join tasks t on t.tenant_id=bs.tenant_id and t.id=bs.task_id
    where bs.tenant_id=$1 and bs.task_id=$2 and bs.provider_session_id=$3
      and bs.status='live'
    limit 1
  `,[tenantId,taskId,sessionId]);
  if(!row||!["running","queued"].includes(row.task_status)) throw new Error("browser_session_not_authorized");
  return row;
}

async function browserCdpContext(input:Record<string,unknown>){
  const row=await browserSessionContext(input);
  if(!["business.observe","business.work"].includes(row.action_type??"")){
    throw new Error("browser_capability_not_granted");
  }
  return {allowed:true,sessionId:row.provider_session_id};
}

async function browserSafetyEvent(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const sessionId=text(input,"sessionId");
  if(!taskId) throw new Error("task_id_required");

  const [task]=await sql<{id:string}>(`
    select id from tasks
    where tenant_id=$1 and id=$2 and status in ('running','queued')
    limit 1
  `,[tenantId,taskId]);
  if(!task) throw new Error("task_not_executable");

  if(sessionId) await browserSessionContext(input);

  const decision=text(input,"decision")??"ALLOW";
  const eventType=text(input,"eventType")??"browser_safety";
  const url=text(input,"url");
  const reasons=Array.isArray(input.reasons)
    ? input.reasons.filter((item):item is string=>typeof item==="string").slice(0,12)
    : [];

  if(sessionId){
    await sql(`
      update browser_sessions
      set last_snapshot_at=case when $4 like '%snapshot%' then now() else last_snapshot_at end,
          last_url=coalesce($5,last_url),
          safety_state=$6::jsonb,
          updated_at=now()
      where tenant_id=$1 and task_id=$2 and provider_session_id=$3 and status='live'
    `,[
      tenantId,taskId,sessionId,eventType,url,
      JSON.stringify({decision,reasons,eventType,updatedAt:new Date().toISOString()})
    ]);
  }

  await sql(`
    insert into runtime_events (tenant_id,task_id,session_ref,event_type,trust_zone,summary,metadata)
    values ($1,$2,$3,$4,'browser_safety',$5,$6::jsonb)
  `,[
    tenantId,taskId,sessionId,eventType,
    `${decision}: ${eventType}`,
    JSON.stringify({decision,reasons,url})
  ]);
  return {ok:true};
}

async function browserSessionCreated(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const sessionId=text(input,"sessionId");
  if(!taskId||!sessionId) throw new Error("browser_event_incomplete");
  const profileId=text(input,"profileId");
  const dataTaint=text(input,"dataTaint")??"clean";
  await sql(`
    insert into browser_sessions (
      tenant_id,task_id,provider,provider_session_id,profile_ref,mode,interactive,status,data_taint
    ) values ($1,$2,'steel',$3,$4,'brokered',false,'live',$5)
  `,[tenantId,taskId,sessionId,profileId,dataTaint]);
  if(profileId){
    const [task]=await sql<{worker_id:string|null}>(`
      select worker_id from tasks where tenant_id=$1 and id=$2 limit 1
    `,[tenantId,taskId]);
    if(task?.worker_id){
      await sql(`
        update persistent_workers
        set browser_profile_ref=$3,last_active_at=now(),updated_at=now()
        where tenant_id=$1 and id=$2
      `,[tenantId,task.worker_id,profileId]);
    }else{
      await sql(`
        update work_cells set browser_profile_ref=$2,last_active_at=now(),updated_at=now()
        where tenant_id=$1
      `,[tenantId,profileId]);
    }
  }
  await sql(`
    insert into runtime_events (tenant_id,task_id,session_ref,event_type,trust_zone,summary,metadata)
    values ($1,$2,$3,'browser_session_created','browser_broker','Steel session created',$4::jsonb)
  `,[tenantId,taskId,sessionId,JSON.stringify({provider:"steel",profileId,interactive:false,cdpExposedToRuntime:false})]);
  return {ok:true};
}

async function browserSessionReleased(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  const sessionId=text(input,"sessionId");
  if(!taskId||!sessionId) throw new Error("browser_event_incomplete");
  const [stored]=await sql<{id:string}>(`
    update browser_sessions set status='released',released_at=now(),updated_at=now()
    where tenant_id=$1 and provider_session_id=$2 and status='live'
    returning id
  `,[tenantId,sessionId]);
  if(!stored) throw new Error("browser_session_not_found");
  await sql(`
    insert into runtime_events (tenant_id,task_id,session_ref,event_type,trust_zone,summary)
    values ($1,$2,$3,'browser_session_released','browser_broker','Steel session released')
  `,[tenantId,taskId,sessionId]);
  return {ok:true};
}

async function browserScrapeEvent(input:Record<string,unknown>){
  const tenantId=text(input,"tenantId")!;
  const taskId=text(input,"taskId");
  if(!taskId) throw new Error("task_id_required");
  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'browser_scrape','browser_broker','Brokered browser scrape completed',$3::jsonb)
  `,[tenantId,taskId,JSON.stringify({host:text(input,"host"),dataTaint:text(input,"dataTaint")??"clean"})]);
  return {ok:true};
}

const server=createServer(async(req,res)=>{
  try{
    if(req.method==="GET"&&req.url==="/health") return json(res,200,{ok:true,mode:"control-plane-only"});
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    const input=await readJson(req);
    const auth=authorizeTenant(req,input);
    if(!callerMayUse(auth.caller,req.url??"")) return json(res,403,{error:"forbidden"});

    if(req.url==="/v1/sentinel/context") return json(res,200,await sentinelContext(input));
    if(req.url==="/v1/sentinel/record") return json(res,200,await sentinelRecord(input));
    if(req.url==="/v1/authd/context") return json(res,200,await authdContext(input));
    if(req.url==="/v1/browser/context") return json(res,200,await browserContext(input));
    if(req.url==="/v1/browser/session-context") return json(res,200,await browserSessionContext(input));
    if(req.url==="/v1/browser/cdp-context") return json(res,200,await browserCdpContext(input));
    if(req.url==="/v1/browser/safety-event") return json(res,200,await browserSafetyEvent(input));
    if(req.url==="/v1/browser/session-created") return json(res,200,await browserSessionCreated(input));
    if(req.url==="/v1/browser/session-released") return json(res,200,await browserSessionReleased(input));
    if(req.url==="/v1/browser/scrape-event") return json(res,200,await browserScrapeEvent(input));
    return json(res,404,{error:"not_found"});
  }catch(error){
    const message=error instanceof Error?error.message:"trust_store_error";
    const status=message==="forbidden"?403:message==="request_too_large"?413:400;
    return json(res,status,{error:message});
  }
});

if(!masterSecret) throw new Error("TRUST_STORE_MASTER_SECRET is required");
server.listen(port,"0.0.0.0",()=>console.log(`AGESOMA trust store listening on ${port}`));
