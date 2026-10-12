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
