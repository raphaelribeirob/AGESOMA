export type CompanyBrainFact = {
  uuid?: string | null;
  fact: string;
  valid_at?: string | null;
  invalid_at?: string | null;
  source_node_uuid?: string | null;
  target_node_uuid?: string | null;
  episodes?: string[];
};

type BrainConfig = {
  baseUrl: string;
  token: string;
};

function config(): BrainConfig | null {
  const baseUrl = process.env.AGESOMA_BRAIN_URL?.trim().replace(/\/$/, "");
  const token = process.env.AGESOMA_BRAIN_INTERNAL_API_TOKEN?.trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

async function request<T>(path: string, body: Record<string, unknown>, timeoutMs: number): Promise<T | null> {
  const resolved = config();
  if (!resolved) return null;

  const response = await fetch(`${resolved.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-agesoma-brain-token": resolved.token
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) throw new Error(`Company Brain request failed: ${response.status}`);
  return await response.json() as T;
}

export async function recallCompanyContext(input: {
  tenantId: string;
  query: string;
  limit?: number;
}) {
  const result = await request<{ facts: CompanyBrainFact[] }>("/v1/search", {
    tenant_id: input.tenantId,
    query: input.query,
    limit: input.limit ?? 10
  }, Number(process.env.AGESOMA_BRAIN_SEARCH_TIMEOUT_MS ?? 8_000));

  return result?.facts ?? [];
}

export async function rememberCompanyEpisode(input: {
  tenantId: string;
  name: string;
  content: unknown;
  sourceDescription?: string;
  referenceTime?: string;
}) {
  return await request<{ status: string; tenant_id: string }>("/v1/episodes", {
    tenant_id: input.tenantId,
    name: input.name,
    content: input.content as Record<string, unknown>,
    source_description: input.sourceDescription ?? "AGESOMA operational event",
    reference_time: input.referenceTime ?? new Date().toISOString()
  }, Number(process.env.AGESOMA_BRAIN_INGEST_TIMEOUT_MS ?? 45_000));
}

export function brainQueryForTask(action: string, payload: Record<string, unknown>) {
  const objective = typeof payload.objective === "string" && payload.objective.trim()
    ? payload.objective.trim()
    : action;
  return `Business context, prior decisions, people, processes and results relevant to this objective: ${objective}`;
}
