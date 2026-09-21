# AGESOMA Documentation

This directory separates product doctrine, technical architecture, safety boundaries and release evidence so reviewers can enter the project at the right level.

## Start here

For a fast technical review:

1. [Architecture](ARCHITECTURE.md) — system boundaries and operating loop.
2. [Product Scope](PRODUCT_SCOPE.md) — what AGESOMA is and deliberately is not.
3. [Release Gates](RELEASE_GATES.md) — implemented capabilities versus production work still required.
4. [Agent Architecture Audit](AGENT_ARCHITECTURE_AUDIT.md) — persistent agent identities and execution model.

## Product and UX

- [Product Doctrine](PRODUCT_DOCTRINE.md) — detailed product principles.
- [Owner Model](OWNER_MODEL.md) — personalization without expanding authority.
- [Zero Learning Curve](ZERO_LEARNING_CURVE.md) — conversational UX doctrine.
- [Communication System](COMMUNICATION_SYSTEM.md) — product communication rules.
- [Visual System](VISUAL_SYSTEM.md) — AGESOMA-specific interface and design rules.

## Intelligence and data

- [Company Brain](company-brain.md) — persistent company context.
- [Company Ontology](company-ontology.md) — business entities and relationships.
- [Authentication](authentication.md) — identity and tenant access model.

## Engineering and evaluation

- [OSS Stack Audit](OSS_STACK_AUDIT.md) — open-source stack evaluation.
- [Testing](TESTING.md) — behavioral suite and CI verification strategy.
- [Release Gates](RELEASE_GATES.md) — production-readiness checklist.

## Security

- [Security Policy](../.github/SECURITY.md) — vulnerability reporting and active security boundaries.
- [Release Gates](RELEASE_GATES.md) — production security and isolation work still requiring evidence.

## Internal implementation vocabulary

Some implementation files reference internal R3 infrastructure or architecture contracts:

- **RiverThree** — R3's internal product/design contract.
- **HERMES** — digital execution substrate.
- **Sentinel** — policy and authorization boundary.
- **Work Cell** — tenant-scoped execution environment.

These names describe implementation boundaries. They are intentionally not part of the normal owner-facing AGESOMA experience.

Historical migration filenames are preserved when changing them could create database-migration ambiguity.
