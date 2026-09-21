# Testing

AGESOMA uses layered verification so architectural intent is checked separately from runtime behavior.

## Local commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Behavioral tests

The core behavior suite lives in `packages/core/test/`:

- `request-router.test.mjs` — business-domain and specialist routing;
- `sentinel.test.mjs` — authorization decisions, approval validity and task-state transitions;
- `autonomy.test.mjs` — scoped autonomy matching, limits and deny precedence;
- `outcomes.test.mjs` — execution costs, economic value and verified-outcome learning.

## CI invariants

GitHub Actions also verifies architectural constraints that should not silently regress, including:

- one canonical AGESOMA purpose;
- one conversational owner experience;
- persistent specialist-agent package;
- execution separated from authorization;
- approval scope binding;
- customer-channel tool restrictions;
- tenant-isolation migration requirements;
- production Docker topology;
- web typecheck and build.

Presence checks and architecture invariants are not treated as substitutes for behavioral tests. Production release evidence is tracked separately in [RELEASE_GATES.md](RELEASE_GATES.md).
