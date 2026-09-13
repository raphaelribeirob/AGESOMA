# AGESOMA

AGESOMA is one product with one job: act as the operating intelligence for a small or medium business.

Its purpose is simple: understand how the company works, organize people and work, decide what should happen next, use HERMES when software can execute the work, and involve the owner only when a real decision or authorization is required.

## Canonical product definition

**AGESOMA = the JARVIS for SMEs.**

Customer-facing promise:

**AGESOMA organiza sua empresa, coordena sua equipe e faz o trabalho avançar.**

AGESOMA is not an agent marketplace, workflow builder, chatbot, CRM, HR system, project-management suite or collection of vertical products. Those capabilities may exist internally when useful, but they are not separate products or user-facing concepts.

## Operating model

```text
Owner / business objective
        ↓
AGESOMA understands the company
        ↓
AGESOMA decides what needs to happen
        ↓
┌──────────────────────┬──────────────────────┐
│ Human employee       │ HERMES               │
│ receives work        │ executes digital work│
└──────────────────────┴──────────────────────┘
        ↓
AGESOMA follows progress
        ↓
AGESOMA verifies the result
        ↓
AGESOMA reports what changed
        ↓
AGESOMA learns how this company works
```

The owner should not need to understand agents, prompts, models, workflows, tools or orchestration.

## What AGESOMA does

AGESOMA maintains one operating picture of the business:

- objectives and priorities;
- employees, responsibilities and capacity;
- work that is pending, active, blocked or completed;
- decisions that need the owner;
- systems and information the company already uses;
- work that can be delegated to HERMES;
- evidence that a result actually happened;
- lessons learned from the company over time.

From that picture, AGESOMA continually answers four questions:

1. What needs to happen now?
2. Who should do it?
3. Can HERMES do it safely instead of a person?
4. What does the owner actually need to know or decide?

## Human + HERMES coordination

Human employees remain part of the operating system. AGESOMA can assign, prioritize, follow up and surface blockers for human work.

HERMES is an internal execution substrate controlled by AGESOMA. It may handle authorized browser, API, messaging, file and computer work when appropriate. HERMES is never the product, never the authority and never the owner-facing identity.

Canonical authority rule:

**AGESOMA decides and governs. HERMES executes. People collaborate. The owner retains authority.**

## Owner experience

The primary product should stay extremely simple:

`Início | Equipe | Trabalho | Resultados`

The owner can also ask AGESOMA directly what they want done.

Examples:

- “Organize a equipe para fechar mais vendas esta semana.”
- “Quem está sobrecarregado?”
- “O que está parado esperando alguém?”
- “Resolva tudo que puder sem me interromper.”
- “O que precisa da minha decisão hoje?”
- “Mostre o que realmente foi concluído esta semana.”

AGESOMA may internally use specialized work methods for different business situations, but these methods must never become separate AGESOMA products, modes or brands.

## Safety and authority

AGESOMA owns tenant context, employee/work context, policy, approvals, business memory, result verification and economic attribution.

HERMES operates inside isolated Work Cells and receives only the authority needed for the active task. Consequential external actions remain subject to AGESOMA policy and scoped owner authority.

The core principle is unchanged:

**The executor is never its own authorization authority.**

## P0 stack

- Next.js + React + TypeScript: owner-facing AGESOMA shell.
- PostgreSQL + pgvector: operational truth and business memory.
- pg-boss: durable background work.
- Sentinel: independent authorization boundary.
- HERMES: isolated digital execution plane.
- Work Cells: tenant-isolated runtime, browser/files/memory/credential namespaces.
- Credential broker: keeps business credentials outside HERMES.
- Outcome verification: distinguishes work performed from results actually proven.
- PostHog + Sentry/C-Trace: product and reliability observability.

## Repository layout

```text
apps/web            AGESOMA owner experience and API endpoints
packages/core       decision, policy, routing and business intelligence
packages/db         operational database and migrations
services/worker     durable coordination and HERMES adapter
deploy/production   control plane and isolated tenant Work Cells
docs                product doctrine, architecture and release gates
```

## Internal compatibility names

Existing identifiers such as `@agesoma/*`, `agesoma_p0` and `agesoma.execute` are valid internal names. Legacy `InstantWork` language must not return to the public product.

## Release test

A release is directionally correct only if an ordinary SME owner can use AGESOMA without learning AI concepts and can answer, at a glance:

- what the team is doing;
- what AGESOMA/HERMES handled automatically;
- what is blocked;
- what needs the owner's decision;
- what result was actually achieved.
