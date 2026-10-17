# AGESOMA — incorporação das seis capacidades Small Business

**Data:** 2026-10-16 · **Estado:** código na PR #44 (draft), não em produção.
**Benchmark:** `anthropics/knowledge-work-plugins`, plugin `small-business` v1.35.1.
**Fonte oficial:** https://github.com/anthropics/knowledge-work-plugins/tree/main/small-business
**Licença do benchmark:** Apache-2.0 (https://github.com/anthropics/knowledge-work-plugins/blob/main/LICENSE)

## O que foi incorporado

São **implementações originais nativas no AGESOMA**, inspiradas na estrutura e nos nomes de workflows do Claude for Small Business. **Não foi instalado o plugin Claude Cowork nem copiado o runtime de terceiros**. O código consultado para a comparação está sob licença Apache-2.0, mas as integrações do Cowork, autenticações e skills proprietárias não foram instaladas. Manter os créditos e a licença caso reutilizemos trechos licenciados no futuro.

| Skill de referência | Agente | Entrega atual | Estado |
| --- | --- | --- | --- |
| `smb-onboard` | CEO+COO | Pergunta a dor antes do questionário, aceita CSV local e encaminha para memória confirmada | Parcial, interface em código |
| `smb-router` | CEO+COO | Resolve pedidos comuns em português para um único workflow, sem invocar operações de risco | Parcial, roteamento limitado |
| `business-pulse` | CEO+COO | Resumo e uma próxima ação somente a partir do CSV efetivamente analisado | Parcial, uma fonte local |
| `cash-flow-snapshot` | CFO | Soma entradas, saídas e variação líquida de lançamentos CSV; período e origem explícitos | **MVP local implementado** |
| `lead-triage` | CMO+CRO | Lista de contatos CSV e ranking heurístico somente se houver sinais suficientes | **MVP local implementado** |
| `build-connector` | CTO+CPO | Formulário de escopo de leitura, lista de etapas e autorização requerida | Parcial, **não conecta** ERP/CRM |

**Não anunciar:** 44 skills operacionais, integração com Claude, 37 conectores ativos, previsão de caixa 30/60/90, prospecção automática, pagamento de contas, quatro desktops ou agentes trabalhando em paralelo. Estes itens não foram implementados por esta PR.

## Primeira experiência (AHA sem custo variável de IA)
1. Usuário entra em `/workforce/ceo` com autenticação. **Antes** do formulário empresarial vê quatro dores: caixa, vendas, operações, sistemas.
2. Seleciona caixa ou leads e abre um CSV de até 200 KB ou cola seu conteúdo. A leitura e cálculo rodam **apenas no navegador**, via `File.text()` e funções determinísticas. Não há upload nem persistência de dados do CSV e não são enviados a conectores, modelos, análise, cookies ou banco pelo componente.
3. O CFO exibe valores calculados a partir das linhas válidas e período de datas; **não presume saldo inicial, conciliação, lucro ou previsão**. O CMO+CRO apresenta os contatos e só ordena se as heurísticas de status/atividade realmente distinguirem casos.
4. O CEO apresenta uma conclusão parcial fundamentada e um próximo passo. Os dados continuam no navegador; fonte fica marcada como `local_csv`, não como dados bancários verificados.
5. O CTO produz **plano de conexão somente leitura**, sem URL, senha, OAuth ou tentativa de conectar sistemas. Aprovação futura é necessária.
6. O usuário completa e confirma o perfil empresarial já existente. Apenas informações **revisadas e confirmadas** passam à memória multiagente e chat do CEO. A leitura CSV local não vira memória/relatório automaticamente.

### Modelo financeiro
Zero chamadas a LLM e zero minutos de OpenSandbox para as análises locais do MVP; custo marginal de CPU/navegador não é faturado pelo AGESOMA. Infraestrutura do site, suporte e pagamentos não são custos zero. No futuro, conectores/API e sandboxes sob demanda dependerão de limites pré-pagos e orçamento atômico antes de execução.

### Formatos CSV aceitos

**Financeiro:** `data;tipo;valor;descricao`, datas `AAAA-MM-DD`, tipos `entrada/saida`, valores em BRL (ex.: `1.250,90`). Aceita equivalentes `date;type;amount` e CSV separado por vírgulas com valores adequadamente entre aspas. Até 1.000 lançamentos e 20 colunas. Linhas incorretas fazem a análise falhar por inteiro. Entrada e saída são somadas, não classificadas como receita contábil/lucro.

**Leads:** `nome;empresa;status;ultimo_contato`, data `AAAA-MM-DD`. Também admite `name;company;stage;last_contact`. A pontuação é heurística declarada, não probabilidade de compra nem recomendação automatizada para envio. Se sinais não distinguem leads, preserva ordem de entrada e informa impossibilidade de ranking. Até oito contatos exibidos; demais contam no total.

### Segurança e limites
- Dados da planilha permanecem client-side enquanto o componente está montado; não usar `fetch`, `localStorage` ou OCR oculto. Conteúdo de célula exibido via React com escaping, nunca HTML arbitrário.
- Limites de arquivo e linhas evitam processamento ilimitado. Datas, valores, cabeçalhos e linha obrigatória são verificados; falhas são explícitas, sem inventar números.
- Upload de documentos e leitura de sites ainda não estão incorporados: exige validação de MIME, antimalware, retenção, extração segura, consentimento, RLS e isolamento de fontes.
- CEO/capacidades não recebem credenciais nem grants por ler CSV; apenas interfaces futuras de autorização podem permitir conectores.
- Não substituir ações reais de `/api/agesoma` sem revisão: pedidos reconhecidos de caixa, leads e conector recebem orientação para a experiência local em vez de tentar executar sem acesso.
- Skills são contratos de produto: uma `state:partial` não pode aparecer como ferramenta/integração ativa na interface pública.

## Rastreamento dos arquivos
- `packages/core/src/smb-skills.ts`: registro de seis workflows, matcher, parser CSV limitado, cálculo de caixa e leads, resumo CEO e proposta read-only do CTO.
- `packages/core/src/index.ts`: exports do catálogo no backend.
- `apps/web/app/workforce/ceo/ceo-quick-win.tsx`: UI de primeira experiência, import direto do módulo browser-safe (evitar barrel de servidor).
- `apps/web/app/workforce/ceo/ceo-quick-win.module.css`: AGEDESIGN v1.1 responsivo, foco visível, sem motion decorativo.
- `apps/web/app/workforce/ceo/ceo-intake.tsx`: diagnóstico exibido antes dos oito campos (somente quando perfil ainda não confirmado).
- `apps/web/app/api/agesoma/route.ts`: conversa CEO recomenda a capacidade adequada sem executar ações externas.
- `tests/smb-skills.test.mjs`: casos de normalização, parser CSV, cálculo de centavos, falhas, triagem não fabricada, read-only e ausência de tráfego de rede no componente.
- `.github/workflows/opensandbox-pilot.yml`: inclui a suíte na etapa de testes estáticos/Node.

## Bloqueios antes de afirmar equivalência ao Claude Small Business
- CI Node 24 e TypeScript/Next build executados e aprovados.
- Browser E2E em celulares e desktop, testes de privacidade/rede verificando ausência de upload, teste de acessibilidade (screen reader).
- CSV real (não sintético) com aceite do usuário em pelo menos 15 PMEs e comparação de total com dados de origem.
- Adicionar coleta de país/moeda/ano fiscal, tamanho da equipe, preferências de apresentação e conectores já utilizados, sem tornar onboarding obrigatório excessivo.
- 1–2 conectores brasileiros reais com OAuth/API/revogação, escopo leitura e primeiro dado verificado; importação CSV/PDF pelo servidor somente após política de retenção e consentimento.
- Registrar diagnóstico quando solicitado e com confirmação do usuário (não capturar CSV automaticamente).
- Engenho de workflows executáveis, budgets de créditos, Sentinel em cada ação externa, rastreio de evidência e 4 worker identities seguras.
- Publicação protegida em staging/produção e verificação contra dados de outro tenant.

**Veredicto:** foram incorporados fluxos úteis e o primeiro AHA orientado a dados, **não** o plugin Claude completo ou uma equipe autônoma equivalente. PR permanece draft.
