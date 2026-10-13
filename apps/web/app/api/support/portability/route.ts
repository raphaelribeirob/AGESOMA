import {NextResponse} from "next/server";
import {z} from "zod";
import {SUPPORT_SKILL_VERSION} from "@agesoma/core";
import {tenantSql,transaction} from "@agesoma/db";
import {resolveAuthenticatedWorkspace} from "../../../../lib/auth-workspace";

const fail=(error:string,status:number)=>NextResponse.json({error},{status});
const entry=z.object({
 question:z.string().trim().min(5).max(300),
 answer:z.string().trim().min(5).max(2000)
}).strict();
const bundle=z.object({
 format:z.literal("agesoma.support.knowledge.v1"),
 entries:z.array(entry).min(1).max(100)
}).strict();

export async function GET(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Entre na sua conta.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Apenas owner/admin pode exportar conhecimento.",403);
 const [workspace]=await tenantSql<{id:string}>(actor.tenantId,
  "select id from support_workspaces where tenant_id=$1 limit 1",[actor.tenantId]);
 if(!workspace)return fail("Configure seu atendimento.",409);
 const entries=await tenantSql<{question:string;answer:string}>(actor.tenantId,
  "select question,answer from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true order by created_at,id limit 200",
  [actor.tenantId,workspace.id]);
 return new NextResponse(JSON.stringify({
  format:"agesoma.support.knowledge.v1",
  skill:SUPPORT_SKILL_VERSION,
  entries,
  notice:"A exportação contém apenas conhecimento aprovado. Não inclui clientes, tickets, mensagens, pagamentos ou chaves de API."
 },null,2),{
  status:200,
  headers:{"content-type":"application/json; charset=utf-8",
   "content-disposition":'attachment; filename="agesoma-support-knowledge.json"',
   "cache-control":"private, no-store"}
 });
}

export async function POST(req:Request){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Entre na sua conta.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Apenas owner/admin pode importar conhecimento.",403);
 if(req.headers.get("origin")!==new URL(req.url).origin)return fail("Origem inválida.",403);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return fail("JSON obrigatório.",415);
 const size=Number(req.headers.get("content-length")??0);
 if(size>130000)return fail("Arquivo acima do limite.",413);
 const body=await req.text();
 if(body.length>130000)return fail("Arquivo acima do limite.",413);
 let parsed:unknown;
 try{parsed=JSON.parse(body);}catch{return fail("JSON inválido.",400);}
 const decoded=bundle.safeParse(parsed);
 if(!decoded.success)return fail("Formato de importação inválido.",400);
 const entries=decoded.data.entries;
 const unique=new Set(entries.map(e=>e.question.trim().toLocaleLowerCase("pt-BR")));
 if(unique.size!==entries.length)return fail("Há perguntas duplicadas no arquivo.",409);
 try{
  const inserted=await transaction(async client=>{
   // Honor the same tenant RLS context used by other app endpoints.
   await client.query("set local role authenticated");
   await client.query("select set_config('app.tenant_id',$1,true)",[actor.tenantId]);
   const [workspace]=(await client.query<{id:string}>(
    "select id from support_workspaces where tenant_id=$1 for update",[actor.tenantId])).rows;
   if(!workspace)throw new Error("workspace_missing");
   const [counts]=(await client.query<{count:number}>(
    "select count(*)::int as count from support_knowledge where tenant_id=$1 and workspace_id=$2",
    [actor.tenantId,workspace.id])).rows;
   if(counts.count+entries.length>200)throw new Error("knowledge_limit");
   const saved=await client.query<{id:string}>([
    "insert into support_knowledge(tenant_id,workspace_id,question,answer,created_by)",
    "select $1,$2,x.question,x.answer,$4",
    "from jsonb_to_recordset($3::jsonb) as x(question text,answer text)",
    "returning id"
   ].join(" "),[actor.tenantId,workspace.id,JSON.stringify(entries),actor.actorId]);
   return saved.rowCount??0;
  });
  return NextResponse.json({imported:inserted,publication:"blocked_until_new_qa_run"},
   {status:201,headers:{"cache-control":"no-store"}});
 }catch(e){
  if(e instanceof Error&&e.message==="knowledge_limit")return fail("Limite de 200 respostas por empresa.",409);
  if(e instanceof Error&&e.message==="workspace_missing")return fail("Configure seu atendimento primeiro.",409);
  throw e;
 }
}
