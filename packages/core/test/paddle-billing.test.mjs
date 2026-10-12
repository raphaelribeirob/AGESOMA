import assert from "node:assert/strict";
import test from "node:test";
import {createHmac} from "node:crypto";
import {verifyPaddleWebhook,parsePaddleSubscriptionEvent,hasPaddleSupportPrice,isServerBoundPaddleCheckout} from "../src/paddle-billing.ts";
const secret="super-private-test-secret",now=1780000000000;
const checkoutRef="550e8400-e29b-41d4-a716-446655440000";
const subscriptionId="sub_01k12345678901234567890123";
const evt={
 event_id:"evt_01k12345678901234567890123",event_type:"subscription.activated",occurred_at:"2026-10-12T10:00:00Z",
 data:{id:subscriptionId,status:"active",customer_id:"ctm_01k1234567890123456789012",
 custom_data:{product:"support",checkout_ref:checkoutRef},items:[{price:{id:"pri_support"}}]}
};
const body=JSON.stringify(evt);
const ts=String(Math.round(now/1000));
const hmac=(b=body,t=ts)=>createHmac("sha256",secret).update(t+":"+b).digest("hex");
test("Paddle signature binds raw bytes and rejects stale/tampered events",()=>{
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+hmac(),secret,now),true);
 assert.equal(verifyPaddleWebhook(body+" ","ts="+ts+";h1="+hmac(),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+"a".repeat(64),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+(Number(ts)-600)+";h1="+hmac(body,String(Number(ts)-600)),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+hmac(),"",now),false);
});
test("first entitlement must match server checkout and price",()=>{
 const parsed=parsePaddleSubscriptionEvent(evt);
 assert.equal(parsed?.data.status,"active");
 assert.equal(isServerBoundPaddleCheckout(parsed.data),true);
 assert.equal(hasPaddleSupportPrice(parsed.data,"pri_support"),true);
 assert.equal(hasPaddleSupportPrice(parsed.data,"pri_unrelated"),false);
 assert.equal(isServerBoundPaddleCheckout({...parsed.data,custom_data:{product:"support",checkout_ref:"unbound"}}),false);
});
test("signed cancellation with null checkout metadata is parsed but requires preexisting subscription binding",()=>{
 const canceled={...evt,event_id:"evt_01k12345678901234567890124",event_type:"subscription.canceled",
  data:{id:subscriptionId,status:"canceled",customer_id:evt.data.customer_id,custom_data:null,items:evt.data.items}};
 const parsed=parsePaddleSubscriptionEvent(canceled);
 assert.equal(parsed?.data.status,"canceled");
 assert.equal(isServerBoundPaddleCheckout(parsed.data),false);
 assert.equal(hasPaddleSupportPrice(parsed.data,"pri_support"),true);
});
test("renewal, scheduled changes and missing item fields remain syntactically accepted",()=>{
 const updated={...evt,event_type:"subscription.updated",data:{id:subscriptionId,status:"active",customer_id:evt.data.customer_id,custom_data:null}};
 assert.equal(parsePaddleSubscriptionEvent(updated)?.data.status,"active");
 assert.equal(hasPaddleSupportPrice(updated.data,"pri_support"),false);
 assert.equal(parsePaddleSubscriptionEvent({...evt,event_type:"transaction.completed"}),null);
 assert.equal(parsePaddleSubscriptionEvent({...evt,data:{...evt.data,status:"unverified"}}),null);
});
