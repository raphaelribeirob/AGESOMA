import { sql } from "@agesoma/db";

const instanceId = process.env.HOSTNAME ?? `worker-${process.pid}`;

export async function reportHeartbeat() {
  await sql(`
    insert into runtime_heartbeats (service, instance_id, metadata, last_seen_at)
    values ('agesoma-worker', $1, $2::jsonb, now())
    on conflict (service) do update
      set instance_id=excluded.instance_id,
          metadata=excluded.metadata,
          last_seen_at=excluded.last_seen_at
  `, [instanceId, JSON.stringify({
    hermesConfigured: Boolean(process.env.HERMES_BASE_URL && process.env.HERMES_SERVICE_TOKEN),
    companyBrainConfigured: Boolean(process.env.AGESOMA_BRAIN_URL && process.env.AGESOMA_BRAIN_INTERNAL_API_TOKEN)
  })]);
}
