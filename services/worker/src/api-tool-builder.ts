type JsonObject = Record<string, unknown>;

export type ApiToolOperation = {
  operationId: string;
  method: "GET" | "HEAD";
  path: string;
  summary: string;
  tags: string[];
  parameters: Array<{
    name: string;
    in: "path" | "query";
    required: boolean;
    type: string;
  }>;
};

export type ApiToolRecipeDefinition = {
  kind: "openapi_readonly";
  version: 1;
  baseUrl: string;
  sourceUrl: string;
  specUrl: string;
  authMode: "none" | "unknown";
  operations: ApiToolOperation[];
  blockedWriteOperations: number;
  validation: {
    contractValid: true;
    readOnly: true;
    externalExecutionTested: false;
    testMode: "contract_only";
    notes: string[];
  };
};

const MAX_SPEC_BYTES = 2 * 1024 * 1024;
const SAFE_SPEC_HOST = "api.apis.guru";
const WRITE_METHODS = new Set(["post","put","patch","delete","trace"]);

function object(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

function string(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function queryTokens(value: string) {
  return [...new Set(normalize(value).split(/\s+/).filter((item) => item.length > 1))];
}

function isPrivateIpv4(host: string) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a,b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

export function safeExternalHttpsUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "::1" ||
      host === "[::1]" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^f[cd][0-9a-f]{2}:/i.test(host) ||
      /^fe[89ab][0-9a-f]:/i.test(host) ||
      isPrivateIpv4(host)
    ) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function resolveBaseUrl(spec: JsonObject) {
  const servers = Array.isArray(spec.servers) ? spec.servers : [];
  for (const raw of servers) {
    const server = object(raw);
    const url = string(server?.url);
    if (!url || url.includes("{")) continue;
    const safe = safeExternalHttpsUrl(url);
    if (safe) return safe;
  }

  const host = string(spec.host);
  if (host) {
    const schemes = Array.isArray(spec.schemes) ? spec.schemes.filter((item): item is string => typeof item === "string") : [];
    if (!schemes.includes("https")) return null;
    const basePath = string(spec.basePath) ?? "";
    return safeExternalHttpsUrl(`https://${host}${basePath}`);
  }

  return null;
}

function parameterType(parameter: JsonObject) {
  const schema = object(parameter.schema);
  return string(schema?.type) ?? string(parameter.type) ?? "string";
}

function collectParameters(pathItem: JsonObject, operation: JsonObject) {
  const combined = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : [])
  ];
  const seen = new Set<string>();
  const result: ApiToolOperation["parameters"] = [];

  for (const raw of combined) {
    const parameter = object(raw);
    if (!parameter) continue;
    const name = string(parameter.name);
    const location = string(parameter.in);
    if (!name || (location !== "path" && location !== "query")) continue;
    const key = `${location}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      name,
      in: location,
      required: location === "path" || parameter.required === true,
      type: parameterType(parameter)
    });
  }

  return result;
}

function operationSecurityMode(spec: JsonObject, operation: JsonObject) {
  const operationSecurity = operation.security;
  if (Array.isArray(operationSecurity)) return operationSecurity.length === 0 ? "none" : "unknown";
  const globalSecurity = spec.security;
  if (Array.isArray(globalSecurity)) return globalSecurity.length === 0 ? "none" : "unknown";

  const components = object(spec.components);
  const schemes = object(components?.securitySchemes) ?? object(spec.securityDefinitions);
  return schemes && Object.keys(schemes).length ? "unknown" : "none";
}

function operationScore(operation: ApiToolOperation, objective: string) {
  const haystack = normalize([
    operation.operationId,
    operation.summary,
    operation.path,
    operation.tags.join(" ")
  ].join(" "));
  return queryTokens(objective).reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

export function buildRecipeFromOpenApi(input: {
  spec: unknown;
  objective: string;
  candidateName: string;
  sourceUrl: string;
  specUrl: string;
  candidateAuth: string;
}) {
  const spec = object(input.spec);
  if (!spec) throw new Error("OpenAPI document is not an object");

  const version = string(spec.openapi) ?? string(spec.swagger);
  if (!version || (!version.startsWith("3.") && version !== "2.0")) {
    throw new Error("Only OpenAPI 3.x and Swagger 2.0 are supported");
  }

  const baseUrl = resolveBaseUrl(spec);
  if (!baseUrl) throw new Error("OpenAPI document does not expose a safe HTTPS base URL");

  const sourceUrl = safeExternalHttpsUrl(input.sourceUrl);
  if (!sourceUrl) throw new Error("API source URL is not a safe HTTPS URL");

  const specUrl = new URL(input.specUrl);
  if (specUrl.protocol !== "https:" || specUrl.hostname.toLowerCase() !== SAFE_SPEC_HOST) {
    throw new Error("Only APIs.guru specifications are accepted for automatic tool building");
  }

  const paths = object(spec.paths);
  if (!paths) throw new Error("OpenAPI document does not contain paths");

  const readOperations: ApiToolOperation[] = [];
  let blockedWriteOperations = 0;
  let authMode: "none" | "unknown" = normalize(input.candidateAuth) === "no" ? "none" : "unknown";

  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem = object(rawPathItem);
    if (!pathItem || !path.startsWith("/")) continue;

    for (const [methodRaw, rawOperation] of Object.entries(pathItem)) {
      const method = methodRaw.toLowerCase();
      if (WRITE_METHODS.has(method)) {
        blockedWriteOperations += 1;
        continue;
      }
      if (method !== "get" && method !== "head") continue;

      const operation = object(rawOperation);
      if (!operation) continue;
      const operationId = string(operation.operationId) ?? `${method}_${path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
      const summary = string(operation.summary) ?? string(operation.description) ?? `${method.toUpperCase()} ${path}`;
      const tags = Array.isArray(operation.tags) ? operation.tags.filter((item): item is string => typeof item === "string") : [];
      const securityMode = operationSecurityMode(spec, operation);
      if (securityMode !== "none") authMode = "unknown";

      readOperations.push({
        operationId,
        method: method.toUpperCase() as "GET" | "HEAD",
        path,
        summary: summary.slice(0, 500),
        tags: tags.slice(0, 10),
        parameters: collectParameters(pathItem, operation).slice(0, 30)
      });
    }
  }

  if (!readOperations.length) throw new Error("OpenAPI document has no supported GET/HEAD operations");

  const operations = readOperations
    .sort((a,b) => operationScore(b,input.objective) - operationScore(a,input.objective))
    .slice(0, 30);

  const noAuth = authMode === "none";
  const validationNotes = [
    `Parsed ${operations.length} read-only operation(s).`,
    blockedWriteOperations ? `Blocked ${blockedWriteOperations} write operation(s) from dynamic execution.` : "No write operations were exposed.",
    noAuth ? "Catalog/spec indicates no authentication is required." : "Authentication is required or could not be proven absent.",
    "Contract validation does not call the discovered API."
  ];

  const definition: ApiToolRecipeDefinition = {
    kind: "openapi_readonly",
    version: 1,
    baseUrl,
    sourceUrl,
    specUrl: specUrl.toString(),
    authMode,
    operations,
    blockedWriteOperations,
    validation: {
      contractValid: true,
      readOnly: true,
      externalExecutionTested: false,
      testMode: "contract_only",
      notes: validationNotes
    }
  };

  return {
    name: `${input.candidateName.trim().slice(0, 120)} API`,
    description: `Ferramenta read-only gerada a partir de OpenAPI para ${input.candidateName.trim().slice(0, 160)}.`,
    status: noAuth ? "validated" as const : "draft" as const,
    riskClass: "R0" as const,
    authMode,
    baseUrl,
    definition,
    validation: definition.validation
  };
}

export async function buildApiToolFromSpec(input: {
  objective: string;
  candidateName: string;
  sourceUrl: string;
  specUrl: string;
  candidateAuth: string;
}) {
  const specUrl = new URL(input.specUrl);
  if (specUrl.protocol !== "https:" || specUrl.hostname.toLowerCase() !== SAFE_SPEC_HOST) {
    throw new Error("Automatic tool building only accepts APIs.guru specifications");
  }

  const response = await fetch(specUrl.toString(), {
    headers: { accept: "application/json", "user-agent": "AGESOMA-Tool-Builder/1.0" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`OpenAPI specification request failed: ${response.status}`);

  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_SPEC_BYTES) throw new Error("OpenAPI specification is too large");

  const raw = await response.text();
  if (Buffer.byteLength(raw,"utf8") > MAX_SPEC_BYTES) throw new Error("OpenAPI specification is too large");

  return buildRecipeFromOpenApi({
    ...input,
    spec: JSON.parse(raw)
  });
}
