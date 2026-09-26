# API Tool Builder

AGESOMA can turn a discovered OpenAPI contract into a reusable read-only tool.

This implements the safe subset of the dynamic-tool pattern:

```text
Discover
  ↓
OpenAPI contract
  ↓
Build
  ↓
Contract validation
  ↓
Register as validated
  ↓
User approval
  ↓
Reuse in planning
  ↓
Controlled R0 execution
  ↓
Run audit + artifact
```

## Automatic build

After `api.discover`, AGESOMA may enqueue `api.tool_build` for the highest-ranked candidate that includes an APIs.guru OpenAPI URL.

The builder:

- fetches the specification only from `api.apis.guru`;
- accepts OpenAPI 3.x or Swagger 2.0;
- requires a public HTTPS API base URL;
- extracts GET and HEAD operations;
- records POST/PUT/PATCH/DELETE/TRACE operations as blocked;
- never calls the discovered API during build;
- performs contract-only validation.

## Validation statuses

### draft

Used when authentication is required or could not be proven absent.

Draft tools cannot execute.

### validated

Only generated when all of the following are true:

- recipe kind is `openapi_readonly`;
- risk is R0;
- the OpenAPI contract is syntactically valid;
- only GET/HEAD operations are exposed;
- the catalog/spec indicates no authentication;
- write permission is false.

Validated still does not mean approved.

### approved

Requires an explicit authenticated user action through `/api/tools`.

Only approved recipes are exposed back to the planner.

### disabled

Stops further reuse immediately.

## Reuse

Approved tools are added to planning context as `approvedApiTools`.

When one fits a task, the execution substrate may return:

```json
{
  "toolInvocation": {
    "recipeId": "<uuid>",
    "operationId": "getRates",
    "arguments": {
      "base": "BRL",
      "symbols": "USD,EUR"
    },
    "summary": "Consultar cotação atual."
  }
}
```

AGESOMA then creates a separate `api.tool_read` R0 task.

The model does not call the provider directly.

## Runtime safety

Before a dynamic read, AGESOMA verifies again:

- recipe belongs to the same tenant;
- recipe status is approved;
- recipe risk is R0;
- auth mode is none;
- recipe kind is `openapi_readonly`;
- operation is registered in the recipe;
- method is GET or HEAD;
- all required path/query parameters are resolved;
- origin remains exactly the registered API origin;
- HTTPS is required;
- DNS may not resolve to private/reserved addresses;
- redirects are rejected;
- credentials/cookies are not sent;
- request timeout is 12 seconds;
- response size is capped at 1 MiB.

The normal task policy still creates an egress decision before external execution.

Every call is recorded in `tool_recipe_runs`.

## First external execution

Contract validation is not represented as a successful provider call.

The first approved invocation is the first external execution test. On success:

- `last_tested_at` is updated;
- `validation.externalExecutionTested` becomes true;
- provider response is persisted as a normal artifact.

## Writes

Generic dynamic writes are deliberately not enabled.

POST, PUT, PATCH, DELETE and TRACE operations are blocked during tool compilation because method alone cannot determine whether the effect is:

- a message;
- a publication;
- a purchase;
- a transfer;
- a subscription;
- an ad-budget change;
- another financial or contractual commitment.

Consequential APIs must use a dedicated connector/action class with the appropriate R2/R3 authorization model.
