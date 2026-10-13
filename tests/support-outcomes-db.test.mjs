import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import pg from "pg";

const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3,options:"-c search_path=agesoma_p0,public"});
const tenantA=randomUUID(),tenantB=randomUUID();
const secret="f".repeat(64),tokenHash=createHash("sha256").update(secret).digest("hex");
async function inTenant(id,callback){
 const c=await pool.connect();
 try{
  await c.query("begin");
  await c.query("set local role authenticated");
  await c.query("select set_config('app.tenant_id',$1,true)",[id]);
  try{const result=await callback(c);await c.query("commit");return result;}
  catch(e){await c.query("rollback");throw e;}
 }finally{c.release();}
}
test("support outcome verified by bearer token, no duplicate result, correct tenant",async()=>{
 await pool.query("insert into tenants(id,name) values($1,'Outcome A'),($2,'Outcome B')",[tenantA,tenantB]);
 const [workspace]=(await inTenant(tenantA,c=>c.query(
  "insert into support_workspaces(tenant_id,slug,display_name) values($1,$2,'Outcome Support') returning id",
  [tenantA,"s-"+"6".repeat(26)]))).rows;
 const [message]=(await inTenant(tenantA,c=>c.query(
  "insert into support_messages(tenant_id,workspace_id,question,answer,status,decision_latency_ms,decision_reason) values($1,$2,'Qual o prazo?','Pergunte ao operador','needs_human',12,'weak_or_ambiguous_match') returning id",
  [tenantA,workspace.id]))).rows;
 const [ticket]=(await inTenant(tenantA,c=>c.query(
  "insert into support_tickets(tenant_id,workspace_id,message_id,lookup_hash) values($1,$2,$3,$4) returning id",
  [tenantA,workspace.id,message.id,tokenHash]))).rows;
 const feedbackQuery=[
  "insert into support_customer_outcomes(tenant_id,workspace_id,ticket_id,verdict)",
  "select tenant_id,workspace_id,id,$2 from support_tickets",
  "where lookup_hash=$1 and status='resolved'",
  "on conflict(ticket_id) do nothing returning id"
 ].join(" ");
 assert.equal((await pool.query(feedbackQuery,[tokenHash,"resolved"])).rowCount,0,"open ticket cannot be rated");
 await inTenant(tenantA,c=>c.query(
  "update support_tickets set status='resolved',operator_reply='Resposta oficial enviada',resolved_at=now(),resolved_by='operator' where tenant_id=$1 and id=$2",
  [tenantA,ticket.id]));
 assert.equal((await pool.query(feedbackQuery,[tokenHash,"resolved"])).rowCount,1);
 assert.equal((await pool.query(feedbackQuery,[tokenHash,"not_resolved"])).rowCount,0,"feedback is immutable");
 assert.equal((await pool.query(feedbackQuery,[createHash("sha256").update("an-unissued-ticket").digest("hex"),"resolved"])).rowCount,0,"unissued ticket token is rejected");
 const other=await inTenant(tenantB,c=>c.query("select id from support_customer_outcomes"));
 assert.equal(other.rows.length,0,"tenant B cannot see A outcomes");
 await assert.rejects(inTenant(tenantA,c=>c.query(
  "insert into support_customer_outcomes(tenant_id,workspace_id,ticket_id,verdict) values($1,$2,$3,'not_resolved')",
  [tenantA,workspace.id,ticket.id])),/permission denied|row-level security/i,
  "authenticated users cannot forge customer feedback");
 const [aggregate]=(await inTenant(tenantA,c=>c.query(
  "select count(*)::int as responses,count(*) filter (where verdict='resolved')::int as confirmed from support_customer_outcomes where tenant_id=$1",
  [tenantA]))).rows;
 assert.equal(aggregate.responses,1);
 assert.equal(aggregate.confirmed,1);
 const [timing]=(await inTenant(tenantA,c=>c.query(
  "select percentile_cont(0.95) within group (order by decision_latency_ms) as p95 from support_messages where tenant_id=$1",
  [tenantA]))).rows;
 assert.equal(Number(timing.p95),12);
});
test("authenticated tenant can read own messages but not another tenant's rows",async()=>{
 const a=await inTenant(tenantA,c=>c.query("select id from support_messages"));
 const b=await inTenant(tenantB,c=>c.query("select id from support_messages"));
 assert.equal(a.rows.length,1);
 assert.equal(b.rows.length,0);
});
test.after(async()=>{await pool.end();});
