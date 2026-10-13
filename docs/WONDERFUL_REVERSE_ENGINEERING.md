# AGESOMA x Wonderful — Reverse Engineering Acceptance Matrix

Updated: 2026-10-13. This matrix reviews **public behavior** of Wonderful
and observable AGESOMA source-code. Wonderful is proprietary; this is independent
capability analysis, not an assertion of matching source code.

Official Wonderful references:
- https://www.wonderful.ai/ai-os
- https://www.wonderful.ai/agents
- https://www.wonderful.ai/deployment
- https://www.wonderful.ai/blog-articles/wonderful-an-enterprise-platform-to-turn-ai-ambition-into-agents-in-production
- https://www.wonderful.ai/blog-articles/open-by-default-competitive-by-design

## User promise and business model

AGESOMA sells B2B services with B2C-like self-service checkout, onboarding
and provisioning. AGESOMA Atendimento is the first bounded hosted web-chat SKU.
Freight recovery is an assisted pilot, not an immediately usable software SKU.
The deterministic FAQ engine plus manual handoff is not a general autonomous
Wonderful-class AI agent.

Status values: CODE = implemented only; CI = verified in source/isolated tests;
LIVE = provider-connected authenticated staging; READY = customer-validated
business outcome, payments, SLAs and safety.

## Reverse-engineered feature-to-acceptance traceability

| Requirement | Public Wonderful capability | AGESOMA implementation evidence | State | Required closure |
|---|---|---|---|---|
| W01 | Shared AI OS tenant and access layer | Better Auth + Neon tenancy + RLS | CI | Real two-company staging E2E |
| W02 | Reusable versioned skills with validation | support-release.ts, support-product.ts | CODE / narrow | Multi-skill runtime and rollback |
| W03 | Dynamic runtime skill composition | Agent registry + HERMES; FAQ call is direct | MISSING for first SKU | Intent-selected, durable skill execution |
| W04 | Deep CRM/ERP/system-of-record integrations | Connections API + Company Brain context | MISSING for first SKU | Real read + approved external action |
| W05 | Source-grounded customer/company context | Tenant-approved FAQs, business fact schema | CI / narrow | Verified business sources and freshness |
| W06 | End-to-end work resolution | Chat -> unanswered case -> human reply | CI / partial | Complete one business action automatically |
| W07 | Enforced policy and governance | RLS, Sentinel, ProofTree scaffolds, signed sessions | PARTIAL | Independent approval on external tool effects |
| W08 | Reusable quality evaluation | QA cases, versioned skill, content revision gate | CI / narrow | Live continual checks, alarms and drift review |
| W09 | Verified evidence-backed business outcomes | Customer-confirmed manual support outcome, separate from operator closure; ProofTree still separate | CI / PARTIAL | Independently proven external outcome in live CRM/ERP |
| W10 | Omnichannel agent interactions | Hosted web-chat only | PARTIAL | WhatsApp, email or voice only when truly supported |
| W11 | Observability across tools, actions, cost | Support metrics endpoint: decision latency, operator p95, overdue tickets and voluntary customer feedback | CI / PARTIAL | Cost/margin, error tracing, production sampling and SLA alerts |
| W12 | Customer deployment in existing environment | Blueprint and CI migrations | NO LIVE PROOF | Neon staging + approved Vercel account |
| W13 | Platform exports and open interfaces | Owner-only FAQ JSON export/import, internal APIs | CI / narrow | Versioned agent/skill/tool/app export contract + real customer portability test |
| W14 | Self-service purchase (AGESOMA distinction) | Paddle webhook, owner portal, true synthetic AHA demo and localized price preview | CODE / CI partial | Provider-connected pricing and live browser E2E |

## Release-critical capability implemented here

A customer may open public AGESOMA Atendimento only when all conditions hold:
- Valid paid Paddle subscription (active/trialing) issued by the trusted webhook.
- Business owner explicitly authorizes publishing.
- At least one enabled owner-approved FAQ exists.
- The latest fully passing test run includes BOTH a correct reply and a safe
  human escalation, and passes every configured QA case.
- The run matches both current knowledge/test-data revision and current skill
  manifest version. Database triggers invalidate older runs after edits.
- On failed/missing evidence, fail closed at hosted page, guest-session endpoint
  and public message endpoint.

Key evidence paths:
- packages/core/src/support-release.ts
- packages/db/migrations/0027_support_skill_release_gate.sql
- apps/web/lib/support-release.ts
- apps/web/app/api/support/evals/route.ts
- apps/web/app/api/support/public/route.ts
- apps/web/app/api/support/portability/route.ts
- tests/support-skill-release-db.test.mjs
- packages/core/test/support-release.test.mjs

This is **release QA gating**, not yet Wonderful continuous evaluations or
provider-attested economic outcomes. The first SKU remains limited.

## Production acceptance — all evidence required

Do not declare Wonderful parity or sell to paying customers based on CI alone.
- GitHub issue #39: isolated Neon staging + authorized Vercel deployment,
  browser flows with two authenticated companies and isolated customer data.
- GitHub issue #40: Paddle provider sandbox checkout, refunds, cancellations,
  reactivation, webhook replay and failure modes with recorded evidence.
- GitHub issue #41: live WAF, LGPD/data retention, operator SLAs, monitoring,
  real customer feedback and rollback authorization.
- End-to-end proof: signup -> setup -> knowledge -> QA -> checkout ->
  entitlement -> inbound support -> human escalation -> reply -> cancellation.
- REA-12/17 interim implementation: migration 0028, support customer feedback,
  decision latency and an owner-only 30-day metrics dashboard. Customer feedback
  is voluntary and NOT independent proof of an external automated business action.
- Add one authorized external business integration and an independently
  verified business action before describing the first SKU as an autonomous
  operations agent.

## Application of commercial offer and Agent Access — October 2026

See [WONDERFUL_OFFER_APPLICATION.md](WONDERFUL_OFFER_APPLICATION.md).

The AGESOMA demo calls the actual FAQ engine with fictional data; this
is not evidence of a real customer outcome. The public price component
calls Paddle.PricePreview when configured and never invents a price.

Wonderful's Agent Access announcement of October 12, 2026 introduces
permissioned personal-agent delegation. AGESOMA now exposes only
/api/agent-access/capabilities for read-only product discovery.
It does NOT implement agent identity, owner consent, authorization
scopes or delegated execution. Those require further security review.
