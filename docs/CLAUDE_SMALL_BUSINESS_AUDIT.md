# AUDITORIA — Claude for Small Business × AGESOMA Workforce OS

> **Atualização da implementação (16/10/2026):** o primeiro AHA com CSV local foi adicionado ao código de `/workforce/ceo` e o chat roteia quatro categorias de necessidade. Há duas análises locais efetivas (movimentações e leads), um `business-pulse` de uma fonte e plano de conector sem acesso. Isso **não** valida o benchmark completo, nem ativa conectores. Ver [SMB_SKILLS_INCORPORATION.md](SMB_SKILLS_INCORPORATION.md).\n\n**Data da revisão:** 2026-10-16
**Benchmark oficial:** Anthropic `knowledge-work-plugins/small-business`, v1.35.1 (README), documentação Claude Academy e anúncio 2026-09-15.
**AGESOMA inspecionado:** PR #44, branch `feat/agesoma-workforce-computers-20261016`. Somente inspeção de código/documentação nesta auditoria; sem validação funcional no navegador ou CI.
**Notas de referência (estimativas qualitativas):** alinhamento estratégico 8/10; paridade funcional demonstrada 3/10.

## Fontes externas primárias
- Código-fonte e README: https://github.com/anthropics/knowledge-work-plugins/tree/main/small-business
- Onboarding real: https://github.com/anthropics/knowledge-work-plugins/blob/main/small-business/skills/smb-onboard/SKILL.md
- Router de intenção: https://github.com/anthropics/knowledge-work-plugins/blob/main/small-business/skills/smb-router/SKILL.md
- Business Pulse: https://github.com/anthropics/knowledge-work-plugins/blob/main/small-business/skills/business-pulse/SKILL.md
- Neutralidade de conectores: https://github.com/anthropics/knowledge-work-plugins/blob/main/small-business/shared/connector-neutrality.md
- Documentação do plugin: https://academy.claude.com/tutorials/how-to-install-the-claude-for-small-business-plugin
- Atualização Anthropic (15/09/2026): https://claude.com/resources/articles/claude-for-small-business-launches-new-workflows-integrations-and-training-programs
- Licença do repositório: https://github.com/anthropics/knowledge-work-plugins/blob/main/LICENSE

**Contagens diferentes:** Anthropic divulga **43 workflows** e **37 conectores parceiros**; README do repositório v1.35.1 lista **44 skills** incluindo infraestrutura de onboarding, router, brand-style e build-connectors. Não comparar 43 workflows com 44 skills como se fossem a mesma métrica. O repositório tem licença Apache-2.0: reuso de material sujeito a atribuições, licença e avisos necessários; isso NÃO significa que o SaaS AGESOMA já dispõe das integrações ou runtime do Claude Cowork.

## Veredicto

O modelo AGE de um CEO com três especialistas executivos é adequado para PMEs, e o fluxo com proprietário e memória confirmada é uma fundação correta. **Mas Claude começa demonstrando valor com uma tarefa real, enquanto o AGESOMA atualmente exige preencher/confirmar o perfil antes de novas tarefas e depois entrega um briefing determinístico.** A diferença é crítica para ativação.

Recomendação: **CEO conhece o mínimo → escolhe a dor principal → lê 1 fonte autorizada (ou planilha) → entrega 1 resultado real → confirma/aprofunda o Business Context → permite a execução de tarefas com autorização.** A versão atual que impede novos trabalhos antes de perfil completo deve ser redesenhada para permitir um AHA de leitura e sem efeito externo, com escopo, custos e autorização adequados. Escrita, pagamentos e envios permanecem bloqueados até confirmação e aprovação independente.

## Matriz de aderência

