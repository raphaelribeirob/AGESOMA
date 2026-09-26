<p align="center">
  <img src="apps/web/public/agesoma-wordmark.jpeg" alt="AGESOMA" width="420" />
</p>

# AGESOMA

[![AGESOMA CI](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml/badge.svg)](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml)

**Personal executive assistant for delegated digital work.**

AGESOMA is being built around one simple idea: a useful assistant should not merely answer questions. It should remember relevant context, organize the work behind an outcome, execute what is authorized and return when a decision or completed result matters.

> Product principle: the user delegates the outcome; AGESOMA owns the coordination while the user retains authority.

## Product model

```text
User / desired outcome
        ↓
AGESOMA understands personal context
        ↓
AGESOMA plans and selects capabilities
        ↓
Authorized digital execution
        ↓
Policy + scoped user authority
        ↓
Completion verification
        ↓
AGESOMA reports what matters
        ↓
Memory learns from corrections and outcomes
```

## What the product is for

AGESOMA is intended to help with work that normally remains fragmented across tools and mental overhead:

- calendar and commitments;
- email and communication;
- research and decision preparation;
- documents and knowledge work;
- personal administration;
- recurring routines and monitoring;
- connected digital actions that can be safely delegated.

The canonical experience is one conversation. Internal models, agents, runtimes, routing and policy systems are implementation details.

## P0 thesis

The first product does not need dozens of integrations. It needs a few loops that work together reliably:

1. remember useful context;
2. understand calendar-related work;
3. understand communication-related work;
4. research, prepare and execute digital tasks with explicit authorization when needed.

The target interaction is not “chat with AI.” It is “give this to AGESOMA.”

## Technical architecture

| Layer | Responsibility |
|---|---|
| **Next.js + React + TypeScript** | User-facing conversation and authenticated API surface |
| **PostgreSQL + pgvector** | Operational truth, structured state, registry and vector context |
| **Graphiti + Neo4j** | Temporal context and memory experiments |
| **pg-boss** | Durable background jobs and execution coordination |
| **HERMES** | Isolated browser/API/file/computer execution |
| **Sentinel** | Independent policy and authorization boundary |
| **Work Cells** | Isolated execution environments |
| **Outcome verification** | Separates execution claims from evidence-backed completion |

HERMES, Sentinel and Work Cells are internal implementation concepts and must not appear in normal user-facing product copy.

## Current migration status

AGESOMA originated as an AI operating system for small businesses. The repository contains useful execution, authorization, durable-task and verification primitives from that architecture.

The product direction has changed to a personal executive assistant.

The current migration therefore follows this rule:

- retain reusable infrastructure;
- remove business-specific semantics from the product surface;
- migrate routing, memory and data models incrementally;
- do not present legacy `business.*` action names or company-oriented schema concepts to users.

See [`docs/PERSONAL_ASSISTANT_MIGRATION.md`](docs/PERSONAL_ASSISTANT_MIGRATION.md).

## Repository tour

- [`apps/web`](apps/web) — AGESOMA conversation and onboarding.
- [`apps/web/app/api/agesoma/route.ts`](apps/web/app/api/agesoma/route.ts) — conversational orchestration surface.
- [`packages/core/src/request-router.ts`](packages/core/src/request-router.ts) — request and capability routing.
- [`packages/core/src/agent-registry.ts`](packages/core/src/agent-registry.ts) — internal capability registry during migration.
- [`packages/core/src/sentinel.ts`](packages/core/src/sentinel.ts) — authorization logic.
- [`packages/core/src/outcomes.ts`](packages/core/src/outcomes.ts) — completion/outcome verification model.
- [`services/worker`](services/worker) — durable coordination and execution adapter.
- [`deploy/production`](deploy/production) — production-oriented execution and isolation configuration.
- [`docs`](docs) — product, architecture, safety and release documentation.

## Current implementation status

The repository is **pre-production**. The conversation shell, routing, authorization, durable job dispatch, database state and execution adapters already exist, but the personal-assistant migration is incomplete.

The remaining work is primarily:

- personal-context schema and memory semantics;
- personal capability routing instead of business domains;
- calendar/email connector contracts;
- user-controlled memory inspection and forgetting;
- end-to-end execution verification;
- production credential isolation and tenant/user binding.

## Product doctrine

**One assistant outside. Many capabilities inside. User authority always.**

---

**AGESOMA — Your life, handled.**
