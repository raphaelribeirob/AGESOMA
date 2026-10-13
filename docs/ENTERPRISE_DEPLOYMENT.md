# AGESOMA — Reusable Enterprise Deployment (Wonderful-inspired, not affiliated)

## What is implemented in this branch

A repeatable **freight recovery deployment blueprint** integrated into the AGESOMA
B2B direction. The business buyer receives a service scope and outcome plan,
not a chatbot/agent-builder license.

- **Enterprise onboarding:** authenticated workspace collects company,
  economic baseline, owner role, intended outcome and references for four
  necessary freight data sources.
- **Versioned, deterministic blueprint:** six internal operator roles
  (Business Understanding, Freight Auditor, ProofTree Auditor, Sentinel,
  Claims Operator and Settlement Verifier), dependency gates, measurable
  outcomes and missing-source report.
- **Tenant-scoped durable draft:** Postgres table with forced RLS, immutable
  draft records, idempotency and server-derived tenant/actor identification.
- **Read-only client workspace:** draft status, stages, source coverage, gates
  and unmeasured KPIs. Never presents estimates as realized recovery.
- **Safety:** client inputs never grant a permission, verify source data,
  install credentials, attest ProofTree or activate runtime workers.
- **Fixture integration test:** representative intake -> ProofTree -> recovery
  assessment and adversarial checks (replay/tenant/self-verification).
  This is **not** a real external service end-to-end test.

## How to open it

Protected route: /operations/onboarding

The service template is in packages/core/src/enterprise-deployment.ts. The
API is /api/enterprise-deployments, using Better Auth + AGESOMA tenantSql.

Deployment only after review and in-order migrations: existing migrations,
then 0021_business_understanding.sql, 0022_prooftree.sql, then
0023_enterprise_deployments.sql. App build does NOT migrate the DB.

## Explicitly not implemented

- Signed agreement or validated data-processing rights.
- Source ingestion, document authenticity or live CT-e/contract reconciliation.
- Spawning/dispatching live agents from the draft.
- End-to-end Sentinel + ProofTree worker wiring and external claim submission.
- Settlement reconciliation and customer billing.
- Evals/quality observability against real user activity.
- Live Neon/Postgres migration, RLS integration test, full browser E2E and
  operator SLAs.

Production must fail closed until EVERY item of
docs/OPERATIONS_RELEASE_GATE.md is independently demonstrated.

## Reference implementation acceptance plan

1. Review nested PR dependencies #29 (B2B), #30 (Business Understanding),
   #31 (ProofTree) before this feature.
2. Run typecheck/test/build in CI. Confirm the fixture replay passes.
3. In staging Neon, run 0021–0023 migrations, verify forced RLS using two
   tenants and actual authenticated role. Check unauthorized mutations fail.
4. On a protected preview deployment, test signup, owner-only POST,
   cross-tenant read isolation, idempotency replay and expired sessions.
5. Validate source connectors against real licensed freight documents,
   proof issuers and deterministic recalculation; instrument error/retry cost.
6. Only after contracts and trusted gates exist, wire task dispatch,
   Sentinel, ProofTree, settlements, SLAs and real customer acceptance.
7. Run three paid pilot clients and record recovered cash, true labor cost,
   quality metrics, contribution margin and retention/expansion evidence.

## Operational positioning

The first service is freight overcharge detection/recovery for a defined
customer segment. Reuse the orchestration **pattern** for later verticals
only when evidence from this service proves positive repeatable economics.
