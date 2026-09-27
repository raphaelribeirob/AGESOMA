import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "@agesoma/db";

const MAX_BYTES=64*1024;

function sameHex(a:string,b:string){
  const left=Buffer.from(a,"hex");
  const right=Buffer.from(b,"hex");
  return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
}

function bearer(req:Request){
  const raw=req.headers.get("authorization")??"";
  return raw.startsWith("Bearer ")?raw.slice(7).trim():"";
}

function object(value:unknown):Record<string,unknown>|null{
  return value&&typeof value==="object"&&!Array.isArray(value)
    ? value as Record<string,unknown>
    : null;
}

export async function POST(
  req:Request,
  context:{params:Promise<{id:string}>}
){
  const {id}=await context.params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){
    return NextResponse.json({error:"Unauthorized routine webhook"},{status:401});
  }

  const declared=Number(req.headers.get("content-length")??0);
  if(Number.isFinite(declared)&&declared>MAX_BYTES){
    return NextResponse.json({error:"Payload too large"},{status:413});
  }

  const secret=bearer(req);
  if(secret.length<32||secret.length>256){
    return NextResponse.json({error:"Unauthorized routine webhook"},{status:401});
  }
  const suppliedHash=createHash("sha256").update(secret).digest("hex");

  const [routine]=await sql<{
    tenant_id:string;
    watcher_id:string;
    secret_hash:string;
  }>(`
    select w.tenant_id,w.id as watcher_id,s.secret_hash
    from watchers w
    join routine_webhook_secrets s
      on s.tenant_id=w.tenant_id and s.watcher_id=w.id
    where w.id=$1
      and w.status='active'
      and w.trigger_kind='webhook'
      and s.revoked_at is null
    limit 1
  `,[id]);

  if(!routine||!sameHex(suppliedHash,routine.secret_hash)){
    return NextResponse.json({error:"Unauthorized routine webhook"},{status:401});
  }

  const raw=await req.text();
  if(Buffer.byteLength(raw,"utf8")>MAX_BYTES){
    return NextResponse.json({error:"Payload too large"},{status:413});
  }

  let parsed:unknown={};
  if(raw.trim()){
    try{parsed=JSON.parse(raw);}catch{
      return NextResponse.json({error:"Webhook body must be valid JSON"},{status:400});
    }
  }
  const payload=object(parsed);
  if(!payload){
    return NextResponse.json({error:"Webhook body must be a JSON object"},{status:400});
  }

  const configuredLimit=Number(process.env.AGESOMA_ROUTINE_WEBHOOK_MAX_PER_HOUR??120);
  const maxPerHour=Number.isFinite(configuredLimit)&&configuredLimit>0
    ? Math.trunc(configuredLimit)
    : 120;
  const [usage]=await sql<{count:string|number}>(`
    select count(*) as count
    from routine_events
    where tenant_id=$1 and watcher_id=$2 and trigger_kind='webhook'
      and received_at>now()-interval '1 hour'
  `,[routine.tenant_id,routine.watcher_id]);
  if(Number(usage?.count??0)>=maxPerHour){
    return NextResponse.json({error:"Routine webhook rate limit exceeded"},{status:429});
  }

  const eventIdHeader=req.headers.get("x-agesoma-event-id")?.trim()??"";
  const idempotencyKey=eventIdHeader&&eventIdHeader.length<=240?eventIdHeader:null;
  const sourceHeader=req.headers.get("x-agesoma-event-source")?.trim()??"";
  const source=sourceHeader&&sourceHeader.length<=120?sourceHeader:"webhook";

  const inserted=await sql<{id:string}>(`
    insert into routine_events (
      tenant_id,watcher_id,trigger_kind,source,idempotency_key,payload,status
    ) values ($1,$2,'webhook',$3,$4,$5::jsonb,'pending')
    on conflict (watcher_id,idempotency_key) where idempotency_key is not null
    do nothing
    returning id
  `,[
    routine.tenant_id,
    routine.watcher_id,
    source,
    idempotencyKey,
    JSON.stringify(payload)
  ]);

  await sql(`
    update routine_webhook_secrets set last_used_at=now()
    where tenant_id=$1 and watcher_id=$2
  `,[routine.tenant_id,routine.watcher_id]);

  return NextResponse.json({
    accepted:true,
    deduplicated:inserted.length===0
  },{status:202});
}
