import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "agesoma-web", version: "0.1.0" });
}
