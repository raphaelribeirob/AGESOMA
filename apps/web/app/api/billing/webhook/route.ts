import {NextResponse} from "next/server";
import {sql} from "@agesoma/db";
import {parsePaddleSubscriptionEvent,verifyPaddleWebhook,PADDLE_ENTITLEMENT_SQL,paddleEntitlementParams} from "@agesoma/core";

/**
 * All entitlements originate in a signed Paddle lifecycle event. An unknown
 * subscription can be registered only against the correct server-side checkout
 * intent and price; later lifecycle events bind by verified subscription ID.
 */
export async function POST(req:Request){
 const secret=process.env.PADDLE_WEBHOOK_SECRET;
 const priceId=process.env.PADDLE_SUPPORT_PRICE_ID;
 if(!secret||!priceId)return NextResponse.json({error:"billing_not_configured"},{status:503});
 const size=Number(req.headers.get("content-length")??0);
 if(size>131072)return NextResponse.json({error:"payload_too_large"},{status:413});
 const raw=await req.text();
 if(!verifyPaddleWebhook(raw,req.headers.get("paddle-signature"),secret))return NextResponse.json({error:"invalid_signature"},{status:401});
 let payload:unknown;
 try{payload=JSON.parse(raw);}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const event=parsePaddleSubscriptionEvent(payload);
 if(!event)return NextResponse.json({ignored:true});
 const [row]=await sql<{accepted:boolean;updated:boolean}>(
  PADDLE_ENTITLEMENT_SQL,paddleEntitlementParams(event,priceId));
 if(!row?.accepted)return NextResponse.json({ignored:true});
 return NextResponse.json({processed:true,entitlementUpdated:row.updated});
}
