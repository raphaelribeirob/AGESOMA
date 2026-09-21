import { tenantSql } from "../client";

export async function createApprovalGrant(input: {
  tenantId: string;
  taskId: string;
  actionClass: string;
  scope: string;
  scopeHash: string;
  approvedBy: string;
  nonce: string;
  expiresAt: Date;
}) {
  const [grant] = await tenantSql<{ id: string }>(input.tenantId, `
    insert into approval_grants (
      tenant_id, task_id, action_class, scope, scope_hash, approved_by, nonce, expires_at
    ) values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)
    returning id
  `, [
    input.tenantId,
    input.taskId,
    input.actionClass,
    input.scope,
    input.scopeHash,
    input.approvedBy,
    input.nonce,
    input.expiresAt
  ]);
  return grant;
}
