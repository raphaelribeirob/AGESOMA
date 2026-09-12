import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { requireInternalApi, requireJson } from "../../../lib/security";

const writeSchema = z.object({
  tenantId: z.string().uuid(),
  kind: z.enum(["owner_preference", "owner_correction", "business_fact", "business_rule"]),
  memoryKey: z.string().min(1).max(120),
  value: z.unknown(),
  confidence: z.number().min(0).max(1).optional()
});

const forgetSchema = z.object({
  tenantId: z.string().uuid(),
  memoryKey: z.string().min(1).max(120)
});

export async function POST(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = writeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid memory request" }, { status: 400 });
  const input = parsed.data;

  const content = JSON.stringify({
    memoryKey: input.memoryKey,
    value: input.value,
    confidence: input.confidence ?? 1,
    advisoryOnly: true
  });

  const [record] = await tenantSql<{ id: string }>(input.tenantId, `
    with removed as (
      delete from learning_records
      where tenant_id=$1
        and lesson_type in ('owner_preference','owner_correction','business_fact','business_rule')
        and content->>'memoryKey'=$2
    )
    insert into learning_records (tenant_id, lesson_type, content)
    values ($1,$3,$4::jsonb)
    returning id
  `, [input.tenantId, input.memoryKey, input.kind, content]);

  return NextResponse.json({ memoryId: record.id, memoryKey: input.memoryKey }, { status: 201 });
}

export async function DELETE(req: Request) {
  const unauthorized = requireInternalApi(req);
  if (unauthorized) return unauthorized;
  const wrongType = requireJson(req);
  if (wrongType) return wrongType;

  const parsed = forgetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid forget request" }, { status: 400 });
  const input = parsed.data;

  const deleted = await tenantSql<{ id: string }>(input.tenantId, `
    delete from learning_records
    where tenant_id=$1
      and lesson_type in ('owner_preference','owner_correction','business_fact','business_rule')
      and content->>'memoryKey'=$2
    returning id
  `, [input.tenantId, input.memoryKey]);

  return NextResponse.json({ forgotten: deleted.length > 0, deletedCount: deleted.length });
}
