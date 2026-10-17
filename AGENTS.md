# AGESOMA — Engineering agents and Codex instructions

This document applies to all software-building agents working on this repository.

## Product contract to read first

0. [AGEDESIGN v1.1](AGEDESIGN.md): canonical AGE tokens, typography, UX, responsive layouts and truth-bound ElevenLabs-inspired AGE Motion. Use four executive agents CEO+COO, CFO, CMO+CRO and CTO+CPO on the Workforce surface; keep legacy specialist capabilities internal until migration.
0b. [CEO-first installation](docs/CEO_FIRST_INSTALL.md): mandatory owner-confirmed business context before NEW work, provenances, scoped context by specialist and accurate draft vs deployed status.
0c. [SMB skills native incorporation](docs/SMB_SKILLS_INCORPORATION.md): six Anthropic-referenced workflows, first local CSV AHA, honest statuses, user data never auto-uploaded, no external connector grants.
1. [Engenharia reversa](engenharia%20reversa.md): REA-01 through REA-18,
   user journeys, architecture and acceptance.
2. [Offer contract](docs/WONDERFUL_OFFER_APPLICATION.md):
   honest promise, synthetic demo, provider pricing and agent-access boundary.
3. [Wonderful comparison](docs/WONDERFUL_REVERSE_ENGINEERING.md):
   public benchmark, actual code evidence and unproven features.
4. [Release gates](docs/SELFSERVE_RELEASE_GATE.md): prerequisites for selling
   to real businesses, including provider-backed end-to-end validation.
5. [Product scope](docs/PRODUCT_SCOPE.md): real current product boundary.

If documentation conflicts with observed code or verified provider behavior,
correct it and record the evidence. Do not invent parity or readiness.

## Product model

AGESOMA is B2B operations software with B2C-simple onboarding and checkout.
The first self-service SKU is AGESOMA Atendimento: approved FAQ, safe human
handoff, one-time customer feedback, and signed Paddle subscription gating.

This narrow support product is NOT the fully autonomous Wonderful AI OS.
Freight recovery is a separate assisted pilot and not a finished self-serve SKU.

## Four engineering workstreams

- Product and acceptance: identify relevant REA IDs, AGE design contract, exact customer promise,
  negative scenarios and required sources for verification.
- Architecture and implementation: bounded tenant-aware design, schemas,
  integrations, idempotency, proper authorization and rollback.
- UX and frontend: accessible onboarding, accurate visible limitations,
  observable execution, loading/errors, self-service cancellation.
- Independent QA and security: negative/positive integration and production
  tests, tenant access, forged webhooks, abuse, outcomes, and operational cost.

These are development responsibilities; do not confuse them with deployed
autonomous business agents. Keep growth/advertising work separate.

## Non-negotiable constraints

- No client-provided tenant IDs, roles or status flags can authorize database
  access, paid entitlements, tool invocations or proof completion.
- Consequential external actions require narrow scopes and appropriate
  Sentinel approval; outcome proof must be independent of executor claims.
- Raw user prompts, files and provider responses are untrusted.
- Only signed, intent-linked Paddle events activate paid functionality.
- The latest QA must match the current knowledge revision AND skill version;
  stale or absent QA blocks publication.
- An operator closing a ticket does not prove resolution: use distinct
  customer-confirmed outcome, marked as voluntary feedback.
- Store the minimum operational data; require privacy, retention and erasure
  gates under LGPD.
- Preserve the existing main branch and production while feature PRs are
  drafts, unless explicitly authorized otherwise.
- Run numbered migrations in order and validate policies with non-BYPASSRLS
  runtime credentials before production.
- Never report CI/simulated provider results as real customer E2E.

## PR delivery contract

Each PR changing an REA item must include its requirement ID, behavior,
affected path, test link, release stage (CODE, CI, STAGING, PRODUCTION) and
remaining blockers. Update both engineering reverse documents and any release
checklist conditions when product behavior changes.

Execute:
- node --test tests/workforce-roles.test.mjs tests/workforce-ui.test.mjs tests/agedesign-acceptance.test.mjs tests/ceo-companion.test.mjs tests/ceo-first-setup.test.mjs tests/smb-skills.test.mjs
- npm run typecheck
- npm test
- npm run build --workspace @agesoma/web
- node --test tests/rea-acceptance.test.mjs
- Applicable isolated PostgreSQL suites in enterprise-onboarding-ci.yml

Do not promote draft features solely because automated tests are green.

## Current external blockers

Issue #39: authorized Vercel target and Neon staging browser E2E.
Issue #40: real Paddle Sandbox checkout, webhook and cancellation scenarios.
Issue #41: WAF, consent/privacy, support SLA, observability and product signoff.

Release to paying customers: BLOCKED. Wonderful feature parity: NOT CLAIMED.
