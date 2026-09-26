# AGESOMA Personal Assistant Migration

## Objective

Transform AGESOMA from SME operating intelligence into a personal executive assistant without discarding the reliable execution, authorization and durable-work primitives already present in the repository.

## Phase 0 — Product surface

Status: implemented on `main`.

- personal-assistant positioning;
- personal onboarding;
- personal-first conversation copy;
- product doctrine and architecture rewrite;
- CI no longer requires business-specific specialist names.

## Phase 1 — Personal capability routing

Replace business-oriented routing semantics with capability-oriented semantics.

Target domains:

- calendar;
- communication;
- research;
- documents;
- personal_admin;
- finance_admin;
- general.

Compatibility aliases may remain temporarily, but user-facing behavior must never depend on business terminology.

## Phase 2 — Personal Context

Status: foundation implemented in `0011_personal_assistant_foundation.sql`.

A first-class personal context model now persists onboarding/user context with provenance, correction and forgetting. Context is passed to planning as descriptive information only and never expands authorization.

Minimum objects:

- person/user;
- relationship;
- project;
- commitment;
- preference;
- memory fact;
- memory source;
- correction;
- task;
- approval;
- connected account.

Requirements:

- every learned fact has provenance;
- memory can be corrected;
- memory can be forgotten;
- memory never expands authorization.

## Phase 3 — Core integrations

Status: connection registry + user control surface implemented; provider OAuth callbacks and connector-specific execution remain.

Prioritize connectors that complete high-frequency assistant loops:

1. calendar;
2. email;
3. contacts;
4. files;
5. web research.

Messaging and finance actions come later because they have higher consequence and permission complexity.

## Phase 4 — Proactivity

Status: bounded watcher runtime + Attention Engine implemented with explicit opt-in, novelty/importance/urgency scoring, digest/notify/approval modes, quiet hours, daily interruption cap and revocation.

Add recurring observation only after the reactive loops are reliable.

Examples:

- tomorrow briefing;
- meeting preparation;
- unanswered important messages;
- schedule conflicts;
- recurring administrative tasks.

Success metric: fewer things the user must remember, not more notifications.

## Phase 5 — Execution maturity

Before production:

- scoped credentials;
- per-user execution isolation;
- idempotent external actions;
- evidence-backed completion;
- audit trail;
- revocable grants;
- failure recovery;
- connector-specific permission boundaries;
- Authd surrogate-credential boundary;
- Sentinel v3 reconstructing task scope and concrete requests;
- forced Egress Gateway as the only privileged Work Cell internet path;
- control-plane Trust Store so Work Cell services receive no database credential;
- caller-scoped Authd and Trust Store credentials;
- per-tenant Model Gateway with opaque runtime tokens and no direct HERMES internet egress;
- brokered browser access with CDP hidden from the runtime;
- persistent personal runtime contract;
- first-class Goals and Activity surfaces;
- concurrent delegation from the main conversation.

## Technical debt retained temporarily

The following legacy concepts may remain internally during migration:

- `business.*` action classes;
- company/team-oriented database tables;
- business-oriented specialist templates;
- tenant naming inherited from the B2B architecture.

They are compatibility debt, not canonical product concepts. New user-facing features must not depend on them.

## Exit criterion

The migration is complete when a new user can delegate a personal task involving context + a connected service + execution without seeing or configuring business-oriented concepts anywhere in the flow.


## Deployment gate for Phase 2–4

The repository does not currently run SQL migrations automatically during the web deployment.

Before deploying code that reads `personal_context_entries`, `connected_services`, `proactivity_preferences` or `proactive_interruptions`, apply:

```text
packages/db/migrations/0011_personal_assistant_foundation.sql
packages/db/migrations/0012_muse_parity_runtime_attention.sql
packages/db/migrations/0013_api_tool_builder.sql
packages/db/migrations/0014_muse_trust_boundary.sql
packages/db/migrations/0015_forced_egress_and_authd_acl.sql
```

to the production database.

The application build can succeed without that schema being present, so database migration is a release prerequisite rather than a build-time guarantee.
