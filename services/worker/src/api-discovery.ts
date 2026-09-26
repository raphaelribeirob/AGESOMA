type CatalogCandidate = {
  name: string;
  url: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  category: string;
  source: "public-api-lists" | "public-apis";
  openApiUrl?: string | null;
};

export type ApiDiscoveryCandidate = CatalogCandidate & {
  openApi: boolean;
  score: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const PUBLIC_API_LISTS_URL = "https://public-api-lists.github.io/public-api-lists/api/all.json";
const PUBLIC_APIS_URL = "https://api.publicapis.org/entries";
const APIS_GURU_URL = "https://api.apis.guru/v2/list.json";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CATALOG_BYTES = 8 * 1024 * 1024;

const cache = new Map<string, CacheEntry<unknown>>();

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return [...new Set(normalize(value).split(/\s+/).filter((item) => item.length > 1))];
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fixedJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "AGESOMA-API-Discovery/1.0" },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`API catalog request failed: ${response.status}`);

  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_CATALOG_BYTES) throw new Error("API catalog response is too large");

  const raw = await response.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_CATALOG_BYTES) throw new Error("API catalog response is too large");

  const value = JSON.parse(raw) as T;
  cache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}

function parsePublicApiLists(value: unknown): CatalogCandidate[] {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const entries = Array.isArray(body.entries) ? body.entries : [];
  return entries.flatMap((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
    if (!item) return [];
    const url = safeHttpUrl(item.url);
    if (!url || typeof item.name !== "string") return [];
    return [{
      name: item.name.trim(),
      url,
      description: typeof item.description === "string" ? item.description.trim() : "",
      auth: typeof item.auth === "string" ? item.auth : "Unknown",
      https: url.startsWith("https://"),
      cors: typeof item.cors === "string" ? item.cors : "Unknown",
      category: typeof item.category === "string" ? item.category : "Unknown",
      source: "public-api-lists" as const,
      openApiUrl: null
    }];
  });
}

function parsePublicApis(value: unknown): CatalogCandidate[] {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const entries = Array.isArray(body.entries) ? body.entries : [];
  return entries.flatMap((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
    if (!item) return [];
    const url = safeHttpUrl(item.Link);
    if (!url || typeof item.API !== "string") return [];
    return [{
      name: item.API.trim(),
      url,
      description: typeof item.Description === "string" ? item.Description.trim() : "",
      auth: typeof item.Auth === "string" && item.Auth.trim() ? item.Auth : "No",
      https: url.startsWith("https://"),
      cors: typeof item.Cors === "string" ? item.Cors : "Unknown",
      category: typeof item.Category === "string" ? item.Category : "Unknown",
      source: "public-apis" as const,
      openApiUrl: null
    }];
  });
}

type OpenApiIndex = {
  byHost: Map<string, string>;
  byName: Map<string, string>;
};

function parseApisGuru(value: unknown): OpenApiIndex {
  const byHost = new Map<string, string>();
  const byName = new Map<string, string>();
  if (!value || typeof value !== "object") return { byHost, byName };

  for (const [providerName, rawProvider] of Object.entries(value as Record<string, unknown>)) {
    if (!rawProvider || typeof rawProvider !== "object") continue;
    const provider = rawProvider as Record<string, unknown>;
    const versions = provider.versions && typeof provider.versions === "object"
      ? provider.versions as Record<string, unknown>
      : {};
    const preferred = typeof provider.preferred === "string" ? provider.preferred : Object.keys(versions)[0];
    const versionRaw = preferred ? versions[preferred] : null;
    if (!versionRaw || typeof versionRaw !== "object") continue;
    const version = versionRaw as Record<string, unknown>;
    const swaggerUrl = safeHttpUrl(version.swaggerUrl);
    if (!swaggerUrl) continue;

    const swaggerHost = new URL(swaggerUrl).hostname.toLowerCase();
    if (swaggerHost !== "api.apis.guru") continue;

    const info = version.info && typeof version.info === "object"
      ? version.info as Record<string, unknown>
      : {};
    const title = typeof info.title === "string" ? normalize(info.title) : "";
    if (title) byName.set(title, swaggerUrl);

    const normalizedProvider = normalize(providerName);
    if (normalizedProvider) byName.set(normalizedProvider, swaggerUrl);

    const externalDocs = version.externalDocs && typeof version.externalDocs === "object"
      ? version.externalDocs as Record<string, unknown>
      : {};
    const docsUrl = safeHttpUrl(externalDocs.url);
    if (docsUrl) byHost.set(new URL(docsUrl).hostname.toLowerCase(), swaggerUrl);
  }

  return { byHost, byName };
}

