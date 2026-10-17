# AGESOMA Workforce OS — medição, créditos e política de cobrança

Status: **proposta econômica + estimador de custo implementado; cobrança de agentes NÃO ligada**.
Data: 2026-10-16.
Objetivo: quatro agentes executivos (CEO+COO, CFO, CMO+CRO e CTO+CPO) com UMA franquia compartilhada por empresa, não quatro assinaturas.

## Padrão de referência do mercado
A página oficial do Grok Bot mostra Premium US$30/m, Super US$100/m e Ultra US$200/m, franquia semanal de utilização e cobrança adicional baseada em custo de tokens. Estes são preços do concorrente em 16/10/2026, não a tabela do AGESOMA.

Fontes (preços variáveis):
- https://x.ai/bot
- https://developers.openai.com/api/docs/pricing
- https://www.paddle.com/pricing

## Como a execução é cobrada

Custo real de cada RUN é a soma de:
- chamadas a modelos (tokens entrada **não-cache**, cache de leitura, cache de escrita, saída incluindo raciocínio quando faturado), por preço daquele modelo/região/modalidade no horário;
- tempo de computador **ATIVO**, rateado de custo total de servidor, armazenamento, proxies/rede e provisionamento. Computador parado/hibernado não deve gerar minutos ativos fictícios (custos reais de storage persistente ainda serão cobrados separadamente);
- buscas, browser tools pagas, OCR, geração de imagens/vídeos, voz, mensagens, e demais serviços externos;
- armazenamento, tráfego, filas, bases e eventuais custos por tarefa não refletidos na VM.

Calcular com valores monetários inteiros em **microUSD** (1 US$ = 1.000.000 microUSD) e precios versionados por fornecedor/serviço. Jamais inferir tokens contando palavras; obter `usage`/faturamento reportado pelo provedor e reconciliar com sua fatura. Tokens em cache precisam de precificação separada. Custos de voz, imagem e ferramentas não são todos expressos na mesma unidade de tokens.

**Custo variável de uma execução** = modelo + computador + ferramentas + outras despesas variáveis.

**Créditos de uso vendidos**: 1 AGE Credit = **US$0,01 de preço de consumo AGESOMA**, uma unidade comercial de gasto, **não** 1 token nem 1 segundo. Essa opção é uma proposta, não é um saldo ainda vendido.

**Preço de uma execução**, como orientação inicial: `roundUpToCent(custo variável total / 0,40)`, equivalente a meta de **60% de margem de contribuição sobre consumo** antes de taxas do meio de pagamento, tributos e despesas compartilhadas. A precificação publicada precisa permitir exibir ao cliente um orçamento máximo antes da tarefa, além de um ledger e de recibo real.

### Exemplo ilustrativo reproduzível (NÃO tarifa garantida)
Entrada 100.000 tokens, saída 20.000 tokens, computador ativo por 15 minutos a tarifa hipotética de US$0,10/h, US$0,005 de ferramentas:
- modelo econômico: input US$0,10/1M, output US$0,50/1M → IA US$0,020, computador US$0,025, ferramentas US$0,005, **custo US$0,050**, preço da tarefa **US$0,13 = 13 créditos**;
- modelo avançado: input US$2/1M, output US$10/1M → IA US$0,400, computador US$0,025, ferramentas US$0,005, **custo US$0,430**, preço **US$1,08 = 108 créditos**.

Preços de API devem ser lidos por catálogo versionado, sempre verificando cache, modalidades, região, contexto longo, modo priority/fast, mudanças de fornecedor e impostos. O **US$0,10/h de VM é hipotético** até medirmos o servidor escolhido.

Motor puro sem dinheiro: `packages/core/src/workforce-metering.ts`.
Teste determinístico: `tests/workforce-metering.test.mjs`.
`quoteWorkforceExecution` calcula preço; `wouldExceedCredits` verifica consumo/reservas. **Nenhum dos dois persiste, cobra, ativa VM ou concede autorização.**

## Precificação pública: proposta inicial, NÃO aprovada

| Plano por empresa | Assinatura/mês | Crédito incluído para tarefas | Concorrência proposta | Objetivo |
| --- | ---: | ---: | ---: | --- |
| Start | US$39 | US$10 (1.000 créditos) | 1 computador ativo por vez | CEO conhecendo a empresa e primeira rotina |
| Growth | US$129 | US$40 (4.000 créditos) | até 2 simultâneos | Equipe executando fluxos aprovados |
| Scale | US$349 | US$120 (12.000 créditos) | até 4 simultâneos | Mais volume e múltiplas funções |

