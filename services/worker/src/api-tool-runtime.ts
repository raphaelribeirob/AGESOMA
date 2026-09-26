import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { sql } from "@agesoma/db";
import type { ApiToolRecipeDefinition, ApiToolOperation } from "./api-tool-builder";
import { authorizeEgress } from "./sentinel-client";

type ToolRecipeRow = {
  id: string;
  name: string;
  definition: unknown;
  status: string;
  risk_class: string;
  auth_mode: string;
  base_url: string | null;
};

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function isUnsafeIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a,b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isUnsafeIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

async function assertPublicHostname(hostname: string) {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Dynamic API tool host is not public");
  }
  if (isIP(hostname)) {
    if ((isIP(hostname) === 4 && isUnsafeIpv4(hostname)) || (isIP(hostname) === 6 && isUnsafeIpv6(hostname))) {
      throw new Error("Dynamic API tool resolves to a private or reserved address");
    }
    return hostname;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error("Dynamic API tool host did not resolve");
  for (const item of addresses) {
    if ((item.family === 4 && isUnsafeIpv4(item.address)) || (item.family === 6 && isUnsafeIpv6(item.address))) {
      throw new Error("Dynamic API tool resolves to a private or reserved address");
    }
  }
  return addresses[0].address;
}

function recipeDefinition(value: unknown): ApiToolRecipeDefinition {
  const definition = object(value);
  if (!definition || definition.kind !== "openapi_readonly" || definition.version !== 1) {
    throw new Error("Tool recipe definition is not a supported OpenAPI read-only tool");
  }
  return definition as unknown as ApiToolRecipeDefinition;
}

function findOperation(definition: ApiToolRecipeDefinition, operationId: string) {
  const operation = definition.operations.find((item) => item.operationId === operationId);
  if (!operation) throw new Error("Requested operation is not registered in this tool");
  if (operation.method !== "GET" && operation.method !== "HEAD") {
    throw new Error("Dynamic API runtime only permits GET/HEAD operations");
  }
  return operation;
}

function scalar(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function buildToolRequestUrl(
  definition: ApiToolRecipeDefinition,
  operation: ApiToolOperation,
  args: Record<string, unknown>
) {
  let path = operation.path;
  const query = new URLSearchParams();

  for (const parameter of operation.parameters) {
    const value = args[parameter.name];
    if (value === undefined || value === null || value === "") {
      if (parameter.required) throw new Error(`Missing required parameter: ${parameter.name}`);
      continue;
    }

    if (parameter.in === "path") {
      if (!scalar(value)) throw new Error(`Path parameter must be scalar: ${parameter.name}`);
      path = path.replaceAll(`{${parameter.name}}`, encodeURIComponent(String(value)));
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value.slice(0,20)) {
        if (!scalar(item)) throw new Error(`Query parameter array must be scalar: ${parameter.name}`);
        query.append(parameter.name,String(item));
      }
    } else {
      if (!scalar(value)) throw new Error(`Query parameter must be scalar: ${parameter.name}`);
      query.set(parameter.name,String(value));
    }
  }

  if (/\{[^}]+\}/.test(path)) throw new Error("Not all path parameters were resolved");

  const base = new URL(definition.baseUrl.endsWith("/") ? definition.baseUrl : `${definition.baseUrl}/`);
  const relative = path.replace(/^\/+/, "");
  const url = new URL(relative,base);
  if (url.origin !== base.origin) throw new Error("Tool operation escaped its registered API origin");
  url.search = query.toString();
  return url;
}

async function readLimitedResponse(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > 1_048_576) throw new Error("Dynamic API response is too large");
  const raw = await response.text();
  if (Buffer.byteLength(raw,"utf8") > 1_048_576) throw new Error("Dynamic API response is too large");

  const contentType = response.headers.get("content-type") ?? "";
  let body: unknown = raw;
  if (contentType.includes("json")) {
    try { body = JSON.parse(raw); } catch { body = raw; }
  }
  return { body,contentType };
}

