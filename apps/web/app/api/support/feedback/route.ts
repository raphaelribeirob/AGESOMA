import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {sql} from "@agesoma/db";

const schema=z.object({
 token:z.string().regex(/^[a-f0-9]{64}$/),
 verdict:z.enum(["resolved","not_resolved"])
}).strict();
export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)
  return NextResponse.json({error:"Origem inválida."},{status:403});
 if(!req.headers.get("content-type")?.startsWith("application/json"))
  return NextResponse.json({error:"JSON obrigatório."},{status:415});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Avaliação inválida."},{status:400});
 const hash=createHash("sha256").update(parsed.data.token).digest("hex");
 const [result]=await sql<{id:string}>([
  "insert into support_customer_outcomes(tenant_id,workspace_id,ticket_id,verdict)",
  "select tenant_id,workspace_id,id,$2 from support_tickets",
  "where lookup_hash=$1 and status='resolved'",
  "on conflict(ticket_id) do nothing returning id"
 ].join(" "),[hash,parsed.data.verdict]);
 if(!result)return NextResponse.json({
  error:"Protocolo não resolvido, inexistente ou já avaliado."
 },{status:409,headers:{"cache-control":"no-store"}});
 return NextResponse.json({recorded:true},{status:201,headers:{"cache-control":"no-store"}});
}
