import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function bearer(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export function requireInternalApi(req: Request) {
  const expected = process.env.AGESOMA_INTERNAL_API_TOKEN;
  const token = bearer(req);
  if (!expected || !token || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireOutcomeVerifier(req: Request) {
  const expected = process.env.OUTCOME_VERIFIER_TOKEN;
  const token = req.headers.get("x-agesoma-verifier-token") ?? "";
  if (!expected || !token || !safeEqual(token, expected)) {
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
