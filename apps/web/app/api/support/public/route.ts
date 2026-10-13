import {createHash,randomBytes} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {answerSupportQuestion,canPublishSupport,verifySupportSession,supportSessionSecret,SUPPORT_COOKIE} from "@agesoma/core";
import {sql,tenantSql,transaction} from "@agesoma/db";
import {latestSupportRelease} from "../../../../lib/support-release";
import {SUPPORT_SKILL_VERSION} from "@agesoma/core";

const schema=z.object({slug:z.string().regex(/^s-[a-f0-9]{26}$/),message:z.string().trim().min(3).max(1000)});
const failure=(error:string,status:number)=>NextResponse.json({error},{status});
type Directory={tenant_id:string;workspace_id:string};
type Workspace={id:string;owner_enabled:boolean};
type Knowledge={id:string;question:string;answer:string;enabled:boolean};
class QuotaExceeded extends Error{}

export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)return failure("Origem não autorizada.",403);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return failure("JSON obrigatório.",415);
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return failure("Pergunta inválida.",400);
 const {slug,message}=parsed.data;
 const rawCookie=req.headers.get("cookie")??"";
 const rawSession=rawCookie.split(";").map(c=>c.trim()).find(c=>c.startsWith(SUPPORT_COOKIE+"="))?.slice(SUPPORT_COOKIE.length+1)??null;
 const visitor=verifySupportSession(slug,rawSession,supportSessionSecret());
 if(!visitor)return failure("Sessão do visitante expirada. Reabra o atendimento.",401);
 const [directory]=await sql<Directory>(
  "select tenant_id,workspace_id from support_public_directory where slug=$1 limit 1",[slug]);
 if(!directory)return failure("Atendimento indisponível.",404);
 const tenantId=directory.tenant_id;
 const [[workspace],entitlements,knowledge]=await Promise.all([
  tenantSql<Workspace>(tenantId,"select id,owner_enabled from support_workspaces where tenant_id=$1 and id=$2 limit 1",[tenantId,directory.workspace_id]),
  tenantSql<{status:string}>(tenantId,"select status from billing_entitlements where tenant_id=$1 and product_key='support' and status in ('active','trialing') limit 1",[tenantId]),
  tenantSql<Knowledge>(tenantId,"select id,question,answer,enabled from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true limit 200",[tenantId,directory.workspace_id])
 ]);
 if(!workspace||!canPublishSupport({paidStatus:entitlements[0]?.status??null,ownerEnabled:workspace.owner_enabled,faqCount:knowledge.length}))
  return failure("Atendimento indisponível.",404);
 const release=await latestSupportRelease(tenantId,workspace.id);
 if(!release.ready)return failure("Atendimento não aprovado na avaliação de qualidade.",503);
 const result=answerSupportQuestion(message,knowledge);
 const token=result.status==="needs_human"?randomBytes(32).toString("hex"):null;
 const tokenHash=token?createHash("sha256").update(token).digest("hex"):null;
 try{
  await transaction(async client=>{
   // Each exceeded quota rolls back all counter increments and message writes.
   const [daily]=(await client.query<{hits:number}>(
    "insert into support_daily_usage(workspace_id,usage_date,hits) values($1,(now() at time zone 'utc')::date,1) on conflict(workspace_id,usage_date) do update set hits=support_daily_usage.hits+1 where support_daily_usage.hits<200 returning hits",
    [workspace.id])).rows;
   if(!daily)throw new QuotaExceeded();
   const [hourly]=(await client.query<{hits:number}>(
    "insert into support_hourly_usage(workspace_id,usage_hour,hits) values($1,date_trunc('hour',now()),1) on conflict(workspace_id,usage_hour) do update set hits=support_hourly_usage.hits+1 where support_hourly_usage.hits<40 returning hits",
    [workspace.id])).rows;
   if(!hourly)throw new QuotaExceeded();
   const [visitorUsage]=(await client.query<{hits:number}>(
    "insert into support_visitor_usage(workspace_id,visitor_hash,usage_date,hits) values($1,$2,(now() at time zone 'utc')::date,1) on conflict(workspace_id,visitor_hash,usage_date) do update set hits=support_visitor_usage.hits+1 where support_visitor_usage.hits<12 returning hits",
    [workspace.id,visitor])).rows;
   if(!visitorUsage)throw new QuotaExceeded();

   const [stored]=(await client.query<{id:string}>(
    "insert into support_messages(tenant_id,workspace_id,question,answer,status,knowledge_id,skill_version) values($1,$2,$3,$4,$5,$6,$7) returning id",
    [tenantId,workspace.id,message,result.reply,result.status,result.knowledgeId,SUPPORT_SKILL_VERSION])).rows;
   if(tokenHash){
    await client.query(
     "insert into support_tickets(tenant_id,workspace_id,message_id,lookup_hash) values($1,$2,$3,$4)",
     [tenantId,workspace.id,stored.id,tokenHash]);
   }
  });
 }catch(error){
  if(error instanceof QuotaExceeded)return failure("Limite de atendimento temporariamente atingido. Tente novamente mais tarde.",429);
  throw error;
 }
 return NextResponse.json({
  reply:result.reply,status:result.status,
  needsHuman:result.status==="needs_human",
  ticketToken:token,source:result.status==="answered"?"approved_business_knowledge":null
 },{headers:{"cache-control":"no-store"}});
}
