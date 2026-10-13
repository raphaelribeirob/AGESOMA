import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";

const conn = process.env.DATABASE_URL;
if (!conn) throw new Error("DATABASE_URL required for temporary postgres integration test");
const pool = new pg.Pool({ connectionString: conn, max: 3 });

async function asTenant(tenantId, run) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    try {
      const result = await run(client);
      await client.query("commit");
      return result;
    } catch(error) {
      await client.query("rollback");
      throw error;
    }
  } finally {
    client.release();
  }
}
const company1 = randomUUID(), company2 = randomUUID();
const key = randomUUID();
const hash = "a".repeat(64);
const scope = { companyName: "Test Client", outcome: "Auditar frete", ownerRole: "controller" };
const plan = { templateVersion: "freight-recovery.v1", service: "freight_recovery", state: "draft_only", permittedActions: "none" };
test("PostgreSQL ephemeral: immutable draft, RLS, replay, cross-tenant rejection", async () => {
  // Fixture tenants are inserted by the administrative role, not app user.
  await pool.query("insert into agesoma_p0.tenants(id,name) values($1,'Tenant A'),($2,'Tenant B')", [company1,company2]);
  const add = [
    "insert into agesoma_p0.enterprise_deployment_plans",
    "(tenant_id,created_by,idempotency_key,request_hash,template_version,intake,plan)",
    "values ($1,'test-owner',$2,$3,'freight-recovery.v1',$4::jsonb,$5::jsonb)",
    "on conflict (tenant_id,idempotency_key) do nothing returning id"
  ].join(" ");
  const params = [company1,key,hash,JSON.stringify(scope),JSON.stringify(plan)];
  const created = await asTenant(company1, c => c.query(add, params));
  assert.equal(created.rows.length, 1, "first draft must be created");
  const stored = await asTenant(company1, c => c.query("select * from agesoma_p0.enterprise_deployment_plans where tenant_id=$1", [company1]));
  assert.equal(stored.rows.length, 1);
  assert.equal(stored.rows[0].status, "draft");
  assert.equal(stored.rows[0].plan.permittedActions, "none");

  const replay = await asTenant(company1, c => c.query(add,params));
  assert.equal(replay.rows.length,0, "same idempotency key must not duplicate");
  const other = await asTenant(company2, c => c.query("select id from agesoma_p0.enterprise_deployment_plans"));
  assert.equal(other.rows.length,0, "tenant B must not see tenant A");
  const noScopeClient = await pool.connect();
  let missingScope;
  try {
    await noScopeClient.query("begin");
    await noScopeClient.query("set local role authenticated");
    missingScope = await noScopeClient.query("select id from agesoma_p0.enterprise_deployment_plans");
    await noScopeClient.query("rollback");
  } finally { noScopeClient.release(); }
  assert.equal(missingScope.rows.length,0, "absent tenant scope must fail closed");

  await assert.rejects(asTenant(company2,c=>c.query(add,params)), /row-level security|violates/i,
    "tenant B must not insert a draft for tenant A");
  await assert.rejects(asTenant(company1,c=>c.query(
    "update agesoma_p0.enterprise_deployment_plans set status='active' where tenant_id=$1",
    [company1]
  )), /permission denied/i, "authenticated role must never activate a draft by update");
  const count = await pool.query("select count(*)::int as count from agesoma_p0.enterprise_deployment_plans");
  assert.equal(count.rows[0].count,1);
});

test.after(async () => { await pool.end(); });
