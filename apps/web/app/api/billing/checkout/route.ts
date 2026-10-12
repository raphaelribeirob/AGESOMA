import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../../lib/auth-workspace";

const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
export async function POST(req:Request) {
  const actor=await resolveAuthenticatedWorkspace();
  if(!actor)return error("Entre na sua conta.",401);
  if(!["owner","admin"].includes(actor.role))return error("Apenas owner/admin pode contratar.",403);
  if(!req.headers.get("origin") || new URL(req.headers.get("origin")!).origin!==new URL(req.url).origin) {
    return error("Origem não autorizada.",403);
  }
  const apiKey=process.env.PADDLE_API_KEY;
  const priceId=process.env.PADDLE_SUPPORT_PRICE_ID;
  const approvedPaymentLink=process.env.PADDLE_APPROVED_CHECKOUT_URL;
  if(!apiKey||!priceId||!approvedPaymentLink)return error("Checkout ainda não configurado.",503);
  const approved=new URL(approvedPaymentLink);
  if(approved.protocol!=="https:" && process.env.NODE_ENV==="production")return error("URL de checkout inválida.",503);
  if(!/^pri_[a-z0-9]{16,36}$/.test(priceId))return error("Preço Paddle não configurado.",503);
  const intentId=randomUUID();
  await tenantSql(actor.tenantId,
    "insert into billing_checkout_intents(id,tenant_id,product_key,created_by,price_id) values($1,$2,'support',$3,$4)",
    [intentId,actor.tenantId,actor.actorId,priceId]);
  const providerBase=process.env.PADDLE_ENV==="sandbox"?"https://sandbox-api.paddle.com":"https://api.paddle.com";
  let response:Response;
  try {
    response=await fetch(providerBase+"/transactions",{
      method:"POST",
      headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        items:[{price_id:priceId,quantity:1}],
        collection_mode:"automatic",
        custom_data:{checkout_ref:intentId,product:"support"},
        checkout:{url:approvedPaymentLink}
      }),
      signal:AbortSignal.timeout(10000),cache:"no-store"
    });
  }catch{return error("Provedor de pagamentos temporariamente indisponível.",503);}
  if(!response.ok)return error("Não foi possível preparar a cobrança.",502);
  const result=await response.json().catch(()=>null) as {data?:{id?:string;checkout?:{url?:string|null}}}|null;
  const id=result?.data?.id;
  const url=result?.data?.checkout?.url;
  if(!id||!/^txn_[a-z0-9]{16,36}$/.test(id)||!url)return error("Checkout incompleto do provedor.",502);
  let location:URL;
  try{location=new URL(url);}catch{return error("URL de pagamento inválida.",502);}
  if(location.origin!==approved.origin || location.pathname!==approved.pathname || location.protocol!=="https:" ||
     location.searchParams.get("_ptxn")!==id){
    return error("Checkout não corresponde ao domínio aprovado.",502);
  }
  // Only a verified subscription webhook can grant entitlement, never redirect.
  await tenantSql(actor.tenantId,
    "update billing_checkout_intents set paddle_transaction_id=$3 where tenant_id=$1 and id=$2",
    [actor.tenantId,intentId,id]);
  return NextResponse.json({checkoutUrl:url,activation:"after_verified_webhook"});
}
