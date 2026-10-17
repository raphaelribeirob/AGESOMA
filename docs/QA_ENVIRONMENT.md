# AGESOMA — ambiente de homologação isolado e gates reais

**Data:** 17/10/2026  
**Escopo:** PR #44, branch `feat/agesoma-workforce-computers-20261016`. **Não é produção. Não é atestado 10/10.**

## Ambientes criados

### A. Vercel — QA protegido

- Equipe existente: `R3` (`r3-41f9`), plano Hobby.
- Projeto dedicado: `agesoma-qa-preview` (`prj_7f4fx2j1hJ2PIc4fYgScAyChQBfC`).
- URL da prévia protegida: https://agesoma-qa-preview-finq1b0uf-r3-41f9.vercel.app
- Deployment: `dpl_FC3jAmEbpiqSWFzR1PiSrhAUGsCh`, revisão `67ccb2522d331e7f28cee9462c8347e2ad3f263e`. Revalidar status pela API.
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