export async function executeApprovedApiTool(input: {
  tenantId: string;
  taskId: string;
  recipeId: string;
  operationId: string;
  arguments: Record<string, unknown>;
}) {
  const [recipe] = await sql<ToolRecipeRow>(`
    select id,name,definition,status,risk_class,auth_mode,base_url
    from tool_recipes
    where tenant_id=$1 and id=$2
    limit 1
  `,[input.tenantId,input.recipeId]);

  if (!recipe) throw new Error("Dynamic API tool was not found");
  if (recipe.status !== "approved") throw new Error("Dynamic API tool is not approved");
  if (recipe.risk_class !== "R0") throw new Error("Dynamic API tool is not read-only");
  if (recipe.auth_mode !== "none") throw new Error("Authenticated dynamic tools are not enabled");

  const definition = recipeDefinition(recipe.definition);
  const operation = findOperation(definition,input.operationId);
  const url = buildToolRequestUrl(definition,operation,input.arguments);

  if (url.protocol !== "https:") throw new Error("Dynamic API tools require HTTPS");
  const resolvedIp = await assertPublicHostname(url.hostname);
  const [task] = await sql<{ data_taint: "clean" | "public" | "personal" | "sensitive" | "credential" }>(`
    select data_taint from tasks where tenant_id=$1 and id=$2 limit 1
  `, [input.tenantId,input.taskId]);
  if (!task) throw new Error("Dynamic API task was not found");

  await authorizeEgress({
    tenantId: input.tenantId,
    taskId: input.taskId,
    destination: url.toString(),
    operation: `api.tool_read:${operation.operationId}`,
    method: operation.method,
    path: `${url.pathname}${url.search}`,
    protocol: "https",
    resolvedIp,
    effect: "read",
    dataTaint: task.data_taint,
    containsUserData: !["clean","public"].includes(task.data_taint) && Boolean(url.search),
    requestMeta: { recipeId: recipe.id, operationId: operation.operationId }
  });

  const [run] = await sql<{ id: string }>(`
    insert into tool_recipe_runs (
      tenant_id,recipe_id,task_id,operation_id,request_arguments,status
    ) values ($1,$2,$3,$4,$5::jsonb,'running')
    returning id
  `,[input.tenantId,recipe.id,input.taskId,operation.operationId,JSON.stringify(input.arguments)]);

  try {
    const response = await fetch(url.toString(),{
      method: operation.method,
      headers: {
        accept: "application/json,text/plain;q=0.9,*/*;q=0.2",
        "user-agent": "AGESOMA-Dynamic-Tool/1.0"
      },
      redirect: "error",
      signal: AbortSignal.timeout(12_000)
    });
    const result = await readLimitedResponse(response);
    if (!response.ok) throw new Error(`Dynamic API returned HTTP ${response.status}`);

    const responseMeta = {
      status: response.status,
      contentType: result.contentType,
      host: url.hostname,
      method: operation.method,
      operationId: operation.operationId
    };

    await sql(`
      update tool_recipe_runs
      set status='completed',response_meta=$3::jsonb,completed_at=now()
      where tenant_id=$1 and id=$2
    `,[input.tenantId,run.id,JSON.stringify(responseMeta)]);

    await sql(`
      update tool_recipes
      set last_tested_at=now(),
          validation=validation || '{"externalExecutionTested":true}'::jsonb,
          updated_at=now()
      where tenant_id=$1 and id=$2
    `,[input.tenantId,recipe.id]);

    return {
      runId: `dynamic-tool-${run.id}`,
      status: "completed",
      output: {
        title: recipe.name,
        summary: `${recipe.name} respondeu com sucesso usando ${operation.operationId}.`,
        artifact: {
          kind: "api_tool_result",
          title: recipe.name,
          content: {
            recipeId: recipe.id,
            operationId: operation.operationId,
            response: result.body
          }
        },
        evidence: {
          dynamicTool: true,
          recipeId: recipe.id,
          runId: run.id,
          ...responseMeta
        }
      },
      usage: null
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Dynamic API execution failed";
    await sql(`
      update tool_recipe_runs
      set status='failed',error=$3,completed_at=now()
      where tenant_id=$1 and id=$2
    `,[input.tenantId,run.id,reason]);
    throw error;
  }
}
