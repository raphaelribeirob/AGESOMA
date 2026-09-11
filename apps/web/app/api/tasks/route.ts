import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@agesoma/db";

const schema = z.object({
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
  action: z.string().min(1),
  riskClass: z.enum(["R0", "R1", "R2", "R3", "R4"]),
  reversible: z.boolean().default(false),
  external: z.boolean().default(true),
  expectedValueCents: z.number().int().nonnegative().default(0),
  expectedCostCents: z.number().int().nonnegative().default(0),
  expectedLossCents: z.number().int().nonnegative().default(0),
  confidence: z.number().min(0).max(1).default(0),
  payload: z.record(z.string(), z.unknown()).default({})
});

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const [task] = await sql<{ id: string; status: string }>(`
    insert into tasks (
      tenant_id, workflow_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
    returning id, status
  `, [input.tenantId, input.workflowId ?? null, input.action, input.riskClass,
    input.reversible, input.external, input.expectedValueCents, input.expectedCostCents,
    input.expectedLossCents, input.confidence, JSON.stringify(input.payload)]);

  return NextResponse.json(task, { status: 201 });
}
