# AGESOMA Paid Media

## Purpose

Paid media is a delegated capability of AGESOMA, not a separate product surface.

The user should be able to ask things such as:

- "Como está meu Meta Ads?"
- "O que está desperdiçando dinheiro?"
- "Prepare uma campanha para este produto."
- "Pause a campanha X."
- "Ajuste o orçamento para R$ 100 por dia."

AGESOMA remains the single interface. Provider names, action schemas and credentials stay behind the product surface unless they are needed for a concrete decision.

## Provider strategy

P0 uses Windsor.ai as the provider gateway.

Reasons:

- one reporting API for multiple ad platforms;
- write actions for Meta Ads and other advertising platforms;
- account authorization remains with the provider;
- write schemas can be discovered at runtime instead of hard-coded from memory;
- the existing AGESOMA Credential Broker can isolate the Windsor credential from HERMES.

The current execution adapter supports:

### Meta Ads

Read:

- campaign/account reporting;
- spend;
- impressions;
- clicks;
- CTR/CPC/CPM;
- reach/frequency;
- campaign-level budget context.

Write:

- create campaign, always PAUSED;
- create ad set, always PAUSED;
- create ad, always PAUSED;
- update ad creative;
- pause campaign;
- pause ad set;
- pause ad;
- set campaign budget;
- set ad set budget;
- enable campaign only when the current campaign-level daily budget can be independently read and exactly matches the approved amount.

### Google Ads

Reporting is wired through the broker and Windsor data endpoint.

Write actions are intentionally not enabled in the AGESOMA worker yet. Windsor exposes Google Ads write actions, but AGESOMA must add provider-specific verification for Google budget units, bidding constraints and activation envelopes before those actions can satisfy the same safety standard as Meta.

## Risk model

| Action | Risk |
|---|---|
| Read performance | R0 |
| Create paused campaign/ad set/ad | R2 |
| Update creative | R2 |
| Pause campaign/ad set/ad | R2 |
| Set campaign/ad set budget | R3 |
| Enable campaign | R3 |

Creating an object does not authorize delivery. New objects are forced to PAUSED.

Any action capable of causing spend requires an explicit amount in the approval scope.

Enabling a Meta campaign is denied unless AGESOMA can read the campaign's current daily budget and verify that it exactly equals the amount the user approved.

Ad-set and ad activation are not enabled in P0 because their effective spend envelope depends on campaign/ad-set relationships that must be resolved before authorization.

## Execution chain

```text
User request
    ↓
AGESOMA routes paid-media work
    ↓
Windsor reporting + live action schemas
    ↓
HERMES analyzes / prepares the exact proposed action
    ↓
Sentinel classifies R0/R2/R3
    ↓
User approval for R2/R3
    ↓
Worker consumes exact scoped grant
    ↓
Credential Broker
    ↓
Windsor API
    ↓
Meta Ads
    ↓
Provider response stored as execution evidence
```

## Credential boundary

`WINDSOR_API_KEY` belongs only to the per-tenant Credential Broker.

It must never be injected into:

- HERMES;
- browser automation;
- the web app;
- task payloads;
- database artifacts;
- logs.

Windsor's Connectors API currently authenticates with a query parameter. The broker therefore disables access logging for the Windsor proxy routes.

This remains residual credential exposure risk at the upstream HTTP layer. When the production worker has a stable remote-MCP OAuth client, migrating the provider connection to Windsor MCP OAuth is preferable because the application would no longer need an API key in request URLs.

## Required deployment secret

Set:

```text
WINDSOR_API_KEY=<secret>
```

on the host that provisions the tenant Work Cell.

Do not paste the key into AGESOMA chat or commit it to Git.

## Account authorization

A Windsor-connected advertising account is still required. The connection should be created through Windsor OAuth.

Account IDs are discovered from provider data and become the exact `destination` in the AGESOMA approval scope. They must not be guessed.

## Runtime grounding

When AGESOMA plans paid-media work, the worker retrieves:

1. current reporting data;
2. the live Windsor action list;
3. each allowed action's JSON Schema.

The planner must construct proposed actions from those live schemas. Provider errors remain fail-closed.

## P0 limitations

- Meta is the only write-enabled provider in the AGESOMA worker.
- Google Ads is read-only inside AGESOMA until provider-specific write verification is implemented.
- Conversion/ROAS analysis is limited by which conversion fields are configured and available on the connected account.
- No automatic spend increase is allowed without a new R3 approval.
- No autonomous ad/ad-set activation in P0.
- No provider credential is available to HERMES.

## Next steps

1. Add an in-product paid-media connection screen using Windsor external authorization.
2. Persist connected provider/account handles in `credential_handles`.
3. Add conversion-event selection and normalized CPA/ROAS metrics.
4. Add Google Ads write verification.
5. Add recurring performance watchers with explicit budget ceilings.
6. Add independent post-change verification comparing provider state before and after each write.
