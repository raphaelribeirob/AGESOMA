export interface HermesMission {
  taskId: string;
  tenantId: string;
  action: string;
  payload: Record<string, unknown>;
  grantRef?: string;
}

type HermesRunStatus = {
  run_id: string;
  status: "started" | "running" | "stopping" | "completed" | "failed" | "cancelled" | string;
  output?: unknown;
  error?: unknown;
  usage?: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function headers(token: string, mission: HermesMission) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    "idempotency-key": `agesoma-${mission.taskId}`,
    "x-hermes-session-key": `agesoma:tenant:${mission.tenantId}`
  };
}

export async function executeWithHermes(mission: HermesMission) {
  const baseUrl = process.env.HERMES_BASE_URL?.replace(/\/$/, "");
  const token = process.env.HERMES_SERVICE_TOKEN;
  const timeoutMs = Number(process.env.HERMES_RUN_TIMEOUT_MS ?? 120_000);
  const pollMs = Number(process.env.HERMES_RUN_POLL_MS ?? 1_000);

  if (!baseUrl || !token) throw new Error("Hermes endpoint is not configured");

  const create = await fetch(`${baseUrl}/v1/runs`, {
    method: "POST",
    headers: headers(token, mission),
    body: JSON.stringify({
      input: JSON.stringify({ action: mission.action, payload: mission.payload }),
      instructions: [
        "You are the AGESOMA execution substrate, not the authorization authority.",
        "Execute only the scoped business action supplied in input.",
        "Do not broaden permissions or invent additional external actions.",
        "Return a concise execution result with evidence identifiers when available."
      ].join(" ")
    }),
    signal: AbortSignal.timeout(15_000)
  });

  if (!create.ok) throw new Error(`Hermes run creation failed: ${create.status}`);
  const created = (await create.json()) as HermesRunStatus;
  if (!created.run_id) throw new Error("Hermes did not return a run_id");

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl}/v1/runs/${created.run_id}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`Hermes run status failed: ${response.status}`);

    const run = (await response.json()) as HermesRunStatus;
    if (run.status === "completed") {
      return {
        runId: run.run_id,
        status: run.status,
        output: run.output ?? null,
        usage: run.usage ?? null
      };
    }
    if (run.status === "failed" || run.status === "cancelled") {
      throw new Error(`Hermes run ${run.status}: ${JSON.stringify(run.error ?? null)}`);
    }
    await sleep(pollMs);
  }

  await fetch(`${baseUrl}/v1/runs/${created.run_id}/stop`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000)
  }).catch(() => undefined);

  throw new Error(`Hermes run timed out after ${timeoutMs}ms`);
}
