import { tenantSql } from "../client";

export type StoredTask = {
  id: string;
  status: string;
  tenant_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  created_at?: string;
};

export async function findTenant(tenantId: string) {
  const [tenant] = await tenantSql<{ id: string }>(
    tenantId,
    "select id from tenants where id=$1 limit 1",
    [tenantId]
  );
  return tenant ?? null;
}

export async function findWorkflow(tenantId: string, workflowId: string) {
  const [workflow] = await tenantSql<{ id: string }>(
    tenantId,
    "select id from workflows where id=$1 and tenant_id=$2 limit 1",
    [workflowId, tenantId]
  );
  return workflow ?? null;
}

export async function createTask(input: {
  tenantId: string;
  workflowId?: string | null;
  actionType: string;
  riskClass: string;
  reversible: boolean;
  external: boolean;
  expectedValueCents: number;
  expectedCostCents: number;
  expectedLossCents: number;
  confidence: number;
  payload: Record<string, unknown>;
}) {
  const [task] = await tenantSql<{ id: string; status: string }>(input.tenantId, `
    insert into tasks (
      tenant_id, workflow_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
    returning id, status
  `, [
    input.tenantId,
    input.workflowId ?? null,
    input.actionType,
    input.riskClass,
    input.reversible,
    input.external,
    input.expectedValueCents,
    input.expectedCostCents,
    input.expectedLossCents,
    input.confidence,
    JSON.stringify(input.payload)
  ]);
  return task;
}

export async function listPendingApprovalTasks(tenantId: string) {
  return await tenantSql<StoredTask>(tenantId, `
    select id, status, tenant_id, action_type, payload, created_at
    from tasks
    where tenant_id=$1 and status='awaiting_approval'
    order by created_at asc
    limit 50
  `, [tenantId]);
}

export async function findTaskForApproval(tenantId: string, taskId: string) {
  const [task] = await tenantSql<StoredTask>(tenantId, `
    select id, status, tenant_id, action_type, payload
    from tasks
    where id=$1 and tenant_id=$2
    limit 1
  `, [taskId, tenantId]);
  return task ?? null;
}

export async function setTaskQueued(tenantId: string, taskId: string) {
  await tenantSql(
    tenantId,
    `update tasks set status='queued', dispatched_at=null, updated_at=now()
     where id=$1 and tenant_id=$2`,
    [taskId, tenantId]
  );
}
