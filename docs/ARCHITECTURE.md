# AGESOMA Architecture

## Product rule

AGESOMA has one job: act as the operating intelligence of a small or medium business.

It understands the company, organizes people and work, decides what should happen next, delegates digital execution to HERMES when appropriate, follows progress, verifies results and involves the owner only when authority or judgment is actually required.

There are no separate AGESOMA products for sales, finance, service, recruiting or other verticals. Specialized knowledge may exist internally as work methods, but the customer always uses the same AGESOMA.

## Canonical chain

```text
Owner / business objective
        ↓
AGESOMA business state + priorities
        ↓
AGESOMA decides next work
        ↓
┌───────────────────────┬────────────────────────┐
│ Human employee        │ HERMES                 │
│ assignment + followup │ isolated execution     │
└───────────────────────┴────────────────────────┘
        ↓
AGESOMA verifies progress and result
        ↓
Owner sees only what matters
        ↓
AGESOMA learns how the company operates
```

## Responsibilities

AGESOMA owns:

- company context and goals;
- employees, roles, responsibilities and workload;
- prioritization and assignment of work;
- business memory;
- policy and authorization;
- decisions that require the owner;
- task and outcome state;
- verification of results;
- learning from completed work and owner corrections.

HERMES owns only execution inside the capability granted by AGESOMA:

- browser work;
- computer use;
- APIs;
- files and transformations;
- messaging and other connected digital operations.

HERMES is never the authority and never the owner-facing product.

## Authority rule

The executor is never its own authorization authority.

AGESOMA/Sentinel defines what impact is allowed. HERMES receives only the minimum authority needed for the active task. Consequential actions remain bound to exact approved destination, operation, resource and parameters.

## Human coordination

A human employee and HERMES are both execution resources from the perspective of AGESOMA.

AGESOMA chooses the route based on responsibility, available context, authorization, cost, reversibility and required human judgment. The owner should not need to decide whether a task is “AI work” or “human work”.

## Tenant Work Cell

Each company receives isolated execution state: runtime, browser profile, files, memory and credential namespaces. Business credentials remain outside HERMES wherever possible and are brokered only for the approved operation.

## Operating loop

```text
Understand company state
  ↓
Identify what needs to happen
  ↓
Prioritize
  ↓
Assign to a person or HERMES
  ↓
Monitor progress
  ↓
Ask owner only when needed
  ↓
Verify completion/result
  ↓
Learn
  ↺
```

## Customer-facing simplicity

The canonical owner experience is one AGESOMA conversation.

Work state, approvals, team context, recommendations and verified results should appear contextually inside that conversation instead of requiring the owner to navigate across operational dashboards.

Account and advanced settings may exist outside the core conversation when necessary.

Technical concepts such as HERMES, Sentinel, Work Cell, models, agents, workflows and internal work methods must remain outside the normal owner experience.
