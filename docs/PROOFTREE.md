# AGESOMA ProofTree — Risk-Adaptive Verification Protocol (V1)

## Purpose

ProofTree is AGESOMA's **outcome verification** layer, not an agent marketplace or a substitute for Sentinel authorization.

**Rule:** an executor cannot certify their own work. Independent checks rely on original sources and deterministic logic, not on agents repeating the same assertion.

    Worker produces a bounded claim
            ↓
    Trusted source + independent deterministic checks
            ↓
    ProofTree risk policy → PASS / REVIEW / BLOCK
            ↓
    Sentinel applies separate permissions for external effects
            ↓
    Customer-facing verified outcome (only after completion integration)

## Risk-adaptive verification

| Risk tier | Independent checks | Special condition |
|---|---|---|
| Low | One accepted independent method | Verified evidence required |
| Moderate | One independent source check | Verified original-source evidence |
| High | Two distinct verifiers/methods | Source check + deterministic recalculation |
| Critical | High-tier requirements + named human review | Human review does not replace Sentinel |

Mapping from action classes: R0→low, R1→moderate, R2→high, R3/R4→critical. Sentinel R4 still denies external execution by default.

Repetition, agent self-attestation, identical verifier identity, LLM-only evidence, inconsistent tenant/task/hash, and explicit verifier failure do NOT establish successful verification. A fail vote BLOCKs; missing validations yield REVIEW. Limits: 64 evidence items and 8 attestations per proof run.

## P0 implementation in this branch

1. packages/core/src/prooftree.ts — deterministic bounded risk-based evaluator.
2. packages/core/test/prooftree.test.mjs — proof policy, independence, failures and bounded work.
3. packages/db/migrations/0022_prooftree.sql — tenant-isolated control-plane tables for proof runs, evidence, attestations and decisions. Authenticated product users get SELECT only; trusted workers must use a restricted internal database role for writes.
4. services/worker/src/prooftree-gate.ts — backend-only trusted loader and decision audit writer. A missing or unready run cannot PASS.
5. packages/core/src/operations-recovery.ts — claims and fees require a matching proof, bound to tenant, case, amounts, status, fee basis, approval reference and document references.
6. packages/core/test/operations-recovery.test.mjs — absence and stale proof replay tests.

## Trust boundary and limitations

- A verified source flag must originate from a trusted connector/deterministic validator, never LLM output or a public-facing API. A hash or URL by itself does not verify source authenticity.
- Two verifier IDs do not establish true independence unless the control plane separately runs methods and checks evidence sources.
- ProofTree PASS only certifies the specified bounded claim; it cannot authorize communications, payments, legal claims or contract changes. Sentinel grants remain separate.
- The recovery assessment accepts ProofTree decisions only from the trusted service. Never supply customer/model JSON directly to the recovery evaluator.
- The worker loader requires a matching ready run bound to tenant/task/hash. Incomplete runs fail closed.
- Migration has NOT been applied on Neon or deployed to customers.
- Proof runs are NOT yet automatically scheduled for every task. Provider-backed document checks, verifier job dispatch and customer claim orchestration are pending.
- Generic AGESOMA task execution still follows its existing completion pathway. Do not claim ProofTree universally protects task completion until that separate integration has passed testing.

## Production verification workflow

1. Source verifier independently retrieves original permitted contract, CT-e and invoice, validates signatures/context as applicable and pins content hashes.
2. Arithmetic verifier recomputes invoice versus applicable tariff contract using deterministic functions and original inputs.
3. Critical cases additionally require an authenticated named reviewer distinct from the executor.
4. Data changes cause a new subject hash and invalidate previous decisions.
5. Verified settlement documents must be independently matched before marking cash recovered.
6. ProofTree evaluation and Sentinel authorization must be independently enforced before irreversible external actions and economic claims.

## Release gate

- [x] Core policy code, persistence schema, recovery gate and tests authored.
- [ ] GitHub CI green.
- [ ] Neon staging migration and tenant-level database integration tests.
- [ ] Trusted source attestation issuer with separated verifier execution identities.
- [ ] Agent scheduling, budgets, retry/escalation and pending-verification task lifecycle.
- [ ] End-to-end gate on publishing verified outcomes to customers.
- [ ] Contractual and security review for financial recovery workflows.

**Do not activate autonomous financial execution or success-fee billing before these gates are independently tested.**
