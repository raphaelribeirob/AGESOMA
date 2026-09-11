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

## Product functions

AGESOMA is packaged around business jobs, not around a catalog of agents.

- **Observar** — read authorized business state, detect changes and surface opportunities.
- **Trabalhar** — prepare files, organize information and perform reversible operational work.
- **Agir** — send, update, schedule or execute external actions inside approved business rules.
- **Comprometer** — spend, change commercial terms or create material obligations only with explicit scoped authority.
- **Oportunidades** — proactively convert observed business state into proposed work.
- **Resultados** — turn completed work into a business artifact with evidence and next steps.
- **Modo ROI** — show value recovered, work cost and net return instead of agent activity metrics.
- **Conexões** — attach the systems the SME already uses; the owner should not need to understand integration architecture.

## CAL AI-inspired packaging

AGESOMA uses a value-led onboarding pattern inspired by high-converting consumer apps, adapted for SMEs. It does not copy Cal AI branding or fitness content.

The onboarding route is `/onboarding` and follows this sequence:

1. Promise — state the dream outcome in the owner's language.
2. Magic demo — show a concrete business result before explaining features.
3. Goal — choose the result that matters most now.
4. Current state — understand how the company operates today.
5. Bottleneck — identify where work or money is being lost.
6. Autonomy — define how much work AGESOMA may do without interruption.
7. Connections — select where AGESOMA will eventually work.
8. Build — show that the operation is being personalized.
9. Plan reveal — present the first workflow as the owner's plan.
10. Offer — sell access to work and outcomes, not seats or agent counts.

The current launch packaging target is **AGESOMA Core — US$29/month maximum base access price**. Checkout is intentionally not activated until billing and the first real workflow are production-ready. Usage/outcome economics may be tested later, but the customer-facing value unit remains work completed and verified outcome.

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
apps/web            Owner shell, onboarding and API endpoints
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
