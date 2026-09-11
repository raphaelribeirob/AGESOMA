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
