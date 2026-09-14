# AGESOMA Company Ontology

The Company Ontology is the proprietary semantic layer between provider data and the Company Brain.

Graphiti and Neo4j are infrastructure. The ontology defines what a business fact means inside AGESOMA.

## Canonical entity classes

- `company`
- `person`
- `customer`
- `account`
- `product`
- `service`
- `goal`
- `process`
- `work`
- `decision`
- `conversation`
- `transaction`
- `evidence`
- `outcome`
- `system`
- `resource`

## Canonical relations

- `owns`
- `employs`
- `serves`
- `buys`
- `offers`
- `responsible_for`
- `contributes_to`
- `depends_on`
- `blocked_by`
- `decided_by`
- `discussed_in`
- `produced`
- `verifies`
- `caused`
- `used_by`
- `belongs_to`
- `related_to`

These are intentionally smaller than a provider's schema. A CRM, accounting platform, email provider and support system may use different object names while describing the same canonical company entity.

## Source-backed identity

Provider records are never treated as canonical identity by themselves.

```text
provider object
    ↓
source event + payload hash
    ↓
provider alias
    ↓
canonical AGESOMA entity
    ↓
canonical relations
    ↓
Company Brain / planning context
```

`company_entity_aliases` maps `(tenant, provider, external_type, external_id)` to one AGESOMA entity. This is the initial deterministic entity-resolution layer.

Every entity update and relation can point back to `ontology_source_events`, preserving evidence and event time. The graph may summarize or infer context, but source-backed PostgreSQL records remain the canonical semantic truth.

## Tenant boundary

All ontology tables are tenant scoped and use the same PostgreSQL RLS contract as AGESOMA operational records. The web ingestion endpoints derive the tenant exclusively from the authenticated Better Auth organization → AGESOMA tenant binding.

The browser does not submit a tenant ID.

## P0 ingestion endpoints

`POST /api/ontology/entities`

Upserts a canonical entity by a provider alias. If the alias already exists, the same canonical entity is updated instead of creating another entity.

`POST /api/ontology/relations`

Creates a source-backed relationship between two existing canonical entities in the authenticated tenant.

Both endpoints hash the supplied source payload before storage. Provider webhooks/connectors added in Wave 4 should call these normalization contracts rather than writing raw provider schemas into Graphiti.

## Ownership boundary

Open-source infrastructure may be replaced without changing this layer:

- Graphiti may change;
- Neo4j may change;
- model providers may change;
- integration runtimes may change.

The canonical entity model, relation semantics, entity resolution, business decision logic and outcome semantics are AGESOMA product IP.

## Next step

Wave 4 should connect the first validated business sources to this contract, starting with the smallest set that can prove economic value. Do not add connectors solely to increase connector count.
