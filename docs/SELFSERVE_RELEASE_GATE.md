# AGESOMA Atendimento — self-service production acceptance

Status: **NOT READY FOR CUSTOMER SALES**. The CI below validates code paths with
fixtures and an isolated PostgreSQL 16 container. Neither a successfully
compiled UI nor mock billing events prove a production deployment.

## Implemented and tested in draft PR

- Hosted FAQ chat with owner-authored responses; abstain on unsafe/unmatched text.
- Tenant-isolated authenticated workspace, owner-only settings and preview.
- Unanswered questions create a human **open** ticket, with a customer bearer
  protocol and authorized owner response. No unsupported "automatic resolution"
  claim.
- Random signed, HttpOnly, SameSite visitor sessions and atomic max-12/day per
  visitor, 40/hour per workspace and 200/day total quotas. The public session
  endpoint permits new sessions, so rate limits **do not stop distributed abuse**.
- Versioned onboarding API/enterprise blueprint retained separately as a draft.
- Paddle server-origin transaction intent and signed webhooks; subscription ID
  used for follow-up lifecycle changes even when Paddle omits custom_data.
  Canceled, paused, past-due and mismatched-plan subscriptions are not public.
- An owner subscription portal link is generated on demand (not persisted).
- Owner-defined labeled evaluations and historical regression run summaries.
- PostgreSQL tenant-isolation, quota rollback, ticket resolution, and subscription
  lifecycle tests in CI; TypeScript compile and Next.js production build.

## Production gates: all unchecked until accompanied by a real evidence record

- [ ] Confirm the intended Vercel team/account; do not deploy into old R3 team or
      test project without explicit ownership validation.
- [ ] Provision a dedicated AGESOMA Neon project/staging database and separately
      provision production secrets; migrations 0021 through 0026 applied in order.
- [ ] Run two-company real Better Auth browser E2E with RLS, owner vs member,
      session expiration, email/password, ticket access and public routes.
- [ ] Configure PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, PADDLE_SUPPORT_PRICE_ID,
      NEXT_PUBLIC_PADDLE_CLIENT_TOKEN, PADDLE_APPROVED_CHECKOUT_URL,
      PADDLE_ENV, BETTER_AUTH_SECRET, and SUPPORT_SESSION_SECRET or a documented
      secure reuse of BETTER_AUTH_SECRET. Never add keys to Git.
- [ ] Verify Paddle Sandbox purchase, payment failure, subscription activation,
      scheduled cancellation, immediate cancellation, pause, restore with a new
      subscription, price change, customer portal link and webhook retries/out-
      of-order delivery. Validate production-price ID, currency, taxes and terms.
- [ ] Verify the 0024–0026 migrations against the **production-like restricted
      DB role** and audited privileges; the staging CI uses admin Postgres.
- [ ] Add production bot/WAF/DDOS mitigation, CSRF review, origin/proxy
      configuration, load testing, secrets rotation and request logging hygiene.
- [ ] Validate privacy, consent, retention period and deletion/export requests
      for user messages and ticket response tokens, including LGPD needs.
- [ ] Test real support workflows with at least 3 consenting businesses, actual
      unanswered messages, human operator response, customer retrieval and SLA.
- [ ] Add live error tracing, latency alerting, resolution feedback, abuse/cost
      dashboards, and an externally reviewed QA regression set.
- [ ] Audit accessible/mobile UX, Portuguese copy, checkout price and support
      terms; verify no implication that WhatsApp/email/voice bots are live.
- [ ] Final security + product release authorization, rollback drill and
      documented responsible operator for customer incidents.

## Differentiation from Wonderful

Wonderful operates an AI-agent platform and offers an implementation model for
enterprises; AGESOMA is intentionally a smaller self-serve vertical product at
this stage. FAQ retrieval with a human ticket queue is not an autonomously
executing enterprise agent, and proof-based freight recovery remains a separate
prototype.

## CI evidence

See the latest PR checks for .github/workflows/ci.yml (typecheck, test, build)
and .github/workflows/enterprise-onboarding-ci.yml (real PostgreSQL and
adversarial/fixture tests). Records from previous commits are not acceptance
for future changes.
