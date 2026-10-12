import { NextResponse } from "next/server";
import { sql } from "@agesoma/db";
import {parsePaddleSubscriptionEvent,verifyPaddleWebhook} from "@agesoma/core";

export async function POST(req:Request) {
  const secret=process.env.PADDLE_WEBHOOK_SECRET;
  const priceId=process.env.PADDLE_SUPPORT_PRICE_ID;
  if(!secret||!priceId)return NextResponse.json({error:"billing_not_configured"},{status:503});
  const length=Number(req.headers.get("content-length")??0);
  if(length>131072)return NextResponse.json({error:"payload_too_large"},{status:413});
  const raw=await req.text();
  if(!verifyPaddleWebhook(raw,req.headers.get("paddle-signature"),secret)){
    return NextResponse.json({error:"invalid_signature"},{status:401});
  }
  const parsed=JSON.parse(raw) as unknown;
  const event=parsePaddleSubscriptionEvent(parsed,priceId);
  // Ignore unrelated events. Subscription lifecycle alone can grant paid access.
  if(!event)return NextResponse.json({ignored:true});
  const {data}=event;
  const checkoutRef=data.custom_data!.checkout_ref!;
  // Atomically prove server-origin checkout + verified product, dedupe,
  // and reject old lifecycle events. Never use client-supplied tenant ids.
  const [row]=await sql<{accepted:boolean;updated:boolean}>([
    "with intent as (",
    "select tenant_id from billing_checkout_intents where id=$1 and product_key='support' and price_id=$2",
    "and paddle_transaction_id is not null limit 1",
    "), incoming as (",
    "insert into billing_webhook_events(event_id,event_type)",
    "select $3,$4 from intent on conflict do nothing returning event_id",
    "), applied as (",
    "insert into billing_entitlements(tenant_id,product_key,provider,subscription_id,customer_id,status,latest_occurred_at)",
    "select intent.tenant_id,'support','paddle',$5,$6,$7,$8::timestamptz from intent cross join incoming",
    "on conflict (tenant_id,product_key,subscription_id) do update set",
    "status=excluded.status,customer_id=excluded.customer_id,updated_at=now(),",
    "latest_occurred_at=excluded.latest_occurred_at",
    "where billing_entitlements.subscription_id=excluded.subscription_id",
    "and billing_entitlements.latest_occurred_at<=excluded.latest_occurred_at",
    "returning tenant_id",
    ") select exists(select 1 from incoming) as accepted,exists(select 1 from applied) as updated"
  ].join(" "),[
    checkoutRef,priceId,event.event_id,event.event_type,data.id,data.customer_id,
    data.status,event.occurred_at
  ]);
  if(!row?.accepted)return NextResponse.json({ignored:true});
  return NextResponse.json({processed:true,entitlementUpdated:row.updated});
}
