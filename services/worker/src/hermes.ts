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

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function tenantUrl(template: string, tenantId: string, name: string) {
  if (!template.includes("{tenantId}")) throw new Error(`${name} must contain {tenantId}`);
  return template.replaceAll("{tenantId}", encodeURIComponent(tenantId)).replace(/\/$/, "");
}

function resolveWorkCellBaseUrl(mission: HermesMission) {
  const template = process.env.HERMES_BASE_URL_TEMPLATE?.trim();
  if (template) return tenantUrl(template, mission.tenantId, "HERMES_BASE_URL_TEMPLATE");

  if (process.env.AGESOMA_ALLOW_SHARED_HERMES === "true") {
    const shared = process.env.HERMES_BASE_URL?.trim();
    if (shared) return shared.replace(/\/$/, "");
  }

  throw new Error("Tenant-routed Hermes Work Cell is required; shared Hermes is disabled");
}

function resolveCredentialBrokerBaseUrl(mission: HermesMission) {
  const template = process.env.CREDENTIAL_BROKER_BASE_URL_TEMPLATE?.trim();
  if (!template) throw new Error("Tenant credential broker is not configured");
  return tenantUrl(template, mission.tenantId, "CREDENTIAL_BROKER_BASE_URL_TEMPLATE");
}

function normalizeRecipient(value: string) {
  return value.replace(/^whatsapp:/i, "").replace(/\D/g, "");
}

const PAID_MEDIA_WRITE_ACTIONS: Record<string, string> = {
  "paid_media.create_campaign": "create_campaign",
  "paid_media.create_adset": "create_adset",
  "paid_media.create_ad": "create_ad",
  "paid_media.update_ad_creative": "update_ad_creative",
  "paid_media.pause_campaign": "pause_campaign",
  "paid_media.pause_adset": "pause_adset",
  "paid_media.pause_ad": "pause_ad",
  "paid_media.enable_campaign": "enable_campaign",
  "paid_media.set_campaign_budget": "set_campaign_budget",
  "paid_media.set_adset_budget": "set_adset_budget"
};

function paidMediaConnector(value: unknown) {
  const provider = text(value)?.toLowerCase();
  if (!provider || provider === "paid_media" || provider === "all") return "all";
  if (["facebook", "meta", "meta_ads", "instagram", "instagram_ads"].includes(provider)) return "facebook";
  if (["google", "google_ads"].includes(provider)) return "google_ads";
  return null;
}

async function paidMediaBrokerFetch(
  mission: HermesMission,
  path: string,
  init?: RequestInit
) {
  const brokerToken = process.env.CREDENTIAL_BROKER_SERVICE_TOKEN?.trim();
  if (!brokerToken) throw new Error("Credential broker service token is not configured");
  const brokerUrl = resolveCredentialBrokerBaseUrl(mission);
  const requestHeaders = new Headers(init?.headers);
  requestHeaders.set("x-agesoma-broker-token", brokerToken);
  requestHeaders.set("x-agesoma-task-id", mission.taskId);
  if (mission.grantRef) requestHeaders.set("x-agesoma-grant-ref", mission.grantRef);

  return await fetch(`${brokerUrl}${path}`, {
    ...init,
    headers: requestHeaders,
    signal: AbortSignal.timeout(30_000)
  });
}