| Área | Claude Small Business | AGESOMA PR #44 | Estado e lacuna |
| --- | --- | --- | --- |
| Produto pronto | 44 skills pré-configuradas por domínio + router | Quatro papéis executivos na UI, sete capacidades legadas roteadas | **Parcial**: competências existentes não equivalem a workflows validados end-to-end |
| Primeiro acesso | `smb-onboard`: avaliar contexto existente, conectar até dois sistemas e realizar **uma tarefa útil antes** de entrevista longa; memória e página de boas-vindas | Formulário de oito campos, confirmação, quatro propostas não executáveis | **Parcial / atrito alto** para PME sem tempo |
| Memória de empresa | Contexto persistente revisado e editável, regras/estilo de marca e preferências de entrega | `ceo-context.ts` valida fingerprint + aprovação; `business_facts` revisados com origem e conflitos | **Parcial**: falta ingestão, preferências e atualizar automaticamente o contexto de todas as skills |
| Router | `smb-router`: intenção em linguagem natural → uma skill concreta com próxima ação | `ceo-conversation.ts` usa matcher determinístico para algumas perguntas; tarefas legadas utilizam roteamento distinto | **Parcial**: sem router por workflows completo e sem conversa empresarial livre |
| Dados e integrações | 37 conectores, preferir já conectados; neutralidade por categoria; sem conectar usa CSV/PDF | Registro genérico e arquitetura planejada; sem Omie/Bling/ERP/doc de ponta a ponta comprovados | **Grande lacuna** |
| Briefing executivo | `business-pulse` e `monday-brief` usam caixa, vendas, CRM, calendário, fontes, números e prioridades | Objetivos/dificuldades declarados em texto; sem métricas de sistemas atuais | **Não equivalente** |
| CFO | forecast caixa, contas, reconciliação, cobrança, preparação de folha/impostos | Função CFO/finance mapeada, cálculo de custos do próprio produto, propostas | **Sem fluxo financeiro PME comprovado** |
| Marketing / Receita | prospecção, speed-to-lead, CRM, win-back, campanha e marketing-monday | CMO+CRO definidos; algumas capacidades de marketing/sales legadas | **Sem E2E com dados/ações comerciais comprovado** |
| Operação | restock, email, inventário, tickets, relatórios, lembretes | atendimento FAQ pré-existente e perfil CEO+COO | **Parcial**, ausência de cadeia integrada |
| Personalização | aprende marca, políticas, tom, formatos e edita só o que mudou | Design AGEDESIGN para AGESOMA; não é a identidade da PME cliente | **Lacuna**: Brand Kit **por empresa**, não alterar o design do SaaS |
| Aprovação | por padrão nada envia, publica, paga sem OK; mesmo em modo agendado | guardrails/Sentinel previstos e infraestrutura parcial | **Direção alinhada**, aprovação real fim a fim não demonstrada |
| Execução / desktop | Cowork opera arquivos/conectores e automações | scripts OpenSandbox local piloto + UI fictícia explicitamente inativa | **Não equivalente**, sem computador operacional no cliente |
| Recorrência | semanal, lembretes e workflows agendados | jornada proposta P2 e infraestrutura de tarefas pré-existente | **Não validado** |
| Localização / pagamento | fluxos financeiros majoritariamente EUA e integrações globais | posicionamento Brasil PME e BRL R$49/R$129/R$249 proposta | **Potencial diferencial**, sem checkout Workforce, tributos e medição homologados |
| Segurança / fontes | limite de permissões das contas, aprovações e fonte de cada métrica | isolamento tenant no código, perfil owner-confirmed, grants apartados, verificação de hash, contexto mínimo por especialista | **Boa base de segurança**, requer testes integrados RLS e reconciliação |

## A maior correção necessária: primeiro AHA

A versão atual do CEO exige muito **antes** de demonstrar benefício. A skill oficial `smb-onboard` se concentra na primeira tarefa de valor, mesmo com CSV e sem conector. O AGESOMA deve adotar:

1. **Pergunta única inicial:** "Qual problema mais te preocupa hoje: caixa, vendas, clientes ou operação?" Não pedir todos os oito campos em sequência antes de mostrar uma ação útil.
2. **Identidade mínima:** nome/atividade e consentimento; em seguida conectar uma fonte **read-only** por escolha da empresa ou upload CSV/XLSX/PDF.
3. **Um resultado real em minutos:** segundo a dor, saldo/cobranças sinalizadas com documento, funil de leads com CSV, dúvidas frequentes com FAQ, ou relatório de estoques com base real.
4. **Origem e limite:** mostrar arquivo/sistema, data, universo de dados, campos ausentes e confiança; a IA não inventa indicadores.
5. **Completar contexto + confirmar:** preservar revisão do proprietário e fingerprint, registrar país/moeda/ano fiscal quando relevantes, tamanho, ferramentas e preferências de saída.
6. **Delegar com aprovação e custo:** uma ordem de trabalho orçada por especialista; nada externo sem confirmação e permissão por tarefa.

Para manter R$49/mês: primeiro resultado determinístico ou modelo econômico, sem OpenSandbox salvo necessidade real; sem VM permanente; não assumir OCR gratuito ou conexões mágicas.

## Skills para priorizar por equipe

