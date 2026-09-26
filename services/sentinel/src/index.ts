import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { sql } from "@agesoma/db";

type Taint = "clean" | "public" | "personal" | "sensitive" | "credential";
type Effect = "read" | "control" | "write" | "commit";
type Decision = "ALLOW" | "REVIEW" | "DENY";

type AuthorizeRequest = {
  tenantId: string;
  taskId: string;
  destination: string;
  operation: string;
  method: string;
  path?: string;
  protocol?: string;
  resolvedIp: string;
  effect: Effect;
  dataTaint?: Taint;
  containsUserData?: boolean;
  grantRef?: string | null;
  capabilityHash?: string | null;
  requestMeta?: Record<string, unknown>;
};

type TaskRow = {
  id: string;
  action_type: string | null;
  risk_class: string;
  status: string;
  data_taint: Taint;
};

type GrantRow = {
  id: string;
  action_class: string;
  scope_hash: string | null;
};

const port = Number(process.env.PORT ?? 8081);
const serviceToken = process.env.SENTINEL_SERVICE_TOKEN?.trim() ?? "";
const tenantId = process.env.AGESOMA_TENANT_ID?.trim() ?? "";
const controlHosts = new Set(
  (process.env.SENTINEL_CONTROL_HOSTS ?? "api.steel.dev")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
);

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function sameSecret(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function authorized(req: IncomingMessage) {
  const supplied = req.headers["x-agesoma-sentinel-token"];
  return typeof supplied === "string" && sameSecret(supplied, serviceToken);
}

async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > 64 * 1024) throw new Error("request_too_large");
    chunks.push(data);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function request(value: unknown): AuthorizeRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_request");
  const input = value as Record<string, unknown>;
  const required = ["tenantId","taskId","destination","operation","method","resolvedIp","effect"];
  for (const key of required) if (typeof input[key] !== "string" || !(input[key] as string).trim()) throw new Error("invalid_request");
  const effect = input.effect as string;
  if (!["read","control","write","commit"].includes(effect)) throw new Error("invalid_effect");
  const taint = typeof input.dataTaint === "string" ? input.dataTaint : "clean";
  if (!["clean","public","personal","sensitive","credential"].includes(taint)) throw new Error("invalid_taint");
  return {
    tenantId: String(input.tenantId),
    taskId: String(input.taskId),
    destination: String(input.destination),
    operation: String(input.operation),
    method: String(input.method).toUpperCase(),
    path: typeof input.path === "string" ? input.path : undefined,
    protocol: typeof input.protocol === "string" ? input.protocol : undefined,
    resolvedIp: String(input.resolvedIp),
    effect: effect as Effect,
    dataTaint: taint as Taint,
    containsUserData: input.containsUserData === true,
    grantRef: typeof input.grantRef === "string" ? input.grantRef : null,
    capabilityHash: typeof input.capabilityHash === "string" ? input.capabilityHash : null,
    requestMeta: input.requestMeta && typeof input.requestMeta === "object" && !Array.isArray(input.requestMeta)
      ? input.requestMeta as Record<string, unknown>
      : {}
  };
}

function unsafeIp(address: string) {
  if (isIP(address) === 4) {
    const parts = address.split(".").map(Number);
    const [a,b] = parts;
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224;
  }
  if (isIP(address) === 6) {
    const ip = address.toLowerCase();
    return ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || /^fe[89ab]/.test(ip);
  }
  return true;
}

async function validGrant(input: AuthorizeRequest, task: TaskRow) {
  if (!input.grantRef) return null;
  const [grant] = await sql<GrantRow>(`
    select id,action_class,scope_hash
    from approval_grants
    where id=$1 and tenant_id=$2 and task_id=$3
      and revoked_at is null
      and (expires_at is null or expires_at > now())
    limit 1
  `, [input.grantRef,input.tenantId,input.taskId]);
  if (!grant || grant.action_class !== task.action_type) return null;
  if (input.capabilityHash && grant.scope_hash && input.capabilityHash !== grant.scope_hash) return null;
  return grant;
}

async function autonomyDenied(input: AuthorizeRequest, actionClass: string) {
  const [rule] = await sql<{ id: string }>(`
    select id from autonomy_rules
    where tenant_id=$1 and action_class=$2 and decision='DENY'
      and revoked_at is null
      and (expires_at is null or expires_at > now())
      and (destination is null or destination=$3)
      and (operation is null or operation=$4)
    limit 1
  `, [input.tenantId,actionClass,input.destination,input.operation]);
  return Boolean(rule);
}

