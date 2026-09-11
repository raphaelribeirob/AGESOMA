# AGESOMA

Service-as-a-Software for SMEs: customers buy completed work and verified business outcomes, not agent tooling.

Public communication is governed by `docs/COMMUNICATION_SYSTEM.md`. Technical vocabulary below is internal architecture language, not the customer-facing value proposition.

## Product operating model

AGESOMA adapts the persistent-agent model to a small business:

`observe -> find opportunity -> propose work -> approve when needed -> work in background -> deliver result -> verify value -> calculate ROI -> learn -> observe again`

The owner-facing product is organized around seven surfaces:

`Início | Pedir | Oportunidades | Trabalhos | Resultados | Aprovações | Conexões`

Conversation is the easiest way to delegate work, but results should become business views with evidence, cost, ROI and next steps rather than remaining trapped in chat.

P0 principle: **the workflow is the product, Sentinel is the authority, Hermes is the executor, and the verified outcome is the unit of value.**

## P0 stack

- Next.js + React + TypeScript: owner-facing product shell.
- PostgreSQL + pgvector: operational truth + semantic memory.
- pg-boss: durable P0 jobs using the same Postgres database.
- Sentinel: independent policy gate. The reasoning/execution agent never grants its own permissions.
- Margin Governor: rejects or escalates work that is not economically rational.
- Hermes: isolated execution plane for APIs, messaging, browser and computer-use.
- Outcome Ledger: economic source of truth for every workflow.
- PostHog: product/outcome analytics.
- Sentry/C-Trace: reliability and agent execution traces.

## Repository layout

```text
apps/web            Owner shell and API endpoints
packages/core       Sentinel, Margin Governor, outcome contracts
packages/db         Postgres client + migrations
services/worker     pg-boss durable execution worker + Hermes adapter
docs                Architecture and release gates
```

## Start locally

1. Copy `.env.example` to `.env` and set values.
2. Start Postgres: `docker compose up -d postgres`.
3. Install packages: `npm install`.
4. Apply `packages/db/migrations/0001_init.sql` to the database.
5. Run the web app: `npm run dev`.
6. Run the worker separately: `npm run worker`.

Hermes is intentionally **not** embedded in the web process. Run it as an isolated service/container and point `HERMES_BASE_URL` at it.

## P0 release gate

Do not expand to Studio/Builder/Temporal/Computer Use at scale until this closes end-to-end:

`lead forgotten -> opportunity -> approval/policy -> execution -> response -> meeting/sale -> attributed revenue -> execution cost -> net value -> learning record`

Required proof: one paying customer, one production workflow, measured outcome, recorded attribution, positive or explainable unit economics.
