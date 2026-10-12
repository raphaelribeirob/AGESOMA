<p align="center">
  <img src="apps/web/public/agesoma-wordmark.jpeg" alt="AGESOMA" width="420" />
</p>

# AGESOMA

[![AGESOMA CI](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml/badge.svg)](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml)

**AI-native business operations. Services on the outside; software on the inside.**

AGESOMA is being built to take responsibility for repeatable, measurable business operations. The customer contracts for an outcome and a service-level commitment — not a seat, prompt, chatbot or agent dashboard.

> The client delegates a bounded business process. AGESOMA coordinates its execution, obtains scoped authorization for consequential actions, verifies evidence and reports results. The client retains final authority where required.

## The initial service: freight audit and financial recovery

The initial wedge is freight overcharge and contract-leakage audit for Brazilian companies with recurring logistics expenditure.

1. Import freight contracts, rate tables, CT-e documents and invoices from approved sources.
2. Reconcile the billed charge against the contractual charge and explain each variance.
3. Produce an evidence-backed recovery case and request client approval before any external claim.
4. Submit only authorized claims through an explicitly integrated channel; track response and recovery.
5. Charge a contracted success fee **only on verified recovered cash**; optionally sell ongoing leakage prevention.

The first implementation is a **read-only recovery assessment and tests**, not a complete live recovery service. Verified source ingestion, settlement reconciliation, enterprise onboarding, contracts, claims dispatch and SLA reporting remain to be built.

See [Operations thesis](docs/OPERATIONS_THESIS.md) and [Operations release gate](docs/OPERATIONS_RELEASE_GATE.md).

Business Understanding Engine P0: [ontology, source-traceable facts and tenant-scoped context](docs/BUSINESS_UNDERSTANDING_ENGINE.md). This is a staged implementation, not a live autonomous service.

## Business model

- **Phase 1 — Recovery:** success fee for objectively verified, client-approved recoveries.
- **Phase 2 — Prevention:** contracted monthly operations service preventing repeat leakage.
- **Phase 3 — Finance operations:** execute bounded accounts-payable, reconciliation and collection work with SLAs.
- **Phase 4 — Adjacent operations:** contracts, procurement and compliance only after profitable repeatability.

The client-facing promise is a managed outcome, not an AI agent subscription. A human accountable operator remains available for exceptions. Market size or a trillion-dollar outcome is a hypothesis, not a product guarantee.

## Canonical operational flow

    Client contract + bounded service scope
                    |
    Trusted data import and reconciliation
                    |
    Documented discrepancy and evidence
                    |
    Independent validation + scoped client approval
                    |
    Authorized execution (where integrated)
                    |
    Bank / client settlement reconciliation
                    |
    Verified outcome, SLA and unit-economics report

**No inferred authority, no automated payments, no success fees based only on estimates.**

## Architecture retained from the existing repository

| Layer | Function |
|---|---|
| Next.js / React / TypeScript | Client experience and authenticated API surface |
| PostgreSQL + pgvector | Tenant-isolated business state and context |
| Graphiti / Neo4j | Optional temporal memory experiments |
| pg-boss | Durable job dispatch and recovery |
| HERMES, persistent workers, Work Cells | Isolated execution infrastructure |
| Sentinel | Independent authorization and policy boundary |
| Model Gateway | Scoped model access and metering |
| Outcome verification | Evidence-backed business outcomes |
| Operations recovery | Pure freight recovery assessment; no external actions |

Internal infrastructure names are not customer-facing product features.

## Personal-assistant compatibility

The previous migration toward an AGESOMA personal executive assistant is preserved as **historical code and a potential separate product surface**. It is **not the primary AGESOMA market positioning**. Do not erase the existing UI or worker safety mechanisms during this pivot.

The current app still includes personal-first interfaces and routing. Product/architecture positioning is updated first; B2B workflow wiring and a customer-ready UI are gated work, not completed claims. See [migration history](docs/PERSONAL_ASSISTANT_MIGRATION.md).

## Repository map

- [docs/PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md) — canonical product direction
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — B2B operating and security design
- [docs/OPERATIONS_THESIS.md](docs/OPERATIONS_THESIS.md) — ICP, economics, phased execution
- [docs/OPERATIONS_RELEASE_GATE.md](docs/OPERATIONS_RELEASE_GATE.md) — verifiable go/no-go criteria
- [packages/core/src/operations-recovery.ts](packages/core/src/operations-recovery.ts) — fail-closed recovery evaluation
- [packages/core/test/operations-recovery.test.mjs](packages/core/test/operations-recovery.test.mjs) — recovery eligibility tests

## Readiness

**Pre-production.** The repository contains reusable routing, authorization, worker and memory primitives, but does **not** yet operate a client's finance or logistics department end to end. Release requires tenant isolation, evidence provenance, audited permissions, real document integrations, settlement verification, service contracts, live-pilot metrics and green CI.

ProofTree verification: [independent, risk-adaptive evidence gate](docs/PROOFTREE.md). Domain recovery gating is staged; live verifier scheduling remains a release prerequisite.

**AGESOMA — Business outcomes, handled.**
