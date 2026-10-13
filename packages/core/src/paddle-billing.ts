import {createHmac,timingSafeEqual} from "node:crypto";

export type PaddleSubscriptionEvent={
 event_id:string;
 event_type:string;
 occurred_at:string;
 data:{
  id:string;
  status:"active"|"trialing"|"past_due"|"paused"|"canceled";
  customer_id:string|null;
  custom_data?:{checkout_ref?:string;product?:string}|null;
  items?:{price?:{id?:string};price_id?:string}[];
 };
};
export function verifyPaddleWebhook(raw:string,header:string|null,secret:string,nowMs=Date.now()):boolean{
 if(!secret||!header||raw.length>131072)return false;
 const parts=header.split(";").map(x=>x.trim());
 const ts=parts.find(x=>x.startsWith("ts="))?.slice(3);
 const hashes=parts.filter(x=>x.startsWith("h1=")).map(x=>x.slice(3));
 if(!ts||!/^\d{10,12}$/.test(ts)||!hashes.length)return false;
 if(Math.abs(nowMs-Number(ts)*1000)>300000)return false;
 const expected=createHmac("sha256",secret).update(ts+":"+raw).digest();
 return hashes.some(h=>{
  if(!/^[a-f0-9]{64}$/i.test(h))return false;
  const input=Buffer.from(h,"hex");
  return input.length===expected.length&&timingSafeEqual(input,expected);
 });
}

/** Validate event shape; binding to a tenant is intentionally separate. */
export function parsePaddleSubscriptionEvent(value:unknown):PaddleSubscriptionEvent|null {
 if(!value||typeof value!=="object")return null;
 const e=value as Partial<PaddleSubscriptionEvent>;
 if(!/^evt_[a-z0-9]{16,36}$/.test(e.event_id??""))return null;
 if(!["subscription.created","subscription.activated","subscription.updated","subscription.canceled",
      "subscription.past_due","subscription.paused","subscription.resumed"].includes(e.event_type??""))return null;
 if(!e.occurred_at||!Number.isFinite(Date.parse(e.occurred_at)))return null;
 const d=e.data;
 if(!d||!/^sub_[a-z0-9]{16,36}$/.test(d.id??""))return null;
 if(!["active","trialing","past_due","paused","canceled"].includes(d.status??""))return null;
 if(d.items!==undefined&&!Array.isArray(d.items))return null;
 return e as PaddleSubscriptionEvent;
}
export function hasPaddleSupportPrice(data:PaddleSubscriptionEvent["data"],priceId:string):boolean{
 return Array.isArray(data.items)&&data.items.some(i=>i.price?.id===priceId||i.price_id===priceId);
}
export function isServerBoundPaddleCheckout(data:PaddleSubscriptionEvent["data"]):boolean{
 return data.custom_data?.product==="support"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.custom_data?.checkout_ref??"");
}


/**
 * Shared parameterized statement used by the webhook AND PostgreSQL integration
 * tests. Known subscriptions may update without custom_data; previously unseen
 * subscriptions require a signed price match + server-origin checkout intent.
 */
export const PADDLE_ENTITLEMENT_SQL=[
 "with existing as (",
 "select tenant_id from billing_entitlements where subscription_id=$5 and provider='paddle' and product_key='support'",
 "), intent as (",
 "select tenant_id from billing_checkout_intents",
 "where id=$1 and product_key='support' and price_id=$2 and paddle_transaction_id is not null",
 "and $9::boolean and not exists(select 1 from existing)",
 "), target as (",
 "select tenant_id from existing union select tenant_id from intent",
 "), incoming as (",
 "insert into billing_webhook_events(event_id,event_type)",
 "select $3,$4 from target on conflict do nothing returning event_id",
 "), applied as (",
 "insert into billing_entitlements(tenant_id,product_key,provider,subscription_id,customer_id,status,latest_occurred_at)",
 "select target.tenant_id,'support','paddle',$5,$6,$7,$8::timestamptz",
 "from target cross join incoming",
 "on conflict(tenant_id,product_key,subscription_id) do update set",
 "status=excluded.status,customer_id=excluded.customer_id,latest_occurred_at=excluded.latest_occurred_at,updated_at=now()",
 "where billing_entitlements.latest_occurred_at<=excluded.latest_occurred_at",
 "returning tenant_id",
 ") select exists(select 1 from incoming) as accepted,exists(select 1 from applied) as updated"
].join(" ");

export function paddleEntitlementParams(event:PaddleSubscriptionEvent,priceId:string):unknown[]{
 const matches=hasPaddleSupportPrice(event.data,priceId);
 const bound=isServerBoundPaddleCheckout(event.data);
 return [
  bound?event.data.custom_data!.checkout_ref!:null,
  priceId,event.event_id,event.event_type,event.data.id,event.data.customer_id,
  Array.isArray(event.data.items)&&!matches?"plan_mismatch":event.data.status,
  event.occurred_at,bound&&matches
 ];
}
