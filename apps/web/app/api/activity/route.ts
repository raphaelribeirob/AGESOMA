import { NextResponse } from "next/server";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

export async function GET(req: Request) {
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});

  const limitRaw=Number(new URL(req.url).searchParams.get("limit") ?? 50);
  const limit=Math.max(1,Math.min(100,Number.isFinite(limitRaw)?Math.trunc(limitRaw):50));

  const activity=await tenantSql(authenticated.tenantId,`
    select id,task_id,goal_id,event_type,title,summary,status,metadata,created_at
    from activity_events
    where tenant_id=$1
    order by created_at desc
    limit $2
  `,[authenticated.tenantId,limit]);

  return NextResponse.json({activity});
}
