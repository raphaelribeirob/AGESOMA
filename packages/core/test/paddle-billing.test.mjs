import assert from "node:assert/strict";
import test from "node:test";
import {createHmac} from "node:crypto";
import {verifyPaddleWebhook,parsePaddleSubscriptionEvent} from "../src/paddle-billing.ts";
const secret="super-private-test-secret",now=1780000000000;
const body=JSON.stringify({event_id:"evt_01k12345678901234567890123",event_type:"subscription.created",occurred_at:"2026-10-12T10:00:00Z",
  data:{id:"sub_01k12345678901234567890123",status:"active",customer_id:"ctm_01k1234567890123456789012",
  custom_data:{product:"support",checkout_ref:"550e8400-e29b-41d4-a716-446655440000"},items:[{price:{id:"pri_test"}}]}});
const ts=String(Math.round(now/1000)), hmac=(b=body,t=ts)=>createHmac("sha256",secret).update(t+":"+b).digest("hex");
test("Paddle signature accepts only raw signed body within freshness window",()=>{
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+hmac(),secret,now),true);
 assert.equal(verifyPaddleWebhook(body+" ","ts="+ts+";h1="+hmac(),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+"a".repeat(64),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+(Number(ts)-600)+";h1="+hmac(body,String(Number(ts)-600)),secret,now),false);
 assert.equal(verifyPaddleWebhook(body,"ts="+ts+";h1="+hmac(),"",now),false);
});
test("Rejects unrelated product, unsigned subscription state and missing checkout intent",()=>{
 const e=JSON.parse(body);
 assert.equal(parsePaddleSubscriptionEvent(e,"pri_test")?.data.status,"active");
 assert.equal(parsePaddleSubscriptionEvent(e,"pri_another"),null);
 assert.equal(parsePaddleSubscriptionEvent({...e,data:{...e.data,custom_data:{product:"support",checkout_ref:"unbound"}}},"pri_test"),null);
 assert.equal(parsePaddleSubscriptionEvent({...e,event_type:"transaction.completed"},"pri_test"),null);
 assert.equal(parsePaddleSubscriptionEvent({...e,data:{...e.data,status:"unverified"}},"pri_test"),null);
});
