# AGESOMA — Engenharia Reversa
## Referência: Wonderful AI OS | Estratégia: B2B com experiência de compra B2C

**Versão:** 1.1 — 13/10/2026  
**Status:** especificação de produto e matriz de aceite; **não autoriza lançamento**.  
**Branch auditada:** feat/selfserve-support-product-20261012 — PR #38  
**Complementos:** [Matriz técnica](docs/WONDERFUL_REVERSE_ENGINEERING.md) · [Critérios de lançamento](docs/SELFSERVE_RELEASE_GATE.md)

> **Tese:** o empresário compra e configura um serviço operacional da AGESOMA como se assinasse um aplicativo. A entrega combina software, skills, integrações, verificações independentes e supervisão. O comprador é uma empresa: **B2B self-service, não B2C puro**.

---

## 1. Produto original sob engenharia reversa

A Wonderful apresenta uma plataforma de IA empresarial que combina agentes, skills reutilizáveis, conhecimento, conexões com sistemas, orquestração, governança e avaliação contínua. Seus agentes devem executar processos reais, e não apenas conversar. A implantação comercial costuma envolver equipes de engenheiros e estrategistas junto ao cliente.

**Fontes públicas oficiais:**

- [Wonderful AI OS](https://www.wonderful.ai/ai-os)
- [Wonderful Agents](https://www.wonderful.ai/agents)
- [Wonderful Deployment](https://www.wonderful.ai/deployment)
- [Skills e agentes em produção](https://www.wonderful.ai/blog-articles/wonderful-an-enterprise-platform-to-turn-ai-ambition-into-agents-in-production)
- [Portabilidade e arquitetura aberta](https://www.wonderful.ai/blog-articles/open-by-default-competitive-by-design)

**Limite da pesquisa:** as páginas descrevem a oferta pública da Wonderful. Não há acesso ao código, às integrações privadas nem à arquitetura interna da empresa. A análise identifica padrões e critérios observáveis, não cópia de propriedade intelectual.

### Wonderful × AGESOMA

| Critério | Wonderful (oferta pública) | AGESOMA (tese de produto) |
|---|---|---|
| Comprador | Grandes organizações | Pequenas e médias empresas inicialmente |
| Contratação | Venda e implantação enterprise | Página de produto, checkout e configuração simples |
| Entrega | AI OS com agentes e equipes de implantação | Serviço padronizado executado por software |
| Contexto | Dados, permissões e conhecimento empresarial | Company Brain e conhecimento isolado por cliente |
| Agentes | Skills compostas dinamicamente | Skills versionadas, orquestração a completar |
| Integrações | Sistemas empresariais e múltiplos canais | Começar com um conector real e confiável |
| Qualidade | Evals, governança, observabilidade | QA versionada, Sentinel, ProofTree e evidências |
| Receita | Relação empresarial conforme contrato | Assinatura self-service com valor demonstrável |

**Não copiar:** marca, UI, artefatos internos, código proprietário ou alegações comerciais. Reproduzir capacidades verificáveis com desenvolvimento próprio.

---

## 2. Oferta inicial canônica

**Primeiro produto:** AGESOMA Atendimento.  
**Job to be done:** responder dúvidas a partir de conhecimento aprovado pela empresa e encaminhar o restante a um operador humano.  
**Canal implementado no código:** chat hospedado na web.  
**O que ainda NÃO está pronto:** agentes que executam tarefas de forma autônoma em CRM/ERP, WhatsApp, e-mail ou voz.

A versão atual emprega um mecanismo conservador de correspondência de FAQs. Isso é útil como primeiro SKU, mas **não caracteriza paridade funcional com a plataforma de agentes da Wonderful**.

### Momento AHA, hipótese

O dono da empresa cadastra uma resposta, faz uma pergunta conhecida e recebe uma resposta correta; ao enviar outra pergunta sem contexto suficiente, observa a recusa segura e o encaminhamento ao humano.

Instrumentar: tempo de cadastro até primeiro teste útil, porcentagem que passa no QA, conversão para checkout, publicação ativa, solicitações atendidas, casos humanos resolvidos, tempo de resposta, custo por interação e cancelamentos. Esses indicadores ainda precisam ser medidos em clientes reais.

---

## 3. Jornada comercial e operacional obrigatória

1. **Descobrir:** página pública descreve o resultado, canais incluídos, preço, limites, dados e atendimento.
2. **Cadastrar:** criar conta e empresa; vínculo de tenant seguro e verificável.
3. **Configurar:** nome público, perguntas e respostas, importação de conhecimento.
4. **Testar:** prévia privada e QA para casos respondidos e escalados.
5. **Comprar:** checkout Paddle com preço e condições verificáveis.
6. **Ativar:** somente webhook assinado e assinatura elegível liberam canal público.
7. **Atender:** mensagem recebe resposta aprovada ou ticket humano.
8. **Concluir:** operador responde e cliente acompanha pelo protocolo privado.
9. **Medir:** painel acompanha uso, qualidade, custo, falhas e resolução.
10. **Gerenciar:** titular cancela, atualiza e reativa a assinatura sem suporte de engenharia.
11. **Evoluir:** alteração em skill, regra ou conhecimento exige nova validação de qualidade.

**Critério de aceite da experiência B2C:** o cliente empresarial não precisa de um engenheiro para completar essa jornada padronizada.

---

## 4. Matriz REA — requisitos de engenharia reversa

Estados: **CÓDIGO** = implementação escrita; **CI** = testes em ambiente isolado; **STAGING** = provedores reais e navegador autenticado; **PRODUÇÃO** = serviço operando para clientes; **LACUNA** = capacidade ainda ausente ou não demonstrada.

| ID | Capacidade observada na Wonderful | Evidência no AGESOMA | Estado conservador | Aceite exigido |
|---|---|---|---|---|
| REA-01 | AI OS multiempresa | Better Auth, tenancy, RLS | CI/parcial | Dois clientes isolados no Neon staging |
| REA-02 | Company Brain / conhecimento | FAQs, camada de fatos e memória | CI/restrito | Fontes verificáveis com atualização e proveniência |
| REA-03 | Skills reutilizáveis e versionadas | packages/core/src/support-release.ts | CÓDIGO | Registry, versões, rollback e testes por skill |
| REA-04 | Composição dinâmica de skills | Agent registry e HERMES, FAQ chamada diretamente | LACUNA | Runtime seleciona e executa skills conforme tarefa |
| REA-05 | Integrações com sistemas reais | API de conexões genérica | LACUNA no Atendimento | Integrar CRM/ERP/ticketing, ler e executar ação autorizada |
| REA-06 | Processo resolvido ponta a ponta | Chat → ticket → resposta humana | CI/parcial | Resultado verificável com estado final e tratamento de erros |
| REA-07 | Exceções operacionais | Fila de atendimento e protocolo | CI | Testar SLA, operador, retorno ao cliente e fechamento |
| REA-08 | Governança e permissões | RLS, Sentinel, limite de uso | Parcial | Todas as ações externas passam por autorização apropriada |
| REA-09 | Evidências independentes | ProofTree no domínio de recuperação | LACUNA no Atendimento | Comprovar resultado por fonte externa e avaliador independente |
| REA-10 | Avaliações e regressões | QA obrigatória, skill versionada, invalidação após edição | CI | Evals contínuas, alertas e qualidade em produção |
| REA-11 | Multicanal | Chat web hospedado | LACUNA | Validar individualmente WhatsApp, e-mail e voz se anunciados |
| REA-12 | Observabilidade e economia | Métricas de 30 dias: latência de decisão, backlog, p95 humano e confirmação do cliente | CI/parcial | Tracing completo, custo por tarefa, alertas e margem em produção |
| REA-13 | Portabilidade e APIs | Importação/exportação JSON das FAQs | CI/restrito | Portabilidade de agents, skills, tools e apps versionados |
| REA-14 | Implantação repetível | Blueprints, migrações e CI | Sem prova real | Vercel autorizado + Neon staging + browser E2E |
| REA-15 | Compra self-service (diferencial AGESOMA) | Checkout e webhooks Paddle | CI/parcial | Compra, renovação, cancelamento e estorno no Sandbox |
| REA-16 | Evolução e versionamento | Git, versões de skill e conhecimento | Parcial | Releases independentes, A/B e rollback |
| REA-17 | Serviços que executam trabalho | Feedback de resolução após resposta humana; ações externas ainda ausentes | CI/parcial | Uma ação externa idempotente, ProofTree e resultado verificado por sistema de origem |
| REA-18 | Governança comercial | Oferta em documentação e gates | Parcial | Oferta, preço e limitações fiéis ao que funciona |

**Conclusão da matriz:** fundação técnica não equivale a oferta equivalente. A documentação pode comparar princípios, mas não afirmar que o AGESOMA já entrega todos os recursos da Wonderful.

---

## 5. Arquitetura-alvo

Cliente empresarial → identidade e tenant → onboarding guiado → Company Brain → orquestrador → skills versionadas → ferramentas autorizadas → Sentinel → executor → ProofTree/evals → resultado verificável → dashboard e billing.

Para o **Atendimento V1**, o fluxo concreto é mais estreito:

Pergunta do cliente → busca em FAQs aprovadas → resposta fiel **ou** ticket → operador → resposta consultada com protocolo → registro de avaliação e histórico.

A AGESOMA deve ampliar esse fluxo para ações externas somente depois de validar conectores, autorização, custos e responsabilidade pelo resultado.

### Contratos de componentes existentes

| Domínio | Caminho no repositório |
|---|---|
| Produto | docs/PRODUCT_SCOPE.md e README.md |
| Vitrine | apps/web/app/start/page.tsx |
| Painel comprador | apps/web/app/console/support/ |
| Motor conservador | packages/core/src/support-product.ts |
| Skill e QA release | packages/core/src/support-release.ts |
| Evidência de publicação | apps/web/lib/support-release.ts |
| Banco e versionamento | packages/db/migrations/0024_selfserve_support.sql até 0028_support_verified_outcomes.sql |
| Chat hospedado | apps/web/app/support/[slug]/ |
| API de atendimento | apps/web/app/api/support/ |
| Pagamento | apps/web/app/api/billing/ |
| Testes | packages/core/test/ e tests/ |
| Governança | Sentinel, ProofTree e avaliação de autorização existentes |
| Matriz técnica | docs/WONDERFUL_REVERSE_ENGINEERING.md |

---

## 6. Gate de publicação do Atendimento

Somente permitir atendimento público se TODAS as condições forem verdadeiras:

- Assinatura Paddle ativa/elegível verificada pelo servidor; nunca por redirect.
- Proprietário autorizou publicar.
- Há pelo menos uma FAQ aprovada.
- A última execução de QA passou integralmente.
- QA contém uma pergunta respondida corretamente e outra escalada com segurança.
- Versão da skill e versão do conhecimento/gabarito coincidem com a execução do QA.
- Mudança de conhecimento ou avaliação invalida a aprovação anterior.
- Falta de evidência produz bloqueio, nunca liberação por padrão.

**Implementado em código/CI:** versionamento de skill, trigger de versão de conteúdo, verificação de QA e bloqueio dos endpoints públicos. Ainda requer prova E2E em staging.

---

## 7. Testes de ponta a ponta e evidências necessárias

### E2E-A — Compra até atendimento

- [ ] Empresa A cria conta e workspace sem ação manual de engenharia.
- [ ] Importa/cadastra conhecimento e passa na avaliação de resposta + recusa.
- [ ] Compra no Paddle Sandbox com preço correto.
- [ ] Webhook autêntico ativa acesso ao link público.
- [ ] Visitante recebe resposta fiel à base aprovada.
- [ ] Pergunta fora do escopo abre ticket; operador responde; cliente visualiza.
- [ ] Painel exibe histórico, tempo de resposta humana e resultados confirmados pelos clientes, distinguindo-os de tickets apenas encerrados.

### E2E-B — Segurança, governança e cancelamento

- [ ] Empresa B não lê nem modifica a empresa A.
- [ ] Usuário sem papel de dono/admin não altera conhecimento ou assinatura.
- [ ] Editar FAQ ou skill invalida publicação até nova avaliação.
- [ ] Solicitação sem fundamento escala em vez de alucinar.
- [ ] Webhook forjado, obsoleto ou repetido não concede acesso.
- [ ] Cancelar, pausar ou ficar inadimplente revoga acesso conforme contrato.
- [ ] Rate limiting, bot/WAF, retenção/LGPD, credenciais e logs passam na revisão.
- [ ] Uma consulta de protocolo resolvido permite ao cliente confirmar ou negar a resolução uma única vez; o painel não inventa satisfação quando não há feedback.

### E2E-C — Capacidade equivalente à execução da Wonderful

- [ ] Conectar um sistema empresarial autorizado em staging.
- [ ] Agente recebe solicitação, busca registros de origem e seleciona skills.
- [ ] Executa ação idempotente e limitada com aprovação quando necessária.
- [ ] Confirma resultado pela API do sistema e não por autodeclaração do agente.
- [ ] ProofTree/avaliação registra evidência, custo, falhas e responsabilidade.
- [ ] A tarefa completa é repetível, observável e reversível onde aplicável.

**E2E-A/B** validam a venda do primeiro produto. **E2E-C** é necessário para alegar automação operacional comparável à Wonderful.

---

## 8. Roadmap de fechamento por prioridade

| Prioridade | O que entregar | Evidência obrigatória |
|---|---|---|
| P0 | Neon staging + equipe Vercel autorizada | Ambiente real, migrações 0021–0028 e testes com duas empresas |
| P0 | Paddle Sandbox comercial completo | Compra, assinatura, cancelamento, reativação, webhooks e estorno |
| P0 | Privacidade, segurança e operação | LGPD, WAF, acessibilidade, SLA, rastreamento e rollback |
| P1 | Um conector de CRM/ticketing | Registro empresarial realmente criado/atualizado |
| P1 | Uma skill com execução de trabalho real | Evidência de efeito externo e autorização |
| P1 | Completar observabilidade (base de métricas já instrumentada no Atendimento) | Custos, erros, latência ponta a ponta, feedback e resultados verificáveis |
| P2 | Composição dinâmica de múltiplas skills | Versionamento, testes, A/B e rollback de runtime |
| P2 | Expansão para novos agentes e canais | E2E, custo e proposta comercial de cada novo SKU |

Bloqueios de lançamento:
[#39 — Neon/Vercel/E2E](https://github.com/raphaelribeirob/AGESOMA/issues/39),
[#40 — Paddle Sandbox](https://github.com/raphaelribeirob/AGESOMA/issues/40),
[#41 — Segurança, métricas e LGPD](https://github.com/raphaelribeirob/AGESOMA/issues/41).

---

## 9. Regras permanentes de auditoria

1. Cada item vendido exige **código + teste + evidência do comportamento correspondente**.
2. Classificar sempre como **não implementado, código, CI, staging ou produção**. Não confundir categorias.
3. Sem autorização por cliente, agente não pode escrever em sistemas externos.
4. LLM não valida sua própria execução; evidência externa é independente.
5. Pagamento ativado somente por status comprovado do provedor.
6. Isolamento e autorização são obrigatórios em TODAS as rotas.
7. Mudança em FAQ, skill ou critérios invalida QA anterior.
8. Teste isolado nunca substitui E2E com conta, banco, domínio, pagamento e operador reais.
9. README, produto, matriz REA e gates devem ser atualizados juntos.
10. Não liberar vendas sem aceite do responsável técnico e registro de riscos residuais.

---

## 10. Definição de 100%

**100% do AGESOMA Atendimento V1:** empresário consegue se cadastrar, testar, contratar, ativar, operar, encaminhar, responder e cancelar com segurança e sem implantação manual; qualidade, disponibilidade, custo e dados são auditáveis.

**100% de paridade com Wonderful:** não está demonstrado e não deve ser anunciado. Requer catálogo e composição de skills, integrações reais, execução multiagente e resultados empresariais verificados em produção.

**Fonte da verdade:** código e CI da PR #38, [matriz técnica](docs/WONDERFUL_REVERSE_ENGINEERING.md), [release gates](docs/SELFSERVE_RELEASE_GATE.md) e evidências de staging/produção ainda pendentes.

---

## 11. Aplicação da auditoria comercial Wonderful (13/10/2026)

**Contrato de oferta:** [WONDERFUL_OFFER_APPLICATION.md](docs/WONDERFUL_OFFER_APPLICATION.md).

- **REA-15:** a vitrine pública apresenta um único serviço e um preço
  localizado somente quando o Paddle estiver configurado. Paddle.PricePreview
  estima o total; o checkout confirma preço, moeda e tributos.
- **REA-02:** a demonstração pública usa o motor verdadeiro de FAQs com
  conhecimento de uma empresa fictícia; testa resposta fundamentada e
  recusa segura. Não cria tickets nem executa ferramentas empresariais.
- **REA-06:** tickets e confirmação humana existem em código/CI, mas não
  representam ação em CRM/ERP nem trabalho autônomo.
- **REA-11:** somente web chat hospedado compõe a oferta inicial.
- **REA-13:** o catálogo público de capacidades não autentica agentes,
  não concede consentimento ou escopos e não executa ações. O Agent Access
  da Wonderful (12/10/2026) é uma referência futura, não funcionalidade
  já lançada pelo AGESOMA.
- **REA-18:** QA e métricas existem em código; faltam métricas de compra,
  ativação, retenção, custos reais, alertas e feedback em produção.

A demonstração e o código novo não alteram os gates: sem Neon/Vercel,
Paddle Sandbox, privacidade/LGPD, segurança e navegador E2E, NÃO vender.
