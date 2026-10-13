import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupportEntitled } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../lib/auth-workspace";
import {latestSupportRelease} from "../../../../lib/support-release";

const create = z.object({ action:z.literal("create"), name:z.string().trim().min(2).max(100) });
const add = z.object({ action:z.literal("add_knowledge"), question:z.string().trim().min(5).max(300), answer:z.string().trim().min(5).max(2000) });
const publish = z.object({ action:z.literal("publish"), enabled:z.boolean() });
const input = z.discriminatedUnion("action",[create,add,publish]);
const fail=(message:string,status:number)=>NextResponse.json({error:message},{status});
const isOwner=(role:string)=>role==="owner"||role==="admin";
type Workspace={id:string;slug:string;display_name:string;greeting:string;owner_enabled:boolean};
type Knowledge={id:string;question:string;answer:string;enabled:boolean;created_at:Date|string};
type Entitlement={status:string;subscription_id:string};
type Count={count:string|number};

export async function GET() {
  const actor=await resolveAuthenticatedWorkspace();
  if(!actor)return fail("Entre na sua conta.",401);
  const [workspaces, knowledge, entitlements, history]=await Promise.all([
    tenantSql<Workspace>(actor.tenantId,"select id,slug,display_name,greeting,owner_enabled from support_workspaces where tenant_id=$1 limit 1",[actor.tenantId]),
    tenantSql<Knowledge>(actor.tenantId,"select id,question,answer,enabled,created_at from support_knowledge where tenant_id=$1 order by created_at desc limit 200",[actor.tenantId]),
    tenantSql<Entitlement>(actor.tenantId,"select status,subscription_id from billing_entitlements where tenant_id=$1 and product_key='support' and status in ('active','trialing') order by latest_occurred_at desc limit 1",[actor.tenantId]),
    tenantSql<{status:string;created_at:Date|string}>(actor.tenantId,"select status,created_at from support_messages where tenant_id=$1 order by created_at desc limit 50",[actor.tenantId])
  ]);
  const workspace=workspaces[0]??null;
  const entitlement=entitlements[0]??null;
  const release=workspace?await latestSupportRelease(actor.tenantId,workspace.id):{ready:false,reason:"workspace_missing"};
  return NextResponse.json({
    workspace,
    knowledge,
    subscriptionStatus:entitlement?.status??"not_subscribed",
    release,
    paid:isSupportEntitled(entitlement?.status),
    live:Boolean(workspace?.owner_enabled && isSupportEntitled(entitlement?.status) && knowledge.some(k=>k.enabled) && release.ready),
    events:{total:history.length,answered:history.filter(e=>e.status==="answered").length,needsHuman:history.filter(e=>e.status==="needs_human").length,window:"last_50_events"},
    canEdit:isOwner(actor.role),
    note:"Resultados limitados aos últimos 50 eventos; não são métricas financeiras nem SLA contratual."
  });
}

export async function POST(req:Request){
  const actor=await resolveAuthenticatedWorkspace();
  if(!actor)return fail("Entre na sua conta.",401);
  if(!isOwner(actor.role))return fail("Somente proprietário ou administrador pode configurar.",403);
  if(!req.headers.get("content-type")?.startsWith("application/json"))return fail("JSON obrigatório.",415);
  const result=input.safeParse(await req.json().catch(()=>null));
  if(!result.success)return fail("Dados inválidos.",400);
  const data=result.data;
  if(data.action==="create"){
    const slug="s-"+randomBytes(13).toString("hex");
    const [created]=await tenantSql<{id:string;slug:string}>(actor.tenantId,[
      "with workspace as (",
      "insert into support_workspaces(tenant_id,slug,display_name) values ($1,$2,$3)",
      "on conflict(tenant_id) do nothing returning id,slug",
      "), directory as (",
      "insert into support_public_directory(slug,tenant_id,workspace_id)",
      "select slug,$1,id from workspace on conflict do nothing",
      ") select id,slug from workspace"
    ].join(" "),[actor.tenantId,slug,data.name]);
    if(!created)return fail("A empresa já possui um espaço de atendimento.",409);
    return NextResponse.json({workspace:created,live:false},{status:201});
  }
  if(data.action==="add_knowledge"){
    const [count]=await tenantSql<Count>(actor.tenantId,"select count(*)::int as count from support_knowledge where tenant_id=$1",[actor.tenantId]);
    if(Number(count?.count??0)>=200)return fail("Limite de 200 respostas atingido.",409);
    const [item]=await tenantSql<{id:string}>(actor.tenantId,[
      "insert into support_knowledge(tenant_id,workspace_id,question,answer,created_by)",
      "select $1,id,$2,$3,$4 from support_workspaces where tenant_id=$1 returning id"
    ].join(" "),[actor.tenantId,data.question,data.answer,actor.actorId]);
    if(!item)return fail("Crie primeiro o espaço de atendimento.",409);
    return NextResponse.json({id:item.id},{status:201});
  }
  const [updated]=await tenantSql<{id:string;owner_enabled:boolean}>(actor.tenantId,
    "update support_workspaces set owner_enabled=$2,updated_at=now() where tenant_id=$1 returning id,owner_enabled",
    [actor.tenantId,data.enabled]);
  if(!updated)return fail("Espaço não encontrado.",404);
  return NextResponse.json({workspace:updated,note:"Publicação pública exige assinatura ativa e conhecimento cadastrado."});
}

export async function DELETE(req:Request){
  const actor=await resolveAuthenticatedWorkspace();
  if(!actor)return fail("Entre na sua conta.",401);
  if(!isOwner(actor.role))return fail("Apenas owner/admin.",403);
  const id=new URL(req.url).searchParams.get("id")??"";
  if(!z.string().uuid().safeParse(id).success)return fail("ID inválido.",400);
  const [removed]=await tenantSql<{id:string}>(actor.tenantId,
    "delete from support_knowledge where tenant_id=$1 and id=$2 returning id",
    [actor.tenantId,id]);
  if(!removed)return fail("Resposta não encontrada.",404);
  return NextResponse.json({deleted:true});
}