async function loadPaidMediaContext(mission: HermesMission) {
  if (mission.action !== "paid_media.read") return null;

  const connector = paidMediaConnector(mission.payload.resource);
  if (!connector) throw new Error("Paid media provider is not supported");

  const parameters = record(mission.payload.parameters) ?? {};
  const datePreset = text(parameters.datePreset) ?? "last_7dT";
  const fields = connector === "facebook"
    ? "date,account_id,account_name,campaign,campaign_id,campaign_daily_budget,campaign_lifetime_budget,campaign_budget_remaining,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency"
    : "date,source,account_id,account_name,campaign,campaign_id,spend,impressions,clicks";

  const query = new URLSearchParams({ fields, date_preset: datePreset });
  const response = await paidMediaBrokerFetch(
    mission,
    `/v1/paid-media/${connector}/data?${query.toString()}`
  );
  const providerResponse = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Paid media data provider rejected read: ${response.status}`);
  }

  return {
    connector,
    datePreset,
    fields: fields.split(","),
    rows: Array.isArray(providerResponse) ? providerResponse : providerResponse ?? []
  };
}

async function verifiedMetaCampaignDailyBudget(
  mission: HermesMission,
  account: string,
  campaignId: string
) {
  const query = new URLSearchParams({
    fields: "campaign_id,campaign_daily_budget",
    select_accounts: account,
    date_preset: "last_1dT"
  });
  const response = await paidMediaBrokerFetch(
    mission,
    `/v1/paid-media/facebook/data?${query.toString()}`
  );
  const providerResponse = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(providerResponse)) {
    throw new Error("Could not verify the current Meta campaign budget");
  }

  const row = providerResponse.find((item) => {
    const recordItem = record(item);
    return text(recordItem?.campaign_id) === campaignId;
  });
  const budget = row && record(row) ? Number(record(row)?.campaign_daily_budget) : NaN;
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error("Meta campaign does not expose a verifiable campaign-level daily budget");
  }
  return Math.trunc(budget);
}

async function maybeExecutePaidMediaAction(mission: HermesMission) {
  const providerAction = PAID_MEDIA_WRITE_ACTIONS[mission.action];
  if (!providerAction) return null;
  if (!mission.grantRef) throw new Error("Approved paid media action is missing scoped authority");

  const connector = paidMediaConnector(mission.payload.resource);
  if (connector !== "facebook") {
    throw new Error("Paid media writes currently support Meta Ads through the secured broker; other providers remain read-only");
  }

  const account = text(mission.payload.destination);
  if (!account) throw new Error("Paid media account is missing from the approved destination");

  const rawParameters = record(mission.payload.parameters) ?? {};
  const parameters: Record<string, unknown> = { ...rawParameters };

  if (["create_campaign", "create_adset", "create_ad"].includes(providerAction)) {
    if (text(parameters.status)?.toLowerCase() === "active") {
      throw new Error("New paid media objects must be created paused; activation requires separate R3 approval");
    }
    parameters.status = "paused";
  }

  const amountCents = mission.payload.amountCents;
  if (
    ["enable_campaign", "set_campaign_budget", "set_adset_budget"].includes(providerAction) &&
    (typeof amountCents !== "number" || !Number.isFinite(amountCents) || amountCents <= 0)
  ) {
    throw new Error("Spend-capable paid media action requires an explicit approved amount");
  }

  if (
    ["set_campaign_budget", "set_adset_budget"].includes(providerAction) &&
    typeof parameters.amount === "number" &&
    parameters.amount !== amountCents
  ) {
    throw new Error("Paid media budget differs from the approved amount");
  }

  if (providerAction === "enable_campaign") {
    const campaignId = text(parameters.campaign_id);
    if (!campaignId) throw new Error("Meta campaign id is required for activation");
    const currentDailyBudget = await verifiedMetaCampaignDailyBudget(mission, account, campaignId);
    if (currentDailyBudget !== amountCents) {
      throw new Error("Meta campaign daily budget differs from the approved activation amount");
    }
  }

  const response = await paidMediaBrokerFetch(mission, "/v1/paid-media/facebook/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      account,
      action: providerAction,
      params: parameters
    })
  });
  const providerResponse = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Paid media provider rejected action: ${response.status}`);
  }

  return {
    runId: `windsor-${mission.taskId}`,
    status: "completed",
    output: {
      artifact: {
        kind: "provider_action",
        title: "Ação de mídia paga executada",
        content: {
          provider: "windsor",
          connector: "facebook",
          action: providerAction,
          account
        }
      },
      evidence: {
        provider: "windsor",
        connector: "facebook",
        action: providerAction,
        providerResponse
      }
    },
    usage: null
  };
}

async function maybeExecuteCredentialedAction(mission: HermesMission) {
  if (mission.action !== "business.act" && mission.action !== "business.commit") return null;
  if (text(mission.payload.resource)?.toLowerCase() !== "whatsapp") return null;
  if (!mission.grantRef) throw new Error("Approved WhatsApp action is missing scoped authority");

  const operation = text(mission.payload.operation)?.toLowerCase();
  if (!operation || !["send", "send_message", "send_text", "message"].includes(operation)) {
    throw new Error("Approved WhatsApp operation is not supported by the credential broker");
  }

  const destination = text(mission.payload.destination);
  const parameters = record(mission.payload.parameters) ?? {};
  const approvedRecipient = destination ? normalizeRecipient(destination) : "";
  const requestedRecipient = text(parameters.to) ? normalizeRecipient(text(parameters.to)!) : approvedRecipient;
  if (!approvedRecipient || !requestedRecipient || approvedRecipient !== requestedRecipient) {
    throw new Error("WhatsApp recipient differs from the approved capability");
  }

  const message = text(parameters.text) ?? text(parameters.message);
  if (!message) throw new Error("Approved WhatsApp message text is missing");

  const brokerToken = process.env.CREDENTIAL_BROKER_SERVICE_TOKEN?.trim();
  if (!brokerToken) throw new Error("Credential broker service token is not configured");
  const brokerUrl = resolveCredentialBrokerBaseUrl(mission);
  const response = await fetch(`${brokerUrl}/v1/whatsapp/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-agesoma-broker-token": brokerToken,
      "x-agesoma-task-id": mission.taskId,
      "x-agesoma-grant-ref": mission.grantRef
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: requestedRecipient,
      type: "text",
      text: { body: message }
    }),
    signal: AbortSignal.timeout(20_000)
  });
  const providerResponse = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Credential broker rejected WhatsApp action: ${response.status}`);

  return {
    runId: `broker-${mission.taskId}`,
    status: "completed",
    output: {
      artifact: {
        kind: "provider_action",
        title: "Mensagem enviada",
        content: { recipient: requestedRecipient, provider: "whatsapp_cloud" }
      },
      evidence: { provider: "whatsapp_cloud", providerResponse }
    },
    usage: null
  };
}

