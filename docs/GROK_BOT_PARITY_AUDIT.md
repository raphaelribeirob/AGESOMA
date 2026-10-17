# Auditoria funcional: AGESOMA vs. Grok Bot (17/10/2026)

**Escopo:** AGESOMA PR #44 (`feat/agesoma-workforce-computers-20261016`) e documentação oficial Grok Bot consultada em 17/10/2026. **Resultado honesto: não existe paridade funcional de 100%.** Não foi usado o código, marca ou interface proprietária do Grok Bot.

## Fontes primárias Grok Bot
- https://docs.x.ai/grok-bot/overview
- https://docs.x.ai/grok-bot/faq
- https://docs.x.ai/grok-bot/computer-and-apps
- https://docs.x.ai/grok-bot/skills-routines-and-automations
- https://docs.x.ai/grok-bot/approvals-security-and-privacy
- https://x.ai/news/designing-grok-bot
- https://docs.x.ai/grok-bot/bots

**Diferença real de isolamento:** A documentação Grok Bot informa que Bots de uma conta **compartilham um computador persistente** com arquivos/logins/sessões comuns e telas separadas. O plano AGESOMA pede separação mais forte (4 sessões com `isolation:agent`). A diferença é intencional, porém mais custosa. Um registro `persistent_workers` não equivale a uma VM ou computador.

## Matriz de auditoria (sem contar protótipos como resultado em produção)

| Capacidade | Grok Bot documentado | AGESOMA nesta PR | Evidência/limite |
|---|---|---|---|
| Roster com 4 agentes já configurados | Perfis persistentes | **UI e ownership implementados** | `workforce-profiles.ts`; 4 papéis para 7 cargos |
| Primeiro CEO aprende sobre empresa | Perfis e memória | **Parcial** | Intake revisado `/workforce/ceo`, memória por tenant e chat determinístico |
| Conversa generativa multimodal | Texto/voz e ferramentas | **Sem paridade demonstrada** | Chat AGE atual com intenção determinística, sem orquestrador generativo autônomo |
| Computador persistente/navegador/terminal | Real, disponível à conta | **NÃO provisionado/testado** | Só scripts OpenSandbox piloto e namespaces no banco |
| Quatro sessões isoladas atribuídas | Grok tem telas distintas em computador compartilhado | **Contrato de atestação criado; host ausente** | HMAC challenge, 4 IDs únicos, tipo de isolamento agent |
| Executor trabalha depois de fechar app | Cloud worker contínuo | **NÃO demonstrado** | Falta dispatcher/consumidor com heartbeat e durable queue |
| Agentes passam trabalho entre si | Mensagens/handoffs | **Apenas ownership/roteamento** | 7 capacidades legadas mapeadas a 4 cargos; sem handoff E2E |
| Skills executáveis | Skills persistentes | **Dois diagnósticos CSV locais, quatro contratos parciais** | Não há uso real de navegador por skill |
| Rotinas agendadas/event-driven | Scheduler e gatilhos | **Estrutura legada, E2E NÃO comprovado** | Sem rotinas executadas com provas em ambiente homologado |
| Aprender tarefa por demonstração | Gravação de navegador → draft skill | **Ausente** | Não prometer compatibilidade |
| Conectores/sites empresariais | Acesso real a apps | **Sem conector ERP/CRM comprovado** | Planejamento read-only, não OAuth operacional |
| Aprovação de ações externas | Ações bloqueadas até decisão | **Parcial com controle de escopo** | Ledger/grants existentes, testes reais por serviço faltam |
| Memória de empresa persistente | Contexto entre sessões | **Parcial** | Fonte e fingerprint owner-confirmed, sem sincronização completa |
| Ver telas e assumir computador | Computador/control takeover | **Mock/previsão honesta** | Sem streaming de tela/browser conectado |
| Artefatos e evidência por tarefa | Saídas reais rastreáveis | **Banco tem entidades; prova E2E pendente** | Fila ≠ execução ≠ resultado confirmado |
| Apps Instant/Dots | Não é requisito Grok Bot | **Catálogo e contratos apenas** | Sem mobile autenticado no runtime AGE |

## Defeitos corrigidos no código desta auditoria

1. **Falsa prontidão:** banco inseria `persistent_workers` com `runtime_strategy:shared_cell` e o chat marcava `work_cells` como `personal_persistent` sem provar que um computador existia. A mutação de status falso foi removida.
2. **Fila sem executor:** para novas tarefas atribuídas a IA, `createWork` agora exige atestação fresca e assinada do executor remoto antes da gravação de workflow/tarefa/worker. Sem ambiente real, informa usuário, recusa enfileirar e não cobra.
3. **Quatro responsáveis:** cada especialidade legada é associada a um dos 4 agentes via `executiveOwnerForCapability`, fail-closed em desconhecidos. O payload adiciona `executiveWorker.id` e `attestedSessionId` (apenas proveniência de atestação, não evidência de execução).
4. **Aprovação enquanto executor inativo:** `approveTask` recusa validar execução de tarefas de IA quando a atestação remota falha. Tarefas humanas legadas continuam sua própria autorização.
5. **Mensagens que prometiam execução:** retornos agora distinguem pedido aceito na fila, resultado pendente e recusa por falta de execução; evitar “está trabalhando” sem prova de dispatcher.
6. **Status visual dinâmico conservador:** `/workforce` só apresenta “executor verificado” quando a atestação HMAC remota é válida; mesmo assim, deixa claro que tarefas reais não foram comprovadas. Nunca diz computador provisionado apenas porque uma linha DB tem status `ready`.
7. **Entrada pública Instant e Dots preservadas:** os novos gates não alteraram `INSTDESIGN.MD`, `/instant`, `/dots`, meios de cobrança ou repositórios móveis.

