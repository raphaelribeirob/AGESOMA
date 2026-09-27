import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

export async function GET(req:Request){
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});
  const url=new URL(req.url);
  const id=url.searchParams.get("id");

  if(id){
    if(!z.string().uuid().safeParse(id).success) return NextResponse.json({error:"Artifact inválido."},{status:400});
    const [artifact]=await tenantSql(authenticated.tenantId,`
      select a.id,a.task_id,a.kind,a.title,a.content,a.evidence,a.created_at,
        t.action_type,t.payload->>'objective' as objective
      from artifacts a
      left join tasks t on t.tenant_id=a.tenant_id and t.id=a.task_id
      where a.tenant_id=$1 and a.id=$2
      limit 1
    `,[authenticated.tenantId,id]);
    if(!artifact) return NextResponse.json({error:"Artifact não encontrado."},{status:404});
    return NextResponse.json({artifact});
  }

  const artifacts=await tenantSql(authenticated.tenantId,`
    select a.id,a.task_id,a.kind,a.title,a.content,a.evidence,a.created_at,
      t.action_type,t.payload->>'objective' as objective
    from artifacts a
    left join tasks t on t.tenant_id=a.tenant_id and t.id=a.task_id
    where a.tenant_id=$1
    order by a.created_at desc
    limit 80
  `,[authenticated.tenantId]);
  return NextResponse.json({artifacts});
}
