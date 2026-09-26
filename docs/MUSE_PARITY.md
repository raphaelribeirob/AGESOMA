# MUSE Parity Direction

This document records the AGESOMA architecture decisions made after comparing the product with Meta's public MUSE architecture.

It is not a claim that AGESOMA reproduces Meta's proprietary implementation. It identifies the product patterns that are useful and implements them with AGESOMA's own infrastructure.

## Canonical runtime

AGESOMA uses one isolated persistent personal runtime per tenant.

The runtime persists:

- working filesystem/state through the tenant-scoped runtime volume;
- browser/runtime namespaces associated with the tenant;
- memory namespace references;
- connected-service handles.

Each task receives its own logical execution session inside that persistent runtime. This is intentional: persistence must not collapse concurrent tasks into one shared conversation state.

Memory and runtime state are context. Neither grants authority.

## First-class personal objects

The user-facing personal-assistant model now has three durable concepts:

### Memory

What AGESOMA knows as contextual information.

- provenance required;
- editable;
- forgettable;
- never authorization.

### Goals

What AGESOMA is persistently trying to help the user achieve.

- title and description;
- priority;
- progress;
- status;
- optional due date.

A goal does not authorize external action.

### Activity

What AGESOMA has received, started, completed, blocked or surfaced for attention.

Activity is an audit/product surface. It does not replace provider-backed outcome verification.

## Connected-service permissions

A connection and an action permission are separate.

Supported permission vocabulary:

- Gmail: read, search, draft, send, delete
- Google Calendar: read, create, update, delete
- Google Drive: read, create, update, delete
- Google Contacts: read
- Meta Ads: read, create_drafts, pause, activate, change_budget
- Google Ads: read, create_drafts, pause, activate, change_budget
- WhatsApp: read, send

Credentials remain outside the executor.

For write-enabled providers, the worker must verify the relevant permission before it reaches the Credential Broker. Scoped Sentinel approval remains independently required for consequential actions.

## Concurrent delegation

The main conversation must not be blocked by one request.

Several requests can be accepted in parallel. Each becomes an independent task/session inside the same persistent tenant runtime.

Consequential authority stays task-specific.

## Attention Engine

Proactive work produces an explicit attention decision based on:

- novelty;
- importance;
- urgency;
- whether user participation is required.

The resulting mode is one of:

- silent — nothing user-visible is needed;
- save — retain the result/activity only;
- digest — include it in a non-immediate summary surface;
- notify — surface it promptly;
- approval — user authority/input is required.

Quiet hours and interruption caps may downgrade an immediate notification to digest. They do not broaden or erase an approval requirement.

## Deployment order

This layer requires:

1. `0011_personal_assistant_foundation.sql`
2. `0012_muse_parity_runtime_attention.sql`
3. `0013_api_tool_builder.sql`
4. `0014_muse_trust_boundary.sql`
5. `0015_forced_egress_and_authd_acl.sql`
6. application deployment

The repository still does not automatically execute SQL migrations during the web build. Apply the listed migrations in order before deploying code that depends on these schemas.


## Dynamic tool creation

AGESOMA now supports a constrained self-tooling loop for public APIs:

```text
Discover → OpenAPI build → contract validation → user approval → R0 reuse → run audit
```

Only no-auth GET/HEAD tools can enter the generic dynamic runtime. Write operations remain blocked and must be implemented through explicit R2/R3 provider actions. This keeps self-tooling separate from authority.


## Trust boundary status

AGESOMA now treats the HERMES runtime as untrusted for user/provider authority.

Implemented:

- Sentinel v3 reconstructing canonical task scope and validating concrete requests;
- a forced per-tenant Egress Gateway as the only privileged Work Cell outbound path;
- caller-scoped Authd surrogate credentials;
- a control-plane Trust Store so Work Cell trust-boundary services receive no database credential;
- a per-tenant Model Gateway so HERMES receives no real model-provider credential and has no direct internet egress;
- provider execution in a Privsep Broker with request-scoped credentials;
- Steel behind a Browser Broker with CDP/viewer URLs hidden from the runtime;
- logical personal-data taint;
- runtime event logging for credential resolution, egress decisions and browser actions.

See `docs/MUSE_TRUST_BOUNDARY.md`.
