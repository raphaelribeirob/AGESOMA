# AGESOMA — Applying the Wonderful Commercial Offer

Review date: 2026-10-13. **Implementation candidate, not approval to sell.**
Relevant pull request: #38. This product is independently developed, with no
affiliation to Wonderful.

## Public benchmark and audited distinction

Official source pages:
- https://www.wonderful.ai/agents — AI agents that engage customers, assist
  workers and complete entire business processes.
- https://www.wonderful.ai/deployment — forward-deployed engineers and strategists
  operating inside enterprise customer environments.
- https://www.wonderful.ai/ai-os — central platform, shared tools and governance.
- https://www.wonderful.ai/blog-articles/wonderful-an-enterprise-platform-to-turn-ai-ambition-into-agents-in-production
  — skill composition, context, integrated tools and continuous evaluations.
- https://www.wonderful.ai/blog-articles/wonderful-agents-can-now-work-with-your-customers-agents
  (2026-10-12) — Agent Access for design partners: identity, customer delegation
  and permissions for personal agents interacting with enterprise workflows.
- https://www.wonderful.ai/blog-articles/open-by-default-competitive-by-design
  — provider portability and APIs.
- https://developer.paddle.com/build/checkout/build-pricing-page/
  — Paddle.js pricing preview with localized currency and taxes.

Wonderful sells **enterprise work executed through AI OS + deployment expertise
+ strategic transformation**. Public contact-based contracting is not evidence
of a universal, low-priced, one-click subscription.

AGESOMA differentiation is **B2B self-service purchased like a consumer app**.
Do not claim enterprise feature parity while the first SKU only supports
approved FAQ and human escalation.

## Honest first offer

- Product: AGESOMA Atendimento Web.
- Buyer: business owner or authorized administrator.
- Outcome: answer known customer questions using owner-approved knowledge;
  route unknown questions to an authorized human queue, with a private
  customer-retrievable response.
- What's included: hosted web link; up to 200 FAQ entries; 200 requests/day
  per company, max 40/hour and 12/day per visitor; quality release gate;
  support conversation history; customer feedback and basic analytics.
- Price: **derive from the merchant's configured Paddle PricePreview**.
  Do not invent currency, fees, discounts, taxes or guarantees; the final
  checkout always confirms country-specific totals and terms.
- Excluded from this SKU: WhatsApp, voice, outbound e-mail, CRM/ERP writes,
  refunds, ticket resolution without human approval, autonomous agents or
  guaranteed financial outcomes. The business supplies its own human operator.
- Trust: owner can preview before buying; public publication requires owner
  approval, current fully passing QA and webhook-confirmed subscription.

## Offer architecture: conversion without deceptive claims

1. **Landing:** precise promise, concrete limits and exclusions, one SKU,
   price from the payment provider and a clear start action.
2. **Try-before-buy AHA:** the live API demo invokes the actual FAQ matcher
   using a fictional business and synthetic knowledge.
   One question is matched and another is refused safely; no fabricated
   production data or customer outcome.
3. **Onboarding:** create a separate company workspace; import approved
   knowledge; run positive + abstain evaluation cases.
4. **Purchase:** authenticated merchant owner creates a server-linked Paddle
   checkout intent; payment alone is not considered valid from browser state.
5. **Activation:** only authenticated owner consent, up-to-date skill QA and
   an eligible provider-verified subscription publish the web chat.
6. **Operation:** answer approved FAQ or create a human ticket, confirm human
   response and record voluntary customer-reported resolution separately.
7. **Retention/expansion:** measure setup conversion, time to first meaningful
   preview, AHA-to-checkout, activation, true customer-confirmed outcomes,
   support response latency, price objections, cancellations and operational
   cost. **No real benchmarks exist yet.**

All events and analytics must respect tenant isolation, consent and data
minimization requirements. Experimental funnel targets are not actual data.

## What's implemented by this PR

| Item | Code evidence | Verified stage |
|---|---|---|
| Honest single-SKU commercial contract | packages/core/src/support-offer.ts | Code + automated fixture test |
| Public interactive try-before-buy using real matcher | apps/web/app/api/demo/support/route.ts + apps/web/app/start/support-demo.tsx | Code + unit tests; browser E2E not done |
| Provider-localized pricing estimate | apps/web/app/start/support-pricing.tsx | Code; actual Paddle price/merchant not connected |
| Revised public landing, self-serve path | apps/web/app/start/page.tsx | Code; browser conversion not measured |
| Public machine-readable, **nonprivileged** service capabilities | apps/web/app/api/agent-access/capabilities/route.ts | Code + unit test; NO Agent Access |
| Explicit REA and commercial acceptance | tests/offer-acceptance.test.mjs; AGENTS.md | CI only |

## New Wonderful Agent Access — deliberately not exposed yet

The Wonderful Agent Access announcement (2026-10-12) introduces personal
agents requesting bounded operations inside businesses. AGESOMA can advertise
a **read-only generic discovery catalog** of its own SKU, but **must not**
accept a personal agent's asserted identity, access customer tickets, issue
delegated tokens or execute tasks until a secure design has been reviewed.

Future acceptance before any such access:
- Authenticated person acts as the principal; agent identity is verifiable.
- Explicit per-company, per-action and expiring consent/scope.
- Agent cannot authorize its own privileged request.
- Tenant boundary tested with revoked, replayed and expired delegations.
- Rate, billing, logs, data handling, legal rights and incident controls.
- Human/owner sign-off required for consequential actions.
- Business outcome independently verifiable from system of record.

## Evidence required before marketing this as completed work

- [ ] Merchant and exact price actually configured; localized price preview
      verified against a Sandbox checkout in at least two countries.
- [ ] Verified account creation, two-tenant auth and isolation on Neon staging.
- [ ] End-to-end URL with real Vercel team and all 0021–0028 migrations.
- [ ] Verified subscription purchase, webhook, cancellation and renewal.
- [ ] Three real customer pilots with consent, independently observed AHA
      completion and customer-confirmed outcomes.
- [ ] Production WAF/privacy, support SLA, observability, unit economics
      and incident handling.
- [ ] First real bounded external business-system action and proof when
      claiming Wonderful-like operational automation.

No merge to main or commercial release while launch gates remain unresolved.
