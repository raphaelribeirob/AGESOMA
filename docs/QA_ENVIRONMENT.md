# AGESOMA — ambiente de homologação isolado e gates reais

> **Prêvia protegida atualizada:** [AGESOMA QA — build validado](https://agesoma-qa-preview-k29w96cly-r3-41f9.vercel.app) · Vercel READY · deploy `dpl_2YyySH5WSHHvCXkQxCgP4KDqGas5` do commit `42b129e00ae5aba17bb3db73170aa545fd728c63`. Não equivale a login/ERP/VM reais no Vercel sem backend staging configurado.\n\n**Data:** 17/10/2026  
**Escopo:** PR #44, branch `feat/agesoma-workforce-computers-20261016`. **Não é produção. Não é atestado 10/10.**

## Resultado da homologação CEO First — duas empresas

- **[GitHub Actions — CEO tenant QA #12](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39001680663): SUCCESS**, com migrações reais completas do AGESOMA + Better Auth, build de produção e Chromium automatizado.
- Um proprietário criou a `Empresa Alfa QA isolada`, preencheu os oito campos, salvou o rascunho, marcou a confirmação e recebeu `status:owner_confirmed`.
- Uma segunda conta de proprietário foi criada em contexto e sessão independentes; sua consulta GET tentou especificar um `x-tenant-id` de outra empresa. A API **não aceitou a sugestão de tenant e não devolveu os dados da primeira empresa**.
- A validação usa dados sintéticos e PostgreSQL isolado; não envolve Neon nem dados de clientes reais.
- Outra falha identificada e corrigida: o POST/PATCH do CEO First exigia que `req.url` coincidisse literalmente com `Origin`. Sob proxy do Next, o URL interno não correspondia ao Host externo e rejeitava solicitações válidas (403). Passou após comparar a origem tanto ao URL normalizado quanto ao Host efetivo da requisição.
- **Limites desta prova:** não foram executadas rotinas OpenSandbox, handoffs CEO→CFO, integrações bancárias, Paddle checkout, iOS/Android nativo físico, testes de penetração, observabilidade de 24 horas ou auditoria formal de todas as políticas RLS. Por isso a classificação geral 10/10 **permanece BLOQUEADA**.

---

## Evidências desta homologação

- **Prévia protegida Vercel READY**: [AGESOMA QA](https://agesoma-qa-preview-h87evymqd-r3-41f9.vercel.app), deployment `dpl_22zQzezqFwGkM62FPbZPnZwdwFTh`, sem conexão com produção. A URL está sob autenticação da equipe Vercel; revisão visual direta depende de acesso autorizado.
- **Browser QA [GitHub Actions #7](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39000727937): SUCCESS, 24/24 testes** (Chromium desktop, Chromium Pixel 7 emulado, WebKit iPhone 13). Inclui FAQ e bloqueio de ações desconhecidas, catálogo, responsividade, acesso anônimo e segurança HTTP. Não substitui dispositivos físicos.
- **Falha encontrada e corrigida:** o endpoint de demonstração retornava 403 para requisições legítimas ao atravessar o proxy de Next. A correção compara o cabeçalho `Origin` ao host real da requisição além do URL normalizado, mantendo bloqueio de origens externas.
- **Auditoria de dependências [GitHub Actions #4](https://github.com/raphaelribeirob/AGESOMA/actions/runs/39000728006): SUCCESS, 0/0/0/0** (critical/high/moderate/low) no registro npm de dependências de produção. Antes havia 1 crítica em `next@16.3.4`. Atualizado para `next@16.4.2`, com correções oficiais de outubro/2026. Isto não prova ausência de vulnerabilidades desconhecidas ou em dependências de desenvolvimento.
- **Autenticação e empresas reais no banco descartável:** fluxo completo de cadastro → CEO → confirmação → duas PMEs foi adicionado em `tests/e2e/agesoma-auth.spec.mjs` e `.github/workflows/agesoma-tenant-qa.yml`. Validação executada e aprovada na execução #12 (link e limites documentados acima).

**Nota provisória:** **10/10 somente para a matriz pública web de 24 testes que de fato passou**; **produto inteiro ainda NÃO 10/10**. Autonomia executiva, pagamentos, banco real com RLS, voz/orbe nativo e integrações móveis permanecem gates distintos.

---

## Defeitos identificados em instalação limpa

**Executar uma criação de banco do zero foi decisivo.** A suite de teste CLI encontrou e a PR corrigiu:

1. `0012_muse_parity_runtime_attention.sql`: índice `goals_tenant_status_priority_idx` exigia a coluna `goals.updated_at` antes de ela existir. A migração agora cria essa coluna de maneira idempotente antes do índice.
2. `0019_usage_metering_budget.sql`: migração com SQL truncado e duplicado; falhava ao criar tabelas de limites e medição de tokens. Reconstruída com `tenant_usage_budgets`, `task_usage_ledger`, checagens de montantes não negativos, chaves estrangeiras compostas por `tenant_id` e políticas RLS.
3. Na primeira rodada de signup, autenticação e produto tinham caminhos de pesquisa SQL diferentes: `public` para Better Auth e `agesoma_p0` para as tabelas empresariais. A QA usava incorretamente `AGESOMA_DB_SCHEMA=public`; corrigida para `agesoma_p0`. **Ainda precisa ser comprovada por novo teste.**

Esses testes e correções são feitos na branch draft e no banco descartável; **não foi executada migração em Neon ou outro banco comercial**. Corrigir uma migração em Git não comprova que instalações já existentes têm a mesma estrutura; a promoção futura exigirá revisão de migrações e backups.

---

## Ambientes criados

### A. Vercel — QA protegido

- Equipe existente: `R3` (`r3-41f9`), plano Hobby.
- Projeto dedicado: `agesoma-qa-preview` (`prj_7f4fx2j1hJ2PIc4fYgScAyChQBfC`).
- URL da prévia protegida mais recente: https://agesoma-qa-preview-k29w96cly-r3-41f9.vercel.app
- Deployment mais recente confirmado READY: `dpl_2YyySH5WSHHvCXkQxCgP4KDqGas5`, revisão `42b129e00ae5aba17bb3db73170aa545fd728c63`, status validado pela API.
- **SSO Protection = all**, sem domínio próprio, sem dados Neon/ERP, sem preço/checkout e sem chaves operacionais dos produtos Instant/Dots.
- Essa implantação foi disparada manualmente a partir do GitHub. O projeto não foi linkado para implantar automaticamente alterações da branch principal.
- Observação Vercel API: quando explicitamente enviado `target:"preview"`, a primeira chamada normalizou para `production` e falhou por ausência de `BETTER_AUTH_SECRET`. A segunda implantação omitiu `target` (comportamento de preview por padrão) e usou apenas o **projeto dedicado protegido**; nenhum domínio comercial recebeu deploy.
- Segredo BetterAuth temporário do ambiente QA gerado aleatoriamente; sem acesso ao banco real e nunca copiado em README, PR ou logs.

### B. GitHub Actions — navegador e PostgreSQL descartáveis

- Pipeline: `.github/workflows/agesoma-browser-qa.yml`
- Comando local: `npx playwright test --config playwright.config.mjs`
- Banco: Postgres 16 em container do runner, com usuário/senha exclusivos e descartado ao final.
- BetterAuth: esquema criado apenas neste banco via `npx auth@1.7.4 migrate --config ./apps/web/lib/auth.ts --yes`.
- Autenticação: segredo aleatório novo a cada execução. Nenhum login real de usuário é utilizado.
- Modelos, Paddle e OpenSandbox: deliberadamente sem configuração; nenhuma chamada paga, compra, mensagem externa, CRM ou execução de computadores é permitida.
- Três matrizes de dispositivo: Chromium desktop 1440×900, Chromium Pixel 7 (perfil Android), WebKit iPhone 13.
- Fluxos end-to-end: catálogo Instant e Dots (incluindo distinção visual), responsividade/overflow, demonstração FAQ respondida vs. escalonada, bloqueio de origem maliciosa, payload inválido, proteção de API com tenant falso, cabeçalhos HTTP, acesso à tela de login.
- Relatórios JSON e screenshots são gerados em `qa-artifacts/` e anexados ao GitHub Actions por 7 dias.
- **Gates separados**: `smb-skills-qa.yml` continua testando decisões Node, TypeScript, build, CEO e proteção de execução. Não equiparar testes de mock à prova de agente executando.

## Gates mínimos antes de 10/10

| Área | Como homologar | Status inicial |
|---|---|---|
| Build | Node 24/TypeScript/Next em CI | Já passou antes desta QA |
| Público web | Playwright Chrome/Android/WebKit | Em execução |
| Login/empresa | signup, login, logout e 2 tenants com RLS real | Pendente E2E completo |
| CEO First | entrevista, revisão, confirmação e auditoria de fontes em browser | Testes Node, E2E auth pendente |
| IA/autonomia | CPU Linux/OpenSandbox real com quatro sessões atestadas | Bloqueado, sem executor instalado |
| Segurança | SSRF, CSRF, tenancy, RLS, XSS, assinaturas e dependências | Parcial |
| Voz / Orbe | captura real de áudio e motion fiel ao INSTDESIGN | Pendente |
| Pagamentos | checkout sandbox com Paddle e entitlement real | Pendente |
| Mobile nativo | Flutter/Android Maestro/iOS TestFlight | Fora do escopo desta web QA |
| Custo PME | custo/token/VM em execução, limite e alerta por plano | Ainda sem dado real |

**Política:** a pontuação deve sempre representar testes executados com prova, não quantidade de checks no código. Falhas são blockers; não alterar critérios para obter 100% artificial.

## Como repetir sem credenciais de produção

1. Acesse GitHub Actions → **AGESOMA isolated browser QA** → Run workflow na feature branch.
2. Verifique que a compilação usa Postgres descartável e que `BETTER_AUTH_SECRET` é renovado.
3. Observe três projetos de navegador, download dos screenshots/relatório e falhas.
4. Não reutilize o URL de QA para captar clientes, receber pagamentos ou processar dados reais. Apague o projeto após homologação se não for mais necessário.

## O que não é coberto pelo deploy protegido

A prévia Vercel é útil para revisão visual após login do time na Vercel, mas não tem Neon/BetterAuth de staging provisionado; portanto autenticação, gravação, checkout e computadores não são testáveis por esse link. O GitHub Actions exercita o navegador contra servidor Next + PostgreSQL descartável. Para fluxo transacional completo, é necessário configurar **um banco de staging separado**, migrações completas, dummy users e serviço executor real, com regras de custos.
