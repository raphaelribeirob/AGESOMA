import { NextResponse } from "next/server";
import { z } from "zod";
import { computeOutcomeEconomics } from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { requireJson, requireOutcomeVerifier } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  outcomeType: z.string().min(1).max(100),
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
  const unauthorized = requireOutcomeVerifier(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid outcome request" }, { status: 400 });
  const input = parsed.data;

  if (new TextEncoder().encode(JSON.stringify(input.evidence)).byteLength > 32_768) {
    return NextResponse.json({ error: "Evidence payload too large" }, { status: 413 });
  }

  if (input.taskId) {
    const [task] = await tenantSql<{ id: string }>(input.tenantId, `select id from tasks where id=$1 and tenant_id=$2 limit 1`, [input.taskId, input.tenantId]);
    if (!task) return NextResponse.json({ error: "Task not found for tenant" }, { status: 404 });
  }

  if (input.workflowId) {
    const [workflow] = await tenantSql<{ id: string }>(input.tenantId, `select id from workflows where id=$1 and tenant_id=$2 limit 1`, [input.workflowId, input.tenantId]);
    if (!workflow) return NextResponse.json({ error: "Workflow not found for tenant" }, { status: 404 });
  }

  const economics = computeOutcomeEconomics(input);
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
    input.tenantId, input.workflowId ?? null, input.taskId ?? null, input.outcomeType,
    input.outcomeValueCents, input.attributedRevenueCents, input.modelCostCents,
    input.apiCostCents, input.messagingCostCents, input.browserCostCents,
    input.humanCostCents, economics.totalCostCents, economics.netValueCents,
    economics.grossMarginBps, input.attributionConfidence, input.evidenceSource,
    input.verifiedAt, JSON.stringify(input.evidence)
  ]);

  return NextResponse.json({ id: row.id, economics, verified: true }, { status: 201 });
}
