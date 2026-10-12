import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import pg from "pg";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
const tenantA=randomUUID(),tenantB=randomUUID(),slug="s-"+"9".repeat(26);
async function asTenant(id,fn){
 const client=await pool.connect();
 try{
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('app.tenant_id',$1,true)",[id]);
  try{const result=await fn(client);await client.query("commit");return result;}
  catch(error){await client.query("rollback");throw error;}
 }finally{client.release();}
}
test("PostgreSQL E2E: customer escalation -> operator response -> lookup by private token",async()=>{
 await pool.query("insert into agesoma_p0.tenants(id,name) values($1,'Human Inbox A'),($2,'Human Inbox B')",[tenantA,tenantB]);
 const created=await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_workspaces(tenant_id,slug,display_name) values($1,$2,'Customer Ops') returning id",[tenantA,slug]));
 const ws=created.rows[0].id;
 const [createdMessage]= (await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_messages(tenant_id,workspace_id,question,answer,status) values($1,$2,'I cannot access my order','Solicitar humano','needs_human') returning id",
  [tenantA,ws]))).rows;
 const tokenHash="a".repeat(64);
 const ticketRows=await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_tickets(tenant_id,workspace_id,message_id,lookup_hash) values($1,$2,$3,$4) returning id,status",
  [tenantA,ws,createdMessage.id,tokenHash]));
 assert.equal(ticketRows.rows[0].status,"open");
 assert.equal((await asTenant(tenantB,c=>c.query("select * from agesoma_p0.support_tickets"))).rows.length,0);
 const outside=await asTenant(tenantB,c=>c.query(
  "update agesoma_p0.support_tickets set status='resolved',operator_reply='fraud',resolved_by='fraud',resolved_at=now() where id=$1 returning id",
  [ticketRows.rows[0].id]));
 assert.equal(outside.rowCount,0);
 const done=await asTenant(tenantA,c=>c.query(
  "update agesoma_p0.support_tickets set status='resolved',operator_reply='Pedido revisado. Envie confirmação.',resolved_by='owner',resolved_at=now() where id=$1 and status='open' returning operator_reply",
  [ticketRows.rows[0].id]));
 assert.equal(done.rows[0].operator_reply,"Pedido revisado. Envie confirmação.");
 const lookup=await pool.query("select status,operator_reply from agesoma_p0.support_tickets where lookup_hash=$1",[tokenHash]);
 assert.equal(lookup.rows[0].status,"resolved");
 const repeat=await asTenant(tenantA,c=>c.query(
  "update agesoma_p0.support_tickets set status='resolved',operator_reply='again',resolved_by='owner',resolved_at=now() where id=$1 and status='open' returning id",
  [ticketRows.rows[0].id]));
 assert.equal(repeat.rowCount,0);
 await assert.rejects(asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_tickets(tenant_id,workspace_id,message_id,lookup_hash) values($1,$2,$3,$4)",
  [tenantA,ws,randomUUID(),"b".repeat(64)])),/foreign key/i);
});
test("PostgreSQL quotas enforce bounded capacity and rollback together",async()=>{
 const [ws]=(await pool.query("select id from agesoma_p0.support_workspaces where tenant_id=$1",[tenantA])).rows;
 await pool.query("insert into agesoma_p0.support_hourly_usage(workspace_id,usage_hour,hits) values($1,date_trunc('hour',now()),40)",[ws.id]);
 const before=(await pool.query("select hits from agesoma_p0.support_hourly_usage where workspace_id=$1",[ws.id])).rows[0].hits;
 const client=await pool.connect();
 try{
  await client.query("begin");
  await client.query("insert into agesoma_p0.support_daily_usage(workspace_id,usage_date,hits) values($1,current_date,1)",[ws.id]);
  const r=await client.query("insert into agesoma_p0.support_hourly_usage(workspace_id,usage_hour,hits) values($1,date_trunc('hour',now()),1) on conflict(workspace_id,usage_hour) do update set hits=support_hourly_usage.hits+1 where support_hourly_usage.hits<40 returning hits",[ws.id]);
  assert.equal(r.rowCount,0);
  await client.query("rollback");
 } finally {client.release();}
 assert.equal((await pool.query("select hits from agesoma_p0.support_hourly_usage where workspace_id=$1",[ws.id])).rows[0].hits,before);
 assert.equal((await pool.query("select count(*)::int as count from agesoma_p0.support_daily_usage where workspace_id=$1",[ws.id])).rows[0].count,0);
 await assert.rejects(pool.query(
  "insert into agesoma_p0.support_visitor_usage(workspace_id,visitor_hash,usage_date,hits) values($1,$2,current_date,13)",
  [ws.id,"c".repeat(64)]),/check constraint/i);
});
test("PostgreSQL labeled evaluations isolate tenants and preserve historical scores",async()=>{
 const [ws]=(await pool.query("select id from agesoma_p0.support_workspaces where tenant_id=$1",[tenantA])).rows;
 const [knowledge]=(await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_knowledge(tenant_id,workspace_id,question,answer,created_by) values($1,$2,'Qual horario de atendimento?','Segunda a sexta','owner') returning id",
  [tenantA,ws.id]))).rows;
 const [evalCase]=(await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_eval_cases(tenant_id,workspace_id,question,expected_status,expected_knowledge_id,created_by) values($1,$2,'Qual horario de atendimento?','answered',$3,'owner') returning id",
  [tenantA,ws.id,knowledge.id]))).rows;
 assert.ok(evalCase.id);
 assert.equal((await asTenant(tenantB,c=>c.query("select id from agesoma_p0.support_eval_cases"))).rows.length,0);
 await asTenant(tenantA,c=>c.query(
  "insert into agesoma_p0.support_eval_runs(tenant_id,workspace_id,cases_count,passed_count,details,run_by) values($1,$2,1,1,'[]'::jsonb,'owner')",
  [tenantA,ws.id]));
 assert.equal((await asTenant(tenantB,c=>c.query("select id from agesoma_p0.support_eval_runs"))).rows.length,0);
 await assert.rejects(asTenant(tenantB,c=>c.query(
  "insert into agesoma_p0.support_eval_cases(tenant_id,workspace_id,question,expected_status,expected_knowledge_id,created_by) values($1,$2,'Fake case','answered',$3,'fraud')",
  [tenantB,ws.id,knowledge.id])),/foreign key|row-level security/i);
});
test.after(async()=>{await pool.end();});
