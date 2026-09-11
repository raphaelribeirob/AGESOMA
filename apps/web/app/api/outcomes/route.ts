import { NextResponse } from "next/server";
import { z } from "zod";
import { computeOutcomeEconomics } from "@agesoma/core";
import { sql } from "@agesoma/db";

const schema = z.object({
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  outcomeType: z.string().min(1),
  outcomeValueCents: z.number().int().nonnegative(),
  attributedRevenueCents: z.number().int().nonnegative().default(0),
  modelCostCents: z.number().int().nonnegative().default(0),
  apiCostCents: z.number().int().nonnegative().default(0),
  messagingCostCents: z.number().int().nonnegative().default(0),
  browserCostCents: z.number().int().nonnegative().default(0),
  humanCostCents: z.number().int().nonnegative().default(0),
  attributionConfidence: z.number().min(0).max(1),
  evidence: z.record(z.string(), z.unknown()).default({})
});

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const economics = computeOutcomeEconomics(input);
  const [row] = await sql<{ id: string }>(`
    insert into outcome_events (
      tenant_id, workflow_id, task_id, outcome_type, outcome_value_cents,
      attributed_revenue_cents, model_cost_cents, api_cost_cents,
      messaging_cost_cents, browser_cost_cents, human_cost_cents,
      total_cost_cents, net_value_cents, gross_margin_bps,
      attribution_confidence, evidence
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    returning id
  `, [
    input.tenantId, input.workflowId, input.taskId ?? null, input.outcomeType,
    input.outcomeValueCents, input.attributedRevenueCents, input.modelCostCents,
    input.apiCostCents, input.messagingCostCents, input.browserCostCents,
    input.humanCostCents, economics.totalCostCents, economics.netValueCents,
    economics.grossMarginBps, input.attributionConfidence, input.evidence
  ]);
  return NextResponse.json({ id: row.id, economics }, { status: 201 });
}
