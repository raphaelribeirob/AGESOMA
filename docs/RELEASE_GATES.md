# Release gates

## P0

- [ ] Postgres/pgvector reachable.
- [ ] One tenant can be created and isolated.
- [ ] Sentinel blocks R4 and reviews R3.
- [ ] Margin Governor blocks economically negative work.
- [ ] `agesoma.execute` survives worker restart.
- [ ] Hermes runs outside the web process in an isolated runtime.
- [ ] First external write requires explicit scoped approval.
- [ ] Every action has C-Trace metadata.
- [ ] Every successful workflow produces an OutcomeEvent.
- [ ] OutcomeEvent contains execution cost + attribution evidence.

## P1 gate before platform expansion

- [ ] One paying customer.
- [ ] One workflow completes end-to-end in production.
- [ ] Revenue/outcome attribution is recorded.
- [ ] Unit economics are positive or explainably bounded.
- [ ] Human correction rate is measured.

Only after this gate: Temporal, full Studio, Builder, broad Computer Use, marketplace and advanced multi-agent expansion.
