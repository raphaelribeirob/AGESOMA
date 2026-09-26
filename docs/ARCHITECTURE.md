# AGESOMA Architecture

## Product rule

AGESOMA has one job: act as a personal executive assistant.

It remembers useful context, understands the user's current situation, plans work, delegates to internal capabilities, executes authorized digital actions, verifies completion and interrupts the user only when judgment or permission is required.

## Canonical chain

```text
User / desired outcome
        ↓
Personal context + current commitments
        ↓
AGESOMA plans the work
        ↓
Capability selection
        ↓
Isolated digital execution
        ↓
Policy + scoped authorization
        ↓
Completion verification
        ↓
AGESOMA reports what matters
        ↓
Memory learns from corrections and outcomes
```

## Responsibilities

AGESOMA owns:

- user-facing conversation;
- personal context;
- memory and retrieval;
- task planning and coordination;
- prioritization;
- permission requests;
- approval state;
- recurring routines;
- completion verification;
- preference learning;
- deciding when the user should be interrupted.

The execution substrate owns only the digital work explicitly delegated to it:

- browser work;
- computer use;
- APIs;
- files and transformations;
- messaging;
- calendar operations;
- connected-service actions.

The execution layer is never the authorization authority.

## Personal context model

Personal context is broader than preferences. It can include:

- current projects;
- recurring commitments;
- important people;
- work context;
- communication patterns;
- travel and logistical context;
- decisions and corrections;
- user-defined goals;
- connected-service state.

Every memory should have provenance, scope and a path for correction or deletion.

## Authority rule

The executor is never its own authorization authority.

AGESOMA may prepare, draft, research and organize with low friction. External side effects must respect a risk policy and, when required, a scoped grant containing the concrete destination, operation, resource and parameters.

Inference can help determine what the user probably wants. It cannot replace consent.

## Operating loop

```text
Understand the user's state
  ↓
Identify what can be taken off their plate
  ↓
Prioritize
  ↓
Plan and choose capabilities
  ↓
Execute what is authorized
  ↓
Ask only when judgment/permission is required
  ↓
Verify completion
  ↓
Report concisely
  ↓
Learn from correction
  ↺
```

## Core capability domains

P0 prioritizes:

- calendar;
- email and messaging;
- research;
- documents;
- personal administration;
- recurring monitoring.

Finance can provide visibility and administrative preparation before any money-moving capability is considered.

## Customer-facing simplicity

The canonical experience is one AGESOMA conversation.

Technical concepts such as HERMES, Sentinel, Work Cells, models, agents, workflows and routing must remain outside the normal user experience.

## Migration rule

The previous SME operating-intelligence implementation contains valuable execution, authorization and durable-work primitives. Those primitives are retained where useful, but business-specific semantics are being removed from the product surface.

Internal legacy names are migration debt, not product doctrine.
