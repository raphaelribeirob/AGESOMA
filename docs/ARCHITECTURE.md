# AGESOMA Architecture — Operations First

## Purpose and status

AGESOMA is an **AI-native business operations provider**, not merely a personal assistant or chatbot. The current repository is pre-production; the personal UI and some personal-domain routing remain until an isolated, tested B2B service workflow is ready.

## Canonical service workflow

    Customer + signed scope / SLA
       -> tenant-isolated document intake
       -> deterministic rules + assisted extraction
       -> rate-table/contract reconciliation
       -> reviewer validation of evidence
       -> scoped customer approval (Sentinel)
       -> approved, idempotent claim submission
       -> response and cash-settlement verification
       -> verified recovery + contracted success-fee eligibility
       -> customer reporting and prevention learning

**Do not treat model output, an email claim, or an accounting entry as proof that cash was recovered.**

## System responsibilities

**AGESOMA control plane:** tenant/workspace, signed service scope, connectors and credential boundaries, work-order state, policies and approvals, SLA monitoring, case audit trail, case-to-document provenance.

**Execution plane:** typed task queues, isolated workers, authorized connector actions, retries, idempotency, deterministic comparisons, bounded model usage.

**Verification plane:** independent document validation, human exception reviews, confirmation of signed approval, bank/ERP settlement verification, client reporting, success-fee eligibility.

**Human operators:** disputed contracts, uncertain tariffs, exceptional claims, account management and accountable escalations.

## Existing reusable components

- PostgreSQL + pgvector: tenant state, cases, contextual retrieval.
- pg-boss: durable work and scheduling.
- HERMES / Work Cells: runtime isolation (existing implementation must be independently tested).
- Sentinel: permission and risk classification; external operations require scoped grants.
- Model Gateway / metering: per-tenant usage controls.
- Verified outcomes: event and calculation primitives; independent proof remains required.
- Operations recovery evaluator: pure and fail-closed, not a bank reconciliation integration.

The current routing system still uses business.* action aliases alongside personal runtime concepts. Do not remove those safeguards or re-enable consequential work by simply relabeling actions.

## Storage and data contracts to implement next

- service_contracts: tenant, scope, signed terms, rate basis, allowed actions and SLA;
- source_documents: immutable provenance, hash, verified status and permissions;
- freight_rate_tables: effective dates, carrier, lane, rule versions;
- recovery_cases: calculation, references, state, reviewer, approval;
- claims: customer-signed authorization and external provider status;
- settlements: matched receipt, verification provenance, amount;
- service_economics: cost-to-serve, recovered cash, invoiced revenue, paid revenue;
- audit_events: actor, action, correlation ID, policy decision and timestamps.

Use schema migrations and row-level security; never put private tenant documents or secrets into model prompts by default.

## Authority and security

1. Models do not attest authenticity; verification runs in trusted services.
2. Sentinel must authorize concrete operations, amounts, destination and contract scope.
3. Customer-signed service agreement is not unlimited standing permission.
4. No transfer, bank movement or binding commitment without explicit authorization.
5. Revocation, retry, audit trail and data deletion are release requirements.
6. No success fee on estimated savings; only independently confirmed recoveries.

## Product separation

Retain AGESOMA Personal modules without presenting them as the primary product. Reuse security/queue primitives but isolate client/workspace semantics, credentials, billing and audit events before exposing Operations to customers.

## Rollout

Documentation + pure recovery evaluation (this branch) -> import/verify sandbox -> tenant-isolated case service -> approval/claim adapter -> settlement reconciliation -> three paid pilots -> release assessment. **No production launch implied by repository changes.**
