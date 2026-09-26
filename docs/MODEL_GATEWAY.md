# AGESOMA Model Gateway

## Purpose

HERMES is treated as an untrusted persistent runtime. It must be able to call a model without receiving the real OpenAI, Anthropic or Nous credential.

The Model Gateway is a per-tenant network boundary for model inference.

```text
HERMES
  |
  | opaque per-tenant token
  | internal HTTP only
  v
Model Gateway
  |
  | real provider key
  | fixed provider host
  v
OpenAI / Anthropic / Nous
```

HERMES has no direct internet network and no provider credential that works outside its own internal Model Gateway.

## Why not Hermes iron-proxy alone

Hermes includes an egress/iron-proxy feature for Docker terminal sandboxes. That is useful defense for nested sandbox processes, but its documented threat model does not rewrite in-process LLM calls made by the Hermes host process.

AGESOMA therefore keeps the model credential boundary outside HERMES itself.

## Runtime configuration

HERMES receives only an opaque `MODEL_GATEWAY_TOKEN` through the standard provider-key variables:

```text
OPENAI_API_KEY=<opaque tenant token>
OPENAI_BASE_URL=http://model-gateway-<tenant>:8086/openai/v1

ANTHROPIC_API_KEY=<opaque tenant token>
ANTHROPIC_BASE_URL=http://model-gateway-<tenant>:8086/anthropic

NOUS_API_KEY=<opaque tenant token>
NOUS_INFERENCE_BASE_URL=http://model-gateway-<tenant>:8086/nous/v1
```

These base URL overrides are supported by current Hermes provider resolution. The opaque token is not a valid credential at any upstream provider.

## Gateway secrets

Only `model-gateway` receives:

- `MODEL_OPENAI_API_KEY`;
- `MODEL_ANTHROPIC_API_KEY`;
- `MODEL_NOUS_API_KEY`.

The Work Cell compose maps those from host-side provider secrets. The real values are never injected into HERMES.

## Fixed provider routes

The gateway is not a generic HTTP proxy.

Allowed provider hosts are hard-coded:

- `api.openai.com`;
- `api.anthropic.com`;
- `inference-api.nousresearch.com`.

Allowed surfaces are limited to inference/model discovery:

- chat completions;
- Responses API;
- Anthropic Messages;
- model listing;
- embeddings where supported.

Credential-management, file upload, batches, fine-tuning, arbitrary URLs and account-management routes are denied.

## Streaming

Requests and responses are streamed through the gateway. The request body is not logged.

Audit logs contain only:

- provider;
- HTTP method;
- route path;
- status;
- duration.

The gateway strips the opaque runtime credential and injects the real upstream credential at the boundary.

## Network isolation

The per-tenant topology is:

```text
tenant_cell (internal)
  - HERMES
  - Browser Broker
  - Model Gateway

model_outbound
  - Model Gateway only
```

HERMES has no `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` or outbound bridge.

External web research remains brokered through Browser Broker. Consequential/provider actions remain behind Privsep + Egress Gateway + Sentinel.

## Token isolation

`MODEL_GATEWAY_TOKEN` is HMAC-derived per tenant during Work Cell provisioning.

A token copied from one Work Cell cannot authenticate to another tenant's Model Gateway.

The token can be exposed to a fully compromised HERMES runtime without exposing the real provider credentials. It is useful only on that tenant's internal Docker network.

## Provider compatibility

AGESOMA currently preserves the provider variables already supported by the Work Cell:

- OpenAI API;
- native Anthropic;
- Nous API-key inference.

Adding another provider requires all of:

1. a fixed upstream host;
2. a narrow inference-path allowlist;
3. a gateway-side real-secret variable;
4. an opaque runtime variable/base-URL mapping;
5. regression tests and CI gates.

No generic custom-endpoint passthrough is permitted.
