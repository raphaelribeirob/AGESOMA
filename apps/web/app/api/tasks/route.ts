import { NextResponse } from "next/server";
import { z } from "zod";
import { assertActionPayloadSize, getActionPolicy } from "@agesoma/core";
import { createTask, findTenant, findWorkflow } from "@agesoma/db";
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task request" }, { status: 400 });
  }

  const input = parsed.data;
  const policy = getActionPolicy(input.action);

  if (!policy) {
    return NextResponse.json({ error: "Unknown or prohibited action" }, { status: 400 });
  }

  try {
    assertActionPayloadSize(policy, input.payload);
  } catch {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (!(await findTenant(input.tenantId))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (input.workflowId && !(await findWorkflow(input.tenantId, input.workflowId))) {
    return NextResponse.json({ error: "Workflow not found for tenant" }, { status: 404 });
  }

  const task = await createTask({
    tenantId: input.tenantId,
    workflowId: input.workflowId,
    actionType: policy.type,
    riskClass: policy.riskClass,
    reversible: policy.reversible,
    external: policy.external,
    expectedValueCents: input.expectedValueCents,
    expectedCostCents: input.expectedCostCents,
    expectedLossCents: input.expectedLossCents,
    confidence: input.confidence,
    payload: input.payload
  });

  return NextResponse.json(task, { status: 201 });
}
