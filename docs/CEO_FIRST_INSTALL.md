# AGESOMA — instalação CEO First / equipe pronta para PMEs

Data: 2026-10-16
Status: **código do primeiro fluxo integrado na PR #44; NÃO implantado em produção**.

## Produto definido

O usuário compra uma empresa de IA já configurada — quatro identidades executivas (CEO+COO, CFO, CMO+CRO e CTO+CPO), sem escolher agentes nem configurar prompts. O CEO é a porta de entrada, aprende primeiro o contexto declarado e confirmado pelo proprietário; só depois novos pedidos podem ser encaminhados aos especialistas. O proprietário aprova permissões e custos antes de ações consequenciais.

Isto inspira-se na experiência de computador/assistentes para agentes, mas **não usa o código da Grok Bot nem promete paridade funcional**. Cada computador separado via OpenSandbox é objetivo técnico, ainda não ligado ao produto.

## Primeira experiência implementada

1. Usuário autenticado abre `/`. Se ainda não confirmou seu perfil empresarial e não há tarefas/decisões prévias pendentes, o servidor o envia para `/workforce/ceo`.
2. O formulário pede nome, setor, oferta, clientes, operação, desafio e objetivo (site HTTPS opcional). `POST /api/workforce/ceo/intake` salva rascunho com `tenant_id`, evento de proveniência e hash da versão. Proprietário/admin deve confirmar explicitamente.
3. `PATCH /api/workforce/ceo/intake` grava revisão apenas se o fingerprint ainda corresponder à versão atual. Edição posterior invalida a confirmação.
4. A tela de CEO mostra, após confirmação, resumo e quatro propostas **sem execução automática**.
5. `/` passa a exibir o objetivo declarado pelo dono e o chat `/api/agesoma` responde perguntas sobre empresa, clientes, oferta e prioridades usando **apenas** o perfil confirmado. Também pode recuperar fatos `business_facts` já revisados, com referências, prazo de validade e supressão de conflitos.
6. `POST /api/agesoma` mantém `approve/deny` de tarefas anteriores e rejeita **novos trabalhos** sem confirmação empresarial; após confirmação, o pedido segue os controles anteriores. O payload para um especialista recebe apenas campos de contexto empresarial permitidos àquela capacidade, marcados como dados declarados, não prova nem grant.
7. A equipe visível continua com quatro agentes; o backend legado ainda tem capacidades internas distintas. **Não há quatro computadores operacionais provisionados**.

## Requisitos para rodar

- Node e Next.js do projeto; instalar dependências do monorepo com `npm install`.
- Neon/PostgreSQL com migrations do repositório aplicadas, incluindo `0009_company_ontology.sql` e `0021_business_understanding.sql`; verificar RLS/tenant isolation no estágio.
- Auth Better Auth e segredos/configuração existentes do projeto.
- Executar localmente conforme scripts do repositório, não instalar endpoints HTTP em produção sem testes.

## Verificações no runner

```bash
node --test tests/ceo-companion.test.mjs tests/ceo-first-setup.test.mjs
npm run typecheck
npm run build --workspace @agesoma/web
```

Testes em staging com dados fictícios de duas PMEs:
- Tenant A não lê o perfil do B; membro sem permissão não altera nem vê rascunho do dono.
- Sem perfil confirmado, acesso autenticado ao home redireciona; criar novo trabalho é negado sem inserir tarefa.
- Confirmação de versão antiga retorna 409; editar invalida a confirmação.
- Pergunta "Como está minha empresa?" cita dados declarados e não inventa receita/vendas.
- Contradições de dois fatos são suprimidas e sinalizadas; documentos não confirmados não entram nas respostas.
- Cada especialidade recebe contexto mínimo; plano de pagamento, JWT, token de API e dado de outro tenant não aparecem.
- Aprovações de tarefas anteriores continuam acessíveis.
- UX em iPhone/Android, teclado, leitores de tela e estados de carregamento.

## O que ainda falta para equivalência operacional

- Conectores autorizados com **leitura inicialmente apenas** (Bling, Omie, CRM, documentos), importação segura de conteúdo, política de retenção/remoção, webhooks e atualização incremental. Não baixar URLs arbitrárias no backend sem proteção SSRF.
- Um **gateway real de LLM** para diálogo livre, RAG híbrido, proveniência e avaliação de respostas. O chat empresarial atual é determinístico e não substitui uma IA generativa com memória.
- Migração tenant-safe das 7 capacidades de especialista para 4 worker identities persistentes.
- Orquestrador e sandbox real por agente, credenciais isoladas, OpenSandbox forte isolamento/proxy de desktop autenticado, humano no controle.
- Ledger de tokens/computador/créditos, limites financeiros aplicados no servidor e Paddle/Stripe Workforce SKU homologado.
- Testes reais CI + Postgres + browser + segurança + deployment, antes de ativar checkout comercial. Rascunho da PR não significa instalação de produção.

## Arquivos alterados

- `apps/web/lib/ceo-context.ts` — acesso a perfil confirmado, fingerprint e tenant.
- `apps/web/lib/ceo-approved-facts.ts` — fatos revisados do Business Understanding Engine.
- `packages/core/src/ceo-conversation.ts` — respostas fundamentadas e projeção mínima por especialidade.
- `apps/web/app/page.tsx`, `apps/web/app/api/agesoma/route.ts` — entrada CEO first, conversa e gate.
- `apps/web/app/workforce/ceo/ceo-companion.tsx` — aponta para chat integrado.
- `tests/ceo-first-setup.test.mjs`, `tests/ceo-companion.test.mjs` + CI.

Esses componentes reutilizam o banco `company_entities`, `ontology_source_events`, `business_facts` e o processo de autenticação existentes, evitando custos com indexações desnecessárias ou VMs sempre ligadas.

**Critério honesto para lançar:** provar que o dono consegue cadastrar a empresa, confirmar, perguntar sobre ela, obter resposta correta com origem e autorizar ao menos uma tarefa com saldo, isolamento e evidência de resultado, de ponta a ponta.