function scoreCandidate(candidate: CatalogCandidate, query: string) {
  const queryNorm = normalize(query);
  const queryTokens = tokens(query);
  const name = normalize(candidate.name);
  const description = normalize(candidate.description);
  const category = normalize(candidate.category);

  let score = 0;
  if (queryNorm && name.includes(queryNorm)) score += 10;
  for (const token of queryTokens) {
    if (name.includes(token)) score += 4;
    if (category.includes(token)) score += 2;
    if (description.includes(token)) score += 1;
  }
  if (candidate.auth.toLowerCase() === "no") score += 2.5;
  if (candidate.https) score += 1;
  if (candidate.cors.toLowerCase() === "yes") score += 0.5;
  if (candidate.source === "public-api-lists") score += 0.25;
  return score;
}

function hostOf(url: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function attachOpenApi(candidate: CatalogCandidate, index: OpenApiIndex) {
  const host = hostOf(candidate.url);
  let openApiUrl = index.byHost.get(host) ?? null;
  if (!openApiUrl) {
    const candidateName = normalize(candidate.name);
    for (const [name, url] of index.byName) {
      if (name === candidateName || (candidateName.length > 4 && name.includes(candidateName)) || (name.length > 4 && candidateName.includes(name))) {
        openApiUrl = url;
        break;
      }
    }
  }
  return { ...candidate, openApiUrl };
}

export function rankApiCandidates(candidates: CatalogCandidate[], query: string, limit = 8) {
  const normalizedQuery = normalize(query);
  const noAuthOnly = /\b(no auth|sem auth|sem autenticacao|sem chave|sem api key)\b/.test(normalizedQuery);
  const corsOnly = /\bcors\b/.test(normalizedQuery);
  const openApiOnly = /\b(openapi|swagger)\b/.test(normalizedQuery);

  const unique = new Map<string, CatalogCandidate>();
  for (const candidate of candidates) {
    if (!candidate.https) continue;
    if (noAuthOnly && candidate.auth.toLowerCase() !== "no") continue;
    if (corsOnly && candidate.cors.toLowerCase() !== "yes") continue;
    if (openApiOnly && !candidate.openApiUrl) continue;
    const key = `${normalize(candidate.name)}|${hostOf(candidate.url)}`;
    const existing = unique.get(key);
    if (!existing || scoreCandidate(candidate, query) > scoreCandidate(existing, query)) unique.set(key, candidate);
  }

  return [...unique.values()]
    .map((candidate) => ({
      ...candidate,
      openApi: Boolean(candidate.openApiUrl),
      score: Number((scoreCandidate(candidate, query) + (candidate.openApiUrl ? 1.5 : 0)).toFixed(2))
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Math.min(20, limit)));
}

export async function discoverFreeApis(query: string, limit = 8) {
  const settled = await Promise.allSettled([
    fixedJson<unknown>(PUBLIC_API_LISTS_URL),
    fixedJson<unknown>(PUBLIC_APIS_URL),
    fixedJson<unknown>(APIS_GURU_URL)
  ]);

  const catalog: CatalogCandidate[] = [];
  if (settled[0].status === "fulfilled") catalog.push(...parsePublicApiLists(settled[0].value));
  if (settled[1].status === "fulfilled") catalog.push(...parsePublicApis(settled[1].value));

  const openApiIndex = settled[2].status === "fulfilled"
    ? parseApisGuru(settled[2].value)
    : { byHost: new Map<string, string>(), byName: new Map<string, string>() };

  const enriched = catalog.map((candidate) => attachOpenApi(candidate, openApiIndex));
  const candidates = rankApiCandidates(enriched, query, limit);

  return {
    query,
    candidates,
    sources: {
      publicApiLists: settled[0].status === "fulfilled",
      publicApis: settled[1].status === "fulfilled",
      apisGuru: settled[2].status === "fulfilled"
    },
    policy: {
      discoveryOnly: true,
      autoExecution: false,
      requiresVerificationBeforeIntegration: true,
      note: "Catalog inclusion does not prove current pricing, uptime, terms, data quality or authorization suitability."
    }
  };
}
