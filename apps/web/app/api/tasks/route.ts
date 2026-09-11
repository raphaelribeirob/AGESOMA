import { NextResponse } from "next/server";
import { z } from "zod";
import { assertActionPayloadSize, getActionPolicy } from "@agesoma/core";
import { sql } from "@agesoma/db";
import { requireInternalApi, requireJson } from "../../../lib/security";

const schema = z.object({
  tenantId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
  action: z.string().min(1).max(100),
  expectedValueCents: z.number().int().nonnegative().max(1_000_000_000).default(0),
  expectedCostCents: z.number().int().nonnegative().max(100_000_000).default(0),
  expectedLossCents: z.number().int().nonnegative().max(1_000_000_000).default(0),
  confidence: z.number().min(0).max(1).default(0),
  payload: z.record(z.string(), z.unknown()).default({})
});

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task request" }, { status: 400 });
  const input = parsed.data;

  const policy = getActionPolicy(input.action);
  if (!policy) return NextResponse.json({ error: "Unknown or prohibited action" }, { status: 400 });

  try {
    assertActionPayloadSize(policy, input.payload);
  } catch {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const [tenant] = await sql<{ id: string }>(`select id from tenants where id=$1 limit 1`, [input.tenantId]);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  if (input.workflowId) {
    const [workflow] = await sql<{ id: string }>(
      `select id from workflows where id=$1 and tenant_id=$2 limit 1`,
      [input.workflowId, input.tenantId]
    );
    if (!workflow) return NextResponse.json({ error: "Workflow not found for tenant" }, { status: 404 });
  }

  const [task] = await sql<{ id: string; status: string }>(`
    insert into tasks (
      tenant_id, workflow_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
    returning id, status
  `, [
    input.tenantId, input.workflowId ?? null, policy.type, policy.riskClass,
    policy.reversible, policy.external, input.expectedValueCents, input.expectedCostCents,
    input.expectedLossCents, input.confidence, JSON.stringify(input.payload)
  ]);

  return NextResponse.json(task, { status: 201 });
}
