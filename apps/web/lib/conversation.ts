import { tenantSql } from "@agesoma/db";

export type ConversationThread = {
  id: string;
  kind: "main" | "side";
  title: string;
  status: "active" | "archived";
  parent_thread_id: string | null;
  source_task_id: string | null;
  source_artifact_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureMainThread(tenantId:string,actorId:string){
  const [thread]=await tenantSql<ConversationThread>(tenantId,`
    with existing as (
      select id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
      from conversation_threads
      where tenant_id=$1 and kind='main' and status='active'
      order by created_at asc
      limit 1
    ),
    inserted as (
      insert into conversation_threads (tenant_id,kind,title,status,created_by)
      select $1,'main','Conversa principal','active',$2
      where not exists (select 1 from existing)
      returning id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
    )
    select * from existing
    union all
    select * from inserted
    limit 1
  `,[tenantId,actorId]);
  if(!thread) throw new Error("Não foi possível abrir a conversa principal.");
  return thread;
}

export async function resolveConversationThread(tenantId:string,actorId:string,threadId?:string|null){
  if(threadId){
    const [thread]=await tenantSql<ConversationThread>(tenantId,`
      select id,kind,title,status,parent_thread_id,source_task_id,source_artifact_id,last_message_at,created_at,updated_at
      from conversation_threads
      where tenant_id=$1 and id=$2 and status='active'
      limit 1
    `,[tenantId,threadId]);
    if(thread) return thread;
  }
  return ensureMainThread(tenantId,actorId);
}

export async function appendConversationMessage(input:{
  tenantId:string;
  threadId:string;
  role:"user"|"assistant";
  content:string;
  taskId?:string|null;
  metadata?:Record<string,unknown>;
}){
  const [message]=await tenantSql(input.tenantId,`
    insert into conversation_messages (tenant_id,thread_id,task_id,role,content,metadata)
    values ($1,$2,$3,$4,$5,$6::jsonb)
    returning id,thread_id,task_id,role,content,metadata,created_at
  `,[
    input.tenantId,input.threadId,input.taskId??null,input.role,input.content,
    JSON.stringify(input.metadata??{})
  ]);
  await tenantSql(input.tenantId,`
    update conversation_threads
    set last_message_at=now(),updated_at=now()
    where tenant_id=$1 and id=$2
  `,[input.tenantId,input.threadId]);
  return message;
}
