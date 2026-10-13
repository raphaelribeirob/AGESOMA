import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {z} from "zod";
import {sql} from "@agesoma/db";
const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)});
export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"origin_invalid"},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"token_invalid"},{status:400});
 const hash=createHash("sha256").update(parsed.data.token).digest("hex");
 const [ticket]=await sql<{status:string;operator_reply:string|null;resolved_at:Date|null}>(
 "select status,operator_reply,resolved_at from support_tickets where lookup_hash=$1 limit 1",[hash]);
 if(!ticket)return NextResponse.json({error:"ticket_not_found"},{status:404});
 return NextResponse.json({status:ticket.status,operatorReply:ticket.operator_reply,resolvedAt:ticket.resolved_at},{headers:{"cache-control":"no-store"}});
}