Todos podem mostrar **as quatro identidades prontas**, sem prometer quatro desktops ligados 24/7. A concorrência pressupõe aprovação em benchmark de hospedagem; **não está implementada**.

Consumo excedente exige consentimento expresso, orçamento/hard cap e compra de pacote ou recarga de no mínimo US$10 para diluir taxa fixa de transação. Nunca cobrar overage silenciosamente.

A Paddle publica **5% + US$0,50 por transação** como preço padrão; planejar fees, chargebacks, FX, VAT/impostos e tributos locais. A margem real da assinatura não é a margem de contribuição da execução e precisa ser calculada sobre receita líquida:
`Margem bruta após taxa = (receita - taxa Paddle - consumo IA - VM - ferramenta - infra compartilhada apropriada - suporte variável) / receita`.
A decisão final dos preços requer amostras reais por cohort e stress test de clientes heavy users. Não vender como preço final sem validação comercial e legal.

## Regras de proteção financeira
1. A companhia possui uma carteira; cada operação informa `tenant_id`, `worker_id`, `run_id`, `parent_run_id`, `invocation_id`, fonte de preço, modalidade e `model_id`.
2. Antes de executar: cotar cenário máximo, reservar teto de AGE credits de maneira atômica e idempotente no servidor. Se exceder o saldo ou cap da tarefa, BLOQUEAR.
3. Cada chamada ao modelo grava os contadores do provedor por input, cache read/write, output/reasoning e ferramentas, com moeda, versão de preços e custo apurado.
4. Medição do computador usa lease ativo com timestamps confiáveis, tempo máximo por tarefa e suspensão por inatividade; storage e egress são contados fora da VM.
5. Cada ferramenta externa gera seu próprio evento. Repetições de API (retries) devem ter `invocation_id` próprio e chave idempotente para não cobrar duas vezes o mesmo uso. Uma cobrança física real de retry ainda é custo real: reconciliar com invoice do provedor.
6. Ao finalizar, liquidar RESERVA → USO REAL, liberar parte não gasta, emitir recibo, declarar tarefas falhadas com cobrança de infraestrutura/IA conforme política comunicada antes da execução.
7. Definir limites diários e mensais por tenant, por agente, por tarefa e por modelo; o CEO não pode aumentar seus próprios limites nem usar credenciais do CFO.
8. Botão de pausa e revogação de orçamento funcionam no servidor mesmo se navegador fechar. O CEO usa orçamento pequeno e pré-definido na etapa inicial de compreender a empresa.
9. **Sem taxa oculta:** mostrar estimativa, saldo, uso real, data de corte, IVA/impostos aplicáveis, reembolso/estorno, condições de expiração e custo previsto antes de tarefas longas.
10. Chaves de provedores exclusivamente no backend. Cliente NÃO pode enviar contadores de tokens ou valor gasto que modifiquem a carteira.
11. RLS e chaves de idempotência obrigatórias na carteira e no ledger. Pagamentos são considerados somente após webhook Paddle assinado e reconciliado.

## DDL e integração pendentes (bloqueadores de produção)
- Criar `workforce_price_catalog`, `workforce_usage_events` append-only e `workforce_credit_ledger` append-only, com índices únicos por idempotência, isolamento por tenant, ponte com preço versionado e invoice provider, taxas e observabilidade.
- Integrar na camada **real** do Model Gateway e executor OpenSandbox; não adicionar uma cobrança UI simulada.
- Ligar reserve/settle/release ao pg-boss dispatcher e Sentinel, sem dupla cobrança ou conta negativa nas condições de corrida.
- Integrar Paddle SKU/checkout e webhook existente com entitlement **workforce** separado da oferta `AGESOMA Atendimento` atual. Não reaproveitar indevidamente o SKU `support`.
- Testar offline, timeout, abort, retry, consumo simultâneo de 4 agentes, mudanças de tarifa, idempotência, estorno e reconciliação.
- Medir custos reais de 100+ trabalhos representativos antes de fixar a franquia. **Nenhum cliente está sendo cobrado por essa proposta no repositório.**

## Posicionamento
Cliente paga pelo resultado de ter **uma empresa entendida e quatro funções executivas prontas**, não precisa escolher tokens de modelos. A medição financeira interna é por custo efetivo de cada ação; a exibição externa simplifica em créditos. A primeira competência operacional é o CEO entender a empresa com fonte e confirmação humana, depois delegar trabalho autorizado aos demais.
