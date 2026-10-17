# AGE Executor Bridge — execução real de diagnóstico

**Data:** 17/10/2026 · **Branch:** `feat/agesoma-workforce-computers-20261016` · **PR:** #44  
**Escopo entregue:** quatro sandboxes Linux browser-capable temporários, serviço de atestação HMAC e um caminho de diagnóstico do browser com recibo verificável. **Não é paridade operacional com Grok Bot nem host de produção.**

## Prova real e resultados

1. [OpenSandbox Linux](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39003477252): duas máquinas descartáveis, terminal, arquivos e leitura isolada.
2. [Chromium no sandbox](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39003745151): carregou HTML, clicou em elemento, verificou DOM e criou PNG.
3. [Quatro sessões reais assinadas](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39005574447): **PASS 4/4** com executivo, financeiro, crescimento, produto, HMAC challenge, receipts de Chromium, anti-replay, inputs e ações não autorizados, limpeza. Piloto testado e destruído ao fim.
4. `tests/executor-live-bridge.test.mjs` inclui testes do consumidor de recibos `apps/web/lib/executive-executor-diagnostic.ts` no serviço real. Verificar o status da CI mais recente antes de declarar aprovado.
5. **Integração opcional Next:** `POST /api/workforce/executor/diagnostic`, autenticado como proprietário/admin, autorização de origem, habilitação explícita apenas em ambiente não `VERCEL_ENV=production`, limite de três solicitações/dia, recibo assinado por tarefa/empresa/agente, trilha `runtime_events`. UI do `/workforce` revela botão somente em staging com executor atestado. **Sem host HTTPS conectado, botão permanece escondido.**

## Endpoint de produção: exige infraestrutura fora da Vercel Functions

O script `scripts/opensandbox/executor-pilot.py` implementa protocolo **local-only**, HTTP em loopback `127.0.0.1:8091`, quatro sandboxes Docker OpenSandbox, três capacidades `browser/terminal/filesystem`. Ele usa pagina HTML gerada localmente, não aceita URL arbitrária, código do usuário, ações bancárias, credenciais, e-mail, publicidade ou dados de cliente.

**Não exponha este piloto à Internet:** não há quotas fortes, identidade de tenant por token individual, proteção completa contra DoS, revogação/rotação, TLS nem isolamento de VM. O servidor foi construído apenas para provas controladas com runner descartável.

Para criar um executor empresarial hospedado, é obrigatório:
- VPS/VM ou Kubernetes com execução não privilegiada, observabilidade, autenticação mTLS/ou gateway HTTPS, firewall, rate limiting, isolamento forte (microVM/gVisor conforme ameaça) e budgets;
- serviço persistente `/v1/attest` com 4 IDs de sessões independentes verificadas na hora; nunca inventar IDs sem sandbox ativo;
- distribuição de segredos no servidor (sem `NEXT_PUBLIC_`), sincronização de início/parada e rotação;
- `AGESOMA_EXECUTOR_URL` apontando para domínio HTTPS real com certificado válido, `AGESOMA_EXECUTOR_ATTEST_SECRET` aleatório e `AGESOMA_EXECUTOR_DIAGNOSTIC_ENABLED=true` **somente no staging**;
- integrar `services/worker` ao executor para `business.observe/work` com navegador e ferramentas por escopo, proof receipts, idempotência, limites de custo, controle remoto e auditoria antes de vender autonomia;
- testes E2E de início do CEO → aprovação → execução real → resultado → retomada, isolamento entre PMEs, persistência, latência, recuperação, faturamento e LGPD.

## Exemplos de teste no runner (não habilitam clientes)

```bash
# Em runner Ubuntu CI com Docker disponível:
bash scripts/opensandbox/install.sh start &
source "$HOME/.config/agesoma/opensandbox.env"
export OPEN_SANDBOX_DOMAIN=127.0.0.1:8080
export AGESOMA_EXECUTOR_ATTEST_SECRET="$(openssl rand -hex 48)"
uv run --no-project --with opensandbox==1.1.1 --with 'aiohttp>=3.10,<4' \
  python scripts/opensandbox/executor-pilot.py &
node --test tests/executor-live-bridge.test.mjs
```
Preferir a workflow `.github/workflows/executor-four-sessions.yml`, que aguarda health e limpa processos/sandboxes.

**Status honesto:** a engenharia do teste de computador funciona, mas a instância de produção do dono PME **ainda não está provisionada**. O login/CEO, Vercel QA e catálogos Instant/Dots não são alterados pelo piloto. Zero claims de 100% Grok Bot parity até host e fluxo de trabalho real estarem prontos.
