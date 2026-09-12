# InstantWork release gates

## P0 — Muse-for-SME safety and runtime

- [x] Postgres/pgvector reachable.
- [x] Persistent Goals schema available.
- [x] Persistent Watchers schema available for event/schedule/watch loops.
- [x] Persistent Work Cell registry available per tenant.
- [ ] Neon Better Auth is provisioned, but the web session is not yet bound to exactly one authorized `tenant_memberships` row.
- [ ] Forced tenant RLS is implemented and cross-tenant tested on a Neon migration branch; production application of migrations `0005` + `0006` is still pending.
- [x] Sentinel blocks R4 and requires review for consequential work.
- [x] Consequential requests resolve a concrete capability before approval; approval is bound to task + action + destination + operation + resource + full payload hash.
- [x] Approval endpoint exposes a server-generated canonical capability view, restricts approval to owner/admin and fails closed on unresolved R2/R3 scope.
- [x] Approval grants are short-lived, one-time and fail closed on scope change.
- [ ] Every Hermes network egress passes through an InstantWork-controlled system-level policy boundary. Application-level egress decisions are recorded, but a physical network proxy/VM boundary is still required for Muse-level isolation.
- [ ] Real business credentials remain outside the executor-visible environment. Customer WhatsApp tool access is restricted, but provider/channel secret isolation still needs a separate credential/connector boundary.
- [ ] Each tenant has physically isolated browser/session/files/memory state inside its Work Cell. Namespaces exist; runtime isolation still needs enforcement.
- [ ] Margin Governor is bounded and distinguishes explicit user work from autonomous work, but expected business value/cost is not yet fully server-derived from provider usage.
- [x] `agesoma.execute` uses pg-boss durable storage and idempotent task dispatch keys.
- [x] Hermes runs outside the web process and without public API ingress.
- [x] Customer-facing WhatsApp is configured to avoid the stock broad Hermes toolset; terminal/code execution are not exposed through that platform configuration.
- [ ] At least one Watcher generates a real opportunity from an authorized source without a user prompt in production.
- [ ] Every successful workflow produces a provider-verified OutcomeEvent with execution cost and attribution evidence in production.
- [x] Consequential execution records capability hash, policy decision and an application-level egress decision before execution.
- [x] Hermes/executor output cannot directly write verified economic outcomes; verification is a separate provider-backed boundary.
- [x] A safe observe/work run may surface a concrete R2/R3 proposed action, but the side effect is created as a separate approval task rather than executed by the planning run.

## P0 — activation

- [x] CAL AI-inspired onboarding exists.
- [ ] Onboarding creates the authenticated tenant, first Goal, Work Cell and at least one Watcher.
- [ ] User connects one real business source during activation.
- [ ] First real opportunity is discovered from connected business data.
- [x] First approval has a server-generated canonical action view in the API.
- [ ] First workflow completes end-to-end in production: opportunity -> approval/policy -> execution -> response -> meeting/sale -> evidence -> verified business value.

## P1 gate before platform expansion

- [ ] One paying customer.
- [ ] One production workflow completes repeatedly, not just once.
- [ ] Revenue/outcome attribution is recorded and auditable.
- [ ] Unit economics are positive or explainably bounded.
- [ ] Human correction rate is measured.
- [ ] Prompt-injection, cross-tenant, approval-replay and duplicate-execution tests pass in the deployed stack.

Only after this gate: broad Computer Use, custom connector builder, marketplace and advanced multi-agent expansion.
