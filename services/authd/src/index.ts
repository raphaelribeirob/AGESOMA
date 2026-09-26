import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { sql } from "@agesoma/db";

type ResolveRequest = {
  tenantId: string;
  taskId: string;
  surrogate: string;
  purpose: string;
};

const port = Number(process.env.PORT ?? 8083);
const serviceToken = process.env.AUTHD_SERVICE_TOKEN?.trim() ?? "";
const tenantId = process.env.AGESOMA_TENANT_ID?.trim() ?? "";

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function sameSecret(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && left.length > 0 && timingSafeEqual(left,right);
}

function authorized(req: IncomingMessage) {
  const supplied = req.headers["x-agesoma-authd-token"];
  return typeof supplied === "string" && sameSecret(supplied,serviceToken);
}

async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > 16 * 1024) throw new Error("request_too_large");
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function parse(value: unknown): ResolveRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_request");
  const input = value as Record<string, unknown>;
  for (const key of ["tenantId","taskId","surrogate","purpose"]) {
    if (typeof input[key] !== "string" || !(input[key] as string).trim()) throw new Error("invalid_request");
  }
  const surrogate = String(input.surrogate);
  if (!/^cred:\/\/[a-z0-9_-]+\/[a-z0-9._-]+$/i.test(surrogate)) throw new Error("invalid_surrogate");
  return {
    tenantId: String(input.tenantId),
    taskId: String(input.taskId),
    surrogate,
    purpose: String(input.purpose)
  };
}

function providerFromSurrogate(surrogate: string) {
  return surrogate.slice("cred://".length).split("/")[0].toLowerCase();
}

function secretFor(provider: string) {
  if (provider === "steel") return process.env.STEEL_API_KEY?.trim() ?? "";
  if (provider === "whatsapp") return process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim() ?? "";
  if (provider === "windsor") return process.env.WINDSOR_API_KEY?.trim() ?? "";
  return "";
}

async function resolveCredential(input: ResolveRequest) {
  if (input.tenantId !== tenantId) throw new Error("tenant_mismatch");

  const provider = providerFromSurrogate(input.surrogate);
  const [task] = await sql<{ id: string }>(`
    select id from tasks
    where tenant_id=$1 and id=$2 and status in ('running','queued')
    limit 1
  `,[input.tenantId,input.taskId]);
  if (!task) throw new Error("task_not_executable");

  const [handle] = await sql<{ id: string }>(`
    select id from credential_handles
    where tenant_id=$1 and provider=$2 and handle=$3 and status='active'
    limit 1
  `,[input.tenantId,provider,input.surrogate]);
  if (!handle) throw new Error("surrogate_not_active");

  const credential = secretFor(provider);
  if (!credential) throw new Error("credential_not_configured");

  await sql(`
    update credential_handles set last_used_at=now(),updated_at=now()
    where tenant_id=$1 and id=$2
  `,[input.tenantId,handle.id]);

  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'credential_resolved','authd',$3,$4::jsonb)
  `,[
    input.tenantId,input.taskId,`Resolved surrogate for ${provider}`,
    JSON.stringify({ provider,surrogate:input.surrogate,purpose:input.purpose,credentialExposedToRuntime:false })
  ]);

  return { provider,credential };
}

const server = createServer(async (req,res) => {
  try {
    if (req.method === "GET" && req.url === "/health") return json(res,200,{ok:true,mode:"surrogate-only"});
    if (!authorized(req)) return json(res,403,{error:"forbidden"});
    if (req.method !== "POST" || req.url !== "/v1/resolve") return json(res,404,{error:"not_found"});

    const input = parse(await body(req));
    const result = await resolveCredential(input);
    return json(res,200,result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "authd_error";
    const status = message === "credential_not_configured" ? 503
      : message === "request_too_large" ? 413
      : ["tenant_mismatch","task_not_executable","surrogate_not_active"].includes(message) ? 403
      : 400;
    return json(res,status,{error:message});
  }
});

if (!serviceToken) throw new Error("AUTHD_SERVICE_TOKEN is required");
if (!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
server.listen(port,"0.0.0.0",() => console.log(`AGESOMA authd listening on ${port}`));
