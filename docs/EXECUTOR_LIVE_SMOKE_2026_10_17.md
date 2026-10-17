# AGESOMA — prova real do computador de agente (17/10/2026)

**Veredicto:** o motor OpenSandbox **funcionou em teste Linux descartável**, incluindo terminal, arquivos e Chromium. **Os quatro computadores executivos do AGESOMA NÃO estão conectados/provisionados no ambiente de homologação** e a paridade funcional com o Grok Bot **NÃO foi atingida**.

## Referência externa de comparação

- https://docs.x.ai/grok-bot/overview
- https://docs.x.ai/grok-bot/computer-and-apps
- https://docs.x.ai/grok-bot/faq

O Grok Bot tem um computador persistente compartilhado entre Bots por conta, com telas separadas, browser, filesystem, terminal, delegação e tarefas em segundo plano. AGESOMA visa quatro identidades executivas com isolamento por agente, arquitetura mais restritiva e distinta.

## Teste 1 — OpenSandbox Linux real, duas instâncias

- [GitHub Actions: OpenSandbox Linux pilot (39003477252)](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39003477252) — **PASS**.
- Instalador: `scripts/opensandbox/install.sh`, somente loopback 127.0.0.1, chave efêmera do runner, Docker bridge.
- `scripts/opensandbox/smoke.py`: Sandbox A `alpine:3.20` criado, executou `sh`, gravou arquivo em `/tmp`, leu por **outra execução de comando**; Sandbox B criado separadamente e não encontrou o arquivo de A. Ambos foram destruídos explicitamente.
- Logs de evidência: `PASS: sandbox A real terminal + filesystem state across commands`; `PASS: sandbox B cannot see A's test file in isolated /tmp`; cleanup para A/B.
- **Não prova isolamento forte entre clientes adversariais:** ambos são containers Docker e não foi testado escape, egress, credenciais, freeze/restore ou dados multi-tenant reais.

## Teste 2 — Chromium real dentro de OpenSandbox

- [GitHub Actions: OpenSandbox Chromium computer proof (39003745151)](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39003745151) — **PASS**, depois de corrigidos defeitos do *script de teste* (quoting e URL encoding de `data:text/html`).
- `scripts/opensandbox/smoke-browser.py`: cria Sandbox baseado em `opensandbox/playwright:latest`; inicia `playwright.chromium`; carrega página local `data:` fictícia; verifica título; clica em botão; avalia alteração do DOM via JavaScript; escreve PNG e valida tamanho do arquivo (maior que 1000 bytes); destrói o sandbox.
- Evidência do log: `PASS: actual Chromium browser interaction and screenshot inside Linux sandbox`, `CLEANUP: browser sandbox destroyed`.
- **Importante:** a captura foi verificada dentro do ambiente temporário e eliminada no cleanup. Este teste não capturou nem transmitiu uma tela VNC para o usuário, e não comprova navegador persistentemente autenticado em sites reais.

## Teste 3 — conexão AGESOMA Web → executor executivo

- Projeto Vercel de homologação verificado: `agesoma-qa-preview` (`prj_7f4fx2j1hJ2PIc4fYgScAyChQBfC`).
- Variáveis Vercel consultadas por nome (valores não recuperados): **apenas `BETTER_AUTH_SECRET` em preview e production**. Ausentes `AGESOMA_EXECUTOR_URL` e `AGESOMA_EXECUTOR_ATTEST_SECRET`.
- Vercel Named Sandboxes nesse projeto: **zero**.
- `apps/web/lib/executive-executor-readiness.ts`: o método `probeExecutiveExecutor` retorna `{ready:false,reason:"not_configured"}` sem URL/secret. Ele exige um serviço HTTPS confiável com `POST /v1/attest`, assinatura HMAC, nonce, expiração e IDs distintos para os quatro executivos. **Esse serviço não foi criado neste teste**, portanto não existe atestação válida.
- `apps/web/app/workforce/page.tsx`: apresenta `runtimeStatus="unavailable"` se atestação não passa.
- Backend `apps/web/app/api/agesoma/route.ts`: deve bloquear enfileiramento de novas tarefas autônomas quando não há executor validado.
- **Limite de escopo:** a ausência foi confirmada neste projeto QA; não se afirma ter auditado infraestrutura externa não conectada a este repositório/projeto.

## Matriz de paridade

| Requisito | Prova nesta execução | Estado |
|---|---|---|
| Iniciar Linux sandbox | Docker OpenSandbox runner | PASS piloto |
| Terminal shell | comando executado | PASS piloto |
| Filesystem e estado entre comandos | gravar/ler | PASS piloto |
| Duas sessões com arquivo não compartilhado | A vs B `/tmp` | PASS piloto |
| Chromium headless dentro do sandbox | abrir página + JS + screenshot | PASS piloto |
| Computador persistente do dono da PME | não provisionado em QA | FAIL disponibilidade |
| Quatro computadores AGESOMA vinculados | sem endpoint/atestado | FAIL disponibilidade |
| Abertura do desktop e screen takeover | sem VNC/stream | NÃO testado |
| Chat CEO → browser/terminal por tarefa | sem dispatcher executor | FAIL integração |
| Continuar tarefa com cliente desconectado | sem runtime persistente | NÃO demonstrado |
| Handoff CEO → CFO → CEO com prova | ausente | NÃO demonstrado |
| Segurança forte de duas PMEs na infraestrutura de computadores | Docker piloto não é boundary forte | NÃO testado |
| Autorização antes de ação externa real | sem site transacional testado | NÃO testado |
| Preço e consumo reais por sessão de agente | sem runtime comercial | NÃO testado |

## Gates de liberação (não marcar 10/10 antes)

1. Serviço Linux OpenSandbox durável com controlador/agendador executando e logs seguros.
2. Serviço HTTPS `/v1/attest` assinado que verifica quatro sessões *reais*, isoladas, únicas e pertencentes a um tenant autorizado.
3. `services/worker` conectado ao executor, incluindo claims/retries, idempotência, limites de custo, terminal/browser e artefatos.
4. Tarefa real de CEO inicia sessão, faz uma leitura em navegador de site de testes e gera receipt associado a `tenant_id` e `task_id`.
5. O proprietário visualiza a tela, pode interromper e aprovar ações de efeito externo.
6. Handoff CEO → especialista → CEO, com memória permitida e proibição explícita de vazamento entre PMEs.
7. Teste de persistência após fechar UI, recuperação de timeout/falha e revogação de acesso.
8. Compilar, executar E2E e auditar custos e isolamento forte antes de conectar clientes.

**Não usar os resultados Linux isolados como alegação comercial de paridade com Grok Bot.** O projeto QA continua sem executor provisionado e a PR permanece draft.