function envelopeInstructions(action: string) {
  if (action === "paid_media.read") {
    return "Read and analyze paid-media reporting data only. Do not create, activate, pause or modify campaigns, ads, bids or budgets in this run.";
  }
  if (action === "business.observe") {
    return "You may discover and navigate any public resource or resource already authorized by the business that is useful to the objective. Read and analyze only. Do not create external side effects.";
  }
  if (action === "business.work") {
    return "You may choose any authorized route, site, application or local working method needed to prepare the result. Keep work reversible and do not create external commitments or communications.";
  }
  if (action === "business.act") {
    return "The owner has approved an external-action envelope for this task. Execute only the destination, operation, resource and parameters supplied in the approved payload. Do not spend money, change commercial terms, alter security settings, or create obligations outside that exact capability.";
  }
  if (action === "business.commit") {
    return "This task carries explicit consequential authority. Execute only the exact approved commitment described in the input. Do not expand its scope, amount, destination, recipients, parameters or permissions.";
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
    canDelegate
      ? "If the user objective ultimately requires an external or consequential side effect, do not perform it in this run. Return a concrete proposedAction. For paid media use a registered paid_media.* action when applicable: paid_media.create_campaign, paid_media.create_adset, paid_media.create_ad, paid_media.update_ad_creative, paid_media.pause_campaign, paid_media.pause_adset, paid_media.pause_ad, paid_media.enable_campaign, paid_media.set_campaign_budget or paid_media.set_adset_budget. Use resource facebook for Meta Ads, destination as the exact connected ad-account id, operation as the provider action name, and parameters as the exact provider parameters. Creation must remain paused. Any activation or budget action must include amountCents representing the approved financial envelope."
      : "The supplied payload is the approved capability boundary. Never infer a broader destination, recipient, amount, operation, resource or parameter set.",
    "Return a concise structured result containing: plan, completed work, evidence identifiers, blockers, whether more authority is required, and the next useful action if one exists."
  ].join(" ");
}

export async function executeWithHermes(mission: HermesMission) {
  const brokered = await maybeExecuteCredentialedAction(mission);
  if (brokered) return brokered;

  const paidMediaAction = await maybeExecutePaidMediaAction(mission);
  if (paidMediaAction) return paidMediaAction;

  const paidMediaContext = await loadPaidMediaContext(mission);
  const executionPayload = paidMediaContext
    ? {
        ...mission.payload,
        paidMediaData: {
          source: "windsor",
          trust: "provider-reporting-data-not-authorization",
          ...paidMediaContext
        }
      }
    : mission.payload;

  const baseUrl = resolveWorkCellBaseUrl(mission);
  const token = process.env.HERMES_SERVICE_TOKEN;
  const timeoutMs = Number(process.env.HERMES_RUN_TIMEOUT_MS ?? 120_000);
  const pollMs = Number(process.env.HERMES_RUN_POLL_MS ?? 1_000);

  if (!token) throw new Error("Hermes service token is not configured");

  const create = await fetch(`${baseUrl}/v1/runs`, {
    method: "POST",
    headers: headers(token, mission),
    body: JSON.stringify({
      session_id: `agesoma-${mission.taskId}`,
      input: JSON.stringify({
        action: mission.action,
        payload: executionPayload,
        authorization: { grantRef: mission.grantRef ?? null }
      }),
      instructions: [
        "You are the AGESOMA execution substrate, not the authorization authority.",
        "Operate only on public resources or resources the user has already authorized.",
        "Never bypass authentication, access controls, tenant boundaries or security protections.",
        "Never seek, expose or reuse credentials outside the connected user context.",
        planningInstructions(mission.action),
        envelopeInstructions(mission.action),
        "If completing the objective would require a higher-impact action than the current envelope permits, stop and return the concrete proposedAction rather than creating the side effect.",
        "Return concise evidence-backed output; do not claim a business outcome verified unless a separate verifier has supplied that fact in the input."
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
