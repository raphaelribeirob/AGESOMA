import { buildCapabilityScope, resolveAutonomy, type AutonomyRule } from "@agesoma/core";
import { sql } from "@agesoma/db";

export async function loadAutonomy(input: {
  tenantId: string;
  taskId: string;
  action: string;
  payload: Record<string, unknown>;
}) {
  const scope = buildCapabilityScope({ taskId: input.taskId, action: input.action, payload: input.payload });
  const rows = await sql<{
    id: string;
    action_class: string;
    destination: string | null;
    operation: string | null;
    resource_pattern: string | null;
    decision: "ALLOW" | "DENY";
    max_amount_cents: string | number | null;
    expires_at: Date | null;
    revoked_at: Date | null;
  }>(`
    select id, action_class, destination, operation, resource_pattern, decision,
      max_amount_cents, expires_at, revoked_at
    from autonomy_rules
    where tenant_id=$1 and action_class=$2 and revoked_at is null
      and (expires_at is null or expires_at > now())
    order by created_at desc
  `, [input.tenantId, input.action]);

  const rules: AutonomyRule[] = rows.map((row) => ({
    id: row.id,
    actionClass: row.action_class,
    destination: row.destination,
    operation: row.operation,
    resourcePattern: row.resource_pattern,
    decision: row.decision,
    maxAmountCents: row.max_amount_cents == null ? null : Number(row.max_amount_cents),
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at
  }));

  return { scope, resolution: resolveAutonomy(rules, scope) };
}
