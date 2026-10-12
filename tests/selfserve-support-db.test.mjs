import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import pg from "pg";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
const owner=randomUUID(),other=randomUUID(),checkout=randomUUID();
const slug="s-"+"a".repeat(26),workspaceName="Teste Operacional";
async function tenant(id,fn){
 const client=await pool.connect();
 try{
  await client.query("begin");await client.query("set local role authenticated");
  await client.query("select set_config('app.tenant_id',$1,true)",[id]);
  try{const result=await fn(client);await client.query("commit");return result;}
  catch(error){await client.query("rollback");throw error;}
 }finally{client.release();}
}
test("real PostgreSQL: tenant FAQ, hosted support and signed-payment entitlement boundary",async()=>{
 await pool.query("insert into agesoma_p0.tenants(id,name) values($1,'A'),($2,'B')",[owner,other]);
 const created=await tenant(owner,c=>c.query(
  "insert into agesoma_p0.support_workspaces(tenant_id,slug,display_name) values($1,$2,$3) returning id",
  [owner,slug,workspaceName]));
 const ws=created.rows[0].id;
 await tenant(owner,c=>c.query("insert into agesoma_p0.support_public_directory(slug,tenant_id,workspace_id) values($1,$2,$3)",[slug,owner,ws]));
 const visible=await pool.query("select tenant_id from agesoma_p0.support_public_directory where slug=$1",[slug]);
 assert.equal(visible.rows[0].tenant_id,owner);
 await tenant(owner,c=>c.query(
  "insert into agesoma_p0.support_knowledge(tenant_id,workspace_id,question,answer,created_by) values($1,$2,'Qual o prazo de entrega?','Cinco dias úteis.','test-owner')",[owner,ws]));
 const own=await tenant(owner,c=>c.query("select question from agesoma_p0.support_knowledge"));
 const foreign=await tenant(other,c=>c.query("select question from agesoma_p0.support_knowledge"));
 assert.equal(own.rows.length,1);assert.equal(foreign.rows.length,0);

 const none=await tenant(owner,c=>c.query("select status from agesoma_p0.billing_entitlements where tenant_id=$1",[owner]));
 assert.equal(none.rows.length,0,"must not activate before provider event");
 await tenant(owner,c=>c.query(
  "insert into agesoma_p0.billing_checkout_intents(id,tenant_id,product_key,created_by,price_id) values($1,$2,'support','owner','pri_test')",
  [checkout,owner]));
 await assert.rejects(tenant(owner,c=>c.query(
  "update agesoma_p0.billing_checkout_intents set paddle_transaction_id='txn_fake' where id=$1",[checkout])),/permission denied/i);
 await assert.rejects(tenant(owner,c=>c.query(
  "insert into agesoma_p0.billing_entitlements(tenant_id,product_key,provider,subscription_id,status,latest_occurred_at) values($1,'support','paddle','sub_fake','active',now())",
  [owner])),/permission denied|row-level security/i);
 const privileged=await pool.query(
  "update agesoma_p0.billing_checkout_intents set paddle_transaction_id='txn_real' where id=$1 returning id",[checkout]);
 assert.equal(privileged.rows.length,1);
 // Simulates the trusted control plane AFTER webhook signature and intent verification.
 await pool.query(
  "insert into agesoma_p0.billing_entitlements(tenant_id,product_key,provider,subscription_id,status,latest_occurred_at) values($1,'support','paddle','sub_verified','active',now())",
  [owner]);
 const active=await tenant(owner,c=>c.query("select status from agesoma_p0.billing_entitlements where tenant_id=$1",[owner]));
 const otherEntitlement=await tenant(other,c=>c.query("select status from agesoma_p0.billing_entitlements"));
 assert.equal(active.rows[0].status,"active");assert.equal(otherEntitlement.rows.length,0);
 // Public request stores under the resolved, trusted server tenant.
 await tenant(owner,c=>c.query(
  "insert into agesoma_p0.support_messages(tenant_id,workspace_id,question,answer,status) values($1,$2,'Qual o prazo de entrega?','Cinco dias úteis.','answered')",[owner,ws]));
 assert.equal((await tenant(other,c=>c.query("select id from agesoma_p0.support_messages"))).rows.length,0);
 await assert.rejects(tenant(other,c=>c.query(
  "insert into agesoma_p0.support_messages(tenant_id,workspace_id,question,answer,status) values($1,$2,'roubo','falha','answered')",[owner,ws])),
  /row-level security/i);
 const quota=await pool.query(
  "insert into agesoma_p0.support_daily_usage(workspace_id,usage_date,hits) values($1,current_date,1) on conflict(workspace_id,usage_date) do update set hits=support_daily_usage.hits+1 where support_daily_usage.hits<200 returning hits",[ws]);
 assert.equal(quota.rows[0].hits,1);
 const noScope=await pool.connect();
 try{
  await noScope.query("begin");await noScope.query("set local role authenticated");
  assert.equal((await noScope.query("select id from agesoma_p0.support_knowledge")).rows.length,0);
  await noScope.query("rollback");
 }finally{noScope.release();}
});
test.after(async()=>{await pool.end();});
