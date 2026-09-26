import { NextResponse } from "next/server";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

export async function GET() {
  const authenticated=await resolveAuthenticatedWorkspace();
  if(!authenticated) return NextResponse.json({error:"Sua sessão expirou. Entre novamente."},{status:401});

  const [runtime]=await tenantSql(authenticated.tenantId,`
    select id,status,runtime_mode,persistent_home,isolation_status,last_seen_at,last_active_at,created_at,updated_at
    from work_cells where tenant_id=$1 limit 1
  `,[authenticated.tenantId]);

  return NextResponse.json({
    runtime: runtime ?? null,
    contract: {
      scope: "one-runtime-per-tenant",
      persistence: "persistent",
      credentialsVisibleToExecutor: false
    }
  });
}
