import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import pg from "pg";
import {supportReleaseAssessment,SUPPORT_SKILL_VERSION} from "../packages/core/src/support-release.ts";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,options:"-c search_path=agesoma_p0,public"});
const tenantId=randomUUID(),otherTenant=randomUUID(),slug="s-"+"e".repeat(26);
async function scoped(tenant,callback){
 const client=await pool.connect();
 try{
  await client.query("begin");
  await client.query("set local role authenticated");
  await client.query("select set_config('app.tenant_id',$1,true)",[tenant]);
  try{const value=await callback(client);await client.query("commit");return value;}
  catch(error){await client.query("rollback");throw error;}
 }finally{client.release();}
}
async function release(tenant){
 const [record]=(await scoped(tenant,c=>c.query([
  "select w.content_version as current_version, r.content_version as evaluated_version,",
  "r.skill_version,r.cases_count,r.passed_count,r.details",
  "from support_workspaces w left join lateral (",
  "select content_version,skill_version,cases_count,passed_count,details from support_eval_runs",
  "where tenant_id=w.tenant_id and workspace_id=w.id order by created_at desc,id desc limit 1",
  ") r on true where w.tenant_id=$1"
 ].join(" "),[tenant]))).rows;
 if(!record)return {ready:false};
 const evidence=record.skill_version===null?null:{
  content_version:record.evaluated_version,skill_version:record.skill_version,
  cases_count:record.cases_count,passed_count:record.passed_count,details:record.details
 };
 return supportReleaseAssessment(record.current_version,evidence);
}
test("Postgres release: fails closed until both QA classes pass, and after knowledge changes",async()=>{
 await pool.query("insert into tenants(id,name) values($1,'QA Owner'),($2,'QA Stranger')",[tenantId,otherTenant]);
 const [ws]=(await scoped(tenantId,c=>c.query(
  "insert into support_workspaces(tenant_id,slug,display_name,owner_enabled) values($1,$2,'QA Enterprise',true) returning id,content_version",
  [tenantId,slug]))).rows;
 const [faq]=(await scoped(tenantId,c=>c.query(
  "insert into support_knowledge(tenant_id,workspace_id,question,answer,created_by) values($1,$2,'Qual horario de suporte?','Das 9 às 18 horas.','owner') returning id",
  [tenantId,ws.id]))).rows;
 assert.equal((await release(tenantId)).ready,false,"no prior eval cannot publish");
 await scoped(tenantId,c=>c.query(
  "insert into support_eval_cases(tenant_id,workspace_id,question,expected_status,expected_knowledge_id,created_by) values "+
  "($1,$2,'Qual horario de suporte?','answered',$3,'owner'),"+
  "($1,$2,'Desconhecido: estoques do ano 2035?','needs_human',null,'owner')",
  [tenantId,ws.id,faq.id]
 ));
 const [version]=(await scoped(tenantId,c=>c.query(
  "select content_version from support_workspaces where tenant_id=$1 and id=$2",
  [tenantId,ws.id]))).rows;
 const details=[{caseId:"one",expected:"answered",actual:"answered",passed:true},
                {caseId:"two",expected:"needs_human",actual:"needs_human",passed:true}];
 await scoped(tenantId,c=>c.query(
  "insert into support_eval_runs(tenant_id,workspace_id,cases_count,passed_count,details,run_by,content_version,skill_version) "+
  "values($1,$2,2,2,$3::jsonb,'owner',$4,$5)",
  [tenantId,ws.id,JSON.stringify(details),version.content_version,SUPPORT_SKILL_VERSION]
 ));
 assert.equal((await release(tenantId)).ready,true,"both answer + abstain pass");
 assert.equal((await release(otherTenant)).ready,false,"tenant B cannot read tenant A QA");
 await scoped(tenantId,c=>c.query("update support_knowledge set answer='Das 10 às 17 horas.' where tenant_id=$1 and id=$2",[tenantId,faq.id]));
 assert.equal((await release(tenantId)).ready,false,"changed KB invalidates prior pass");
 const [changed]=(await scoped(tenantId,c=>c.query("select content_version from support_workspaces where tenant_id=$1",[tenantId]))).rows;
 assert.ok(Number(changed.content_version)>Number(version.content_version));
 await scoped(tenantId,c=>c.query(
  "insert into support_eval_runs(tenant_id,workspace_id,cases_count,passed_count,details,run_by,content_version,skill_version) "+
  "values($1,$2,2,1,$3::jsonb,'owner',$4,$5)",
  [tenantId,ws.id,JSON.stringify(details),changed.content_version,SUPPORT_SKILL_VERSION]
 ));
 assert.equal((await release(tenantId)).ready,false,"failed newer evaluation invalidates older pass");
});
test.after(async()=>{await pool.end();});
