# InstantWork Communication System

InstantWork is built as Service-as-a-Software: the customer buys work and verified business outcomes, not an AI tool.

## Canonical promise

**pt-BR:** Diga o resultado que precisa. O InstantWork faz o trabalho.

**en:** Tell us the outcome you need. InstantWork does the work.

Supporting proof line:

**pt-BR:** Veja o que foi feito, quanto custou e qual resultado foi comprovado.

**en:** See what was done, what it cost, and which result was verified.

## Initial commercial wedge

**pt-BR:** Recupere vendas que sua empresa está deixando para trás.

InstantWork identifies qualified opportunities that stopped moving, follows up within approved business rules, helps move them to a meeting or sale, and only counts value when the result has evidence.

The long-term product may perform many kinds of work for an SME. The commercial entry point should remain concrete and measurable until the first workflow is proven.

## Public-language rules

1. Sell the work, never the machinery.
2. Lead with the business result, then the work completed, then proof and cost.
3. Do not require the owner to understand AI, agents, models, orchestration or architecture.
4. Describe autonomy through behavior: what InstantWork can do, when it needs approval, and what it proved.
5. Prefer money, meetings, sales, customers, time saved, cost and return over technical metrics.
6. Never call an action a result. A message sent is work performed; a confirmed meeting, payment or externally verified state change can be a result.
7. When InstantWork cannot act without permission, say exactly what decision is needed and why.
8. The owner experience should read like a service company reporting completed work, not a developer console reporting agent activity.
9. Do not use the term **ROI** in customer-facing UI, onboarding, marketing or reports. Demonstrate value directly with the underlying facts: money recovered, revenue confirmed, work cost, return after cost, meetings, time saved and other verified outcomes.

## Public vocabulary

Prefer:

- Trabalho
- Resultado
- Resultado comprovado
- Dinheiro recuperado
- Receita comprovada
- Custo do trabalho
- Retorno líquido
- Valor comprovado
- Oportunidade
- Reunião confirmada
- Venda
- Cliente
- Preciso da sua autorização
- Trabalhando
- Concluído
- Comprovado
- Precisa de você

## Internal-only vocabulary

Do not lead with these terms in customer-facing product or marketing copy:

- ROI
- AI agent / agente de IA
- Autonomous Business Operator
- Business Operator
- Hermes
- Sentinel
- Margin Governor
- workflow
- outcome contract
- Outcome Ledger / Value Ledger
- Trust Plane
- cognitive architecture
- R0-R4
- L0-L4 autonomy levels
- model / token / API / browser cost breakdown

These terms remain valid in engineering, security, architecture and compliance documentation.

## Translation layer

| Internal concept | Customer language |
| --- | --- |
| Agent/workflow running | Trabalhando |
| Sentinel review | Preciso da sua autorização |
| Sentinel deny | Não posso fazer isso dentro das regras atuais |
| Outcome verified | Resultado comprovado |
| Outcome pending evidence | Aguardando confirmação do resultado |
| Execution cost | Custo do trabalho |
| Attributed revenue | Dinheiro recuperado / receita comprovada |
| ROI / economic return | Dinheiro recuperado + custo do trabalho + retorno líquido |
| Margin Governor replan | O custo não compensa; vou buscar outra forma |
| Opportunity detection | Encontrei uma oportunidade |
| Learning record | Aprendi com esta decisão |

## UI hierarchy

Every owner-facing screen should prioritize information in this order:

1. What changed for the business?
2. What work did InstantWork do?
3. What result is proven?
4. What did the work cost?
5. What remains after the cost?
6. What needs the owner's decision?
7. What should happen next?

Architecture and AI details belong behind an administrative or technical layer, never in the primary experience.

## Canonical home language

Headline direction:

**O que o InstantWork fez — e quanto isso valeu para o seu negócio.**

Primary operating prompt direction:

**O que você precisa resolver?**

Preferred acknowledgement after delegation:

**Vou cuidar disso.**

Then show the agreed business contract in plain language:

- Objetivo
- O que conta como resultado
- Limite de custo
- Quando preciso da sua autorização
- Como o resultado será comprovado

## Pricing-language principle

Do not position InstantWork as software sold per seat. A low-cost subscription may provide access, but value must be measured around work performed and verified outcomes. Pricing experiments should make the relationship between work, cost and business value increasingly visible.

## Sequoia alignment test

Before shipping public copy, ask:

> If every reference to AI, agents and software disappeared, would a small-business owner still immediately understand what work InstantWork performs and why it is worth paying for?

If the answer is no, rewrite the copy.
