import { notFound } from "next/navigation";
import { sql, tenantSql } from "@agesoma/db";
import { canPublishSupport } from "@agesoma/core";
import SupportChat from "./support-chat";
import {latestSupportRelease} from "../../../lib/support-release";
export const dynamic="force-dynamic";
type Directory={tenant_id:string;workspace_id:string};
export default async function PublicSupportPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(!/^s-[a-f0-9]{26}$/.test(slug))notFound();
 const [directory]=await sql<Directory>("select tenant_id,workspace_id from support_public_directory where slug=$1 limit 1",[slug]);
 if(!directory)notFound();
 const [[workspace],entitlements,[faqCount]]=await Promise.all([
  tenantSql<{display_name:string;greeting:string;owner_enabled:boolean}>(directory.tenant_id,
   "select display_name,greeting,owner_enabled from support_workspaces where tenant_id=$1 and id=$2",[directory.tenant_id,directory.workspace_id]),
  tenantSql<{status:string}>(directory.tenant_id,
   "select status from billing_entitlements where tenant_id=$1 and product_key='support' and status in ('active','trialing') order by latest_occurred_at desc limit 1",[directory.tenant_id]),
  tenantSql<{count:string|number}>(directory.tenant_id,
   "select count(*)::int as count from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true",[directory.tenant_id,directory.workspace_id])
 ]);
 if(!workspace||!canPublishSupport({paidStatus:entitlements[0]?.status??null,ownerEnabled:workspace.owner_enabled,faqCount:Number(faqCount?.count??0)}))notFound();
 const release=await latestSupportRelease(directory.tenant_id,directory.workspace_id);
 if(!release.ready)notFound();
 return <SupportChat slug={slug} name={workspace.display_name} greeting={workspace.greeting}/>;
}
