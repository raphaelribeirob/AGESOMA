# InstantWork

Service-as-a-Software for SMEs: customers buy completed work and verified business outcomes, not agent tooling.

Public communication is governed by `docs/COMMUNICATION_SYSTEM.md`. Technical vocabulary below is internal architecture language, not the customer-facing value proposition.

## Product operating model

InstantWork adapts the persistent-agent model to a small business:

`observe -> find opportunity -> propose work -> approve when needed -> work in background -> deliver result -> verify value -> calculate ROI -> learn -> observe again`

The owner-facing product is organized around seven surfaces:

`Início | Pedir | Oportunidades | Trabalhos | Resultados | Aprovações | Conexões`

Conversation is the easiest way to delegate work, but results should become business views with evidence, cost, ROI and next steps rather than remaining trapped in chat.

P0 principle: **the workflow is the product, Sentinel is the authority, Hermes is the executor, and the verified outcome is the unit of value.**

## Product functions

InstantWork is packaged around business jobs, not around a catalog of agents.

- **Observar** — read authorized business state, detect changes and surface opportunities.
- **Trabalhar** — prepare files, organize information and perform reversible operational work.
- **Agir** — send, update, schedule or execute external actions inside approved business rules.
- **Comprometer** — spend, change commercial terms or create material obligations only with explicit scoped authority.
- **Oportunidades** — proactively convert observed business state into proposed work.
- **Resultados** — turn completed work into a business artifact with evidence and next steps.
- **Modo ROI** — show value recovered, work cost and net return instead of agent activity metrics.
- **Conexões** — attach the systems the SME already uses; the owner should not need to understand integration architecture.

## Hermes-first execution strategy

InstantWork does not rebuild capabilities that Hermes already provides. Hermes is the operational engine for messaging channels, browser/computer-use, APIs, terminal-capable work and other supported tools. InstantWork remains responsible for tenant context, owner UX, policy/Sentinel, business approvals, outcome verification and ROI.

Canonical path:

`business/customer event -> Hermes gateway/executor -> InstantWork policy boundary -> work -> Outcome Ledger -> ROI`

For WhatsApp, the production path is the official **WhatsApp Business Cloud API** adapter included in Hermes. The deployment passes the `WHATSAPP_CLOUD_*` credentials directly to the Hermes gateway, keeps the webhook listener internal on port `8090`, and can place a Cloudflare Tunnel sidecar in front of it for the public HTTPS callback required by Meta. The unofficial Baileys/WhatsApp-Web bridge is not the default production path.

WhatsApp customer traffic stays allowlisted by default in the checked-in deployment. Before opening the number to arbitrary customers, configure a deliberately restricted `whatsapp_cloud` Hermes toolset; the stock Hermes WhatsApp platform toolset includes broad tools such as terminal access and is not an appropriate trust boundary for untrusted public customer messages.

The intended customer-service loop is:

`customer WhatsApp -> Hermes Cloud adapter -> safe customer-service session -> answer or escalate -> InstantWork records business action/outcome`

Owner-initiated consequential work continues through the InstantWork task/Sentinel path rather than granting customer chats unrestricted execution authority.

## CAL AI-inspired packaging

InstantWork uses a value-led onboarding pattern inspired by high-converting consumer apps, adapted for SMEs. It does not copy Cal AI branding or fitness content.

The onboarding route is `/onboarding` and follows this sequence:

1. Promise — state the dream outcome in the owner's language.
2. Magic demo — show a concrete business result before explaining features.
3. Goal — choose the result that matters most now.
4. Current state — understand how the company operates today.
5. Bottleneck — identify where work or money is being lost.
6. Autonomy — define how much work InstantWork may do without interruption.
7. Connections — select where InstantWork will eventually work.
8. Build — show that the operation is being personalized.
9. Plan reveal — present the first workflow as the owner's plan.
10. Offer — sell access to work and outcomes, not seats or agent counts.

The current launch packaging target is **InstantWork Core — US$29/month maximum base access price**. Checkout is intentionally not activated until billing and the first real workflow are production-ready. Usage/outcome economics may be tested later, but the customer-facing value unit remains work completed and verified outcome.

## P0 stack

- Next.js + React + TypeScript: owner-facing product shell.
- PostgreSQL + pgvector: operational truth + semantic memory.
- pg-boss: durable P0 jobs using the same Postgres database.
- Sentinel: independent policy gate. The reasoning/execution agent never grants its own permissions.
- Margin Governor: rejects or escalates work that is not economically rational.
- Hermes: isolated execution plane and messaging gateway for APIs, WhatsApp, browser and computer-use.
- Outcome Ledger: economic source of truth for every workflow.
- PostHog: product/outcome analytics.
- Sentry/C-Trace: reliability and agent execution traces.

## Persistent business loop

The production database includes persistent Goals, Watchers and Work Cells. A Goal defines the business outcome, a Watcher keeps observing an event/schedule/condition, and one Work Cell owns the tenant's runtime namespace. The UI should eventually create these directly from onboarding after authenticated tenant membership is wired.

## Repository layout

```text
apps/web            Owner shell, onboarding and API endpoints
packages/core       Sentinel, Margin Governor, outcome contracts
packages/db         Postgres client + migrations
services/worker     pg-boss durable execution worker + Hermes adapter
deploy/production   Hermes gateway, WhatsApp Cloud ingress and worker runtime
docs                Architecture and release gates
```

## Compatibility aliases

The public product name is InstantWork. Existing internal identifiers such as `@agesoma/*`, `agesoma_p0`, `agesoma.execute`, the GitHub repository name and legacy Vercel project identifiers remain temporary compatibility aliases until their migrations can be coordinated without breaking production data or deployments.

## Start locally

1. Copy `.env.example` to `.env` and set values.
2. Start Postgres: `docker compose up -d postgres`.
3. Install packages: `npm install`.
4. Apply the database migrations in `packages/db/migrations/` in deployment order.
5. Run the web app: `npm run dev`.
6. Run the worker separately: `npm run worker`.

Hermes is intentionally **not** embedded in the web process. Run it as an isolated service/container and point `HERMES_BASE_URL` at it.

## P0 release gate

Do not expand to Studio/Builder/Temporal/Computer Use at scale until this closes end-to-end:

`lead forgotten -> opportunity -> approval/policy -> execution -> response -> meeting/sale -> attributed revenue -> execution cost -> net value -> learning record`

Required proof: one paying customer, one production workflow, measured outcome, recorded attribution, positive or explainable unit economics.
