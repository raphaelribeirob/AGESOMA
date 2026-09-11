export interface HermesMission {
  taskId: string;
  tenantId: string;
  action: string;
  payload: Record<string, unknown>;
  grantRef?: string;
}

export async function executeWithHermes(mission: HermesMission) {
  const baseUrl = process.env.HERMES_BASE_URL;
  const token = process.env.HERMES_SERVICE_TOKEN;
  if (!baseUrl || !token) throw new Error("Hermes endpoint is not configured");

  const response = await fetch(`${baseUrl}/v1/execute`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(mission),
    signal: AbortSignal.timeout(120_000)
  });

  if (!response.ok) throw new Error(`Hermes execution failed: ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}
