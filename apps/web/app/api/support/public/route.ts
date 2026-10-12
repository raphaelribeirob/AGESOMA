import { NextResponse } from "next/server";
import { z } from "zod";
import { answerSupportQuestion, canPublishSupport } from "@agesoma/core";
import { sql, tenantSql } from "@agesoma/db";

const schema=z.object({slug:z.string().regex(/^s-[a-f0-9]{26}$/),message:z.string().trim().min(3).max(1000)});
const failure=(error:string,status:number)=>NextResponse.json({error},{status});
type Directory={tenant_id:string;workspace_id:string};
type Workspace={id:string;owner_enabled:boolean};
type Entitlement={status:string};
type Knowledge={id:string;question:string;answer:string;enabled:boolean};

export async function POST(req:Request) {
  if(!req.headers.get("content-type")?.startsWith("application/json"))return failure("JSON obrigatório.",415);
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return failure("Pergunta inválida.",400);
  const {slug,message}=parsed.data;
  // Directory intentionally exposes only a public random slug -> tenant mapping.
  const [directory]=await sql<Directory>(
    "select tenant_id,workspace_id from support_public_directory where slug=$1 limit 1",[slug]);
  if(!directory)return failure("Atendimento indisponível.",404);
  const tenantId=directory.tenant_id;
  const [[workspace],entitlements,knowledge]=await Promise.all([
    tenantSql<Workspace>(tenantId,"select id,owner_enabled from support_workspaces where tenant_id=$1 and id=$2 limit 1",[tenantId,directory.workspace_id]),
    tenantSql<Entitlement>(tenantId,"select status from billing_entitlements where tenant_id=$1 and product_key='support' and status in ('active','trialing') order by latest_occurred_at desc limit 1",[tenantId]),
    tenantSql<Knowledge>(tenantId,"select id,question,answer,enabled from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true limit 200",[tenantId,directory.workspace_id])
  ]);
  if(!workspace || !canPublishSupport({paidStatus:entitlements[0]?.status??null,ownerEnabled:workspace.owner_enabled,faqCount:knowledge.length})){
    return failure("Atendimento indisponível.",404);
  }
  // Atomic server-side per-workspace daily cap. Does not trust client-supplied IP.
  const [usage]=await sql<{hits:number}>([
    "insert into support_daily_usage(workspace_id,usage_date,hits)",
    "values($1,(now() at time zone 'utc')::date,1)",
    "on conflict(workspace_id,usage_date) do update set hits=support_daily_usage.hits+1",
    "where support_daily_usage.hits<200 returning hits"
  ].join(" "),[workspace.id]);
  if(!usage)return failure("Atendimento temporariamente indisponível. Tente novamente amanhã.",429);
  const result=answerSupportQuestion(message,knowledge);
  await tenantSql(tenantId,[
    "insert into support_messages(tenant_id,workspace_id,question,answer,status,knowledge_id)",
    "values($1,$2,$3,$4,$5,$6)"
  ].join(" "),[tenantId,workspace.id,message,result.reply,result.status,result.knowledgeId]);
  return NextResponse.json({
    reply:result.reply,
    status:result.status,
    needsHuman:result.status==="needs_human",
    source:result.status==="answered"?"approved_business_knowledge":null
  },{headers:{"cache-control":"no-store"}});
}
