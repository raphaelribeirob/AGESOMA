<p align="center">
  <img src="apps/web/public/agesoma-wordmark.jpeg" alt="AGESOMA" width="420" />
</p>

# AGESOMA

[![AGESOMA CI](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml/badge.svg)](https://github.com/raphaelribeirob/AGESOMA/actions/workflows/ci.yml)

**AI-native business operations platform for small and medium-sized businesses.**

AGESOMA is designed to act as an operating intelligence layer for a company: it understands business context, prioritizes work, coordinates human and digital specialists, routes approved actions to an isolated execution layer, and reports meaningful outcomes through a single conversational experience.

> Product principle: AI should not only recommend what a business should do — it should help coordinate and execute the work while preserving human authority.

## 30-second overview

| | |
|---|---|
| **Role** | AI Product Lead & Agentic Systems Designer |
| **Focus** | Product strategy, agent architecture, workflow design, UX direction, orchestration and AI safety |
| **Product** | AI business operations / agentic SaaS |
| **Primary users** | Owners and operators of small and medium-sized businesses |
| **Stage** | Active prototype / pre-production |
| **Core stack** | Next.js, React, TypeScript, PostgreSQL, pgvector, Graphiti, Neo4j, pg-boss, HERMES |
| **CI** | Typecheck, behavioral test, architecture invariants, production-topology validation and web build |

## The problem

Small businesses often operate across disconnected tools, inboxes, spreadsheets, CRM systems and informal processes. Traditional software gives the owner more dashboards to manage; general-purpose AI can provide advice but usually lacks persistent business state, scoped authority, execution controls and result verification.

AGESOMA explores a different model: one business intelligence surface that can understand the company, decide what requires attention, delegate work and involve the owner only when judgment or authorization is required.

## My role

As **AI Product Lead & Agentic Systems Designer**, I led the product definition and system direction across:

- AI product strategy and scope;
- multi-agent and orchestration architecture;
- owner-facing conversational UX;
- business workflow and automation design;
- agent roles, routing and persistent business context;
- authorization, approval and execution boundaries;
- outcome verification and ROI-oriented product logic;
- technical stack selection and product/engineering coordination.

The project demonstrates product leadership across the full path from business problem to agentic system architecture rather than positioning my contribution as traditional software engineering alone.

## Product model

AGESOMA presents **one intelligence to the owner** while coordinating specialized capabilities behind the scenes.

```text
Owner / business objective
        ↓
AGESOMA understands company state and priorities
        ↓
Jarvis-style orchestrator selects the next action
        ↓
Human employee or digital specialist owns the work
        ↓
HERMES executes approved digital actions
        ↓
Sentinel enforces authority and approval boundaries
        ↓
AGESOMA verifies the result and updates business memory
        ↓
Owner receives only the information or decision that matters
```

## Key product decisions

### 1. Single-agent experience, multi-agent architecture
The customer interacts with one AGESOMA intelligence instead of managing a marketplace of bots. Specialist agents for sales, marketing, customer service, finance, operations and research remain implementation details.

### 2. Persistent company context
Business state, goals, work history, roles, approvals and outcomes are treated as persistent product data rather than temporary prompt context.

### 3. Execution is separated from authority
HERMES can execute digital work, but it is not allowed to define its own permissions. Consequential actions are governed by AGESOMA/Sentinel and scoped owner authority.

### 4. Outcomes matter more than task completion
The architecture distinguishes “work was performed” from “a business result was verified,” allowing the product to evolve toward auditable ROI and economic attribution.

### 5. Zero-learning-curve UX
The primary experience is conversational. Technical concepts such as models, prompts, work cells, routing and orchestration should remain invisible to the business owner.

## Technical architecture

| Layer | Responsibility |
|---|---|
| **Next.js + React + TypeScript** | Owner-facing conversational product and authenticated API surface |
| **PostgreSQL + pgvector** | Operational truth, structured business state, agent registry and vector context |
| **Graphiti + Neo4j** | Temporal Company Brain context |
| **pg-boss** | Durable background jobs and execution coordination |
| **HERMES** | Isolated browser/API/file/computer execution |
| **Sentinel** | Independent policy and authorization boundary |
| **Work Cells** | Tenant-scoped execution environments |
| **Outcome verification** | Separates execution claims from provider-backed business evidence |

**Internal vocabulary:** RiverThree is R3’s product/design contract, HERMES is the execution substrate, Sentinel is the authorization boundary, and Work Cells are tenant-scoped execution environments. These implementation concepts are intentionally hidden from the normal owner experience.

## Repository tour

For recruiters and technical reviewers, these are the fastest entry points:

- [`apps/web`](apps/web) — AGESOMA owner experience and API endpoints.
- [`apps/web/app/api/jarvis/route.ts`](apps/web/app/api/jarvis/route.ts) — conversational orchestration surface.
- [`packages/core/src/request-router.ts`](packages/core/src/request-router.ts) — request and capability routing.
- [`packages/core/src/agent-registry.ts`](packages/core/src/agent-registry.ts) — persistent specialist-agent model.
- [`packages/core/src/sentinel.ts`](packages/core/src/sentinel.ts) — policy and authorization logic.
- [`packages/core/src/outcomes.ts`](packages/core/src/outcomes.ts) — outcome verification model.
- [`packages/db/migrations`](packages/db/migrations) — operational data model.
- [`services/worker`](services/worker) — durable coordination and execution adapter.
- [`deploy/production`](deploy/production) — production-oriented execution and isolation configuration.

## Current implementation status

The repository contains working product and architecture components, including the conversational shell, routing, agent registry, authorization logic, durable job dispatch, database schema, onboarding surfaces and execution adapters.

The project is intentionally labeled **pre-production**. Remaining release gates include production tenant isolation, complete authentication-to-tenant binding, provider-backed credential isolation, real-source activation flows and repeated end-to-end verification of business outcomes. See [`docs/RELEASE_GATES.md`](docs/RELEASE_GATES.md).

This distinction is deliberate: the repository separates implemented architecture from claims that still require production evidence.

## Skills demonstrated

**AI Product Management · Agentic AI · AI Automation · Product Strategy · Workflow Automation · SaaS Product Design · UX/UI Direction · System Architecture · AI Safety · Business Process Automation**

## Documentation

- [`docs/README.md`](docs/README.md) — documentation map for reviewers.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system responsibilities and operating loop.
- [`docs/AGENT_ARCHITECTURE_AUDIT.md`](docs/AGENT_ARCHITECTURE_AUDIT.md) — agent-model audit.
- [`docs/company-brain.md`](docs/company-brain.md) — persistent company intelligence model.
- [`docs/company-ontology.md`](docs/company-ontology.md) — business ontology.
- [`docs/OWNER_MODEL.md`](docs/OWNER_MODEL.md) — owner authority and product model.
- [`docs/ZERO_LEARNING_CURVE.md`](docs/ZERO_LEARNING_CURVE.md) — UX doctrine.
- [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) — AGESOMA visual-system rules.
- [`docs/RELEASE_GATES.md`](docs/RELEASE_GATES.md) — what is implemented vs. still release-gated.
- [`docs/PRODUCT_DOCTRINE.md`](docs/PRODUCT_DOCTRINE.md) — original detailed product doctrine.

## Repository structure

```text
apps/web            Owner-facing AGESOMA product and authenticated APIs
packages/core       Routing, policies, agent registry and business logic
packages/db         Database migrations and operational state
services/worker     Durable coordination and execution integration
deploy/production   Deployment, Work Cells and execution boundaries
docs                Product, architecture, safety and release documentation
```

---

**AGESOMA** — one conversational operating intelligence for the business, backed by persistent context, specialized agents, scoped execution and human authority.