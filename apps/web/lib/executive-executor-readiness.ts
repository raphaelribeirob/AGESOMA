import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const REQUIRED_EXECUTIVE_WORKERS = ["executive","finance","growth","product"] as const;
export type ExecutiveKey = typeof REQUIRED_EXECUTIVE_WORKERS[number];

export type ExecutorAttestation = {
  protocol: "agesoma-executor-v1";
  nonce: string;
  engine: "opensandbox";
  isolation: "agent";
  capabilities: readonly ("browser" | "terminal" | "filesystem")[];
  sessions: Record<ExecutiveKey, string>;
  expiresAt: string;
  signature: string;
};
export type ExecutorReadiness =
  | { ready: true; engine: "opensandbox"; sessionIds: Record<ExecutiveKey,string>; checkedAt: string }
  | { ready: false; reason: "not_configured" | "invalid_configuration" | "unreachable" | "invalid_attestation" };

export function validateExecutorEndpoint(endpoint: string): URL | null {
  try {
    const url = new URL(endpoint);
    // Host is a trusted server-owned env setting, never an end-user URL.
    // Avoid localhost and IP literal probes; never send credentials or follow redirects.
    if (url.protocol !== "https:" || url.username || url.password ||
        url.search || url.hash || url.port !== "" || url.pathname !== "/" ||
        isIP(url.hostname.replace(/^\[|\]$/g,"")) !== 0 ||
        !/^[a-z0-9.-]+$/i.test(url.hostname) || !url.hostname.includes(".") ||
        /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) return null;
    return url;
  } catch { return null; }
}

export function attestationPayload(value: Omit<ExecutorAttestation,"signature">): string {
  return JSON.stringify({
    protocol:value.protocol,
    nonce:value.nonce,
    engine:value.engine,
    isolation:value.isolation,
    capabilities:value.capabilities,
    sessions:value.sessions,
    expiresAt:value.expiresAt
  });
}

export function signExecutorAttestation(
  value: Omit<ExecutorAttestation,"signature">, secret: string
): string {
  return createHmac("sha256",secret).update(attestationPayload(value)).digest("hex");
}

/** Never equate a row in persistent_workers/work_cells with an active computer. */
export function verifyExecutorAttestation(
  raw: unknown, expectedNonce: string, secret: string, nowMs: number
): ExecutorReadiness {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {ready:false,reason:"invalid_attestation"};
  const x = raw as Record<string,unknown>;
  if (x.protocol!=="agesoma-executor-v1" || x.engine!=="opensandbox" ||
      x.isolation!=="agent" || x.nonce!==expectedNonce ||
      typeof x.signature!=="string" || !/^[a-f0-9]{64}$/.test(x.signature) ||
      typeof x.expiresAt!=="string") return {ready:false,reason:"invalid_attestation"};
  const expires=Date.parse(x.expiresAt);
  if (!Number.isFinite(expires) || expires<=nowMs || expires>nowMs+30_000)
    return {ready:false,reason:"invalid_attestation"};
  if (!Array.isArray(x.capabilities)) return {ready:false,reason:"invalid_attestation"};
  const capabilities: unknown[] = x.capabilities;
  if (capabilities.length!==3 ||
      !["browser","terminal","filesystem"].every(v=>capabilities.includes(v)) ||
      capabilities.some(v=>typeof v!=="string")) return {ready:false,reason:"invalid_attestation"};
  if (!x.sessions || typeof x.sessions!=="object" || Array.isArray(x.sessions))
    return {ready:false,reason:"invalid_attestation"};
  const sessions=x.sessions as Record<string,unknown>;
  if (Object.keys(sessions).length!==4 ||
      !REQUIRED_EXECUTIVE_WORKERS.every(k=>typeof sessions[k]==="string" && /^[-a-zA-Z0-9_]{8,128}$/.test(sessions[k] as string)))
    return {ready:false,reason:"invalid_attestation"};
  const ids=REQUIRED_EXECUTIVE_WORKERS.map(k=>sessions[k] as string);
  if (new Set(ids).size!==4) return {ready:false,reason:"invalid_attestation"};
  const unsigned: Omit<ExecutorAttestation,"signature"> = {
    protocol:"agesoma-executor-v1",nonce:expectedNonce,engine:"opensandbox",
    isolation:"agent",capabilities:x.capabilities as ExecutorAttestation["capabilities"],
    sessions: Object.fromEntries(REQUIRED_EXECUTIVE_WORKERS.map(k=>[k,sessions[k]])) as Record<ExecutiveKey,string>,
    expiresAt:x.expiresAt
  };
  const expected=Buffer.from(signExecutorAttestation(unsigned,secret),"hex");
  const actual=Buffer.from(x.signature,"hex");
  if (!timingSafeEqual(expected,actual)) return {ready:false,reason:"invalid_attestation"};
  return {ready:true,engine:"opensandbox",sessionIds:unsigned.sessions,checkedAt:new Date(nowMs).toISOString()};
}

export async function probeExecutiveExecutor(
  endpoint: string | undefined,
  secret: string | undefined,
  nowMs=Date.now()
): Promise<ExecutorReadiness> {
  if (!endpoint || !secret) return {ready:false,reason:"not_configured"};
  if (!validateExecutorEndpoint(endpoint) || secret.length<32) return {ready:false,reason:"invalid_configuration"};
  const nonce=randomBytes(24).toString("hex");
  try {
    const response=await fetch(new URL("/v1/attest",endpoint),{
      method:"POST",
      headers:{"content-type":"application/json","accept":"application/json"},
      body:JSON.stringify({protocol:"agesoma-executor-v1",nonce}),
      cache:"no-store",
      redirect:"error",
      signal:AbortSignal.timeout(3000)
    });
    if (!response.ok || Number(response.headers.get("content-length")??0)>8192)
      return {ready:false,reason:"unreachable"};
    const body=await response.text();
    if (body.length>8192) return {ready:false,reason:"invalid_attestation"};
    return verifyExecutorAttestation(JSON.parse(body),nonce,secret,nowMs);
  } catch {
    return {ready:false,reason:"unreachable"};
  }
}
