import pg from "pg";

const { Pool } = pg;
let pool: InstanceType<typeof Pool> | undefined;

function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const schema = process.env.AGESOMA_DB_SCHEMA ?? "agesoma_p0";
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      options: `-c search_path=${schema},public`
    });
  }
  return pool;
}

export async function sql<T = Record<string, unknown>>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await db().query(text, values);
  return result.rows as T[];
}

export async function tenantSql<T = Record<string, unknown>>(
  tenantId: string,
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const client = await db().connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await client.query(text, values);
    await client.query("commit");
    return result.rows as T[];
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function provisionAuthenticatedTenant(input: {
  authOrganizationId: string;
  actorId: string;
  companyName: string;
  role?: string;
}) {
  const client = await db().connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [input.authOrganizationId]);

    const existing = await client.query<{ tenant_id: string }>(
      "select tenant_id from auth_organization_tenants where auth_organization_id=$1 limit 1",
      [input.authOrganizationId]
    );

    let tenantId = existing.rows[0]?.tenant_id;
    if (!tenantId) {
      const created = await client.query<{ id: string }>(
        "insert into tenants(name) values ($1) returning id",
        [input.companyName]
      );
      tenantId = created.rows[0].id;
      await client.query(
        "insert into auth_organization_tenants(auth_organization_id, tenant_id) values ($1,$2)",
        [input.authOrganizationId, tenantId]
      );
    }

    await client.query(
      `insert into tenant_memberships(tenant_id, actor_id, role)
       values ($1,$2,$3)
       on conflict (tenant_id, actor_id) do update set role=excluded.role`,
      [tenantId, input.actorId, input.role ?? "owner"]
    );

    await client.query("commit");
    return tenantId;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
