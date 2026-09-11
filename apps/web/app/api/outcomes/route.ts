import { NextResponse } from "next/server";
import { z } from "zod";
import { computeOutcomeEconomics } from "@agesoma/core";
import { sql } from "@agesoma/db";

const schema = z.object({
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
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
  evidenceSource: z.enum(["stripe", "pix", "crm", "calendar", "whatsapp", "provider_webhook"]),
  verifiedAt: z.coerce.date(),
  evidence: z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, "Evidence is required")
});

export async function POST(req: Request) {
  const verifierToken = process.env.OUTCOME_VERIFIER_TOKEN;
  if (!verifierToken || req.headers.get("x-agesoma-verifier-token") !== verifierToken) {
    return NextResponse.json({ error: "Unauthorized verifier" }, { status: 401 });
  }

  const input = schema.parse(await req.json());
  const economics = computeOutcomeEconomics(input);
  const [row] = await sql<{ id: string }>(`
    insert into outcome_events (
      tenant_id, workflow_id, task_id, outcome_type, outcome_value_cents,
      attributed_revenue_cents, model_cost_cents, api_cost_cents,
      messaging_cost_cents, browser_cost_cents, human_cost_cents,
      total_cost_cents, net_value_cents, gross_margin_bps,
      attribution_confidence, evidence_source, verified_at, evidence
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb)
    returning id
  `, [
    input.tenantId, input.workflowId ?? null, input.taskId ?? null, input.outcomeType,
    input.outcomeValueCents, input.attributedRevenueCents, input.modelCostCents,
    input.apiCostCents, input.messagingCostCents, input.browserCostCents,
    input.humanCostCents, economics.totalCostCents, economics.netValueCents,
    economics.grossMarginBps, input.attributionConfidence, input.evidenceSource,
    input.verifiedAt, JSON.stringify(input.evidence)
  ]);
  return NextResponse.json({ id: row.id, economics, verified: true }, { status: 201 });
}
