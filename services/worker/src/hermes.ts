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
    "idempotency-key": `instantwork-${mission.taskId}`,
    "x-hermes-session-key": `instantwork:tenant:${mission.tenantId}`
  };
}

function envelopeInstructions(action: string) {
  if (action === "business.observe") {
    return "You may discover and navigate any public resource or resource already authorized by the business that is useful to the objective. Read and analyze only. Do not create external side effects.";
  }
  if (action === "business.work") {
    return "You may choose any authorized route, site, application or local working method needed to prepare the result. Keep work reversible and do not create external commitments or communications.";
  }
  if (action === "business.act") {
    return "The owner has approved an external-action envelope for this task. You may choose any authorized route needed to complete that scoped action, but do not spend money, change commercial terms, alter security settings, or create obligations outside the supplied objective.";
  }
  if (action === "business.commit") {
    return "This task carries explicit consequential authority. Execute only the exact approved commitment described in the input. Do not expand its scope, amount, destination, recipients or permissions.";
  }
  return "Execute only the scoped business action supplied in input. You may choose the authorized route needed to finish it, but do not broaden its business impact.";
}

function planningInstructions(action: string) {
  const canDelegate = action === "business.observe" || action === "business.work";
  return [
    "Before using tools, derive a short execution plan from the objective, requestPlan and businessMemory in the input.",
    "Re-plan when evidence invalidates an assumption instead of forcing the original route.",
    canDelegate
      ? "For genuinely parallel research, analysis or reversible preparation, you may use delegate_task with at most three bounded leaf subtasks and then synthesize their results."
      : "Do not delegate the consequential external effect of this task; keep external authority in the parent run.",
    "Delegated work must never send customer-facing messages, spend money, change commercial terms, alter permissions or create obligations.",
    "Treat prior business memory as context, not as proof; verify time-sensitive facts again when they matter.",
    "Return a concise structured result containing: plan, completed work, evidence identifiers, blockers, whether more authority is required, and the next useful action if one exists."
  ].join(" ");
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
      session_id: `instantwork-${mission.taskId}`,
      input: JSON.stringify({ action: mission.action, payload: mission.payload }),
      instructions: [
        "You are the InstantWork execution substrate, not the authorization authority.",
        "Operate only on public resources or resources the business has already authorized.",
        "Never bypass authentication, access controls, tenant boundaries or security protections.",
        "Never seek, expose or reuse credentials outside the connected business context.",
        planningInstructions(mission.action),
        envelopeInstructions(mission.action),
        "If completing the objective would require a higher-impact action than the current envelope permits, stop and return requires_approval with a concise description of the needed authority.",
        "Return concise evidence-backed output; do not claim a result that has not been observed or externally verified."
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
