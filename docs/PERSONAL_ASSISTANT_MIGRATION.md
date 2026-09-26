# AGESOMA Personal Assistant Migration

## Objective

Transform AGESOMA from SME operating intelligence into a personal executive assistant without discarding the reliable execution, authorization and durable-work primitives already present in the repository.

## Phase 0 — Product surface

Status: in progress on `feat/personal-assistant-foundation`.

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

Introduce a first-class personal context model with provenance and user control.

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

Prioritize connectors that complete high-frequency assistant loops:

1. calendar;
2. email;
3. contacts;
4. files;
5. web research.

Messaging and finance actions come later because they have higher consequence and permission complexity.

## Phase 4 — Proactivity

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
- connector-specific permission boundaries.

## Technical debt retained temporarily

The following legacy concepts may remain internally during migration:

- `business.*` action classes;
- company/team-oriented database tables;
- business-oriented specialist templates;
- tenant naming inherited from the B2B architecture.

They are compatibility debt, not canonical product concepts. New user-facing features must not depend on them.

## Exit criterion

The migration is complete when a new user can delegate a personal task involving context + a connected service + execution without seeing or configuring business-oriented concepts anywhere in the flow.
