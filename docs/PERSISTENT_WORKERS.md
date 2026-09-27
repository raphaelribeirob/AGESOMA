# AGESOMA Persistent Workers

AGESOMA exposes one assistant to the user. Specialized workers are internal execution identities.

## Product rule

The owner delegates to **AGESOMA**. The owner is not required to choose or manage workers.

```text
User
  ↓
AGESOMA
  ↓
routing / coordination
  ↓
persistent workers
  ↓
Hermes + Browser Broker + connected services
  ↓
Artifacts / approvals / verified outcomes
```

## Worker contract

A persistent worker has:

- a stable `worker_key` and digital-agent identity;
- a worker-scoped Hermes session namespace;
- a worker-scoped browser namespace and provider profile;
- worker-scoped file and memory namespaces;
- recent completed-work memory injected per worker, while the tenant Company Brain remains shared;
- enforced bounded parallelism, a tenant-wide monthly hard cost ceiling and optional per-worker monthly ceilings;
- owned routines;
- bounded handoffs to other workers.

Workers are never an authority source. Memory, browser state, files and prior task output are context only. Cost authority is also external to the worker: the control-plane usage ledger reserves budget before execution and settles usage afterward.

## Runtime strategy

Phase 1 uses `shared_cell`: workers share the tenant's physically isolated Work Cell while keeping logical state separate.

This is intentional. It gives AGESOMA persistent specialist behavior without multiplying infrastructure cost by the number of workers. Worker namespaces in `shared_cell` are an application-level continuity boundary, not a security boundary; the tenant Work Cell remains the security/isolation boundary.

`dedicated_cell` is reserved for workloads that later justify physical isolation or higher parallelism.

## Routines

Existing watchers become the routine substrate.

Supported trigger classes in the data model:

- `cadence`
- `event`
- `webhook`
- `manual`

Only `cadence` is auto-dispatched in this phase. Event and webhook triggers must not be presented as functional until authenticated trigger ingress exists.

## Handoffs

A worker may propose internal handoffs when another specialist is genuinely required.

Guardrails:

- at most 2 handoffs per completed task;
- maximum handoff depth of 2;
- target must be a different active worker;
- handoff-created tasks are always `business.work` / R1 / non-external;
- handoffs cannot perform or conceal external side effects;
- any consequential action must still pass the normal Sentinel + approval path.

## Browser continuity

The logical `browser_namespace` is not a provider profile id.

`browser_profile_ref` starts null. The Browser Broker creates a provider profile on first use, and the Trust Store writes the returned profile id back to the owning persistent worker. Future browser sessions for that worker reuse it.

This gives each worker durable browser state without sharing authenticated browser state across specialists by default.

## Target architecture

```text
                     AGESOMA
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Research      Operations    Marketing
        Worker         Worker        Worker
          │             │             │
       session        session       session
       memory         memory        memory
       browser        browser       browser
       routines       routines      routines
          └─────────────┼─────────────┘
                        │
                  shared Work Cell
                        │
              policy / credentials
                        │
                     outcome
```

The user-facing UI remains Chat, Goals, Work/Activity, Artifacts and Ideas. Internal worker orchestration should only be surfaced when it materially helps explain status, cost, security or failure.
