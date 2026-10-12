import {NextResponse} from "next/server";
import {tenantSql} from "@agesoma/db";
import {resolveAuthenticatedWorkspace} from "../../../../lib/auth-workspace";
const failure=(error:string,status:number)=>NextResponse.json({error},{status});
export async function GET(){
 const actor=await resolveAuthenticatedWorkspace();
 if(!actor)return failure("Autenticação necessária.",401);
 if(!["owner","admin"].includes(actor.role))return failure("Somente o titular pode gerenciar.",403);
 const apiKey=process.env.PADDLE_API_KEY;
 if(!apiKey)return failure("Gerenciamento não configurado.",503);
 const [sub]=await tenantSql<{subscription_id:string}>(actor.tenantId,[
  "select subscription_id from billing_entitlements",
  "where tenant_id=$1 and product_key='support' and status in ('active','trialing','past_due','paused')",
  "order by latest_occurred_at desc limit 1"
 ].join(" "),[actor.tenantId]);
 if(!sub||!/^sub_[a-z0-9]{16,36}$/.test(sub.subscription_id))return failure("Assinatura não encontrada.",404);
 const apiBase=process.env.PADDLE_ENV==="sandbox"?"https://sandbox-api.paddle.com":"https://api.paddle.com";
 let response:Response;
 try{
  response=await fetch(apiBase+"/subscriptions/"+sub.subscription_id,{
   headers:{"Authorization":"Bearer "+apiKey},cache:"no-store",signal:AbortSignal.timeout(10000)
  });
 }catch{return failure("Paddle temporariamente indisponível.",503);}
 if(!response.ok)return failure("Não foi possível recuperar o portal.",502);
 const payload=await response.json().catch(()=>null) as {data?:{management_urls?:{cancel?:string|null;view_subscription?:string|null}}}|null;
 const raw=payload?.data?.management_urls?.view_subscription||payload?.data?.management_urls?.cancel;
 if(!raw)return failure("Portal de gerenciamento indisponível.",503);
 let url:URL;
 try{url=new URL(raw);}catch{return failure("URL inválida do portal.",502);}
 if(url.protocol!=="https:"||!["customer-portal.paddle.com","sandbox-customer-portal.paddle.com","buyer-portal.paddle.com","sandbox-buyer-portal.paddle.com"].includes(url.hostname)){
  return failure("Destino não autorizado.",502);
 }
 return NextResponse.json({portalUrl:url.toString(),note:"Link temporário gerado diretamente pelo Paddle."},{headers:{"cache-control":"no-store"}});
}
