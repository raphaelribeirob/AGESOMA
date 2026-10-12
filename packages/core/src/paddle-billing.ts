import { createHmac, timingSafeEqual } from "node:crypto";

export type PaddleSubscriptionEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    status: string;
    customer_id: string | null;
    custom_data?: { checkout_ref?: string; product?: string } | null;
    items?: { price?: { id?: string }; price_id?: string }[];
  };
};

export function verifyPaddleWebhook(raw:string,header:string|null,secret:string,nowMs=Date.now()):boolean {
  if(!secret || !header || raw.length>131072)return false;
  const fields=header.split(";").map(x=>x.trim());
  const ts=fields.find(x=>x.startsWith("ts="))?.slice(3);
  const hashes=fields.filter(x=>x.startsWith("h1=")).map(x=>x.slice(3));
  if(!ts || !/^\d{10,12}$/.test(ts) || !hashes.length)return false;
  const drift=Math.abs(nowMs-Number(ts)*1000);
  if(!Number.isFinite(drift)||drift>300_000)return false;
  const expected=createHmac("sha256",secret).update(ts+":"+raw).digest();
  return hashes.some(h=>{
    if(!/^[a-f0-9]{64}$/i.test(h))return false;
    const received=Buffer.from(h,"hex");
    return received.length===expected.length && timingSafeEqual(expected,received);
  });
}

export function parsePaddleSubscriptionEvent(value:unknown,priceId:string):PaddleSubscriptionEvent|null {
  if(!value || typeof value!=="object")return null;
  const event=value as Partial<PaddleSubscriptionEvent>;
  if(!/^evt_[a-z0-9]{16,36}$/.test(event.event_id??""))return null;
  if(!["subscription.created","subscription.updated","subscription.canceled","subscription.past_due","subscription.paused","subscription.resumed"].includes(event.event_type??""))return null;
  if(!event.occurred_at||!Number.isFinite(Date.parse(event.occurred_at)))return null;
  const d=event.data;
  if(!d || !/^sub_[a-z0-9]{16,36}$/.test(d.id??""))return null;
  if(!["active","trialing","past_due","paused","canceled"].includes(d.status??""))return null;
  if(d.custom_data?.product!=="support" || !/^[0-9a-f-]{36}$/i.test(d.custom_data?.checkout_ref??""))return null;
  if(!d.items?.some(item=>item.price?.id===priceId || item.price_id===priceId))return null;
  return event as PaddleSubscriptionEvent;
}
