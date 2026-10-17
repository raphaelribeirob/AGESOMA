import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { validateExecutorEndpoint, type ExecutiveKey } from "./executive-executor-readiness.ts";

export type BrowserDiagnosticResult = Readonly<{
  taskId: string;
  tenantId: string;
  executive: ExecutiveKey;
  sessionId: string;
  screenshotSha256: string;
  screenshotBytes: number;
  completedAt: string;
  verified: true;
  scope: "offline_test_page_only";
}>;

type SignedRequest = {
  protocol: "agesoma-executor-v1";
  tenantId: string;
  taskId: string;
  executive: ExecutiveKey;
  action: "qa.browser";
  expiresAt: string;
  nonce: string;
  signature: string;
};
type VerifiedContext = {
  tenantId: string;
  executive: ExecutiveKey;
  expectedSessionId: string;
  secret: string;
};

export class ExecutorDiagnosticError extends Error {
  readonly kind: "unauthorized" | "unreachable" | "invalid_receipt";
  constructor(kind: "unauthorized" | "unreachable" | "invalid_receipt") {
    super(kind);
    this.kind=kind;
  }
}

function signature(value: object, secret: string) {
  return createHmac("sha256", secret).update(JSON.stringify(value)).digest("hex");
}
function safeCompare(actual: unknown, expected: string): boolean {
  return typeof actual==="string" && /^[a-f0-9]{64}$/.test(actual) &&
    timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(expected,"hex"));
}

/** Trusted transport only; the public wrapper below validates HTTPS origin. */
export async function runExecutorDiagnosticWithTransport(
  context: VerifiedContext,
  transport: (signedRequest: SignedRequest) => Promise<unknown>
): Promise<BrowserDiagnosticResult> {
  if (!/^[0-9a-f-]{36}$/i.test(context.tenantId) ||
      !/^session_[a-z0-9_-]{12,80}$/.test(context.expectedSessionId) ||
      context.secret.length < 32) throw new ExecutorDiagnosticError("unauthorized");
  const requestBody = {
    protocol: "agesoma-executor-v1" as const,
    tenantId: context.tenantId,
    taskId: randomUUID(),
    executive: context.executive,
    action: "qa.browser" as const,
    expiresAt: new Date(Date.now()+25_000).toISOString(),
    nonce: randomBytes(16).toString("hex")
  };
  const signed: SignedRequest = {
    ...requestBody,
    signature: signature(requestBody, context.secret)
  };
  let raw: unknown;
  try { raw=await transport(signed); }
  catch { throw new ExecutorDiagnosticError("unreachable"); }
  if (!raw || typeof raw!=="object" || Array.isArray(raw)) throw new ExecutorDiagnosticError("invalid_receipt");
  const receipt = raw as Record<string,unknown>;
  const { signature: signedResponse, ...unsigned } = receipt;
  if (!safeCompare(signedResponse,signature(unsigned,context.secret)) ||
      receipt.protocol!=="agesoma-executor-v1" ||
      receipt.tenantId!==requestBody.tenantId ||
      receipt.taskId!==requestBody.taskId ||
      receipt.executive!==requestBody.executive ||
      receipt.action!=="qa.browser" ||
      receipt.sessionId!==context.expectedSessionId ||
      receipt.status!=="completed" ||
      typeof receipt.finishedAt!=="string" ||
      !Number.isFinite(Date.parse(receipt.finishedAt))) {
    throw new ExecutorDiagnosticError("invalid_receipt");
  }
  const proof=receipt.proof;
  if (!proof || typeof proof!=="object" || Array.isArray(proof)) throw new ExecutorDiagnosticError("invalid_receipt");
  const evidence=proof as Record<string,unknown>;
  if (evidence.status!=="success" ||
      evidence.browser!=="chromium" ||
      evidence.dom!=="executed" ||
      evidence.external_actions!==0 ||
      typeof evidence.image_sha256!=="string" ||
      !/^[a-f0-9]{64}$/.test(evidence.image_sha256) ||
      typeof evidence.image_bytes!=="number" ||
      evidence.image_bytes<=1000 || evidence.image_bytes>10_000_000) {
    throw new ExecutorDiagnosticError("invalid_receipt");
  }
  return {
    taskId:requestBody.taskId,
    tenantId:requestBody.tenantId,
    executive:requestBody.executive,
    sessionId:context.expectedSessionId,
    screenshotSha256:evidence.image_sha256,
    screenshotBytes:evidence.image_bytes,
    completedAt:receipt.finishedAt,
    verified:true,
    scope:"offline_test_page_only"
  };
}

export async function runExecutiveDiagnostic(params: VerifiedContext & { endpoint: string }) {
  const origin=validateExecutorEndpoint(params.endpoint);
  if (!origin) throw new ExecutorDiagnosticError("unauthorized");
  return runExecutorDiagnosticWithTransport(params, async (request) => {
    const response=await fetch(new URL("/v1/execute",origin), {
      method:"POST",
      headers:{"content-type":"application/json","accept":"application/json"},
      body:JSON.stringify(request),
      redirect:"error",cache:"no-store",
      signal:AbortSignal.timeout(40_000)
    });
    if (!response.ok || Number(response.headers.get("content-length")??0)>8192)
      throw new ExecutorDiagnosticError("unreachable");
    const body=await response.text();
    if (body.length>8192) throw new ExecutorDiagnosticError("invalid_receipt");
    return JSON.parse(body);
  });
}
