# MUSE-style Trust Boundary

AGESOMA treats the personal runtime as untrusted.

The agent may plan, read untrusted content and request tools, but it is not the authority for credentials, egress or consequential actions.

## Runtime zones

```text
HERMES personal runtime
  |
  | browser-only narrow API
  v
Browser Broker --------------------+
  |                                |
  | surrogate                      | Sentinel decision
  v                                v
Authd <--- Privsep Broker ----> Sentinel v2
  |            |                    |
  | secrets    | provider request   | ALLOW / REVIEW / DENY
  +------------+--------------------+
               |
               v
        external services
```

### Untrusted runtime

HERMES receives:

- task objective and scoped authorization reference;
- personal context as context only;
- connected-service metadata without credentials;
- brokered browser endpoint;
- approved read-only tool definitions.

HERMES does not receive:

- WhatsApp access tokens;
- Windsor API keys;
- Steel API keys;
- credential-broker service token;
- Authd service token;
- Sentinel service token;
- Steel CDP/WebSocket URLs;
- Steel viewer/debug URLs.

Platform model-provider credentials remain a compatibility exception in the current HERMES container and should move behind a model gateway in a later phase.

## Authd

Authd is the only Work Cell service that receives user/provider secrets.

Other privileged services use surrogate handles:

```text
cred://steel/default
cred://whatsapp/default
cred://windsor/default
```

Authd resolves a surrogate only when:

- the tenant matches the per-tenant Work Cell;
- the task exists and is executable;
- the corresponding `credential_handles` row is active.

Credential resolution is logged without writing the real secret to the database or runtime event log.

## Privsep Broker

Provider connectors run outside HERMES.

The current Privsep Broker preserves the existing internal routes for:

- WhatsApp Cloud messages;
- Windsor Meta Ads reads/actions;
- Windsor Google Ads reads.

For every provider request the broker:

1. authenticates the control-worker call;
2. resolves the public destination IP;
3. asks Sentinel v2;
4. resolves the provider surrogate through Authd;
5. performs the provider request only after `ALLOW`.

Consequential requests carry the exact approval `grantRef` and `capabilityHash`.

## Sentinel v2

Sentinel v2 is the network authority for privileged egress.

Inputs include:

- tenant and task;
- destination;
- HTTP method and path;
- operation;
- resolved IP;
- effect: `read | control | write | commit`;
- data taint;
- grant reference;
- capability hash;
- request metadata.

Decisions are:

- `ALLOW`;
- `REVIEW`;
- `DENY`.

Sentinel denies:

- tenant mismatch;
- missing/non-executable task;
- non-HTTPS external destinations;
- private/reserved IP destinations;
- explicit autonomy DENY rules;
- unsupported effects/methods;
- control-plane POSTs to non-allowlisted control hosts.

Write/commit requests and R2/R3 tasks require a valid scoped approval or active ALLOW autonomy rule.

Approval grants must already have been consumed by the task runner and, when supplied, the capability hash must still match.

Every decision is written to `egress_decisions` and `runtime_events`.

## Data taint

Migration 0014 introduces task-level logical taint:

- `clean`;
- `public`;
- `personal`;
- `sensitive`;
- `credential`.

Tasks that receive personal context begin as `personal`.

Sentinel requires review when personal/sensitive/credential data is actually marked as leaving for an external destination without an appropriate grant.

This is a logical first implementation. Kernel/eBPF provenance tracking is not implemented.

## Browser Broker

Steel is behind a per-tenant Browser Broker.

The broker is the only browser component that receives the Steel credential, indirectly through Authd.

Supported initial operations:

- `POST /v1/scrape` — read-only rendered-page extraction;
- `POST /v1/sessions` — create a brokered persistent Steel session;
- `POST /v1/sessions/release` — release the session.

Rules:

- HTTPS target only;
- private/reserved DNS results rejected;
- Sentinel authorization before target/control egress;
- persistent Steel profile stored as `browser_profile_ref`;
- runtime receives no CDP/WebSocket URL;
- runtime receives no Steel viewer/debug URL;
- sessions are non-interactive by default;
- max 2 browser sessions per task;
- max 20 scrape operations per task;
- returned web content is labeled `external_untrusted`.

A future host-side browser subagent can add click/fill/snapshot operations without exposing raw CDP to HERMES.

## Dynamic API tools

Approved dynamic `api.tool_read` execution now also asks Sentinel v2 immediately before the provider fetch.

The task-level policy decision is not recorded as network egress. Only Sentinel v2 records actual egress decisions.

## Deployment

Apply migrations in order through:

```text
0011_personal_assistant_foundation.sql
0012_muse_parity_runtime_attention.sql
0013_api_tool_builder.sql
0014_muse_trust_boundary.sql
```

Then provision/re-provision each Work Cell.

Required new secrets/config:

- `SENTINEL_SERVICE_TOKEN`;
- `AUTHD_SERVICE_TOKEN`;
- `STEEL_API_KEY` for browser capability;
- existing provider secrets remain on Authd only.

## Remaining gap to Meta MUSE architecture

This phase closes the largest process-boundary gaps but is not a claim of identical implementation.

Still pending:

- model-provider keys behind a model gateway;
- host-side interactive browser subagent/accessibility-tree interface;
- secure authenticated human-takeover viewer route;
- OTP/magic-link/password-reset filtering in email connectors;
- kernel/eBPF taint propagation;
- replay-complete model/tool event logging;
- capability grants with one-time/session/time-bounded UX.
