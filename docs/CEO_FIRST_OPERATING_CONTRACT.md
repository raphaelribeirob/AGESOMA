# AGESOMA CEO-first — ready-made executive team contract

Status: **Phase 0 delivered as code on draft branch**; not in production and not equivalent to Grok Bot's live hosted computers.
Date: 2026-10-16.
Parent: [Workforce OS blueprint](WORKFORCE_OS_BLUEPRINT.md); design: [AGEDESIGN](../AGEDESIGN.md).

## Product promise and distinction

**Grok Bot**: user creates their own bots and assigns tasks. Its current documented per-user setup shares one hosted Linux computer across the user's bots; each bot has its own screen, while files/logins belong to the user's shared computer.

**AGESOMA**: the customer gets four pre-configured executives: CEO+COO, CFO, CMO+CRO and CTO+CPO. First-run opens the CEO's company-understanding experience. Each executive will eventually lease an independently isolated Linux runtime, with separate credentials, limited privileges and audited hand-offs. Don't imply this infrastructure exists today.

**Activation promise**: the CEO first builds a business brief from approved sources, gives the owner an opportunity to correct it, and proposes an initial small task with a verifiable result. No system or business fact creates its own authority for external action.

## CEO-first sequence (product target)

1. **Welcome**: no bot-builder; four role agents preinstalled in the product catalog with clearly marked availability. CEO+COO is the only primary activation CTA.
2. **Company identity and offer**: organization name, website (optional), industry, offer, buyers, operations, obstacle, first outcome. Save an **owner-supplied draft**. Website URL is stored but not automatically crawled yet.
3. **Authorized discovery (future)**: read website, uploaded contracts/process docs and selected business connectors (CRM/ERP/helpdesk/analytics). Every read is per tenant, purpose, scope, bounded quota and documented consent. Exclude private IPs, local hosts, SSRF, binary/malware, credentials and PII by default.
4. **Evidence ledger (future)**: every extracted claim has source, observedAt, level of confidence, confidentiality and owner review. Do not conflate declaration, extracted content and independent verification. Keep incompatible facts disputed.
5. **CEO brief and approval**: coherent view of business model, operations, objective, current bottlenecks, risks, integrations and unanswered questions. Owner can correct/reject each proposal. Never let untrusted web/doc text override instructions or permissions.
6. **Assignment plan**: CEO+COO owns strategy/operations and support, CFO owns cash & margin, CMO+CRO marketing/sales, CTO+CPO product/engineering. Show potential value, execution costs, required access, approval and measurable result.
7. **First win**: choose one read-only task with evidence (e.g. map support pain points from approved FAQ or summarize a customer pipeline export), review outcome then request next approval.
8. **Autonomous execution (future)**: broker provisions one scoped Linux computer per executive only when jobs require computer use; work continues in cloud within quota, persists work artifacts, logs receipt, pauses for human decisions. Do not expose VNC or API keys directly to browsers.

## Implemented in PR #44
- Authenticated route `/workforce/ceo` with AGE company intake.
- Authenticated tenant-scoped `GET/POST/PATCH /api/workforce/ceo/intake`, owner/admin writes only.
- Restricted manual fields (zod bounds, HTTPS-only optional site URL, no caller-supplied tenant/role/review state).
- Save draft with SHA-256 fingerprint and audit `ontology_source_events` (event logs contain hash and actor, not raw field text).
- Existing `company_entities` ontology stores one canonical entity per tenant with owner-submitted attributes. Explicit owner confirmation can only confirm unchanged draft; edits reset review. Data are explicitly classified as manual owner declarations.
- Owner-confirmed structured brief in UI. It does not claim web research, independent verification, source ingestion or actual inference.
- The other three roles remain visible but dormant in workforce UX, without made-up running status.
- No new database migration is required beyond existing company ontology 0009 for the CEO intake **once all prerequisites are applied**.
- Source tests `tests/ceo-first-intake.test.mjs` are wired to the workflow; successful Node/Next run not yet observed.

## Still missing — production blockers
- Automated website crawling with strict SSRF/robots, legal/privacy boundary and real extraction; real document import; verified connectors.
- The Business Understanding Engine from **separate draft PR #30** is not merged. Integrate only after reviewing database migration 0021 and its tenant-RLS constraints; do not copy the route blindly.
- The backend still creates legacy specialist workers and the four-agent mapping is an ownership contract only.
- OpenSandbox scripts exist, but no long-running Linux host, browser streamer, take-over authorization, tenant-isolated credentials, unit-economics limits or E2E evidence.
- AI-produced business summary with source citations and uncertainty, personal data processing policies, anti-prompt-injection, reconnect/retry and quality acceptance.
- Tests with live Postgres, REST authorized and unauthorized users, concurrent confirmation, duplicate-event and empty-data cases, mobile browser E2E.

## Explicit decision gate
Owner confirms context ≠ document verification ≠ access authorization ≠ permission to spend, publish, message customers, move funds, deploy code or modify records. CEO cannot grant itself rights, override Sentinel or approve its own consequences. CFO retains independent review of spend.
