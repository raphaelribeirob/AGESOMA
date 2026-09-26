# AGESOMA Product Scope

## One job

AGESOMA exists for one purpose: act as a **personal executive assistant** that remembers useful context, organizes what matters and executes authorized digital work for the user.

The product is not a chatbot with a longer tool list. Its core value is delegation: the user states the outcome, AGESOMA owns the coordination and returns only when a decision, authorization or completed result matters.

AGESOMA must always be able to answer:

1. What matters to this person now?
2. What can be taken off their plate?
3. What context is relevant to the task?
4. What can be completed safely without interruption?
5. What requires explicit approval?
6. What was actually completed and what evidence exists?

## Canonical operating model

`User -> AGESOMA -> specialized capability/runtime -> verification -> AGESOMA report`

AGESOMA is the single user-facing intelligence. Internal specialists, models, tools, browsers, APIs and execution runtimes are implementation details.

The primary domains are:

- calendar and commitments;
- email and communication;
- research and decision preparation;
- documents and knowledge work;
- personal administration;
- finance visibility and administrative support;
- recurring routines and monitoring.

## Canonical experience

**One AGESOMA conversation. Delegation first.**

The user can ask, delegate, approve and receive the completed result without learning prompts, workflows, agents or model names.

The main prompt is:

**O que você quer que eu resolva?**

## Required product objects

- user identity;
- personal context;
- memory with provenance and user control;
- people and relationships when relevant;
- commitments and calendar context;
- tasks and delegated outcomes;
- authorization grants;
- connected services;
- execution state;
- evidence and verified completion;
- learned preferences that never expand authority.

## Architectural rules

1. Single-assistant experience, capability-rich architecture.
2. Memory and authorization are separate systems.
3. AGESOMA may infer intent, never consent.
4. Consequential actions require scoped authority.
5. The executor never grants itself permission.
6. Personal context is not proof.
7. Completion claims require evidence appropriate to the task.
8. Internal architecture terms stay out of the normal product experience.
9. The user must be able to inspect, correct and forget learned context.
10. Proactivity must reduce attention cost, not create a notification stream.

## Non-goals

AGESOMA must not become:

- an agent marketplace;
- an AI-agent builder;
- a workflow studio;
- a generic dashboard;
- a CRM-first product;
- a project-management suite with AI added;
- a screen for choosing models or prompts;
- a system that performs consequential actions based only on inferred intent;
- a product that requires the user to organize its internal agents.

## P0 proof

The first release should prove four loops:

1. remember useful personal context;
2. understand and organize calendar-related work;
3. understand and prepare communication-related work;
4. research, prepare and execute a digital task while preserving user authorization.

If these loops do not work together, adding more integrations does not make the product a better assistant.

## Compatibility note

The repository still contains internal business-oriented schema names and `business.*` action classes from the previous AGESOMA architecture. During migration they are treated as compatibility primitives only. They are not the product definition and must not leak into the user experience.
