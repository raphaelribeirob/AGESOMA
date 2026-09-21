# AGESOMA Zero Learning Curve

AGESOMA must be usable by a small-business owner who knows nothing about AI, agents, prompts, workflows, APIs, models or automation.

## Product test

If a person can explain a problem to an employee, friend or service provider, they must be able to use AGESOMA.

No prompt engineering. No agent configuration. No workflow builder. No model selection. No technical setup in the primary experience.

## Canonical interaction

The primary experience is one conversation with AGESOMA.

The owner should be able to:

1. **Ask** — describe what they want to know or get done in normal language.
2. **Follow** — see only relevant progress, blockers and completed work.
3. **Decide** — intervene only when judgment or authorization is required.
4. **Verify** — receive the confirmed result and relevant evidence in the same conversation.

The system owns the complexity between those steps.

## Navigation

The canonical owner experience does not depend on primary dashboard navigation.

Operational state such as work, approvals, team context, results and recommendations should appear contextually inside the conversation. Account and advanced settings may exist outside the core interaction when necessary.

## Language

Never require the customer to understand these concepts:

- AI / IA
- agent / agente
- prompt
- model
- token
- workflow
- orchestration
- tool calling
- R0-R4
- autonomy levels
- Sentinel
- HERMES
- API
- vector memory
- browser automation

Use everyday language instead:

- "O que você quer saber ou fazer na sua empresa?"
- "Vou cuidar disso."
- "Estou trabalhando nisso."
- "Preciso de você para decidir uma coisa."
- "Concluído."
- "Isto foi o que mudou."
- "Isto foi o que custou."

## First-use experience

The first screen should make the next action obvious within seconds.

AGESOMA should answer three implicit questions without requiring navigation:

1. What can I ask?
2. What is AGESOMA doing for me?
3. Does anything require my decision?

When the product has little context, the dominant invitation is:

**O que você quer saber ou fazer na sua empresa?**

Supporting line:

**Explique como explicaria para alguém da sua equipe.**

## Onboarding

Target: under one minute before the owner understands the product.

Initial setup should ask only for information required to create first value, such as:

1. basic company context;
2. team structure or operating context when relevant;
3. the first objective or problem to address;
4. the minimum authorization or connection needed for that objective.

Everything else should be learned progressively or requested when necessary.

Do not ask for technical information the system can discover itself.
Do not ask the same question twice.
Do not force the owner to configure capabilities before experiencing value.

## Defaults

Prefer safe defaults over configuration screens.

AGESOMA should decide internally:

- which model to use;
- whether external research is required;
- which specialist should own the work;
- which connected tool is appropriate;
- how many steps the work requires;
- how temporary execution should be organized;
- when durable background work is useful.

The owner should decide business consequences, not implementation details.

## Permissions

Permission requests must describe the real-world consequence, never the internal capability.

Bad:
"Approve business.act R2 for WhatsApp connector."

Good:
"Posso enviar esta mensagem para estes 12 clientes?"

Bad:
"Grant write access to calendar."

Good:
"Posso marcar reuniões no seu calendário quando o cliente confirmar?"

## Progressive disclosure

Advanced controls may exist for people who need them, but they do not compete with the core conversation.

Hide by default:

- connection scopes;
- execution logs;
- technical costs;
- policy internals;
- memory internals;
- model/runtime settings;
- detailed automation configuration.

Expose them only when the owner asks for detail or when the decision requires it.

## Recognition over recall

Do not require the owner to remember what AGESOMA can do.

When useful, show concrete examples based on current business context, such as:

- "Responder clientes que estão esperando"
- "Recuperar vendas paradas"
- "Organizar cobranças desta semana"
- "Preencher horários vazios"

Examples are shortcuts, not prompt templates.

## Personalization

AGESOMA should learn how the owner works without a personality questionnaire.

Learn progressively from corrections and decisions:

- concise vs detailed updates;
- when to interrupt;
- preference for margin vs speed;
- preferred decision format;
- recurring business priorities.

Personalization may change presentation and prioritization. It never expands authorization.

## Success criteria

A zero-learning-curve release should pass these tests:

- A first-time owner can identify what to do within 5 seconds.
- The first useful request can be made without knowing any AI terminology.
- The core experience does not require dashboard navigation.
- No primary screen contains internal architecture terms.
- No task requires prompt-engineering knowledge.
- Advanced options remain hidden until necessary.
- The system asks for business decisions, not technical decisions.
- A user can leave the app and understand what happened when they return.
- A user can correct or forget learned preferences in ordinary language.

## Canonical principle

> AGESOMA should feel less like operating AI software and more like having a capable operating intelligence working for the business.
