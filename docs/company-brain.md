# AGESOMA Company Brain

The Company Brain is AGESOMA's tenant-scoped operating memory. It is not an authorization system and it does not replace PostgreSQL as the source of operational truth.

## Responsibilities

The Company Brain converts business events into a temporal knowledge graph that AGESOMA can retrieve before reversible planning work.

It stores and relates facts about:

- people and responsibilities;
- customers and accounts;
- products and services;
- goals and priorities;
- processes and recurring work;
- decisions and their context;
- completed AGESOMA tasks and evidence-bearing results;
- systems, resources and business relationships;
- facts that become valid or invalid over time.

## Stack

- Graphiti `0.29.3`: temporal knowledge graph ingestion and retrieval.
- Neo4j `5.26`: graph persistence.
- PostgreSQL + pgvector: canonical operational records remain here.
- AGESOMA worker: recalls Company Brain context before `business.observe` and `business.work` execution, then writes successful task completions back as episodes.
- HERMES: receives selected memory as context only.

## Trust boundary

Company Brain facts are context, not proof and not authority.

The following rules are mandatory:

1. Sentinel remains the authorization boundary.
2. A Company Brain fact cannot create or widen a capability grant.
3. `business.act` and `business.commit` are not enriched from the graph before execution; their approved capability payload remains exact.
4. Time-sensitive facts must be re-verified when they materially affect a result.
5. The executor cannot mark its own economic outcome as verified.
6. Tenant isolation is enforced by Graphiti `group_id`, using the AGESOMA tenant ID.
7. The Brain API is internal-only and requires `AGESOMA_BRAIN_INTERNAL_API_TOKEN`.

## Runtime flow

```text
PostgreSQL operational truth
          │
          │ task queued
          ▼
    AGESOMA worker
          │
          ├── recall relevant facts ───────► Company Brain
          │                                  Graphiti + Neo4j
          │
          ├── selected context
          ▼
       HERMES
          │
          ▼
   completed work
          │
          ▼
PostgreSQL + artifacts
          │
          └── successful task episode ────► Company Brain
```

## Local startup

Copy `.env.example` to `.env`, provide strong values for `NEO4J_PASSWORD` and `AGESOMA_BRAIN_INTERNAL_API_TOKEN`, and provide `OPENAI_API_KEY` for Graphiti inference/embeddings.

Then run:

```bash
docker compose up -d postgres neo4j brain
```

The local endpoints are bound to loopback only:

- Brain: `http://127.0.0.1:8081`
- Neo4j Browser: `http://127.0.0.1:7474`
- Neo4j Bolt: `bolt://127.0.0.1:7687`

The worker must receive the same Brain token and use `AGESOMA_BRAIN_URL=http://brain:8080` when it runs inside the same Docker network, or `http://localhost:8081` when it runs on the host.

## API

`POST /v1/search`

```json
{
  "tenant_id": "tenant-id",
  "query": "context relevant to increasing sales this week",
  "limit": 10
}
```

`POST /v1/episodes`

```json
{
  "tenant_id": "tenant-id",
  "name": "crm.customer.updated",
  "source_description": "CRM webhook",
  "content": {
    "customer": "Acme",
    "status": "at_risk"
  }
}
```

Both endpoints require the `x-agesoma-brain-token` header.

## Next expansion

The next layer should ingest provider-backed events from CRM, billing, support, email and messaging connectors. Those events should be normalized before Graphiti ingestion so the proprietary asset becomes the AGESOMA company ontology and entity-resolution layer rather than a collection of raw documents.
