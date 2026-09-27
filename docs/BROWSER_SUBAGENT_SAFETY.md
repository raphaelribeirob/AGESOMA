# Browser Subagent and Safety Boundary

## Goal

AGESOMA must be able to browse without giving the untrusted HERMES runtime raw DOM, JavaScript execution, Chrome DevTools Protocol access, Steel credentials or direct internet access.

The browser path is:

```text
HERMES
  |
  | narrow Browser Broker API
  v
Browser Broker
  |                  \
  |                   -> Browser Safety
  v
Browser Subagent
  |
  | local opaque CDP URL
  v
Browser CDP Gateway
  |
  | fixed connect.steel.dev + Steel credential
  v
Steel browser
```

HERMES can see only accessibility-tree snapshots that pass Browser Safety.

## Browser Subagent

The Browser Subagent uses pinned `agent-browser@0.38.1` against a local CDP Gateway.

Its public internal surface contains only:

- snapshot;
- navigate;
- click;
- fill;
- press;
- select;
- check/uncheck;
- scroll.

It does not expose:

- `eval`;
- JavaScript execution;
- raw DOM/HTML;
- file upload;
- CDP URLs;
- DevTools;
- WebMCP/page-provided tools.

`AGENT_BROWSER_NO_WEBMCP=1` is forced for every command.

Snapshots are compact accessibility-tree views with stable element refs such as `@e1`. The browser-driving service keeps CDP details outside HERMES.

## CDP Gateway

The CDP Gateway is the only service in this path with browser-control internet egress.

It accepts only:

```text
ws://browser-cdp-gateway:8088/v1/cdp
```

with a per-tenant opaque token plus `taskId` and `sessionId`.

Before opening the upstream WebSocket it:

1. asks Trust Store whether the Steel session is live and belongs to that tenant/task;
2. asks Authd for the `browser_cdp_gateway:browser.cdp` Steel capability;
3. constructs the upstream itself using fixed host `connect.steel.dev`;
4. bridges CDP frames without returning the external URL or Steel key.

The client cannot choose the upstream host.

## Independent Browser Safety

Browser Safety is a separate service from HERMES and from Browser Subagent.

It classifies both observed content and proposed actions.

### Content signals

Current v1 detects high-confidence text signatures for:

- attempts to override system/developer/assistant instructions;
- requests to reveal system/developer instructions;
- tool/credential steering;
- attempted credential/private-data exfiltration.

A combined prompt-injection + exfiltration signature is blocked.

A standalone suspicious instruction is returned as `REVIEW`.

When content is `REVIEW` or `BLOCK`, Browser Broker does not return the raw accessibility snapshot to HERMES.

### Action signals

Browser Safety blocks:

- password/passcode/PIN fields;
- OTP/2FA/MFA/verification-code fields;
- card/CVV/bank credential fields;
- private/API/secret/recovery-key fields;
- secret-like values;
- unsafe navigation targets;
- unknown/stale element refs;
- unapproved keyboard shortcuts;
- unsupported browser verbs.

It requires review for:

- purchases/checkouts/payments;
- money transfers/withdrawals;
- account deletion;
- public posting/publishing;
- generic submit/confirm/send/download/authorize actions;
- Enter when it may submit a form.

`REVIEW` is fail-closed in this phase: the browser action is not executed. HERMES must surface the blocker rather than trying another route.

## Network isolation

```text
tenant_cell
  HERMES <-> Browser Broker

browser_control_cell (internal)
  Browser Broker
  Browser Safety
  Browser Subagent
  Browser CDP Gateway

browser_cdp_outbound
  Browser CDP Gateway only
```

HERMES is not attached to `browser_control_cell` or `browser_cdp_outbound`.

Browser Subagent and Browser Safety have no external network.

## Persistent audit

Migration `0016_browser_subagent_safety.sql` adds:

- browser-session safety state;
- last snapshot timestamp;
- Browser Subagent / Browser Safety / Browser CDP trust zones;
- the `browser_cdp_gateway:browser.cdp` Steel credential scope.

Safety decisions are written to `runtime_events` without storing fill values or credentials.

## Relation to Meta MUSE

This phase adopts the public design pattern Meta describes: a separate browser broker/sub-agent, accessibility-tree representation instead of raw DOM, no script verbs, and independent prompt-injection/action checks. Meta additionally describes image/media/file classifiers, human takeover pausing, secure credential form injection, malicious-site intelligence and stronger host/kernel enforcement. Those are not claimed as implemented here.

## Remaining browser gaps

- image/media prompt-injection classifier;
- downloaded-file prompt-injection classifier;
- authenticated human-takeover viewer with hard agent pause;
- secure password/OTP/payment credential injection;
- known-malicious-site intelligence;
- browser-network egress enforcement inside the remote Steel browser itself;
- broader adversarial/red-team corpus for Browser Safety.
