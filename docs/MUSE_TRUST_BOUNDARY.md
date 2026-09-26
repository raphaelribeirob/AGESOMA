# MUSE-style Trust Boundary

AGESOMA treats the personal runtime as untrusted and keeps network authority, credentials and database authority outside it.

## Current trust zones

```text
HERMES personal runtime
        |
        | narrow internal APIs only
        v
Browser Broker / Privsep Broker
        |
        | caller-scoped Authd + Egress credentials
        v
Authd ----------------------+
        |                   |
        | provider secret   |
        v                   v
                    Egress Gateway
                         |
                  Sentinel v3 decision
                         |
                     pinned HTTPS
                         |
                    external service

Control plane:
Trust Store -> Postgres
```

The Work Cell services do not receive `DATABASE_URL`.

## Forced egress

Privileged Work Cell services have no direct outbound network:

- Sentinel;
- Authd;
- Browser Broker;
- Privsep Broker.

Only the per-tenant Egress Gateway joins `privileged_outbound`.

The gateway:

1. authenticates the caller as `browser_broker`, `privsep_broker` or `control_worker`;
2. enforces an operation allowlist per caller;
3. validates HTTPS;
4. resolves all destination addresses and rejects private/reserved results;
5. derives semantic metadata from the concrete body where relevant;
6. asks Sentinel v3;
7. pins the approved IP into the TLS connection;
8. performs the request only after `ALLOW`.

This removes the previous "ask Sentinel, then fetch independently" bypass.

HERMES no longer has a direct internet proxy. Model inference is routed to an internal per-tenant Model Gateway, and external web access remains brokered.

## Sentinel v3

Sentinel no longer trusts a caller-supplied capability hash as authority.

For every request it obtains the canonical task context from the control-plane Trust Store and reconstructs:

```text
task payload
   ↓
buildCapabilityScope()
   ↓
stable serialization
   ↓
SHA-256
```

For consequential requests the supplied capability hash must equal this server-reconstructed hash.

Approval grants must:

- belong to the same tenant/task/action;
- be unrevoked;
- be unexpired;
- already be consumed by the task runner;
- carry the reconstructed `scope_hash`.

Autonomy rules are re-evaluated against the same reconstructed scope, including:

- destination;
- operation;
- resource pattern;
- amount cap.

A capped autonomy rule never matches a task that omits `amountCents`.

### Concrete request checks

Sentinel additionally compares provider requests with task scope.

WhatsApp:

- resource must be WhatsApp;
- approved send operation must match;
- actual recipient must equal approved destination;
- SHA-256 of the actual message must equal the approved message.

Paid media writes:

- account must equal approved destination;
- provider action must equal approved operation;
- actual parameters must remain inside the approved parameter set;
- budget operations must equal the approved `amountCents`.

Dynamic API reads remain GET/HEAD R0 only.

Browser control calls are limited to the allowlisted Steel control host. For scrape requests, the Egress Gateway extracts and resolves the target URL before Sentinel evaluates the request.

## Authd ACL

Authd accepts caller-specific credentials:

- `browser_broker`;
- `privsep_broker`.

Policy:

```text
browser_broker
  -> steel / browser.provider

privsep_broker
  -> whatsapp / whatsapp.send
  -> windsor / paid_media.read
  -> windsor / paid_media.write
```

The same rule is stored in `credential_handles.scopes`, so code policy and persistent policy must both allow the resolution.

Surrogates remain:

```text
cred://steel/default
cred://whatsapp/default
cred://windsor/default
```

Provider secrets exist only on Authd and are sent over the internal credential network to the Egress Gateway for the single approved request.

Windsor's query-string `api_key` is injected by the Egress Gateway only after Sentinel approval and is not included in the recorded destination.

## Control-plane Trust Store

Sentinel, Authd and Browser Broker no longer have database credentials.

A shared trusted control-plane service, `agesoma-trust-store`, owns the database connection and exposes narrow endpoints.

Each tenant/caller receives an HMAC-derived token:

- Sentinel;
- Authd;
- Browser Broker.

A caller can access only its own endpoint family.

The Trust Store performs:

- canonical task/grant/autonomy reads for Sentinel;
- egress decision/runtime-event persistence;
- credential-handle scope verification for Authd;
- browser session/profile/event persistence.

This moves database authority out of the per-tenant Work Cell.

## Browser Broker

The Browser Broker has:

- no database credential;
- no direct internet route;
- no Steel SDK credential in its environment.

It resolves only `cred://steel/default`, then asks the Egress Gateway to call Steel REST.

Initial operations remain:

- create persistent session;
- release session;
- read-only scrape.

Only `business.observe` and `business.work` tasks receive browser capability.

The runtime never receives Steel API keys, CDP/WebSocket URLs or viewer/debug URLs.

Returned page data is always labeled `external_untrusted`.

## Model Gateway

Real model-provider credentials are outside HERMES.

HERMES receives only a per-tenant opaque token and internal base URLs:

- OpenAI-compatible calls → `model-gateway-<tenant>/openai/v1`;
- Anthropic native calls → `model-gateway-<tenant>/anthropic`;
- Nous inference → `model-gateway-<tenant>/nous/v1`.

Only Model Gateway joins `model_outbound`.

The gateway:

- accepts the opaque tenant token in the provider's normal auth location;
- permits only fixed OpenAI, Anthropic and Nous inference hosts;
- permits only narrow inference/model-listing paths;
- replaces the opaque token with the real provider secret;
- streams requests/responses without logging prompt bodies.

HERMES has no direct `HTTP_PROXY`/internet path and no real OpenAI, Anthropic or Nous credential.

See `docs/MODEL_GATEWAY.md`.

## Dynamic API tools

`api.tool_read` no longer performs provider fetches directly from the control worker.

The control worker sends the read to the tenant Egress Gateway using its separate `control_worker` caller identity. Sentinel v3 decides immediately before the pinned external connection.

## Migrations

Apply in order:

```text
0011_personal_assistant_foundation.sql
0012_muse_parity_runtime_attention.sql
0013_api_tool_builder.sql
0014_muse_trust_boundary.sql
0015_forced_egress_and_authd_acl.sql
```

Then re-provision every Work Cell.

New control-plane configuration:

- `TRUST_STORE_MASTER_SECRET`;
- `EGRESS_CONTROL_TOKEN`.

Per-tenant Authd/Trust Store/egress caller tokens are derived during Work Cell provisioning.

User/provider connector secrets remain configured only for Authd. Model-provider secrets are configured only on Model Gateway.

## Remaining gaps

The P0 audit findings above are closed by this architecture, but this is still not a claim of identical Meta MUSE implementation.

Remaining work:

- interactive browser subagent with accessibility-tree interface;
- secure human takeover;
- OTP/magic-link/password-reset filtering;
- stronger prompt-injection classifiers outside the runtime;
- kernel/eBPF-grade taint propagation;
- replay-complete, tamper-evident runtime event log;
- first-class once/task/session/time-bounded capability UX.