async function persist(input: AuthorizeRequest, task: TaskRow | null, decision: Decision, reason: string) {
  const [row] = await sql<{ id: string }>(`
    insert into egress_decisions (
      tenant_id,task_id,destination,operation,action_class,decision,reason,capability_hash,
      method,path,protocol,resolved_ip,data_taint,request_meta,grant_ref,policy_version
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::inet,$13,$14::jsonb,$15,'sentinel-v2')
    returning id
  `, [
    input.tenantId,input.taskId,input.destination,input.operation,task?.action_type ?? "unknown",
    decision,reason,input.capabilityHash ?? null,input.method,input.path ?? null,input.protocol ?? null,
    input.resolvedIp,input.dataTaint ?? task?.data_taint ?? "clean",JSON.stringify(input.requestMeta ?? {}),
    input.grantRef ?? null
  ]);

  await sql(`
    insert into runtime_events (tenant_id,task_id,event_type,trust_zone,summary,metadata)
    values ($1,$2,'egress_decision','sentinel',$3,$4::jsonb)
  `, [
    input.tenantId,input.taskId,`${decision}: ${input.operation}`,
    JSON.stringify({ decisionId: row.id, destination: input.destination, reason, effect: input.effect })
  ]);
  return row.id;
}

async function decide(input: AuthorizeRequest) {
  if (!tenantId || input.tenantId !== tenantId) {
    return { decision: "DENY" as const, reason: "tenant_mismatch", task: null as TaskRow | null };
  }

  const [task] = await sql<TaskRow>(`
    select id,action_type,risk_class,status,data_taint
    from tasks where id=$1 and tenant_id=$2 limit 1
  `, [input.taskId,input.tenantId]);
  if (!task) return { decision: "DENY" as const, reason: "task_not_found", task: null };
  if (!["running","queued"].includes(task.status)) {
    return { decision: "DENY" as const, reason: "task_not_executable", task };
  }

  let url: URL;
  try { url = new URL(input.destination); }
  catch { return { decision: "DENY" as const, reason: "invalid_destination", task }; }

  if (url.protocol !== "https:" || (input.protocol && input.protocol !== "https")) {
    return { decision: "DENY" as const, reason: "https_required", task };
  }
  if (unsafeIp(input.resolvedIp)) {
    return { decision: "DENY" as const, reason: "private_or_reserved_ip", task };
  }
  if (await autonomyDenied(input, task.action_type ?? "unknown")) {
    return { decision: "DENY" as const, reason: "explicit_autonomy_deny", task };
  }

  const grant = await validGrant(input,task);
  const taint = input.dataTaint ?? task.data_taint;
  if (input.containsUserData && (taint === "sensitive" || taint === "credential") && !grant) {
    return { decision: "REVIEW" as const, reason: "sensitive_data_egress_requires_grant", task };
  }
  if (input.containsUserData && taint === "personal" && !grant) {
    return { decision: "REVIEW" as const, reason: "personal_data_to_external_destination_requires_review", task };
  }

  if (input.effect === "write" || input.effect === "commit" || task.risk_class === "R2" || task.risk_class === "R3") {
    if (!grant) return { decision: "REVIEW" as const, reason: "scoped_grant_required", task };
    return { decision: "ALLOW" as const, reason: "valid_scoped_grant", task };
  }

  if (input.effect === "control") {
    if (!controlHosts.has(url.hostname.toLowerCase())) {
      return { decision: "DENY" as const, reason: "control_plane_destination_not_allowlisted", task };
    }
    return { decision: "ALLOW" as const, reason: "allowlisted_control_plane_operation", task };
  }

  if (input.effect === "read" && ["GET","HEAD"].includes(input.method)) {
    return { decision: "ALLOW" as const, reason: "read_only_public_https", task };
  }

  return { decision: "DENY" as const, reason: "unsupported_effect_or_method", task };
}

const server = createServer(async (req,res) => {
  try {
    if (req.method === "GET" && req.url === "/health") return json(res,200,{ok:true,policy:"sentinel-v2"});
    if (!authorized(req)) return json(res,403,{error:"forbidden"});
    if (req.method !== "POST" || req.url !== "/v1/authorize") return json(res,404,{error:"not_found"});

    const input = request(await body(req));
    const result = await decide(input);
    const decisionId = await persist(input,result.task,result.decision,result.reason);
    return json(res,200,{decision:result.decision,reason:result.reason,decisionId});
  } catch (error) {
    const message = error instanceof Error ? error.message : "sentinel_error";
    return json(res,message === "request_too_large" ? 413 : 400,{error:message});
  }
});

if (!serviceToken) throw new Error("SENTINEL_SERVICE_TOKEN is required");
if (!tenantId) throw new Error("AGESOMA_TENANT_ID is required");
server.listen(port,"0.0.0.0",() => console.log(`AGESOMA Sentinel v2 listening on ${port}`));
