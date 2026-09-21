import { tenantSql } from "../client";

export async function createOutcomeEvent(input: {
  tenantId: string;
  workflowId?: string | null;
  taskId?: string | null;
  outcomeType: string;
  outcomeValueCents: number;
  attributedRevenueCents: number;
  modelCostCents: number;
  apiCostCents: number;
  messagingCostCents: number;
  browserCostCents: number;
  humanCostCents: number;
  totalCostCents: number;
  netValueCents: number;
  grossMarginBps: number;
  attributionConfidence: number;
  evidenceSource: string;
  verifiedAt: Date;
  evidence: Record<string, unknown>;
}) {
  const [row] = await tenantSql<{ id: string }>(input.tenantId, `
    insert into outcome_events (
      tenant_id, workflow_id, task_id, outcome_type, outcome_value_cents,
      attributed_revenue_cents, model_cost_cents, api_cost_cents,
      messaging_cost_cents, browser_cost_cents, human_cost_cents,
      total_cost_cents, net_value_cents, gross_margin_bps,
      attribution_confidence, evidence_source, verified_at, evidence
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb)
    returning id
  `, [
    input.tenantId,
    input.workflowId ?? null,
    input.taskId ?? null,
    input.outcomeType,
    input.outcomeValueCents,
    input.attributedRevenueCents,
    input.modelCostCents,
    input.apiCostCents,
    input.messagingCostCents,
    input.browserCostCents,
    input.humanCostCents,
    input.totalCostCents,
    input.netValueCents,
    input.grossMarginBps,
    input.attributionConfidence,
    input.evidenceSource,
    input.verifiedAt,
    JSON.stringify(input.evidence)
  ]);
  return row;
}

export async function createLearningRecord(input: {
  tenantId: string;
  workflowId?: string | null;
  taskId?: string | null;
  lessonType: string;
  content: Record<string, unknown>;
}) {
  await tenantSql(input.tenantId, `
    insert into learning_records (tenant_id, workflow_id, task_id, lesson_type, content)
    values ($1,$2,$3,$4,$5::jsonb)
  `, [
    input.tenantId,
    input.workflowId ?? null,
    input.taskId ?? null,
    input.lessonType,
    JSON.stringify(input.content)
  ]);
}
