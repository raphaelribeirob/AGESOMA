# AGESOMA Product Scope

## One job

AGESOMA is an **AI-native business operations** company that sells completed, measurable services to enterprises. It is software internally and an accountable operations provider externally.

The primary buyer is the financial or operations leader of a company with measurable, recurring manual processing costs and loss leakage. The first outcome is **recover freight overcharges and prevent repeat losses**. The software stack is a means to fulfill a service contract, not the standalone product being sold.

## What the customer buys

1. A bounded scope of outsourced work with a named accountable operator.
2. Evidence-backed discrepancies and transparent calculations.
3. Client-approved corrective actions, never inferred consent.
4. Verified financial results and auditable service-level reporting.
5. Clear service pricing, with any recovery success fee tied to verified received funds.

## First service boundary: freight audit

**Inputs:** authorized contracts, rate tables, CT-e/freight documents, freight invoices and eventual settlement confirmations.

**Outputs:** discrepancy case, evidence references, approval request, claim status, verified recovered amount, fee eligibility, SLA evidence.

**Not in P0:** bank transfers, unilateral changes to contracts, collections without approval, automatic regulatory advice, replacing the customer's ERP, general-purpose finance-autopilot claims.

## Customer-facing experience

The canonical experience is an **operations service with a concise client workspace**: cases, approvals, proven recoveries, exceptions, audit trails and SLAs. Agent names, model selection and workflow authoring are internal.

## Architecture principles

1. Every case is tenant-isolated and tied to an explicit contract and service scope.
2. Source documents carry provenance and trusted verification state.
3. Models may propose and classify; independent validators decide verification.
4. Case detection is not booked recovery, cash received or proof of ROI.
5. Consequential actions use Sentinel and task-scoped, expiring approvals.
6. Financial success fees require external settlement proof and agreement terms.
7. External calls are idempotent, logged and retry-safe.
8. Humans handle disputed documents, ambiguous terms and risky edge cases.
9. SLA, quality, processing cost and margin are measurable per customer.
10. Business memory never grants authority.

## P0 proof

Deliver the complete authorized loop with three paid pilot customers:

- ingest data with permission and source identification;
- detect a real freight overcharge;
- produce a reproducible evidence packet;
- validate the case with an accountable reviewer;
- obtain client approval before external submission;
- reconcile the real recovered amount with a verified settlement;
- calculate contracted fees and unit costs;
- demonstrate a repeatable path to a positive service gross margin.

No AI-driven external financial execution launches before this proof and the release gate.

## Product portfolio

AGESOMA Operations is canonical. The personal executive-assistant implementation is **legacy compatibility / a possible independently branded product later**. Do not allow a personal-assistant roadmap or generic assistant features to displace the freight-recovery P0.

The existing personal UI, database concepts and runtime remain during migration. This document expresses intended positioning, **not a claim that the current frontend already matches it**.
