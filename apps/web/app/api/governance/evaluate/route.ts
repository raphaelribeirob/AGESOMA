import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateSentinel, evaluateMargin } from "@agesoma/core";

const requestSchema = z.object({
  action: z.object({
    type: z.string(),
    riskClass: z.enum(["R0", "R1", "R2", "R3", "R4"]),
    reversible: z.boolean(),
    external: z.boolean(),
    hasScopedGrant: z.boolean().default(false)
  }),
  economics: z.object({
    expectedValueCents: z.number().int().nonnegative(),
    expectedCostCents: z.number().int().nonnegative(),
    expectedLossCents: z.number().int().nonnegative().default(0),
    confidence: z.number().min(0).max(1)
  })
});

export async function POST(req: Request) {
  const payload = requestSchema.parse(await req.json());
  const policy = evaluateSentinel(payload.action);
  if (policy.decision !== "ALLOW") return NextResponse.json({ policy, economics: null });
  const economics = evaluateMargin(payload.economics);
  return NextResponse.json({ policy, economics });
}
