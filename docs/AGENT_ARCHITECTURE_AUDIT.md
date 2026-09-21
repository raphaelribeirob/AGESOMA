# AGESOMA Agent Architecture Audit

Date: 2026-09-14

## Target

The canonical experience is one AGESOMA conversation backed by multiple specialized digital agents.

```text
Owner
  ↓
AGESOMA / AGESOMA
  ↓
Digital Agent Registry
  ├─ Sales
  ├─ Marketing
  ├─ Customer Service
  ├─ Finance
  ├─ Operations
  └─ Research
  ↓
Sentinel / policy
  ↓
HERMES execution runtime
  ↓
External systems
  ↓
Outcome verification
  ↓
AGESOMA report
```

The owner sees one intelligence. Agents are internal persistent identities, not separate chat products.

## Audit result

| Area | Status | Score |
|---|---|---:|
| Single AGESOMA owner surface | implemented | 10/10 |
| Persistent tenant-scoped agent identities | implemented | 9/10 |
| Default specialist package | implemented | 9/10 |
| AGESOMA domain-to-agent routing | implemented | 8/10 |
| Explicit human override | implemented | 9/10 |
| Sentinel independence | preserved | 10/10 |
| Tenant isolation | strong | 9/10 |
| Agent task ownership/history | implemented for AGESOMA-created digital work | 8/10 |
| Company Brain specialist context | partial | 6/10 |
| Per-agent memory isolation | not yet real | 4/10 |
| Runtime elasticity | P0 only | 4/10 |
| Per-agent economics/observability | partial | 5/10 |
| Agent template lifecycle/versioning | missing | 4/10 |

Overall architectural alignment: **7.5/10**.

## What is now installed

`digital_agents` stores the persistent identity of each specialist per tenant: role, domain, purpose, responsibilities, skills, preferred resources, autonomy mode, memory namespace and usage timestamps.

`agent_task_assignments` records which persistent specialist owns each AGESOMA-created digital task. It is intentionally separate from `work_assignments`: the first records logical agent ownership; the second records the runtime/person that actually executes the task.

The AGESOMA API idempotently provisions the six canonical specialists for future tenants and selects the appropriate active specialist from the request domain. If the owner explicitly names a human employee, the human assignment remains authoritative.

The selected digital agent is passed into the execution payload as context. Sentinel, scoped approvals and independent outcome verification remain outside the agent and executor authority boundaries.

## Security audit

The new tables use forced PostgreSQL row-level security.

Composite foreign keys bind both `task_id` and `agent_id` to the same `tenant_id`, preventing an agent assignment from linking objects across tenant boundaries even when UUIDs are known.

A digital agent owns work but cannot authorize itself. Consequential actions still require the existing exact-scope approval flow.

**Finding: PASS for the current P0 trust model.**

## Important runtime finding

The conceptual model is that agent identity must not be tied to a permanent machine. That separation is now true: no Sales, Finance or Marketing agent receives its own server or container.

However, the current production Work Cell is **not yet ephemeral per task**.

`workcell-compose.yml` currently runs one HERMES service for a tenant with `restart: unless-stopped`, a named persistent volume and a tenant-specific network. `provision-workcell.sh` runs that stack with `docker compose up -d` and registers one `work_cells` record for the tenant.

Therefore the current P0 topology is:

```text
Tenant
  ├─ 6 persistent agent identities in PostgreSQL
  └─ 1 persistent tenant-isolated Work Cell
       └─ agents share this execution substrate
```

This is materially better than one container per agent. Six agents do **not** create six servers.

But it still scales compute roughly with the number of provisioned tenant Work Cells rather than solely with concurrent work. At large scale this must evolve toward a scheduler and pooled/ephemeral runners.

### Recommended runtime evolution

P0:

```text
1 tenant → 1 isolated Work Cell → many digital agents
```

Keep this while validating product behavior and low tenant counts.

Scale phase:

```text
AGESOMA task queue
      ↓
Scheduler
      ↓
Shared runner pool
  ├─ isolated execution A
  ├─ isolated execution B
  └─ isolated execution C
      ↓
runner destroyed/recycled after work
```

Agent identity, memory and history remain in the control plane, so moving between runners does not change the agent.

Do not add Kubernetes or Firecracker before concurrency, security requirements or unit economics justify them.

## Memory finding

`memory_namespace` now exists on each digital agent and the Company Brain query receives the selected specialist's identity and purpose.

This is **not yet true per-agent memory isolation**. Graphiti currently remains tenant-scoped and retrieval is based on semantic context, not a mandatory agent namespace filter.

Target:

```text
Company Brain memory
  ├─ company-shared facts
  ├─ sales specialist episodes
  ├─ finance specialist episodes
  └─ support specialist episodes
```

Shared company truth must remain available to every authorized specialist, while specialist episodic learning should be tagged and retrievable by agent identity.

## Coverage finding

The canonical AGESOMA path now assigns digital work to a persistent agent. Older/internal task producers such as watchers and legacy request/coordination endpoints can still create executable work without an `agent_task_assignments` row.

That is acceptable for the P0 AGESOMA rollout because AGESOMA is the canonical owner surface, but it means the invariant “every digital task has a digital-agent owner” is **not yet system-wide**.

Before using agent-level analytics as authoritative, all digital task producers should pass through one shared routing primitive or receive a deterministic agent owner before dispatch.

## Template lifecycle finding

The default package is canonical in `packages/core/src/agent-registry.ts`, while migration `0010_agent_registry.sql` contains a snapshot used to seed existing tenants. Provisioning uses `on conflict do nothing` so tenant state is not silently overwritten.

That protects future tenant customization, but there is not yet a `template_version` or explicit upgrade policy. If the Sales agent definition changes later, existing tenants will not automatically inherit it.

The correct next design is versioned templates plus explicit migrations/upgrades that distinguish platform defaults from tenant-customized fields. Do not solve this by blindly overwriting existing agent rows.

## Economics finding

Agent work can be attributed to a persistent `agent_id`, but there is not yet a complete per-agent ledger for:

- model/tool cost;
- execution minutes;
- external API cost;
- verified value generated;
- approval frequency;
- failure/retry rate.

The existing task and outcome infrastructure gives most of the raw primitives. A derived agent-performance view should be built before pricing individual agents or claiming per-agent ROI.

## Product finding

The architecture now supports the desired model:

**one AGESOMA in front, a digital workforce behind it.**

Do not add an agent-management dashboard. Agent details should appear conversationally only when useful, for example:

> “Tenho seis especialistas ativos. Vendas está cuidando dos leads e Financeiro está acompanhando cobranças.”

The default interaction remains AGESOMA.

## Release blockers

Before calling this production-active, all of the following must be true:

1. migration `0010_agent_registry.sql` applied to the production database;
2. existing tenant receives the six agent identities;
3. a AGESOMA sales request creates an `agent_task_assignments` row owned by the Sales agent;
4. the task still passes Sentinel independently;
5. HERMES receives the digital-agent context but no extra authority;
6. a verified outcome can be joined back to the responsible agent;
7. tenant-isolation tests pass against the real database role configuration.

## Decision

**APPROVE for P0 after migration and runtime smoke test.**

Do not describe the current Work Cell layer as fully serverless or ephemeral. The persistent identity / replaceable runtime boundary is correct, but execution elasticity remains a scale-phase item.
