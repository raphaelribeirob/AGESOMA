import {NextResponse} from "next/server";
import {z} from "zod";
import {answerSupportQuestion,SUPPORT_SKILL_VERSION} from "@agesoma/core";
import {latestSupportRelease} from "../../../../lib/support-release";
import {tenantSql} from "@agesoma/db";
import {resolveAuthenticatedWorkspace} from "../../../../lib/auth-workspace";

const fail=(error:string,status:number)=>NextResponse.json({error},{status});
const create=z.object({
 action:z.literal("add"),question:z.string().trim().min(3).max(1000),
 expectedStatus:z.enum(["answered","needs_human"]),knowledgeId:z.string().uuid().nullable()
}).refine(x=>x.expectedStatus==="answered"?x.knowledgeId!==null:x.knowledgeId===null);
const run=z.object({action:z.literal("run")});
const command=z.union([create,run]);
type TestCase={id:string;question:string;expected_status:"answered"|"needs_human";expected_knowledge_id:string|null};
type Knowledge={id:string;question:string;answer:string;enabled:boolean};

async function workspace(tenantId:string){
 const [item]=await tenantSql<{id:string;content_version:number|string}>(tenantId,
 "select id,content_version from support_workspaces where tenant_id=$1 limit 1",[tenantId]);
 return item;
}
export async function GET(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Autenticação necessária.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Somente o responsável pode avaliar.",403);
 const [cases,runs]=await Promise.all([
  tenantSql<TestCase>(actor.tenantId,
   "select id,question,expected_status,expected_knowledge_id from support_eval_cases where tenant_id=$1 order by created_at desc limit 100",[actor.tenantId]),
  tenantSql<{id:string;cases_count:number;passed_count:number;created_at:Date|string}>(actor.tenantId,
   "select id,cases_count,passed_count,created_at from support_eval_runs where tenant_id=$1 order by created_at desc limit 10",[actor.tenantId])
 ]);
 const ws=await workspace(actor.tenantId);
 const release=ws?await latestSupportRelease(actor.tenantId,ws.id):{ready:false,reason:"workspace_missing"};
 return NextResponse.json({cases,runs,release,note:"Avaliações manuais com gabarito. A aprovação do teste não comprova resolução empresarial."},{headers:{"cache-control":"no-store"}});
}
export async function POST(req:Request){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Autenticação necessária.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Somente o responsável pode avaliar.",403);
 if(req.headers.get("origin")!==new URL(req.url).origin)return fail("Origem inválida.",403);
 const input=command.safeParse(await req.json().catch(()=>null));
 if(!input.success)return fail("Avaliação inválida.",400);
 const ws=await workspace(actor.tenantId);
 if(!ws)return fail("Primeiro configure o atendimento.",409);
 if(input.data.action==="add"){
  const data=input.data;
  const [count]=await tenantSql<{n:number}>(actor.tenantId,"select count(*)::int as n from support_eval_cases where tenant_id=$1",[actor.tenantId]);
  if((count?.n??0)>=100)return fail("Limite de avaliações alcançado.",409);
  if(data.knowledgeId){
   const [source]=await tenantSql<{id:string}>(actor.tenantId,
    "select id from support_knowledge where tenant_id=$1 and workspace_id=$2 and id=$3 and enabled=true",
    [actor.tenantId,ws.id,data.knowledgeId]);
   if(!source)return fail("Resposta de referência inválida.",400);
  }
  const [saved]=await tenantSql<{id:string}>(actor.tenantId,
   "insert into support_eval_cases(tenant_id,workspace_id,question,expected_status,expected_knowledge_id,created_by) values($1,$2,$3,$4,$5,$6) returning id",
   [actor.tenantId,ws.id,data.question,data.expectedStatus,data.knowledgeId,actor.actorId]);
  return NextResponse.json({id:saved.id},{status:201});
 }
 const [tests,knowledge]=await Promise.all([
  tenantSql<TestCase>(actor.tenantId,"select id,question,expected_status,expected_knowledge_id from support_eval_cases where tenant_id=$1 and workspace_id=$2 limit 100",[actor.tenantId,ws.id]),
  tenantSql<Knowledge>(actor.tenantId,"select id,question,answer,enabled from support_knowledge where tenant_id=$1 and workspace_id=$2 limit 200",[actor.tenantId,ws.id])
 ]);
 if(!tests.length)return fail("Cadastre casos de avaliação antes de executar.",409);
 const details=tests.map(item=>{
  const result=answerSupportQuestion(item.question,knowledge);
  const passed=result.status===item.expected_status
   &&(item.expected_status==="needs_human"||result.knowledgeId===item.expected_knowledge_id);
  return {caseId:item.id,passed,expected:item.expected_status,actual:result.status};
 });
 const passedCount=details.filter(d=>d.passed).length;
 const [saved]=await tenantSql<{id:string}>(actor.tenantId,
  "insert into support_eval_runs(tenant_id,workspace_id,cases_count,passed_count,details,run_by,content_version,skill_version) values($1,$2,$3,$4,$5::jsonb,$6,$7,$8) returning id",
  [actor.tenantId,ws.id,tests.length,passedCount,JSON.stringify(details),actor.actorId,ws.content_version,SUPPORT_SKILL_VERSION]);
 return NextResponse.json({runId:saved.id,passed:passedCount,total:tests.length,details},
  {headers:{"cache-control":"no-store"}});
}
