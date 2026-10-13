import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import pg from "pg";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,options:"-c search_path=agesoma_p0,public"});
const tenantId=randomUUID(),otherTenant=randomUUID();
async function scope(id,job){
 const c=await pool.connect();
 try{
  await c.query("begin");await c.query("set local role authenticated");
  await c.query("select set_config('app.tenant_id',$1,true)",[id]);
  try{const result=await job(c);await c.query("commit");return result;}
  catch(e){await c.query("rollback");throw e;}
 }finally{c.release();}
}
test("tenant-owned knowledge import is portable but invalidates older approval",async()=>{
 await pool.query("insert into tenants(id,name) values($1,'Importer A'),($2,'Importer B')",[tenantId,otherTenant]);
 const [ws]=(await scope(tenantId,c=>c.query(
  "insert into support_workspaces(tenant_id,slug,display_name) values($1,$2,'Importer') returning id,content_version",
  [tenantId,"s-"+"d".repeat(26)]))).rows;
 const before=Number(ws.content_version);
 const items=[{question:"Qual o horário de atendimento?",answer:"Segunda a sexta."},
  {question:"Como devolver o produto?",answer:"Entre em contato com a equipe."}];
 await scope(tenantId,async c=>{
  const [locked]=(await c.query("select id from support_workspaces where tenant_id=$1 for update",[tenantId])).rows;
  assert.equal(locked.id,ws.id);
  const inserted=await c.query(
   "insert into support_knowledge(tenant_id,workspace_id,question,answer,created_by) "+
   "select $1,$2,x.question,x.answer,$4 "+
   "from jsonb_to_recordset($3::jsonb) as x(question text,answer text) returning id",
   [tenantId,ws.id,JSON.stringify(items),"owner"]);
  assert.equal(inserted.rowCount,2);
 });
 const [current]=(await scope(tenantId,c=>c.query(
  "select content_version from support_workspaces where id=$1",[ws.id]))).rows;
 assert.equal(Number(current.content_version),before+2);
 const exported=await scope(tenantId,c=>c.query(
  "select question,answer from support_knowledge where tenant_id=$1 and workspace_id=$2 and enabled=true order by created_at,id",
  [tenantId,ws.id]));
 assert.equal(exported.rows.length,2);
 assert.deepEqual(exported.rows.map(x=>x.question).sort(),items.map(x=>x.question).sort());
 assert.equal((await scope(otherTenant,c=>c.query("select * from support_knowledge"))).rows.length,0);
});
test.after(async()=>{await pool.end();});
