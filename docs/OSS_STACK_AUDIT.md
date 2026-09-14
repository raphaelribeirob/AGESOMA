# AGESOMA OSS Stack Audit

Status: canonical infrastructure audit for the AGESOMA AI Operating System.

## Principle

AGESOMA should own the control plane and use open-source infrastructure for commodity layers.

The target is not "assemble many open-source products." The target is:

**proprietary AGESOMA semantics + replaceable OSS infrastructure.**

The proprietary surface should remain concentrated in:

- Company Ontology and entity resolution;
- decision and prioritization logic;
- Sentinel authority semantics and approval boundaries;
- human + agent coordination;
- outcome verification and economic attribution;
- learning loop and business-specific adaptation;
- owner-facing consumerized UX.

Everything else should be treated as replaceable infrastructure where practical.

## Current audit

| Capability | Current AGESOMA | OSS direction | Decision |
|---|---|---|---|
| Owner UI | Next.js + React + TypeScript | same | KEEP |
| Operational truth | PostgreSQL + pgvector | same | KEEP |
| Durable jobs | pg-boss | same | KEEP |
| Company Brain | Graphiti | same | KEEP |
| Graph persistence | Neo4j Community | same initially | KEEP |
| Model access | provider-specific defaults existed inside Graphiti | OpenAI-compatible abstraction; self-hosted or hosted models behind adapter | FIXED WAVE 1 |
| Execution substrate | HERMES isolated Work Cells | HERMES behind AGESOMA adapter | KEEP |
| Authorization | AGESOMA Sentinel semantics | keep proprietary semantics; OPA is optional policy execution substrate | KEEP CORE / DEFER OPA |
| Tenant isolation | PostgreSQL RLS + per-tenant Work Cells | same | KEEP |
| Credential handling | isolated credential broker, provider secrets outside HERMES | OpenBao when rotation/provider count justifies a vault | KEEP P0 / DEFER OPENBAO |
| Integrations | direct adapters / HERMES | Activepieces CE only behind an adapter when connector repetition justifies it | DEFER |
| Browser/computer work | HERMES | retain; evaluate additional OSS browser runtimes only for missing capabilities | KEEP |
| Strong sandboxing | Docker/network isolation | Firecracker/containerd only when risk or density proves need | DEFER |
| Authentication | internal bearer + actor header + membership lookup | Better Auth sessions + organizations mapped to AGESOMA tenants | NEXT P0 |
| Documents | no canonical ingestion service | Docling adapter when document ingestion enters validated workflows | DEFER UNTIL USE CASE |
| Observability | partial PostHog/Sentry placeholders | OpenTelemetry foundation; PostHog self-hosted; GlitchTip/Prometheus/Langfuse only as needed | NEXT, STAGED |
| Local model serving | none required | vLLM/Ollama/llama.cpp behind same endpoint contract | READY, NOT REQUIRED |

## Wave 1 — remove model-vendor coupling

Implemented in `feat/oss-foundation-wave1`:

1. Company Brain constructs Graphiti with explicit LLM, embedding and reranking clients.
2. The Brain accepts a configurable OpenAI-compatible endpoint instead of implicitly creating direct OpenAI clients.
3. Embedding endpoint, model and vector dimension are configuration values.
4. Production and local Compose no longer require `OPENAI_API_KEY` when another compatible endpoint is selected.
5. Direct OpenAI remains an optional compatibility fallback, not part of AGESOMA's architecture.

This means a future vLLM, Ollama, llama.cpp or compatible gateway can replace a hosted provider without changing the Company Brain contract.

## Wave 2 — real authentication and tenant resolution

This is the largest current public-product gap.

Today AGESOMA has strong downstream tenant primitives — memberships, RLS and tenant-scoped APIs — but the controlled-alpha edge still relies on an internal bearer token, an actor header and a configured default tenant.

Target:

```text
user session
   ↓
Better Auth
   ↓
organization membership
   ↓
AGESOMA tenant_id + actor_id
   ↓
PostgreSQL RLS
```

Rules:

- no public request may choose an arbitrary `tenant_id` without membership resolution;
- no public client may self-assert `x-agesoma-actor-id`;
- `AGESOMA_DEFAULT_TENANT_ID` remains alpha/development-only;
- service-to-service tokens stay separate from owner authentication;
- Better Auth is an identity/session adapter, not the source of AGESOMA business authority.

## Wave 3 — AGESOMA Company Ontology

Graphiti is infrastructure. It is not the moat.

The next proprietary layer should normalize provider events into canonical entities such as:

```text
Company
├── Person
├── Customer / Account
├── Product / Service
├── Goal
├── Process
├── Work / Task
├── Decision
├── Conversation
├── Transaction
├── Evidence
└── Outcome
```

Relations must be temporal, source-backed and tenant-scoped. Provider-specific identifiers should map to canonical AGESOMA entities before becoming durable business memory.

## Wave 4 — connectors by evidence

Do not install a large integration platform merely to increase connector count.

Add a connector when a validated workflow needs it. Prefer, in order:

1. official provider API/webhook;
2. small AGESOMA adapter;
3. Activepieces CE behind an AGESOMA integration adapter when connector repetition makes direct adapters uneconomic;
4. HERMES browser/computer execution only where an API path is unavailable or insufficient.

External SaaS APIs such as WhatsApp, Gmail, Stripe or Meta Ads remain proprietary external boundaries even if AGESOMA's connector code is open-source.

## Wave 5 — security infrastructure only when justified

### OPA

OPA may evaluate declarative policies later, but it must not replace Sentinel semantics. The meaning of risk, owner authority, scoped grants, reversibility and business commitments belongs to AGESOMA.

### OpenBao

Current design already keeps provider credentials outside HERMES. Add OpenBao when AGESOMA needs centralized rotation, dynamic credentials, multiple secret backends or a larger provider surface. Installing a vault before that increases operational burden without changing product value.

### Firecracker

Current Work Cells use tenant-separated Docker networks and namespaces. Firecracker becomes justified when hostile-code isolation, customer compliance or high-density multi-tenancy requires a stronger boundary. It is not a P0 dependency.

## Wave 6 — observability

Use OpenTelemetry as the neutral instrumentation layer. Add sinks according to the signal required:

- PostHog: product behavior;
- Prometheus: operational metrics;
- GlitchTip: error tracking;
- Langfuse: LLM traces/evals when model behavior becomes a material reliability surface.

Avoid coupling core code to a single observability vendor.

## License policy

For AGESOMA core infrastructure:

- prefer OSI-approved permissive licenses where possible;
- isolate copyleft components behind service boundaries when intentionally selected;
- do not call source-available software "open source" in architecture decisions;
- keep a dependency/license inventory before public commercialization.

## Anti-Frankenstack rule

A component is added only if at least one condition is true:

1. it removes a material proprietary vendor dependency;
2. it closes a current security/reliability gap;
3. it is required by a validated customer workflow;
4. it materially reduces engineering cost versus a small adapter;
5. scale measurements prove the current component inadequate.

Otherwise it remains deferred.

## Current priority order

1. Provider-neutral Company Brain — **implemented in Wave 1**.
2. Better Auth + authenticated tenant resolution — **next**.
3. AGESOMA Company Ontology + entity resolution — **next proprietary moat**.
4. First provider-backed event connectors — **only against validated workflows**.
5. OpenTelemetry baseline — **before broader production scale**.
6. OPA/OpenBao/Activepieces/Firecracker/local GPU serving — **evidence-gated**.
