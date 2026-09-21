import { NextResponse } from "next/server";
import { z } from "zod";
import { buildOutcomeLearning, computeOutcomeEconomics } from "@agesoma/core";
import {
  createLearningRecord,
  createOutcomeEvent,
  findTask,
  findWorkflow
} from "@agesoma/db";
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
  evidence: z.record(z.string(), z.unknown()).refine(
    (value) => Object.keys(value).length > 0,
    "Evidence is required"
  )
});

export async function POST(req: Request) {
  const unauthorized = requireOutcomeVerifier(req);
  if (unauthorized) return unauthorized;

  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid outcome request" }, { status: 400 });
  }

  const input = parsed.data;

  if (new TextEncoder().encode(JSON.stringify(input.evidence)).byteLength > 32_768) {
    return NextResponse.json({ error: "Evidence payload too large" }, { status: 413 });
  }

  if (input.taskId && !(await findTask(input.tenantId, input.taskId))) {
    return NextResponse.json({ error: "Task not found for tenant" }, { status: 404 });
  }

  if (input.workflowId && !(await findWorkflow(input.tenantId, input.workflowId))) {
    return NextResponse.json({ error: "Workflow not found for tenant" }, { status: 404 });
  }

  const economics = computeOutcomeEconomics(input);
  const row = await createOutcomeEvent({
    tenantId: input.tenantId,
    workflowId: input.workflowId,
    taskId: input.taskId,
    outcomeType: input.outcomeType,
    outcomeValueCents: input.outcomeValueCents,
    attributedRevenueCents: input.attributedRevenueCents,
    modelCostCents: input.modelCostCents,
    apiCostCents: input.apiCostCents,
    messagingCostCents: input.messagingCostCents,
    browserCostCents: input.browserCostCents,
    humanCostCents: input.humanCostCents,
    totalCostCents: economics.totalCostCents,
    netValueCents: economics.netValueCents,
    grossMarginBps: economics.grossMarginBps,
    attributionConfidence: input.attributionConfidence,
    evidenceSource: input.evidenceSource,
    verifiedAt: input.verifiedAt,
    evidence: input.evidence
  });

  const learning = buildOutcomeLearning({
    outcomeId: row.id,
    outcomeType: input.outcomeType,
    outcomeValueCents: input.outcomeValueCents,
    attributedRevenueCents: input.attributedRevenueCents,
    modelCostCents: input.modelCostCents,
    apiCostCents: input.apiCostCents,
    messagingCostCents: input.messagingCostCents,
    browserCostCents: input.browserCostCents,
    humanCostCents: input.humanCostCents,
    attributionConfidence: input.attributionConfidence,
    evidenceSource: input.evidenceSource,
    verifiedAt: input.verifiedAt
  });

  await createLearningRecord({
    tenantId: input.tenantId,
    workflowId: input.workflowId,
    taskId: input.taskId,
    lessonType: "verified_outcome",
    content: learning
  });

  return NextResponse.json({
    id: row.id,
    economics,
    verified: true
  }, { status: 201 });
}
