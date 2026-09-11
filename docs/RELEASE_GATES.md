# InstantWork release gates

## P0 — Muse-for-SME safety and runtime

- [x] Postgres/pgvector reachable.
- [x] Persistent Goals schema available.
- [x] Persistent Watchers schema available for event/schedule/watch loops.
- [x] Persistent Work Cell registry available per tenant.
- [ ] One authenticated user can be bound to exactly one authorized tenant membership.
- [ ] RLS is enabled and forced for every tenant-owned production table.
- [ ] Sentinel blocks R4 and requires review for consequential work.
- [ ] Exact approval capability is enforced at execution time: task + action + destination + operation + resource + parameters/value.
- [ ] Approval grants are short-lived, one-time and fail closed on any scope change.
- [ ] Every Hermes network egress passes through an InstantWork-controlled policy boundary.
- [ ] Real provider credentials remain outside model context and are injected only after authorization.
- [ ] Each tenant has isolated browser/session/files/memory state inside its Work Cell.
- [ ] Margin Governor uses server-derived or server-bounded economics.
- [ ] `agesoma.execute` compatibility queue survives worker restart.
- [x] Hermes is designed to run outside the web process and without public ingress.
- [ ] At least one Watcher generates a real opportunity from an authorized source without a user prompt.
- [ ] Every successful workflow produces an OutcomeEvent with execution cost and attribution evidence.
- [ ] Every consequential action has C-Trace/policy metadata.

## P0 — activation

- [x] CAL AI-inspired onboarding exists.
- [ ] Onboarding creates the authenticated tenant, first Goal, Work Cell and at least one Watcher.
- [ ] User connects one real business source during activation.
- [ ] First real opportunity is discovered from connected business data.
- [ ] First approval can be reviewed from a server-generated canonical action view.
- [ ] First workflow completes end-to-end: opportunity -> approval/policy -> execution -> response -> meeting/sale -> evidence -> ROI.

## P1 gate before platform expansion

- [ ] One paying customer.
- [ ] One production workflow completes repeatedly, not just once.
- [ ] Revenue/outcome attribution is recorded and auditable.
- [ ] Unit economics are positive or explainably bounded.
- [ ] Human correction rate is measured.
- [ ] Prompt-injection, cross-tenant, approval-replay and duplicate-execution tests pass.

Only after this gate: broad Computer Use, custom connector builder, marketplace and advanced multi-agent expansion.
