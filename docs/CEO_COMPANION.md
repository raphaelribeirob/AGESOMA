# AGESOMA CEO Companion — assistente executivo para o dono de PME

Status: especificação de produto + **primeira interface funcional apenas para o briefing declarativo**. Sem IA contextual contínua, agentes autônomos ou desktops OpenSandbox em produção. 2026-10-16.

## Conceito

O CEO + COO é a interface principal do proprietário. Seu comportamento deve evocar um copiloto executivo como o JARVIS da ficção **sem reproduzir marca, identidade, voz ou personagem de terceiros**.

Promessa desejada: "Entenda sua empresa. Saiba o que importa. Autorize o trabalho. Acompanhe o resultado."

Primeira experiência: o proprietário apresenta a empresa, o CEO reúne fatos com proveniência, pergunta o que falta, propõe prioridades e solicita autorização antes de qualquer atividade. A interface deve reconhecer informações incompletas e não inventar métricas.

## Uma equipe pronta, não um construtor de bots
- CEO + COO: conhece o negócio, prioriza, conversa com o dono, coordena execução, monitora o orçamento e relata a situação.
- CFO: custos, caixa, margem e cobranças — leitura primeiro, sem pagamentos automáticos.
- CMO + CRO: aquisição, marca, leads, vendas e retenção — publicar ou enviar mensagens só com autorização.
- CTO + CPO: sistemas, engenharia, produto e experiência — implantar código, mudar acessos e apagar dados somente com aprovação.
- **O CEO é a única interface padrão**, mas cada especialista precisa ter um namespace de memória, sandbox, permissões e limites de uso independentes.
- Quatro identidades por assinatura, **não** quatro computadores sempre ativos. O plano PME propõe computação sob demanda e uso compartilhado em créditos BRL.

## Jornada JARVIS — critérios observáveis

### P0 — CEO conhece a empresa (código adicionado)
1. Owner/admin abre `/workforce/ceo`, preenche 8 campos e confirma explicitamente as informações declaradas.
2. Dados ficam tenant-scoped no ledger da ontologia de companhia existente via `/api/workforce/ceo/intake`; colegas não veem rascunhos não confirmados.
3. **Somente após confirmação**, `CeoCompanion` exibe briefing com origem explícita `owner_supplied_context` e quatro propostas `proposal_only`.
4. O CEO pede três esclarecimentos sobre KPI, trabalho repetitivo e permissões; ninguém é acionado ao abrir uma proposta.
5. Botão permite entrar no chat geral; **o chat ainda não sincroniza automaticamente esse perfil** e o texto informa isso.

Arquivos: `apps/web/app/workforce/ceo/{ceo-intake.tsx,ceo-brief.ts,ceo-companion.tsx,ceo-companion.module.css}`; testes em `tests/ceo-companion.test.mjs`.

### P1 — Conversa com memória do negócio (PARCIALMENTE implementado)
- **Implementado em código:** leitura autenticada do perfil confirmado em `apps/web/lib/ceo-context.ts` com conferência de hash/revisão; respostas empresariais no chat `/api/agesoma` via `ceo-conversation.ts`, com origem declarada. O `business_facts` revisado é consultado com proveniência e conflitos suprimidos por `ceo-approved-facts.ts`.
- **Implementado em código:** projetar um contexto mínimo por capacidade legada em `projectConfirmedCompanyForCapability` e anexar às novas ordens de trabalho com `grantsAuthorization:false`. **Pendente:** gateway de modelo seguro com RAG e isolamento real de permissões; prompt injection em documentos não pode elevar privilégios.
- **Parcial:** a interface CEO apresenta três perguntas de esclarecimento. O chat responde de forma determinística perguntas sobre o perfil, mas ainda não conversa livremente com modelo generativo.
- Respostas devem diferenciar declarações do proprietário, observações das integrações e hipóteses do modelo; não confundir com relatório financeiro auditado.
- Dar opção de corrigir/revogar dados da empresa; controle de retenção, exclusão e logs deve ser efetivo.

### P2 — Briefing de proprietário (NÃO implementado)
- Sob demanda ou com notificação autorizada, emitir **3 fatos, 3 prioridades, 1 decisão pendente**. Se não houver dados atuais, explicar "sem conexões confiáveis".
- Evidência de observação por sistema, período, origem e hora de coleta; sem varrer sites, contas ou WhatsApp sem acesso concedido.
- Mostrar custo estimado em créditos, qualidade da fonte, impacto/risco e proposta de responsável.
- Propostas só deixam `proposal_only` com ordem de serviço, aprovação Sentinel, saldo reservado de forma atômica e budget máximo.

### P3 — JARVIS que executa (NÃO implementado)
- Delegar tarefas ao CFO, CMO/CRO ou CTO/CPO via fila e quatro identidades persistentes, mantendo tarefas legadas válidas até migração tenant-safe.
- Preferir conectores/API. OpenSandbox sob demanda para apps sem API, com isolamento forte, sessão e streaming autenticados e revogação.
- Cada tarefa devolve resumo verificável: pedido, ação realmente executada, evidência, status e créditos utilizados.
- Voz natural apenas com consentimento e áudio real, sem exibir onda sonora fake; fallback para texto, multilíngue, mobile-first.
- Monitoramento proativo é opt-in com frequência e orçamento explícitos; no plano Essencial R$49 o CEO faz atividades leves e não mantém uma VM contínua.

## Exemplos que o CEO DEVE saber distinguir
**Com fatos confirmados do usuário, sem integração:** "Você informou que sua prioridade é reduzir perdas; posso estruturar como medir isso?" — permitido.
**Sem faturamento ou ERP:** "Seu caixa está baixo" — NÃO pode afirmar.
**Sem tarefas provisionadas:** "O CFO já fechou seu relatório" — NÃO pode afirmar.
**Sem permissão de envio:** "Enviei propostas para 20 clientes" — NÃO pode afirmar.
**Com apenas quatro perfis visíveis:** "Cada um trabalha num computador hoje" — NÃO pode afirmar até comprovação de sandbox.

## Design
Seguir `AGEDESIGN.md`: tipografia Manrope/Inter, branco/grafite, azul `#385CE5` só para ações, grade mobile, controles com foco acessível. O produto pode usar o conceito de assistente executivo inspirado em cultura pop, mas a identidade, UI e voz são **AGESOMA originais**.

## Critérios para afirmar que funciona
- Tests Node + TypeScript + build Next + UI em 320/390/768/1440.
- Staging Neon: owner confirma; rascunho de outro tenant não aparece; member sem permissão não lê rascunho; race de revisão retorna 409; edição invalida confirmação.
- Chat recupera apenas dados autorizados do mesmo tenant, explica fontes, não passa prompt injection adiante; retém corretamente e apaga na exclusão.
- Teste de segurança com 4 agentes, budgets, 2 PMEs, falha de provedor, timeout, revogação, aprovação e provas.
- Testes em navegador real, voz nos dispositivos suportados, redução de movimento e travamento de UI.
- Só declarar *JARVIS operacional* após observação de tarefa real concluída com evidência e custo auditado.

**Este documento e P0 não ativam monitoramento em segundo plano, integração de modelos ao briefing ou execução autônoma.**
