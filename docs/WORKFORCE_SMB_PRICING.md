# AGESOMA Workforce — preço de entrada para PMEs brasileiras (proposta v2)

Data: 2026-10-16. **NÃO APROVADA; não publicada; nenhum cliente cobrado; 4 computadores NÃO implantados.**

Este documento substitui a tabela em dólares de `WORKFORCE_BILLING.md`. O motor de cálculo original em USD permanece válido como medidor de custo de provedores. A UX e os planos brasileiros, quando ativados, usam **BRL**.

## Princípio do produto

O PME NÃO compra um prompt, um bot avulso, tokens ou horas de GPU. Contrata um serviço de equipe executiva pré-configurada, com preço previsível, redução de trabalho e aprovação de riscos.

4 identidades e papéis fixos desde o primeiro acesso: **CEO+COO** (conhecer empresa e operacionalizar), **CFO**, **CMO+CRO**, **CTO+CPO**. Isso não equivale a 4 VMs sempre ligadas. O CEO é primeiro e prioriza o trabalho, sem acesso implícito às credenciais dos demais.

O atendimento FAQ atual é um produto específico, não deve ser renomeado ou substituir os planos do Workforce sem migração explícita de SKU e direitos.

## Experiência de entrada

**Diagnóstico inicial R$0, escopo manual e limitado**: CEO coleta informações da empresa, solicita confirmação explícita de origem/proprietário e cria mapa de conhecimento. O protótipo atual não faz ingestão automática da empresa; o usuário insere dados. Nenhuma tarefa autônoma, computador nem token ilimitado grátis. Uma futura síntese por IA pode ser liberada apenas após orçamento e privacy review.

**Essencial R$49/mês**, foco micro e pequenas empresas que precisam de primeiras rotinas. **Crescimento R$129/mês**, para empresas com duas frentes simultâneas. **Pro R$249/mês**, para empresas maiores que executam até quatro computadores em paralelo, quando a infraestrutura for homologada.

| Oferta | R$/mês | 4 perfis CEO, CFO, CMO, CTO | Franquia comercial de execução | Concorrência de computadores |
| --- | ---: | --- | ---: | ---: |
| Diagnóstico | R$0 | CEO coleta contexto inicial; os demais são apenas preview | R$0 | 0 |
| Essencial | R$49 | 4 perfis inclusos | R$8 (800 centavos em créditos AGE) | 1 |
| Crescimento | R$129 | 4 perfis inclusos | R$30 (3.000 créditos AGE) | 2 |
| Pro | R$249 | 4 perfis inclusos | R$75 (7.500 créditos AGE) | até 4 |

**Franquia comercial:** 1 crédito AGE = R$0,01 de preço final de consumo interno. Não é moeda, saldo sacável nem taxa de conversão para tokens. O valor da franquia não garante número fixo de tarefas. Ela se esgota de acordo com o orçamento aprovado por tarefa e modelo. A quantidade de computadores é limite de concorrência, não promessa de provisionamento atual. **Não permitir excedente automático**. Recarregamento pré-pago sugerido: R$30/R$60/R$150 apenas após aprovação de preço/compliance, sempre com consentimento e gastos máximos.

### Por que R$49 e não dólares?

A antiga oferta em USD exigia uma mensalidade de entrada muito alta em BRL. Ao cobrar na moeda nacional e não manter quatro computadores ociosos ligados, podemos atender clientes menores sem subsidiar consumo ilimitado. Quatro personas executivas continuam no app; o que varia é orçamento de execução e número de sessões paralelas.

### Como preservar qualidade com baixa infraestrutura

1. **API antes de computador**: consultar CRM/planilha/dados autorizados por API, com a menor permissão; só abrir desktop Linux quando API não resolve.
2. **Fluxo determinístico antes de IA**: cálculo, deduplicação, roteamento e checagens de política em código normal, sem cobrar tokens para operações triviais.
3. **Roteamento de modelos**: Gemini 2.5 Flash-Lite pago para classificação/extratos simples (em 16/10/2026: US$0,10/1M entrada, US$0,40/1M saída); Gemini 3.1 Flash-Lite pago para tarefas intermediárias (US$0,25/1M entrada, US$1,50/1M saída). Escalar a modelo premium só quando testes/evidências e aprovação de custo justificarem.
4. **Batch e cache**: reutilizar contexto estável autorizado; fazer trabalhos não urgentes em batch somente se modalidade suporta; reduzir contexto a fatos confirmados e recuperados. Evitar enviar documentação integral de forma repetida.
5. **Linux sob demanda**: um sandbox por sessão quando necessário, limite de vida, hibernação/destruição e isolamento comprovado em host real; não afirmar persistência de VM antes de validar runtime.
6. **Limites por tenant e tarefa**: tempo máximo, teto de tokens e tentativas, modelo permitido e orçamento autorizado. Circuit breakers e cancelamento real servidor.
7. **Privacidade**: não utilizar indiscriminadamente APIs de camada gratuita para dados confidenciais. O Google avisa que conteúdos do free tier podem ser usados para aprimorar produtos, ao contrário do paid tier. Dados financeiros exigem isolamento e autorização adequada.
8. **Planejar custo em centavos**: valores de API podem mudar, e a fatura de fornecedor depende de modalidade, região, cache, áudio, imagens, pesquisa e ferramentas. Registrar por `model_id` e catálogo versionado, não fixar no front-end.

