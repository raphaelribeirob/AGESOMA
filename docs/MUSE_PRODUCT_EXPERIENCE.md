# MUSE-style Product Experience

AGESOMA uses public MUSE interaction patterns as product inspiration without copying Meta assets or proprietary implementation.

## Product model

The user should experience one personal agent, not a dashboard of internal agents.

Primary surfaces:

1. Chat
2. Goals
3. Ideas
4. Artifacts

Secondary agent-state surfaces:

- Activity
- Memory
- Permissions / Connections

The AGESOMA orb remains the product's own avatar identity.

## Chat

Chat is a persistent conversation, not a disposable request transcript.

Migration 0017 introduces:

- one persistent main conversation per tenant;
- persistent side chats;
- messages associated with a thread;
- optional task/artifact provenance.

The main conversation remains the default cockpit. Side chats are used for focused contexts, especially when opening a completed artifact.

Background task completions are written back to the originating conversation by the worker.

## Agent status

The top-level avatar is compact and functional.

It communicates states such as:

- available;
- working on a request;
- listening;
- waiting for a decision.

Selecting the avatar opens the Activity drawer.

## Activity

Activity uses the existing `activity_events` source of truth rather than exposing internal runtime logs.

The drawer also surfaces a compact view of:

- active personal memory;
- connected services and granted permissions.

Detailed editing remains under Settings.

## Goals

Goals use the existing first-class `goals` table and API.

The product surface emphasizes:

- title;
- description;
- progress;
- active / paused / completed state.

Goals are persistent objectives, not authorization.

## Ideas

Ideas are derived from three sources:

1. persisted `opportunities` produced by watchers/tasks;
2. active goals;
3. active connected services.

Persisted opportunities remain the authoritative proactive object.

Goal- and connection-derived suggestions are lightweight personalized discovery prompts. Choosing an idea returns the user to Chat and delegates the outcome in natural language.

## Artifacts

Artifacts already exist in the worker output pipeline.

The UI exposes them as first-class result objects instead of forcing every result into chat text.

Artifacts show:

- type;
- title;
- originating objective;
- content;
- timestamp.

A user may open a side chat from an artifact, preserving provenance to the source task/artifact.

## Approval v2

Approval UI is generated from the same canonical capability scope used by backend authorization.

The user sees, when available:

- exact destination;
- service/resource;
- operation;
- amount;
- relevant parameters.

The decision actions are explicit:

- Deny;
- Allow.

A denial is persisted as a real task decision instead of only dismissing UI.

## Memory and permissions

Memory and permissions are visible from the agent-state drawer and editable in Settings.

The drawer is read-oriented and quiet.

Settings remains the authoritative mutation surface for:

- correcting/deleting personal context;
- connection permissions;
- proactivity;
- learned tools.

## Side chats

Side chats are persistent and tenant-isolated.

Each side chat may reference:

- parent conversation;
- source task;
- source artifact.

They do not create a new personal runtime. They are logical conversation contexts on top of the same tenant-isolated persistent runtime.

## Visual system

The interaction architecture follows the public patterns researched from MUSE:

- white canvas;
- restrained borders;
- compact agent identity/status;
- conversational bubbles;
- editorial Goals / Ideas;
- structured decision cards;
- first-class artifacts;
- quiet activity timeline.

The visual identity remains AGESOMA:

- organic blue intelligence orb;
- RiverThree typography;
- existing black/white product language;
- no Meta/MUSE character, illustration, logo or asset reuse.

## Deployment

Apply migrations in order through:

```text
0011_personal_assistant_foundation.sql
0012_muse_parity_runtime_attention.sql
0013_api_tool_builder.sql
0014_muse_trust_boundary.sql
0015_forced_egress_and_authd_acl.sql
0016_browser_subagent_safety.sql
0017_muse_product_experience.sql
```

Then deploy the web/worker code and re-provision Work Cells as required by earlier trust-boundary migrations.