## Protocolo de atestação para implementar no executor futuro

- Variáveis somente no servidor web: `AGESOMA_EXECUTOR_URL=https://executor.example.com/`, `AGESOMA_EXECUTOR_ATTEST_SECRET` com pelo menos 32 caracteres aleatórios. **Nunca use URL enviada pelo usuário, `NEXT_PUBLIC_*`, arquivo versionado ou segredos no payload da tarefa.**
- Endpoint executor confiável `POST /v1/attest`: recebe `{protocol:"agesoma-executor-v1", nonce:"<hex 24 bytes>"}` e responde em até 3 s com JSON: `protocol`, `nonce`, `engine:"opensandbox"`, `isolation:"agent"`, `capabilities:["browser","terminal","filesystem"]`, `sessions:{executive,finance,growth,product}` com 4 ids únicos, `expiresAt` até 30 s no futuro, `signature`.
- `signature` = hex de HMAC-SHA256 calculado sobre `JSON.stringify({protocol,nonce,engine,isolation,capabilities,sessions,expiresAt})` com o segredo compartilhado, na ordem exata. Deve ser produzido por um **serviço remoto que verifica de fato as sessões e seus isolamentos**, não uma resposta fixa de CI.
- O app recusa tokens ausentes/forjados/vencidos, sessões duplicadas, capacidades faltantes, hosts inválidos, HTTP, redirect e servidores não alcançáveis. Um HMAC assinado só comprova afirmações do serviço remoto; **não** valida por si só que uma tarefa foi realizada.
- **Ainda não instalado:** servidor OpenSandbox, serviço que assina provas, dispatcher que consome tasks do AGESOMA, log de ferramenta, atualização de status com evidência, controle de credenciais, UI real de computador e captura de telas.

## Critérios para poder dizer “igual ao Grok Bot funcionando”

Não aceitar teste de mock como homologação. Para a PME cliente, os **gates operacionais obrigatórios** são:
1. VPS/Linux com sandbox real, logs de criação/hibernação/limpeza e quatro sessões verdadeiras; revogação total de credenciais.
2. Integração POST de atestação assinada verificada pelo web app em staging.
3. Pedido de owner gera `queued`, dispatcher faz `claimed`/running com heartbeat e timeout, browser/terminal executam em site de testes, artifacts/receipts têm evidência; `completed` só com verificação.
4. Repetir sem execução duplamente em retries; aprovação pelo dono exigida para e-mail, publicidade, compra, exclusão e qualquer efeito externo.
5. Isolamento forte entre 2 PMEs e 4 agents, proibir vazamento de arquivo/segredo/cookies entre tenants.
6. Um handoff CEO→CFO→CEO completo, concorrência segura, source/custo/memória idempotentes.
7. Uma rotina durável agendada, executada com app fechado, com notificação e histórico.
8. Um conector Omie/Bling (ou outro) com OAuth read-only e revogação; dados auditáveis.
9. Autorização de serviço por produto Instant/Dots, consentimento de responsáveis para flows infantis e billing isolado.
10. QA real em Android/iOS/web, leitores de tela, falhas de rede e acessibilidade; observar custo p50/p90 antes de preços PME.

**Resultados de testes de código podem chegar a 100% de aprovações; a paridade operacional não foi atingida.** PR #44 permanece draft e não foi implantada.

## Implementação e testes

- `apps/web/lib/executive-executor-readiness.ts` — verificação HMAC e prova de quatro sessões exclusivas.
- `apps/web/app/api/agesoma/route.ts` — gate pré-task e pré-approval, mapeamento executivo, respostas sem falsas alegações.
- `apps/web/app/workforce/page.tsx` — sinalização de executor a partir de avaliação real.
- `apps/web/app/workforce/workforce-preview.tsx` — estados cautelosos de UI.
- `tests/executor-attestation.test.mjs` — anti-spoofing, replay, expiração, HMAC, IP/local host, falhas de rede, não-enfileiramento.
- `.github/workflows/smb-skills-qa.yml` — Node 24 + TypeScript + Next build.

**Segurança:** o executor não deve aceitar tarefas somente porque o web app passou um ID. É necessário serviço confiável que valide grants, idem-token, idempotência e tenancy na hora exata do side effect. Excesso de permissões ou “LLM sabe a senha” não é substituto para consentimento e isolamento.
