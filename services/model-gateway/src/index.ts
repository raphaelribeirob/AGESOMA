import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "node:http";
import { request as httpsRequest } from "node:https";

type Provider = "openai" | "anthropic" | "nous";

type ProviderConfig = {
  host: string;
  secret: string;
  paths: RegExp[];
};

const port = Number(process.env.PORT ?? 8086);
const gatewayToken = process.env.MODEL_GATEWAY_TOKEN?.trim() ?? "";
const maxRequestBytes = Number(process.env.MODEL_GATEWAY_MAX_REQUEST_BYTES ?? 16 * 1024 * 1024);

const providers: Record<Provider, ProviderConfig> = {
  openai: {
    host: "api.openai.com",
    secret: process.env.MODEL_OPENAI_API_KEY?.trim() ?? "",
    paths: [
      /^\/v1\/chat\/completions$/,
      /^\/v1\/responses$/,
      /^\/v1\/models(?:\/[^/]+)?$/,
      /^\/v1\/embeddings$/
    ]
  },
  anthropic: {
    host: "api.anthropic.com",
    secret: process.env.MODEL_ANTHROPIC_API_KEY?.trim() ?? "",
    paths: [
      /^\/v1\/messages$/,
      /^\/v1\/models(?:\/[^/]+)?$/
    ]
  },
  nous: {
    host: "inference-api.nousresearch.com",
    secret: process.env.MODEL_NOUS_API_KEY?.trim() ?? "",
    paths: [
      /^\/v1\/chat\/completions$/,
      /^\/v1\/responses$/,
      /^\/v1\/messages$/,
      /^\/v1\/models(?:\/[^/]+)?$/,
      /^\/v1\/embeddings$/
    ]
  }
};

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sameSecret(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function bearer(headers: IncomingHttpHeaders) {
  const authorization = headers.authorization;
  if (typeof authorization !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

function authenticate(req: IncomingMessage) {
  const authorization = bearer(req.headers);
  const anthropicKey = typeof req.headers["x-api-key"] === "string"
    ? req.headers["x-api-key"].trim()
    : null;
  return Boolean(
    (authorization && sameSecret(authorization, gatewayToken)) ||
    (anthropicKey && sameSecret(anthropicKey, gatewayToken))
  );
}

function parseRoute(rawUrl: string) {
  const url = new URL(rawUrl, "http://model-gateway.internal");
  const match = /^\/(openai|anthropic|nous)(\/.*)$/.exec(url.pathname);
  if (!match) throw new Error("unknown_provider_route");
  const provider = match[1] as Provider;
  const path = match[2];
  const config = providers[provider];
  if (!config.paths.some((pattern) => pattern.test(path))) throw new Error("provider_path_denied");
  return { provider, config, path: `${path}${url.search}` };
}

function requestHeaders(req: IncomingMessage, provider: Provider, secret: string) {
  const output: Record<string, string> = {};
  const contentType = req.headers["content-type"];
  const accept = req.headers.accept;
  const contentEncoding = req.headers["content-encoding"];
  const userAgent = req.headers["user-agent"];

  if (typeof contentType === "string") output["content-type"] = contentType;
  if (typeof accept === "string") output.accept = accept;
  if (typeof contentEncoding === "string") output["content-encoding"] = contentEncoding;
  if (typeof userAgent === "string") output["user-agent"] = userAgent;

  for (const [name, raw] of Object.entries(req.headers)) {
    const lower = name.toLowerCase();
    const value = Array.isArray(raw) ? raw.join(",") : raw;
    if (typeof value !== "string") continue;
    if (
      lower === "anthropic-version" ||
      lower === "anthropic-beta" ||
      lower === "openai-organization" ||
      lower === "openai-project" ||
      lower.startsWith("x-stainless-")
    ) {
      output[lower] = value;
    }
  }

  if (provider === "anthropic") {
    output["x-api-key"] = secret;
  } else {
    output.authorization = `Bearer ${secret}`;
  }

  return output;
}

function responseHeaders(headers: IncomingHttpHeaders) {
  const output: Record<string, string> = {};
  const exact = new Set([
    "content-type",
    "content-encoding",
    "cache-control",
    "retry-after",
    "content-length",
    "x-request-id",
    "request-id"
  ]);

  for (const [name, raw] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    const value = Array.isArray(raw) ? raw.join(",") : raw;
    if (typeof value !== "string") continue;
    if (
      exact.has(lower) ||
      lower.startsWith("x-ratelimit-") ||
      lower.startsWith("anthropic-ratelimit-")
    ) {
      output[lower] = value;
    }
  }
  return output;
}

function proxy(req: IncomingMessage, res: ServerResponse) {
  if (!authenticate(req)) {
    json(res, 403, { error: "forbidden" });
    return;
  }

  if (!req.url || !["GET", "POST", "HEAD"].includes(req.method ?? "")) {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  let route: ReturnType<typeof parseRoute>;
  try {
    route = parseRoute(req.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "route_error";
    json(res, message === "provider_path_denied" ? 403 : 404, { error: message });
    return;
  }

  if (!route.config.secret) {
    json(res, 503, { error: `${route.provider}_provider_not_configured` });
    return;
  }

  const declaredLength = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
    json(res, 413, { error: "request_too_large" });
    return;
  }

  const startedAt = Date.now();
  const upstream = httpsRequest({
    protocol: "https:",
    hostname: route.config.host,
    port: 443,
    method: req.method,
    path: route.path,
    headers: requestHeaders(req, route.provider, route.config.secret),
    servername: route.config.host
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode ?? 502, responseHeaders(upstreamRes.headers));
    upstreamRes.pipe(res);
    upstreamRes.on("end", () => {
      console.log(JSON.stringify({
        event: "model_gateway_request",
        provider: route.provider,
        method: req.method,
        path: route.path.split("?")[0],
        status: upstreamRes.statusCode ?? 502,
        durationMs: Date.now() - startedAt
      }));
    });
  });

  let bytes = 0;
  req.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > maxRequestBytes) {
      upstream.destroy(new Error("request_too_large"));
      if (!res.headersSent) json(res, 413, { error: "request_too_large" });
      else res.destroy();
      req.destroy();
      return;
    }
    upstream.write(chunk);
  });
  req.on("end", () => upstream.end());
  req.on("aborted", () => upstream.destroy());
  req.on("error", (error) => upstream.destroy(error));

  upstream.setTimeout(300_000, () => upstream.destroy(new Error("upstream_timeout")));
  upstream.on("error", (error) => {
    if (!res.headersSent) {
      json(res, error.message === "request_too_large" ? 413 : 502, {
        error: error.message === "request_too_large" ? error.message : "model_provider_unavailable"
      });
    } else {
      res.destroy(error);
    }
  });
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, {
      ok: true,
      mode: "fixed-provider-model-gateway",
      realProviderSecretsInRuntime: false,
      providers: {
        openai: Boolean(providers.openai.secret),
        anthropic: Boolean(providers.anthropic.secret),
        nous: Boolean(providers.nous.secret)
      }
    });
  }
  return proxy(req, res);
});

server.on("clientError", (_error, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

if (!gatewayToken) throw new Error("MODEL_GATEWAY_TOKEN is required");
if (!Number.isFinite(maxRequestBytes) || maxRequestBytes < 1024) {
  throw new Error("MODEL_GATEWAY_MAX_REQUEST_BYTES is invalid");
}

server.listen(port, "0.0.0.0", () => {
  console.log(`AGESOMA model gateway listening on ${port}`);
});
