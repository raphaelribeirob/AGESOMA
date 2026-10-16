# AGESOMA Workforce OS — Product and Technical RFC
Status: PROPOSAL / NOT DEPLOYED — 2026-10-16
Base: draft PR #38 (self-service B2B Atendimento); no production changes, no migrations, no provisioned computers.

## 1. Product contract
An owner connects the company, AGESOMA builds a **source-attributed, permission-bounded business model**, proposes work, and specialists execute only authorized actions. One conversational control surface; a visible roster of persistent workers; a distinct, isolated computer per worker; and outcome evidence for every completion claim.

**User promise:** “Conecte sua empresa. AGESOMA aprende o contexto, recomenda tarefas e executa o que você autorizar.”
**Not a promise:** full autonomy, unrestricted system access, magic knowledge of the business, or 24/7 computers included at a fixed low subscription.

The product is B2B self-service with B2C-quality onboarding. Do not confuse Wonderful.ai with the unrelated wonderfulagent.ai website.

### Canonical customer loop
1. Authenticate organization owner and tenant; select workspace.
2. Connect the first trusted information sources with minimal read-only scopes (website, company docs, knowledge base and optionally CRM/helpdesk).
3. Ingest incrementally. Store facts with source, observed_at, source_updated_at, confidence, expiry/staleness, tenant and visibility scope. Contradictions remain unresolved and are presented for owner review.
4. Produce an understandable **Business Brief**: offer, audience, products/services, channels, process, top pain points, metrics with explicit "unknown" labels. Validate important business assumptions with the owner.
5. Rank 3 possible tasks by value, reversibility, evidence, cost and permission requirements.
6. Owner delegates one bounded task (first slice: owner-approved support FAQ + human escalation, from PR #38).
7. Coordinator assigns a specialist; its compute lease starts. Connectors/API are preferred; isolated browser/computer use is a fallback.
8. Every consequential external action passes Sentinel. Human approves high-impact actions; grants are scoped, short-lived, revocable and audited.
9. Capture artifacts + independent outcome verification (ProofTree where appropriate). Report achieved vs attempted vs blocked; never claim success from a language-model response.
10. Learn procedures as versioned Skills and Routines, only after consent and observed successful execution.

## 2. Roster and governance
- **Coordenador**: routes tasks, enforces workload/budget/permissions and synthesizes evidence. Never silently increases privileges.
- **Atendimento** (first revenue wedge): answers approved FAQ, creates tickets and escalates, with customer-facing honesty. Integrate the draft #38 capabilities, not a second support implementation.
- **Vendas**: qualifies opted-in leads, prepares CRM notes and drafts follow-up; outbound needs approval.
- **Marketing**: reads performance, drafts assets and recommends budget adjustments; publishing and spend changes require approval.
- **Financeiro**: analyzes expenses, invoices, reconciliation discrepancies; payments/bank transfers are approval-only or prohibited until risk gates mature.
- **Operações** (later): bounded internal workflows and file processing.

**One accountable worker per outcome.** Other workers assist through scoped task handoffs with explicit evidence. Each worker has separate role memory, browser profile, file workspace, secrets capability, budget and computer lease. Shared company facts are served through an authorization-aware retrieval API: no implicit shared filesystem, no same password/cookies, no cross-tenant credentials.

### Computer lifecycle (mandatory distinction)
worker identity is persistent; running CPU is NOT required to be persistent.
- `UNPROVISIONED` -> `STARTING` -> `READY` -> `BUSY` -> `IDLE` -> `HIBERNATED` -> `READY`.
- `BLOCKED` and `FAILED` stop work and surface remediation.
- Each worker leases a sandbox from a provider (evaluate Daytona or E2B) with isolation guarantees verified for the actual selected runtime. Persist scoped state via encrypted volumes/snapshots or external object storage; do not rely on an always-running machine.
- Worker-to-sandbox mapping is tenant-scoped and auditable, with strict admission control, quota, TTL, idle suspension, egress allowlists, data retention policies and kill switch.
- Account-wide shared computer is NOT acceptable as a security boundary. Even though Grok Bot advertises named Bots with screens, its published FAQ describes a shared account computer, NOT one isolated computer per Bot. AGESOMA explicitly chooses per-worker isolation.

### Desktop visibility
- Status: glanceable worker state on avatar/roster and current verified task phase.
- Preview: side-panel read-only streaming view + concise action log and artifacts.
- Takeover: user claims exclusive control, the worker pauses input, session is audited, then control is explicitly returned; no simultaneous mouse/keyboard use.
- No screen images, passwords or raw secret fields in logs. Private computer display endpoints require owner authentication and scoped session tokens.
- Mobile provides same roster, statuses, approvals and preview; full takeover may require larger-screen experience depending on capability.

### Authorization matrix
- Read allowed public docs / authorized private records: scoped READ with provenance.
- Internal draft/analysis: permitted within task limits.
- Email to customers, public posts, CRM mutations, ticket closure: explicit grant, dry-run or review based on risk.
- Money movement, purchases, destructive deletes, access grants, production changes: require granular approval or be denied by policy. Rate limits and spend caps always apply.
- Credentials in secure broker, never in prompt, client-side JS, screenshot logs or shared storage.
- Company documents and websites are untrusted input; prompt injection never overrides policy.

## 3. Proposed implementation map (reuse before building)
Existing base PR #38 and related draft PRs:
- `apps/web`: Next.js/React, authenticated workspace, conversational surface; attach new workforce roster without replacing main UI yet.
- `packages/core/src/agent-registry.ts`: existing sales/marketing/finance/service profiles; evolve into versioned worker profiles and add coordinator.
- `packages/core/src/sentinel.ts`: R0-R4 policy foundation. Mandatory for every external action and computer-use step with side effects.
- HERMES, Work Cells, Trust Store, Authd, Browser Safety, Model Gateway and ProofTree: retain current boundaries; validate exact deployment, not merely source-level contracts.
- Draft #30 `Business Understanding Engine` and migration 0021: integrate via review/merge when ready; don't duplicate ontology or silently migrate production.
- Draft #33 enterprise onboarding and draft #38 self-service Atendimento: converge into a single buyer onboarding, not separate setup journeys.
- PostgreSQL/Neon for tenancy, tasks, provenance, grants, worker metadata, cost ledger and audit; durable queue for execution.
- Daytona/E2B for per-worker computer leases; deployment on Vercel only for web/control surfaces, not permanent desktops.
- Secrets and credentials managed through a broker; don't expose directly in VM environment or browser transcript.

## 4. API and database contract (planned, not implemented)
- `company_sources`: tenant_id, source_id, provider, scopes, sync_status, last_sync_at, revoked_at.
- `business_facts`: tenant_id, fact_id, value, source_id, observed_at, confidence, freshness_status, review_status.
- `worker_profiles`: tenant_id, worker_id, role, policy_version, status, budget_policy, memory_scope.
- `worker_computers`: tenant_id, worker_id UNIQUE per tenant, provider, sandbox_ref, state, lease_expires_at, last_activity_at, storage_ref.
- `work_orders`: tenant_id, owner_worker_id, objective, input_evidence, scope, spending_ceiling, state.
- `computer_events`: tenant_id, worker_id, work_order_id, event_type, redacted_summary, evidence_ref, timestamp.
- `approvals`: tenant/actor/action/scope/time-bound token and independent authorization decision.
No external provider token or raw password in relational records. Enforce RLS and authorization in services. Align names with existing schema before migrations.

Proposed endpoints under authenticated workspace:
`GET /api/workforce`,
`GET /api/workforce/:id/activity`,
`POST /api/workforce/:id/tasks`,
`GET /api/workforce/:id/computer` (signed read-only),
`POST /api/workforce/:id/takeover` (exclusive temporary control),
`POST /api/workforce/:id/stop`.
All require server-side authorization, bounded inputs, CSRF/origin protection for mutations, and tenant checks.

## 5. Delivery stages and exit gates
P0 — Product surface: authenticated roster + business-learning states + non-deceptive computer placeholders. This PR introduces only the preview, no fake data or runtime actions.
P1 — Business Brain: reconcile draft #30 ontology and source provenance, implement minimal read-only website/doc/FAQ intake and human confirmation. Verify tenant isolation, stale/conflicting data.
P2 — One real worker: Atendimento uses the #38 approved knowledge/FAQ and escalations, end-to-end customer flow, independent completion evidence.
P3 — One isolated leased computer: provision per worker with secure lifecycle; run a non-sensitive test; test restart, cross-worker and cross-tenant isolation, permission revocation and budget cut-off.
P4 — Safe preview + takeover and auditable concurrent task dispatch. Test 2+ workers concurrently without shared cookies/keys and no simultaneous input.
P5 — Skills/Routines, additional roles only after 10+ real pilot customer tasks with measured success, retries, escalation and unit economics.

**Definition of done (production):** provider credentials validated; DB migrations applied; tenant isolation and secrets tests; adversarial browser/prompt-injection tests; end-to-end buyer/auth/permission/runtime/approval/takeover; kill-switch and cost tests; accessibility + reduced motion; mobile responsive; logs/alerts; signed artifacts and evidence. CI green is not equivalent to production proof.

## 6. Key unit economics
Daytona's public rates (checked 2026-10-16): Linux vCPU $0.0504/hour; RAM $0.0162/GiB-hour, plus relevant storage and other charges. A 1vCPU/2GiB computer running 24/7 costs about $60/month before storage, model tokens, browser/proxy, retries and platform fees. Five always-running workers cost about $300/month of compute alone. Size-specific performance is not guaranteed.
**Policy:** sell persistent *identity* and *work*, not permanently powered-on CPUs; idle hibernate and enforce tenant budget reservations. Price packages based on outcomes/tasks + included usage, with transparent excess use.

## 7. Risk and tradeoffs
- Market: assistants are crowded; category-level positioning has weak differentiation. Win with trusted business onboarding + one measurable workflow.
- Reliability: browser automation can be blocked by MFA/CAPTCHA/site terms; API/connector first; human takeover if appropriate.
- Security: cross-tenant leaks, prompt injection, credential sprawl and unapproved spend are existential risks; deny by default.
- Product: overly broad worker roster produces "AI theater" rather than value; launch only coordinator and Atendimento first.
- Migration: the default branch currently states PERSONAL assistant, while draft PRs #29/30/33/38 pursue enterprise. This proposal intentionally lives on a branch stacked on #38 and must not silently rewrite `main`.

## Sources consulted (2026-10-16)
- https://x.ai/news/designing-grok-bot
- https://docs.x.ai/grok-bot/faq (shared machine per user, separate screens)
- https://www.wonderful.ai/agents
- https://www.daytona.io/docs/en/sandboxes/
- https://www.daytona.io/pricing
- https://e2b.dev/
