import { NextResponse } from "next/server";
import { z } from "zod";
import { answerSupportQuestion } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../lib/auth-workspace";
const schema=z.object({message:z.string().trim().min(3).max(1000)});
export async function POST(req:Request){
  const actor=await resolveAuthenticatedWorkspace();
  if(!actor)return NextResponse.json({error:"Autenticação necessária."},{status:401});
  if(!["owner","admin"].includes(actor.role))return NextResponse.json({error:"Somente owner/admin."},{status:403});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Pergunta inválida."},{status:400});
  const kb=await tenantSql<{id:string;question:string;answer:string;enabled:boolean}>(actor.tenantId,
    "select id,question,answer,enabled from support_knowledge where tenant_id=$1 limit 200",[actor.tenantId]);
  return NextResponse.json({preview:true,...answerSupportQuestion(parsed.data.message,kb),
    note:"Teste privado: resposta baseada exclusivamente no texto aprovado pelo proprietário; não envia e-mail ou WhatsApp."});
}
