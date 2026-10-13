import {NextResponse} from "next/server";
import {z} from "zod";
import {canPublishSupport,mintSupportSession,supportSessionSecret,SUPPORT_COOKIE} from "@agesoma/core";
import {sql,tenantSql} from "@agesoma/db";
import {latestSupportRelease} from "../../../../lib/support-release";
const bodySchema=z.object({slug:z.string().regex(/^s-[a-f0-9]{26}$/)});
export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"origin_invalid"},{status:403});
 const parsed=bodySchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"invalid_slug"},{status:400});
 const secret=supportSessionSecret();
 if(secret.length<32)return NextResponse.json({error:"visitor_service_unconfigured"},{status:503});
 const [directory]=await sql<{tenant_id:string;workspace_id:string}>("select tenant_id,workspace_id from support_public_directory where slug=$1 limit 1",[parsed.data.slug]);
 if(!directory)return NextResponse.json({error:"unavailable"},{status:404});
 const [[ws],subs,[counter]]=await Promise.all([
  tenantSql<{owner_enabled:boolean}>(directory.tenant_id,"select owner_enabled from support_workspaces where tenant_id=$1 and id=$2",[directory.tenant_id,directory.workspace_id]),
  tenantSql<{status:string}>(directory.tenant_id,"select status from billing_entitlements where tenant_id=$1 and product_key='support' and status in ('active','trialing') limit 1",[directory.tenant_id]),
  tenantSql<{count:string}>(directory.tenant_id,"select count(*)::text as count from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true",[directory.tenant_id,directory.workspace_id])
 ]);
 if(!ws||!canPublishSupport({paidStatus:subs[0]?.status??null,ownerEnabled:ws.owner_enabled,faqCount:Number(counter?.count??0)}))
   return NextResponse.json({error:"unavailable"},{status:404});
 const release=await latestSupportRelease(directory.tenant_id,directory.workspace_id);
 if(!release.ready)return NextResponse.json({error:"quality_gate_not_ready"},{status:503});
 const response=NextResponse.json({ready:true},{headers:{"cache-control":"no-store"}});
 response.cookies.set(SUPPORT_COOKIE,mintSupportSession(parsed.data.slug,secret),{
  httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
  path:"/api/support",maxAge:14*24*3600
 });
 return response;
}
