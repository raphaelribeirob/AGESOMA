# Plataforma compartilhada — Instant primeiro, Dots depois

**Decisão de arquitetura:** 17/10/2026  
**Estado:** manifesto e páginas de catálogo implementados na PR #44; **nenhuma migração de aplicativo, login, billing, banco, branding mobile ou execução operacional concluída**.

## 1. Estratégia de produto

O repositório `AGESOMA` passa a funcionar como **núcleo legado e incubadora de infraestrutura reaproveitável** para duas famílias. O nome técnico do repositório, a infraestrutura existente e os contratos do Workforce não precisam ser renomeados prematuramente. O storefront público inicial no próprio AGESOMA deve apontar para **Instant**, com **Dots** como futura família. O app AGE original continua acessível em `/start` e seu Workforce autenticado em `/workforce`, sem afirmações falsas de compatibilidade ou deploy.

A sequência de integração:
1. **Instant**: InstantSpeak, InstantStudy e InstantBible — já mantidos em repositórios independentes.
2. **Dots**: DotSpeak é a referência concreta de produto existente; outros Dot apps só entram com um repositório e contratos validados.
3. **Núcleo**: apenas serviços realmente portáveis (model gateway, custo, observabilidade, workflows e policy), sem arrastar UI, mecanismos de autenticação e módulos B2B que não sejam relevantes.

**Os produtos não devem ser reimplementados dentro do AGESOMA.** Cada app mantém seu próprio repo, deploy/mobile release, domínio opcional, projeto de banco/namespace, modelo de segurança, pagamento e design. Portabilidade é via SDK/adaptadores versionados **opt-in**.

## 2. Fontes canônicas verificadas

- `raphaelribeirob/InstantSpeak`: `README.md` e `DESIGN.md`. Flutter-first, voz como interface; **canvas branco #FFFFFF**, superfícies #F5F3F1, Inter, orbe/identidade conforme especificação própria. A autenticação declarada usa **Firebase Auth + Firestore**; cobranças descritas com InstantPay/Adapty/Paddle. NÃO converter à força ao modelo de sessões Better Auth do AGE.
- `raphaelribeirob/InstantStudy`: `README.md` e `DESIGN.md`. Loop de aprendizado adaptativo, entrada de conhecimento e experiência editorial, que pode incluir superfícies mistas. Não usar o dashboard corporativo AGE como interface de estudo.
- `raphaelribeirob/InstantBible`: `README.md` e `DESIGN.md`. Bíblia offline-first e ritual diário, tradução/locale separados, linguagem visual editorial própria. Respeitar licenças dos textos bíblicos.
- `raphaelribeirob/DotSpeak`: `README.md` e `DESIGN.md`. Produto infantil com arquitetura de tutor e responsável, estilo **warm paper #FBF7F2**, tipografia Plus Jakarta Sans, personagem e segurança específicos. Não inferir consentimento de responsáveis a partir do login de outro app.

**Regra:** o `AGEDESIGN.md` v1.2 Midnight/Linear-like continua sendo só a identidade do **console AGESOMA legado** (`.ageTheme`). Ele não define os visuais Instant/Dots. Nem mesmo todos os produtos Instant usam exatamente a mesma paleta. A experiência publicitária `/instant` é uma vitrine neutra de família, não a UI real dos aplicativos.

## 3. Organização operacional (agora e após migração)

```text
AGESOMA (núcleo/incubadora, monorepo legado)
├─ packages/core/src/product-families.ts       [implementado: manifesto de produtos]
├─ packages/core/src/platform-adapter-policy.ts [implementado: contrato de pré-validação]
├─ apps/web/app/instant/                        [implementado: catálogo público]
├─ apps/web/app/dots/                           [implementado: catálogo futuro]
├─ apps/web/app/families/                       [implementado: UI neutra por família]
├─ apps/web/app/workforce/                      [AGE legado, sem renomear billing]
└─ serviços compartilhados existentes          [ainda NÃO integrados aos apps externos]

REPOSITÓRIOS DE PRODUTOS (independentes)
├─ InstantSpeak/
├─ InstantStudy/
├─ InstantBible/
└─ DotSpeak/
```

## 4. Contratos de integração

