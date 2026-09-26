# Free API Discovery

AGESOMA can discover public/free API candidates before paying for a data provider or falling back to browser automation.

## Sources

The discovery engine uses fixed public catalogs only:

- Public API Lists JSON catalog:
  `https://public-api-lists.github.io/public-api-lists/api/all.json`
- Public APIs directory API:
  `https://api.publicapis.org/entries`
- APIs.guru OpenAPI directory:
  `https://api.apis.guru/v2/list.json`

APIs.guru is used to enrich catalog candidates with machine-readable OpenAPI definitions when a safe match is available.

## Request routing

Examples that route to `api.discover`:

- "Encontre uma API gratuita de câmbio."
- "Procure uma API pública de feriados."
- "Quero uma API sem chave para clima."
- "Pesquise um repositório que libera APIs de graça."

The action is R0 and read-only.

## Ranking

Candidates are ranked by:

1. semantic keyword overlap with name/category/description;
2. no-auth/keyless availability;
3. HTTPS;
4. CORS support;
5. availability of an OpenAPI specification.

Explicit user filters such as "sem chave", "CORS" or "OpenAPI" become hard filters.

## Security boundary

Discovery does **not** grant execution authority.

The engine:

- only fetches three hard-coded catalog URLs;
- rejects localhost/private-network candidate URLs;
- never fetches a discovered candidate endpoint;
- never sends credentials to a discovered API;
- never creates a connected service automatically;
- never converts catalog metadata into approval or authorization.

A discovered API is only a candidate.

Before production integration, AGESOMA must independently verify:

- current pricing/free tier;
- terms of service;
- authentication requirements;
- uptime/reliability;
- data quality;
- privacy/security suitability;
- rate limits;
- whether an official API should be preferred.

## Execution path

```text
User objective
   ↓
api.discover (R0)
   ↓
Public API Lists + Public APIs
   ↓
APIs.guru OpenAPI enrichment
   ↓
ranked candidates
   ↓
artifact only
   ↓
human/system chooses integration
   ↓
normal connector + Sentinel authorization path
```

## Dependency policy

The open-source `BuiltByEcho/public-api-finder` project validates this multi-source discovery pattern and is MIT-licensed, but AGESOMA does not depend on its package at runtime.

The internal implementation is intentionally small and dependency-free so the authorization and network boundary remain under AGESOMA control.
