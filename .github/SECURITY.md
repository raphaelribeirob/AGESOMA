# Security Policy

AGESOMA is an active pre-production project with security-sensitive authorization, tenant-isolation and execution-boundary code.

## Reporting a vulnerability

Do not publish credentials, tokens, customer data, exploit payloads or reproducible attack details in a public issue.

If GitHub private vulnerability reporting is available for this repository, use that channel. Otherwise, open a minimal public issue requesting a private contact channel and omit sensitive technical details until a private channel is established.

## Security boundaries under active validation

The current release gates explicitly track:

- authenticated tenant binding;
- forced tenant row-level security;
- scoped and expiring approval grants;
- tenant-isolated Work Cells;
- executor egress controls;
- credential isolation from HERMES;
- outcome verification independent from executor claims;
- prompt-injection, approval-replay and duplicate-execution testing.

See [docs/RELEASE_GATES.md](../docs/RELEASE_GATES.md) for the current production-readiness state.

## Secrets

Never commit production secrets. Use the provided example environment files only as configuration templates.