O registro `packages/core/src/product-families.ts` define `family`, `productId`, `repo`, `designSource`, `runtime`, namespaces de dados/assinaturas, capacidades recomendadas e **status de integração não verificado**.

A política inicial `packages/core/src/platform-adapter-policy.ts` rejeita combinações inconsistentes de família/produto/tenant/entitlement, capacidades não declaradas e chamadas Dots sem comprovação de consentimento parental. **É apenas uma função pura, ainda não conectada à autenticação de um gateway.** Os valores `verifiedIdentity`, `verifiedEntitlement` e `guardianConsentVerified` só poderão ser preenchidos no servidor a partir de evidências válidas, nunca aceitos de JSON do cliente.

**Controles mínimos para uma integração real:**
- Servidor do produto autentica o usuário e resolve `tenant_id` + `product_id`; nenhum JWT de InstantSpeak dá acesso a DotSpeak por padrão.
- Serviço compartilhado exige token de serviço com `audience`, `issuer`, expiração, escopo por produto e autorização baseada em assinatura confirmada. Rotação/revogação e replay protection obrigatórias.
- `entitlement_namespace` e `data_partition` separados; NÃO reutilizar Paddle SKU de Atendimento como se fosse InstantSpeak/Study/Bible.
- Cobrança de tokens, VM e ferramentas deve atribuir custos ao produto e tenant corretos, com limites próprios. Nenhum saldo é transferido entre apps sem consentimento e contrato de negócio.
- Privacidade: minimizar dados, retenção por produto, exclusão/revogação, nenhuma memória empresarial AGE automaticamente misturada a histórico de estudantes. Dados de crianças não devem ser exportados para agentes sem política legal, consentimento e controles aplicáveis.
- Integrações são **opt-in** via SDK/API versionados e contratos de capability; rollback e testes por produto.
- IDs de produto e namespaces são estáveis; **não** renomear tabelas AGE existentes enquanto houver tenants, cobranças ou workflows em aberto.

## 5. Roadmap seguro e econômico

**Fase A — Base preparada (nesta PR):** registro + namespaces + pré-política isolada + duas páginas públicas + testes e documentação; homepage não autenticada aponta a `/instant`. AGE Workforce e oferta `/start` não são apagados.

**Fase B — Primeiro consumidor Instant:** definir **um** conector testado ponta a ponta, preferencialmente InstantSpeak já com stack Flutter/Firebase: chamada autorizada de gateway no Vercel, contabilização por usuário/produto, quotas, privacidade e retorno sem copiar histórico entre produtos. Testar revogação e entitlement. Só depois conectar segundo e terceiro app.

**Fase C — Família Dots:** integrar DotSpeak com aprovação de responsáveis, dados infantis segregados, política própria de voz/identidade, sem herdar fluxos ou limites desenhados para adultos. Design canônico DotSpeak preservado.

**Fase D — Plataforma multi-produto:** analytics agregados apenas com minimização e finalidade/consentimento, SDK comum com versão, billing reconciliado e gestão central. A opção de compartilhar login/conta deve ser projeto explícito com OAuth/OIDC e migração controlada, não um redirect entre interfaces.

## 6. Critérios de aceite antes de alegar plataforma operacional

- TypeScript/Next/Node CI verde no AGESOMA; regressão do teste de design v1.2 corrigida.
- Vitrine Instant/Dots representa apenas repositórios existentes, sem afirmar apps lançados ou contas compartilhadas.
- 2 produtos e 2 tenants com IDs semelhantes não conseguem acessar dados ou assinaturas cruzadas.
- Consentimento parental DotSpeak devidamente verificado no backend e auditado.
- Uma chamada real de app Flutter → serviço compartilhado com token, custo, limite e revogação demonstrados.
- Apps móveis mantêm DESIGN.md próprios, screenshots testes em aparelhos, acessibilidade e internacionalização.
- Gate de lançamento/monetização depende de métricas reais, testes de segurança, build e deploy separados.

### Decisão visual

A referência escura *Linear Midnight* fica como identidade **opcional do console legado**, não deve se tornar um `:root` global. A família Instant deve privilegiar as experiências claras/editoriais já existentes; Dots mantém visual caloroso e sua identidade/mascote próprios. Não mesclar motions de ElevenLabs, Duolingo, GrokBot e Higgsfield na mesma camada sem estados, propósito e testes explícitos.
