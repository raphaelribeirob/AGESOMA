import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateSentinel, evaluateMargin, getActionPolicy } from "@agesoma/core";
import { requireInternalApi, requireJson } from "../../../../lib/security";

const requestSchema = z.object({
  action: z.string().min(1).max(100),
  economics: z.object({
    expectedValueCents: z.number().int().nonnegative().max(1_000_000_000),
    expectedCostCents: z.number().int().nonnegative().max(100_000_000),
    expectedLossCents: z.number().int().nonnegative().max(1_000_000_000).default(0),
    confidence: z.number().min(0).max(1)
  })
});

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid governance request" }, { status: 400 });

  const action = getActionPolicy(parsed.data.action);
  if (!action) return NextResponse.json({ error: "Unknown or prohibited action" }, { status: 400 });

  // This endpoint is advisory only. Grants are never accepted from the caller;
  // the durable worker re-reads a real, unexpired grant from Postgres before execution.
  const policy = evaluateSentinel({ ...action, hasScopedGrant: false });
  if (policy.decision !== "ALLOW") return NextResponse.json({ policy, economics: null });

  const economics = evaluateMargin(parsed.data.economics);
  return NextResponse.json({ policy, economics });
}
