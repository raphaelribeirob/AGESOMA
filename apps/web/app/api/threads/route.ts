import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";
import { ensureMainThread } from "../../../lib/conversation";

const createSchema=z.object({
  title:z.string().min(1).max(120),
  parentThreadId:z.string().uuid().optional(),
  sourceTaskId:z.string().uuid().optional(),
  sourceArtifactId:z.string().uuid().optional()
});

const patchSchema=z.object({
  id:z.string().uuid(),
  title:z.string().min(1).max(120).optional(),
  status:z.enum(["active","archived"]).optional()
});

export async function GET(req:Request){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});

  const main=await ensureMainThread(authenticated.tenantId,authenticated.actorId);
  const url=new URL(req.url);
  const requested=url.searchParams.get("threadId");
  const threadId=requested&&z.string().uuid().safeParse(requested).success?requested:main.id;

  const [threads,messages]=await Promise.all([
    tenantSql(authenticated.tenantId,`
      select id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
      from conversation_threads
      where tenant_id=$1 and status='active'
      order by case kind when 'main' then 0 else 1 end,last_message_at desc nulls last,updated_at desc
      limit 30
    `,[authenticated.tenantId]),
    tenantSql(authenticated.tenantId,`
      select id,thread_id,task_id,role,content,metadata,created_at
      from conversation_messages
      where tenant_id=$1 and thread_id=$2
      order by created_at asc
      limit 300
    `,[authenticated.tenantId,threadId])
  ]);

  return NextResponse.json({mainThreadId:main.id,selectedThreadId:threadId,threads,messages});
}

export async function POST(req:Request){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});
  const parsed=createSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Conversa inválida."},{status:400});

  const main=await ensureMainThread(authenticated.tenantId,authenticated.actorId);
  const input=parsed.data;
  const parentId=input.parentThreadId??main.id;

  const [parent]=await tenantSql<{id:string}>(authenticated.tenantId,`
    select id from conversation_threads
    where tenant_id=$1 and id=$2 and status='active'
    limit 1
  `,[authenticated.tenantId,parentId]);
  if(!parent) return NextResponse.json({error:"Conversa de origem não encontrada."},{status:404});

  const [thread]=await tenantSql(authenticated.tenantId,`
    insert into conversation_threads (
      tenant_id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,created_by
    ) values ($1,'side',$2,'active',$3,$4,$5,$6)
    returning id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
  `,[
    authenticated.tenantId,input.title.trim(),parentId,input.sourceTaskId??null,
    input.sourceArtifactId??null,authenticated.actorId
  ]);
  return NextResponse.json(thread,{status:201});
}

export async function PATCH(req:Request){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});
  const parsed=patchSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Atualização inválida."},{status:400});

  const input=parsed.data;
  const [thread]=await tenantSql(authenticated.tenantId,`
    update conversation_threads set
      title=coalesce($3,title),
      status=coalesce($4,status),
      updated_at=now()
    where tenant_id=$1 and id=$2 and kind='side'
    returning id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
  `,[authenticated.tenantId,input.id,input.title?.trim()??null,input.status??null]);
  if(!thread) return NextResponse.json({error:"Side chat não encontrado."},{status:404});
  return NextResponse.json(thread);
}
