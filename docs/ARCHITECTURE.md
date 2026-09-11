# AGESOMA P0 Architecture

## Boundary rule

The LLM/execution plane is never its own authorization authority.

AGESOMA is an **authorized universal business operator**: it may discover and use any website, application, API or computer interface needed to complete a business outcome when that resource is public or the SME has explicitly authorized access. Freedom is destination-agnostic; control is based on impact.

AGESOMA must never bypass authentication or access controls, obtain credentials it was not given, cross tenant boundaries, escalate privileges, or turn a read-only permission into a consequential action.

```text
Owner intent / business event
        ↓
Opportunity + outcome selection
        ↓
Sentinel: what impact is allowed?
        ↓
Margin Governor: is the work economically rational?
        ↓
Durable job (Postgres / pg-boss)
        ↓
Tenant Work Cell
        ↓
Hermes isolated execution service
        ↓
Authorized web / apps / APIs / computer interfaces
        ↓
Outcome Ledger
        ↓
C-Trace + LearningRecord + ROI Mode
```

## Universal operator model

The owner should not need to pre-register every website or application AGESOMA may need during a task. The task grants an outcome and an impact envelope; inside that envelope the execution layer may discover the route needed to finish the work.

The canonical access levels are:

- **Observe / `business.observe` / R0:** navigate public or already-authorized resources and read business state without changing it.
- **Work / `business.work` / R1:** create drafts, prepare files, navigate interfaces and perform reversible operations inside the authorized business context.
- **Act / `business.act` / R2:** create external side effects such as sending messages, updating external systems or booking meetings. These are controlled by Sentinel and the owner's policy/grants.
- **Commit / `business.commit` / R3:** spend money, change commercial terms, alter authentication/security settings, publish irreversible changes or create material obligations. These always require explicit scoped authority and may be denied by policy.

The destination does not determine the permission. The impact does. AGESOMA may therefore discover a new site or tool during execution without requiring that destination to be hard-coded in the product, provided the resource is public or the SME has authorized access and the action stays inside the approved impact envelope.

## Tenant Work Cell

Each SME must have a logically isolated work cell containing its sessions, files, memory, connector scopes and execution state. Compute may be shared for cost efficiency, but tenant context and credentials may not be shared.

Credentials remain outside model context whenever possible. Hermes receives the minimum execution authority needed for the active task, while AGESOMA/Sentinel remain the authorization authority.

An authenticated browser profile belongs to exactly one Tenant Work Cell. Reusable cookies, sessions and connected accounts must never be shared across businesses.

## Universal runtime

The execution runtime should expose three routes, all private to the work cell:

1. **Browser automation** for arbitrary web applications. Prefer a low-cost local CDP/headless browser as the default; Hermes supports browser automation and external CDP endpoints.
2. **Computer use** when a workflow cannot be completed through browser/API primitives and requires a GUI application.
3. **Sandbox terminal** for files, transformation, code and local automation. It must not provide host-level or cross-tenant privilege.

Browser/computer/terminal availability is a runtime capability, not customer-facing product complexity. The owner asks for a business result; AGESOMA chooses the route.

## Why Hermes is separate

Hermes is treated as an execution substrate. AGESOMA owns tenant isolation, permission policy, economic limits, outcome attribution, learning records and the owner experience. Credentials are not stored in agent context.

Hermes already supports browser automation, computer-use and terminal-based execution. AGESOMA exposes that operational freedom through the Tenant Work Cell rather than turning every destination into a bespoke integration.

## Muse-for-SME operating loop

```text
Observe
  ↓
Find opportunity
  ↓
Propose work
  ↓
Approve only when needed
  ↓
Work in background
  ↓
Deliver artifact/result
  ↓
Verify business outcome
  ↓
Calculate ROI
  ↓
Learn
  ↺
```

## P0 first workflow

Commercial recovery over WhatsApp/CRM/calendar:

1. Observe permitted inbound conversations and lead state.
2. Detect stale qualified opportunities.
3. Classify and estimate recoverable value.
4. Route external actions through Sentinel.
5. Route cost/value through Margin Governor.
6. Execute approved follow-up through Hermes.
7. Record response, meeting, resumed proposal or sale.
8. Attribute revenue only with evidence/confidence.
9. Record all execution costs.
10. Learn from owner corrections and verified outcomes.

The first workflow remains narrow for validation, but the underlying operator architecture is destination-agnostic from the start.
