import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { tenantSql } from "@agesoma/db";

const MIN_SECRET_LENGTH = 32;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function bearer(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function usableSecret(value: string | undefined) {
  return Boolean(value && value.length >= MIN_SECRET_LENGTH && !value.toLowerCase().includes("replace"));
}

export function requireInternalApi(req: Request) {
  const expected = process.env.AGESOMA_INTERNAL_API_TOKEN;
  const token = bearer(req);
  if (!usableSecret(expected)) {
    return NextResponse.json({ error: "Security configuration unavailable" }, { status: 503 });
  }
  if (!token || !safeEqual(token, expected!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function requireTenantActor(req: Request, tenantId: string) {
  const actorId = req.headers.get("x-agesoma-actor-id")?.trim();
  if (!actorId || actorId.length > 128) {
    return { actorId: null, error: NextResponse.json({ error: "Authenticated actor is required" }, { status: 401 }) };
  }

  const [membership] = await tenantSql<{ role: string }>(tenantId, `
    select role from tenant_memberships
    where tenant_id=$1 and actor_id=$2
    limit 1
  `, [tenantId, actorId]);

  if (!membership) {
    return { actorId: null, error: NextResponse.json({ error: "Actor is not authorized for this business" }, { status: 403 }) };
  }

  return { actorId, role: membership.role, error: null };
}

export function requireOutcomeVerifier(req: Request) {
  const expected = process.env.OUTCOME_VERIFIER_TOKEN;
  const token = req.headers.get("x-agesoma-verifier-token") ?? "";
  if (!usableSecret(expected)) {
    return NextResponse.json({ error: "Security configuration unavailable" }, { status: 503 });
  }
  if (!token || !safeEqual(token, expected!)) {
    return NextResponse.json({ error: "Unauthorized verifier" }, { status: 401 });
  }
  return null;
}

export function requireJson(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  return null;
}
