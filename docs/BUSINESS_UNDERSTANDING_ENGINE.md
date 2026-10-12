# Business Understanding Engine — P0

## Scope

The first AGESOMA Business Understanding Engine stores a conservative, tenant-scoped picture of a company. It makes the *freight recovery service* able to ask about suppliers, contracts, invoices, lanes, tariffs, systems, processes and policies without treating model-generated text as company truth.

It reuses the original company ontology tables (migration 0009): company_entities, company_relations and ontology_source_events, with a new **business_facts** table for temporal, source-traceable assertions.

This branch does **not** install OpenMetadata, Graphiti, Neo4j, PM4Py or Cube. Graphiti/Neo4j appear in the architecture, but live synchronization to those systems is **not demonstrated**. Start with trusted source-of-truth records in PostgreSQL; add graph memory only after the ingest and isolation tests pass.

## States / trust boundaries

- Entity registration means an authorized workspace owner supplied a label and reference. It does **not** prove the organization or contract exists.
- Fact ingestion creates an **unreviewed** assertion linked to an ontology_source_event and evidence reference.
- Owner review can mark a fact **owner_confirmed** or **disputed**, requiring a review note and actor/time stamp.
- Owner confirmation is NOT independent proof of the underlying document, permission to execute actions, or proof of recovered money.
- The read-only snapshot contains current, owner-confirmed facts only. Conflicting active values are excluded and surfaced as conflicts.
- Legacy graph relations are returned only as unverified context; never authorization.
- Each request is authenticated and tenant scoped; only owner/admin can write or review.

## API (proposal implemented on branch, NOT deployed)

Endpoint: /api/business-understanding

Register a company entity:

    POST { "action": "register_entity", "entityType": "supplier", "canonicalName": "Transportadora Exemplo", "externalReference": "carrier-123" }

Register a contract:

    POST { "action": "register_entity", "entityType": "contract", "canonicalName": "Freight 2026", "externalReference": "freight-2026" }

Add a source-referenced assertion, using the returned entity ID:

    POST {
      "action": "record_fact",
      "entityId": "<entity UUID>",
      "factKey": "payment_terms",
      "factValue": "Net 30",
      "evidenceRef": "contract-2026.pdf#page=2",
      "idempotencyKey": "freight-2026-net30-v1",
      "validFrom": "2026-01-01T00:00:00Z",
      "validTo": "2027-01-01T00:00:00Z"
    }

Owner review (not independent external verification):

    PATCH { "factId": "<fact UUID>", "status": "owner_confirmed", "reviewNote": "Validated against signed contract, page 2." }

Read a tenant-scoped snapshot:

    GET /api/business-understanding

GET is bounded to 50 entities, 500 facts and 200 existing relations per request and returns truncated:true when incomplete. Do not use partial snapshots as a complete enterprise audit.

No client can assign tenant IDs, roles, source-event hashes, fact verification flags, or authorization grants.

## Execution gate

1. Apply packages/db/migrations/0021_business_understanding.sql **after existing migrations** in the authorized database environment.
2. Inventory existing ontology rows for cross-tenant references, then VALIDATE the new tenant-bound foreign keys. The new constraints are NOT VALID to avoid breaking existing unreviewed data at migration time.
3. Run npm run typecheck and npm test; add database integration tests for RLS, missing entities, replay and cross-tenant collisions before production.
4. Obtain real client consent / DPA before importing contracts and invoices. Do not ingest secrets or unrestricted personal information.
5. Build document ingestion (CT-e, tariff tables, invoices) with hashes and external verification. Manual evidenceRef strings are not document verification.
6. Add versioned company-relation review workflow, entity corrections/retractions, retention/deletion and independent source adapters.
7. Add controlled Graphiti synchronization only when PostgreSQL provenance and tenant isolation are demonstrated end to end.

## Acceptance tests

- [x] Unit test of conservative temporal snapshot logic, conflicts and tenant-mixing rejection (test code present; CI results pending).
- [x] Database migration authored with tenant RLS and tenant-bound foreign keys (deployment pending).
- [x] Owner-scoped onboarding and fact review API authored (deployment pending).
- [ ] Schema actually applied and verified on Neon.
- [ ] Integration tests with a live isolated PostgreSQL sandbox.
- [ ] Real ingestion of verified CT-e, freight contract and invoice documents.
- [ ] Graphiti/Neo4j integration with source-traced updates.
- [ ] Read/write authorization and rate-limit threat model.
- [ ] Operational customer validation.

**P0 outcome:** a safe contextual ledger and snapshot surface. This is NOT yet enterprise comprehension or a self-running finance department.
