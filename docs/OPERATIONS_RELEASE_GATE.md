# AGESOMA Operations — Release / Acceptance Gate

**State at creation: NOT READY FOR PRODUCTION.** This checklist describes required acceptance evidence. Passing static unit tests is not approval to operate enterprise financial workflows.

## P0 acceptance criteria

- [ ] Executable scoped customer contract, data-processing terms, named service owner and fee basis.
- [ ] Signed consent/rights to process freight documents, invoices and contracts.
- [ ] Trusted ingestion of contracts, tariff versions, CT-e and invoices with document hash, source and dates.
- [ ] Tenant-isolation tests (including authorization and row-level security) pass.
- [ ] Reconciliation engine handles lanes, dates, tolerances, fuel and other tariff rules reproducibly.
- [ ] Independent verification produces a document-backed case, not an LLM-only assertion.
- [ ] No claim or external side effect without independently validated, scoped, unexpired approval.
- [ ] Claim submission is idempotent, observable and recoverable from errors.
- [ ] Settlements are linked to cases using trusted ERP/bank/customer evidence.
- [ ] Success fees are calculated from eligible confirmed receipts, considering reversals and contract caps.
- [ ] Contractual SLAs, false-positive rate, exceptions and processing cost are visible to the client.
- [ ] Human escalation exists for contract disputes, legal ambiguity and uncertain evidence.
- [ ] Secret handling, prompt injection, SSRF, audit trails and least-privilege controls pass threat-model tests.
- [ ] Three paid pilots show verified value, no unapproved actions, and a credible profitable repeatable process.
- [ ] Green typecheck, unit, integration, and production-like end-to-end tests.

## First code delivered

The operations-recovery module provides a **pure eligibility calculation**: discrepancy, evidence flags, scoped-approval reference requirement, independently marked settlement and success-fee computation. It does not ingest real documents, validate external grants, prove that settlement is authentic or send claims.

Its inputs must be produced by trusted validation and permission services. Fail closed on unverifiable, incomplete or inconsistent records.

## Release rule

Only change this gate to ready when each box has attached proof, named reviewer and test outcome. Never state that the company already delivers full outsourced finance operations merely because code, documentation or agent scaffolding exists.
