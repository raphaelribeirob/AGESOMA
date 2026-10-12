import {NextResponse} from "next/server";
import {z} from "zod";
import {tenantSql} from "@agesoma/db";
import {resolveAuthenticatedWorkspace} from "../../../../lib/auth-workspace";
const fail=(error:string,status:number)=>NextResponse.json({error},{status});
type Ticket={id:string;question:string;status:string;operator_reply:string|null;created_at:Date|string;resolved_at:Date|string|null};

export async function GET(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Autenticação necessária.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Acesso reservado ao operador responsável.",403);
 const items=await tenantSql<Ticket>(actor.tenantId,[
  "select t.id,m.question,t.status,t.operator_reply,t.created_at,t.resolved_at",
  "from support_tickets t join support_messages m on t.tenant_id=m.tenant_id and t.message_id=m.id",
  "where t.tenant_id=$1 order by case t.status when 'open' then 0 else 1 end,t.created_at desc limit 50"
 ].join(" "),[actor.tenantId]);
 return NextResponse.json({tickets:items,window:"last_50_tickets"},{headers:{"cache-control":"no-store"}});
}
const schema=z.object({ticketId:z.string().uuid(),reply:z.string().trim().min(2).max(2000)});
export async function POST(req:Request){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return fail("Autenticação necessária.",401);
 if(!["owner","admin"].includes(actor.role))return fail("Acesso reservado ao operador responsável.",403);
 if(req.headers.get("origin")!==new URL(req.url).origin)return fail("Origem inválida.",403);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return fail("JSON obrigatório.",415);
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return fail("Dados de resolução inválidos.",400);
 const [done]=await tenantSql<{id:string}>(actor.tenantId,[
  "update support_tickets set status='resolved',operator_reply=$3,resolved_by=$4,resolved_at=now()",
  "where tenant_id=$1 and id=$2 and status='open' returning id"
 ].join(" "),[actor.tenantId,parsed.data.ticketId,parsed.data.reply,actor.actorId]);
 if(!done)return fail("Caso inexistente ou já resolvido.",409);
 return NextResponse.json({resolved:true,id:done.id},{headers:{"cache-control":"no-store"}});
}
