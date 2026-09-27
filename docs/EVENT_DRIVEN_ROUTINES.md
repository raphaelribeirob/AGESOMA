# AGESOMA Event-Driven Routines

Routines can now begin from time or events without exposing internal workers to the user.

## Trigger types

- `cadence` — scheduled observation dispatched by the worker.
- `webhook` — public HTTPS ingress authenticated by a high-entropy per-routine secret.
- `event` — internal connector ingress authenticated by `AGESOMA_INTERNAL_API_TOKEN`.
- `manual` — reserved in the data model; not yet exposed as an execution surface.

All event-driven runs enter as `business.observe` / R0.

An event is data, never authority.

## Webhook flow

```text
External system
   |
   | Authorization: Bearer <one-time-shown secret>
   v
/api/routines/webhook/<routine-id>
   |
   | SHA-256 secret verification
   | payload <= 64 KiB
   | rate limit
   | optional x-agesoma-event-id
   v
routine_events (pending)
   |
   | durable dispatcher
   v
shared routine eligibility
   |
   | proactivity enabled?
   | kind allowed?
   | goal active?
   | connection active?
   | no active task?
   v
business.observe / R0
   |
   v
Persistent Worker
```

The raw webhook secret is returned only when the routine is created. The database stores only its SHA-256 hash.

Pausing the routine makes the webhook unusable and revokes the stored webhook secret.

## Connector event flow

Trusted AGESOMA connector infrastructure can POST to:

`/api/routines/events`

with the internal API bearer token and:

- `tenantId`
- `eventKind`
- `source`
- optional `idempotencyKey`
- JSON-object `payload`

The ingress fans the event out only to active `event` routines whose
`trigger_config.eventKind` matches exactly.

## Durable inbox

`routine_events` is the durable event inbox.

States:

- `pending`
- `dispatched`
- `dropped`
- `failed`

Dispatch uses `FOR UPDATE ... SKIP LOCKED` semantics through an atomic lease update.

Every dispatched task carries `routineEventId`. A unique task index and recovery lookup prevent duplicate task creation if a worker crashes between task creation and event settlement.

## Trust boundary

Event payload is injected as:

```json
{
  "trust": "external_untrusted",
  "instructionsAreAuthority": false
}
```

Webhook or connector payload never:

- changes system instructions;
- grants permissions;
- creates an R2/R3 action directly;
- bypasses Sentinel;
- bypasses the tenant or worker monthly budget;
- bypasses quiet hours / Attention Engine rules.

If observed data suggests a consequential action, the normal task may only propose the action. The consequential action must be resolved into the existing approval path.

## Rate and size limits

Webhook payloads are limited to 64 KiB.

Default webhook rate limit:

`AGESOMA_ROUTINE_WEBHOOK_MAX_PER_HOUR=120`

Callers should send a stable `x-agesoma-event-id` when the source supplies an event identifier. Repeated IDs are acknowledged but deduplicated.
