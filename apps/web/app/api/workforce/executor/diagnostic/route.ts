import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../../lib/auth-workspace";
import { probeExecutiveExecutor } from "../../../../../lib/executive-executor-readiness";
import { ExecutorDiagnosticError, runExecutiveDiagnostic } from "../../../../../lib/executive-executor-diagnostic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema=z.object({
  action:z.literal("qa.browser"),
  executive:z.enum(["executive","finance","growth","product"])
}).strict();

const response=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"cache-control":"no-store"}});
function sameOrigin(req:Request) {
  const origin=req.headers.get("origin");
  if (!origin) return false;
  try {
    const browser=new URL(origin);
    const internal=new URL(req.url);
    return browser.origin===internal.origin ||
      (Boolean(req.headers.get("host")) && browser.host===req.headers.get("host") &&
       browser.protocol===internal.protocol);
  }catch{return false;}
}

/**
 * Opt-in, staging-only, authenticated read-only offline diagnostic.
 * No customer URL, credentials, arbitrary scripts, SSH, shell or real side effects.
 * The executor's HMAC-signed receipt is checked against tenant + task + session.
 */
export async function POST(req:Request) {
  if (process.env.VERCEL_ENV==="production" ||
      process.env.AGESOMA_EXECUTOR_DIAGNOSTIC_ENABLED!=="true")
    return response({error:"Diagnóstico de computador desativado neste ambiente."},404);
  if (!sameOrigin(req)) return response({error:"Origem não autorizada."},403);
  const workspace=await resolveAuthenticatedWorkspace();
  if (!workspace) return response({error:"Sessão necessária."},401);
  if (workspace.role!=="owner" && workspace.role!=="admin")
    return response({error:"Acesso exclusivo ao proprietário/administrador."},403);
  const json=await req.json().catch(()=>null);
  const parsed=requestSchema.safeParse(json);
  if (!parsed.success) return response({error:"Diagnóstico desconhecido."},400);
  const endpoint=process.env.AGESOMA_EXECUTOR_URL;
  const secret=process.env.AGESOMA_EXECUTOR_ATTEST_SECRET;
  if (!endpoint || !secret) return response({error:"Executor não configurado."},503);

  // Limit computer diagnostics per tenant and audit every attempt before spending compute.
  const usage=await tenantSql<{ total:string }>(workspace.tenantId,`
    select count(*)::text as total from runtime_events
    where tenant_id=$1 and event_type='executor_diagnostic_requested'
      and created_at>now()-interval '24 hours'
  `,[workspace.tenantId]);
  if (Number(usage[0]?.total ?? 0)>=3)
    return response({error:"Limite diário de três diagnósticos atingido."},429);
  await tenantSql(workspace.tenantId,`
    insert into runtime_events (tenant_id,event_type,trust_zone,summary,metadata)
    values ($1,'executor_diagnostic_requested','control',
            'Owner requested offline sandbox diagnostic',$2::jsonb)
  `,[workspace.tenantId,JSON.stringify({executive:parsed.data.executive,actorId:workspace.actorId})]);

  const ready=await probeExecutiveExecutor(endpoint,secret);
  if (!ready.ready) return response({error:"Computador executivo não atestado.",reason:ready.reason},503);
  try {
    const report=await runExecutiveDiagnostic({
      endpoint,secret,tenantId:workspace.tenantId,
      executive:parsed.data.executive,
      expectedSessionId:ready.sessionIds[parsed.data.executive]
    });
    await tenantSql(workspace.tenantId,`
      insert into runtime_events (tenant_id,event_type,trust_zone,summary,metadata)
      values ($1,'executor_diagnostic_verified','control',
              'Offline browser diagnostic receipt verified',$2::jsonb)
    `,[workspace.tenantId,JSON.stringify(report)]);
    return response({ok:true,report,note:"Somente página de teste offline. Não há execução de trabalho empresarial."});
  } catch (error) {
    const reason=error instanceof ExecutorDiagnosticError ? error.kind : "unreachable";
    return response({error:"Diagnóstico não comprovado.",reason},503);
  }
}
