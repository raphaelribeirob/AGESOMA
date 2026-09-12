# InstantWork Zero Learning Curve

InstantWork must be usable by a small-business owner who knows nothing about AI, agents, prompts, workflows, APIs, models or automation.

## Product test

If a person can explain a problem to an employee, friend or service provider, they must be able to use InstantWork.

No prompt engineering. No agent configuration. No workflow builder. No model selection. No technical setup in the primary experience.

## Core interaction

The default loop is:

1. **Pedir** — say what needs to be resolved in normal language.
2. **Acompanhar** — see only what is happening, what finished and what is blocked.
3. **Decidir** — answer only when InstantWork truly needs the owner.
4. **Ver o resultado** — see the confirmed change, cost of the work and what remained after the cost.

The system owns the complexity between those steps.

## Navigation

Primary navigation should remain minimal:

- Início
- Pedir
- Trabalhos
- Conta

Opportunities, approvals, results, connections, permissions and advanced settings should appear contextually or behind progressive disclosure instead of competing in the primary navigation.

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
- Hermes
- API
- vector memory
- browser automation

Use everyday language instead:

- "O que você precisa resolver?"
- "Vou cuidar disso."
- "Estou trabalhando nisso."
- "Preciso de você para decidir uma coisa."
- "Concluído."
- "Isto foi o que mudou."
- "Isto foi o que custou."

## Home

The home screen should answer only three questions:

1. O que está acontecendo agora?
2. Existe algo que precisa de mim?
3. O que mudou desde a última vez que entrei?

Do not lead with dashboards, architecture, configuration or generic metrics.

When the product has no context yet, the dominant action is simply:

**O que você precisa resolver?**

Supporting line:

**Explique como explicaria para alguém da sua equipe.**

## Onboarding

Target: under one minute before the owner understands the product.

Maximum initial setup:

1. What do you want to solve first?
2. Where does this work happen today? (WhatsApp, email, CRM, spreadsheets, etc.)
3. How far may InstantWork go without asking you?
4. Review a simple summary and continue.

Everything else should be learned progressively or requested when it becomes necessary.

Do not ask for technical information the system can discover itself.
Do not ask the same question twice.
Do not force the owner to configure capabilities before experiencing value.

## Defaults

Prefer safe defaults over configuration screens.

InstantWork should decide internally:

- which model to use
- whether to browse
- whether to delegate research
- which connected tool to use
- how many steps the task requires
- how to organize temporary work
- whether a background watcher is useful

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

Advanced controls exist for people who want them, but they do not appear until relevant.

Hide by default:

- connection scopes
- execution logs
- technical costs
- policy internals
- memory internals
- model/runtime settings
- detailed automation configuration

Expose them in Account / advanced settings, not in the core task flow.

## Recognition over recall

Do not require the owner to remember what InstantWork can do.

When useful, show concrete examples based on current business context, such as:

- "Responder clientes que estão esperando"
- "Recuperar vendas paradas"
- "Organizar cobranças desta semana"
- "Preencher horários vazios"

Examples are shortcuts, not prompt templates.

## Personalization

InstantWork should learn how the owner works without a personality questionnaire.

Learn progressively from corrections and decisions:

- concise vs detailed updates
- when to interrupt
- preference for margin vs speed
- preferred decision format
- recurring business priorities

Personalization may change presentation and prioritization. It never expands authorization.

## Success criteria

A zero-learning-curve release should pass these tests:

- A first-time owner can identify what to do within 5 seconds.
- The first useful request can be made without knowing any AI terminology.
- No primary screen contains internal architecture terms.
- No task requires prompt-engineering knowledge.
- Advanced options are hidden until necessary.
- The system asks for business decisions, not technical decisions.
- A user can leave the app and understand what happened when they return.
- A user can correct or forget learned preferences in ordinary language.

## Canonical principle

> InstantWork should feel less like using AI and more like having a capable person working for the business.
