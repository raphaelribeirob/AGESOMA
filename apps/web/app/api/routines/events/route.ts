import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@agesoma/db";
import { requireInternalApi, requireJson } from "../../../../lib/security";

const schema=z.object({
  tenantId:z.string().uuid(),
  eventKind:z.string().min(2).max(120),
  source:z.string().min(1).max(120),
  idempotencyKey:z.string().min(1).max(240).optional(),
  payload:z.record(z.string(),z.unknown()).default({})
});

export async function POST(req:Request){
  const unauthorized=requireInternalApi(req);
  if(unauthorized) return unauthorized;
  const wrongType=requireJson(req);
  if(wrongType) return wrongType;

  const raw=await req.text();
  if(Buffer.byteLength(raw,"utf8")>64*1024){
    return NextResponse.json({error:"Event payload too large"},{status:413});
  }
  let value:unknown=null;
  try{value=JSON.parse(raw);}catch{
    return NextResponse.json({error:"Invalid event request"},{status:400});
  }
  const parsed=schema.safeParse(value);
  if(!parsed.success){
    return NextResponse.json({error:"Invalid event request"},{status:400});
  }
  const input=parsed.data;

  const routines=await sql<{id:string}>(`
    select id
    from watchers
    where tenant_id=$1
      and status='active'
      and trigger_kind='event'
      and trigger_config->>'eventKind'=$2
    order by created_at asc
    limit 100
  `,[input.tenantId,input.eventKind]);

  let accepted=0;
  for(const routine of routines){
    const rows=await sql<{id:string}>(`
      insert into routine_events (
        tenant_id,watcher_id,trigger_kind,source,idempotency_key,payload,status
      ) values ($1,$2,'event',$3,$4,$5::jsonb,'pending')
      on conflict (watcher_id,idempotency_key) where idempotency_key is not null
      do nothing
      returning id
    `,[
      input.tenantId,
      routine.id,
      input.source,
      input.idempotencyKey??null,
      JSON.stringify(input.payload)
    ]);
    accepted+=rows.length;
  }

  return NextResponse.json({
    accepted,
    matched:routines.length,
    eventKind:input.eventKind
  },{status:202});
}
