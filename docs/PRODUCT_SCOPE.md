# AGESOMA Product Scope

## One job

AGESOMA exists for one purpose: act as the operating intelligence of a small or medium business so the owner can run the company through one conversation instead of coordinating software, people and automations manually.

Internally we use the shorthand **JARVIS for SMEs**.

The product must always be able to answer:

1. What is happening in the company now?
2. What should happen next?
3. Which human or digital specialist should own the work?
4. What can be completed safely without interrupting the owner?
5. What actually needs the owner's decision?
6. What was completed and what result was independently proven?

## Canonical operating model

`Owner -> Jarvis -> human or digital specialist -> HERMES/runtime -> verification -> Jarvis report`

Jarvis is the single owner-facing intelligence. It is not one worker agent.

Behind Jarvis, AGESOMA maintains a tenant-scoped package of persistent digital specialists. Their identities, roles, memory namespaces and work histories persist, while execution is performed by ephemeral runtime capacity.

Canonical package:

- Sales
- Marketing
- Customer Service
- Finance
- Operations
- Research

HERMES is the internal digital execution substrate controlled by AGESOMA. It is not a product surface, team member, brand, mode or customer-facing concept.

## Canonical owner experience

**One Jarvis conversation. No primary dashboard navigation.**

The owner may ask what is happening, request work, approve a consequential action and receive a verified report without leaving the conversation.

## Required product objects

- Company context
- Company Brain
- Human team member
- Digital agent identity
- Agent role and responsibilities
- Agent memory namespace
- Work assignment
- Agent-to-task assignment
- Work status
- Owner decision
- Verified result
- Business memory

Every active piece of work must have one accountable owner. For digital work, the persistent digital agent owns the job while the runtime that executes it remains replaceable and disposable.

## Architectural rules

1. **Single-agent experience, multi-agent architecture.**
2. **Agent identity is stateful; execution is stateless and disposable.**
3. Jarvis chooses the specialist; the owner does not configure orchestration.
4. A digital agent cannot grant itself authority or expand its own permissions.
5. Sentinel remains independent from the executor and from the digital agent identity.
6. Company Brain context is not authorization or proof.
7. Verified business outcomes remain independent from executor claims.
8. Infrastructure terms stay out of the customer-facing experience.

## Non-goals

AGESOMA must not become:

- an agent marketplace;
- an AI-agent builder;
- a workflow studio;
- a CRM replacement;
- a payroll or HRIS product;
- a recruiting product;
- an employee-surveillance product;
- a project-management suite with AI added;
- a collection of vertical products such as AGESOMA Consórcio, AGESOMA Accounting or AGESOMA Insurance;
- a dashboard whose primary purpose is showing AI activity;
- a screen where the owner must manage prompts, models, tools or agent topology.

CRM, messaging, calendars, files and specialized methods may be used internally when they help execute work. They do not become separate product purposes.

## Product test

A feature belongs in AGESOMA only if it improves at least one of these outcomes:

- understanding the company;
- choosing the right specialist or person for work;
- removing coordination burden from the owner;
- completing digital work safely;
- following progress and blockers;
- reducing unnecessary owner intervention;
- proving that work actually finished;
- making Jarvis more useful without making the interface more complex.

If a proposed feature does none of these, it is outside the product scope.
