import { createHash } from "node:crypto";
import { tenantSql } from "@agesoma/db";
import { z } from "zod";
import type { OwnerProfile } from "../app/workforce/ceo/ceo-brief";

/**
 * Trusted, tenant-scoped reader for an owner-confirmed company intake.
 * This is not verification against external systems and confers NO action grant.
 */
const fields = z.object({
  companyName: z.string().trim().min(2).max(160),
  website: z.union([z.literal(""), z.string().trim().url().max(320)]),
  sector: z.string().trim().min(2).max(120),
  offer: z.string().trim().min(10).max(1200),
  customers: z.string().trim().min(5).max(1200),
  operations: z.string().trim().min(5).max(1200),
  challenge: z.string().trim().min(5).max(1200),
  objective: z.string().trim().min(5).max(1200)
}).strict();

const document = z.object({
  version: z.literal(1),
  source: z.literal("owner_manual_intake"),
  fields,
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  review: z.object({
    status: z.literal("owner_confirmed"),
    reviewerId: z.string().min(1),
    at: z.string().min(1),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/)
  })
}).passthrough();

type Row = { attributes: unknown };

export function parseConfirmedCompanyProfile(attributes: unknown): OwnerProfile | null {
  const parsed = document.safeParse(attributes);
  if (!parsed.success) return null;
  const value = parsed.data;
  const calculated = createHash("sha256")
    .update(JSON.stringify(value.fields)).digest("hex");
  if (calculated !== value.fingerprint || value.review.fingerprint !== calculated) return null;
  return value.fields;
}

export async function loadConfirmedCompanyProfile(tenantId: string): Promise<OwnerProfile | null> {
  const [row] = await tenantSql<Row>(tenantId, `
    select attributes from company_entities
    where tenant_id=$1 and entity_type='company'
      and canonical_key='agesoma:ceo:company-profile:v1'
      and status='active'
    limit 1
  `, [tenantId]);
  return parseConfirmedCompanyProfile(row?.attributes);
}
