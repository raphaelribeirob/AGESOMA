# AGESOMA

AGESOMA is one product with one job: act as the operating intelligence for a small or medium business.

Its purpose is simple: understand how the company works, decide what should happen next, coordinate people and a persistent digital workforce, verify what changed, and involve the owner only when a real decision or authorization is required.

## Canonical product definition

**AGESOMA = the JARVIS for SMEs.**

Customer-facing promise:

**Converse com a inteligência da sua empresa.**

The owner-facing product is not a dashboard, agent marketplace, workflow builder, CRM, HR system, project-management suite or collection of modes. Those capabilities may exist internally, but the customer experiences one intelligence: AGESOMA.

## Jarvis architecture

Jarvis is not one worker agent. Jarvis is the executive orchestrator presented to the owner as one intelligence.

Behind Jarvis, every tenant receives a persistent package of digital specialists:

- Sales;
- Marketing;
- Customer Service;
- Finance;
- Operations;
- Research.

The package may expand over time, but specialists do not become separate customer-facing products or chat surfaces.

**Single-agent experience, multi-agent architecture.**

A digital agent is a persistent identity with a role, purpose, skills, preferred resources, memory namespace and work history. It does not require a permanent server process. When an agent receives work, AGESOMA starts or selects an ephemeral execution runtime and supplies only the context and authority needed for that task.

**Agent identity is stateful. Execution is stateless and disposable.**

## Operating model

```text
Owner conversation
        ↓
AGESOMA / Jarvis understands the company
        ↓
Jarvis plans and selects the responsible specialist
        ↓
┌──────────────────────┬─────────────────────────┐
│ Human employee       │ Digital agent identity  │
│ receives named work  │ owns specialist work    │
└──────────────────────┴────────────┬────────────┘
                                    ↓
                           HERMES / Work Cell
                           executes digital work
                                    ↓
AGESOMA follows progress and verifies the result
        ↓
AGESOMA reports naturally in conversation
        ↓
Company Brain learns how this company works
```

The owner should not need to understand prompts, models, workflows, tools, orchestration, Company Brain, Sentinel, HERMES or Work Cells.

## What AGESOMA knows

AGESOMA maintains one operating picture of the business:

- objectives and priorities;
- employees, responsibilities and capacity;
- digital agents, roles and work history;
- work that is pending, active, blocked or completed;
- decisions that need the owner;
- systems and information the company already uses;
- evidence that a result actually happened;
- lessons learned from the company over time.

From that picture, AGESOMA continually answers four questions:

1. What needs to happen now?
2. Which specialist or person should own it?
3. What can be completed safely without interrupting the owner?
4. What does the owner actually need to know or decide?

## Human + digital workforce coordination

Human employees remain part of the operating system. AGESOMA can assign, prioritize, follow up and surface blockers for human work.

Digital agents are tenant-scoped persistent identities. HERMES is the replaceable execution substrate used by those agents when software must perform browser, API, messaging, file or computer work. A Work Cell is an ephemeral execution environment, not the agent itself.

The owner may conversationally ask to “contratar um agente” when that metaphor makes the capability easier to understand, but agent configuration, prompts, tools, runtime selection and orchestration never become a separate management interface.

Canonical authority rule:

**Jarvis coordinates. Digital agents own specialist work. HERMES executes. Sentinel governs. People collaborate. The owner retains authority.**

## Owner experience

The canonical owner experience is one Jarvis-style conversation.

There is no primary navigation such as `Início | Equipe | Trabalho | Resultados`.

The main screen contains only:

```text
AGESOMA

        Intelligence Orb

        conversation

“O que você quer saber ou fazer na sua empresa?”
```

Operational state appears only when it is relevant to the conversation: progress, approvals, results, recommendations and warnings are rendered inline rather than requiring the owner to open dashboards.

Examples:

- “Como está minha empresa hoje?”
- “Organize a equipe para fechar mais vendas esta semana.”
- “Quais especialistas estão trabalhando para mim?”
- “Resolva tudo que puder sem me interromper.”
- “O que precisa da minha decisão hoje?”
- “Como foi o resultado desta semana?”

A consequential action must be approvable from inside the same conversation. A verified result must be reportable in the same conversation. The owner should never need to navigate elsewhere to understand what AGESOMA is doing.

## Jarvis interaction states

AGESOMA exposes only human-readable states:

- listening;
- thinking;
- working;
- needs your approval;
- completed;
- blocked;
- reporting a verified result.

Internal infrastructure names must not leak into customer-facing copy.

## Safety and authority

AGESOMA owns tenant context, employee/work context, digital-agent identity, policy, approvals, business memory, result verification and economic attribution.

HERMES operates inside isolated Work Cells and receives only the authority needed for the active task. Consequential external actions remain subject to AGESOMA policy and scoped owner authority. A digital agent cannot expand its own permissions merely because it owns a task.

The core principle is unchanged:

**The executor is never its own authorization authority.**

## P0 stack

- Next.js + React + TypeScript: Jarvis conversation shell.
- Better Auth: authenticated owner identity and tenant resolution.
- PostgreSQL + pgvector: operational truth, Agent Registry and structured business state.
- Graphiti + Neo4j: temporal Company Brain context.
- pg-boss: durable background work.
- Sentinel: independent authorization boundary.
- HERMES: isolated digital execution plane.
- Work Cells: tenant-isolated ephemeral runtime, browser/files/memory/credential namespaces.
- Credential broker: keeps business credentials outside HERMES.
- Outcome verification: distinguishes work performed from results actually proven.
- OpenTelemetry-compatible observability.

The Jarvis surface is intentionally backend-agnostic. Open-source conversation/voice runtimes such as assistant-ui, AG-UI and Pipecat may be connected behind this interaction contract without changing the owner mental model.

## Repository layout

```text
apps/web            AGESOMA Jarvis experience and authenticated API endpoints
packages/core       decision, policy, routing, Agent Registry templates and business intelligence
packages/db         operational database and migrations
services/worker     durable coordination and HERMES adapter
deploy/production   control plane and isolated tenant Work Cells
docs                product doctrine, architecture and release gates
```

## Release test

A release is directionally correct only if an ordinary SME owner can operate AGESOMA from one conversation and naturally ask:

- what is happening in the company;
- what AGESOMA is working on;
- which specialist owns a job when that information is useful;
- what is blocked;
- what needs the owner's decision;
- what result was actually achieved;
- what AGESOMA recommends doing next.

If the owner needs a dashboard to answer one of those questions, the Jarvis experience is incomplete.