| Prioridade | CEO+COO | CFO | CMO+CRO | CTO+CPO |
| --- | --- | --- | --- | --- |
| MVP | `smb-onboard`, `smb-router`, `business-pulse` | `cash-flow-snapshot`, `invoice-chase` | `lead-triage`, `speed-to-lead` | `build-connector` (aprovação, somente leitura), inventário de sistemas |
| Após AHA | `monday-brief`, `report-pack` | `month-end-prep` | `crm-autopilot`, `marketing-monday` | `build-agent` (rotinas aprovadas), experiência do cliente |
| Futuro | coordenação cross-funcional agendada | folha/impostos com revisões profissionais e localização fiscal | campanhas, win-back e ads | automação operacional adaptada ao segmento (sem exigir engenharia de software de uma loja) |

**O CTO+CPO não deve exigir que o cliente seja uma startup de software:** para comércio/serviços sua função primária é sistemas, integrações, automações e experiência do cliente, não escrever código por padrão.

## Princípios que vale absorver do código Claude
- `smb-router`: mapear pedido para **uma skill concreta**, sem perguntar qual agente quer usar.
- `smb-onboard`: retornar ao perfil existente sem reentrevistar; conectar uma ferramenta por vez; primeiro AHA; guardar contexto com aprovação.
- `business-pulse`: juntar fontes em paralelo, omitir o que não está disponível, valores com período/delta e referência, escolher prioridade específica.
- `shared/connector-neutrality`: conectar **o que a PME já usa**, não forçar uma marca. Com dois ERPs, eleger um sistema-fonte para um total (evitar dupla contagem).
- `brand-style`: um kit por cliente com cores, logo, tom e formato de entregáveis, independente da identidade visual AGE do produto.
- `build-connector`/fallback: CSV/PDF sob permissão quando ERP não tem API; conexão com terceiros requer consentimento, escopo, segurança e indicação dos custos.
- `approval checkpoints`: aprovar em cada efeito externo, não apenas uma confirmação genérica de empresa.
- Não importar skills markdown e supor que funcionam: é preciso **tools**, execução controlada, esquema de dados, evidência, teste e permissão reais.

## Critérios objetivos de aceite — MVP competitivo (não atingidos)

1. Usuário novo consegue chegar a um resultado **verificável com um arquivo ou conector** sem ser obrigado a concluir um questionário longo.
2. Segunda sessão recupera perfil anterior, pergunta apenas mudanças e não mistura dados de outra empresa.
3. "Como está minha empresa?" traz **pelo menos um indicador de uma fonte real**, nome, janela, timestamp e inconsistências; sem fonte, avisa e não preenche.
4. Empresa sem conectores gera um resultado com CSV/PDF e distingue dados inseridos dos verificados.
5. CEO resolve intents para 4 áreas e expõe a skill que realizou cada passo; CTO serve também empresa não-software.
6. Uma ação consequencial passa por orçamento, autorização explícita, serviço de execução e evidência independente.
7. 2 tenants com perfis semelhantes não têm vazamento cruzado; membros não podem ler rascunhos sensíveis nem credenciais que não possuam.
8. Testes de custo no plano de R$49 validam p50/p90 e limites; excedente automático sempre negado por padrão.
9. Build/TypeScript, CI, testes de integração com Neon e QA mobile passam; não lançar até essas evidências.
10. Só marcar P3 como operacional quando 1 tarefa real puder ser completada do início ao fim com logs, prova, revogação e custo.

## Notas de precisão / dívida documental
- `docs/CEO_COMPANION.md` ainda inclui a frase antiga de que o chat "não sincroniza automaticamente"; o código recente já lê o perfil owner-confirmed. Atualizar essa descrição para eliminar inconsistência.
- A PR #44 segue draft, e os quatro perfis da UI ainda não representam quatro identidades persistentes migradas em banco nem sessões OpenSandbox separadas. Qualquer anúncio de "44 workflows prontos" ou "GrokBot operacional" no AGESOMA seria falso.
- Sem comandos executados, testes de app/Node/Vercel/Neon e sem validação de integração neste relatório. As notas são **julgamento de aderência**, não percentuais de testes passados.

## Decisão recomendada

**Manter os 4 agentes com CEO central. Importar a filosofia de onboarding e o catálogo de skills (não a marca/interface Claude); construir PRIMEIRO um `CEO AHA` com 1 fonte, 1 trabalho real e 1 página de prioridades.** Não copiar os 44 fluxos de uma vez e não manter uma VM por agente ligada o dia inteiro. O diferencial do AGESOMA deve ser brasilidade, UX mobile, preço acessível e primeira experiência realmente útil, com segurança e provedores intercambiáveis.
