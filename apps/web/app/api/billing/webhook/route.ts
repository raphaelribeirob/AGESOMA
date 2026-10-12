import {NextResponse} from "next/server";
import {sql} from "@agesoma/db";
import {hasPaddleSupportPrice,isServerBoundPaddleCheckout,parsePaddleSubscriptionEvent,verifyPaddleWebhook} from "@agesoma/core";

/**
 * Subscription events are signed by Paddle, not authorized by client-provided
 * tenant IDs. First activation requires a server-created checkout intent and
 * matching price. Later lifecycle events may legitimately carry null
 * custom_data; they are linked by an already verified subscription ID.
 */
export async function POST(req:Request){
 const secret=process.env.PADDLE_WEBHOOK_SECRET;
 const priceId=process.env.PADDLE_SUPPORT_PRICE_ID;
 if(!secret||!priceId)return NextResponse.json({error:"billing_not_configured"},{status:503});
 const size=Number(req.headers.get("content-length")??0);
 if(size>131072)return NextResponse.json({error:"payload_too_large"},{status:413});
 const raw=await req.text();
 if(!verifyPaddleWebhook(raw,req.headers.get("paddle-signature"),secret))return NextResponse.json({error:"invalid_signature"},{status:401});
 let json:unknown;
 try{json=JSON.parse(raw);}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const event=parsePaddleSubscriptionEvent(json);
 if(!event)return NextResponse.json({ignored:true});
 const data=event.data;
 const matchesPrice=hasPaddleSupportPrice(data,priceId);
 const bound=isServerBoundPaddleCheckout(data);
 const checkoutRef=bound?data.custom_data!.checkout_ref!:null;
 // Changing to a different price removes entitlement even when subscription
 // remains active. No items means price cannot be re-evaluated: rely only on
 // the existing subscription binding and the signed provider status.
 const effectiveStatus=Array.isArray(data.items)&&!matchesPrice?"plan_mismatch":data.status;
 const [row]=await sql<{accepted:boolean;updated:boolean}>([
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
 ].join(" "),[
  checkoutRef,priceId,event.event_id,event.event_type,data.id,data.customer_id,
  effectiveStatus,event.occurred_at,bound&&matchesPrice
 ]);
 if(!row?.accepted)return NextResponse.json({ignored:true});
 return NextResponse.json({processed:true,entitlementUpdated:row.updated});
}
