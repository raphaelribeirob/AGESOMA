# InstantWork release gates

## P0 — Muse-for-SME safety and runtime

- [x] Postgres/pgvector reachable.
- [x] Persistent Goals schema available.
- [x] Persistent Watchers schema available for event/schedule/watch loops.
- [x] Persistent Work Cell registry available per tenant.
- [ ] One authenticated user can be bound to exactly one authorized tenant membership.
- [ ] RLS is enabled and forced for every tenant-owned production table. RLS policies exist; `FORCE ROW LEVEL SECURITY` is still required before multi-tenant production.
- [x] Sentinel blocks R4 and requires review for consequential work.
- [x] Consequential requests resolve a concrete capability before approval; approval is bound to task + action + destination + operation + resource + full payload hash.
- [x] Approval grants are short-lived, one-time and fail closed on scope change.
- [ ] Every Hermes network egress passes through an InstantWork-controlled system-level policy boundary.
- [ ] Real provider credentials remain outside the executor-visible environment and are injected only after authorization.
- [ ] Each tenant has physically isolated browser/session/files/memory state inside its Work Cell. Namespaces exist; runtime isolation still needs enforcement.
- [ ] Margin Governor uses only server-derived or server-bounded economics.
- [x] `agesoma.execute` uses pg-boss durable storage and idempotent task dispatch keys.
- [x] Hermes runs outside the web process and without public API ingress.
- [ ] At least one Watcher generates a real opportunity from an authorized source without a user prompt.
- [ ] Every successful workflow produces a provider-verified OutcomeEvent with execution cost and attribution evidence.
- [ ] Every consequential action has complete C-Trace/egress metadata.
- [x] Hermes/executor output cannot directly write verified economic outcomes; verification is a separate provider-backed boundary.
- [x] A safe observe/work run may surface a concrete R2/R3 proposed action, but the side effect is created as a separate approval task rather than executed by the planning run.

## P0 — activation

- [x] CAL AI-inspired onboarding exists.
- [ ] Onboarding creates the authenticated tenant, first Goal, Work Cell and at least one Watcher.
- [ ] User connects one real business source during activation.
- [ ] First real opportunity is discovered from connected business data.
- [ ] First approval can be reviewed from a server-generated canonical action view.
- [ ] First workflow completes end-to-end: opportunity -> approval/policy -> execution -> response -> meeting/sale -> evidence -> verified business value.

## P1 gate before platform expansion

- [ ] One paying customer.
- [ ] One production workflow completes repeatedly, not just once.
- [ ] Revenue/outcome attribution is recorded and auditable.
- [ ] Unit economics are positive or explainably bounded.
- [ ] Human correction rate is measured.
- [ ] Prompt-injection, cross-tenant, approval-replay and duplicate-execution tests pass.

Only after this gate: broad Computer Use, custom connector builder, marketplace and advanced multi-agent expansion.