Referências verificadas em 16/10/2026:
- Google preços: https://ai.google.dev/gemini-api/docs/pricing
- Paddle taxa padrão: https://www.paddle.com/pricing (5% + US$0,50 / checkout)
- Stripe Brasil: https://stripe.com/br/pricing (3,99% + R$0,39 cartão nacional; Pix 1,19% **por convite**)
- OpenRouter https://openrouter.ai/pricing (plano padrão com fee, normalmente evitar no caminho principal se integração direta for mais barata).

## Cálculo interno (sem tokens expostos ao cliente)

1. `quoteWorkforceExecution` em `packages/core/src/workforce-metering.ts`: custo variável em **microUSD**, medindo input, cache hit/write, output, VM ativa, ferramentas e outros custos reais.
2. `quoteBrlWorkCredits` em `packages/core/src/workforce-smb-pricing.ts`: converte ao câmbio oficial/servidor definido (FX versionado por execução), aplica reserva de variação e margem-alvo de consumo; arredonda **em reais no final**, não arredonda cada modelo em centavos de dólar para evitar cobranças excessivas de microtarefas.
3. **Exemplo hipotético de FX R$5,50/USD** (não cotação real): custo US$0,05 = R$0,275; colchão 10% = R$0,3025; preço com meta de 60% contribuição = R$0,75625, arredondado para **R$0,76 = 76 créditos AGE**.
4. A empresa conhece a estimativa e o limite máximo em BRL antes de aprovar uma ação. Ao finalizar, mostrar execução real, custo, saldo, economias e resultado verificável.
5. Os cálculos atuais são puros: **não consultam FX, não cobram clientes, não reservam saldo**. Câmbio, índices de preço, fonte, coleta de usage e carteira são dependências futuras.

## Economia unitária: hipóteses conservadoras

Abaixo assumimos **clientes que consumiram 100% da franquia mensal**, 60% de margem no consumo, USD/BRL **R$5,50 hipotético**, taxa Paddle 5% + US$0,50 / cobrança, alocação de infraestrutura também hipotética. Não inclui tributos variáveis, estornos, atendimento humano, fraude, despesas administrativas ou aquisição. Esses números são cenários para teste; não são margens verificadas.

| Plano | Mensalidade | Custo variável da franquia | Paddle hipotético | Infra alocada | Contribuição parcial |
|---|---:|---:|---:|---:|---:|
| Essencial | R$49,00 | R$3,20 | R$5,20 | R$6,00 | R$34,60 (70,6%) |
| Crescimento | R$129,00 | R$12,00 | R$9,20 | R$12,00 | R$95,80 (74,3%) |
| Pro | R$249,00 | R$30,00 | R$15,20 | R$25,00 | R$178,80 (71,8%) |

**Importante:** 70–74% não é margem efetiva de SaaS; para calcular uma margem real, precisamos das despesas omitidas, retenção, churn, distribuição de tarefas, custo de suporte e infraestrutura contratada. No pior caso, cliente que usa modelos premium e quatro navegadores pode provocar prejuízo sem os hard caps.

### Pagamento e cobrança
- Manter a integração Paddle atual de atendimento intacta. A tarifa padrão faz uma parcela fixa pesar demais em tickets baixos; Stripe Brasil é mais barato no processamento do cartão nacional, **mas não é merchant-of-record** equivalente à Paddle e exigirá gestão tributária do vendedor. Escolha após testes de checkout, impostos e compliance.
- Evitar várias recargas de poucos reais. Propor R$30 ou mais por recarga para diminuir impacto da taxa fixa, com renovação e validade de créditos comunicadas.
- Não fazer débito negativo, overage surpresa nem renovar pacote de créditos extra sem autorização. Pare a tarefa, apresente opção de redução de escopo, modelo barato, upgrade ou recarga.

## Gatilhos para lançar a tabela
- Primeiro piloto de 15 PMEs: medir onboarding do CEO, horas poupadas, tarefas concluídas com prova, CAC, conversão, tickets de suporte e custo real.
- Medir ao menos 100 execuções representativas com token usage verificado e tempo de sandbox ativo.
- Verificar com benchmark real `p50`, `p90` e `p99` de custo; objetivo inicial: margem de contribuição efetiva por coorte >=50% **após fees e infraestrutura**, com reavaliação conforme impostos e suporte.
- Testar fluxo de saldo/reserva/liquidação idempotente sob concorrência de 4 agentes; aplicação real dos tetos no servidor; versões de tarifa/FX e reconciliação com provedor.
- Aprovar a oferta e limites em contrato. Não apresentar esses planos como comercialmente disponíveis antes de billing, CI, runtime e segurança homologados.

## Implementação (não ativa)
- `packages/core/src/workforce-smb-pricing.ts`: planos e conversão USD→BRL com margem e contingência; `tests/workforce-smb-pricing.test.mjs`.
- `packages/core/src/workforce-metering.ts`: custo unitário de recursos; `tests/workforce-metering.test.mjs`.
- Próximo: persistência de carteira por tenant, event sourcing de custos, worker admission control, integração com Paddle/Stripe, provas de entrega.
