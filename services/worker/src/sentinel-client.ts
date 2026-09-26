type SentinelDecision = {
  decision: "ALLOW" | "REVIEW" | "DENY";
  reason: string;
  decisionId?: string;
};

function tenantUrl(template: string, tenantId: string) {
  if (!template.includes("{tenantId}")) throw new Error("SENTINEL_BASE_URL_TEMPLATE must contain {tenantId}");
  return template.replaceAll("{tenantId}", encodeURIComponent(tenantId)).replace(/\/$/, "");
}

export async function authorizeEgress(input: {
  tenantId: string;
  taskId: string;
  destination: string;
  operation: string;
  method: string;
  path: string;
  protocol: string;
  resolvedIp: string;
  effect: "read" | "control" | "write" | "commit";
  dataTaint: "clean" | "public" | "personal" | "sensitive" | "credential";
  containsUserData?: boolean;
  grantRef?: string | null;
  capabilityHash?: string | null;
  requestMeta?: Record<string, unknown>;
}) {
  const template = process.env.SENTINEL_BASE_URL_TEMPLATE?.trim();
  const token = process.env.SENTINEL_SERVICE_TOKEN?.trim();
  if (!template || !token) throw new Error("Sentinel v2 is not configured");

  const response = await fetch(`${tenantUrl(template,input.tenantId)}/v1/authorize`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-agesoma-sentinel-token": token
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(10_000)
  });
  const result = await response.json().catch(() => null) as SentinelDecision | null;
  if (!response.ok || result?.decision !== "ALLOW") {
    throw new Error(`Sentinel blocked egress: ${result?.reason ?? response.status}`);
  }
  return result;
}
