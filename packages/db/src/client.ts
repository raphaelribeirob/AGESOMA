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

export async function sql<T = Record<string, unknown>>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await db().query(text, values);
  return result.rows as T[];
}

export async function transaction<T>(
  work: (client: InstanceType<typeof Pool> extends { connect(): Promise<infer C> } ? C : never) => Promise<T>
): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("begin");
    const result = await work(client as never);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
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
