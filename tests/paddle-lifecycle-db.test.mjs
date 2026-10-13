import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {randomUUID} from "node:crypto";
import {parsePaddleSubscriptionEvent,PADDLE_ENTITLEMENT_SQL,paddleEntitlementParams} from "../packages/core/src/paddle-billing.ts";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:"-c search_path=agesoma_p0,public",max:2});
const tenantId=randomUUID(),intentId=randomUUID(),intent2=randomUUID(),priceId="pri_support";
const subId="sub_01k12345678901234567890123",sub2="sub_01k12345678901234567890124";
function event(name,id,status,when,{checkout=null,sub=subId,price=priceId,items=true}={}){
 return {
  event_id:id,event_type:name,occurred_at:when,
  data:{id:sub,status,customer_id:"ctm_01k12345678901234567890123",
   custom_data:checkout?{product:"support",checkout_ref:checkout}:null,
   ...(items?{items:[{price:{id:price}}]}:{})}
 };
}
async function apply(raw){
 const e=parsePaddleSubscriptionEvent(raw);assert.ok(e,"valid signed lifecycle shape");
 const result=await pool.query(PADDLE_ENTITLEMENT_SQL,paddleEntitlementParams(e,priceId));
 return result.rows[0];
}
test("actual webhook SQL: activation, metadata-free cancellation, stale event and new paid subscription",async()=>{
 await pool.query("insert into tenants(id,name) values($1,'Billing Test')",[tenantId]);
 for(const id of [intentId,intent2]){
  await pool.query(
   "insert into billing_checkout_intents(id,tenant_id,product_key,created_by,price_id,paddle_transaction_id) values($1,$2,'support','owner',$3,$4)",
   [id,tenantId,priceId,"txn_"+id.replace(/-/g,"")]);
 }
 const first=event("subscription.activated","evt_01k12345678901234567890123","active",
  "2026-10-12T10:00:00Z",{checkout:intentId});
 assert.deepEqual(await apply(first),{accepted:true,updated:true});
 assert.equal((await pool.query("select status from billing_entitlements where subscription_id=$1",[subId])).rows[0].status,"active");
 const cancel=event("subscription.canceled","evt_01k12345678901234567890124","canceled",
  "2026-10-12T11:00:00Z",{checkout:null,items:false});
 assert.deepEqual(await apply(cancel),{accepted:true,updated:true});
 assert.equal((await pool.query("select status from billing_entitlements where subscription_id=$1",[subId])).rows[0].status,"canceled");
 assert.deepEqual(await apply(first),{accepted:false,updated:false});
 const stale=event("subscription.updated","evt_01k12345678901234567890125","active",
  "2026-10-12T10:30:00Z",{checkout:null,items:false});
 assert.deepEqual(await apply(stale),{accepted:true,updated:false});
 assert.equal((await pool.query("select status from billing_entitlements where subscription_id=$1",[subId])).rows[0].status,"canceled");
 const unknown=event("subscription.activated","evt_01k12345678901234567890126","active",
  "2026-10-12T11:30:00Z",{checkout:null,sub:sub2});
 assert.deepEqual(await apply(unknown),{accepted:false,updated:false});
 const newSub=event("subscription.activated","evt_01k12345678901234567890127","active",
  "2026-10-12T12:00:00Z",{checkout:intent2,sub:sub2});
 assert.deepEqual(await apply(newSub),{accepted:true,updated:true});
 assert.equal((await pool.query(
  "select count(*)::int as n from billing_entitlements where tenant_id=$1 and status='active'",
  [tenantId])).rows[0].n,1);
 const wrongPrice=event("subscription.updated","evt_01k12345678901234567890128","active",
  "2026-10-12T13:00:00Z",{checkout:null,sub:sub2,price:"pri_different"});
 assert.deepEqual(await apply(wrongPrice),{accepted:true,updated:true});
 assert.equal((await pool.query("select status from billing_entitlements where subscription_id=$1",[sub2])).rows[0].status,"plan_mismatch");
});
test.after(async()=>{await pool.end();});
