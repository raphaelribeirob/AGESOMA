# AGESOMA P0 Architecture

## Boundary rule

The LLM/execution plane is never its own authorization authority.

```text
Owner intent / business event
        ↓
Opportunity + workflow selection
        ↓
Sentinel: is this allowed?
        ↓
Margin Governor: is this economically rational?
        ↓
Durable job (Postgres / pg-boss)
        ↓
Hermes isolated execution service
        ↓
External systems
        ↓
Outcome Ledger
        ↓
C-Trace + LearningRecord + ROI Mode
```

## Why Hermes is separate

Hermes is treated as an execution substrate. AGESOMA owns tenant isolation, permission policy, economic limits, outcome attribution, learning records and the owner experience. Credentials are not stored in agent context.

## P0 first workflow

Commercial recovery over WhatsApp/CRM/calendar:

1. Observe permitted inbound conversations and lead state.
2. Detect stale qualified opportunities.
3. Classify and estimate recoverable value.
4. Route external actions through Sentinel.
5. Route cost/value through Margin Governor.
6. Execute approved follow-up through Hermes.
7. Record response, meeting, resumed proposal or sale.
8. Attribute revenue only with evidence/confidence.
9. Record all execution costs.
10. Learn from owner corrections and verified outcomes.
