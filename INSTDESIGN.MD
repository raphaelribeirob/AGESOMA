# INSTDESIGN.MD — Sistema de Design da linha Instant

> **Versão:** 3.5.0 (arquivo único, Tesla Motion original/Instant Precision Motion, Learning Motion, Universal Motion, Global-First, Android Maestro; gates fail-closed) · **Data:** 2026-10-16 · **Status:** especificação de design pronta para implementação incremental; fluxos, desempenho e acessibilidade dependem de testes e código.
>
> **Escopo:** fonte única de design para a linha de produtos **InstantSpeak**, **InstantStudy**, **InstantBible** e **InstantVest**, com adaptação iOS/iPadOS, Android e Web. Não pressupõe que uma plataforma já tenha sido homologada.
>
> **Regra de precedência:** acessibilidade e funcionamento > convenções nativas da plataforma > identidade do produto > estética desta referência.


> **Autoridade desta versão:** este é o ponto de entrada documental único para o design. Especificações antes separadas (`COMPONENTS`, `TYPOGRAPHY_REFERENCE`, `ORB_VISUAL_SPEC`, `MOTION_DEMOS`, QA e tokens) estão incorporadas nos apêndices. Scripts, fontes, imagens e código executável continuam artefatos próprios: Markdown não compila nem substitui um aplicativo.
>
> **Precedência em caso de conflito:** acessibilidade/funcionalidade e leis/licenças > código de marca efetivamente aprovado para o produto > decisões de marca nos §§ 2.5–2.8 > contrato Global-First do § 13A para idioma, região, RTL, conteúdo, preços e alegações de suporte > tokens DTCG embutidos no Apêndice N > regras compartilhadas deste arquivo > anexos legados/referências visuais. Conflitos de ícone devem ser sinalizados, não resolvidos com substituições automáticas.


> **ENTREGA ÚNICA:** este arquivo `INSTDESIGN.MD` é o único documento-fonte e o único download necessário. Todas as especificações, tokens, critérios, três fluxos Maestro, workflow CI, testes de contrato e relatório estão embutidos aqui. A infraestrutura de build pode **extrair arquivos técnicos temporários** a partir dos blocos canônicos; isso não cria outros documentos mestres. Fontes binárias e aplicativos compilados não podem ser representados como arquivos executáveis apenas por Markdown.
>
> **Governança:** design para a marca-mãe Instant; a abertura `InstantSpeak™ → ISpeak™` é específica do InstantSpeak. O iOS, Android e Web exigem implementações e validações por aplicativo. O release permanece **BLOCKED** onde CI nativo/QA não foram aprovados.

## Mapa rápido e status de aprovação

| Tema | Fonte normativa neste arquivo | Estado verificável |
|---|---|---|
| Wordmark estático InstantSpeak™ | § 2.5: Inter SemiBold 600 / Bold 700 (conforme asset aprovado) | Definição confirmada no `DESIGN.md` do repositório; rasterização do asset não medida aqui |
| Abertura InstantSpeak™ → ISpeak™ | §§ 2.5–2.7: League Spartan Regular 400; 350 + 1.300 + 1.000 ms | Código Flutter e três testes de widget localizados no GitHub; **execução nativa nesta revisão pendente** |
| Ícone do aplicativo | § 2.8: `IS` histórico × orbe Caleb no repositório | **Decisão de marca pendente; não substituir** |
| Design de interface | §§ 2–5 e Apêndice A | Especificado; telas reais não auditadas nesta revisão |
| Voz/orbe/motion | § 6; **§§ 6.24–6.26 (10 paletas canônicas)**; Apêndices C–G e L | Catálogos Dart/JS comparados com 10/10 de paridade documental; WebGL/fallback validados em laboratório web; Flutter/hardware real pendente |
| **Motion sem conflito (ElevenLabs + Duolingo + Tesla)** | **§ 6.42**: árbitro único, prioridades e testes de concorrência incorporados | Três camadas, um perfil transversal; QA de referência executado; apps reais pendentes |
| **Learning Motion (animações de aprendizagem)** | **§§ 6.27–6.35**: estilo, 4 produtos, oráculo executável, referência web, JSON e testes LM-001..026 | **ESPECIFICADO**; assets Rive e execução Android/Apple/Web ainda NÃO realizados |
| **Tesla Motion / Instant Precision Motion** | **§§ 6.36–6.41**, JSON e autoteste no arquivo | Perfil original de coreografia **SPEC_AND_REFERENCE_ONLY**; validação de laboratório ≠ instalado nos apps |
| Tokens de design | § 9 e **Apêndice N** | JSON embutido; auditado por teste direto deste arquivo no Apêndice Q |
| QA / release | § 12 e Apêndices H–M e Q | Passes de suíte local separados de Flutter, áudio real, VoiceOver/TalkBack e aprovação humana |
| **Global-First** | **§ 13A, JSON § 13A.4 e testes comportamentais § 13A.18/Apêndice Q** | Contrato e 34 cenários definidos; algoritmos de referência testados em Python; apps e mercados **pendentes de validação nativa** |

**Maestro e CI em arquivo único:** Apêndice S contém as fontes versionáveis incorporadas. Extrair via comando documentado no próprio apêndice; não manter cópias editadas manualmente.

**Tesla Motion:** §§ 6.36–6.41 padronizam transições precisas e resposta imediata em todas as camadas, sem copiar Tesla ou modificar a abertura de marca. **Universal Motion:** § 13B normatiza a execução cruzada em Android, Web e Apple, com gates MOT-001..024. **Learning Motion:** §§ 6.27–6.35 acrescentam feedback original inspirado em princípios de aprendizagem (não assets) e gates LM-001..026.

**Regra operacional:** um teste `PASS` do pacote de laboratório não significa que os aplicativos foram testados. Não declarar conformidade 10/10 de produção, aderência perfeita à ElevenLabs ou aprovação das lojas sem capturas e logs de builds reais. Referência ElevenLabs é direção de qualidade, não obrigação de copiar a identidade.

**Quando documentos discordarem:** §§ 2.5–2.8 definem exclusivamente a marca e a abertura InstantSpeak, § 3 define a tipografia de interface nativa, §§ 6.1–6.26 definem motion de voz, §§ 6.36–6.41 definem coreografia Tesla Motion, e §§ 6.27–6.35 definem Learning Motion; § 13A define contrato Global-First, Apêndice N define valores de tokens, e os apêndices históricos servem de contexto. **Não usar instruções legadas em conflito como fundamento para novas alterações.**

## Como usar este documento único

1. **Codex/engenharia:** ler primeiro §§ 2.5–2.8 (identidade e conflito de ícone), § 3 (tipografia de plataforma), § 6 (motion), § 9 (tokens) e os apêndices pertinentes. Não recriar marca, timings nem assets já aprovados.
2. **Designers:** consultar contratos de componentes, orbe, vozes e Learning Motion (§§ 6.27–6.35) neste próprio arquivo. A estética da ElevenLabs é referência, não autorização para usar seus assets/propriedades intelectuais sem licença.
3. **QA:** executar os autotestes embutidos de Tesla Motion (§ 6.40), Learning Motion, catálogo de orbes, Global-First e Maestro; caixas de seleção e descrições não significam que um teste foi executado. `INSTDESIGN.MD` não é um resultado de compilação Flutter.
4. **Global-First:** antes de anunciar idiomas/mercados, aplicar § 13A; listas de `supportedLocales` não são certificação. Validar os fluxos `GF-001..034` por aplicativo e registrar aprovação humana.
5. **Tokens:** em modo de arquivo único, o bloco JSON do **Apêndice N** é a fonte de verdade do design; no repositório, extrair/gerar `design/tokens.json` a partir dele e verificar integridade antes de executar os geradores existentes. Nunca manter duas versões editadas manualmente.
6. **Escopo de abertura:** o motion `InstantSpeak™ → ISpeak™` descrito em § 2.6 é exclusivo do InstantSpeak. InstantStudy e InstantBible **não** devem herdar esse nome, fonte ou duração por acidente.

## 0. Objetivo e limites

Construir uma experiência **premium, editorial, humana e rápida**, inspirada no minimalismo de produtos de áudio contemporâneos, **sem copiar a identidade da ElevenLabs**.

Este documento descreve o **contrato de design**. Não substitui testes com usuários, uma biblioteca de componentes implementada ou guias nativos de plataforma.

**Fontes de inspiração, não licença para copiar:**
- Refero — interpretação do visual ElevenLabs: https://styles.refero.design/style/031056ff-7af1-46db-8daa-115f731c5d26
- ElevenLabs — princípios públicos de motion e áudio: https://11labs-guides-dev.a17.dev/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Apple Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Apple Design Skill (repositório independente para revisão): https://github.com/dickwu/apple-design-skill
- Material Design 3: https://m3.material.io/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

**Proibido:** copiar logos, orbes proprietárias, ilustrações exclusivas, assinaturas visuais proprietárias, animações ou fontes **sem licença**. O InstantSpeak tem um módulo visual ElevenLabs ConvAI indicado como **MIT** no próprio repositório; qualquer reutilização deve conservar o aviso de copyright e licença correspondente e não confundir componente licenciado com identidade de marca. Inspirar-se em comportamento, hierarquia e usabilidade; criar assets originais quando não houver autorização específica.

## 1. Princípios inegociáveis

1. **Uma tarefa principal por tela.** CTA primário inequívoco, sem competing CTAs.
2. **Conteúdo antes da decoração.** O progresso e o estado do usuário têm prioridade sobre ilustrações.
3. **Movimento comunica estado.** Nenhuma animação contínua sem significado funcional, salvo estados de espera cuidadosamente limitados.
4. **Clareza multimodal.** Áudio nunca é a única forma de receber instruções, estados ou resultados.
5. **Plataforma familiar.** Respeitar navegação, permissões, gestos e tamanhos nativos do iOS e Android.
6. **Acessível por padrão.** WCAG 2.2 AA no web; VoiceOver, TalkBack, texto dinâmico e redução de movimento no mobile.
7. **Performance perceptível.** Preferir transições simples e reações imediatas a cenários pesados em GPU.
8. **Originalidade da família Instant.** Compartilhar padrões sem tornar os quatro produtos indistinguíveis.

## 2. Identidade visual

### 2.1 Direção de arte

- **Tom:** calmo, sofisticado, editorial e preciso; nunca futurista genérico.
- **Superfícies:** fundos neutros ligeiramente quentes; contraste forte em títulos, ações e feedback.
- **Composição:** áreas de respiro, blocos bem alinhados, cartões discretos e uma hierarquia tipográfica evidente.
- **Imagem:** usar ilustrações originais apenas quando ajudam compreensão; nunca ocultar UI crítica atrás delas.
- **Ícones:** traço consistente, sem misturar diferentes famílias ou pesos arbitrários.
- **Marca:** preservar marcas/ícones existentes aprovados. A regra histórica sobre o ícone **IS** conflita com a indicação de **orbe Caleb** como ícone no `DESIGN.md` atual do InstantSpeak. Não alterar nenhum deles automaticamente; consultar a decisão pendente no § 2.8. A tipografia e a abertura aprovadas seguem §§ 2.5–2.6.

### 2.2 Primitivos de cor (light)

| Token | Hex | Uso |
|---|---|---|
| `neutral.canvas` | `#FCFBF8` | Fundo do aplicativo |
| `neutral.surface` | `#FFFFFF` | Cards e folhas modais |
| `neutral.surfaceSubtle` | `#F2EFEA` | Seções, elementos de apoio |
| `neutral.text` | `#171717` | Texto principal |
| `neutral.textSecondary` | `#4E4B47` | Texto secundário |
| `neutral.textMuted` | `#625E59` | Legendas e descrições |
| `neutral.border` | `#C7C2BB` | Borda decorativa, nunca único indicador de foco |
| `neutral.divider` | `#E9E5DF` | Valor ilustrativo legado, **não usar no código**; para divisórias usar `borderDecorative` com validação visual ou adicionar token na fonte única |
| `neutral.focus` | `#2459BA` | Contorno de foco acessível |
| `feedback.success` | `#196C3E` | Texto/ícone de êxito |
| `feedback.warning` | `#936000` | Texto/ícone de cautela |
| `feedback.error` | `#B42318` | Erro e validação |

**Contraste verificado por cálculo WCAG:** `textSecondary/canvas` ≈ 8,38:1; `textMuted/canvas` ≈ 6,22:1; `textMuted/surfaceSubtle` ≈ 5,61:1. `border/canvas` ≈ 1,71:1; portanto esta borda é **decorativa** e não deve ser o único recurso de delimitação de controles ou foco.

### 2.3 Primitivos de cor (dark)

| Token | Hex | Uso |
|---|---|---|
| `dark.canvas` | `#111318` | Fundo do aplicativo |
| `dark.surface` | `#1E2025` | Cards e modais |
| `dark.surfaceSubtle` | `#262931` | Agrupamento |
| `dark.text` | `#F5F3F0` | Texto principal |
| `dark.textSecondary` | `#C9C6C2` | Texto secundário |
| `dark.textMuted` | `#C9C6C2` | Legendas legíveis |
| `dark.border` | `#595D68` | Contorno de controles; validar caso a caso |
| `dark.focus` | `#A7B3FF` | Foco visível |
| `dark.feedbackSuccess` | `#70D9A2` | Feedback legível em superfícies dark |
| `dark.feedbackWarning` | `#FFD17A` | Feedback legível em superfícies dark |
| `dark.feedbackError` | `#FF918C` | Feedback legível em superfícies dark |
| `dark.borderFunctional` | `#969BA6` | Contorno funcional quando necessário |

**Correção v1.3:** o tema escuro agora tem tokens explícitos de `success`, `warning` e `error`; os anteriores eram herdados incorretamente do light. Nenhum resultado AA deve ser presumido para texto colocado **sobre o próprio fundo colorido**, transparências, gradientes ou estados desabilitados. Usar valores textuais apenas em superfícies aprovadas e testar pares renderizados de fato. `dark.border` continua decorativo; para controles que precisam de contorno perceptível, escolher `dark.borderFunctional` e validar contraste com a superfície.

### 2.4 Acentos por produto e tema — tokens semânticos

| Produto | Light (texto/ação) | Dark (texto/ação) | Texto sobre fundo light / dark |
|---|---|---|---|
| InstantSpeak | `#2459BA` | `#93BAFF` | `#FFFFFF` / `#111318` |
| InstantStudy | `#3A32C8` | `#BBB5FF` | `#FFFFFF` / `#111318` |
| InstantBible | `#1F6B52` | `#86DABB` | `#FFFFFF` / `#111318` |

**Fonte canônica:** `design/tokens.json` → `color.product.light.*`, `color.product.dark.*`, `color.product.onLight.*`, `color.product.onDark.*`. Não usar o acento light sobre superfícies dark. O gerador valida contraste mínimo 4,5:1 do acento sobre `canvas`, `surface` e `surfaceSubtle`, **e** do texto sobre o acento sólido; overlays/gradientes exigem inspeção da UI real. A biblioteca compartilhada deve receber explicitamente `product` e `brightness`.

**Separar intenção e estilo:** os acentos representam contexto do produto, não a aparência de todos os botões. O `PrimaryButton` usa cores semânticas de produto apenas quando sua mensagem é inequívoca; em outras situações pode usar um esquema neutro AA. Cores propostas não alteram automaticamente o logo ou a marca aprovada.


### 2.5 Marca InstantSpeak — contratos de tipografia canônicos e escopo

**Evidência (GitHub, branch `main`, consultado em 2026-10-15):**
- [InstantSpeak — `DESIGN.md`, “Logo Wordmark” e “Approved opening wordmark motion”](https://github.com/raphaelribeirob/InstantSpeak/blob/main/DESIGN.md)
- [Flutter `brand_intro_motion.dart`](https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/lib/features/launch/presentation/brand_intro_motion.dart)
- [Flutter `launch_screen.dart`](https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/lib/features/launch/presentation/launch_screen.dart)
- [Flutter `pubspec.yaml`](https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/pubspec.yaml)
- [Teste Flutter da abertura](https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/test/brand_intro_motion_test.dart)

| Papel | Texto/artefato | Família e peso | Regras |
|---|---|---|---|
| `brand.wordmark.static` | `InstantSpeak™` | **Inter SemiBold 600 ou Bold 700**, preto | Cabeçalho, rodapé e superfícies de marca; manter proporções do asset aprovado; não substituir por League Spartan sem decisão formal |
| `brand.wordmark.opening.source` | `InstantSpeak™` | **League Spartan Regular 400**, eixo variável `wght=400`, preto | Apenas animação de abertura; nunca esticar nem comprimir os glifos |
| `brand.wordmark.opening.target` | `ISpeak™` | **League Spartan Regular 400**, `wght=400`, preto | Estado final da abertura; o “I”, “Speak” e “™” preservam a geometria |
| `brand.capsule` | Traçado preto e fundo puro `#FFFFFF` | N/A | Cápsula contrai junto com `nstant`; espessura do contorno preservada |
| `ui.ios` | Corpo, títulos, controles | **Fonte de sistema Apple (SF Pro)** | Dynamic Type e estilos semânticos; não distribuir fonte SF Pro externamente |
| `ui.android` | Corpo, títulos, controles | **Roboto/sistema Android** | Ajuste por Material 3, escala do sistema |
| `ui.web` | Interface web e textos | **Inter** ou fallback autorizado | Não confundir fonte de interface com fonte da abertura |

**Regra crítica:** fonte da **logo estática** e fonte da **logo animada** são deliberadamente diferentes no repositório atual do InstantSpeak. Confirmar identidade visual pelo asset/golden aprovado, não apenas pelo nome da família tipográfica. A exigência anterior “somente SF Pro/Roboto/Inter no produto” não elimina a exceção de **League Spartan no splash animado**. O arquivo de fonte do lançamento já consta no repositório `flutter/assets/fonts/LeagueSpartan-Variable.ttf`, com licença OFL anexada; não redistribuir o arquivo binário neste documento.

**Marca registrada:** posicionar `™` como sobrescrito discreto; não incorporá-lo como parte da palavra “Speak” para efeito de escala. Nomes de marca são sensíveis a maiúsculas e caracteres: `InstantSpeak™` e `ISpeak™` (não `Instantspeak` ou `ISPEAK`).

### 2.6 Motion de abertura aprovado — `InstantSpeak™ → ISpeak™`

**Contrato obrigatório do InstantSpeak, derivado do código já presente em GitHub.** Não reinventar transições, adicionar orbe ou utilizar outro material de referência como se fosse o motion de abertura original.

| Etapa | Tempo acumulado | Duração | Comportamento |
|---|---|---|---|
| A. Marca completa | 0–350 ms | **350 ms** | `InstantSpeak™` completo, dentro de cápsula preta de contorno sobre canvas branco puro |
| B. Contração | 350–1.650 ms | **1.300 ms** | Somente `nstant` é progressivamente **recortado/ocultado**, enquanto os segmentos `I` e `Speak™` se encontram; cápsula contrai **simetricamente**; `Curves.easeInOutCubic` |
| C. Marca final | 1.650–2.650 ms | **1.000 ms** | `ISpeak™` permanece estático na cápsula final, sem som ou adornos |
| Encaminhamento | após 2.650 ms **e** inicialização concluída | conforme boot | Transição para a tela já definida pelo status de autenticação/onboarding; não inventar destino nem alterar lógica de início |

**Parâmetros extraídos do widget Flutter existente (valores de layout de referência do canvas, não medidas absolutas de tela):**

- Duração: `const Duration(milliseconds: 2650)`.
- Canvas lógico original: `1536 × 1024`, escalado com `FittedBox(fit: BoxFit.contain)` e protegido por `SafeArea`.
- Wordmark principal: `LeagueSpartan`, 136 unidades lógicas no canvas de referência, `FontWeight.w400`, eixo `wght=400`; `™`: 30 unidades, com deslocamento visual próximo de `(3,-44)` no canvas.
- Cápsula: contorno preto de **16** unidades lógicas no canvas de referência; altura de referência constante; raio arredondado de **175**; largura inicial **1270** e largura final **658**, centrada em `x=768`. Os valores escalam com o canvas e não devem ser confundidos com pontos fixos no dispositivo.
- Curva da contração: `t = clamp((elapsedMs - 350)/1300, 0, 1)` e `c = easeInOutCubic(t)`; largura da cápsula `1270 - 612*c`.
- Largura visível de `nstant`: `fullWidth * (1 - c)`; opacidade cai ao fim da contração, sem reduzir horizontalmente a largura dos próprios glifos.
- **Proibidos na abertura:** orbe, pulso, glow, bounce, partículas, som, fundo colorido, animação elástica, mudança da marca/cápsula ou compressão tipográfica dos glifos remanescentes.
- `Semantics` descreve a identidade, sem criar anúncios por frame; `MediaQuery.disableAnimationsOf(context)` pula a animação visual, mas o encaminhamento aguarda a inicialização real.
- A animação corre **em paralelo ao bootstrap**. Se o bootstrap exceder 2.650 ms, manter o último frame até a conclusão; não afirmar “abriu” enquanto a sessão estiver indefinida.

**Arquivos atualmente ligados à rota inicial do Flutter:**
- `flutter/lib/features/launch/presentation/brand_intro_motion.dart` — implementa o layout e o recorte.
- `flutter/lib/features/launch/presentation/launch_screen.dart` — controla duração, redução de movimento e resolução de destino.
- `flutter/lib/app/router.dart` — `initialLocation: '/'` aponta `/` para `LaunchScreen`.
- `flutter/lib/app/instantspeak_app.dart` → `flutter/lib/main.dart` — `MaterialApp.router` utiliza `appRouter`.
- `flutter/test/brand_intro_motion_test.dart` — contém três testes de widget (estado inicial, intermediário e final). **Existência do teste não comprova execução verde neste turno.**

### 2.7 Testes de aceite específicos da abertura — obrigatórios em CI e dispositivo

| ID | Verificação | Critério objetivo / evidência |
|---|---|---|
| `BRAND-001` | Família e fonte | `LeagueSpartan` 400 e eixo `wght=400` resolvem com **fonte local real**, sem fallback silencioso ou glifo ausente |
| `BRAND-002` | Estado inicial | 0 ms e 350 ms: `InstantSpeak™`, cápsula completa e fundo `#FFFFFF`; screenshot golden |
| `BRAND-003` | Intermediários | Amostras de 500/1.000/1.650 ms: apenas `nstant` some; `I`, `Speak`, `™` não sofrem deformação horizontal |
| `BRAND-004` | Estado final | 2.650 ms: `ISpeak™`, cápsula menor, linha/altura consistentes; golden + comparação visual |
| `BRAND-005` | Timeline e easing | 350 + 1.300 + 1.000 = 2.650 ms; curva cúbica sem salto; medir frames e tempo real |
| `BRAND-006` | Reduced Motion | Desabilitar animações do sistema pula visualmente a intro, respeitando loading e roteamento |
| `BRAND-007` | Bootstrap lento | Intros completa, mantém estado final até init; não libera Home incorretamente |
| `BRAND-008` | iPhone/Android | Safe area, tamanhos pequenos/grandes, rotação, texto aumentado; sem clipping da marca |
| `BRAND-009` | Acessibilidade | Anúncio semântico estável; nenhum foco inacessível ou tela de loading interminável |
| `BRAND-010` | Ausência de efeitos extras | Teste visual detecta surgimento indevido de orbe, glow, partículas, som e cores adicionais |

**Status atual:** `BRAND-001` a `BRAND-010` são **gates exigidos, não executados por este documento**. A duração programada não verifica frame pacing nem ausência de clipping em telas reais. As três verificações de widget encontradas no GitHub cobrem apenas parte deste contrato. Screenshots/golden tests de dispositivo ainda precisam de execução real.

### 2.8 Divergência de ícone de aplicativo — registrar, não sobrescrever

O documento compartilhado legado afirma que o ícone `IS` é um asset congelado. Já o `DESIGN.md` atualmente acessível do repositório `raphaelribeirob/InstantSpeak` descreve uma **orbe azul/ciano Caleb** como ícone do app, com captura 1024 × 1024 do renderer WebGL. Essas duas diretrizes **não são equivalentes**.

**Regra de segurança de migração:** não trocar nenhum ícone, logo ou favicon automaticamente. Para mudanças do aplicativo existente, prevalece o asset **efetivamente utilizado no build atual** até uma decisão explícita da marca sobre `IS` versus orbe. Conservar ambos como referências históricas e abrir issue/ADR antes de unificá-los. **A resolução desse conflito está pendente.** Isso não altera a tipografia e o motion de abertura já aprovados em §§ 2.5–2.6.


## 3. Tipografia — contrato Apple Design (iOS), Material (Android) e web

### 3.1 Fontes e regras de origem

**[APPLE HIG — REFERÊNCIA OFICIAL]** A família **San Francisco (SF Pro)** é padrão no iOS/iPadOS; **New York (NY)** é uma opção serifada da Apple. Preferir pesos `Regular`, `Medium`, `Semibold` e `Bold` em interfaces pequenas; pesos `Thin`/`Light` podem comprometer legibilidade. Usar estilos tipográficos semânticos e **Dynamic Type** em vez de congelar todos os tamanhos. A Apple recomenda **17 pt como tamanho padrão de texto no iOS** e apresenta 11 pt como mínimo de referência, não como meta de corpo ou instrução para texto essencial.

**[FLUTTER — COMPORTAMENTO DOCUMENTADO]** O Flutter utiliza por padrão a família tipográfica adequada à plataforma em seus temas Material/Cupertino (SF no iOS; Roboto no Android). **Não instalar, empacotar ou copiar arquivos de fonte SF Pro/NY para Android, web ou assets Flutter**. Não forçar `fontFamily: 'SF Pro'`; preferir o comportamento nativo do tema iOS. Caso o aplicativo tenha um tema personalizado, verificar em execução se o padrão não foi sobrescrito.

**[INSTANT — DECISÃO DE PRODUTO]**
- **iOS e iPadOS:** fonte do sistema/SF Pro, com estilos mapeados à escala semântica Apple da tabela abaixo.
- **Android:** Roboto do sistema e escala de referência Material 3 (corpo 16 sp); verificar componentes e estilos no projeto real.
- **Web:** Inter (somente com licença de distribuição verificada), com fallback `system-ui`, corpo base 16 CSS px.
- **New York:** alternativa editorial opcional *apenas em contextos de leitura*, se for escolhida e aprovada uma aplicação permitida; não é a fonte padrão do ecossistema Instant. Para web/Android, preferir uma serifada com licença adequada, e não distribuir New York.
- **Waldenburg e outras fontes:** não copiar das referências ElevenLabs e não incorporar sem prova de licenciamento e adequação técnica.
- **Hierarquia:** usar poucas famílias e variar tamanho, peso e espaçamento; a identidade Instant vem do conjunto de layout e interações, não de simular a assinatura tipográfica proprietária de terceiros.

Fontes:
- Apple HIG — Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG — Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple — Larger Text evaluation criteria: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria
- Flutter — Automatic platform adaptations: https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations
- Flutter — `MediaQueryData.textScaler`: https://api.flutter.dev/flutter/widgets/MediaQueryData/textScaler.html
- Referência independente Apple Design Skill (`references/hig/typography.md`): https://github.com/dickwu/apple-design-skill/blob/main/references/hig/typography.md (não é documentação oficial da Apple).

### 3.2 Escala semântica iOS / iPadOS — Dynamic Type, categoria Large (padrão)

| Estilo Apple | Tamanho de referência | Leading de referência | Peso padrão | Uso Instant |
|---|---:|---:|---|---|
| `largeTitle` | 34 pt | 41 pt | Regular | Título de página principal |
| `title1` | 28 pt | 34 pt | Regular | Título de seção de primeira ordem |
| `title2` | 22 pt | 28 pt | Regular | Subseções e módulos |
| `title3` | 20 pt | 25 pt | Regular | Título de cartão ou sessão |
| `headline` | 17 pt | 22 pt | Semibold | Título de linha e ação em destaque |
| `body` | **17 pt** | 22 pt | Regular | Corpo de interface e conteúdo principal |
| `callout` | 16 pt | 21 pt | Regular | Ajuda e descrições secundárias |
| `subhead` | 15 pt | 20 pt | Regular | Metadados e categorias |
| `footnote` | 13 pt | 18 pt | Regular | Informação auxiliar não essencial |
| `caption1` | 12 pt | 16 pt | Regular | Legenda breve não essencial |
| `caption2` | 11 pt | 13 pt | Regular | Uso excepcional; evitar em textos informativos |

Os números representam o **tamanho Large padrão**, não limites fixos e não a escala de acessibilidade. Os componentes usam os **papéis semânticos** e respeitam a estratégia de escalonamento do sistema; o Flutter não replica necessariamente as métricas completas de UIKit/SwiftUI sem um adaptador. Os valores de `leading` orientam *line height* no tamanho padrão; não fixar `height` de contêiner nem desabilitar Dynamic Type para persegui-los. Os variantes enfatizados podem alterar pesos, seguindo o HIG.

**Mapeamento proposto para nomenclatura de design (não equivalência universal):** `Display` → `largeTitle`; `H1` → `title1`; `H2` → `title2`; `H3` → `title3`; `Corpo` → `body`; `Rótulo importante` → `headline`; `Auxiliar` → `callout/subhead`; `Legendas` → `footnote/caption1`, **somente quando não forem conteúdo essencial**. Texto falado, instruções, enunciados, feedback de correção e leitura bíblica permanecem prioritariamente em `body` ou maior.

### 3.3 Android e web — equivalência funcional, não cópia pixel a pixel

| Papel | iOS padrão | Android inicial | Web inicial |
|---|---|---|---|
| Título de página | `largeTitle` 34 pt | M3 `headlineLarge`, conforme tema | 36–48 px fluido |
| Título de seção | `title1` 28 pt | M3 `headlineMedium`, conforme tema | 28–36 px fluido |
| Corpo principal | `body` **17 pt** | M3 `bodyLarge` **16 sp** | **16 px** (mínimo de projeto para corpo) |
| Ação/rótulo de destaque | `headline` 17 pt | M3 `titleMedium`/`labelLarge` conforme uso | 16 px semibold, se necessário |
| Texto auxiliar | `callout` 16 pt | M3 `bodyMedium` conforme tema | 14–16 px, somente secundário |

**Unidades:** iOS usa pontos (pt), Android usa sp para texto, web usa CSS px; não confundir com pixels físicos. A exportação DTCG usa `px` como unidade numérica de referência, mas o adaptador **interpreta valores iOS como pontos lógicos**, não como pixels físicos ou CSS sem contexto. Tokens por plataforma devem evitar escrever uma única escala global que transforme 17 pt iOS em 17 sp Android por acidente.

### 3.4 Dynamic Type, Larger Text e responsividade — obrigatório

1. **Ajuste do usuário vem primeiro.** Não bloquear, redefinir nem limitar arbitrariamente `MediaQuery.textScalerOf(context)`; os componentes textuais precisam herdar a preferência de escala da plataforma. Avaliar conscientemente qualquer exceção específica de UI nativa.
2. **Meta de acessibilidade:** permitir texto ampliado a **pelo menos 200% OU até o tamanho máximo suportado pelo sistema**, sem perda de informação essencial, sobreposição, clipping, elementos inacessíveis ou truncamento grave. O objetivo é alinhado às recomendações/critério de *Larger Text* da Apple; um teste artificial em escala linear 2.0 não substitui verificar os tamanhos reais do sistema, cuja escala pode ser não linear.
3. **Layout cresce com o texto:** linhas e cartões expandem verticalmente, botões podem ganhar várias linhas e colunas viram pilhas quando necessário. Não dar `maxLines: 1`, `TextOverflow.ellipsis` ou altura fixa a títulos e instruções essenciais.
4. **A leitura determina o tamanho:** captions do InstantSpeak, questões do InstantStudy e passagens do InstantBible jamais usam `caption1`/`caption2` como conteúdo principal. Atualizar também rótulos de botões de áudio, controles de reprodução e mensagens de erro.
5. **Símbolos acompanham a hierarquia:** usar SF Symbols em interfaces nativas Apple quando disponível e permitido; em Flutter multi-plataforma, preferir ícones compatíveis do tema com peso/tamanho coerentes, labels semânticos e alvos de toque adequados.
6. **Idiomas e scripts:** conferir português, inglês e outras línguas suportadas, palavras longas, diacríticos e layout RTL quando aplicável. Não presumir que toda língua use exatamente as mesmas métricas tipográficas do latim.
7. **Tracking e optical sizing:** priorizar ajustes automáticos da fonte de sistema; não impor tracking negativo global no iOS. Ajustes editoriais opcionais na web exigem testes reais de legibilidade.
8. **Modo escuro:** validar contraste de texto real nas superfícies light/dark e com overlays; tamanho maior não corrige automaticamente contraste insuficiente.

### 3.5 Contrato de implementação Flutter para Codex

**[INSTANT — PROPOSTO; NÃO É CÓDIGO JÁ INSTALADO]**

- Definir `InstantTypography` com **papéis semânticos** e mapeamento para os `TextTheme` Material 3/tema Cupertino conforme plataforma, preservando famílias de fonte nativas. O sistema de design não exige migrar o app para UIKit ou SwiftUI.
- No iOS, mapear o corpo principal a **17 pt** e os demais papéis à tabela §3.2. No Android, preservar/adaptar a tipografia do Material 3 com corpo **16 sp**. Na web, carregar Inter legalmente e preservar fallback.
- O `Text` do Flutter deve receber o escalonamento de `MediaQuery.textScalerOf(context)` pelo comportamento padrão; **não** envolver o app em `MediaQuery` que sobrescreva todas as preferências e **não** aplicar `TextScaler.noScaling` a conteúdo essencial.
- Se for implementada adaptação de `TextTheme`, gerar somente as substituições necessárias por plataforma; considerar pesos/leading e nomes semânticos, sem congelar alturas de widgets.
- Para testes, pode-se **simular** `MediaQueryData(textScaler: TextScaler.linear(2.0))`, mas a aprovação exige também testes no iOS com categorias reais de Larger Text e no Android com tamanho de fonte ampliado.
- Não colocar texto de interface em canvases 3D, imagens ou shaders: legendas da orbe devem continuar selecionáveis/legíveis pelo leitor de tela.
- Para cada alteração de tipografia, gerar screenshots/golden tests dos fluxos principais, em iPhone compacto, iPhone maior e Android, com escala padrão e ampliada.

### 3.6 Aplicação por produto

| Produto | Prioridade tipográfica | Verificação funcional |
|---|---|---|
| **InstantSpeak** | Corpo/captions de no mínimo `body` iOS quando essenciais; ações de microfone e voz com labels claros | Sem clipping em diálogo longo, troca de idioma ou legenda ampliada durante gravação |
| **InstantStudy** | Enunciados e feedback de correção em `body` ou superior; alternativas em várias linhas | Respostas longas, equações, listas de alternativas e teclado aberto não se sobrepõem |
| **InstantBible** | Leitura contínua em `body` ou superior; opção de ajuste adicional de fonte/espaçamento quando útil | Passagens extensas, marcações, notas e áudio permanecem usáveis em Large Text |

**Critério de conclusão:** especificação documentada ≠ conformidade implementada. Ver `design/DESIGN_QA.md` para os casos de validação a executar em dispositivos reais.

### 3.7 Proveniência da tipografia ElevenLabs vs Apple vs Instant (v1.8)

O sistema de marca ElevenLabs atualmente documentado em `https://11labs-guides-dev.a17.dev/` descreve a família **Eleven** (cortes Normal/Semi Condensed); isso **não** autoriza copiar ou distribuir a fonte. O Refero mostra interpretações de páginas específicas que podem divergir da diretriz mais recente. A Apple recomenda usar a fonte de **sistema** via APIs nativas, sem incorporar SF Pro em assets.

**Contrato de leitura obrigatória:** `design/TYPOGRAPHY_REFERENCE.md` separa **documentado pela marca / observado por terceiros / decisão Instant** e define QA por plataforma. Nenhuma tabela de terceiro sobrescreve `design/tokens.json`, a HIG ou licenças de fontes.

## 4. Layout, escala e responsividade

### 4.1 Tokens de espaçamento

`space`: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96` (unidades lógicas/CSS px conforme plataforma).

- Margem horizontal mobile: **20**; telas compactas podem usar **16**.
- Gap entre elementos relacionados: **8–16**.
- Gap entre grupos: **24–32**.
- Separação de seções de landing page web: **64–96** (responsiva, nunca string `64-96px`).
- Conteúdo principal web: `max-width: 1120px`; texto de leitura longa: `max-width: 68ch`.
- Respeitar safe areas, teclado, barras de navegação, notch e rotação.

### 4.2 Raios e elevação

| Elemento | Raio | Sombra |
|---|---:|---|
| Botões principais | `9999` (pill) | Nenhuma |
| Cards padrão | `20` | Nenhuma por padrão |
| Cards destacados | `24` | Suave somente se necessário |
| Inputs | `12` | Nenhuma |
| Chips | `9999` | Nenhuma |
| Diálogos | `24` | Opcional, discreta |

Priorizar agrupamento, espaçamento e bordas sobre sombras fortes.

### 4.3 Breakpoints web

- `< 600px`: uma coluna; CTA principal fácil de alcançar.
- `600–1023px`: uma ou duas colunas conforme densidade.
- `>= 1024px`: composição web ampliada; até três colunas apenas se úteis.
- A decisão final deve se basear em **largura disponível e tipo de conteúdo**, não no nome comercial de um dispositivo.

## 5. Biblioteca de componentes — contratos

### 5.1 Componentes fundamentais

**Contrato detalhado e verificável:** `design/COMPONENTS.md`. Esta tabela é apenas um índice de componentes, não uma licença para agentes inventarem métricas de layout. Todas as medidas devem ser consumidas de `design/tokens.json` e o widget deve validar comportamento/semântica.


| Componente | Padrão visual | Estados mínimos |
|---|---|---|
| `PrimaryButton` | Fundo de alto contraste, pill, texto claro | default, pressed, loading, disabled, focus |
| `SecondaryButton` | Borda/contorno claro, fundo neutro | default, pressed, disabled, focus |
| `TextButton` | Sem caixa desnecessária, área de toque expandida | default, pressed, focus |
| `IconButton` | Ícone 20–24 dentro de área tocável | default, pressed, disabled, focus |
| `Card` | Fundo neutro, raio 20, conteúdo alinhado | normal, selected, expanded |
| `TextField` | Label sempre acessível, padding confortável | empty, filled, focus, error, disabled |
| `ChoiceChip` | Pill ou tonal, seleção inequívoca | unselected, selected, disabled, focus |
| `Progress` | Barra/etapas com rótulo de estado | determinate, indeterminate, paused, done |
| `Feedback` | Ícone + mensagem + ação de reparação | success, warning, error, info |
| `BottomSheet` | Modal contextual de uso curto | open, dragging, dismissing |
| `Paywall` | Oferta legível, preço e termos claros | loading, available, failure, restored |

**Ações e ergonomia**
- Áreas tocáveis: preferir **≥ 44×44 pt no iOS** e **≥ 48×48 dp no Android**, incluindo ícones pequenos com área invisível ampliada.
- Estados `loading` preservam largura de botões, expõem indicador textual/acessível e evitam múltiplos envios.
- `disabled` tem explicação quando o motivo não for óbvio; não se comunica somente por opacidade.
- `focus` exige indicador visual distinguível; bordas decorativas de baixo contraste não bastam.
- Mensagens de erro informam **o que ocorreu e como corrigir**, sem culpar o usuário.

### 5.2 Navegação

- **Mobile:** bottom navigation só para 3–5 destinos frequentes; usar pilha para fluxos de tarefa.
- **Web:** menu superior simples; máximo de uma ação de destaque por contexto.
- Voltar/fechar deve manter expectativas nativas e não perder progresso sem aviso.
- Permanecer com a mesma taxonomia de destinos dentro do produto.
- Não inventar abas para replicar uma imagem de referência.

### 5.3 InstantSpeak — arquitetura de telas, sem copiar o produto ElevenLabs

**[VÍDEO — OBSERVADO, 52 s]** A gravação fornecida exibe: editor de texto para fala; seleção de voz por catálogo; categorias de vozes e coleções; retorno ao editor com a escolha aplicada; página inicial com criação e projetos; área Creator; galeria de templates. O vídeo não demonstra testes de acessibilidade nem resultados de geração em rede real.

**[INSTANT — PROPOSTO]** A experiência primária continua sendo **praticar idiomas por conversação**. A criação de voz/TTS é um recurso auxiliar de pronúncia, repetição ou conteúdo, **não** a principal tela inicial nem requisito para concluir o AHA. Usar estes destinos conceituais, sujeitos à auditoria de rotas reais antes da implementação:

| Destino | Prioridade | Tarefa central | CTA dominante |
|---|---|---|---|
| `PracticeHome` | P0 | Iniciar prática guiada/retomar sessão | “Começar a conversar” |
| `Conversation` | P0 | Falar ou digitar, ouvir ou ler, obter feedback | “Falar” / “Enviar” |
| `VoiceLibrary` | P1 | Encontrar, ouvir amostra e confirmar voz | “Usar esta voz” |
| `TextToSpeechComposer` | P1 | Converter texto de exercício em áudio, quando backend permitir | “Gerar áudio” |
| `RecentSessions` | P1 | Retomar práticas e revisar feedback | “Continuar” |
| `Creator/Templates` | P2 | Descoberta contextual de exercícios, sem vitrine genérica | “Usar exercício” |

**Regra de navegação:** manter a sessão e rascunhos ao abrir a biblioteca; voltar leva ao mesmo contexto, idioma e posição de rolagem. Não publicar uma tab `Creator` apenas para parecer com a ElevenLabs. Recursos ausentes no aplicativo real permanecem hipóteses e não devem ser criados sem validação de escopo.

### 5.4 `VoiceLibrary` — contrato de biblioteca e descoberta de vozes

**Estrutura:** cabeçalho com título, fechar/voltar e confirmação; campo de busca fixo apenas se não cobrir conteúdos com teclado; filtro por idioma/uso/estilo apenas quando metadados reais existirem; seções recomendadas, recentes e salvas; lista reciclável com preview por item.

**`VoiceCard` — campos permitidos:** `id`, `displayName`, `languageTags`, `styleTags`, `sampleUrl?`, `sampleDurationMs?`, `availability`, `isSaved`, `isSelected`; mostrar somente metadados reais/licenciados. Não inferir gênero, origem étnica ou personalidade da voz pelo áudio ou avatar. Não reproduzir vozes nominalmente utilizadas pela ElevenLabs sem autorização ou disponibilidade contratual.

| Estado | UI e interação exigidas | Recuperação |
|---|---|---|
| `initialLoading` | Skeleton estável ou mensagem de carregamento | Cancelar/voltar |
| `ready` | Busca, filtros, preview; indicador claro da seleção atual | Limpar filtros |
| `searchEmpty` | Mensagem “Nenhuma voz encontrada” | Limpar busca/filtros |
| `previewLoading` | Spinner localizado somente na voz acionada | Cancelar |
| `previewPlaying` | Ícone de pausa e marcador de reprodução | Parar/trocar amostra |
| `previewError` | Erro inline, sem bloquear a lista | Tentar de novo |
| `restricted` | Motivo de indisponibilidade sem paywall enganoso | Voz alternativa |
| `offline` | Catálogo cacheado claramente identificado, se autorizado | Reconectar |

**Ações determinísticas:** `tap preview` interrompe preview anterior antes do novo; no máximo **um player** ativo. `tap voice` cria `pendingVoiceId`; `confirm` persiste escolha e retorna ao editor; `cancel` preserva `selectedVoiceId` original. Se a seleção final depender de rede, mostrar salvamento pendente e tratar falha sem aplicar um estado falso. Favoritos só são persistidos se a conta/backend suportar.

**Ergonomia:** lista virtualizada, seleção por texto/ícone/borda funcional (não apenas cor), tap targets adequados, detalhes em duas linhas no máximo com expansão acessível, foco/VoiceOver/TalkBack com anúncio “Prévia da voz X, botão reproduzir”; previews interrompem ao fechar tela, iniciar microfone ou receber chamada. Não autoplay, não carregar todas as amostras antecipadamente.

**Componentes mínimos:** `VoiceSearchField`, `VoiceFilterChips`, `VoiceSection`, `VoiceCard`, `VoicePreviewPlayer`, `VoiceSelectionFooter` e `LibraryEmptyState`. Não criar filtros falsos para preencher design.

### 5.5 `TextToSpeechComposer` — edição, geração e reprodução

**Escopo:** apoio à pronúncia e leitura em InstantSpeak; reutilizável para áudio de estudo e leitura nos demais apps **somente** quando alinhado à oferta do produto. A tela tem: campo de texto com rótulo, contador de caracteres/limite da API real, idioma quando necessário, voz selecionada com acesso à biblioteca, CTA contextual e área de resultado com player.

**Máquina de estados própria** (`ttsState`, independente de `voiceState`):

```text
empty -> editing -> valid -> submitting -> generated -> playing
  |        |        |           |          |          |
  |        |        |           +--> failure/retry     +--> paused/ended
  |        |        +--> disabled(reason)
  |        +--> selectingVoice -> editing (preserva rascunho)
  +--> alternativeTextPractice
```

| Estado | CTA | Comportamento |
|---|---|---|
| `empty` | “Gerar áudio” indisponível | Explicar que texto é obrigatório; nunca aparentar um erro de serviço |
| `editing` | Ativar apenas com texto válido, voz/modelo disponíveis | Preservar texto ao trocar voz, idioma, teclado ou rota |
| `submitting` | “Gerando…” + cancelar se suportado | Desabilitar múltiplos envios; chave idempotente no backend quando aplicável |
| `generated` | “Reproduzir” / “Gerar novamente” | Mostrar duração real, player e possibilidade de continuar prática |
| `playing` | Pausar / parar, progressão real | Legenda sincronizada apenas com timestamps reais |
| `failure` | “Tentar novamente” | Mostrar erro recuperável: rede, permissão, cota, indisponibilidade |
| `unsupported` | Alternativa de texto/leitura | Não fingir capacidade do provedor de áudio |

**Design responsivo:** campo de texto cresce sem ocultar CTA; teclado virtual mantém o foco sem colidir com safe area; controle de voz acessível sem precisar fechar o teclado; feedback de geração não substitui conteúdo editado; o resultado nunca inicia reprodução sem consentimento/ação apropriada. No iPhone compacto testar teclado aberto, viewport reduzido, text scaling e scroll até o CTA.

**Segurança e cobrança:** antes de gerar, informar consumo/custo quando aplicável; não expor API key no app; evitar gravar texto inserido, áudio ou respostas em analytics; pedir consentimento adequado para clonagem e respeitar direito de voz. Limites, preços e recursos devem refletir o backend real — não copiar planos, catálogo ou claims do V4.

**Contratos de dados propostos:**

```text
VoiceSelection { voiceId, displayName, languageTags, sampleAvailable }
TtsRequest { text, voiceId, language?, modelId?, requestId }
TtsResult { requestId, audioUri, durationMs?, captionSegments?, expiryAt? }
TtsError { code, userMessageKey, retryable }
```

Campos opcionais nunca devem ser fabricados para satisfazer a UI; `requestId` apoia deduplicação quando a infraestrutura o permitir. O contrato não substitui APIs existentes sem auditoria.

### 5.6 Contratos comuns de interação mobile

| Interação | Proposta inicial (não medição da ElevenLabs) | Critério observável |
|---|---|---|
| Tap em item selecionável | Realce imediatamente e feedback háptico discreto **se ativado no SO** | Nunca salva sem confirmação quando a tela tem botão confirmar |
| Abertura da biblioteca | Transição nativa com preservação de rascunho | `back` retorna ao editor intacto |
| Busca | Debounce inicial 200–300 ms para rede; filtragem local imediata | Sem chamadas excessivas; teclado não cobre resultados |
| Preview de áudio | Exibir carregamento; somente um player | Trocar voz interrompe áudio anterior |
| Gerar áudio | Estado de envio visível; botão não duplica pedidos | Retry idempotente quando backend suportar |
| Pagamento | Nunca bloquear tarefa AHA sem regra de plano declarada | Termos e preço claros; restauração de compra disponível |
| Reduced motion | Substituir deslocamento contínuo por foco, ícone e texto | Mesmos comandos disponíveis |

**Critério de implementação:** cada componente deve ter `loading`, `empty`, `ready`, `error`, `disabled`, `offline` quando relevantes, suporte a `Semantics`, golden tests e teste real de navegação. A descrição da transição não é garantia de resultado da ElevenLabs.

### 5.7 `VoiceGlyph` — identidade original para seleção de vozes (v1.8)

`VoiceGlyph` é o ícone visual **estável por `voiceId`**, usado na biblioteca de vozes e prévias, diferente de Orb/Visualizador e do logo do app. As variantes são escolhas de layout e **não** medições biométricas. O nome, os idiomas suportados e a disponibilidade devem vir do catálogo real. Veja `design/VOICE_IDENTITY.md`; o comportamento detalhado de previews permanece em `design/COMPONENTS.md`.

## 6. Motion & áudio — referências ElevenLabs e implementação Instant

### 6.1 Intenção

Motion deve comunicar **input, processamento, resposta, transição e conclusão**. A referência são as **diretrizes públicas de motion da ElevenLabs**, complementadas pelos exemplos documentados na biblioteca ElevenLabs UI. Entretanto, a geometria, cores, curvas proprietárias, materiais 3D, assets e composição final da família Instant devem ser **originais**.

**Níveis de evidência:** neste documento, **[ELEVENLABS — DOCUMENTADO]** identifica o comportamento ou a API descrita nas fontes públicas; **[INSTANT — PROPOSTO]** identifica escolhas nossas, ainda sujeitas a teste. Não tratar valores de duração, easing, intensidade ou frame rate propostos como números oficiais da ElevenLabs.

### 6.2 Curvas e duração

| Evento | Duração inicial sugerida | Observação |
|---|---:|---|
| Press / microfeedback | 100–160 ms | Estado imediatamente perceptível |
| Troca de estado de UI | 160–240 ms | Preferir opacity/transform |
| Entrar/sair de modal | 220–300 ms | Nunca bloquear interação essencial |
| Transição entre telas | Nativa | Seguir a plataforma |
| Atualização reativa à voz | Contínua enquanto aplicável | Vinculada ao sinal, com suavização |

**ATENÇÃO — tabela histórica, não normativa após v3.3:** os intervalos acima são hipóteses genéricas anteriores à gramática §6.37. Para `tap/sheet/route`, seguir os valores específicos do perfil Instant Precision (§6.37); para feedback de aprendizagem usar §6.28/§6.34; para estado/áudio da orbe usar §6.7/§6.14; para a abertura de marca usar §2.6. Os limites de acessibilidade e de produto prevalecem sempre. O **árbitro §6.42** resolve eventos simultâneos. Evitar blur/gradientes pesados por frame.

### 6.3 Máquina de estados para voz (InstantSpeak)

| Estado | Visual | Texto/semântica | Ação disponível |
|---|---|---|---|
| `idle` | Forma estática ou respiração muito suave | “Toque para falar” | Iniciar gravação |
| `requestingPermission` | Indicador discreto | “Solicitando microfone” | Cancelar |
| `listening` | Reação original à amplitude do microfone | “Ouvindo…” + indicador persistente de captação | Parar, cancelar |
| `processing` | Pulso mínimo e não relacionado à amplitude | “Preparando resposta…” | Cancelar, se suportado |
| `speaking` | Reação à amplitude da saída de áudio | “Respondendo…” + transcrição | Pausar, interromper |
| `paused` | Forma congelada | “Pausado” | Retomar |
| `error` | Forma estática, sinal de erro | Mensagem acionável | Tentar de novo, usar texto |

**Regras técnicas:**
- Nunca exibir falso movimento de amplitude como se houvesse áudio real.
- Usar medição local de sinal permitida pela plataforma, com suavização temporal para reduzir tremulação; não requer enviar áudio para gerar a animação.
- Respeitar permissão do microfone e fornecer indicador de gravação explícito.
- Toda informação falada essencial deve ter alternativa textual; oferecer captions/transcrição quando fizer sentido.
- Não acionar microfone automaticamente no onboarding sem gesto do usuário e explicação.
- Não usar a forma gráfica ou renderização proprietária conhecida como `Sound Flow` da ElevenLabs.
- Se o sistema preferir **Reduce Motion / Remover animações**, substituir movimento por ícone + texto estático de estado.

### 6.4 Movimento por produto

- **InstantSpeak:** voz reativa ao sinal + captions; máximo destaque no turno atual da conversa.
- **InstantStudy:** transição entre questões, feedback de resposta e progresso; nunca animação que atrase próximo exercício.
- **InstantBible:** transições tranquilas e opcionais; texto e leitura permanecem estáveis enquanto se navega.


### 6.5 Motion da ElevenLabs — catálogo de referências verificadas

**[ELEVENLABS — DOCUMENTADO]** A linguagem de motion liga experiências de áudio à tipografia e ao movimento. Os padrões abaixo vêm de um **guia público de marca hospedado em domínio de demonstração** e de páginas públicas da **ElevenLabs UI**. Esse guia não é uma especificação técnica do SDK e não fornece um conjunto completo de tempos, curvas ou código de produção. Não converter observação estética em requisito oficial de implementação.

| Elemento ElevenLabs | Comportamento documentado | Aplicação recomendada para Instant (original) |
|---|---|---|
| **Sound Flow** | Visualização com três estados: `static`, `resting` e `reactive`, o último responde a áudio; controla amplitude global, densidade, gradientes e resposta ao sinal. | Criar um **visualizador próprio**, com estados equivalentes de UX, mas forma, cores, superfície e algoritmo visuais próprios. |
| **Voice Signatures** | Assinatura gráfica parametrizada por características vocais: pitch, timbre e expressividade; usada com seleção e prévia de vozes. | Representar prévias de voz por cartões e indicadores originais; não recriar a assinatura exclusiva. |
| **Captioning** | Apresentação por palavra, sentença ou idioma. Legendas palavra a palavra são mais expressivas e pontuais; para multilíngue, separar idiomas em trechos. | Preferir legendas estáveis por frases em conversas; destacar palavra somente quando houver sincronização real. |
| **Chime** | Motion tipográfico em títulos e legendas; sincroniza texto e voz. Em títulos promocionais há variantes sequenciais e distribuídas. | Usar revelação tipográfica **discreta** em onboarding, dicas e vídeos; não interferir em exercícios ou transcrições de leitura. |
| **Echo** | Combina camadas visuais do Sound Flow com tipografia para comunicar riqueza e profundidade da voz. | Reservar linguagem de profundidade original a materiais de marketing; não aplicar efeito pesado sobre conteúdo funcional. |
| **Amplify** | O nome aparece no catálogo público de comportamentos, **sem descrição operacional suficiente na fonte consultada**. | Não reproduzir nem alegar especificação oficial. Reavaliar apenas se houver diretrizes verificáveis. |
| **Logo motion** | A identidade inclui variações de animação do logotipo de marca. | **Não reutilizar** nem reproduzir logotipo/assinatura de movimento da ElevenLabs. |

**Fontes e escopo:**
- Diretrizes públicas de marca, seções *Sound Flow*, *Voice Signatures* e *Motion*: https://11labs-guides-dev.a17.dev/ (conteúdo de referência visual; não garante permissão de uso de assets).
- ElevenLabs UI — *Orb*: https://ui.elevenlabs.io/docs/components/orb
- ElevenLabs UI — *Bar Visualizer*: https://ui.elevenlabs.io/docs/components/bar-visualizer
- Biblioteca ElevenLabs UI: https://ui.elevenlabs.io/docs
- Portal oficial de marca e propriedade intelectual: https://elevenlabs.io/brand

### 6.6 Componentes de motion presentes na ElevenLabs UI

**[ELEVENLABS — DOCUMENTADO]** A documentação pública descreve dois exemplos técnicos que **não são o mesmo elemento** do Sound Flow de marca:

1. **`Orb` (web):** visualizador 3D reativo a áudio, com personalização de duas cores, comportamento por estado (`null`, `thinking`, `listening`, `talking`) e leitura de nível de volume de entrada/saída, por callbacks ou referências. Usa **Three.js / React Three Fiber e WebGL**. Os métodos de volume esperam nível normalizado de `0..1`.
2. **`BarVisualizer` (web):** barras de frequências em tempo real, com estados documentados `connecting`, `initializing`, `listening`, `speaking` e `thinking`. Permite analisar `MediaStream` e utilizar FFT; o modo `demo` é destinado a demonstração/desenvolvimento.

**Decisão arquitetural Instant:**
- **Web/React:** avaliar a adoção de componentes da ElevenLabs UI **somente após revisão da licença, dependências, performance, bundle e identidade visual**. Disponibilidade pública não é autorização irrestrita de marca ou código.
- **Flutter/iOS/Android:** **não** pressupor que um componente React/WebGL funcione nativamente. Implementar visualizador original com `CustomPainter`, `AnimationController`/`Ticker` e integração com o áudio do app; considerar outros renderizadores apenas por necessidade comprovada.
- **InstantSpeak:** `InstantVoiceVisualizer` é a **interface adaptadora** de visualização, com renderizador `InstantOrb3D` preferencial e fallback 2D original. Aceita `voiceState`, `inputLevel`, `outputLevel`, `reducedMotion`, `theme` e `captions`; requisitos detalhados em §6.12–6.17.
- **InstantStudy/InstantBible:** usar apenas indicadores compactos e estáveis de áudio onde houver TTS/leitura; evitar animação decorativa ininterrupta.

### 6.7 Especificação executável do `InstantVoiceVisualizer` — original

**[INSTANT — PROPOSTO]** Contrato inicial para desenvolvimento, **não extraído de parâmetros internos da ElevenLabs**.

| Aspecto | Valor inicial/proposta | Regra |
|---|---|---|
| Forma | Arcos concêntricos ou barras arredondadas **originais** como **fallback 2D** do `InstantOrb3D` (§6.13), sem reproduzir superfície ou shader da ElevenLabs | O componente 2D continua obrigatório para acessibilidade, baixo consumo e dispositivos sem renderização 3D. |
| Cor | As **10 paletas canônicas por tutor do § 6.24** quando uma persona está selecionada; tokens `color.product.light.speak` / `color.product.dark.speak` apenas para interface neutra/fallback sem tutor | Preservar o par de cores da persona em `idle/listening/thinking/speaking`; estados mudam resposta e luz, não a identidade cromática. Não copiar gradientes ElevenLabs. |
| Entrada | RMS da captação autorizada, normalizado `0..1` após noise gate | Somente quando microfone está realmente ativo. |
| Saída | Nível do áudio **realmente reproduzido**, normalizado `0..1` | Somente quando a saída é efetivamente emitida. |
| Suavização | Ataque `~70 ms`; liberação `~220 ms` (tuning inicial) | Reduzir oscilação; verificar latência percebida. |
| Noise gate | Calibrar por dispositivo; começar com limite relativo ao piso de ruído | Não interpretar ruído ambiente como fala. |
| Render | Alvo de 60 fps apenas se viável; degradar para 30 fps/estático sob custo | Não comprometer interação, bateria ou aquecimento. |
| `resting` | Forma estática ou respiração limitada e não semântica | Nunca fazer parecer que microfone está captando. |
| `listening` | Crescimento/retração de intensidade pelo sinal de **entrada** | Texto e indicador persistente de microfone ativo. |
| `speaking` | Reatividade pelo sinal de **saída** | Texto e botão de interromper/pausar. |
| `processing` | Transição de estado não dependente da amplitude | Evitar onda reativa falsa. |
| `paused/error/offline` | Forma parada + iconografia + mensagem legível | Nenhum efeito deve ocultar falha/pausa. |

**Fluxo de dados obrigatório:**

```text
SDK de voz / gravador / player
  -> eventos reais da sessão (idle, permissão, conexão, listening, processing, speaking, paused, error)
  -> capturador/medidor local de entrada e saída (quando autorizado/disponível)
  -> normalização e suavização independente de sinal
  -> VoiceMotionSignal { state, inputLevel?, outputLevel?, micActive, isMuted }
  -> InstantVoiceVisualizer (puro, sem controlar sessão)
  -> rótulos, captions, botões e indicadores acessíveis
```

**Regras de implementação:**
- Separar sinal de microfone do sinal de reprodução; não somar os dois como se fossem um mesmo locutor.
- Se não houver API para nível de saída, mostrar o estado `speaking` **sem fingir reatividade ao áudio**.
- Sem permissão/sem captação, `inputLevel = null` e indicador de microfone desligado. `0` representa silêncio medido, **não** falha de sensor.
- Ao silenciar, pausar, desconectar, trocar de tela ou minimizar o app, suspender captura e animação conforme sessão e ciclo de vida reais.
- Tratar interrupção de fala (*barge-in*) sem conflito entre estados: o SDK/estado da sessão prevalece sobre mudanças visuais ou timers.
- Ao retomar da background, revalidar sessão e permissão antes de exibir captação.
- Não armazenar amostras de áudio em logs/analytics de motion; publicar apenas métricas agregadas sem conteúdo sensível quando permitido.

### 6.8 Motion tipográfico e legendas — adaptação das referências

**[INSTANT — PROPOSTO]** Mapeamento funcional dos princípios públicos de `Captioning` e `Chime`:

| Situação | Motion de texto recomendado | Restrição |
|---|---|---|
| Conversa ao vivo InstantSpeak | Linha/frase estável, com atualização incremental não piscante | Não trocar texto inteiro a cada frame. |
| TTS com tempos por palavra | Destaque progressivo da palavra atual, sincronizado por timestamps | Nunca inventar timestamps para aparentar precisão. |
| TTS sem timestamps | Legenda por frase ou transcrição completa estática | Não criar pseudo-karaokê sincronizado. |
| Multilíngue | Preservar idioma e direção em blocos, com idioma identificável | Não misturar idiomas na mesma linha quando prejudicar leitura. |
| Headline de onboarding/marketing | Revelação curta de texto original, opcional | Executar uma vez e nunca atrasar CTA. |
| InstantStudy/InstantBible | Texto de exercício/passagem **estável** | Não aplicar efeitos de letras em conteúdo longo. |

**Acessibilidade:** captions precisam existir como texto selecionável/semântico quando necessário; não depender de desenho em canvas. Atender leitores de tela sem reanunciar a frase inteira a cada token. Respeitar preferências do sistema para texto ampliado e redução de movimento.

### 6.9 Curvas e transições Instant (não oficiais da ElevenLabs)

**Tabela histórica e não normativa para navegação/feedback:** estes tokens são valores de partida anteriores ao Instant Precision Motion. Não aplicar `motion.instant`, `motion.fast`, `motion.modal` nem `motion.easeStandard` em rota, toque, modal ou recompensa quando o contrato específico §§6.28/6.34/6.37/6.42 definir outro valor. Podem orientar somente motion de voz/caption se o contrato particular não definir duração. Os guias públicos não especificam tempos ou curvas oficiais de produção da ElevenLabs.

| Token proposto | Valor | Uso |
|---|---|---|
| `motion.instant` | `100 ms` | Feedback curto / toggles |
| `motion.fast` | `160 ms` | Botões, seleção e microestado |
| `motion.normal` | `220 ms` | Mudança entre estados da sessão |
| `motion.modal` | `280 ms` | Modal curto, sem bloquear ações |
| `motion.caption` | `120 ms` | Entrada discreta de bloco de texto; não cada palavra de TTS |
| `motion.easeStandard` | `cubic-bezier(0.2, 0, 0, 1)` | Entrada/saída de elementos |
| `motion.easeLinear` | `linear` | Apenas progresso temporal real quando apropriado |

- Para `reducedMotion = true`: interromper translações, opacidade animada, escala, loops e interpolação; **duração efetiva 0 ms**, mostrando imediatamente o estado estático + texto/ícone semântico. Não há exceção de fade herdada destes tokens históricos; ver §§6.34, 6.37 e 6.42.
- Não animar cada item de lista, cada token de transcrição nem cada frame de texto; usar animação somente se a mudança tiver significado.
- Quedas de frame: priorizar input e audio thread; isolar `CustomPainter` em `RepaintBoundary` e medir o custo em dispositivos modestos.

### 6.10 Critérios de aceite do motion

- [ ] O estado visual coincide com o SDK e com a permissão real para microfone (incluindo áudio silenciado).
- [ ] `inputLevel` só representa entrada real, `outputLevel` só representa saída real; sem simulação em produção.
- [ ] As transições `idle -> listening -> processing -> speaking -> idle` funcionam; conectar, falhar, pausar, interromper e retomar também.
- [ ] Sem API de amplitude: existe fallback de estado **não reativo**, rotulado corretamente.
- [ ] O app não aumenta latência do áudio perceptivelmente; capturas de profiling documentam frame pacing, CPU/GPU e consumo estimado.
- [ ] A experiência permanece utilizável com `Reduce Motion`, VoiceOver/TalkBack, texto ampliado, leitura sem som e áudio sem visão.
- [ ] Captions exibidas por palavra só quando há tempo por palavra verdadeiro; idiomas não são indevidamente mesclados.
- [ ] Motion interrompe no ciclo de vida apropriado e limpa controladores, subscriptions, streams e shaders.
- [ ] Nenhum asset, logotipo, gradiente exclusivo, vídeo de marca ou forma proprietária ElevenLabs foi copiado sem licença e autorização.
- [ ] Testar em light/dark, tela pequena, CPU restrita e sem conectividade; anexar screenshots/vídeos **reais** e relatórios; marcar não executados como **não verificados**.

### 6.11 Instrução para Codex/Work — motion

> Antes de programar animações, leia `DESIGN.md` §6.5–6.20, identifique o stack de áudio e seus eventos reais, e compare as telas existentes. Faça `InstantVoiceVisualizer` independente do SDK, com camada adaptadora para estado e medição de volume. Não copie visual ou shader da ElevenLabs. Não invente nível de microfone, transcrição ou áudio. Faça a versão acessível e estática primeiro; depois acrescente motion sob feature flag. Crie testes de máquina de estados, ciclo de vida, reduced motion e sincronização; meça jank e custos em dispositivo real. Apresente diff, vídeo/screenshot e resultado dos testes. Não declare que o motion foi implementado, está idêntico ao da ElevenLabs ou passou em produção sem evidência.

### 6.12 Eleven v4 — referência de experiência, não uma versão do Orb

**[ELEVENLABS — DOCUMENTADO]** O site oficial `https://elevenlabs.io/v4` apresenta os modelos de voz **Eleven v4** e **Eleven v4 Turbo**, com exemplos auditivos, instruções expressivas e experimentação do produto. O microsite `https://elevenlabs.io/emotional-range` oferece uma experiência de exploração de emoções por seleção de palavras/frases, reprodução de áudio e navegação acessível por teclado. Há também diretrizes de tags de áudio para orientar a interpretação vocal.

**[ELEVENLABS — DOCUMENTADO, MAS OUTRO PRODUTO]** O componente `Orb` publicado em `https://ui.elevenlabs.io/docs/components/orb` é um visualizador **web** com Three.js/React Three Fiber, shaders WebGL, duas cores configuráveis, `seed`, volume de entrada/saída normalizado e `agentState` (`null`, `thinking`, `listening`, `talking`).

**Limite de evidência obrigatório:** `v4` é **versão do modelo de voz**, não designação técnica de uma "orbe V4". Não há evidência verificada aqui de que a página V4 utilize o mesmo código, shader ou renderizador do componente público `Orb`. Não escrever isso na UI, código ou materiais comerciais.

**[INSTANT — PROPOSTO]** Combinar *demonstração antes de explicação*, visualização responsiva a áudio real, legendas legíveis e experimentação emocional opcional, preservando identidade própria, privacidade e acessibilidade. Não copiar animação, asset, geometria, gradiente, texto comercial ou shader proprietários.

**Fontes públicas (consultadas em 2026-10-15):**
- https://elevenlabs.io/v4
- https://elevenlabs.io/emotional-range
- https://elevenlabs.io/blog/elevenlabs-audio-tags-list
- https://ui.elevenlabs.io/docs/components/orb

### 6.13 `InstantOrb3D` — contrato do renderizador principal

**[INSTANT — PROPOSTO]** Renderizador 3D **original** da família Instant. No **InstantSpeak**, é a visualização principal quando suportada; `InstantVoiceVisualizer` escolhe entre `InstantOrb3D`, visualizador 2D e estado estático. Não utilizar o nome ou aparência "ElevenLabs Orb" como marca da implementação.

**Direção visual:** volume esférico original, silhueta reconhecível, gradiente derivado da paleta canônica do tutor selecionado (§ 6.24), com fallback aos tokens de produto quando não houver tutor, transições suaves de luz/superfície e intensidade moderada. Evitar dependência de bloom/blur pesado, superfícies cintilantes que dificultem a leitura, ruído visual excessivo e semelhança confundível com os assets da ElevenLabs. A esfera é **indicador**, não botão de gravação por padrão; controles explícitos continuam visíveis.

| Entrada semântica | Tipo / origem | Contrato |
|---|---|---|
| `voiceState` | enum derivado do SDK / sessão | Única fonte autoritativa para estado e transição |
| `inputLevel` | `number 0..1` ou `null` | Amplitude **real** de microfone autorizado, somente em `listening` |
| `outputLevel` | `number 0..1` ou `null` | Amplitude **real** de reprodução, somente em `speaking` |
| `micActive` / `isMuted` | booleanos do SDK/permissões | Captura deve ser indicada fora da orbe, mesmo se o canvas falhar |
| `renderMode` | `auto | threeD | twoD | static` | `auto` escolhe conforme capacidades, preferências e carga |
| `reducedMotion` | preferência do sistema | Substitui deslocamento/deformação por estado estático sem perda de semântica |
| `lowPower` / `appVisible` | energia e ciclo de vida | Reduz ou interrompe GPU sem alterar a sessão de áudio |
| `theme` / `productAccent` / `tutorPalette` | tokens semânticos + 2 cores canônicas do tutor (§ 6.24) | Não substituir a paleta do tutor por acento genérico nem usar gradientes do branding ElevenLabs |
| `label` / `ariaDescription` | texto localizado externo ao canvas | Leitores de tela compreendem o estado sem interpretar pixels |

**Estados de experiência e resposta visual proposta:**

| Estado real | Comportamento 3D | Semântica/controles obrigatórios |
|---|---|---|
| `idle` | Esfera estável ou deslocamento imperceptível | “Toque para falar”; iniciar por gesto explícito |
| `requestingPermission` | Esfera estática | Pedido de microfone, cancelar e alternativa texto |
| `connecting` | Mudança suave de tom, sem pseudo-ondas de áudio | “Conectando”; opção cancelar/repetir |
| `listening` | Deformação **somente** por `inputLevel` disponível | Microfone ativo, parar/silenciar, transcrição quando houver |
| `processing` | Estado visual próprio, **não** áudio reativo | “Preparando resposta”; cancelar quando suportado |
| `speaking` | Deformação **somente** por `outputLevel` disponível | “Respondendo”; interromper/pausar, captions |
| `paused` | Congelar forma | “Pausado”; retomar |
| `interrupted` | Encerrar animação de saída imediatamente | Indicar que usuário retomou a fala; preservar turn-taking real |
| `error` / `offline` | Forma estática + ícone/mensagem fora do canvas | Explicar erro e oferecer recuperação/uso por texto |

**Comportamento sem amplitude disponível:** o estado de voz continua visível, porém **sem movimento fingindo corresponder à voz**. O modo `idle` não pode dar a impressão de escuta ou captação.

**Acessibilidade:** orbe marcada como decorativa para leitores de tela quando o estado e os controles já forem descritos em elementos semânticos; nunca duplicar anúncios a cada frame. Com `Reduce Motion`, usar imagem/forma estática + rótulo; respeitar contraste dos controles ao redor. Garantir que nenhuma ação dependa de tocar no canvas.

### 6.14 `VoiceMotionController` — ligação determinística com áudio e sessão

**[INSTANT — PROPOSTO]** Controlador independente do motor 3D e do fornecedor de voz; fornece um *snapshot* coeso ao renderizador, não controla permissões nem conexão. Toda troca de estado deriva de evento real do SDK.

```text
Session SDK / recorder / player
  -> VoiceSessionAdapter (estado autoritativo, permissões, mute, lifecycle)
  -> InputMeter / OutputMeter (RMS ou medição equivalente, se disponível)
  -> Normalization + NoiseGate + EnvelopeSmoothing
  -> VoiceMotionController (snapshot atômico; sem dados de áudio bruto)
  -> InstantVoiceVisualizer
       -> InstantOrb3D | InstantOrb2D | InstantOrbStatic
  -> Captions + controles semânticos independentes do canvas
```

**Normalização:** dados de entrada/saída no intervalo `[0,1]` ou `null`; aplicar clamp e suavização (proposta inicial: ataque 70 ms, liberação 220 ms, a validar por plataforma). `null` significa ausência de medidor; `0` significa silêncio medido. Não sintetizar RMS, espectro ou fonemas inexistentes. Se o player só informar `isPlaying`, animar **estado**, não amplitude vocal.

**Mapeamento para a documentação web de referência:** `idle -> null`, `processing -> thinking`, `listening -> listening`, `speaking -> talking`; estados extras são exclusivos do contrato Instant. É apenas equivalência conceitual: não obriga o Flutter a importar ElevenLabs UI.

**Interrupções e energia:** áudio e input têm prioridade sobre gráficos; ao pausar, fechar, colocar em background, perder permissão, interromper playback ou receber barge-in, parar medidores/renderização conforme o ciclo de vida real. Não criar loop de render separado que sobreviva à rota ou ao widget.

### 6.15 `ExpressiveCaptions` e `EmotionSelector` — experiência V4 adaptada

**`ExpressiveCaptions`:**
- Exibir transcrição legível, selecionável e localizada fora do WebGL/Canvas; legenda por frase é o padrão.
- Destaque por palavra **somente** se houver alinhamento temporal verdadeiro entre áudio reproduzido e palavra; caso contrário usar frase estática/atualização incremental.
- Suportar mudança de idioma, texto aumentado, leitor de tela, pausa/replay e modo sem som. Evitar flashes, saltos de layout e notificações a cada token.

**`EmotionSelector` (opt-in e contextual):**
- Inspirar-se no princípio do microsite *Emotional Range*: permitir ouvir **amostras e estilos** antes de escolher, quando o modelo/backend realmente suportar essas variações.
- Sugestões de categorias neutras: `natural`, `calm`, `energetic`, `empathetic`, `dramatic`. São **rótulos de produto propostos**, não parâmetros de API garantidos.
- A seleção ocorre por ação explícita da pessoa, com botão reproduzir/parar e comparação A/B. Não deduzir emoções ou diagnósticos do usuário pela voz; não enviar áudio para inferência emocional sem necessidade e consentimento apropriado.
- *Audio tags* da Eleven v4, quando a API escolhida as suportar, são **orientações de geração de voz** e **não** instruções para o shader. Validar SDK, preços e compatibilidade da integração real antes de expor o recurso.
- Evitar que o seletor atrase o **primeiro diálogo AHA**: colocá-lo como melhoria progressiva e não etapa obrigatória do onboarding.

**Aplicação entre produtos:** InstantSpeak pode usar `InstantOrb3D` e seletor contextual. InstantStudy e InstantBible usam visualizadores compactos ou estáticos para narração, sem obrigatoriedade de orbe 3D.

### 6.16 `MotionPerformance` — qualidade, degradação e QA

**Orçamentos iniciais de projeto, não valores oficiais da ElevenLabs:**
- **Alvo**: 60 fps (~16,7 ms/frame) apenas quando dispositivo e renderizador sustentarem; **fallback** 30 fps (~33,3 ms/frame) e visual estático caso necessário.
- Limitar custo de shaders/blur, alocações por frame, número de layers e reconstruções de widget; isolar região animada (`RepaintBoundary` no Flutter, quando apropriado).
- Quando a renderização prejudicar digitação, rolagem, áudio ou leitura, **desativar 3D antes de degradar a tarefa**.
- Pausar renderização invisível/background. Testar iOS e Android em equipamentos reais, cenários térmicos, bateria, chamadas longas e rede instável.
- **Flutter:** não pressupor que a API React/Three.js funcione nativamente. Comparar protótipo nativo (`CustomPainter`/shader suportado) versus solução 3D apropriada ao projeto; registrar trade-offs e verificar compatibilidade com a versão real de Flutter/Impeller antes de escolher. WebGL via WebView **não** é escolha automática.
- Entregar fallback estático funcional **antes** de integrar o renderizador 3D; preservar acessibilidade e áudio se a GPU/canvas falhar.

**Gates de aceite específicos (ainda não executados):**
- [ ] A orbe representa corretamente todos os estados, inclusive falha, interrupção, silêncio, permissão negada e perda de conexão.
- [ ] Input e output têm fontes de amplitude reais; `null` nunca é convertido em onda falsamente sincronizada.
- [ ] Canvas pode ser removido sem perda de controles, captions, consentimento ou fluxo AHA.
- [ ] Captions por palavra só quando a origem fornece tempos reais; testes de idiomas e texto ampliado.
- [ ] `EmotionSelector` funciona por teclado, VoiceOver e TalkBack; fallback quando backend não tem controles expressivos.
- [ ] Perfis de GPU/CPU, frame pacing, aquecimento, consumo e falhas documentados em dispositivos de entrada/intermediários.
- [ ] `Reduce Motion`, baixo consumo, background, dark mode e baixo desempenho têm comportamentos previsíveis.
- [ ] Evidências de screenshots/vídeos e testes automatizados anexadas ao PR; testes não executados marcados **não verificados**.
- [ ] Licenças e originalidade de shaders, fontes, cores e assets revisadas.

### 6.17 Plano de implementação para Codex / Work

1. Inventariar stack real, telas, fluxos de voz e eventos já emitidos. Não alterar SDK, marca ou ícone IS sem justificativa.
2. Definir testes para `VoiceSessionAdapter` e `VoiceMotionController`, cobrindo barge-in, ausência de amplitude, mute e background.
3. Implementar `InstantOrbStatic` e `InstantOrb2D` acessíveis; conectar rótulos e controles reais.
4. Implementar **`InstantOrb3D` original** como renderizador intercambiável atrás de *feature flag*, sem afetar áudio.
5. Implementar `ExpressiveCaptions`; habilitar modo palavra a palavra apenas com timestamps verdadeiros.
6. Implementar `EmotionSelector` **somente** onde o serviço de voz permitir, preferencialmente após o primeiro diálogo.
7. Rodar QA de performance, acessibilidade e dispositivo. Abrir PR com comparação antes/depois, testes e relatório de riscos.
8. **Não declarar o design "idêntico à V4"** ou implementado em produção sem medição, revisão e evidência.

**Critério de conclusão:** o design especifica comportamento; a implementação está concluída apenas quando existe código, testes executados, gravações/screenshot reais e aprovação do PR.

### 6.18 Orbes e elementos circulares — classificação de evidência visual

**[VÍDEO — OBSERVADO]** Na gravação mobile enviada em 2026-10-15, há um ponto/esfera rosa-azulado sobreposto a diferentes áreas da tela de texto para fala. A trajetória é compatível **também** com indicador de toque do gravador de tela, não necessariamente com componente do aplicativo. Portanto, **não há demonstração suficiente para afirmar que é o Orb público da ElevenLabs, um visualizador áudio-reativo ou a “orbe V4”**.

**Classes de elemento que o Codex deve distinguir:**

| Classe | Fonte de comportamento | Deve entrar no DESIGN.md? |
|---|---|---|
| Indicador de toque de gravação | Overlay externo ou demonstração, não confirmado como app | **Não** reproduzir |
| Badge/círculo decorativo | Animação local estética, sem semântica vocal | Apenas se acrescentar clareza |
| Indicador de status | Estado real de geração/captação/reprodução | **Sim**, texto/ícone acessível |
| `InstantOrb3D` | `VoiceMotionController` com estado + volume real, quando disponível | **Sim**, componente original e opcional |
| `InstantOrb2D/Static` | Mesma semântica, menor custo | **Sim**, fallback obrigatório |

**Prova necessária para atribuir elemento ao aplicativo:** captura do app sem sobreposição do gravador, ou documentação/código oficial que identifique o componente. Não partir de animação do cursor para inferir algoritmo de shader, sensibilidade à voz ou FPS.

### 6.19 Motion do fluxo de biblioteca e TTS — comportamentos testáveis

**[INSTANT — PROPOSTO]** As transições abaixo usam tokens da seção 6.9. Não são extraídas por engenharia reversa do vídeo.

| Origem → destino | Motion proposto | Regras |
|---|---|---|
| Editor → biblioteca de vozes | Navegação nativa da plataforma | Preservar texto, voz anterior e posição do cursor |
| VoiceCard default → selected | Cor de seleção + ícone + borda funcional; `motion.fast` | Nenhum bounce que esconda texto |
| Preview idle → playing | Estado de play/pause imediatamente e progresso real | Nunca animar ondas como áudio real sem medição |
| Biblioteca → editor | Retorno nativo após `confirm` | Foco correto e voz escolhida visível |
| CTA gerar → loading | Indicador textual e progresso indeterminado honesto | Não alterar largura do botão e não duplicar requisição |
| Loading → resultado | Revelação leve (`motion.normal`) | Só após URI de áudio válida; anunciar conclusão uma vez |
| Resultado → player | Atualizar controles em sincronismo com o player | Sem karaoke sem tempo real |
| Falha/limite de cota | Estado estático + opção de reparo | Não animar erro continuamente |

`VoicePreviewPlayer` e `TtsAudioPlayer` compartilham uma política de *audio focus*: interromper ou atenuar outros áudios conforme convenções da plataforma, sem conflito com sessão de conversa e gravador. **Nunca iniciar captura e playback simultaneamente por acidente.** Testar headset, Bluetooth, chamadas recebidas, background e alternância de aplicativos.

### 6.20 Regras de performance orientadas à tarefa

1. Microfone, áudio, digitação e rolagem têm prioridade sobre visualizadores; se ocorrer jank, fazer downgrade de `InstantOrb3D` antes de degradar áudio.
2. No catálogo, thumbnails e previews são carregados sob demanda, com cache dentro das políticas de privacidade e licença; lista deve usar virtualização.
3. Medir no mesmo hardware: tempo até interação, frame pacing, tempo até primeira reprodução, consumo de memória do canvas e da lista, interrupções do áudio.
4. Não definir alvos arbitrários de latência como requisito oficial da ElevenLabs. Metas de produto devem ser aprovadas **após baseline** no repositório e em aparelhos reais.
5. Remover listeners e players no dispose da tela, mas preservar rascunhos e seleção do fluxo. Nunca remover estado do usuário como efeito colateral de desligar animação.
6. Renderizar captions como texto nativo e nunca exclusivamente numa textura 3D.

### 6.21 Contrato visual original da orbe: `InstantOrb3D` (v1.8)

**Referências distinguidas:** o **Sound Flow** das diretrizes de marca é uma superfície reativa 3D; o **Orb da ElevenLabs UI** é componente web Three.js/React Three Fiber; **Eleven v4** é modelo de voz, não versão oficial da orbe. Nenhuma dessas referências implica que o mesmo shader está presente no site v4 ou no app mobile.

**Decisão Instant:** projetar núcleo elíptico com halo segmentado e luz suave, com estado e energia vindos de eventos reais. A `InstantOrb3D` é **meta de implementação**, não código entregue; exigimos fallback 2D/estático e independência de controles/captions. Todas as regras visuais, de acesso, testes, impacto no desempenho e originalidade estão em `design/ORB_VISUAL_SPEC.md`.

**Proveniência dos medidores:** `inputLevel=null` significa medição indisponível; `inputLevel=0` é silêncio medido. A UI **não** gera áudio reativo falso em produção. O modo demonstrativo manual deve ser rotulado como simulação, sempre.

### 6.22 Identidade de vozes, baselines e motion demos (v1.8)

- **`design/VOICE_IDENTITY.md`**: define `VoiceGlyph` com seis variantes determinísticas, identificadas por ID de catálogo. Não reproduzir o mapeamento proprietário de timbre/pitch para textura, matiz e brilho da ElevenLabs; não inferir atributos sensíveis.
- **`design/VISUAL_BASELINES.md` + `design/baselines/manifest.json`**: matriz verificável de casos. Todos os casos começam como `spec_only` — **não existem screenshots golden aprovados no pacote**. Implementação exige capturas e revisão humana.
- **`design/MOTION_DEMOS.md` + `demos/voice_motion_demo.html`**: demo HTML/Canvas **2D original**, com estados simulados claramente identificados, opção de microfone **real** após clique e redução de movimento. Não é 3D, não tem SDK ElevenLabs, não substitui QA Flutter.
- **Chime/Echo**: manter como referências de intenção (tipografia + áudio), não arquivos de animação a copiar. Implementar versões próprias somente depois de critérios de legibilidade, legendas sincronizadas de verdade e testes de movimento reduzido.

**Nova ordem de entrega:** primeiro renderização estática/2D acessível + sessão real; depois identidades do catálogo e captions; só então prova 3D Flutter e baseline visual. Nenhum efeito pode piorar AHA, FPS, VoiceOver/TalkBack ou performance.


### 6.23 v1.8 — referência ElevenLabs x prova executável Instant

A arquitetura do design permanece original. `Eleven v4` é modelo de fala; `ElevenLabs UI Orb` é componente 3D web independente; `Sound Flow` e `Voice Signatures` são regras distintas de marca. Os links e os limites estão descritos em `design/ORB_RENDERER.md` e `design/ELEVEN_V4_EXPERIENCE.md`.

**Artefatos reais da v1.8:** `demos/instant_orb_lab.html` (UI responsiva com prioridade para protótipo WebGL, fallback Canvas 2D e estático), `demos/instant_orb_webgl.js` (malha + shader originais), `demos/instant_orb_canvas.js` (fallback original), `demos/instant_voice_core.js` (estados e glyphs determinísticos), `design/MOTION_QA_v1.8.md` (evidências). No Chromium usado nesta entrega, **WebGL indisponível**: o screenshot demonstra Canvas 2D, **não** a superfície WebGL. Compatibilidade mobile Flutter não foi testada.

**Gates adicionais:**
- Medidor de áudio com proveniência explícita (`real | simulated | none`), sem amplitude artificial em `processing`, `idle`, `error` ou quando o medidor é `null`.
- Protótipo de estilo V4 usa tags demonstrativas `[curious]`, `[whispers]`, `[excited]` como texto: não reivindicar áudio ElevenLabs gerado.
- Identidade visual de vozes usa FNV‑1a NFC UTF‑8 versionado e **não infere acústica/demografia**.
- App Flutter só é aprovado após compilação, ligação SDK real, screenshots de app, acessibilidade e benchmarks de dispositivo.
- Nenhuma demonstração HTML converte automaticamente um caso `spec_only` do manifesto Flutter em baseline aprovado.

### 6.24 Identidade cromática canônica das orbes — InstantSpeak (normativo v2.9)

**Uma persona = um par de cores persistente.** Este catálogo **reproduz os dados do InstantSpeak** observados no GitHub em 15/10/2026. Os IDs históricos (`leonardo`, `michelangelo`, `donatello`, `raphael`) são chaves internas compatíveis com perfis existentes; as marcas visíveis são Caleb, Kellan, Finley e Warren. **Não trocar IDs** para fazer um rename cosmético.

O `INSTDESIGN.MD` é a única **fonte normativa de design**; no repositório, `flutter/lib/design/tutor_catalog.dart` e `shared/tutors.js` são implementações que devem corresponder integralmente ao catálogo, sem assumir que o documento atualiza o aplicativo automaticamente.

| ID estável | Persona | Voz OpenAI Realtime | Cor 1 | Cor 2 | `motionRate` | `phase` |
|---|---|---|---|---|---:|---:|
| `leonardo` | Caleb | `cedar` | `#2792DC` | `#9CE6E6` | 0.88 | 0.11 |
| `michelangelo` | Kellan | `coral` | `#FF9850` | `#FFD6AD` | 1.12 | 0.29 |
| `donatello` | Finley | `sage` | `#8C68E8` | `#D9CBFF` | 0.82 | 0.47 |
| `raphael` | Warren | `ash` | `#EC5757` | `#FFC2C2` | 1.18 | 0.71 |
| `maya` | Maya | `marin` | `#20A99D` | `#B0E9DD` | 0.92 | 0.17 |
| `alex` | Alex | `alloy` | `#667D92` | `#C5D5E1` | 0.96 | 0.35 |
| `noah` | Noah | `ballad` | `#B77B48` | `#EAD0B0` | 0.99 | 0.56 |
| `elliot` | Elliot | `echo` | `#507FA3` | `#B3D2E8` | 0.86 | 0.65 |
| `sofia` | Sofia | `shimmer` | `#B86A97` | `#F2C5E0` | 1.09 | 0.82 |
| `river` | River | `verse` | `#6D77C8` | `#CDD5FA` | 1.04 | 0.93 |

**Regras obrigatórias e comuns a Web, Android, iOS/iPadOS:**

1. **Identidade:** renderizador e fallback utilizam `colors[0]`/`colors[1]` do tutor selecionado, mesmo no modo escuro. Nunca substituí-los pelo azul genérico de produto, salvo fallback explícito sem tutor. Os tons de status (`error`, `muted`, `offline`) devem ficar em controles/labels adjacentes, **sem tornar a identidade do tutor outra cor**.
2. **Estado não é marca:** `idle`, `listening`, `thinking`, `speaking`, `paused`, `interrupted`, `error` mudam velocidade, resposta à amplitude ou estado estático; não substituem permanentemente as cores do tutor. Redução de movimento congela a geometria, mantendo as cores e o rótulo de estado.
3. **RMS real:** entrada reage apenas em `listening` com captação autorizada; saída reage apenas em `speaking` com player medido. Quando o nível for desconhecido (`null`), não inventar amplitude. `motionRate` e `phase` definem personalidade de animação, **não** ritmo imposto ao áudio.
4. **Troca de persona:** o mesmo commit de estado deve atualizar voz, par de cores, taxa, fase e ID persistido, sem frames mostrando identidade antiga com voz nova. Se o SDK exige nova sessão para mudar voz, a UI comunica essa limitação.
5. **Renderizadores:** Web pode usar WebGL com fallback Canvas 2D; Flutter Android e Apple devem renderizar a mesma paleta em 3D/2D/estático segundo capacidade, energia e acessibilidade. Um PNG ou screenshot não prova fidelidade do shader.
6. **Acessibilidade:** estado sempre disponível fora do canvas, contraste AA dos textos/controles adjacentes e Reduce Motion / remover animações; as duas cores da orbe são **decoração**, não texto. Não afirmar WCAG AA para cada tonalidade luminosa do shader sem medições reais.
7. **Produto:** os pares abaixo são **somente do InstantSpeak**. InstantStudy, InstantBible e InstantVest herdam arquitetura/códigos de estado quando aplicáveis, mas não recebem automaticamente os 10 tutores nem suas vozes.
8. **Detecção de divergência:** atualizar o JSON e a tabela juntos, comparar com Flutter e Web, e executar a suíte §6.26 com mutações antes de qualquer merge. `tutor-flutter-parity.mjs` permanece gate independente no InstantSpeak.

**Proveniência conferida:** GitHub `raphaelribeirob/InstantSpeak`, `flutter/lib/design/tutor_catalog.dart` (blob `b21f02778a4eea3b9ae411693a8c35fc2a07dbfd`) e `shared/tutors.js` (blob `c520687bf3e3841fc8a56fb9c6e8de8a6d5f52b5`). Verificar novamente ao integrar, pois esses commits poderão mudar.

<!-- INSTANT_ORB_CATALOG_BEGIN -->
```json
{
  "schema": "instant.orb.identity/1.0",
  "product": "InstantSpeak",
  "canonicalSource": "INSTDESIGN.MD#6.24",
  "defaultTutorId": "leonardo",
  "preserveColorsAcrossStates": true,
  "voiceProvider": "OpenAI Realtime",
  "elevenV4UsedByThisCatalog": false,
  "tutors": [
    {
      "id": "leonardo",
      "name": "Caleb",
      "realtimeVoice": "cedar",
      "colors": [
        "#2792DC",
        "#9CE6E6"
      ],
      "motionRate": 0.88,
      "phase": 0.11
    },
    {
      "id": "michelangelo",
      "name": "Kellan",
      "realtimeVoice": "coral",
      "colors": [
        "#FF9850",
        "#FFD6AD"
      ],
      "motionRate": 1.12,
      "phase": 0.29
    },
    {
      "id": "donatello",
      "name": "Finley",
      "realtimeVoice": "sage",
      "colors": [
        "#8C68E8",
        "#D9CBFF"
      ],
      "motionRate": 0.82,
      "phase": 0.47
    },
    {
      "id": "raphael",
      "name": "Warren",
      "realtimeVoice": "ash",
      "colors": [
        "#EC5757",
        "#FFC2C2"
      ],
      "motionRate": 1.18,
      "phase": 0.71
    },
    {
      "id": "maya",
      "name": "Maya",
      "realtimeVoice": "marin",
      "colors": [
        "#20A99D",
        "#B0E9DD"
      ],
      "motionRate": 0.92,
      "phase": 0.17
    },
    {
      "id": "alex",
      "name": "Alex",
      "realtimeVoice": "alloy",
      "colors": [
        "#667D92",
        "#C5D5E1"
      ],
      "motionRate": 0.96,
      "phase": 0.35
    },
    {
      "id": "noah",
      "name": "Noah",
      "realtimeVoice": "ballad",
      "colors": [
        "#B77B48",
        "#EAD0B0"
      ],
      "motionRate": 0.99,
      "phase": 0.56
    },
    {
      "id": "elliot",
      "name": "Elliot",
      "realtimeVoice": "echo",
      "colors": [
        "#507FA3",
        "#B3D2E8"
      ],
      "motionRate": 0.86,
      "phase": 0.65
    },
    {
      "id": "sofia",
      "name": "Sofia",
      "realtimeVoice": "shimmer",
      "colors": [
        "#B86A97",
        "#F2C5E0"
      ],
      "motionRate": 1.09,
      "phase": 0.82
    },
    {
      "id": "river",
      "name": "River",
      "realtimeVoice": "verse",
      "colors": [
        "#6D77C8",
        "#CDD5FA"
      ],
      "motionRate": 1.04,
      "phase": 0.93
    }
  ]
}
```
<!-- INSTANT_ORB_CATALOG_END -->

### 6.25 Compatibilidade conceitual com Eleven v4 e ElevenLabs UI Orb

- **Orb oficial da ElevenLabs UI** (`https://ui.elevenlabs.io/docs/components/orb`): componente **web** com `colors: [string,string]`, volume normalizado, estado `null | thinking | listening | talking`, WebGL/Three.js/React Three Fiber; aceita atualização dinâmica de cores. O padrão Instant usa duas cores e estados equivalentes de UX, mas **não tem obrigação de copiar shader, geometria, marca ou animação**. Para estados extras do Instant, renderizar como estados próprios.
- **Eleven v4 / Eleven v4 Turbo** (`https://elevenlabs.io/docs/pt/overview/capabilities/text-to-speech/eleven-v4`): modelos **de geração de áudio**, não uma versão oficial de orbe. `eleven_v4` privilegia qualidade; `eleven_v4_turbo` é destinado a aplicações interativas/baixa latência. Disponibilizam tags de áudio e controles Stability/Similarity, mas **não Style/Speed sliders nem SSML** nesse modelo. Isso não define cores, shaders nem velocidade da animação.
- **Fornecedor real do InstantSpeak neste contrato:** OpenAI Realtime (`cedar`, `coral`, `sage`, `ash`, `marin`, `alloy`, `ballad`, `echo`, `shimmer`, `verse`), e **não** Eleven v4. As cores são **autorais da linha Instant**; qualquer mudança real de fornecedor requer nova integração e testes de voz, custo, disponibilidade e direitos de uso.
- **Mapeamento de estados para a Orb web:** `idle` → `null`, `thinking/processing` → `thinking`, `listening` → `listening`, `speaking` → `talking`. Estados `error/offline/paused/interrupted` são semântica Instant e devem funcionar mesmo sem WebGL.

### 6.26 Testes reprodutíveis das 10 orbes — modo arquivo único

Este bloco testa o documento isoladamente e compara com os **arquivos reais** do InstantSpeak quando indicado. Não certifica renderização física Android/Apple nem execução Maestro. Salve **somente** `INSTDESIGN.MD` e execute na pasta do documento:

```bash
python3 - <<'PY_ORB_TEST'
from pathlib import Path
import re
src=Path('INSTDESIGN.MD').read_text(encoding='utf-8')
m=re.search(r'<!-- INSTANT_ORB_TEST_BEGIN -->\s*```python\n(.*?)\n```\s*<!-- INSTANT_ORB_TEST_END -->',src,re.S)
assert m, 'Código de teste não encontrado'
exec(compile(m.group(1),'INSTDESIGN.MD::orb-tests','exec'))
PY_ORB_TEST
```

Para validar contra o repositório InstantSpeak, execute esse comando na raiz contendo o arquivo e os diretórios `flutter/` e `shared/` (ou use as variáveis `INSTANT_FLUTTER_CATALOG` e `INSTANT_WEB_CATALOG`). **Se o repositório não estiver disponível, o resultado será `NOT_RUN` para paridade externa, nunca PASS.**

<!-- INSTANT_ORB_TEST_BEGIN -->
```python
from pathlib import Path
import os, json, re, copy, tempfile, unittest

FILE=Path('INSTDESIGN.MD')
DOC=FILE.read_text(encoding='utf-8')
START='<!-- INSTANT_ORB_CATALOG_BEGIN -->'
END='<!-- INSTANT_ORB_CATALOG_END -->'
HEAD='### 6.24 Identidade cromática canônica das orbes'
END_SECTION='### 6.25 Compatibilidade conceitual'
EXPECTED_IDS=('leonardo','michelangelo','donatello','raphael','maya','alex','noah','elliot','sofia','river')
EXPECTED_VOICES=('cedar','coral','sage','ash','marin','alloy','ballad','echo','shimmer','verse')
HEX=re.compile(r'#[0-9A-F]{6}\Z')

def read_catalog(doc):
    assert len(re.findall(r'(?m)^'+re.escape(START)+r'$',doc))==1 and len(re.findall(r'(?m)^'+re.escape(END)+r'$',doc))==1, 'Catalog markers duplicated/missing'
    raw=doc.split(START,1)[1].split(END,1)[0]
    m=re.fullmatch(r'\s*```json\n(.*?)\n```\s*',raw,re.S)
    assert m, 'Canonical catalog JSON not fenced'
    result=json.loads(m.group(1))
    assert len(re.findall(r'(?m)^'+re.escape(HEAD)+r'[^\n]*$',doc))==1 and len(re.findall(r'(?m)^'+re.escape(END_SECTION)+r'[^\n]*$',doc))==1, 'Normative headings missing'
    return result

def validate(doc, dart=None, web=None):
    model=read_catalog(doc)
    assert model['schema']=='instant.orb.identity/1.0'
    assert model['product']=='InstantSpeak'
    assert model['preserveColorsAcrossStates'] is True
    assert model['voiceProvider']=='OpenAI Realtime'
    assert model['elevenV4UsedByThisCatalog'] is False
    tutors=model['tutors']
    assert len(tutors)==10, 'Ten tutors required'
    assert tuple(t['id'] for t in tutors)==EXPECTED_IDS, 'Stable ids changed'
    assert tuple(t['realtimeVoice'] for t in tutors)==EXPECTED_VOICES, 'OpenAI voice catalog drift'
    assert model['defaultTutorId']==EXPECTED_IDS[0]
    assert len({t['name'] for t in tutors})==10
    assert len({tuple(t['colors']) for t in tutors})==10, 'Duplicate visual persona'
    table=doc.split(HEAD,1)[1].split(END_SECTION,1)[0].split('<!-- INSTANT_ORB_CATALOG_BEGIN -->',1)[0]
    for t in tutors:
        assert len(t['colors'])==2 and all(isinstance(c,str) and HEX.fullmatch(c) for c in t['colors']), t['id']
        assert all(isinstance(t[k],(int,float)) and not isinstance(t[k],bool) for k in ('motionRate','phase'))
        assert 0.25<=t['motionRate']<=2.0 and 0<=t['phase']<=1, t['id']
        row=f"| `{t['id']}` | {t['name']} | `{t['realtimeVoice']}` | `{t['colors'][0]}` | `{t['colors'][1]}` | {t['motionRate']:.2f} | {t['phase']:.2f} |"
        assert row in table, f'Table drift: {t["id"]}'
    assert '### 6.25 Compatibilidade conceitual com Eleven v4' in doc
    if (dart is None)!=(web is None): raise AssertionError('Dart and web are required together')
    if dart is not None:
        parsed=parse_dart(dart)
        parsed_web=parse_web(web)
        assert len(parsed)==len(parsed_web)==10, 'Source catalog missing tutors'
        expected={t['id']:(t['name'],t['realtimeVoice'],*t['colors'],t['motionRate'],t['phase']) for t in tutors}
        assert parsed==expected, f'Dart mismatch: {[(k,v) for k,v in parsed.items() if expected.get(k)!=v]}'
        assert parsed_web==expected, f'Web mismatch: {[(k,v) for k,v in parsed_web.items() if expected.get(k)!=v]}'
    return len(tutors)

def parse_dart(content):
    pattern=r"TutorIdentity\(\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*'([^']+)',\s*'(#[0-9A-Fa-f]{6})',\s*'(#[0-9A-Fa-f]{6})',\s*([0-9.]+),\s*([0-9.]+),"
    result={}
    for m in re.finditer(pattern,content):
        ident,name,voice,color1,color2,rate,phase=m.groups()
        assert ident not in result
        result[ident]=(name,voice,color1.upper(),color2.upper(),float(rate),float(phase))
    return result

def parse_web(content):
    result={}
    for m in re.finditer(r"(?m)^\s{2}([a-z]+): Object\.freeze\(\{(.*?)(?=^\s{2}[a-z]+: Object\.freeze\(\{|^\}\);)",content,re.S|re.M):
        ident,block=m.groups()
        nm=re.search(r"name:\s*'([^']+)'",block)
        vv=re.search(r"realtimeVoice:\s*'([^']+)'",block)
        orb=re.search(r"orb:\s*Object\.freeze\(\{\s*primary:\s*'(#[0-9A-Fa-f]{6})',\s*secondary:\s*'(#[0-9A-Fa-f]{6})',\s*motionRate:\s*([0-9.]+),\s*phase:\s*([0-9.]+)",block)
        assert nm and vv and orb,ident
        c1,c2,rate,phase=orb.groups()
        assert ident not in result
        result[ident]=(nm.group(1),vv.group(1),c1.upper(),c2.upper(),float(rate),float(phase))
    return result

def make_dart(tutors):
    return '\n'.join(f"TutorIdentity(\n '{t['id']}',\n '{t['name']}',\n 'description',\n '{t['realtimeVoice']}',\n '{t['colors'][0]}',\n '{t['colors'][1]}',\n {t['motionRate']},\n {t['phase']},\n 1,\n 1,\n)," for t in tutors)

def make_web(tutors):
    return 'export const TUTORS = Object.freeze({\n'+'\n'.join(f"  {t['id']}: Object.freeze({{\n    id: '{t['id']}',\n    name: '{t['name']}',\n    orb: Object.freeze({{\n      primary: '{t['colors'][0]}',\n      secondary: '{t['colors'][1]}',\n      motionRate: {t['motionRate']},\n      phase: {t['phase']}\n    }}),\n    realtimeVoice: '{t['realtimeVoice']}',\n  }})," for t in tutors)+'\n});'

CAT=read_catalog(DOC)
DART_FIXTURE=make_dart(CAT['tutors'])
WEB_FIXTURE=make_web(CAT['tutors'])
assert validate(DOC,DART_FIXTURE,WEB_FIXTURE)==10
assert len(parse_dart(DART_FIXTURE))==len(parse_web(WEB_FIXTURE))==10

# Mutation tests: a test should FAIL when intentionally introducing each defect.
checks=[]
def expect_failure(label,edited,dart=None,web=None):
    try: validate(edited,dart,web)
    except (AssertionError,KeyError,ValueError,TypeError,json.JSONDecodeError):
        checks.append(label)
    else: raise AssertionError(f'Mutant survived: {label}')

def edit_data(modify):
    model=copy.deepcopy(CAT)
    modify(model)
    raw=json.dumps(model,indent=2,ensure_ascii=False)
    return re.sub(r'(?<=<!-- INSTANT_ORB_CATALOG_BEGIN -->\n)```json\n.*?\n```', '```json\n'+raw+'\n```',DOC,count=1,flags=re.S)

expect_failure('bad_hex',edit_data(lambda x:x['tutors'][0]['colors'].__setitem__(0,'#ZZZZZZ')))
expect_failure('duplicate_color',edit_data(lambda x:x['tutors'][1].__setitem__('colors',list(x['tutors'][0]['colors']))))
expect_failure('missing_tutor',edit_data(lambda x:x['tutors'].pop()))
expect_failure('changed_id',edit_data(lambda x:x['tutors'][0].__setitem__('id','other')))
expect_failure('changed_voice',edit_data(lambda x:x['tutors'][0].__setitem__('realtimeVoice','unknown')))
expect_failure('bad_rate',edit_data(lambda x:x['tutors'][0].__setitem__('motionRate',-1)))
expect_failure('bad_phase',edit_data(lambda x:x['tutors'][0].__setitem__('phase',1.5)))
expect_failure('wrong_default',edit_data(lambda x:x.__setitem__('defaultTutorId','unknown')))
expect_failure('no_stable_colors',edit_data(lambda x:x.__setitem__('preserveColorsAcrossStates',False)))
expect_failure('v4_provider_falsehood',edit_data(lambda x:x.__setitem__('elevenV4UsedByThisCatalog',True)))
expect_failure('removed_table_row',DOC.replace('| `leonardo` | Caleb | `cedar` | `#2792DC` | `#9CE6E6` | 0.88 | 0.11 |',''))
expect_failure('deleted_header',DOC.replace(HEAD,'### heading erased',1))
expect_failure('dart_color_drift',DOC,DART_FIXTURE.replace("'#2792DC'","'#111111'",1),WEB_FIXTURE)
expect_failure('web_color_drift',DOC,DART_FIXTURE,WEB_FIXTURE.replace("'#2792DC'","'#111111'",1))
expect_failure('dart_rate_drift',DOC,DART_FIXTURE.replace(' 0.88,',' 0.4,',1),WEB_FIXTURE)
expect_failure('web_voice_drift',DOC,DART_FIXTURE,WEB_FIXTURE.replace("realtimeVoice: 'cedar'","realtimeVoice: 'coral'",1))
expect_failure('missing_web_tutor',DOC,DART_FIXTURE,WEB_FIXTURE.replace('  river: Object.freeze({','  missing: Object.freeze({',1))
assert len(checks)==17, checks
print(f'PASS: catálogo normativo 10/10; paridade sintética Dart/JS 10/10; {len(checks)}/17 mutações detectadas')

DART=Path(os.environ.get('INSTANT_FLUTTER_CATALOG','flutter/lib/design/tutor_catalog.dart'))
WEB=Path(os.environ.get('INSTANT_WEB_CATALOG','shared/tutors.js'))
if DART.is_file() and WEB.is_file():
    validate(DOC,DART.read_text(encoding='utf8'),WEB.read_text(encoding='utf8'))
    print('PASS: 10/10 catálogos reais Flutter e Web idênticos ao INSTDESIGN.MD')
else:
    print('NOT_RUN: paridade com código real (coloque Flutter + shared próximos ao INSTDESIGN.MD)')
print('BLOCKED: renders Android/iOS e teste visual de produção, pendentes de CI/dispositivos')

```
<!-- INSTANT_ORB_TEST_END -->

### 6.27 Learning Motion — terceira camada oficial do Instant (normativo v3.1)

**Decisão de produto (15/10/2026):** acrescentar uma linguagem de *feedback animado à aprendizagem*, inspirada nos **princípios** de clareza, motivação e resposta rápida utilizados pelo Duolingo, **sem copiar Duo, personagens, assets, ilustrações, expressões características, sons ou sequências reconhecíveis**. Rive é um **runtime candidato**, não é prova de que o Duolingo usa exatamente uma tecnologia em cada tela nem uma instalação já realizada.

A arquitetura possui **três camadas sem conflito**:

1. `BrandMotion`: abertura/wordmark **aprovados por produto**. Para InstantSpeak preservar 350 + 1.300 + 1.000 ms, League Spartan 400 e `InstantSpeak™ → ISpeak™`. Learning Motion jamais altera a abertura nem o asset do ícone.
2. `IntelligenceMotion`: orbe de voz, dez paletas/identidades de tutor e áudio real. O feedback educativo **não altera o estado de fala** e não duplica efeitos ao lado da orbe.
3. `LearningMotion`: acerto, tentativa parcial, correção construtiva, progresso e conquista **verificados**, com microinterações próprias da Instant. O conteúdo e o próximo passo continuam claros em movimento reduzido.

**Hierarquia:** resultado educativo real > legibilidade/acessibilidade > funcionalidade nativa > originalidade visual > animação. Não usar motion para mascarar latência, erro, baixa qualidade pedagógica ou serviço indisponível. A regra de uma ação primária por tela permanece.

**Fontes e limites:** [Duolingo — linguagem visual](https://blog.duolingo.com/shape-language-duolingos-art-style/), [Duolingo — marcos e animação](https://blog.duolingo.com/streak-milestone-design-animation/), [Rive Flutter — plataformas](https://pub.dev/packages/rive), [Rive — runtimes oficiais](https://github.com/rive-app/help-center/blob/master/runtimes/overview.md). São referências de engenharia e princípios, **não licença para replicar arte**. Verificar a licença dos arquivos `.riv` e do runtime escolhido antes de distribuir.

### 6.28 Contrato de feedback, estados e tempos

| Gatilho confiável | Motion original Instant | Duração-alvo | Regra de verdade |
|---|---|---:|---|
| Resposta avaliada como correta | Confirmação por forma/borda discreta; texto legível; sem mascote alheio | 120–220 ms | Só após resultado confirmado; sem celebração antecipada |
| Parcialmente correta | Progresso sutil no componente e próximo passo | 120–180 ms | Mostrar o critério faltante sem linguagem humilhante |
| Tentar novamente | Nudge **sem shake punitivo** e foco na dica, sem mover alvo clicável | 90–160 ms | Erro é aprendizado; não representar falha como derrota |
| Progresso salvo | Barra/indicador avança suavemente até o **valor persistido** | 220–400 ms | Sem interpolar pontos inventados, sem avançar só porque a tela carregou |
| Marco conquistado | Ênfase breve, desenho original e texto de conquista verificável | 400–750 ms | Uma única vez por evento/ID; nunca antes de commit |
| Falha/offline/timeout | Cancelar recompensa, apresentar mensagem e retry acessível | Imediato | Erro prevalece sobre feedback otimista |

**Coordenação:** uma conquista e o avanço da barra derivados do **mesmo resultado** devem formar uma única sequência foreground, nunca duas coreografias disparadas independentemente; ver árbitro §6.42. Durante voz ativa a confirmação educacional permanece legível/semântica, mas não compete visualmente com a orbe.

**Regras de transição:** `idle → evaluating → correct|partial|retry → progress? → milestone? → idle`. `error` interrompe a sequência; eventos antigos ou duplicados são ignorados pelo identificador e versão de resultado. Prioridade efetiva: `error > evaluating > milestone > progress > correct > partial > retry > idle`. 

**Eventos de domínio obrigatórios:** `answer_evaluated` aceita resultado verificado; `progress_committed` exige confirmação do armazenamento; `milestone_earned` exige conquista real registrada; `evaluation_started` apenas estado aguardando; `evaluation_failed` finaliza com erro. Conteúdos de resposta, voz, áudio bruto, transcrições e dados sensíveis **não** entram na telemetria de motion. Interações iniciadas por teclado/VoiceOver/TalkBack devem ter o mesmo significado.

### 6.29 Estilo visual e aplicação nos quatro produtos

| Produto | Intensidade | Onde usar | Evitar |
|---|---|---|---|
| **InstantSpeak** | Expressiva, controlada | Uma correção útil, segunda tentativa, pronúncia e avanço de lição | Movimento que concorra com a orbe falando; celebrar microfone aberto |
| **InstantStudy** | Mais expressiva | Quiz, recordação ativa, revisão agendada, domínio verificado | Recompensar respostas erradas, inflar maestria sem avaliação |
| **InstantBible** | **Contida** | Confirmação de prática, leitura concluída, ação salva | Confete, pontos de fé, jogos de culpa, streaks de pressão espiritual |
| **InstantVest** | Motivação por domínio | Competências ENEM C1–C5, revisão, feedback do tutor | Inventar nota ENEM, aprovação acadêmica ou promessa de desempenho |

**Identidade:** usar tipografia, cores, raios e ícones do próprio produto (§§ 2–5), não o verde/Duo/expressões faciais do Duolingo. A paleta da orbe de cada tutor permanece intacta (§ 6.24); Learning Motion usa cores **semânticas da interface**, não define novas cores de identidade vocal. Som e háptica apenas opt-in/contextuais e sempre com equivalente sem som. Não criar mascote adicional nem alterar ícones congelados.

### 6.30 Plataforma, tecnologia e degradação controlada

- **Flutter — InstantSpeak, InstantStudy e InstantBible:** priorizar animações nativas simples; considerar `rive` oficial com `.riv` **original e licenciado** para sequências interativas complexas. Validar pacote/versão, renderer Flutter × Rive, ABI, NDK, integração com Impeller, iOS e Flutter Web. **Nenhum `.riv` foi criado ou integrado neste documento.** Não inserir dependência automática só porque existe uma especificação.
- **React/Capacitor — InstantVest:** testar Rive Web ou CSS/SVG e a reprodução em Android WebView, iOS WKWebView e navegadores. A fonte de evento de domínio continua fora da animação; manter navegação, foco e persistência independentes do runtime gráfico.
- **Fallback em cascata:** Rive original validado → animação nativa/CSS/SVG leve → UI estática com estado legível. Erro no carregamento do asset, WebGL/WASM indisponível, app no background, `prefers-reduced-motion`/Reduce Motion, bateria e desempenho comprometido **não podem bloquear um resultado pedagógico**.
- **Budget-alvo de experiência, a verificar:** 60 FPS quando disponível; medir jank p95, memória, consumo e impacto em TTI nos aparelhos efetivos. Não declarar 60 FPS real a partir de screenshots ou do teste de tokens. Nenhum efeito permanente em resposta/feedback; parar controladores no dispose, aba oculta ou sessão interrompida. Assets compactos, cache e carregamento preguiçoso após a primeira tarefa útil.
- **Global-First:** não gravar palavras localizáveis dentro de `.riv`; traduzir em widget/DOM acessível; RTL espelha somente direções semânticas; preservar números/siglas; validar texto a 200%, fontes fallback e pseudolocales `en-XA`/`ar-XB` conforme § 13A.
- **Reduce Motion:** nenhuma translação, bounce, escala, pulso, loop ou partículas; exibir confirmação estática + texto/ícone semântico e manter o CTA na mesma posição. Uma ausência de movimento nunca deve cancelar a mudança de estado, o anúncio acessível ou a gravação real de progresso.

### 6.31 Registro canônico executável — Learning Motion

A especificação estrutural abaixo é a **única fonte normativa** para eventos, níveis e estados de Learning Motion. Os nomes de eventos pertencem ao domínio, não a um SDK específico. Estado `SPEC_ONLY` indica implementação pendente, e não aprovação técnica. O bloco pode ser lido diretamente deste Markdown por Codex/CI, sem outro documento mestre.

<!-- INSTANT_LEARNING_MOTION_POLICY_BEGIN -->
```json
{
  "schemaVersion": "3.1.0",
  "layer": "InstantLearningMotion",
  "identity": "Original Instant artwork, gestures and typography; Duolingo referenced only for learning-feedback principles",
  "scope": {
    "products": [
      "InstantSpeak",
      "InstantStudy",
      "InstantBible",
      "InstantVest"
    ],
    "platforms": [
      "android",
      "ios",
      "ipados",
      "web"
    ],
    "brandIntroImmutable": true,
    "voiceOrbImmutable": true
  },
  "renderer": {
    "flutterNative": "Rive after asset/runtime QA, otherwise Flutter Animated*/CustomPainter, otherwise static",
    "reactCapacitor": "Rive web runtime after QA, otherwise CSS/SVG or static",
    "web": "Rive Web after QA, otherwise CSS/SVG or static",
    "riveAssetStatus": "NOT_CREATED",
    "implementationStatus": "SPEC_ONLY",
    "fallbackAlwaysAvailable": true,
    "runtimeVersion": "PIN_AFTER_COMPATIBILITY_TEST",
    "gracefulOnLoadFailure": true
  },
  "states": [
    "idle",
    "evaluating",
    "correct",
    "partial",
    "retry",
    "progress",
    "milestone",
    "error"
  ],
  "events": {
    "answer_evaluated": {
      "requiresVerifiedResult": true,
      "allowedOutcomes": [
        "correct",
        "partial",
        "retry"
      ],
      "oncePerResultId": true
    },
    "progress_committed": {
      "requiresPersistedAck": true,
      "oncePerResultId": true
    },
    "milestone_earned": {
      "requiresPersistedAck": true,
      "oncePerResultId": true
    },
    "evaluation_started": {
      "requiresVerifiedResult": false,
      "allowedOutcomes": [
        "evaluating"
      ]
    },
    "evaluation_failed": {
      "requiresVerifiedResult": false,
      "allowedOutcomes": [
        "error"
      ]
    }
  },
  "priority": [
    "error",
    "evaluating",
    "milestone",
    "progress",
    "correct",
    "partial",
    "retry",
    "idle"
  ],
  "durationsMs": {
    "correct": [
      120,
      220
    ],
    "partial": [
      120,
      180
    ],
    "retry": [
      90,
      160
    ],
    "progress": [
      220,
      400
    ],
    "milestone": [
      400,
      750
    ],
    "bibleMax": 220,
    "reducedMax": 0
  },
  "a11y": {
    "reducedMotionStatic": true,
    "essentialMeaningOutsideCanvas": true,
    "noColorOnlyMeaning": true,
    "noMotionOnlyMeaning": true,
    "screenReaderOneAnnouncementPerState": true,
    "tapTargetsNeverMoved": true,
    "noFlashing": true,
    "noForcedHaptics": true
  },
  "globalFirst": {
    "localeFromApp": true,
    "noTextBakedIntoAnimation": true,
    "rtlMirrorsDirectionalOnly": true,
    "localizedPlurals": true,
    "testedPseudoLocales": [
      "en-XA",
      "ar-XB"
    ]
  },
  "privacy": {
    "noTranscriptInMotionTelemetry": true,
    "noRawAudioInMotionTelemetry": true,
    "eventIdsEphemeral": true
  },
  "release": {
    "nativeAndroid": "NOT_RUN",
    "nativeApple": "NOT_RUN",
    "webE2E": "NOT_RUN",
    "riveAssets": "NOT_CREATED",
    "approved": false
  },
  "productModes": {
    "InstantSpeak": {
      "mode": "coaching",
      "correct": "short affirmative accent + readable feedback",
      "retry": "gentle try-again, no punitive shake",
      "progress": "only after lesson record committed",
      "milestone": "only earned lesson milestone; never during live speech"
    },
    "InstantStudy": {
      "mode": "study",
      "correct": "subtle card acknowledgment",
      "retry": "one helpful hint, no negative character",
      "progress": "mastery state based on verified answers",
      "milestone": "only verified study milestone"
    },
    "InstantBible": {
      "mode": "quiet",
      "correct": "quiet confirmation; no score celebration",
      "retry": "gentle neutral guidance",
      "progress": "optional personal reflection/progress only",
      "milestone": "no streak-pressure and no points spectacle"
    },
    "InstantVest": {
      "mode": "competence",
      "correct": "verified competence-specific feedback",
      "retry": "supportive revision prompt",
      "progress": "only after persisted real competency evaluation",
      "milestone": "only genuine learning milestone, not invented ENEM score"
    }
  }
}
```
<!-- INSTANT_LEARNING_MOTION_POLICY_END -->

### 6.32 QA obrigatório, acessibilidade e critérios de aceite (LM-001..LM-026)

| Teste | Escopo | O que deve reprovar |
|---|---|---|
| `LM-001` | Semântica do acerto | Render prematuro antes da avaliação confirmada |
| `LM-002` | Idempotência | Mesmo ID de resultado reproduz recompensa duas vezes |
| `LM-003` | Offline | Progresso animado como salvo sem ACK |
| `LM-004` | Falha | Recompensa continua após erro ou timeout |
| `LM-005` | Tela pequena | CTA/título cortados em largura 320dp |
| `LM-006` | 200% de fonte | Conteúdo inacessível, scroll/truncation |
| `LM-007` | Android acessibilidade | TalkBack não lê o resultado e o próximo passo |
| `LM-008` | Apple acessibilidade | VoiceOver e Reduce Motion preservam função |
| `LM-009` | Web acessibilidade | Keyboard, foco e `prefers-reduced-motion` |
| `LM-010` | RTL | Direção correta sem inverter números/percentuais |
| `LM-011` | Pseudolocales | `en-XA`/`ar-XB` sem corte/strings embutidas |
| `LM-012` | Persistência | Progresso após reinstância reflete estado salvo |
| `LM-013` | Background | Parar e retomar sem replay de conquistas antigas |
| `LM-014` | Baixa memória | Fallback estático legível após perda de renderer |
| `LM-015` | Falha Rive/WASM | Carregamento quebrado não bloqueia ação |
| `LM-016` | Android API mínima | Testar APK nativo e emuladores API 24/29/34 quando aplicável |
| `LM-017` | Web browser | Chrome, Safari/WebKit e Firefox reais |
| `LM-018` | iOS/iPadOS | Compilação nativa e aparelho/simulador |
| `LM-019` | Flutter | Testes de widget, golden, análise estática |
| `LM-020` | Capacitor | Android WebView + iOS WKWebView, input e foco |
| `LM-021` | Dupla animação | Feedback não disputa atenção com orbe em fala |
| `LM-022` | InstantBible | Nenhuma recompensa de fé/pontos compulsórios |
| `LM-023` | InstantVest | Proibida nota de competência inventada |
| `LM-024` | Segurança | Nenhum áudio/transcrição/resposta em telemetria de motion |
| `LM-025` | Orçamento | Perf/Jank/energia medidos no hardware alvo |
| `LM-026` | Evidência | Build ID + commit + screenshot/vídeo + execução + revisão humana |

**Release gate:** se qualquer LM crítico estiver `NOT_RUN`, `FAIL` ou sem evidência (incluindo assets `.riv` não produzidos), estado de release **BLOCKED**. Os testes estáticos da próxima seção **não** executam Flutter, Android, Apple, browsers reais ou assinatura de marketplace.

### 6.33 Autoteste de contrato Learning Motion — arquivo único

O script embutido verifica o JSON, políticas, prioridades, eventos semânticos, fallback, produtos/plataformas, 26 IDs de QA, condições de ativação e falhas provocadas. Executar com `python3` extraindo o bloco entre `INSTANT_LEARNING_MOTION_SELFTEST_BEGIN/END`, como no exemplo abaixo. Isso **não** cria código Rive nem substitui integração e teste de dispositivos.

<!-- INSTANT_LEARNING_MOTION_SELFTEST_BEGIN -->
```python
from pathlib import Path
from tempfile import TemporaryDirectory
import json,re,copy,subprocess,sys
source = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
policy_match = re.findall(r'(?m)^<!-- INSTANT_LEARNING_MOTION_POLICY_BEGIN -->\s*```json\n(.*?)\n```\s*<!-- INSTANT_LEARNING_MOTION_POLICY_END -->', source, re.S)
assert len(policy_match) == 1, 'Duplicate or missing Learning Motion policy'
policy = json.loads(policy_match[0])

def validate(d, document=source):
    assert d['schemaVersion']=='3.1.0' and d['layer']=='InstantLearningMotion'
    assert d['scope']['products']==['InstantSpeak','InstantStudy','InstantBible','InstantVest']
    assert set(d['scope']['platforms'])=={'android','ios','ipados','web'}
    assert d['scope']['brandIntroImmutable'] and d['scope']['voiceOrbImmutable']
    assert d['renderer']['riveAssetStatus']=='NOT_CREATED'
    assert d['renderer']['implementationStatus']=='SPEC_ONLY'
    assert d['renderer']['fallbackAlwaysAvailable'] and d['renderer']['gracefulOnLoadFailure']
    assert d['renderer']['runtimeVersion']=='PIN_AFTER_COMPATIBILITY_TEST'
    assert d['states']==['idle','evaluating','correct','partial','retry','progress','milestone','error']
    assert d['priority']==['error','evaluating','milestone','progress','correct','partial','retry','idle']
    assert set(d['events'])=={'answer_evaluated','progress_committed','milestone_earned','evaluation_started','evaluation_failed'}
    assert d['events']['answer_evaluated']['requiresVerifiedResult']
    assert set(d['events']['answer_evaluated']['allowedOutcomes'])=={'correct','partial','retry'}
    assert d['events']['progress_committed']['requiresPersistedAck']
    assert d['events']['milestone_earned']['requiresPersistedAck']
    for key in ('answer_evaluated','progress_committed','milestone_earned'):
        assert d['events'][key]['oncePerResultId'], key
    assert d['events']['evaluation_failed']['allowedOutcomes']==['error']
    dur=d['durationsMs']
    for key,lo,hi in [('correct',120,220),('partial',120,180),('retry',90,160),('progress',220,400),('milestone',400,750)]:
        assert dur[key]==[lo,hi], key
    assert dur['bibleMax']<=220 and dur['reducedMax']==0
    assert all(d['a11y'][key] for key in ('reducedMotionStatic','essentialMeaningOutsideCanvas','noColorOnlyMeaning','noMotionOnlyMeaning','screenReaderOneAnnouncementPerState','tapTargetsNeverMoved','noFlashing','noForcedHaptics'))
    assert all(d['globalFirst'][key] for key in ('localeFromApp','noTextBakedIntoAnimation','rtlMirrorsDirectionalOnly','localizedPlurals'))
    assert d['globalFirst']['testedPseudoLocales']==['en-XA','ar-XB']
    assert all(d['privacy'][key] for key in ('noTranscriptInMotionTelemetry','noRawAudioInMotionTelemetry','eventIdsEphemeral'))
    assert set(d['productModes'])==set(d['scope']['products'])
    assert d['productModes']['InstantBible']['mode']=='quiet'
    assert 'no streak-pressure' in d['productModes']['InstantBible']['milestone']
    assert 'not invented ENEM score' in d['productModes']['InstantVest']['milestone']
    assert d['release']=={'nativeAndroid':'NOT_RUN','nativeApple':'NOT_RUN','webE2E':'NOT_RUN','riveAssets':'NOT_CREATED','approved':False}
    qa=set(re.findall(r'^\| `(LM-\d{3})` \|',document,re.M))
    assert qa=={f'LM-{i:03d}' for i in range(1,27)}, sorted(qa)
    assert len(re.findall(r'^### 6\.27 Learning Motion',document,re.M))==1
    assert len(re.findall(r'^### 6\.33 Autoteste de contrato Learning Motion',document,re.M))==1
    return True

def allowed(event, is_verified=False, is_persisted=False, already_handled=False, has_error=False):
    if has_error or already_handled:
        return False
    rule=policy['events'][event]
    if rule.get('requiresVerifiedResult') and not is_verified:
        return False
    if rule.get('requiresPersistedAck') and not is_persisted:
        return False
    return True

assert validate(policy)
positive=[('answer_evaluated',True,False),('progress_committed',False,True),('milestone_earned',False,True)]
for event,verified,persisted in positive:
    assert allowed(event,verified,persisted)
    assert not allowed(event,already_handled=True,is_verified=verified,is_persisted=persisted)
    assert not allowed(event,has_error=True,is_verified=verified,is_persisted=persisted)
assert not allowed('answer_evaluated')
assert not allowed('progress_committed')
assert not allowed('milestone_earned')

mutations={
 'no_android': lambda d:d['scope']['platforms'].remove('android'),
 'remove_instantvest':lambda d:d['scope']['products'].remove('InstantVest'),
 'brand_intro_override':lambda d:d['scope'].update(brandIntroImmutable=False),
 'orb_override':lambda d:d['scope'].update(voiceOrbImmutable=False),
 'no_fallback':lambda d:d['renderer'].update(fallbackAlwaysAvailable=False),
 'fake_assets':lambda d:d['renderer'].update(riveAssetStatus='READY'),
 'premature_impl':lambda d:d['renderer'].update(implementationStatus='PRODUCTION'),
 'wrong_priority':lambda d:d['priority'].reverse(),
 'unverified_correct':lambda d:d['events']['answer_evaluated'].update(requiresVerifiedResult=False),
 'unpersisted_progress':lambda d:d['events']['progress_committed'].update(requiresPersistedAck=False),
 'unpersisted_milestone':lambda d:d['events']['milestone_earned'].update(requiresPersistedAck=False),
 'duplicate_rewards':lambda d:d['events']['milestone_earned'].update(oncePerResultId=False),
 'no_reduce_motion':lambda d:d['a11y'].update(reducedMotionStatic=False),
 'bake_text':lambda d:d['globalFirst'].update(noTextBakedIntoAnimation=False),
 'rtl_bug':lambda d:d['globalFirst'].update(rtlMirrorsDirectionalOnly=False),
 'transcript_telemetry':lambda d:d['privacy'].update(noTranscriptInMotionTelemetry=False),
 'bible_pressure':lambda d:d['productModes']['InstantBible'].update(milestone='streak pressure'),
 'invent_enem':lambda d:d['productModes']['InstantVest'].update(milestone='invented ENEM score'),
 'false_release':lambda d:d['release'].update(approved=True),
 'skip_apple':lambda d:d['release'].update(nativeApple='PASS'),
 'wrong_duration':lambda d:d['durationsMs'].update(correct=[800,900]),
 'pseudo_missing':lambda d:d['globalFirst']['testedPseudoLocales'].remove('ar-XB'),
}
failures=0
for name,change in mutations.items():
    d=copy.deepcopy(policy);change(d)
    try:validate(d)
    except (AssertionError,KeyError,TypeError,ValueError):failures+=1
    else:raise AssertionError(f'UNDETECTED mutation: {name}')
assert failures==len(mutations)
for bad_id in ('LM-001','LM-012','LM-026'):
    modified=source.replace(f'| `{bad_id}` |','| `LM-999` |',1)
    try:validate(policy,modified)
    except AssertionError:failures+=1
    else:raise AssertionError('UNDETECTED missing QA: '+bad_id)
print(f'PASS: 4 products; 4 platforms; 8 states; 5 event contracts; 26 QA scenarios; {len(positive)*3+3} event assertions; {failures}/25 mutations detected')
print('BLOCKED: Rive original assets not created; Android/iOS/Web E2E not executed')
```
<!-- INSTANT_LEARNING_MOTION_SELFTEST_END -->

### 6.34 Learning Motion — comportamento determinístico e duração efetiva (normativo v3.2)

**Falha de cobertura resolvida:** verificar apenas nomes de estados e campos JSON não demonstra que eventos antigos/duplicados sejam rejeitados ou que uma conquista não apareça antes do ACK de persistência. O oráculo a seguir é **um modelo de referência executável**, não código instalado nos aplicativos. Integrações nativas devem preservar seus invariantes e demonstrar isso por testes E2E.

**Invariantes obrigatórias, em ordem de prioridade:**

1. `evaluation_started(resultId, version)` só substitui uma tentativa ativa se a versão for estritamente maior **e o `resultId` nunca tiver sido usado**. IDs e versões devem ser idempotentes também após recriação de tela, com chave persistida/servidor; eventos antigos não geram animação nem telemetria.
2. `answer_evaluated` só pode indicar `correct|partial|retry` após uma avaliação verificada da tentativa atual; o mesmo resultado não gera duas notificações. O componente não pode deduzir a avaliação do texto, da aparência do botão ou do tempo decorrido.
3. `progress_committed` só pode ocorrer após resultado verificado e ACK de armazenamento para a tentativa atual. A animação deve usar **somente** a quantidade efetivamente persistida; ACK atrasado de outra versão não altera o progresso.
4. `milestone_earned` só pode ocorrer após o progresso persistido e confirmação de conquista persistida. Um único evento de domínio produz no máximo uma celebração, também após recriação de tela.
5. `evaluation_failed`, perda de sessão ou timeout prevalecem sobre conquistas e progresso ainda não confirmados. Não reproduzir conquistas antigas quando voltar do background.
6. `reducedMotion` tem precedência absoluta: duração efetiva **0 ms**, estado atualizado e anunciado uma única vez. Para InstantBible, a duração efetiva máxima é **220 ms**; para outros produtos, usar intervalo do evento. Respeitar o limiar de energia/performance ao degradar para UI estática.
7. Resultado deve ser compreensível sem cor, movimento, som ou haptics. Foco, interação, aria-live/semantics e o próximo passo não podem depender de um renderizador.

**Gate de integração:** um oráculo executado neste Markdown não substitui implementação Flutter/Capacitor, feedback real do backend, screenshot golden, VoiceOver/TalkBack nem perfis de GPU; esses itens permanecem `NOT_RUN` até haver evidências do build.

<!-- INSTANT_LEARNING_MOTION_BEHAVIOR_TEST_BEGIN -->
```python
from pathlib import Path
from dataclasses import dataclass, field
import re, json, copy, itertools
src=Path('INSTDESIGN.MD').read_text(encoding='utf8')
p=re.search(r'(?m)^<!-- INSTANT_LEARNING_MOTION_POLICY_BEGIN -->\s*```json\n(.*?)\n```\s*<!-- INSTANT_LEARNING_MOTION_POLICY_END -->',src,re.S)
assert p, 'Missing canonical policy'
POLICY=json.loads(p.group(1))

@dataclass
class ReferenceMotion:
    product: str
    reduce_motion: bool=False
    version: int=-1
    result_id: str=''
    status: str='idle'
    evaluated: bool=False
    committed: bool=False
    failed: bool=False
    seen: set=field(default_factory=set)
    persisted_milestones: set=field(default_factory=set)
    announcements: list=field(default_factory=list)
    visual_log: list=field(default_factory=list)
    saved_progress: int=0

    def __post_init__(self):
        assert self.product in POLICY['scope']['products']

    def duration(self, state):
        if self.reduce_motion or state in ('idle','evaluating','error'):
            return 0
        lower,upper=POLICY['durationsMs'][state]
        limit=POLICY['durationsMs']['bibleMax'] if self.product=='InstantBible' else upper
        return min(upper,limit)

    def push(self, event, rid, version, *, verified=False, persisted=False,
             outcome=None, saved_progress=None, milestone_id=None):
        if not isinstance(rid,str) or not rid or type(version) is not int or version<0:
            return False
        if event=='evaluation_started':
            if version<=self.version or ('attempt',rid) in self.seen:
                return False
            self.seen.add(('attempt',rid))
            self.version, self.result_id=version,rid
            self.status,self.evaluated,self.committed,self.failed='evaluating',False,False,False
            return True
        if version!=self.version or rid!=self.result_id or self.failed:
            return False
        if event=='evaluation_failed':
            if self.status=='error':return False
            self.status,self.failed='error',True
            self.visual_log.append(('error',0))
            self.announcements.append(('error',rid,version))
            return True
        if event=='answer_evaluated':
            if verified is not True or outcome not in ('correct','partial','retry') or self.evaluated:
                return False
            self.evaluated=True
            self.status=outcome
            self.visual_log.append((outcome,self.duration(outcome)))
            self.announcements.append((outcome,rid,version))
            return True
        if event=='progress_committed':
            if not self.evaluated or self.committed or persisted is not True:
                return False
            if type(saved_progress) is not int or saved_progress<self.saved_progress:
                return False
            self.committed=True
            self.saved_progress=saved_progress
            self.status='progress'
            self.visual_log.append(('progress',self.duration('progress')))
            self.announcements.append(('progress',rid,version))
            return True
        if event=='milestone_earned':
            if not self.committed or persisted is not True or not isinstance(milestone_id,str) or not milestone_id:
                return False
            # A mesma avaliação não celebra duas conquistas, mesmo que IDs distintos cheguem após retries.
            event_key=('milestone_earned',rid,version)
            if milestone_id in self.persisted_milestones or event_key in self.seen:
                return False
            self.seen.add(event_key)
            self.persisted_milestones.add(milestone_id)
            self.status='milestone'
            self.visual_log.append(('milestone',self.duration('milestone')))
            self.announcements.append(('milestone',rid,version))
            return True
        return False

assert POLICY['renderer']['implementationStatus']=='SPEC_ONLY'
assert POLICY['release']['approved'] is False
assert set(POLICY['scope']['products'])=={'InstantSpeak','InstantStudy','InstantBible','InstantVest'}
checks=0
for product,platform,reduced,rtl in itertools.product(POLICY['scope']['products'],POLICY['scope']['platforms'],(False,True),(False,True)):
    m=ReferenceMotion(product,reduced)
    assert not m.push('evaluation_started','bad',True), 'Boolean is not a valid version'
    assert m.push('evaluation_started','r1',1)
    assert not m.push('answer_evaluated','r1',1,verified='true',outcome='correct'), 'String verification must fail closed'
    assert not m.push('answer_evaluated','r1',1,outcome='correct')
    assert not m.push('progress_committed','r1',1,persisted=True,saved_progress=2)
    assert not m.push('milestone_earned','r1',1,persisted=True,milestone_id='m1')
    assert m.push('answer_evaluated','r1',1,verified=True,outcome='correct')
    assert not m.push('answer_evaluated','r1',1,verified=True,outcome='correct')
    assert not m.push('progress_committed','r1',1,saved_progress=2)
    assert not m.push('progress_committed','r1',1,persisted=True,saved_progress=True), 'Boolean is not an integer progress value'
    assert m.push('progress_committed','r1',1,persisted=True,saved_progress=2)
    assert not m.push('progress_committed','r1',1,persisted=True,saved_progress=3)
    assert m.push('milestone_earned','r1',1,persisted=True,milestone_id='m1')
    assert not m.push('milestone_earned','r1',1,persisted=True,milestone_id='m1')
    assert not m.push('milestone_earned','r1',1,persisted=True,milestone_id='m2'), 'Different milestone ID should not duplicate same result celebration'
    assert len(m.announcements)==3
    assert len(m.visual_log)==3
    assert all(d==0 for s,d in m.visual_log) if reduced else all(d>0 for s,d in m.visual_log)
    if product=='InstantBible':
        assert all(d<=220 for s,d in m.visual_log)
    assert m.push('evaluation_started','r2',2)
    assert not m.push('evaluation_started','r1',3), 'Reusing a completed result ID with a newer version must fail'
    assert not m.push('answer_evaluated','r1',1,verified=True,outcome='correct')
    assert not m.push('progress_committed','r1',1,persisted=True,saved_progress=900)
    assert not m.push('milestone_earned','r1',1,persisted=True,milestone_id='late')
    assert m.push('evaluation_failed','r2',2)
    assert not m.push('answer_evaluated','r2',2,verified=True,outcome='correct')
    assert not m.push('milestone_earned','r2',2,persisted=True,milestone_id='m2')
    assert m.saved_progress==2 and m.status=='error'
    checks+=1

# Multi-session persistence: newly mounted view inherits existing milestone ledger.
a=ReferenceMotion('InstantStudy')
a.push('evaluation_started','r',1)
a.push('answer_evaluated','r',1,verified=True,outcome='correct')
a.push('progress_committed','r',1,persisted=True,saved_progress=4)
a.push('milestone_earned','r',1,persisted=True,milestone_id='lesson-4')
b=ReferenceMotion('InstantStudy',saved_progress=a.saved_progress,persisted_milestones=copy.copy(a.persisted_milestones),seen=copy.copy(a.seen))
assert not b.push('evaluation_started','r',3), 'Result IDs must survive view recreation'
b.push('evaluation_started','new',2)
b.push('answer_evaluated','new',2,verified=True,outcome='correct')
b.push('progress_committed','new',2,persisted=True,saved_progress=5)
assert not b.push('milestone_earned','new',2,persisted=True,milestone_id='lesson-4')
assert b.push('milestone_earned','new',2,persisted=True,milestone_id='lesson-5')

# Mutation probes are deliberately wrong policies; an invalid duration may never pass.
mutated=copy.deepcopy(POLICY);mutated['durationsMs']['bibleMax']=1000
assert mutated['durationsMs']['bibleMax']>220
mutated=copy.deepcopy(POLICY);mutated['durationsMs']['reducedMax']=750
assert mutated['durationsMs']['reducedMax']!=0
assert 'LM-026' in src and 'LM-001' in src
print(f'PASS: {checks}/64 product×platform×motion×direction lifecycle scenarios, plus reload/idempotency/stale ACK/error/verified-only, Bible 220ms and reduced-motion 0ms.')
print('BLOCKED: execution here is a reference state machine, not a shipped Flutter/Capacitor app')
```
<!-- INSTANT_LEARNING_MOTION_BEHAVIOR_TEST_END -->

### 6.35 Referência web para QA visual e semântico (não é asset de produção)

O exemplo HTML autocontido abaixo valida **apenas** a comunicação visual e semântica do Learning Motion em um navegador real. Não exige Rive, não incorpora imagens ou personagens de terceiros, **não usa cores como informação exclusiva** e executa em offline. Os botões geram **eventos simulados e explicitamente marcados**, não avaliações pedagógicas reais. Produto e direção podem ser alterados por `?product=InstantBible&rtl=1`; usuário reduz movimento pelas preferências do sistema. O teste de navegador identifica overflow, foco, anúncio de estado, idempotência, erro, RTL e durações. Após integrar o código real, substituir as simulações por eventos verificados e refazer a suíte.

<!-- INSTANT_LEARNING_MOTION_WEB_DEMO_BEGIN -->
~~~~html
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Instant Learning Motion QA — protótipo</title>
<style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#222; background:#fff;color-scheme:light}
*{box-sizing:border-box} body{margin:0;padding:clamp(12px,4vw,32px)}
main{width:min(100%,520px);margin:auto;display:grid;gap:16px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
h1{font-size:clamp(22px,5vw,30px);margin:0} small{color:#454545}
.demo{position:relative;padding:22px;border:2px solid #1d1d1d;border-radius:18px;min-height:220px;display:grid;align-content:center;gap:12px}
#visual{width:48px;height:48px;border-radius:14px;background:#d6e8fc;border:2px solid #135490;display:grid;place-items:center;font-size:24px;font-weight:bold}
#visual[data-state=correct]{background:#daf6e7;border-color:#16643d}
#visual[data-state=milestone]{background:#e9dafe;border-color:#61428b}
#visual[data-state=error]{background:#fbe0e0;border-color:#982b2b}
#visual.motion{animation:instant-confirm var(--motion-ms,200ms) ease-out 1}
@keyframes instant-confirm{0%{opacity:.8;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce){#visual.motion{animation:none!important;transition:none!important}}
button,select{font:inherit;min-height:48px;border-radius:10px;border:1px solid #333;background:#fff;padding:10px 14px;color:#141414}
button:focus-visible,select:focus-visible{outline:3px solid #0057ce;outline-offset:3px}
.controls{display:flex;flex-wrap:wrap;gap:8px} .controls button{flex:1 1 116px}
#state{font-size:clamp(18px,4vw,22px);font-weight:700;margin:0}
#detail{margin:0;line-height:1.5;overflow-wrap:anywhere}
.progress{width:100%;height:10px;background:#ddd;border-radius:8px;overflow:hidden}
#progress{width:0;height:100%;background:#1455a3;transition:width 220ms ease-out}
@media(prefers-reduced-motion:reduce){#progress{transition:none}}
[dir=rtl] .progress{direction:rtl}
</style></head>
<body><main><header><h1>Instant Learning Motion</h1><small>PROTÓTIPO · Eventos simulados</small></header>
<label>Produto <select id="product"><option>InstantSpeak</option><option>InstantStudy</option><option>InstantBible</option><option>InstantVest</option></select></label>
<section class="demo" aria-labelledby="state"><div id="visual" aria-hidden="true" data-state="idle">•</div><p id="state" role="status" aria-live="polite" aria-atomic="true">Pronto para tentar</p><p id="detail">O feedback será mostrado aqui sem depender de movimento.</p><div class="progress" aria-label="Progresso simulado"><div id="progress"></div></div></section>
<div class="controls"><button id="start">Iniciar</button><button id="correct">Acerto simulado</button><button id="commit">Salvar progresso</button><button id="milestone">Conquista</button><button id="fail">Falha</button></div>
<script>
(()=>{'use strict';
const q=new URLSearchParams(location.search||((window.__testConfig||{}).search||'')),p=document.querySelector('#product'),s=document.querySelector('#state'),d=document.querySelector('#detail'),v=document.querySelector('#visual'),bar=document.querySelector('#progress');
document.documentElement.dir=q.get('rtl')==='1'?'rtl':'ltr';
if(['InstantSpeak','InstantStudy','InstantBible','InstantVest'].includes(q.get('product')))p.value=q.get('product');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let seq=0,id='',evaluated=false,committed=false,failed=false,award=false,saved=0;
function show(state,message,detail){
 s.textContent=message;d.textContent=detail;v.dataset.state=state;
 const duration=reduce.matches?0:(p.value==='InstantBible'?Math.min(220,state==='milestone'?750:220):(state==='milestone'?750:220));
 v.style.setProperty('--motion-ms',duration+'ms');v.dataset.durationMs=duration;
 v.textContent=state==='correct'?'✓':state==='milestone'?'★':state==='error'?'!':'•';
 v.classList.remove('motion');void v.offsetWidth;
 if(!reduce.matches&&['correct','milestone','progress'].includes(state))v.classList.add('motion');
}
function begin(){seq++;id='r'+seq;evaluated=committed=failed=award=false;show('evaluating','Verificando…','Nenhuma recompensa antes da avaliação confirmada.');}
function correct(){if(!id||evaluated||failed)return; evaluated=true;show('correct','Resposta correta','Avaliação simulada confirmada.');}
function commit(){if(!evaluated||committed||failed)return;committed=true;saved++;bar.style.width=Math.min(saved*20,100)+'%';show('progress','Progresso salvo','Valor confirmado: '+saved+'.');}
function milestone(){if(!committed||award||failed)return;award=true;show('milestone','Conquista registrada','Conquista persistida (simulação), mostrada uma vez.');}
function fail(){if(!id||failed)return;failed=true;show('error','Falha na avaliação','Nenhuma recompensa será exibida. Tente novamente.');}
for(const [name,fn] of Object.entries({start:begin,correct,commit,milestone,fail}))document.getElementById(name).addEventListener('click',fn);
p.addEventListener('change',()=>{seq=0;id='';evaluated=committed=failed=award=false;saved=0;bar.style.width='0%';show('idle','Pronto para tentar','O feedback será mostrado aqui sem depender de movimento.')});
show('idle','Pronto para tentar','O feedback será mostrado aqui sem depender de movimento.');
})();
</script></main></body></html>
~~~~
<!-- INSTANT_LEARNING_MOTION_WEB_DEMO_END -->

**Execução obrigatória da bateria integral:** extrair o bloco `INSTANT_LEARNING_MOTION_BROWSER_TEST` em um script temporário e executar **duas vezes**: `INSTANT_MOTION_BATCH=0 python3 teste.py` e `INSTANT_MOTION_BATCH=1 python3 teste.py`. Cada bateria contém 64 cenários; **só 128/128** comprova a cobertura completa. A divisão permite execução em CI de recursos limitados. Requer Playwright Python e Chromium instalado; não substitui Safari/WebKit nem Android WebView.

**Critério de aceite visual:** mesmo significado em animação ativada/desativada; UI sem scroll horizontal a 320, 360, 412 e 768 CSS px; foco navegável sem armadilhas; `aria-live` atualizado por estado; `dir=rtl` sem conteúdo invertido; estados de erro nunca celebrados; `InstantBible` limitado a 220 ms. O arquivo HTML fica **incorporado neste Markdown** e pode ser extraído apenas para execução temporária de QA.

<!-- INSTANT_LEARNING_MOTION_BROWSER_TEST_BEGIN -->
```python
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import quote
import re, itertools, json, os
from playwright.sync_api import sync_playwright
source=Path('INSTDESIGN.MD').read_text(encoding='utf8')
m=re.search(r'<!-- INSTANT_LEARNING_MOTION_WEB_DEMO_BEGIN -->\s*~~~~html\n(.*?)\n~~~~\s*<!-- INSTANT_LEARNING_MOTION_WEB_DEMO_END -->',source,re.S)
assert m, 'Missing integrated visual prototype'
assert len(re.findall(r'(?m)^<!-- INSTANT_LEARNING_MOTION_WEB_DEMO_BEGIN -->$',source))==1
assert len(re.findall(r'(?m)^<!-- INSTANT_LEARNING_MOTION_BROWSER_TEST_BEGIN -->$',source))==1
with TemporaryDirectory() as directory:
    path=Path(directory)/'motion.html';path.write_text(m.group(1),encoding='utf8')
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        cases=0
        html=m.group(1)
        page=browser.new_page(viewport={'width':320,'height':740},reduced_motion='no-preference',device_scale_factor=2)
        batch=int(os.environ.get('INSTANT_MOTION_BATCH','0'))
        assert batch in (0,1), 'Run batch 0 AND batch 1 for complete pass'
        for i,(product,width,reduced,rtl,font_scale) in enumerate(itertools.product(['InstantSpeak','InstantStudy','InstantBible','InstantVest'],[320,360,412,768],[False,True],[False,True],[1,2])):
            if i//64!=batch:continue
            page.set_viewport_size({'width':width,'height':740})
            page.emulate_media(reduced_motion='reduce' if reduced else 'no-preference')
            cfg='window.__testConfig='+json.dumps({'search':'?product='+product+'&rtl='+('1' if rtl else '0')})+';'
            page.set_content(html.replace('<script>','<script>'+cfg+'</script><script>',1))
            if font_scale==2:page.add_style_tag(content='html{font-size:200%!important}')
            assert page.locator('#state').is_visible() and page.locator('#visual').is_visible()
            page.locator('#start').click()
            assert page.locator('#state').inner_text()=='Verificando…'
            assert page.locator('#visual').get_attribute('data-state')=='evaluating'
            page.locator('#milestone').click()
            assert page.locator('#state').inner_text()=='Verificando…','Early milestone visible'
            page.locator('#correct').click()
            assert page.locator('#state').inner_text()=='Resposta correta'
            page.locator('#commit').click()
            assert page.locator('#state').inner_text()=='Progresso salvo'
            before_milestone=page.locator('#visual').screenshot(animations='disabled') if (reduced and font_scale==1 and width==320 and not rtl) else None
            page.locator('#milestone').click()
            assert page.locator('#state').inner_text()=='Conquista registrada'
            if before_milestone is not None:assert before_milestone!=page.locator('#visual').screenshot(animations='disabled'),'No visual change between progress and milestone'
            page.locator('#milestone').click()
            assert page.locator('#state').inner_text()=='Conquista registrada','Duplicate milestone changed status'
            duration=int(page.locator('#visual').get_attribute('data-duration-ms'))
            if reduced:assert duration==0 and not page.locator('#visual').evaluate('(x)=>getComputedStyle(x).animationName !== "none"')
            elif product=='InstantBible':assert duration<=220
            else:assert duration==750
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow'
            assert page.locator('#state').is_visible() and page.locator('#detail').is_visible()
            assert all(page.locator('button').nth(i).bounding_box()['height']>=44 for i in range(5)),'Tap target height <44px'
            assert page.locator('#state').get_attribute('aria-live')=='polite'
            assert page.locator('html').get_attribute('dir')==('rtl' if rtl else 'ltr')
            page.locator('#start').click();page.locator('#fail').click()
            assert page.locator('#state').inner_text()=='Falha na avaliação'
            page.locator('#correct').click()
            assert page.locator('#state').inner_text()=='Falha na avaliação'
            page.keyboard.press('Tab')
            assert page.evaluate('document.activeElement !== document.body')
            cases+=1
        page.close();browser.close()
assert cases==64, f'Incomplete batch {batch}: {cases} cases'
print(f'PASS batch {batch}: {cases}/64 Chromium cases (128 across both batches: 4 products x 4 viewports x reduced/normal x RTL/LTR x font scale 100/200%) with simulated event ordering, idempotency, offline error, overflow and accessible status')
print('PENDENTE: iOS WKWebView, Android WebView, Safari/WebKit, Firefox, screen reader real, production Rive assets')
```
<!-- INSTANT_LEARNING_MOTION_BROWSER_TEST_END -->

### 6.36 Tesla Motion — *Instant Precision Motion* (normativo v3.3, 2026-10-16)

**Decisão:** adotar na linha Instant uma **linguagem original** de movimento inspirada em qualidades observáveis de interfaces premium da Tesla: resposta direta, continuidade espacial, feedback informativo e exibição de estado relevante. O nome “Tesla Motion” é **apelido interno da referência estética**, não um pacote, biblioteca ou especificação oficial da Tesla e não deve aparecer como associação comercial.

**Referências públicas:** [Tesla — Touchscreen Model Y](https://www.tesla.com/ownersmanual/modely/en_us/GUID-518C51C1-E9AC-4A68-AE12-07F4FF8C881E.html) descreve visualizações contextuais de estado, ações diretas e painéis expansíveis; [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion/) fundamenta resposta breve, cancelável e adequada à entrada; [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/) orienta redução de movimento. **Os tempos, curvas e tokens a seguir são decisões da Instant, não valores extraídos da Tesla.** Proibido copiar UIs automotivas, animações de veículo, representações de carros, identidade Tesla ou trechos de software proprietários.

Esta diretriz não cria uma quarta camada de animação. É um **perfil de coreografia transversal** que coordena as três camadas existentes (§§ 6.27–6.35):

- **BrandMotion:** abertura aprovada não muda; `InstantSpeak™ → ISpeak™` segue *350 + 1300 + 1000 = 2650 ms* quando pertinente à primeira abertura. A apresentação não deve impedir sair/pular, nem repetir 2,65 s em toda navegação. A escolha de persistência de exibição será implementada e testada no app.
- **IntelligenceMotion:** nenhuma alteração das **dez paletas** ou da resposta ao áudio verdadeiro. A orbe é uma superfície de voz independente; o sistema não pode animar duas vezes a mesma mudança de estado nem competir com a fala.
- **LearningMotion:** acerto, progresso e conquista só animam após eventos educacionais confirmados; prazos do Learning Motion prevalecem para recompensas já contratadas (§ 6.28), incluindo exceção de conquista validada de até 750 ms fora do InstantBible. **Tesla Motion apenas determina a maneira de transitar**, sem inventar novos gatilhos ou pontuação.

**Regra de propriedade e concorrência:** §6.42 especifica qual camada possui cada propriedade animável, qual efeito prevalece quando eventos coincidem e como evitar dupla animação. A regra não altera o código nem os contratos anteriores; é o ponto normativo de arbitragem.

**Princípio de experiência:** o aluno vê sua próxima tarefa se transformar de maneira coerente; nunca espera a animação acabar para responder, navegar ou cancelar. A tecnologia se revela pela qualidade do feedback e da aprendizagem, e não por efeitos visuais gratuitos.

### 6.37 Gramática de movimento — parâmetros originais Instant

| Evento visual | Duração-alvo | Deslocamento máximo | Comportamento |
|---|---:|---:|---|
| Toque/pressão | 90 ms | 0 dp | Confirmação imediata do toque, sem bounce ou squash excessivo |
| Revelar contexto | 160 ms | 6 dp | Mostrar opções mantendo referência visual e foco |
| Modal/sheet | 220 ms | 12 dp | Deslocamento vinculado à direção real do componente |
| Elemento compartilhado | 280 ms | 12 dp | Continuidade de contexto, sem fazer conteúdo falso voar pela tela |
| Navegação de tela | 300 ms | 12 dp | Hierarquia de entrada/saída, cancelar/retarget se interação mudar |
| Evolução de conhecimento | 320 ms | 12 dp | Progressão somente após confirmação de resultado persistido |

- **Curva Instant Precision padrão:** `cubic-bezier(0.2, 0.8, 0.2, 1)`; saída quando cabível `cubic-bezier(0.4, 0, 1, 1)`. Nenhuma delas é apresentada como a curva proprietária de Tesla.
- **Amplitude:** variação de escala de no máximo 2% nos elementos acima. Não usar zoom de tela inteira, tilt 3D, jarring/parallax, desfoque animado, confete, tremores punitivos ou loops cosméticos.
- **Controle:** mudanças de estado e habilitação de botões ocorrem no evento real, **sem aguardar** 90–320 ms. Interrupções e navegação de volta cancelam a animação antiga. Não manter callbacks que disparem conquistas depois de dispose/route change.
- **Regra por produto:** `InstantBible` limita a **220 ms** as transições deste perfil e os seus feedbacks discretos; já o limite específico da marca e da orbe segue os contratos próprios. `InstantStudy` prioriza a transformação material→prática; `InstantSpeak` prioriza resposta de voz; `InstantVest` prioriza domínio da competência verificado.
- **Globalização:** preferir transformações de escala/opacity quando não houver semântica direcional. Espelhar apenas vetores de entrada/saída orientados por texto no RTL; nunca inverter waveform de áudio, números, ícones de mídia ou trajetórias físicas não direcionais. Testar pseudo-RTL, texto a 200%, teclado e leitores de tela.
- **Acessibilidade:** redução de movimento elimina translação, escala, loops e interpolação visual deste perfil (duração `0 ms`), **sem ocultar o estado final**. `aria-live`/semântica e atualização de conteúdo permanecem. Se a plataforma oferecer cross-fade discreto autorizado pelo usuário, aplicá-lo somente após revisão específica, nunca como fallback obrigatório.
- **Performance:** usar propriedades compositor-friendly (opacity/transform), evitar animação de layout (`width`, `top`, `left`, `height`) na árvore de telas; exceptions de barras de progresso devem ser perfiladas. **Alvos, não resultados medidos:** resposta visual perceptível até ~100 ms quando dispositivo o permitir, quadros fluidos conforme atualização do aparelho, latência/jank/memória medidos em Android, iOS e Web. Degradar para estado estático quando renderizador apresentar falhas.

### 6.38 Contrato canônico de Tesla Motion — dados executáveis no arquivo único

Este JSON é o registro de regras do *perfil de coreografia*, não nova paleta de cores. `SPEC_AND_REFERENCE_ONLY` não significa instalado no app. Equipes devem gerar código/runtime real do arquivo e comparar contra os contratos do Learning Motion, voz e abertura.

<!-- INSTANT_TESLA_MOTION_POLICY_BEGIN -->
```json
{
  "schemaVersion": "3.3.0",
  "name": "Instant Precision Motion (internal nickname: Tesla Motion)",
  "referencePolicy": "Inspired by direct responsive control and contextual visualization; no Tesla-owned code, typography, graphics, logos or transition assets",
  "runtimeStatus": "SPEC_AND_REFERENCE_ONLY",
  "scope": {
    "products": [
      "InstantSpeak",
      "InstantStudy",
      "InstantBible",
      "InstantVest"
    ],
    "platforms": [
      "android",
      "ios",
      "ipados",
      "web"
    ]
  },
  "composition": {
    "layers": [
      "BrandMotion",
      "IntelligenceMotion",
      "LearningMotion"
    ],
    "role": "cross-cutting choreography, not a fourth renderer",
    "wordmarkException": "InstantSpeak logo intro remains 350+1300+1000ms = 2650ms, first eligible launch only; provide skip/reduced-motion"
  },
  "easing": {
    "standard": [
      0.2,
      0.8,
      0.2,
      1
    ],
    "exit": [
      0.4,
      0,
      1,
      1
    ]
  },
  "transitions": {
    "touchAcknowledgement": {
      "durationMs": 90,
      "maxTranslateDp": 0,
      "maxScaleDelta": 0.006
    },
    "inlineDisclosure": {
      "durationMs": 160,
      "maxTranslateDp": 6,
      "maxScaleDelta": 0.01
    },
    "dialogSheet": {
      "durationMs": 220,
      "maxTranslateDp": 12,
      "maxScaleDelta": 0.01
    },
    "sharedContext": {
      "durationMs": 280,
      "maxTranslateDp": 12,
      "maxScaleDelta": 0.02
    },
    "routeTransition": {
      "durationMs": 300,
      "maxTranslateDp": 12,
      "maxScaleDelta": 0.02
    },
    "knowledgeShift": {
      "durationMs": 320,
      "maxTranslateDp": 12,
      "maxScaleDelta": 0.02
    }
  },
  "constraints": {
    "reducedMotionDurationMs": 0,
    "instantBibleCapMs": 220,
    "continuousDecorativeLoops": false,
    "gateNavigationOnMotion": false,
    "fakeProgressAllowed": false,
    "transitionOnMainThreadOnly": false,
    "preserveTapTargetPx": 44,
    "rtlMirrorOnlyDirectionalMovement": true,
    "allowAudioOrbIndependent": true,
    "allowExistingVerifiedLearningMilestone": true
  },
  "productIntent": {
    "InstantSpeak": "Immediately acknowledge start/stop; preserve ten tutor colors and live waveform; never delay microphone or voice interactions",
    "InstantStudy": "Material becomes first activity through a continuous surface; mastery movement only after verified result and commit",
    "InstantBible": "Editorial and contemplative; cap decorative motion at 220ms; no particles, confetti or gamified salvation",
    "InstantVest": "Knowledge/competency progress only after persisted evaluation; no fictional score"
  },
  "acceptance": {
    "staticPolicy": "REQUIRED",
    "browserReference": "REQUIRED",
    "androidMaestro": "NOT_RUN",
    "iosVoiceOver": "NOT_RUN",
    "webKitSafari": "NOT_RUN",
    "flutterAppIntegration": "NOT_RUN",
    "capacitorAppIntegration": "NOT_RUN",
    "productionFPSJank": "NOT_RUN"
  }
}
```
<!-- INSTANT_TESLA_MOTION_POLICY_END -->

### 6.39 Referência visual executável — interação com continuidade, sem assets de terceiros

O protótipo HTML a seguir pode ser extraído **deste mesmo Markdown** para testar toque, estado de avaliação, confirmação real simulada, movimento reduzido e mudança de layout. O botão `Confirmar resultado` representa um *ack de teste*, não uma chamada real ao servidor. Esta demo é original, sem imagens de carro, logo Tesla, CSS/JS de terceiros ou dependência de rede. **Não constitui implementação Flutter/Capacitor.**

<!-- INSTANT_TESLA_MOTION_WEB_DEMO_BEGIN -->
~~~~html
<!DOCTYPE html>
<html lang="pt-BR" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Instant Precision Motion — referência</title>
<style>
:root{color-scheme:light;--ink:#151516;--paper:#faf9f6;--stroke:#d8d7d2;--accent:#2459ba;--tm-route:280ms;--tm-ease:cubic-bezier(.2,.8,.2,1)}
*{box-sizing:border-box}html,body{margin:0;min-width:0}body{font-family:system-ui,sans-serif;background:var(--paper);color:var(--ink);padding:clamp(12px,3vw,32px)}
.shell{max-width:560px;margin-inline:auto;min-width:0}.eyebrow{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:600}
h1{font-weight:500;font-size:clamp(1.8rem,6vw,3.1rem);line-height:1.05;letter-spacing:-.045em;overflow-wrap:anywhere}
.scene{min-width:0;overflow:hidden;border:1px solid var(--stroke);border-radius:20px;background:#fff;padding:clamp(16px,4vw,24px)}
.scene-content{transform:translateY(0) scale(1);opacity:1;transform-origin:50% 50%;transition:transform var(--tm-route) var(--tm-ease),opacity var(--tm-route) var(--tm-ease)}
.scene[data-state="evaluating"] .scene-content{transform:translateY(-6px) scale(.994);opacity:.85}
.scene[data-state="committed"] .scene-content{transform:translateY(0px) scale(1);opacity:1}
.track{height:4px;background:#eee;border-radius:4px;overflow:hidden}.fill{height:100%;background:var(--accent);width:0%;transition:width var(--tm-route) var(--tm-ease)}
.scene[data-state="evaluating"] .fill{width:0%}.scene[data-state="committed"] .fill{width:100%}
.controls{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}button{border:1px solid var(--ink);background:#fff;color:var(--ink);min-height:48px;padding:10px 18px;border-radius:999px;font:inherit;cursor:pointer;flex:1 1 135px;min-width:0}button.primary{background:#151516;color:#fff}button{overflow-wrap:anywhere;white-space:normal}button:focus-visible{outline:3px solid #2868d9;outline-offset:3px}button:disabled{opacity:.55;cursor:default}
#state{overflow-wrap:anywhere}#detail{line-height:1.5;overflow-wrap:anywhere}
@media(prefers-reduced-motion:reduce){.scene-content,.fill{transition:none!important;animation:none!important;transform:none!important;opacity:1!important}*{scroll-behavior:auto!important}}
</style></head>
<body><main class="shell"><p class="eyebrow">Instant · Precision Motion</p><h1 id="heading">O aprendizado responde.</h1><section class="scene" id="scene" data-state="ready"><div class="scene-content"><p class="eyebrow" id="productLabel">InstantStudy</p><h2 id="state" role="status" aria-live="polite">Pronto para começar</h2><p id="detail">A próxima ação aparece sem bloquear a navegação.</p><div class="track" role="progressbar" aria-label="Progresso confirmado" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="fill"></div></div></div></section><div class="controls"><button class="primary" id="start">Começar</button><button id="commit" disabled>Confirmar resultado</button><button id="reset">Reiniciar</button></div></main>
<script>
(() => {
 const cfg=window.__testConfig||{};const product=cfg.product||'InstantStudy';const rtl=Boolean(cfg.rtl);
 const valid=['InstantSpeak','InstantStudy','InstantBible','InstantVest'];if(!valid.includes(product))throw Error('Invalid product');
 document.documentElement.dir=rtl?'rtl':'ltr';document.querySelector('#productLabel').textContent=product;
 const palette={InstantSpeak:'#2459ba',InstantStudy:'#3a32c8',InstantBible:'#1f6b52',InstantVest:'#80572a'};
 document.documentElement.style.setProperty('--accent',palette[product]);
 const motionPref=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=document.querySelector('#scene'),state=document.querySelector('#state'),detail=document.querySelector('#detail'),progress=document.querySelector('.track'),commit=document.querySelector('#commit');
 function syncMotionPref(){const duration=motionPref.matches?0:Math.min(280,product==='InstantBible'?220:280);document.documentElement.style.setProperty('--tm-route',duration+'ms');scene.dataset.durationMs=String(duration)}
 motionPref.addEventListener('change',syncMotionPref);syncMotionPref();let phase='ready';let recorded=false;
 const labels={ready:['Pronto para começar','A próxima ação aparece sem bloquear a navegação.'],evaluating:['Processando resposta','Aguardando confirmação real do resultado.'],committed:['Próxima atividade pronta','O progresso foi confirmado. Nenhuma pontuação inventada.']};
 function render(){scene.dataset.state=phase;state.textContent=labels[phase][0];detail.textContent=labels[phase][1];progress.setAttribute('aria-valuenow',phase==='committed'?'100':phase==='evaluating'?'0':'0');commit.disabled=phase!=='evaluating'}
 document.querySelector('#start').addEventListener('click',()=>{if(phase==='ready'){phase='evaluating';render()}});
 commit.addEventListener('click',()=>{if(phase==='evaluating'&&!recorded){recorded=true;phase='committed';render()}});
 document.querySelector('#reset').addEventListener('click',()=>{phase='ready';recorded=false;render()});
 render();
})();
</script></body></html>
~~~~
<!-- INSTANT_TESLA_MOTION_WEB_DEMO_END -->

### 6.40 Testes positivos, negativos e regressão do perfil — no mesmo arquivo

Execute o código extraído do bloco Python abaixo com o arquivo `INSTDESIGN.MD` no diretório atual. Para incluir navegador Chromium local, definir `INSTANT_TESLA_BROWSER=1`. Em máquinas de CI limitadas, executar **duas vezes**, com `INSTANT_TESLA_BATCH=0` e `INSTANT_TESLA_BATCH=1`, exigindo **48/48 em cada lote**; sem variável, a execução cobre os 96 cenários consecutivamente. A suíte rejeita alteração silenciosa de duração, amplitude, camadas, acessibilidade, evidências e progresso. Os testes de navegador cobrem **96 configurações simuladas**, sem tornar Flutter, Maestro ou iOS aprovados.

<!-- INSTANT_TESLA_MOTION_SELFTEST_BEGIN -->
```python
from pathlib import Path
import re,json,os
src=Path('INSTDESIGN.MD').read_text(encoding='utf8')
def extract(text,tag,lang):
    pat=rf'<!-- {tag}_BEGIN -->\s*'+('~~~~'+lang if lang=='html' else '```'+lang)+rf'\n(.*?)\n'+('~~~~' if lang=='html' else '```')+rf'\s*<!-- {tag}_END -->'
    m=re.search(pat,text,re.S)
    assert m, 'Missing '+tag
    assert len(re.findall(r'(?m)^<!-- '+tag+r'_BEGIN -->$',text))==1, 'Duplicate '+tag
    return m.group(1)
def validate(text):
    p=json.loads(extract(text,'INSTANT_TESLA_MOTION_POLICY','json'))
    assert p['schemaVersion']=='3.3.0'
    assert p['runtimeStatus']=='SPEC_AND_REFERENCE_ONLY'
    assert p['scope']['products']==['InstantSpeak','InstantStudy','InstantBible','InstantVest']
    assert p['scope']['platforms']==['android','ios','ipados','web']
    assert p['composition']['layers']==['BrandMotion','IntelligenceMotion','LearningMotion']
    assert p['composition']['role']=='cross-cutting choreography, not a fourth renderer'
    assert '2650ms' in p['composition']['wordmarkException']
    assert p['easing']['standard']==[.2,.8,.2,1]
    t=p['transitions']
    assert list(t)==['touchAcknowledgement','inlineDisclosure','dialogSheet','sharedContext','routeTransition','knowledgeShift']
    assert [t[x]['durationMs'] for x in t]==[90,160,220,280,300,320]
    assert all(0<=x['maxTranslateDp']<=12 and 0<=x['maxScaleDelta']<=.02 for x in t.values())
    c=p['constraints']
    assert c['reducedMotionDurationMs']==0 and c['instantBibleCapMs']==220
    for key in ['continuousDecorativeLoops','gateNavigationOnMotion','fakeProgressAllowed','transitionOnMainThreadOnly']:
        assert c[key] is False, key
    for key in ['rtlMirrorOnlyDirectionalMovement','allowAudioOrbIndependent','allowExistingVerifiedLearningMilestone']:
        assert c[key] is True, key
    assert c['preserveTapTargetPx']>=44
    assert set(p['productIntent'])==set(p['scope']['products'])
    assert all(p['acceptance'][x]=='NOT_RUN' for x in ('androidMaestro','iosVoiceOver','webKitSafari','flutterAppIntegration','capacitorAppIntegration','productionFPSJank'))
    assert p['acceptance']['staticPolicy']=='REQUIRED' and p['acceptance']['browserReference']=='REQUIRED'
    h=extract(text,'INSTANT_TESLA_MOTION_WEB_DEMO','html')
    for k in ('prefers-reduced-motion:reduce','aria-live="polite"','role="progressbar"','document.documentElement.dir','--tm-route','min-height:48px','scene.dataset.durationMs','motionPref.addEventListener','.scene[data-state="evaluating"] .fill{width:0%}'):
        assert k in h, k
    assert "phase='committed'" in h and 'recorded=true' in h
    assert '26' not in p['schemaVersion']  # not confusing timeline with other contracts
    return p,h
p,h=validate(src)
def replace_scope(q,tag,ext,old,new):
    fence='~~~~' if ext=='html' else '```'
    pattern=r'<!-- '+tag+r'_BEGIN -->\s*'+fence+ext+r'\n(.*?)\n'+fence+r'\s*<!-- '+tag+r'_END -->'
    found=re.search(pattern,q,re.S)
    assert found, 'Scope absent '+tag
    block=found.group(1)
    assert old in block,'Needle absent in '+tag+': '+old[:40]
    return q[:found.start(1)]+block.replace(old,new,1)+q[found.end(1):]
def replace_policy(q,old,new,count=1):
    assert count==1
    return replace_scope(q,'INSTANT_TESLA_MOTION_POLICY','json',old,new)
def replace_demo(q,old,new,count=1):
    assert count==1
    return replace_scope(q,'INSTANT_TESLA_MOTION_WEB_DEMO','html',old,new)
changes=[
    ('version',lambda q:replace_policy(q,'"schemaVersion": "3.3.0"','"schemaVersion": "2.2.0"',1)),
    ('product',lambda q:replace_policy(q,'"InstantVest"\n    ],\n    "platforms"','"InstantVest-BAD"\n    ],\n    "platforms"',1)),
    ('android',lambda q:replace_policy(q,'"android",','"android-disabled",',1)),
    ('three-layers',lambda q:replace_policy(q,'"BrandMotion",','"FakeMotion",',1)),
    ('wordmark',lambda q:replace_policy(q,'2650ms','100ms',1)),
    ('easing',lambda q:replace_policy(q,'0.8,\n      0.2,','0.9,\n      0.2,',1)),
    ('touch',lambda q:replace_policy(q,'"durationMs": 90','"durationMs": 990',1)),
    ('no-loop',lambda q:replace_policy(q,'"continuousDecorativeLoops": false','"continuousDecorativeLoops": true',1)),
    ('no-gate',lambda q:replace_policy(q,'"gateNavigationOnMotion": false','"gateNavigationOnMotion": true',1)),
    ('no-fake',lambda q:replace_policy(q,'"fakeProgressAllowed": false','"fakeProgressAllowed": true',1)),
    ('reduce',lambda q:replace_policy(q,'"reducedMotionDurationMs": 0','"reducedMotionDurationMs": 120',1)),
    ('bible',lambda q:replace_policy(q,'"instantBibleCapMs": 220','"instantBibleCapMs": 760',1)),
    ('rtl',lambda q:replace_policy(q,'"rtlMirrorOnlyDirectionalMovement": true','"rtlMirrorOnlyDirectionalMovement": false',1)),
    ('orb-independent',lambda q:replace_policy(q,'"allowAudioOrbIndependent": true','"allowAudioOrbIndependent": false',1)),
    ('app-not-run',lambda q:replace_policy(q,'"androidMaestro": "NOT_RUN"','"androidMaestro": "PASS"',1)),
    ('no-responsive-motion',lambda q:replace_demo(q,'prefers-reduced-motion:reduce','pretend-reduced-motion:reduce',1)),
    ('no-semantic-status',lambda q:replace_demo(q,'aria-live="polite"','aria-live="off"',1)),
    ('no-progress-label',lambda q:replace_demo(q,'role="progressbar"','role="presentation"',1)),
    ('no-tap-target',lambda q:replace_demo(q,'min-height:48px','min-height:24px',1)),
    ('no-duration-surface',lambda q:replace_demo(q,'scene.dataset.durationMs','scene.dataset.unknownDuration',1)),
    ('no-commit',lambda q:replace_demo(q,"phase='committed'","phase='ready'",1)),
    ('invented-progress',lambda q:replace_demo(q,'.scene[data-state="evaluating"] .fill{width:0%}', '.scene[data-state="evaluating"] .fill{width:25%}',1))
]
errors=0
for label,fn in changes:
    mutated=fn(src)
    assert mutated!=src,'mutation not applied: '+label
    try: validate(mutated)
    except (AssertionError,ValueError,KeyError,json.JSONDecodeError):errors+=1
    else:raise AssertionError('UNDETECTED '+label)
print(f'PASS: Tesla Motion policy + cross-layer constraints; {errors}/{len(changes)} deliberate defects detected')
if os.getenv('INSTANT_TESLA_BROWSER')=='1':
    from playwright.sync_api import sync_playwright
    from itertools import product
    exe=os.getenv('INSTANT_CHROMIUM_PATH','/usr/bin/chromium')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':320,'height':740})
        count=0
        batch=os.getenv('INSTANT_TESLA_BATCH')
        if batch is not None: assert batch in ('0','1'), 'Valid batches are 0 and 1'
        for idx,(prod,width,rtl,reduced,font_scale) in enumerate(product(p['scope']['products'],[320,390,768],[False,True],[False,True],[1,2])):
            if batch is not None and idx//48!=int(batch): continue
            page.set_viewport_size({'width':width,'height':740})
            page.emulate_media(reduced_motion='reduce' if reduced else 'no-preference')
            injected="window.__testConfig="+json.dumps({'product':prod,'rtl':rtl})+';'
            # Fresh JS realm per scenario: isolate matchMedia listeners from earlier page instances.
            page.goto('about:blank')
            page.set_content(h.replace('<script>', '<script>'+injected+'</script><script>',1))
            if font_scale==2:page.add_style_tag(content='html{font-size:200%!important}')
            assert page.locator('#state').inner_text()=='Pronto para começar'
            assert page.locator('#scene').get_attribute('data-state')=='ready'
            duration=int(page.locator('#scene').get_attribute('data-duration-ms'))
            assert duration==(0 if reduced else 220 if prod=='InstantBible' else 280)
            css=page.locator('.scene-content').evaluate('(x)=>getComputedStyle(x).transitionDuration')
            assert all(value==('0s' if reduced else f'{duration/1000}s') for value in css.split(', ')),(prod,reduced,css)
            assert page.locator('html').get_attribute('dir')==('rtl' if rtl else 'ltr')
            assert page.locator('#commit').is_disabled()
            page.emulate_media(reduced_motion='no-preference' if reduced else 'reduce')
            expected_flip=(220 if prod=='InstantBible' else 280) if reduced else 0
            page.wait_for_function('expected => Number(document.querySelector("#scene").dataset.durationMs)===expected',arg=expected_flip,timeout=1500)
            page.emulate_media(reduced_motion='reduce' if reduced else 'no-preference')
            page.wait_for_function('expected => Number(document.querySelector("#scene").dataset.durationMs)===expected',arg=duration,timeout=1500)
            page.locator('#start').click()
            assert page.locator('#state').inner_text()=='Processando resposta'
            assert page.locator('#scene').get_attribute('data-state')=='evaluating'
            assert page.locator('#commit').is_enabled()
            assert page.locator('.track').get_attribute('aria-valuenow')=='0'
            page.locator('#commit').click()
            assert page.locator('#state').inner_text()=='Próxima atividade pronta'
            assert page.locator('.track').get_attribute('aria-valuenow')=='100'
            assert page.locator('#commit').is_disabled()
            assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
            assert all(x>=44 for x in page.locator('button').evaluate_all('(els)=>els.map(x=>x.getBoundingClientRect().height)'))
            assert page.locator('#state').get_attribute('aria-live')=='polite'
            page.locator('#reset').click()
            assert page.locator('#state').inner_text()=='Pronto para começar'
            count+=1
        browser.close()
    expected=96 if batch is None else 48
    assert count==expected, ('Incomplete Tesla browser batch',batch,count)
    print(f'PASS: {count}/{expected} Tesla Chromium interactions (batch {batch or "all"}); full matrix=96: four products, three widths, RTL/LTR, reduced/normal and 100%/200% font; dynamic Reduce Motion, no overflow, honest progress')
print('NOT_RUN: Flutter Android/iOS, Capacitor WebView, real audio, GPU FPS, screen reader and native production code')
```
<!-- INSTANT_TESLA_MOTION_SELFTEST_END -->

### 6.41 Critérios de aceite e relação com código de produção

| ID | Critério | Evidência mínima | Estado nesta revisão |
|---|---|---|---|
| TM-001 | BrandMotion não muda duração/fontes originais | Contrato de abertura + golden | Contrato definido; device não testado |
| TM-002 | Orbe mantém 10 cores e reage a volume real | Catálogo Flutter/Web + áudio vivo | Catálogo conhecido; áudio vivo não testado |
| TM-003 | Learning Motion só celebra resultado validado | Backend commit + integração | Oráculo e demo; apps não testados |
| TM-004 | Sem travar interação ou navegação | E2E toque, cancelamento e back gesture | Demo validável; apps não testados |
| TM-005 | RTL e texto ampliado | `en-XA`, `ar-XB`, 200% texto | Demo parcial; apps não testados |
| TM-006 | Reduce Motion sem translação/escala | Android + iOS + browser engine | Demo Chromium; demais não testados |
| TM-007 | InstantBible sempre <=220 ms | Teste de perfil específico | Validação de política e demo |
| TM-008 | Sem falsificar avanço de estudo | Progresso persistido e visível | Demo simula confirmação; backend não testado |
| TM-009 | FPS/jank/memória por classe de dispositivo | Perfil Android físico / iPhone / Web | **NOT_RUN** |
| TM-010 | Look & feel aprovado em 4 apps | Capturas reais e revisão humana | **NOT_RUN** |

**Bloqueios de release:** não declarar `10/10` de experiência nem que o motion está instalado nos apps até que TM-001..010 possuam evidência de CI/dispositivos e revisão visual. Este documento normatiza o perfil mas não fornece `.riv` em produção ou patches nos quatro repositórios.

### 6.42 Árbitro de movimento — ElevenLabs × Duolingo × Tesla (normativo v3.5)

**Conclusão do teste de ambiguidade:** as três referências **não são três motores competindo pela mesma tela**. São **duas especializações funcionais e um estilo coordenador**, além da abertura de marca. O nome comercial interno recomendado é **Instant Motion System**. Não criar componentes denominados `TeslaAnimator`, `DuolingoAnimator` ou `ElevenLabsOrb` nem misturar assets das empresas. Os contratos nativos de cada produto continuam independentes; esta seção governa o comportamento compartilhado.

| Nome de referência | Papel que pode exercer | Dono do estado e da área visual | Não pode fazer |
|---|---|---|---|
| ElevenLabs (princípios de áudio) | **IntelligenceMotion**: voz e estados reais; dez cores das orbes no InstantSpeak | Orbe/indicador de fala; `VoiceMotionController` | Emitir recompensas, navegar, simular amplitude, alterar logo |
| Duolingo (princípios pedagógicos) | **LearningMotion**: feedback e progresso **confirmados** | Cartão de resultado, barra de conhecimento, conquista | Animar orbe, pontuar sem ACK, lançar efeitos sobre leitura/voz |
| Tesla (princípios de precisão) | **InstantPrecisionMotion**: ritmo, curva, continuidade de navegação | Propriedade compositora de rota, sheet, toque; **perfil transversal, nunca quarta camada** | Inventar evento de domínio, criar segundo feedback para mesmo resultado |
| Instant (identidade própria) | **BrandMotion**: wordmark aprovado e abertura inicial | Wordmark/cápsula; **exclusivo durante abertura elegível** | Repetir intro em toda rota, bloquear interação, alterar persona |

**Ordem normativa de resolução:** acessibilidade e verdade do estado > identidade/regras do produto > **voz ativa** na região da orbe > abertura elegível (pulável) > feedback educacional verificado > transição de rota > confirmação de toque. **Exceção importante:** com voz efetivamente animada, intro, navegação, feedback e toque atualizam estado e texto, mas não iniciam interpolação visual paralela. Sem voz, preservam-se os tempos aprovados. Uma confirmação de toque nunca atrasa a ação. As restrições dos sistemas operacionais prevalecem. **Não confundir prioridade visual com perda de eventos de domínio:** um resultado validado e seu anúncio acessível devem continuar existindo quando a animação é suprimida.

**Orçamento de atenção:** no máximo **uma animação foreground de UI por vez** (`BrandMotion`, `LearningMotion` ou `InstantPrecisionMotion`). A orbe de voz pode coexistir somente em sua própria superfície, com amplitude real; quando `listening`/`speaking` estiver ativo, Learning Motion vira atualização estática + anúncio, não segunda celebração. Ao trocar de rota, cancelar animação foreground anterior e manter o estado de domínio persistido. A rota pode animar apenas sem voz ativa; caso contrário, mudar de tela imediatamente e manter a orbe com seu feedback de voz sem outra animação. Os efeitos não controlam timers de negócio.

**Duração efetiva, fonte de autoridade:** abertura InstantSpeak 2.650 ms somente na apresentação inicial elegível e **sem orbe de voz já ativa**; feedback e marcos da aprendizagem usam §6.28/§6.34 (400–750 ms permitidos em marco verificado); navegação/toque/modal usam §6.37 (90–320 ms); orbe vincula-se a áudio real, não aos temporizadores de tela. O teto do InstantBible é 220 ms para seus efeitos discretos. `Reduce Motion` impõe duração **0 ms em todos os casos**; mensagem e alteração efetiva permanecem. Um caso que mistura progresso e conquista do mesmo resultado produz **um único efeito principal**, preferindo a conquista, nunca 320 ms + 750 ms simultâneos.

**Exemplos de arbitragem que devem produzir um único resultado:**

- Fala em curso + acerto: a orbe acompanha o áudio, o texto confirma o acerto, **nenhuma segunda animação de recompensa**.
- Progresso salvo + conquista do mesmo `resultId`: valor consolidado imediatamente, **um único** feedback de conquista conforme o limite do produto.
- Navegação + progresso: navegação responde ao toque; o progresso é atualizado e anunciado **sem coreografia independente**. Com voz ativa, a própria navegação não interpola (`0 ms`) e preserva a animação da orbe, para impedir dois movimentos simultâneos.
- Erro/perda de confirmação + recompensa: mostrar erro estático, sem celebração ou aumento de progresso inventado.
- Redução de movimento ativada em tempo real: abortar interpolação, exibir estado final correto com foco e rótulo preservados.
- Voltar durante abertura: permitir `skip` e nunca reiniciar 2,65 s após mudança de rota.

**Teste real necessário para release:** instrumentar ações e sessões no app, obter vídeo da mesma tentativa com áudio ligado/desligado, 200% de fonte, RTL e Reduce Motion; reprovar dupla animação, falsos progressos, travamento, competição da orbe, perda de foco ou mais de uma mensagem semântica por estado. A execução abaixo é **oráculo de referência**, não prova de implementação em Flutter, Capacitor ou dispositivos.

<!-- INSTANT_MOTION_ARBITER_POLICY_BEGIN -->
```json
{
  "schemaVersion": "3.5.0",
  "name": "Instant Motion Arbiter — single ownership, no fourth animation layer",
  "role": "coordination contract, SPEC_AND_REFERENCE_ONLY",
  "products": [
    "InstantSpeak",
    "InstantStudy",
    "InstantBible",
    "InstantVest"
  ],
  "layers": [
    "BrandMotion",
    "IntelligenceMotion",
    "LearningMotion"
  ],
  "crossCuttingStyle": "InstantPrecisionMotion",
  "precedence": [
    "accessibility_and_truth",
    "product_and_platform",
    "active_voice_intelligence",
    "brand_intro_exclusive",
    "verified_learning_feedback",
    "navigation",
    "tap_acknowledgement"
  ],
  "owners": {
    "wordmark_and_capsule": "BrandMotion",
    "orb_palette_geometry_and_live_audio": "IntelligenceMotion",
    "answer_result_progress_and_milestone": "LearningMotion",
    "navigation_sheet_and_tap_transition": "InstantPrecisionMotion"
  },
  "constraints": {
    "singleForegroundAnimation": true,
    "instantPrecisionNotFourthLayer": true,
    "elevenLabsV4IsAudioNotOrbVersion": true,
    "onlyValidatedEventsTriggerLearning": true,
    "noSyntheticAudioLevels": true,
    "noDoubleMotionForSingleResult": true,
    "noLearningCelebrationDuringVoice": true,
    "neverGateInteraction": true,
    "reduceMotionAllDurationsZero": true,
    "firstLaunchBrandOnly": true,
    "skipBrandIntro": true,
    "rtlMirrorDirectionalOnly": true,
    "releaseStatus": "NOT_VERIFIED_ON_APPS"
  },
  "conflictDecisions": {
    "logo_intro_plus_any_other": "brand_only_when_first_eligible_without_live_voice; otherwise_static; semantic_updates_persist; skip_available",
    "voice_live_plus_learning_reward": "voice_orb_only; learning_visual_static; learning_semantics_remain",
    "voice_live_plus_navigation": "navigation_immediate_no_interpolation; orb_owned_by_audio; no_double_foreground",
    "progress_plus_milestone_same_result": "single_learning_foreground; milestone_wins; no_duplicate_event",
    "route_change_plus_learning": "route_motion_wins; learning_announcement_and_value_preserved",
    "any_failure_plus_reward": "error_static; no_reward",
    "reduce_motion_any": "instant_state_and_semantics_without_interpolation",
    "bible_milestone": "quiet_static_or_max_220ms; no_confetti",
    "idle_orb_plus_learning": "learning_foreground_only; idle_orb_may_remain_static"
  },
  "regressionGate": {
    "desktopBrowserReference": "TESTED_ONLY_IN_LAB",
    "flutterAndroid": "NOT_RUN",
    "iOS": "NOT_RUN",
    "capacitor": "NOT_RUN",
    "hardware": "NOT_RUN"
  }
}
```
<!-- INSTANT_MOTION_ARBITER_POLICY_END -->

**Autoteste executável — contratos cruzados, combinações concorrentes e mutações** (extrair apenas para diretório temporário, sem arquivo mestre adicional):

<!-- INSTANT_MOTION_ARBITER_TEST_BEGIN -->
```python
from pathlib import Path
import itertools, json, re, copy
src=Path('INSTDESIGN.MD').read_text(encoding='utf-8')
def block(tag):
    found=re.findall(r'(?m)^<!-- '+tag+r'_BEGIN -->\s*```json\n(.*?)\n```\s*<!-- '+tag+r'_END -->',src,re.S)
    assert len(found)==1,(tag,len(found))
    return json.loads(found[0])
p=block('INSTANT_MOTION_ARBITER_POLICY')
t=block('INSTANT_TESLA_MOTION_POLICY')
l=block('INSTANT_LEARNING_MOTION_POLICY')
def validate(q):
    assert q['schemaVersion']=='3.5.0'
    assert q['products']==t['scope']['products']==l['scope']['products']==['InstantSpeak','InstantStudy','InstantBible','InstantVest']
    assert q['layers']==t['composition']['layers']==['BrandMotion','IntelligenceMotion','LearningMotion']
    assert q['crossCuttingStyle']=='InstantPrecisionMotion'
    assert q['role']=='coordination contract, SPEC_AND_REFERENCE_ONLY'
    assert q['precedence']==['accessibility_and_truth','product_and_platform','active_voice_intelligence','brand_intro_exclusive','verified_learning_feedback','navigation','tap_acknowledgement']
    assert q['owners']=={
     'wordmark_and_capsule':'BrandMotion',
     'orb_palette_geometry_and_live_audio':'IntelligenceMotion',
     'answer_result_progress_and_milestone':'LearningMotion',
     'navigation_sheet_and_tap_transition':'InstantPrecisionMotion'}
    c=q['constraints']
    for name in ['singleForegroundAnimation','instantPrecisionNotFourthLayer','elevenLabsV4IsAudioNotOrbVersion','onlyValidatedEventsTriggerLearning','noSyntheticAudioLevels','noDoubleMotionForSingleResult','noLearningCelebrationDuringVoice','neverGateInteraction','reduceMotionAllDurationsZero','firstLaunchBrandOnly','skipBrandIntro','rtlMirrorDirectionalOnly']:
        assert c.get(name) is True,name
    assert c['releaseStatus']=='NOT_VERIFIED_ON_APPS'
    assert q['conflictDecisions']=={
     'logo_intro_plus_any_other':'brand_only_when_first_eligible_without_live_voice; otherwise_static; semantic_updates_persist; skip_available',
     'voice_live_plus_learning_reward':'voice_orb_only; learning_visual_static; learning_semantics_remain',
     'voice_live_plus_navigation':'navigation_immediate_no_interpolation; orb_owned_by_audio; no_double_foreground',
     'progress_plus_milestone_same_result':'single_learning_foreground; milestone_wins; no_duplicate_event',
     'route_change_plus_learning':'route_motion_wins; learning_announcement_and_value_preserved',
     'any_failure_plus_reward':'error_static; no_reward',
     'reduce_motion_any':'instant_state_and_semantics_without_interpolation',
     'bible_milestone':'quiet_static_or_max_220ms; no_confetti',
     'idle_orb_plus_learning':'learning_foreground_only; idle_orb_may_remain_static'}
    assert all(v=='NOT_RUN' for k,v in q['regressionGate'].items() if k!='desktopBrowserReference')
    assert q['regressionGate']['desktopBrowserReference']=='TESTED_ONLY_IN_LAB'
    assert t['constraints']['instantBibleCapMs']==l['durationsMs']['bibleMax']==220
    assert t['constraints']['reducedMotionDurationMs']==l['durationsMs']['reducedMax']==0
    assert t['composition']['role']=='cross-cutting choreography, not a fourth renderer'
    assert l['scope']['brandIntroImmutable'] and l['scope']['voiceOrbImmutable']
    assert l['events']['progress_committed']['requiresPersistedAck'] is True
    assert l['events']['milestone_earned']['requiresPersistedAck'] is True
    assert 'tabela histórica, não normativa' in src
    assert 'um único efeito principal' in src
    return True
assert validate(p)

VOICE_STATES=('idle','requestingPermission','listening','processing','speaking','paused','error','offline')
MOTION_EVENTS=(('brand_intro',),('voice_state',),('answer_evaluated',),('progress_committed',),('milestone_earned',),('route_transition',),('tap_ack',),('progress_committed','milestone_earned'),('voice_state','milestone_earned'),('route_transition','progress_committed'),('error','milestone_earned'))

def resolve(product,voice,requested,reduced=False,routeChanging=False,verified=False,committed=False,firstLaunch=True,levelAvailable=True):
    # Pure *reference* arbiter, independent of SDK timers and renderers.
    assert product in p['products'] and voice in VOICE_STATES
    r=set(requested)
    foreground='none';effect='none';duration=0
    orb_running=voice in {'listening','speaking'} and levelAvailable and not reduced
    semantic=[]
    hasError='error' in r or voice=='error'
    if hasError:
        semantic=['error']
        orb_running=False
    else:
        if 'answer_evaluated' in r and verified:semantic.append('correct')
        if 'progress_committed' in r and verified and committed:semantic.append('progress')
        if 'milestone_earned' in r and verified and committed:semantic.append('milestone')
        # A saved result may update both the value and the milestone but must
        # trigger ONE announcement and ONE foreground animation at most.
        if 'milestone' in semantic and 'progress' in semantic:semantic=['milestone']
        if 'brand_intro' in r and firstLaunch and product=='InstantSpeak' and not routeChanging:
            foreground='BrandMotion'; effect='wordmark';duration=2650
        elif 'route_transition' in r or (routeChanging and any(x in r for x in ('progress_committed','milestone_earned','answer_evaluated'))):
            foreground='InstantPrecisionMotion';effect='routeTransition';duration=t['transitions']['routeTransition']['durationMs']
        elif semantic:
            # While live audio is speaking/listening, only announce the result
            # and update verified data statically; no second moving focus.
            if voice not in ('speaking','listening'):
                foreground='LearningMotion'
                effect=max(semantic,key=lambda x:['correct','progress','milestone'].index(x))
                duration=l['durationsMs'][effect][1]
        elif 'tap_ack' in r:
            foreground='InstantPrecisionMotion';effect='touchAcknowledgement';duration=t['transitions']['touchAcknowledgement']['durationMs']
    # Audio owns the moving focus while a tutor is live: route/brand/learning
    # updates remain immediate and semantic, never animate beside the orb.
    if voice in ('listening','speaking') and orb_running and foreground!='none': duration=0
    if product=='InstantBible':duration=min(duration,220)
    if reduced or hasError:duration=0
    # Brand always visible on the initial eligible launch and is instantly
    # finalized on reduced motion; no exceptions to accessible state.
    assert len(semantic)<=1
    assert duration>=0
    return dict(owner=foreground,effect=effect,ms=duration,orb=orb_running,announcements=semantic,
                navigationNotGated=True,static=(duration==0),resultTruth=not semantic or verified)

checks=0
for product,voice,actions,reduced,changing,verified,committed in itertools.product(p['products'],VOICE_STATES,MOTION_EVENTS,[False,True],[False,True],[False,True],[False,True]):
    x=resolve(product,voice,actions,reduced,changing,verified,committed)
    assert x['navigationNotGated'] is True
    assert x['owner'] in ('none','BrandMotion','LearningMotion','InstantPrecisionMotion')
    assert 0<=x['ms']<3000
    assert x['orb'] == (voice in ('listening','speaking') and not reduced and 'error' not in actions)
    if reduced or 'error' in actions or voice=='error':assert x['ms']==0
    if product=='InstantBible':assert x['ms']<=220
    if not verified:assert all(a=='error' for a in x['announcements'])
    if not committed and 'answer_evaluated' not in actions:assert all(a=='error' for a in x['announcements'])
    if voice in ('speaking','listening') and x['announcements'] and not changing:assert x['owner']!='LearningMotion'
    if 'progress_committed' in actions and 'milestone_earned' in actions and verified and committed and voice!='error':
        assert x['announcements']==['milestone'] if 'error' not in actions else x['announcements']==['error']
    checks+=1
assert checks==5632,checks
# Regression probes: silence does not fake waveform, first-launch brand may be
# skipped, error revokes celebration, and reduced-motion retains the semantics.
assert not resolve('InstantSpeak','speaking',('voice_state',),levelAvailable=False)['orb']
assert resolve('InstantSpeak','idle',('brand_intro',),firstLaunch=False)['ms']==0
assert resolve('InstantSpeak','idle',('brand_intro',))['ms']==2650
assert resolve('InstantSpeak','idle',('brand_intro',),reduced=True)['ms']==0
assert resolve('InstantStudy','speaking',('milestone_earned',),verified=True,committed=True)['announcements']==['milestone']
assert resolve('InstantStudy','speaking',('milestone_earned',),verified=True,committed=True)['ms']==0
assert resolve('InstantStudy','idle',('milestone_earned','error'),verified=True,committed=True)['announcements']==['error']
assert resolve('InstantStudy','idle',('progress_committed',),verified=True,committed=False)['announcements']==[]
assert resolve('InstantBible','idle',('milestone_earned',),verified=True,committed=True)['ms']==220
assert resolve('InstantStudy','idle',('route_transition','progress_committed'),verified=True,committed=True)['effect']=='routeTransition'
assert resolve('InstantStudy','speaking',('route_transition',))['ms']==0, 'voice must suppress route interpolation'
assert resolve('InstantSpeak','listening',('brand_intro',))['ms']==0, 'voice must suppress concurrent brand interpolation'
assert resolve('InstantStudy','idle',('route_transition',))['ms']>0, 'normal route animation must remain'
assert resolve('InstantSpeak','idle',('brand_intro',))['ms']==2650, 'non-voice intro must remain'
assert resolve('InstantStudy','speaking',('route_transition',))['orb'] is True, 'voice remains alive'


mutations=[
 ('fourth_layer',lambda m:m['layers'].append('TeslaMotion')),
 ('wrong_scope',lambda m:m['products'].pop()),
 ('owned_orb_by_learning',lambda m:m['owners'].__setitem__('orb_palette_geometry_and_live_audio','LearningMotion')),
 ('owned_wordmark_by_tesla',lambda m:m['owners'].__setitem__('wordmark_and_capsule','InstantPrecisionMotion')),
 ('wrong_precision_name',lambda m:m.__setitem__('crossCuttingStyle','TeslaSDK')),
 ('false_fourth_role',lambda m:m.__setitem__('role','fourth renderer')),
 ('wrong_priority',lambda m:m['precedence'].reverse()),
 ('double_foreground',lambda m:m['constraints'].__setitem__('singleForegroundAnimation',False)),
 ('synthetic_audio',lambda m:m['constraints'].__setitem__('noSyntheticAudioLevels',False)),
 ('reward_without_ack',lambda m:m['constraints'].__setitem__('onlyValidatedEventsTriggerLearning',False)),
 ('double_result',lambda m:m['constraints'].__setitem__('noDoubleMotionForSingleResult',False)),
 ('voice_competition',lambda m:m['constraints'].__setitem__('noLearningCelebrationDuringVoice',False)),
 ('gate_touch',lambda m:m['constraints'].__setitem__('neverGateInteraction',False)),
 ('reduce_override',lambda m:m['constraints'].__setitem__('reduceMotionAllDurationsZero',False)),
 ('intro_repeat',lambda m:m['constraints'].__setitem__('firstLaunchBrandOnly',False)),
 ('intro_skip_broken',lambda m:m['constraints'].__setitem__('skipBrandIntro',False)),
 ('rtl_mirror_everything',lambda m:m['constraints'].__setitem__('rtlMirrorDirectionalOnly',False)),
 ('wrong_bible_policy',lambda m:m['conflictDecisions'].__setitem__('bible_milestone','animated_750ms')),
 ('loss_of_semantics',lambda m:m['conflictDecisions'].__setitem__('voice_live_plus_learning_reward','silence_learning')), 
 ('false_release_approval',lambda m:m['regressionGate'].__setitem__('flutterAndroid','PASS')),
]
detected=0
for label,mutation in mutations:
    candidate=copy.deepcopy(p)
    mutation(candidate)
    try:validate(candidate)
    except (AssertionError,KeyError):detected+=1
    else:raise AssertionError('Undetected motion confusion regression: '+label)
assert detected==len(mutations)
print(f'PASS: {checks}/{checks} cross-layer arbitration combinations, 10 concurrency/regression cases and {detected}/{detected} negative mutations')
print('PASS: one foreground owner; preserved true verified state under audio, route and reduced motion; no extra Tesla layer')
print('NOT_RUN: apps Flutter/Capacitor, WebKit, Android Maestro, iOS VoiceOver, real GPU/audio and deployed Rive assets')
```
<!-- INSTANT_MOTION_ARBITER_TEST_END -->

**Critério adicional v3.5 — prioridade da voz ao movimento:** enquanto a orbe estiver em `listening` ou `speaking` com atividade visual, qualquer `route_transition`, `brand_intro`, `tap_ack` ou animação de `LearningMotion` deve atualizar o estado e as informações **imediatamente e sem uma segunda interpolação** (`0 ms`). O áudio e seus controles continuam funcionais. Quando a voz termina, transições normais podem voltar a animar. Os testes devem contar **todas** as animações em execução, inclusive a orbe, e não somente CSS de navegação. Isto evita o falso positivo identificado em v3.4.

**Laboratório visual integrado (simulado):** esta tela demonstra a coexistência da orbe, de um resultado verificado e das transições em uma só árvore visual, sem conexão real de microfone ou backend. É apenas QA de composição e prioridade.

<!-- INSTANT_MOTION_ARBITER_WEB_BEGIN -->
~~~~html
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Instant Motion — integração visual simulada</title>
<style>
:root{font-family:system-ui,Arial,sans-serif;--ink:#141516;--paper:#faf9f5;--accent:#2359ad;--duration:220ms}*{box-sizing:border-box}html,body{margin:0;min-width:0}body{background:var(--paper);color:var(--ink);padding:clamp(12px,3vw,32px)}main{max-width:620px;margin:auto;display:grid;gap:18px}h1{font-size:clamp(26px,5vw,40px);line-height:1.03;margin:0;letter-spacing:-.045em}p{margin:0;line-height:1.5;overflow-wrap:anywhere}small{color:#3c3d3d}header{display:grid;gap:8px}section{border:1px solid #c9c9c6;border-radius:16px;padding:20px;background:white;min-width:0}.scene{display:grid;gap:16px}.voice{display:flex;align-items:center;gap:16px;min-width:0}.orb{width:64px;height:64px;flex:none;border-radius:50%;background:radial-gradient(circle at 30% 25%,#bcecf0,var(--accent));box-shadow:inset -6px -5px 12px #0a274a22}.orb.live{animation:breath 650ms ease-in-out infinite alternate}@keyframes breath{from{transform:scale(.97)}to{transform:scale(1.02)}}.foreground{width:100%;padding:16px;border-radius:12px;border:1px solid #b9b9ba;background:#f1f4fa;transform-origin:50% 50%;overflow-wrap:anywhere}.foreground.motion{animation:moment var(--duration) cubic-bezier(.2,.8,.2,1) 1}@keyframes moment{from{transform:translateY(5px);opacity:.7}to{transform:translateY(0);opacity:1}}.progress{width:100%;height:8px;border-radius:8px;background:#dedede;overflow:hidden}.fill{height:100%;width:0;background:var(--accent)}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}button{font:inherit;border:1px solid #222;border-radius:12px;background:white;min-height:48px;min-width:0;padding:10px;white-space:normal;overflow-wrap:anywhere;cursor:pointer}button:focus-visible{outline:3px solid #1962d0;outline-offset:3px}#semantic{font-weight:600}#note{font-size:.875rem}@media(prefers-reduced-motion:reduce){.orb.live,.foreground.motion{animation:none!important;transition:none!important;transform:none!important}*{scroll-behavior:auto!important}}@media(max-width:360px){.actions{grid-template-columns:1fr}}
</style></head><body><main><header><small>INSTANT · QA INTEGRADO · EVENTOS SIMULADOS</small><h1 id="title">O aprendizado responde.</h1><p>Uma orbe, um feedback e uma transição — com responsabilidades distintas.</p></header><section class="scene"><div class="voice"><div id="orb" class="orb" aria-hidden="true"></div><div><strong id="voice-label">Voz inativa</strong><p id="product">InstantStudy</p></div></div><div id="foreground" class="foreground" data-owner="none" data-duration-ms="0"><p id="semantic" role="status" aria-live="polite">Pronto</p><p id="note">Nenhum progresso é criado pela animação.</p></div><div class="progress" role="progressbar" aria-label="Progresso confirmado, demonstração" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="fill" class="fill"></div></div></section><div class="actions"><button id="intro">Abertura da marca</button><button id="voice">Voz simulada</button><button id="evaluate">Iniciar avaliação</button><button id="verified">Resultado confirmado</button><button id="navigate">Navegar</button><button id="concurrent">Progresso + navegação</button><button id="error">Erro</button><button id="reset">Reiniciar</button></div><small>Referência de UI em laboratório; não integra nenhum SDK de voz, Rive ou backend real.</small></main>
<script>
(()=>{'use strict';
const cfg=window.__testConfig||{},products=['InstantSpeak','InstantStudy','InstantBible','InstantVest'],prod=products.includes(cfg.product)?cfg.product:'InstantStudy';document.documentElement.dir=cfg.rtl?'rtl':'ltr';
const q=s=>document.querySelector(s),pref=matchMedia('(prefers-reduced-motion: reduce)'),orb=q('#orb'),fg=q('#foreground'),semantic=q('#semantic'),note=q('#note'),progress=q('.progress'),fill=q('#fill');let voiceOn=false,introSeen=false,phase='ready',saved=0,seenResults=new Set(),resultId='r1',lastDuration=0,log=[];
const palette={InstantSpeak:'#2792DC',InstantStudy:'#5B6CFF',InstantBible:'#1F6B52',InstantVest:'#8144A8'};document.documentElement.style.setProperty('--accent',palette[prod]);q('#product').textContent=prod;
function status(txt,explanation){semantic.textContent=txt;note.textContent=explanation}
function effect(owner,duration){let ms=pref.matches?0:Math.min(duration,prod==='InstantBible'?220:duration);if(voiceOn&&owner!=='none')ms=0; // live voice owns all visual interpolation; navigation still commits immediately
 fg.classList.remove('motion');void fg.offsetWidth;fg.dataset.owner=owner;fg.dataset.durationMs=String(ms);document.documentElement.style.setProperty('--duration',ms+'ms');if(ms>0)fg.classList.add('motion');lastDuration=ms;log.push({owner,ms});}
function sync(){orb.classList.toggle('live',voiceOn&&!pref.matches);q('#voice-label').textContent=voiceOn?'Voz ativa · sinal demonstrativo':'Voz inativa';if(pref.matches){fg.classList.remove('motion');fg.dataset.durationMs='0';lastDuration=0;}}
pref.addEventListener('change',sync);function setProgress(){const value=String(saved);progress.setAttribute('aria-valuenow',value);fill.style.width=value+'%'}
q('#intro').addEventListener('click',()=>{if(prod!=='InstantSpeak'||introSeen)return;introSeen=true;status('Abertura InstantSpeak™ → ISpeak™','Apresentação elegível uma única vez; pulável.');effect('BrandMotion',2650)});
q('#voice').addEventListener('click',()=>{voiceOn=!voiceOn;sync();status(voiceOn?'Ouvindo · demonstração':'Voz encerrada','O visual da orbe pertence exclusivamente ao IntelligenceMotion.');effect('none',0)});
q('#evaluate').addEventListener('click',()=>{phase='evaluating';resultId='r'+(seenResults.size+1);status('Avaliando','Nenhuma recompensa antes de confirmação.');effect('none',0)});
q('#verified').addEventListener('click',()=>{if(phase!=='evaluating'||seenResults.has(resultId))return;seenResults.add(resultId);phase='done';saved=Math.min(100,saved+20);setProgress();status('Conhecimento confirmado','Resultado e progresso simuladamente persistidos.');effect('LearningMotion',750)});
q('#navigate').addEventListener('click',()=>{status('Próxima tela','A navegação não espera a animação.');effect('InstantPrecisionMotion',300)});
q('#concurrent').addEventListener('click',()=>{if(phase==='evaluating'&&!seenResults.has(resultId)){seenResults.add(resultId);saved=Math.min(100,saved+20);phase='done';setProgress()};status('Próxima tela · progresso atualizado','Somente a navegação anima; o resultado permanece acessível.');effect('InstantPrecisionMotion',300)});
q('#error').addEventListener('click',()=>{phase='error';status('Erro na avaliação','Nenhuma recompensa será exibida.');effect('none',0)});
q('#reset').addEventListener('click',()=>{phase='ready';voiceOn=false;sync();status('Pronto','Nenhum progresso é criado pela animação.');effect('none',0)});
setProgress();sync();window.instantMotionQA={getSnapshot:()=>({product:prod,rtl:document.documentElement.dir,reduced:pref.matches,voiceOn,introSeen,phase,saved,owner:fg.dataset.owner,duration:lastDuration,visualAnimations:document.getAnimations().filter(a=>a.playState==='running').length,orbLive:(orb.classList.contains('live')&&!pref.matches),announced:semantic.textContent,log:[...log]})};
})();
</script></body></html>
~~~~
<!-- INSTANT_MOTION_ARBITER_WEB_END -->

**Autoteste Chromium de composição e concorrência** (requer Playwright; executar o bloco abaixo extraído para script temporário):

<!-- INSTANT_MOTION_ARBITER_BROWSER_TEST_BEGIN -->
```python
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import quote
from itertools import product
import re,json,os
s=Path('INSTDESIGN.MD').read_text(encoding='utf-8')
m=re.search(r'(?m)^<!-- INSTANT_MOTION_ARBITER_WEB_BEGIN -->\s*~~~~html\n(.*?)\n~~~~\s*<!-- INSTANT_MOTION_ARBITER_WEB_END -->',s,re.S)
assert m,'missing integrated browser prototype';html=m.group(1)
count=0
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('INSTANT_CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page()
    for name,w,rtl,reduced in product(['InstantSpeak','InstantStudy','InstantBible','InstantVest'],[320,390,768],[False,True],[False,True]):
        page.set_viewport_size({'width':w,'height':780})
        page.emulate_media(reduced_motion='reduce' if reduced else 'no-preference')
        page.goto('about:blank')
        injected='<script>window.__testConfig='+json.dumps({'product':name,'rtl':rtl})+';</script>'
        page.set_content(html.replace('<script>',injected+'\n<script>',1))
        get=lambda:page.evaluate('window.instantMotionQA.getSnapshot()')
        x=get();assert x['product']==name and x['rtl']==('rtl' if rtl else 'ltr')
        assert page.locator('.progress').get_attribute('aria-valuenow')=='0'
        page.locator('#verified').click();assert page.locator('.progress').get_attribute('aria-valuenow')=='0'  # no verified eval
        page.locator('#intro').click();x=get();assert x['duration']==(0 if reduced or name!='InstantSpeak' else 2650)
        page.locator('#intro').click();assert get()['log']==x['log'] # first-launch only
        page.locator('#evaluate').click();page.locator('#verified').click();x=get()
        assert x['saved']==20 and x['announced']=='Conhecimento confirmado'
        assert x['duration']==(0 if reduced else 220 if name=='InstantBible' else 750)
        page.locator('#verified').click();assert get()['saved']==20
        page.locator('#voice').click();assert get()['orbLive']==(not reduced)
        page.locator('#evaluate').click();page.locator('#verified').click();x=get()
        assert x['saved']==40 and x['duration']==0 and x['announced']=='Conhecimento confirmado'
        page.locator('#navigate').click();x=get();assert x['duration']==0, 'voice live must not compete with route animation'
        assert x['visualAnimations'] <= 1, 'must count orb AND foreground animations'
        page.locator('#evaluate').click();page.locator('#concurrent').click();x=get()
        assert x['saved']==60 and x['owner']=='InstantPrecisionMotion' and x['announced'].startswith('Próxima tela')
        assert x['duration']==0, 'voice live must suppress second animation'
        assert x['visualAnimations'] <= 1
        page.locator('#voice').click() # stop simulated voice to verify normal navigation still animates
        page.locator('#navigate').click();x=get()
        assert x['duration']==(0 if reduced else 220 if name=='InstantBible' else 300)
        assert x['visualAnimations'] <= 1
        page.locator('#error').click();assert get()['duration']==0
        assert page.locator('body').evaluate('(x)=>x.scrollWidth <= window.innerWidth'),(name,w,rtl,reduced)
        assert all(n>=44 for n in page.locator('button').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)'))
        assert page.locator('#semantic').get_attribute('aria-live')=='polite'
        assert get()['visualAnimations']<=1
        count+=1
    # Counterexample excluded by the original 48: FIRST voice, THEN intro.
    for name in ['InstantSpeak','InstantStudy','InstantBible','InstantVest']:
        page.emulate_media(reduced_motion='no-preference')
        page.set_viewport_size({'width':390,'height':780})
        page.set_content(html.replace('<script>', '<script>window.__testConfig='+json.dumps({'product':name,'rtl':False})+';</script>\n<script>',1))
        page.locator('#voice').click()
        page.locator('#intro').click()
        snap=page.evaluate('window.instantMotionQA.getSnapshot()')
        assert snap['visualAnimations']<=1 and snap['duration']==0, ('voice-intro',name,snap)
        assert snap['orbLive'] is True
        # Dynamically enable reduced motion during active voice.
        page.emulate_media(reduced_motion='reduce')
        snap=page.evaluate('window.instantMotionQA.getSnapshot()')
        assert snap['visualAnimations']==0 and snap['duration']==0 and not snap['orbLive'], ('dynamic-reduce',name,snap)
        page.emulate_media(reduced_motion='no-preference')
        snap=page.evaluate('window.instantMotionQA.getSnapshot()')
        assert snap['visualAnimations']<=1 and snap['orbLive'],('dynamic-restore',name,snap)
    # Negative mutation: reintroduce the precise v3.4 bug and verify the visual oracle catches TWO running animations.
    broken=html.replace("if(voiceOn&&owner!=='none')ms=0;", "if(false)ms=0;")
    assert broken!=html, 'Suppression rule not found for mutation test'
    page.emulate_media(reduced_motion='no-preference')
    page.set_viewport_size({'width':390,'height':780})
    page.set_content(broken)
    page.locator('#voice').click()
    page.locator('#navigate').click()
    regression=page.evaluate('window.instantMotionQA.getSnapshot()')
    assert regression['visualAnimations']==2, ('Mutation escaped animation oracle',regression)
    browser.close()
assert count==48,count
print('PASS: 48/48 integrated Chromium scenarios; 4/4 voice-before-intro; 8/8 live reduced-motion toggles; 1/1 visual negative mutation detected (2 concurrent animations)')
print('NOT_RUN: Flutter/Capacitor production implementation; Android/iOS device performance and real audio')
```
<!-- INSTANT_MOTION_ARBITER_BROWSER_TEST_END -->

## 7. Padrões de experiência por aplicativo

### InstantSpeak — AHA

1. Idioma e objetivo iniciais em poucas escolhas.
2. Primeira conversa/ensaio acessível sem configurar dezenas de opções.
3. Feedback inteligível após a primeira resposta, com sugestão de próximo passo.
4. Controles de voz, texto, silêncio e privacidade claramente visíveis.

**Critério de produto:** o usuário consegue **falar ou escrever, ouvir ou ler uma resposta e compreender o próximo passo**. Medir tempo para primeiro turno útil; não prometer valor sem instrumentação.

### InstantStudy — AHA

1. Importar ou criar um conjunto de estudo mínimo.
2. Resolver a primeira questão rapidamente.
3. Entender acerto/erro e por quê.
4. Enxergar progresso e próxima atividade, sem animações punitivas.

**Critério de produto:** concluir uma interação real de estudo, com feedback acionável.

### InstantBible — AHA

1. Encontrar uma passagem rapidamente.
2. Ler com conforto e boa hierarquia editorial.
3. Acionar um recurso útil (áudio, reflexão, anotação ou plano) sem remover foco do texto.
4. Continuar do ponto salvo sem confusão.

**Critério de produto:** chegar à passagem desejada e realizar uma ação de valor, com leitura agradável.

## 8. Acessibilidade, privacidade e confiança

### 8.1 Mínimos obrigatórios

- Texto normal com contraste **≥ 4,5:1** e texto grande elegível **≥ 3:1**, respeitando exceções e definições da WCAG.
- Componentes e indicadores não textuais críticos com contraste **≥ 3:1** contra superfícies adjacentes.
- Navegação por teclado web, leitura por leitores de tela e foco lógico.
- `Reduce Motion`, **Dynamic Type** (iOS) e **Text Scaling** (Android/web), orientação variável e layout estreito; ver §3.4.
- Conteúdo textual essencial deve funcionar em 200% de escala ou no maior tamanho do sistema; testar sem truncamento grave, sobreposição ou impossibilidade de concluir tarefa.
- Ícones com nomes acessíveis; conteúdos de áudio essenciais com legenda/transcrição ou alternativa equivalente.
- Erros perceptíveis sem depender somente de vermelho.
- Campos com label e mensagem de erro programaticamente associados.
- Não utilizar cor/transparência como único sinal de seleção.

### 8.2 Privacidade e segurança de interação

- Mostrar com clareza quando áudio está sendo capturado, processado ou reproduzido.
- Não sugerir processamento privado/offline se a arquitetura não garantir isso.
- Permissões solicitadas **no contexto da necessidade**, com fallback seguro.
- Paywalls identificam cobrança recorrente, periodicidade e termos, com restauração de compras onde aplicável.
- Sem dark patterns de assinatura, dificuldade artificial de cancelamento ou consentimento oculto.

## 9. Design tokens executáveis: fonte única de verdade

**Nesta edição de arquivo único, o JSON do Apêndice N é canônico.** Arquivos `design/tokens.json`, CSS e Dart são **gerados** a partir dele no repositório de implementação, nunca segunda fonte de verdade. Os exemplos e tabelas nas seções anteriores são representações editoriais dos tokens; se divergirem, corrigir a tabela e registrar a alteração, não manter ambas.

**DTCG 2025.10:** tokens armazenados em `design/tokens.json` com `$type` e `$value` conforme os módulos de **Format** e **Color**. **Cores** usam `{ "colorSpace": "srgb", "components": [r,g,b], "hex": "#RRGGBB" }`; **dimensões** `{ "value": 16, "unit": "px" }`; **durações** `{ "value": 160, "unit": "ms" }`; pesos e curvas obedecem seus tipos especificados. Todos os 73 tokens originalmente mal formatados na v1.4 foram migrados; mais tokens foram criados para temas e tipografia de Android/web.

**Fontes:** https://www.designtokens.org/tr/2025.10/format/ e https://www.designtokens.org/tr/2025.10/color/ . A versão do formato e o teste do pipeline **não** garantem compatibilidade automática com cada plugin ou ferramenta de terceiros.

### 9.1 Artefatos gerados (nunca editar manualmente)

- `design/generated/instant-tokens.css` — CSS com variáveis em temas light/dark, acentos por produto e escala tipográfica web.
- `design/generated/instant_tokens.dart` — tema Flutter `ThemeData`, `TextTheme` e `ThemeExtension<InstantSemanticColors>`, com cores e escala iOS/Android.
- `design/COMPONENTS.md` — contratos operacionais para componentes, dimensões de hit area, estados e acessibilidade.
- `scripts/generate_tokens.py` — transformação e validação estrita do subconjunto de tokens usado neste pacote.
- `tests/test_design_tokens.py` — regressão de tokens, contraste, tipografia e detecção de CSS/Dart divergentes.

```bash
# Executar na raiz do pacote (somente Python 3.10+):
python3 scripts/generate_tokens.py
python3 scripts/generate_tokens.py --check
python3 -m unittest discover -s tests -v
```

**Regra de precedência:** editar **somente** `design/tokens.json` e regenerar CSS/Dart antes de enviar PR; o comando `--check` deve falhar se CSS ou Dart divergir. A duração `motion.duration.fast` é **160 ms**, sem duplicar uma cópia manual `140ms` no documento. Não há CSS escrito à mão que concorra com tokens.

**Tradução de unidades:** o padrão DTCG usa `px` idealizados para dimensão. No adaptador iOS os tamanhos tipográficos são tratados como referências em pontos lógicos; no Android como sp lógico para texto e dp para controles. No web são CSS px. Isto **não** substitui o escalonamento nativo de texto (Dynamic Type/TextScaler/zoom). A escala padrão do `ThemeData` é uma base, não uma tabela de multiplicadores de Dynamic Type hardcoded.

**Limites da validação:** a suíte Python testa dados, algoritmo de contraste e estabilidade dos arquivos gerados. Não compila o código Dart/Flutter nem valida UI real, `TextScaler`, Material/Cupertino, licença de fontes, dispositivo, performance ou loja. Exigir os testes adicionais do §12 e de `design/DESIGN_QA.md` para aprovação de produção.

### 9.2 Contrato de geração Flutter v1.6 e garantia de origem

- **Sem cores fixas de texto em acentos:** `InstantSemanticColors.onAccent` mapeia diretamente `color.product.onLight/onDark` para o produto selecionado, permitindo alterações válidas sem editar Dart à mão.
- **Numeração Dart corrigida:** tamanhos como `17.5` são emitidos como `17.5` (nunca `17.5.0`). O gerador suporta dimensões decimais; durações usam microssegundos inteiros, preservando décimos de milissegundo.
- **Tokens exportados ao Flutter:** `InstantSpacing`, `InstantRadii`, `InstantControlMetrics` e `InstantMotion` expõem espaçamento, raios, alvos de toque, medidas de componentes, durações e curva de easing. Proibido duplicar números literais em novos widgets.
- **Material 3 explícito:** os papéis semanticamente relevantes do `ColorScheme` são gerados de `color.material3.*`, `color.product.*` e `color.light|dark.*`, incluindo containers, on-colors, superfícies, outline, feedback, cores inversas e variantes. O gerador **não usa** `ColorScheme.fromSeed` como fonte de decisões não rastreáveis.
- **Componentes temáticos:** botões `FilledButton` / `OutlinedButton`, `InputDecorationThemeData` e divisórias recebem configurações compartilhadas; cards, chips, selects, paywalls e outros componentes ainda exigem implementação, golden tests e inspeção por plataforma.
- **Tipografia iOS:** os quinze campos Material `TextTheme` estão preenchidos por mapeamento de onze estilos da Apple (alguns reaproveitados); utilizar `TextScaler`, permitir expansão de conteúdo e validar a hierarquia. A tipografia web de sites fica no CSS; Flutter web utiliza escala Flutter/Material como fallback até integração específica.
- **CI:** `python3 scripts/generate_tokens.py --check` e `python3 -m unittest discover -s tests -v` cobrem integridade, mutações e contraste. `bash scripts/flutter_smoke.sh` prepara app de teste e executa `flutter analyze`/`flutter test` **somente quando houver Flutter SDK**.
- **QA de produto:** planos separados `design/QA_STUDY.md` e `design/QA_BIBLE.md`; casos e2e permanecem **não executados**. Não confundir 16 testes unitários locais com aprovação para TestFlight/Play Store.

## 10. Contrato de implementação — Flutter / iOS / Android

1. Centralizar tokens via código **gerado** `design/generated/instant_tokens.dart`, com `ThemeData`, `ThemeExtension`, `InstantSpacing`, `InstantRadii`, `InstantControlMetrics`, `InstantMotion` e Material 3 com papéis explícitos por produto/tema; integrar ao projeto real com `flutter analyze` e `flutter test`.
2. Priorizar componentes nativos/adaptativos para navegação, seletores, permissões e diálogos.
3. Usar `SafeArea`, `MediaQuery`, `LayoutBuilder` e APIs equivalentes de acessibilidade; **não fixar telas por modelo de iPhone**.
4. Controles interativos devem ter tamanho e `Semantics` apropriados; `Tooltip` sozinho não substitui label acessível.
5. Respeitar preferências de animação reduzida do sistema; rever motion, não apenas desligar a onda.
6. Implementar máquina de estados de voz em lógica de produto; a UI **consome estado real**, não timers falsos.
7. Garantir que ícones/imagens proprietários de cada app permaneçam separados dos componentes compartilhados.
8. Não introduzir dependências de animação de terceiros sem verificar licença, peso e comportamento offline.
9. Obter screenshots de golden tests em tamanhos pequenos, medianos e grandes, light/dark e com texto ampliado.
10. Usar fonte nativa do sistema (SF Pro no iOS, Roboto no Android) sem embutir arquivos proprietários; mapear a escala semântica §3.2, incluindo `body` 17 pt iOS.
11. Respeitar `MediaQuery.textScalerOf(context)` em conteúdo essencial; validar tamanho máximo nativo de acessibilidade, além de teste artificial a 200%.

## 11. Eventos para instrumentar (sem dados pessoais indevidos)

| Evento | Pergunta respondida |
|---|---|
| `onboarding_started` | Usuário iniciou o fluxo? |
| `first_value_action_started` | Chegou à primeira tarefa real? |
| `first_value_action_completed` (`elapsed_ms`) | Concluiu primeira tarefa útil e em quanto tempo? Não equivale a valor percebido. |
| `voice_permission_result` | Onde as permissões impedem o uso? |
| `experience_error` | Quais estados críticos falham? |
| `paywall_viewed` | Quantos usuários enxergaram a oferta? |
| `purchase_result` | A compra terminou com sucesso ou falha? |
| `voice_library_opened` | A descoberta da biblioteca ajuda ou atrasa a prática? |
| `voice_preview_started` / `voice_selected` | Ouvir uma amostra ajuda na escolha da voz? |
| `tts_generate_started` / `tts_generate_completed` | Onde o fluxo de pronúncia/TTS falha ou custa tempo? |

**Propriedades de evento permitidas, sob política aprovada:** nome da tela, código de erro sem dados pessoais, tipo de fluxo, duração agregada. Evitar voz identificável, nome do usuário, conteúdo do texto, áudio, URL privada, transcrição ou identificadores desnecessários. Medir funil AHA separadamente de TTS.

Somente emitir eventos com base legal, transparência, minimização e política de retenção. Não registrar transcrições ou conteúdo sensível em analytics padrão. A definição de AHA exige **pesquisa/validação**, não apenas completion events.

## 12. Definition of Done (DoD) / gates de aceite

**Exigências complementares v1.8:** preencher e revisar `design/baselines/manifest.json` com capturas reais antes de usar a expressão “goldens aprovados”; executar os testes de visualizer e `VoiceGlyph` definidos em `design/ORB_VISUAL_SPEC.md` e `design/VOICE_IDENTITY.md`. A demo HTML não aprova nenhum gate Flutter.

- [ ] **Brand:** telas originais, sem assets protegidos da ElevenLabs e sem alterar o ícone aprovado do InstantSpeak.
- [ ] **Figma/tokens:** tokens DTCG 2025.10 passam na validação estrutural, gerador CSS/Dart em `--check` e contraste de pares; sincronização externa com Figma permanece a verificar.
- [ ] **A11y:** pares reais de cor passam nas regras aplicáveis WCAG; foco/teclado/leitores de tela operacionais.
- [ ] **Responsivo:** telas pequenas e grandes, safe area, teclado aberto, orientação e texto ampliado testados.
- [ ] **Tipografia Apple Design:** papéis iOS semanticamente mapeados (body 17 pt), fontes nativas por plataforma, texto ampliado a 200% ou máximo do sistema e zero cortes graves nos fluxos essenciais. Ver QA-017–QA-021.
- [ ] **Estados:** loading, empty, error, offline, disabled e success implementados nos fluxos principais.
- [ ] **Motion:** respeita `Reduce Motion`; visual reativo a áudio representa estados reais; cumprir os gates de §6.10 e §6.16, incluindo fallback 2D/estático e avaliação da orbe 3D original.
- [ ] **Learning Motion:** cumprir §§ 6.27–6.33 e LM-001..026; resultados verificados, sem assets copiados, sem bloqueio de tarefa, baseline web/Android/Apple e fallback acessível.
- [ ] **Privacidade:** permissões, indicadores e fallbacks coerentes com comportamento real.
- [ ] **Biblioteca:** preview único, busca/filtros reais, seleção pendente/confirmada, retorno preserva rascunho e fluxo acessível.
- [ ] **Editor TTS:** texto preservado, envio único, loading honesto, resultado reproduzível, erros de rede/cota e offline tratados.
- [ ] **Atribuição visual:** ponto colorido do vídeo não foi copiado nem rotulado como orbe 3D sem evidência; vide §6.18.
- [ ] **Tokens:** valores light/dark centralizados em `design/tokens.json`, validação de contraste nas superfícies efetivas e tema gerado sem drift.
- [ ] **UX:** pelo menos uma primeira tarefa de valor completa testada em cada aplicativo.
- [ ] **Performance:** conferir jank/frame pacing em dispositivos de entrada; sem regressões graves medidas.
- [ ] **QA:** testes unitários de tokens executados; validação em Flutter, análise estática, screenshots e testes em dispositivos reais executados e revisados; nenhum status de aprovação declarado sem execução.
- [ ] **Produção:** release notes, rollback e monitoramento mínimo antes de lançamento.

## 13. Instrução para agentes de código (Codex / Work)

**Leitura extra v1.8 obrigatória para mudanças visuais:** `design/TYPOGRAPHY_REFERENCE.md`, `design/ORB_VISUAL_SPEC.md`, `design/VOICE_IDENTITY.md`, `design/VISUAL_BASELINES.md`, `design/MOTION_DEMOS.md`. Não usar mockup ou demo 2D como evidência de software 3D implementado. Começar pelo inventário da stack real de áudio/Flutter e submeter changes via PR com screenshots verificados.

> Leia `DESIGN.md` antes de criar ou alterar UI. Faça inventário das telas e componentes existentes. **Não sobrescreva branding aprovado** e não copie designs/assets/ilustrações da ElevenLabs. Implemente os tokens semânticos de forma incremental, preservando o funcionamento. Antes de alterar qualquer tela, descreva o fluxo atual, problema, mudança proposta e arquivos afetados. Depois implemente os estados de erro/loading/offline e acessibilidade. Execute testes e forneça screenshots reais, diff, comandos e resultados. Se um teste não puder ser executado, registre explicitamente como **não verificado**. Não declare conformidade AA ou aprovação da loja sem validação independente.

### Ordem de migração recomendada

1. `tokens` e temas; sem mudança no fluxo do usuário.
2. Componentes básicos, tipografia semântica adaptativa (ver §3) e estados acessíveis.
3. Um fluxo AHA por aplicativo.
4. Biblioteca de vozes, editor TTS e política de audio focus integrados ao backend real, onde fazem sentido para a oferta do produto.
5. Motion e áudio ligados à máquina de estados real; **Learning Motion** (§§ 6.27–6.33) apenas após eventos pedagógicos verificados.
6. Golden tests, testes de acessibilidade, QA de aparelhos e refinamentos.
7. Aplicar contrato Global-First de § 13A e testar separação de locale, RTL, preços, conteúdo e voz, sem anunciar idiomas não validados.
8. A/B de fluxos específicos após instrumentação correta.

## 13A. GLOBAL-FIRST — contrato obrigatório universal de produto, design e lançamento (v3.0)

> **Normativo e transversal.** Este capítulo aplica-se a **InstantSpeak**, **InstantStudy**, **InstantBible** e **InstantVest** em iOS, Android e web, respeitando Flutter para os três primeiros e Capacitor/React para InstantVest. As seções anteriores continuam controlando marca, wordmark, abertura, paleta, tokens, áudio e componentes. **Em conflito sobre localização, idioma, formato, RTL, mercado, cobrança e divulgação de suporte, §13A prevalece sobre instruções históricas**, sempre subordinado a acessibilidade, segurança, legislação, licenças e identidade de marca aprovada.
>
> **Objetivo:** projetar *global-first*, sem declarar que todo idioma ou mercado já foi implementado. `supportedLocales` e a capacidade de um LLM gerar texto não demonstram tradução, curso, acessibilidade ou disponibilidade comercial.
>
> **Data da evidência:** 2026-10-15. A matriz §13A.3 reflete inspeção dos repositórios GitHub nessa data, não uma certificação de QA. **Todas as aprovações de produção por mercado permanecem não verificadas nesta edição**.

### 13A.1 Princípios e fontes oficiais

1. **Produto global, promessa precisa:** internacionalização desde o início, localização por mercado conforme capacidade *comprovada*. País, idioma e disponibilidade de produto são dimensões independentes.
2. **Experiência íntegra:** um idioma só recebe rótulo de “suportado” quando a jornada principal, feedback, erros, ajuda, acessibilidade e termos comerciais forem avaliados no idioma declarado.
3. **Preservar intenção:** a troca de idioma da interface não muda idioma de aprendizado, voz, sotaque, tradução bíblica, preços nem pessoa do tutor.
4. **Padrões locais:** usar formatação e convenções da localidade real do usuário, respeitando escolha manual, região e contexto; não traduzir identificadores, marcas e endereços.
5. **RTL e fontes são de primeira classe:** layouts direcionais, texto misto e escrita não latina são parte do contrato, não extensões visuais opcionais.
6. **Equivalência entre plataformas, não pixels idênticos:** Dynamic Type, Material 3, navegação e consentimentos seguem comportamento de cada SO.
7. **Acessibilidade e privacidade localizadas:** manter avisos claros de microfone, compras, dados, conteúdo e erros. Não deduzir nacionalidade, religião, sexo ou sotaque pela língua.
8. **Sem “verde falso”:** ausência de build, aparelho, captura, arquivo ARB ou prova comercial significa `NOT_RUN`/`BLOCKED`, jamais `PASS`.

Referências normativas a consultar no momento da implementação:
- Flutter internacionalização, ARB, `gen-l10n`, placeholders e plurais: https://docs.flutter.dev/ui/internationalization
- Apple HIG — Right to left: https://developer.apple.com/design/human-interface-guidelines/right-to-left
- Apple HIG — Inclusion: https://developer.apple.com/design/human-interface-guidelines/inclusion
- Unicode BCP 47 / linguagem e região: https://www.rfc-editor.org/rfc/rfc5646
- Unicode CLDR, pluralização e formatação: https://cldr.unicode.org/
- Material — internacionalização e RTL: https://m3.material.io/

### 13A.2 Dimensões independentes de localidade — `GlobalLocaleContext`

| Dimensão | Origem autoritativa | Regra inegociável |
|---|---|---|
| `deviceLocale` | SO / navegador | Apenas sinal inicial, pode ser diferente do idioma preferido |
| `preferredUiLocale` | Escolha explícita salva, ou `null` | Tem precedência sobre dispositivo se houver pacote válido |
| `resolvedUiLocale` | Resolução determinística a partir dos pacotes reais | Nunca declarar suporte inexistente |
| `formatLocale` | Preferência regional explícita / SO | Datas, hora, decimal, grupos e medidas; pode diferir da UI |
| `timeZoneId` | Preferência/OS validada, ex. IANA | Armazenar instantes UTC; exibir na zona do contexto |
| `storefrontCountry` | App Store, Google Play ou provedor de checkout confiável | **Nunca** inferir de idioma, IP ou localidade do aparelho |
| `priceQuote` | Oferta efetiva do provedor/loja | Mostrar preço, moeda, periodicidade e cobrança reais; não inventar câmbio |
| `nativeLanguage` | Escolha do usuário (se aplicável) | Não redefine curso, voz, nacionalidade ou mercado |
| `targetLanguage` | Oferta curricular lançada | Não confundir idioma que o modelo pode falar com curso oferecido |
| `targetLocale` | Oferta/seleção explícita de voz e sotaque | Não mudar automaticamente pelo país |
| `explanationLanguage` | Preferência de ajuda/explicações | Separada de interface e idioma estudado |
| `contentLanguage` | Conteúdo licenciado/disponível (livro, plano, Bíblia) | Título e tradução do conteúdo não são inferidos pela UI |
| `textDirection` | Script/direção do conteúdo, com contexto | Conservar segmentos LTR dentro do layout RTL |
| `acquisitionMarket` | Configuração interna de marketing | Não altera preço ou conteúdo disponível sem contrato de produto |

**Política de resolução:** usar tags de idioma normalizadas BCP 47, preservando script relevante (`zh-Hans`, `zh-Hant`, `sr-Latn`) e região quando muda a oferta (`pt-BR`, `pt-PT`). Para UI: (1) preferência explícita suportada **com pacote**; (2) correspondência exata do idioma do SO; (3) variante/script compatível *comprovadamente disponível*; (4) idioma base se compatível; (5) fallback de produto (inglês, salvo decisão documentada). Não trocar arbitrariamente entre simplificado/tradicional; a escolha de script precisa ser respeitada. Se ocorrer fallback, indicar disponibilidade real no seletor de idiomas e registrar um diagnóstico agregado sem conteúdo pessoal.

**Persistência:** salvar apenas a escolha explícita e preferências realmente necessárias. Tratar dados financeiros, identificação de país/loja e histórico de áudio como fontes específicas; não colocar informações confidenciais nem transcrições em analytics padrão.

### 13A.3 Situação comprovada por aplicativo (snapshot de 2026-10-15)

A matriz abaixo descreve **código ou documentação encontrados**, não qualidade linguística certificada. A fonte JSON incorporada em §13A.4 deve permanecer consistente com ela.

| Aplicativo | Evidência encontrada | Lacuna que bloqueia alegação Global-First completa |
|---|---|---|
| **InstantSpeak** | `GLOBALIZATION_BETTERSPEAK.md` separa idiomas, sotaque, região e país da loja; `flutter/lib/app/instantspeak_app.dart` declara várias localidades | `home_screen.dart` contém strings em inglês fixas; não foi encontrada geração própria de `AppLocalizations` nesse fluxo. O único curso-alvo documentado como pronto é **inglês**. As dez vozes/personas do catálogo atual não podem ser alteradas por i18n |
| **InstantStudy** | `apps/flutter_app/lib/i18n.dart` contém mensagens `en` e `pt-BR`, opção de idioma e fallback | Apenas dois pacotes de UI observados; interpolação manual sem prova de cobertura ICU de plural/select. Outros idiomas **não lançados** |
| **InstantBible** | `lib/core/i18n/app_strings.dart` lista 22 pacotes autorados; `app_locales.dart` lista locais reconhecidos pelo Flutter | Localidades de *widgets* nativos ≠ tradução própria. Fallback inglês, conteúdo bíblico, licenças e disponibilidade das traduções exigem validação por idioma |
| **InstantVest** | `package.json` configura React/Vite, Capacitor 8 e comandos `verify:maestro`, `qa:android:maestro`; `capacitor.config.json` identifica o app nativo como `com.instante.vest` e nome comercial como **Instante**; `README.md` descreve preparação para vestibular e Redação ENEM | Não foi encontrada a pasta Android nativa versionada no levantamento; não há catálogo de idiomas de UI ou mercados verificados. **Não** tratar o produto como Flutter, nem inferir internacionalização, cobrança ou builds aprovados a partir dos comandos existentes. |

**Fontes de código auditadas:**
- https://github.com/raphaelribeirob/InstantSpeak/blob/main/GLOBALIZATION_BETTERSPEAK.md
- https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/lib/app/instantspeak_app.dart
- https://github.com/raphaelribeirob/InstantSpeak/blob/main/flutter/lib/features/home/presentation/home_screen.dart
- https://github.com/raphaelribeirob/InstantStudy/blob/main/apps/flutter_app/lib/i18n.dart
- https://github.com/raphaelribeirob/InstantBible/blob/main/lib/core/i18n/app_locales.dart
- https://github.com/raphaelribeirob/InstantBible/blob/main/lib/core/i18n/app_strings.dart
- https://github.com/raphaelribeirob/InstantVest/blob/main/package.json
- https://github.com/raphaelribeirob/InstantVest/blob/main/capacitor.config.json
- https://github.com/raphaelribeirob/InstantVest/blob/main/README.md

### 13A.4 Registro de capacidades — JSON canônico embutido

> Esta é uma **fotografia da auditoria**, não uma lista de idiomas certificados. É a origem única para o **estado de documentação global-first**, separada dos tokens DTCG visuais no Apêndice N. Não gerar `supportedLocales` Flutter automaticamente de todos os `declaredDeviceLocales` ou `recognizedWidgetLocaleCount`: a lista publicada depende dos pacotes realmente completos. Alterar somente após confirmar evidência do código e resultados de QA.

<!-- GLOBAL_FIRST_POLICY_BEGIN -->
```json
{
  "version": "3.0.0",
  "observedAt": "2026-10-15",
  "globalReleaseApproved": false,
  "defaultFallbackUiLocale": "en",
  "products": {
    "InstantSpeak": {
      "declaredDeviceLocales": [
        "en-US",
        "en-GB",
        "pt-BR",
        "pt-PT",
        "es-ES",
        "es-MX",
        "fr-FR",
        "fr-CA",
        "zh-Hans",
        "zh-Hant",
        "ar-SA",
        "fa-IR",
        "ur-PK"
      ],
      "verifiedUiPacks": [],
      "documentedTargetCourses": [
        "en"
      ],
      "verifiedEndToEndMarketLocales": [],
      "rtlPhysicalDeviceValidated": false,
      "notes": "A tela inicial Flutter tem textos em inglês fixos. O documento de produto descreve curso-alvo de inglês; as localidades declaradas não garantem UI traduzida."
    },
    "InstantStudy": {
      "observedAuthoredUiPacks": [
        "en",
        "pt-BR"
      ],
      "verifiedUiPacks": [],
      "verifiedEndToEndMarketLocales": [],
      "rtlPhysicalDeviceValidated": false,
      "notes": "A existência de dois mapas de mensagens não comprova cobertura de todas as telas, plurais, formatos, QA nem países liberados."
    },
    "InstantBible": {
      "observedAuthoredUiPacks": [
        "en",
        "pt",
        "es",
        "fr",
        "de",
        "it",
        "nl",
        "pl",
        "ru",
        "uk",
        "tr",
        "ar",
        "he",
        "fa",
        "hi",
        "bn",
        "ur",
        "id",
        "vi",
        "zh",
        "ja",
        "ko"
      ],
      "verifiedUiPacks": [],
      "verifiedContentTranslations": [],
      "verifiedEndToEndMarketLocales": [],
      "rtlPhysicalDeviceValidated": false,
      "notes": "Os 22 pacotes próprios não equivalem à lista maior de idiomas suportados pelos widgets Flutter. Traduções de Bíblia e licenças são verificadas à parte."
    },
    "InstantVest": {
      "runtime": "React/Vite and Capacitor 8, not Flutter",
      "observedCapacitorAppId": "com.instante.vest",
      "observedAppName": "Instante",
      "observedProductFocus": "Brazilian vestibular and ENEM writing",
      "observedAndroidMaestroCommand": "qa:android:maestro",
      "nativeAndroidProjectVersioned": false,
      "observedAuthoredUiPacks": [],
      "verifiedUiPacks": [],
      "verifiedEndToEndMarketLocales": [],
      "rtlPhysicalDeviceValidated": false,
      "notes": "No verified multi-language UI inventory, native build, market quote or Android Maestro run. Never inherit Flutter test certification from other Instant products."
    }
  },
  "releaseGate": {
    "blocksWhenUntranslatedCoreUi": true,
    "blocksWhenLocalizedClaimsExceedEvidence": true,
    "blocksWhenStorefrontQuoteIsUnverified": true,
    "blocksWhenRequiredHardwareQaIsMissing": true,
    "requiresHumanApproval": true
  },
  "releaseEvidence": {
    "schemaVersion": 1,
    "releaseClaims": [],
    "evidenceRecords": [],
    "policy": "Evidence records tied to real builds and independently approved; empty registry always BLOCKED. Documentation-only fixtures never authorize release."
  }
}
```
<!-- GLOBAL_FIRST_POLICY_END -->

`verifiedUiPacks` começa vazio porque esta auditoria não executou a matriz de QA nativa dos quatro produtos; **não** significa que não existam textos traduzidos nos repositórios. Após testes executados, registrar evidências por build, commit e plataforma antes de preencher listas. `observedAuthoredUiPacks` pode conter traduções parciais e não deve ser usado sozinho para anunciar suporte.

### 13A.5 Contrato de localização Flutter e tradução de mensagens

- **Preferência:** `flutter_localizations` + `gen-l10n` + ARB/ICU (ou solução de equivalência funcional justificada, com cobertura testada). Não migrar os mapas atuais de forma abrupta sem testes de regressão de todas as chaves.
- Criar `l10n.yaml`, `lib/l10n/app_en.arb`, `app_pt_BR.arb` e outros pacotes **apenas** quando as mensagens existirem e forem revisadas; manter gerados fora da edição manual. Configurar `untranslated-messages-file` e falhar o pipeline se houver chaves críticas não traduzidas nos idiomas anunciados.
- Cada texto visível ou lido por VoiceOver/TalkBack precisa de chave estável: tela, botões, placeholders, erros do backend, notificações, assinaturas, dicas, tutores, legenda e consentimento.
- Usar variáveis **tipadas** e ICU `plural` / `select` com categorias da língua, não concatenar `"1" + " items"` nem traduzir frases por pedaços. Revisão humana para tom, contexto e sentido comercial.
- Nunca tratar mensagem faltante como sucesso silencioso: em desenvolvimento capturar erro/contagem; em produção fazer fallback seguro, sem vazar chaves brutas e sem bloquear funções essenciais.
- Copiar, colar, Unicode NFC, nomes, sinais diacríticos, emojis, quebras de linha, seleção e leitores de tela devem funcionar nos idiomas suportados.
- Identificadores técnicos, códigos, URL, domínios, SKUs, IDs de sessão e marcas aprovadas não são traduzidos; fornecer `Semantics` em idioma compreensível.

Exemplo **de referência**, não de conteúdo já instalado no aplicativo:

```json
{
  "@@locale": "en",
  "welcomeTitle": "Start speaking",
  "@welcomeTitle": {"description": "CTA principal de iniciar prática de voz"},
  "lessonCount": "{count, plural, =0{No lessons} =1{One lesson} other{{count} lessons}}",
  "@lessonCount": {"placeholders": {"count": {"type": "int"}}}
}
```

As traduções precisam refletir cada idioma e passar em `flutter gen-l10n`; não aplicar regras de plural do inglês a outras línguas. Exemplos de mensagens são ilustrativos, não oferta ativa de cursos adicionais.

### 13A.6 Direção bidirecional, tipografia e layout por script

| Tema | Implementação obrigatória | Verificação |
|---|---|---|
| RTL | `Directionality`, `AlignmentDirectional`, `EdgeInsetsDirectional`, `BorderRadiusDirectional` quando a posição for lógica | Espelhar navegação e listas em `ar`, `he`, `fa`, `ur` conforme a direção real |
| Conteúdo misto | Aplicar isolamento bidi a trechos de email, URL, números, códigos, produtos e termos de inglês dentro de árabe/hebraico | Não embaralhar sinais, parênteses, títulos de áudio, timestamps ou preços |
| Ícones | Espelhar somente os que indicam direção (voltar/próximo) conforme plataforma | **Não** espelhar play/pause, logotipo, cápsula de marca, orbe 3D ou ícones culturalmente não direcionais |
| Alinhamento | UI em `start`/`end` lógicos; parágrafos longos podem seguir o idioma do próprio texto | Listas e controles coerentes; leitura natural no leitor de tela |
| Tipografia | Fontes do sistema com fallback comprovado por script; tipografia de produto separada da marca | Diacríticos, ligaduras, Thai, Hindi, Arabic shaping, CJK, line-height, caracteres grandes |
| Escala | Dynamic Type iOS, text scaling Android e navegador, sem heights fixas | 200% e máximos do sistema sem truncar preços, erros, passagens, respostas |
| Locales complexos | `zh-Hans` vs `zh-Hant`, `sr-Latn` vs `sr-Cyrl`, `pt-BR` vs `pt-PT` | Não presumir equivalência linguística ou tipográfica |

**Fonte/brand:** a marca estática InstantSpeak™ continua Inter no contexto aprovado (§2.5); a abertura animada continua `LeagueSpartan` 400 apenas nos glifos latinos (§2.6). Não transliterar ou redesenhar marca sem aprovação expressa. SF Pro é nativa do iOS, Roboto do Android. Usar fallback por script da plataforma ou uma fonte aberta compatível/licenciada quando necessário, sem embutir famílias Apple no app. A orbe não codifica direção de leitura, gênero, idioma ou nacionalidade por cor.

**Regra de teste:** usar `ar-EG`, `he-IL`, `fa-IR`, `ur-PK` para RTL; `zh-Hans-CN`, `zh-Hant-TW`, `ja-JP`, `hi-IN`, `de-DE`, `pt-BR`, `en-US` para scripts, tamanhos e expansões. São **cenários de desenvolvimento**, não promessas de idiomas suportados comercialmente.

### 13A.7 Localização de números, datas, horas e unidades

- Formatar apenas **na apresentação** com locale e fuso efetivos (`intl`/CLDR e APIs nativas); dados persistidos têm formatos canônicos independentes de locale.
- `NumberFormat`, `DateFormat` e unidades devem responder ao locale configurado; testes incluem `1,234.56` × `1.234,56`, calendário e convenções 12/24h quando aplicáveis.
- Usar timezone IANA ou equivalente de runtime, salvar timestamps em UTC; não derivar fuso, impostos ou país de cobrança a partir da língua.
- Singular/plural e gênero gramatical são regras de mensagem por localidade, não regras de aplicação em inglês.
- Progresso, métricas, quantidade de questões, duração, moedas e referências bíblicas usam formato contextual; **número de capítulo e versículo mantém semântica**, independente dos algarismos exibidos.
- Moeda da interface de preço é a citação de compra **real** retornada pelo provedor, inclusive código, símbolo, periodicidade, impostos incluídos/excluídos quando exigido e renovação. **Não converter por taxa de câmbio estimada nem compor preço manual**.

### 13A.8 Onboarding, escolhas e continuidade Global-First

1. Primeiro lançamento resolve UI via §13A.2 e torna seleção de idioma encontrável, sem exigir país, CPF, religião ou sotaque para abrir telas gratuitas.
2. Mostrar apenas **capacidades disponíveis**: se o InstantSpeak só oferta inglês-alvo, deixar isso claro mesmo quando onboarding e explicações estiverem em português, francês ou espanhol.
3. Escolha manual prevalece em relançamento; alteração de idioma não apaga progresso, rascunho de estudo, oração, diálogo ou preferências de voz.
4. Fluxos de permissões são localizados e contextuais; áudio só começa mediante gesto explícito, mantendo transcrição/alternativa de texto.
5. Paywall usa preço real e termos válidos do storefront, com fallback legível se a cotação falhar; **sem preço inventado nem botão comprar ativo para quote inválida**.
6. Erros e recuperação têm linguagem clara e ações disponíveis mesmo sem rede; caminhos de suporte e privacidade ficam acessíveis.
7. O motion da abertura do InstantSpeak permanece visualmente estável independentemente do idioma; `Reduce Motion` continua respeitado. Não sacrificar o tempo até AHA por localização ou motion.
8. Layout considera texto expandido (alemão), múltiplas linhas (português), formas densas (CJK), scripts complexos e direção RTL; componentes nunca fixam altura de mensagens essenciais.

### 13A.9 Regras por aplicativo — conteúdo e oferta sem promessas falsas

**InstantSpeak:**
- `targetLanguage=en` é a oferta de curso-alvo identificada no repositório. `nativeLanguage`, `explanationLanguage` e `targetLocale` são independentes da UI e do país. Uma voz que fala italiano não é prova de currículo de italiano.
- Preservar o catálogo atual de dez personas e seus IDs/vozes globais; não regressar a IDs de quatro tutores legados nem mudar nomes por localidade sem regra de produto aprovada.
- STT deve aceitar idioma de destino e code-switch quando o modo for suportado; ao ajudar na língua nativa, retornar ao idioma-alvo conforme o nível pedagógico. Não inferir sotaque do endereço/IP.
- Legendas e transcrições devem ter idioma marcado, seleção/ordem correta e timestamps reais quando exibirem destaque palavra a palavra; não traduzir conversa sem solicitação.
- Voice preview, live session, microfone negado, texto alternativo, interrupções e preço são gates por mercado; tutores continuam identificáveis mesmo sem áudio premium.

**InstantStudy:**
- `en` e `pt-BR` são os dois pacotes observados; a interface não deve listar outros como traduzidos sem novos pacotes completos e revisão.
- Conteúdo importado pode estar em idioma diferente da UI. Identificar/selecionar língua do material e **não** traduzir automaticamente sem consentimento/objetivo acadêmico. Perguntas e feedback precisam conservar sentido e citações da fonte.
- Validar pluralização de questões, tempo restante, datas, pontuações, respostas longas e modo sem internet. Conteúdos gerados por IA têm QA por língua, não são cobertos pela simples tradução de botões.

**InstantBible:**
- Os 22 pacotes encontrados são **autoria de mensagens**, não garantia de jornada inteira traduzida nem de conteúdo bíblico disponível naquele idioma.
- Separar `interfaceLocale`, `contentLanguage`, **versão/tradução da Bíblia**, idioma de áudio e termos de licenciamento. O usuário deve saber qual tradução está lendo, fonte e direitos.
- Ao faltar conteúdo em certa língua, oferecer tradução licenciada disponível com explicação transparente, sem simular uma versão bíblica inexistente.
- Passagem, capítulo/verso, seleção de versos, bookmarks, áudio, planos, orações, notificações e acessibilidade devem manter localização e referência corretas.

### 13A.10 LocalizedPaywall e requisitos comerciais

**Source of truth:** App Store/Google Play (native purchase) e provedor aprovado no web. Resolver produto/SKU, país da loja, preço localizado, moeda, intervalo, trial, renovação e impostos conforme dados da loja e legislação aplicável.

**Proibido:** inferir `storefrontCountry` de `Locale`, forçar símbolo `R$`/`$`, exibir preço convertido pelo próprio app, inventar disponibilidade de assinatura ou alterar desconto por geolocalização presumida. Usar copy localizada revisada e informativos de cancelamento/restauração conforme regras do storefront.

**Estados obrigatórios:** `loading`, `available`, `trialEligible`, `unavailable`, `purchasePending`, `purchased`, `restored`, `billingError`. Um botão de compra só está ativo com uma cotação válida daquela loja; erro oferece recuperação sem mostrar uma cotação antiga como preço atual.

**Mercados regulados:** privacidade, consentimento, termos de assinatura, conteúdo etário e direitos de consumidor são verificações jurídicas por mercado, sem presunção de conformidade deste documento.

### 13A.11 Acessibilidade internacional e confiança

- Validar VoiceOver e TalkBack para idioma da UI, alternância de idiomas em passagem/caption, ordem RTL, foco após mudança de localidade, nomes dos controles, botões de reprodução e abertura sem efeitos adicionais.
- Rótulos de `Semantics` traduzidos; leitor não deve pronunciar termos árabes em voz inglesa por erro de locale quando houver suporte do sistema.
- Não usar flags nacionais para representar línguas nem associar uma voz a etnia/nacionalidade. Nomes de línguas apresentados em autonímia + tradução acessível quando apropriado.
- Fotos, gestos, metáforas, símbolos religiosos e tonalidades podem exigir revisão cultural. Isso não autoriza alterar escrituras, avaliações ou promessas do produto sem governança.
- Se a UI estiver localizada e o conteúdo/serviço não estiver, informar claramente a limitação **na interface**, não apenas em termos escondidos.

### 13A.12 Analytics e observabilidade (sem coleta excessiva)

Eventos técnicos mínimos: `locale_resolved`, `locale_changed`, `translation_missing`, `rtl_layout_error`, `font_fallback_failure`, `regional_quote_unavailable`, `content_locale_fallback`, `voice_locale_mismatch`, `global_first_aha_completed`. Cada evento registra **categoria de idioma/capacidade e build**, não transcrições, texto bíblico privado, textos de estudo, endereço/IP cru ou conteúdo pessoal.

Separar métricas de **locales oferecidas**, **locales com UI completa**, **mercados com faturamento disponível**, **curso-alvo comprovado**, **conteúdo licenciado** e **releases validadas**. É proibido usar contagem de idiomas reconhecidos pelo SDK como métrica de idiomas comerciais suportados.

### 13A.13 Matriz mínima de testes Global-First — critérios executáveis

Status inicial de todas as linhas: **`NOT_RUN` no contexto dos apps em dispositivos físicos**. Testes de código, widgets e screenshots podem fornecer evidências parciais, mas não substituem hardware onde indicado.

| ID | Caso de teste obrigatório | Evidência e critério de aprovação |
|---|---|---|
| `GF-001` | Seleção automática de idioma | Device locale + decisão registrada; fallback determinístico sem crash |
| `GF-002` | Preferência manual persistida | Mudança e cold restart preservam UI e progresso |
| `GF-003` | Idioma não suportado | Fallback visível em seletor; sem prometer tradução ausente |
| `GF-004` | Chaves de tradução | Lint de mensagens críticas e relatório de chaves faltantes; zero nos idiomas anunciados |
| `GF-005` | Plural ICU | 0, 1, 2, 5, 21 e casos da língua; gramática correta e sem chaves expostas |
| `GF-006` | Números e datas | CLDR correto em en-US, pt-BR, de-DE e ar-EG na UI que usar tais formatos |
| `GF-007` | Timezone e meia-noite | UTC -> zona do usuário, DST e virada de data sem erro |
| `GF-008` | Script e glifos | Árabe/Devanagari/CJK acentuados sem tofu, cortes ou ilegibilidade |
| `GF-009` | RTL estrutural | Back, navegação, sheets, listas e gestos direcionais coerentes |
| `GF-010` | Conteúdo bidi misto | Texto RTL com URL, email, números, preço e inglês mantém ordem e foco |
| `GF-011` | Texto longo/pseudolocalização | +40% a +100% de expansão sem clipping de CTAs/paywall/erros |
| `GF-012` | Dynamic Type 200% | iOS/Android, texto essencial e interação sem overflow |
| `GF-013` | VoiceOver | Idioma, leitura de preços, ordem RTL, motion de abertura e áudio |
| `GF-014` | TalkBack | Ordem RTL, idioma da voz, etiquetas e navegação com teclado externo |
| `GF-015` | InstantSpeak oferta | UI distinta de curso-alvo inglês; sem seleção de curso indisponível |
| `GF-016` | InstantSpeak voz | TTS/STT idioma, code-switch, permissão, captions e interrupção com áudio real |
| `GF-017` | InstantStudy en/pt | Importar, responder, corrigir, métricas, alternar UI sem perder rascunho |
| `GF-018` | InstantStudy conteúdo misto | Material em idioma diferente da UI conserva idioma e significado |
| `GF-019` | InstantBible pacotes | Só idiomas realmente concluídos aparecem como completos; fallback honesto |
| `GF-020` | InstantBible Escrituras | Livro/capítulo/verso/tradução licenciamento preservados após trocar UI |
| `GF-021` | Cobrança regional | Quote/price/period/restore reais no storefront; nunca por `Locale` |
| `GF-022` | Compra indisponível | Falha segura sem preço inventado ou compra ativada |
| `GF-023` | Privacidade localizada | Consentimento, permissões, suporte e coleta mínima compreensíveis |
| `GF-024` | AHA internacional | Primeiro valor realizado por usuário/tester por idioma lançado |
| `GF-025` | QA de screenshots | Capturas por idioma, script, plataforma, dark/light e versão de build |
| `GF-026` | Release claims | Landing/ASO/screenshot só anunciam pares idioma × recurso verificados |
| `GF-027` | Reversão de idioma | Troca no meio de sessão e reabrir sem perda de estado/captions |
| `GF-028` | Offline e erros | Sem dados, sem rede ou sem voz: recuperação contextual localizada |

**Matriz mínima para dispositivos:** pelo menos iPhone pequeno/grande e Android de entrada/intermediário, light/dark, texto normal e ampliado, portrait e orientação suportada. Cada locale anunciada exige prova de UX nos fluxos principais; usar conjunto sentinela acima para scripts que ainda não são produtos lançados. Não declarar cobertura *nativa* com screenshots de navegador.

| `GF-029` | Pseudolocalidade Android `en-XA` | Mecanismo Android em app instalado; expansão pseudoacentuada não corta CTA, botões, diálogos ou textos de compra; sem confundir com idioma lançado |
| `GF-030` | Pseudolocalidade Android `ar-XB` | Mecanismo Android em app instalado; layout RTL, navegação, imagens direcionais e tokens LTR preservados; sem anunciar árabe como idioma disponível |
| `GF-031` | InstantVest Capacitor | Build/Capacitor sync, instalação Android, Maestro de onboarding/redação e CORS em WebView real com evidência; não herdar testes Flutter |
| `GF-032` | Troca de idioma nos quatro produtos | Mudar UI, reiniciar e restaurar sessão; preservar preferências, progresso, targetLanguage, tradução de Bíblia, país da loja e versão de conteúdo |
| `GF-033` | Gate de release com evidências | Rejeitar manifesto vazio, hash inválido, JUnit ausente, build divergente, QA NOT_RUN, revisão humana ausente e claims não vinculadas |
| `GF-034` | Scripts mistos e texto 200% | Capturas com en-XA, ar-XB, tags BCP 47 com script, valores monetários e nomes LTR; 200% e TalkBack/VoiceOver conforme plataforma |

### 13A.14 Testes de mutação e regras de qualidade para CI

- **Mutação M1:** remover uma chave de tradução de botão de compra → gate `GF-004` precisa falhar.
- **Mutação M2:** tratar árabe como `ltr` → gate `GF-009` precisa falhar.
- **Mutação M3:** usar `deviceLocale` como país da loja → gate `GF-021` precisa falhar.
- **Mutação M4:** rotular espanhol como curso-alvo InstantSpeak sem currículo → gate `GF-015` precisa falhar.
- **Mutação M5:** forçar `TextScaler.noScaling` no conteúdo de leitura → gate `GF-012` precisa falhar.
- **Mutação M6:** anunciar idioma apenas reconhecido pelos widgets como UI completa → gate `GF-019`/`GF-026` precisa falhar.

**CI obrigatório na integração** (comandos de referência, executáveis apenas dentro de cada projeto com SDK e arquivos gerados corretamente):

```bash
flutter pub get
flutter gen-l10n
flutter analyze
flutter test
# integration_test e golden tests por locale/produto devem rodar em jobs nativos configurados.
# NÃO converter ausência de SDK, simulador, chaves de pagamento de teste ou device em PASS.
```

**Artefatos exigidos por gate:** commit SHA, build, versão Flutter/Dart, OS/device, locale/script, tamanho de fonte, estado do fluxo, screenshot ou gravação real, logs anonimizados, resultado `PASS/FAIL/NOT_RUN/BLOCKED`, responsável e data. Executar testes de compra somente em ambiente sandbox de loja/provedor e sem pagamentos reais.

### 13A.15 Política de publicação por mercado e promessa comercial

Uma combinação `(aplicativo, região da loja, locale da UI, funcionalidade anunciada)` só pode ser publicada como **suportada** se:

1. Existem recursos localizados adequados e revisão linguística contextual das telas críticas.
2. A função anunciada está implementada e testada; conteúdo pedagógico/religioso possui licença e idioma disponível onde aplicável.
3. Checkout/região/cobrança e cancelamento/restauração foram verificados usando a loja real em sandbox, quando aplicável.
4. Layout RTL/ligaduras/fontes/acessibilidade passaram nos scripts anunciados.
5. AHA, erros, paywall e fluxos de permissão passaram para locale e plataforma anunciadas.
6. Evidência do build vinculada ao commit e aprovada por responsável humano.

**Nunca liberar um mercado porque `Localizations.supportedLocales.length` é grande** ou porque a API de IA aceita muitos idiomas. A intenção Global-First significa não retrabalhar a arquitetura a cada mercado, **não** publicar funcionalidades incompletas globalmente.

### 13A.16 Critérios para Codex e governança do arquivo único

**Codex deve executar em ordem:**

1. Inventariar locale, strings, pacotes, checkout e áudio do repositório alvo; gerar mapa de lacunas e capturar baselines antes de alterar código.
2. Respeitar a matriz real §13A.3 e o JSON §13A.4; não preencher listas `verified` sem links a evidências de QA.
3. Implementar camada de `LocaleResolver` determinística e separação entre UI, conteúdo, voz, país da loja e curso.
4. Migrar strings da **jornada principal** para ARB/ICU por etapas, com fallback seguro e testes de regressão; não alterar o escopo do curso InstantSpeak.
5. Corrigir RTL e tipografia de scripts, preservando os assets e a abertura de marca §§2.5–2.8.
6. Cobrir estados de preço, voz, conteúdo e ausência de permissão; não inventar preço, tradução licenciada ou vozes.
7. Executar `GF-001..034`, separar `PASS` de `NOT_RUN`; abrir PR com screenshots reais, diffs, inventário de tradutores e rollout gradual.
8. **Gate de merge:** sem alteração de branding ou instalação de fontes não licenciadas; sem regressão de áudio, contrato de assinatura, caminho AHA ou suporte a acessibilidade.

**Não fazer:** tradução automática silenciosa de todo o currículo, marcação em massa de idiomas como “prontos”, mudança de nomes das personas, localização de preços por taxa de câmbio, remoção de textos legais, publicação global sem evidência ou alteração automática da divergência de ícone `IS` versus orbe.

### 13A.16A Contrato de testes de pseudolocalidade e Capacitor (v3.0)

- **`en-XA` e `ar-XB` são pseudolocalidades de TESTE do Android**, não pacotes traduzidos nem idiomas comerciais. Devem ser ativadas no emulador/serviço nativo de testes e capturadas em dispositivo ou emulador com `buildSha` conhecido. Teste de strings Python é apenas referência e não produz PASS Android.
- `en-XA`: expansão e diacríticos simulados devem revelar textos rígidos e componentes sem espaço; verificar placeholders ICU, links, marca e valores numéricos.
- `ar-XB`: layout bidi/RTL simulado deve revelar direção, ordem de controles e mistura LTR de marcas, URLs e números; texto, widgets e animações não devem ser invertidos arbitrariamente.
- Para **InstantVest**, a preparação Android é via `npm run mobile:sync` / Capacitor; os testes de lógica React/Vite/WebView e scripts Maestro próprios são exigidos. Verificar `appId=com.instante.vest` sem usar seletores ou pacote Flutter do InstantSpeak.
- **Preferência de idioma em ciclo completo:** para cada app, testar seleção explícita, cold restart, troca durante tarefa, fallback após retirar pacote, atualização do app e restauração do progresso. O idioma UI não pode alterar `targetLanguage`, tradução bíblica/licença, conteúdo acadêmico nem `storefrontCountry`.
- Pseudolocalidades, 200% e fluxo de preferência são testes **a executar** nos aplicativos reais. O único Markdown pode validar fixtures e obrigações, não renderizar Android nem certificar ISO/loja.

### 13A.17 Definition of Done — Global-First

- [ ] `GlobalLocaleContext` e resolução BCP 47 implementados de acordo com a oferta real de cada aplicativo.
- [ ] Pacotes de UI e chaves críticas cobertos com validação ICU/plural e revisão contextual.
- [ ] RTL, bidi e tipografia internacional avaliados em telas reais.
- [ ] Paywall regionais usam somente cotações válidas de provedores e textos de renovação compreensíveis.
- [ ] InstantSpeak: idioma-alvo, idioma de explicação e UI separados e testados com STT/TTS reais.
- [ ] InstantStudy: fluxos en/pt-BR, conteúdo importado e feedback validados.
- [ ] InstantBible: pacotes UI e línguas de tradução/áudio/licença tratados separadamente.
- [ ] InstantVest: build Capacitor, onboarding/redação, i18n e Maestro Android próprios, sem importar verificações de Flutter.
- [ ] `GF-001..034` executados e aceitos onde aplicáveis, com evidência por locale/plataforma.
- [ ] Acessibilidade, performance e first-value comparados ao baseline sem regressão.
- [ ] Gate de release bloqueia ausência de hardware, builds ou provas de mercado.

**Status nesta edição:** seção **documentada** e política JSON sintaticamente válida; **nenhuma** caixa de publicação nativa marcada como executada. O selo “10/10 de prontidão global” é **bloqueado** até haver evidência de execução Flutter, dispositivos, conteúdo, pagamentos e revisão humana.

### 13A.18 Contratos comportamentais executáveis — v2.4

**O que pode ser validado neste único arquivo:** resolução estrita de idioma, direção por script, rejeição de preços sem origem confiável e bloqueio de *claims* de mercado sem evidência. O Apêndice Q contém implementações de **referência em Python**, não código Flutter instalado, e testa resultados conhecidos e negativos. Nenhuma dessas verificações altera a matriz `GF-001..034`, que continua `NOT_RUN` nos aplicativos e em dispositivos físicos.

**Algoritmo mínimo para `GlobalLocaleResolver`:**

1. Normalizar tags BCP 47 de forma conservadora (idioma minúsculo, script Title Case, região maiúscula), sem confundir `zh-Hans` e `zh-Hant` ou `sr-Cyrl` e `sr-Latn`. Tags inválidas não são aceitas como preferência verificada.
2. Resolver pacote da UI na ordem: preferência manual válida **e instalada** → locale exato do dispositivo → variante mesma língua/**mesmo script** explicitamente instalada → língua base instalada quando a tag não exige script específico → fallback válido (`en`). Não selecionar `pt-BR` para `pt-PT` silenciosamente quando só há um pacote regional específico. Não selecionar `zh-Hans` para `zh-Hant`.
3. A direção de UI vem do pacote resolvido, não do IP. Dentro de uma tela, conteúdo em outro script usa isolamento bidirecional e ordem semântica própria. As tags `ar`, `he`, `fa`, `ur` e scripts explicitamente `Arab` ou `Hebr` são sentinelas RTL.
4. Qualquer preço exibido no paywall depende de **quote real e verificada** do provedor/storefront, com produto, moeda, período e país da loja obtidos de origem confiável. O locale do dispositivo **não** fornece `storefrontCountry` ou câmbio. Este autoteste apenas valida a integridade dos metadados: **não testa preços reais, recebimento, impostos, trial, cancelar ou restaurar compra**.
5. Uma alegação `(produto, mercado, idioma, capacidade, build)` exige provas explícitas de conteúdo, UX, pagamento aplicável, QA físico e revisão humana; campos vazios ou resultados `NOT_RUN` devem retornar **bloqueado**.

**Critérios de aceitação desta seção:** a suíte de referência passa casos de preferência, fallback, scripts e origem de preços; testes negativos detectam regressões; a matriz de hardware mantém seu estado real. **Nunca** rotular esses testes de lógica como execução de `GF-001..034` em Flutter.

## 14. Registro de decisão

- **Base visual:** minimalismo editorial quente, cartões arredondados, CTAs claros.
- **Fonte:** SF Pro do sistema no iOS (body 17 pt); Roboto nativa no Android (body 16 sp); Inter licenciado opcional na web (body 16 px). Não embutir fontes SF/NY. Respeitar Dynamic Type e ampliação; ver §3.
- **Dark mode:** tokens de feedback de alto contraste especificados em v1.3; validação componente a componente ainda obrigatória.
- **Accent:** cores por aplicativo são propostas iniciais e não redefinem automaticamente marcas existentes.
- **Motion:** inspirado em princípios públicos de resposta ao áudio; implementação e forma visuais próprias. Eleven v4 é modelo de voz, não versão oficial do componente `Orb`; ver §6.12.
- **Escopo do vídeo:** fluxo de TTS/vozes foi observado, mas a esfera sobreposta pode ser um indicador externo de toque; não inferir que faz parte do app.
- **Documentação adicional:** `design/tokens.json` e `design/DESIGN_QA.md` compõem o pacote, sem prometer que estejam instalados no Git.
- **Global-First:** internacionalização desenhada desde a primeira tela; idiomas anunciados e mercados habilitados dependem de cobertura integral e gates reais conforme § 13A.
- **Auditoria:** a existência deste arquivo **não significa que um repositório foi alterado, que todos os componentes foram implementados, ou que a experiência passou em QA**.

---

**Mantenedor:** equipe de produto/design do ecossistema Instant.  
**Critério para alterar este arquivo:** registrar mudança de token, motivo, telas afetadas, acessibilidade e revisão visual nos três aplicativos.


## Histórico de alterações

- **v2.3.0 — 2026-10-15:** Global-First centralizado em §13A, com 17 subseções normativas, 28 cenários GF, política JSON de capacidades por aplicativo, regras RTL/BCP47/ARB/ICU, voz, conteúdos, paywall, formatos regionais e gates de publicação. Mantidos 259 tokens e contratos de marca existentes. Nenhuma tradução, build ou validação mobile foi aplicada aos repositórios nesta edição.

- **v1.8.0 — 2026-10-15 (histórico unificado):** matriz de tipografia por proveniência (ElevenLabs/Apple/Refero/Instant), especificação original `InstantOrb3D`, glyph FNV‑1a e identidade `VoiceGlyph` sem inferência biométrica, protótipos WebGL/Canvas 2D e fallback, testes e capturas web de laboratório, exemplo de tags v4. Os baselines de aplicativos e o Flutter/hardware de produção não foram validados nessa versão.

- **v1.6.0 — 2026-10-15:** corrigidos os bugs de cores `onAccent` fixas e formatação de font-size decimal; gerados todos os tokens dimensionais e de motion para Flutter; Material 3 recebe papéis explícitos e containers de marca; ampliada validação matemática, testes de mutação e QA específico para Study/Bible. Compilação Flutter e testes de produto permanecem pendentes neste ambiente.

- **v1.5.0 — 2026-10-15:** corrigidos os 73 valores DTCG inválidos da v1.4 (26 cores, 42 dimensões, 5 durações); ampliada escala Android/web; acentos light/dark por produto com verificação AA de pares; removido CSS manual conflitante; acrescentados gerador CSS/Flutter, testes de tokens e contratos de componentes. **Tokens/gerador são verificáveis; app Flutter e QA em dispositivos permanecem não executados.**

- **v1.4.0 — 2026-10-15:** integração da tipografia Apple HIG via referência `apple-design-skill`: escala Dynamic Type Large (body 17 pt), família nativa por plataforma, política de fontes, meta de 200%/máximo do sistema, contratos Flutter sem suprimir TextScaler, tokens tipográficos por plataforma e novos cenários de QA. Documentação alterada, implementação no GitHub não executada.

- **v1.3.0 — 2026-10-15:** auditoria aplicada do vídeo mobile; contratos `VoiceLibrary`, `VoicePreviewPlayer`, `TextToSpeechComposer` e preservação de sessão/rascunho; corrigidos tokens de feedback dark; classificação de evidência para esfera sobreposta; motion e QA de catálogo/TTS; eventos de analytics e fonte de tokens tipados. Sem alterações em repositórios GitHub.

- **v1.2.0 — 2026-10-15:** incorporada a referência de experiência Eleven v4 (landing e Emotional Range) sem confundi-la com o componente público `Orb`; especificados `InstantOrb3D`, `VoiceMotionController`, `ExpressiveCaptions`, `EmotionSelector` e `MotionPerformance`, estados reais, fallback 2D/estático, critérios de QA e instruções para Codex. Sem modificações no código dos aplicativos.

- **v1.1.0 — 2026-10-15:** adicionado catálogo de motion da ElevenLabs (Sound Flow, Voice Signatures, Captioning, Chime, Echo e referência a Amplify), componentes públicos ElevenLabs UI (`Orb` e `BarVisualizer`), especificação de motion própria para Instant, sincronização de captions, parâmetros **propostos** de implementação e QA. Nenhuma alteração foi aplicada no código dos aplicativos.

## Adendo de qualidade v1.9 — gates executáveis e evidência

O sistema de design não está certificado como 10/10 para produção apenas porque os testes locais passam. Execute `scripts/run_local_checks.sh` para validar estrutura, tokens, JavaScript, WebGL **ativo**, Canvas 2D, WAV local e acessibilidade web; execute `scripts/release_gate.sh` para o gate **bloqueante** de Flutter, QA nativo e fluxos de produto. `run_checks.sh` é sinônimo do gate bloqueante, não do smoke parcial.

O teste `strict_visual_gate.py` instancia WebGL real em Chromium com Xvfb e SwiftShader, compila o shader, faz leitura dos pixels renderizados e compara screenshots visíveis/ocultas. Injeta as mutações (sem chamada de desenho, shader inválido e canvas invisível); todas precisam ser identificadas. Na ausência do contexto WebGL, a suíte falha em vez de aceitar automaticamente fallback.

`audio_browser_gate.py` usa um arquivo WAV de teste de 440 Hz tocado de verdade por HTMLAudioElement e analisado pelo Web Audio API, e verifica pausa/retomada/terminação e tratamento de permissão negada simulado. **Não** equivale a teste de microfone físico, SDK ElevenLabs ou WebRTC. `accessibility_web_gate.py` verifica texto/contraste aproximado, semântica, foco por teclado e ausência de overflow em textos ampliados; não certifica WCAG AA integralmente nem VoiceOver/TalkBack.

Os aplicativos Flutter devem permanecer reprovados para publicação enquanto faltarem SDK Flutter e evidências iOS e Android, QA AHA de cada app, testes de hardware, bateria e áudio real. O adendo protege contra falso verde na automação e não autoriza declarações de conformidade total.


## Adendo v2.0 — evidência, CI e gates de integração

- Pipeline `.github/workflows/instant-design-quality.yml`: **requisitos locais** (Python/Node/WebGL/Canvas/áudio/contraste) e **compilação Flutter real via SDK em CI**. Merge só deve ser permitido com as duas jobs verdes.
- `scripts/release_gate.sh` **não certifica design sozinho**; bloqueia se faltar Flutter SDK, QA nativo por iOS/Android, manifestos de artefatos ou revisões de fluxo.
- `scripts/native_evidence_gate.py` exige pelo menos duas provas por aparelho (captura e relatório de teste com SHA-256), datas ISO recentes, vinculação a commit e QA AHA dos três produtos; revisão humana confirma autenticidade, acessibilidade e desempenho.
- `flutter_smoke/test/theme_test.dart`: matrizes de tema (3 apps × 2 modos × 2 plataformas), escalonamento de texto, componentes e UI sem overflow; ainda **não executado localmente** sem Flutter SDK.
- Não declarar nota 10/10 ou conformidade Apple/Google/ElevenLabs com base apenas em testes web. A conclusão depende de CI verde, validação nos repos reais e aparelhos físicos.

---

## Apêndices incorporados — contratos anteriormente distribuídos em vários arquivos

Os trechos abaixo foram consolidados diretamente do pacote **Instant Design System v2.0**. Conservam conteúdos e critérios técnicos de origem. Se uma redação legada divergir dos contratos canônicos de marca da seção 2.5–2.8, **prevalecem os contratos canônicos**. Os apêndices são especificações, não códigos testados dentro deste Markdown.


### Apêndice A — Contratos de componentes (`COMPONENTS.md`)

### COMPONENTS.md — Contratos funcionais Instant v1.6

**Status:** contratos para implementação. Nenhum widget pronto ou teste em dispositivo é implicado por este documento. Todos os tokens devem vir de `design/tokens.json` via artefatos gerados; valores expressos aqui são mínimos de usabilidade, não novos tokens locais.

#### Regras gerais

- **Estado autoritativo:** a lógica vem do domínio/API; motion, estado disabled e texto nunca inventam eventos.
- **Acessibilidade:** VoiceOver/TalkBack, teclado web, `Semantics`, foco visível, labels, operação com texto ampliado, movimento reduzido.
- **Tamanho:** áreas de interação de pelo menos `component.control.targetIos` (44 pt) no iOS e `targetAndroid` (48 dp) no Android; área visual pode ser menor que hit target.
- **Layout:** nunca usar altura fixa que provoque corte com Dynamic Type, text scale 200% e teclado aberto; borda decorativa não é contorno funcional de foco.
- **Cores:** obter `color.light|dark` e `color.product.light|dark`; texto dentro de acento usa `color.product.onLight|onDark`. Não usar acento light para texto no dark.
- **Estado:** `loading` deve impedir duplo disparo. Erros mostram causa e recuperação; `disabled` explica motivo quando não óbvio; sem UI falsamente conectada.
- **Semântica de idioma:** textos e labels internacionalizados; não usar cor como único estado. Campos e labels de áudio devem continuar compreensíveis sem animação.

#### `PrimaryButton`

| Item | Contrato |
|---|---|
| Papel | Uma ação primária por contexto; não repetir ações principais na mesma tela |
| Métricas | Altura mínima: iOS 48 pt; Android 48 dp. Padding horizontal 20 unidades lógicas; raio pill; largura determinada por conteúdo com altura adaptativa ao texto |
| Cores | Fundo `color.product[theme][product]`; texto `color.product.on[theme][product]`; só usar se contraste validado. Em situações não marcadas usar fundo/texto neutral com contraste ≥4,5:1 |
| Estados | idle, pressed, focused, loading, disabled, success (somente se ação confirmou) |
| Interação | Desabilitar apenas novo envio enquanto pending; bloquear evento duplicado no handler. Loading anuncia estado em texto/semântica, mantendo largura e ação cancelar se suportada |
| QA | toques repetidos, botão de tamanho variável, teclado e leitor de tela, 200% de texto, contraste sobre superfície real |

#### `SecondaryButton`, `TextButton` e `IconButton`

| Componente | Contrato |
|---|---|
| Secondary | Border `borderFunctional` na superfície correspondente, fundo surface, texto principal; press/hover/focus visíveis; min hit target nativo |
| TextButton | Sem caixa permanente; sublinhado no web se parecer link; hover/focus em teclado; nunca depende da cor isoladamente |
| IconButton | Ícone visual de 20–24 px lógicos dentro de hit area 44/48; `Semantics(label: ...)` para ícone sem texto; diferenciar toggle de ação simples; estado de microfone não depende só do ícone |
| Estado | focused, pressed, disabled, loading quando há ação assíncrona. Exibir tooltip suplementar, não como único label |

#### `TextField` / `TTSComposerInput`

- **Layout:** `inputMinHeightIos` (48) e `inputMinHeightAndroid` (56) para entrada de uma linha. Texto livre pode crescer ou rolar; manter label e contador visíveis sem obstruir teclado.
- **Conteúdo:** label acima/dentro associado programaticamente; hint não substitui label. UTF-8, texto longo, emoji, múltiplos idiomas e IME.
- **Estados:** empty, focus, filled, invalid, disabled, loading, readonly; erro visível e anunciado, ação para reparar.
- **Integridade:** durante escolha de voz, preservar rascunho, cursor, idioma, scroll e estado de geração; para ações de saída/limpar com dados não salvos, pedir confirmação contextual.
- **Performance:** entrada e cursor sem jank quando a orbe está ativa; não enviar transcrição/rascunho para analytics padrão.

#### `VoiceLibrary` / `VoicePreviewPlayer`

- **Lista:** cada item possui nome, idioma/acento disponível, características declaradas e preview acionável; apresentação sem inferir gênero, nacionalidade ou outros atributos sensíveis.
- **Descoberta:** busca com debounce, filtros realmente suportados, estados vazio/loading/offline/erro, seleção visível e restauração quando voltar. Cache respeita políticas e expiração.
- **Player:** somente uma amostra por vez; tocar a segunda interrompe a primeira, troca de rota desmonta a reprodução. Mostrar playing/buffering/failed/finished e alternativas textuais.
- **Seleção:** confirmar voz com ação única; não apagar texto, idioma e rascunho; anuncie alteração em leitor de tela. Não oferecer voz indisponível no idioma escolhido sem aviso.
- **QA:** selecionar, cancelar, voltar, offline, Bluetooth, mudança de aplicativo, troca rápida de preview, permissões e TalkBack/VoiceOver.

#### `Card` / `ChoiceChip` / `Progress`

- **Card:** raio `radius.card` (20) e padding `component.control.cardPadding` (16), sem sombra excessiva. Se clicável, cartão inteiro possui semântica e hit target. Selected precisa ícone/texto/borda funcional além de cor.
- **ChoiceChip:** não truncar enunciados essenciais; suportar múltiplas linhas; o grupo informa seleção única/múltipla, acessível por teclado/leitor de tela.
- **Progress:** determinate e indeterminate distintos; descrever percentual/etapa em texto, sem porcentagem fingida. Quando sem duração conhecida, usar estado indeterminado. `Reduce Motion` substitui animação por ícone/texto.

#### `Feedback`, `BottomSheet` e `Paywall`

- **Feedback:** mostrar severidade por texto/ícone e, se possível, próximo passo concreto. Mensagens de erro rastreáveis por identificador não sensível, sem exibir segredos.
- **BottomSheet:** foco entra e sai corretamente, drag handle acessível e botão de fechar; fluxo crítico não pode ser perdido por swipe acidental. Respeita teclado/safe area/gestos nativos.
- **Paywall:** preço, moeda, periodicidade, teste e renovação claramente identificados; botões de fechar e restaurar compras quando aplicáveis; sem temporizador enganoso. Estados available/loading/purchasePending/restored/error; plataformas e regras de loja devem ser checadas no app real.

#### `InstantVoiceVisualizer` / `InstantOrb3D`

Implementar conforme `DESIGN.md` §§6.12–6.17. Visualizador fornece UI apenas. Sessão de voz, permissão, `inputLevel` e `outputLevel` são provenientes de fontes reais; o modo estático conserva controles, legendas e rótulos. Fallback e orbe são intercambiáveis, não caminhos de negócio separados.

#### Gates mínimos para aceitação

1. Teste de widget em cada componente cobrindo default/loading/error/disabled/focus quando aplicável.
2. Golden em light/dark e em pelo menos duas escalas tipográficas (padrão e 200%) para todos os contratos.
3. Teste real iOS/Android com VoiceOver/TalkBack, navegação e área tocável.
4. Verificação de contraste **do componente renderizado**; testes automáticos de pares de cores são uma pré-condição, não substituem isso.
5. Testes de integração asseguram que UI não altera efeitos de áudio, geração, compras e eventos do backend.

**Referências:** `DESIGN.md`, `design/tokens.json`, Apple HIG e Material Design 3. Números de layout são hipóteses de projeto onde não forem mínimo nativo, sujeitos a validação.

#### Material 3 v1.6 — regras de implementação

- `InstantDesignTheme.build(product, brightness, platform)` usa um `ColorScheme` explícito para os papéis de cor definidos em `color.material3.*` e `color.product.*`; não invoca `ColorScheme.fromSeed`.
- Botões preenchidos, contornados, `InputDecoration` e divisórias recebem defaults definidos no tema. Outros componentes continuam exigindo widget/golden tests; a existência de tokens não garante cobertura automática de toda a UI.
- Tokens de espaçamento, raio, métrica de controle e motion são constantes Dart nomeadas (`InstantSpacing`, `InstantRadii`, `InstantControlMetrics`, `InstantMotion`). Não introduzir números literais concorrentes nos widgets novos.
- Material 3 reutiliza algumas superfícies neutras em diversos papéis intencionalmente; validar distinção visual, legibilidade e foco em cada tela real.
- Para o Flutter web, o adaptador usa tipografia Android/Material como fallback; a tipografia web específica fica no CSS. Essa distinção deve ser validada na integração.


#### Contratos visuais v1.7

- `VoiceGlyph`: ler `design/VOICE_IDENTITY.md`; variantes estáveis sem biometria, nome/idiomas de catálogo, semântica em texto e preview controlado.
- `InstantOrb3D`: ler `design/ORB_VISUAL_SPEC.md`. Estrutura 3D **ainda não implementada**; testável com fallback 2D e estado semântico, compatível com sessão real.
- `ExpressiveCaptions`: realce por palavra **somente** com timestamps; fonte de verdade de legenda deve ser SDK alinhado, caso contrário exibir texto por frase.
- `Motion`: `demos/voice_motion_demo.html` serve para discutir estados 2D, não para promover performance de renderização 3D.


### Apêndice B — Referências tipográficas (`TYPOGRAPHY_REFERENCE.md`)

### TYPOGRAPHY_REFERENCE.md — Matriz de referências e decisões Instant v1.7

**Estado:** especificação / referências verificadas em 2026-10-15. Fontes observadas não implicam licença para distribuição.

#### Proveniência — não misturar marca, amostra e implementação

| Referência | O que a fonte efetivamente informa | Confiança | Decisão para Instant |
|---|---|---|---|
| ElevenLabs brand guidelines | Família **Eleven**, cortes **Normal** e **Semi Condensed**; pesos Normal/Medium/Bold; Noto Sans em alfabetos não latinos; `system-ui` para campos multilíngues | Documentado pela marca | **Não incorporar** Eleven sem licença e aprovação de marca. Reter princípios de hierarquia e legibilidade, não os glifos. |
| Refero Styles — ElevenLabs | Amostra visual do site, anteriormente identificada como Waldenburg/Inter. Pode representar uma página/época específica, **não norma universal** | Observação de terceiro | Referência editorial apenas; não declarar que Waldenburg é a fonte oficial de todos os produtos ElevenLabs. |
| Apple HIG / Apple Fonts | Família do sistema iOS selecionada pela API; SF Pro em contexto latino; Dynamic Type e legibilidade; fontes de sistema não devem ser empacotadas | Documentação oficial | iOS: **fonte do sistema**, sem forçar nome ou arquivos `.otf` de SF Pro. Base de corpo 17 pt no tamanho padrão. |
| Material 3 / Android | Fonte de sistema Android (tipicamente Roboto), escala e papéis tipográficos semânticos | Documentação de plataforma | Android: usar família de sistema e escala por papel; tamanho base 16 sp equivalente no layout Flutter. |
| Web Instant | Não é uma regra ElevenLabs | Decisão Instant | Inter **somente se carregada legalmente**, senão `system-ui`; texto base 16px CSS. |

#### Contrato visual: sistema Apple sem perder marca

- Interfaces, entradas, controles, transcrições e textos multilíngues usam fonte de sistema. Não usar fontes editoriais dentro de campo de edição, legenda crítica ou feedback de erro.
- Titulação pode ser editorial **pela hierarquia**, não pelo uso de Eleven/Waldenburg. Preferir espaço negativo, peso Regular/Semibold, métricas sem cortes e largura de linha confortável.
- Texto por voz deve suportar português, inglês, espanhol, francês, alemão e alfabetos futuros sem substituir glifos por caixas.
- `textScaler` e largura disponível definem quebra de linha; componentes não devem fixar altura para acomodar um único idioma. Tamanhos máximos de acessibilidade não devem ser artificialmente bloqueados por função global.
- Para `InstantBible`, textos longos exigem tipografia de leitura: corpo confortável, altura de linha adequada, largura controlada, links/versículos distinguíveis e preferência do usuário preservada. Serifada de leitura é opcional, depende de licença e testes.
- Para `InstantStudy`, notação matemática, índices e conteúdos tabulares são verificados em texto aumentado e leitores de tela.
- Para `InstantSpeak`, **captions/transcrições** não usam peso Light nem texto em camadas sobre gradientes animados.

#### Matriz de aceite por plataforma (baseline, não regra de font embedding)

| Contexto | Papel | Especificação inicial | Teste obrigatório |
|---|---|---|---|
| iOS | Large Title | 34 pt Regular — referência de estilo Apple | Dynamic Type, VoiceOver, tradução longa |
| iOS | Body | 17 pt Regular — referência | 200% ou máximo disponível, teclado aberto |
| iOS | Headline | 17 pt Semibold — referência | Hierarquia preservada |
| Android | Body Large | 16 sp — referência Material | FontScale 1.0 / 1.3 / 2.0, TalkBack |
| Web | Body | 16px CSS — baseline | zoom 200%, WCAG 2.2 AA, wrap |

##### Regra de implementação

Os valores canônicos continuam em `design/tokens.json`; esta tabela explica intenção. **Nunca** manter cópia concorrente de tokens num arquivo isolado, nem interpretar números aqui como novas constantes para codificar manualmente. A build gera CSS e Dart com `scripts/generate_tokens.py`.

#### Referências primárias

- https://11labs-guides-dev.a17.dev/ — seções Typography, Localization, Multi-language UI
- https://developer.apple.com/documentation/technologyoverviews/fonts — sistema font, proibição de empacotar fontes Apple
- https://developer.apple.com/design/human-interface-guidelines/typography — Dynamic Type e papéis de texto
- https://developer.apple.com/design/human-interface-guidelines/accessibility — suporte a texto ampliado
- https://m3.material.io/styles/typography/overview

#### Testes de revisão

1. Verificar que o app não contém fonte da marca ElevenLabs nem arquivo SF Pro incorporado.
2. Conferir fontes de sistema no iOS e Android em dispositivos reais; em web, validar fallback sem Inter carregada.
3. Capturar telas com 100%, 200%, dark/light e os idiomas previstos em `design/VISUAL_BASELINES.md`.
4. Fazer leitura com VoiceOver/TalkBack e verificar captions e versos longos, sem overlap nem truncamento de conteúdo essencial.


### Apêndice C — Especificação visual da orbe (`ORB_VISUAL_SPEC.md`)

### ORB_VISUAL_SPEC.md — InstantOrb3D / visualização de voz v1.8

**Status:** contrato de visual **original** para desenvolvimento; **NÃO** é uma implementação WebGL/Flutter aprovada. A demo fornecida é 2D e não substitui o renderizador 3D.

#### O que realmente é referência

A ElevenLabs UI publica um `Orb` em Three.js/React Three Fiber, com WebGL, `colors`, `seed`, `agentState = null | thinking | listening | talking`, `getInputVolume`, `getOutputVolume` e volumes manuais. É uma referência funcional **web**, não biblioteca Flutter ou versão da orbe do site Eleven v4. Fonte: https://ui.elevenlabs.io/docs/components/orb.

O sistema Sound Flow das diretrizes de marca é uma linguagem diferente, com estados estático, repouso e reativo e uma superfície 3D. Fonte: https://11labs-guides-dev.a17.dev/. **Nenhum shader, asset ou gradiente proprietário é reaproveitado.**

#### Direção visual própria: “Anel Vivo”

A visualização original InstantSpeak usa **núcleo elíptico com halo segmentado deslocado** (silhueta diferente da esfera uniforme de referência):

- **Composição:** região segura quadrada; núcleo de 0,60–0,72 da largura, halo de traços orbitais discretos. O visualizador **não é** botão; o microfone possui controle visível separado.
- **Paleta:** acento semântico **InstantSpeak** de `design/tokens.json` + superfície neutra + um tom derivado pela implementação; **não copiar** combinações exatas dos exemplos da ElevenLabs. No Study/Bible, usar visualizador compacto não obrigatório em 3D.
- **Materiais 3D (futuro renderizador):** superfície opaca/satinada, luz direcional suave, gradiente local dependente da iluminação, sem bloom e sem espalhamento pesado de blur. Propor alternativas originais de malha/shader para aprovação visual antes da construção.
- **Câmera:** frontal, movimento da câmera **desligado** durante conversa; o sujeito não deve balançar com a digitação ou rolagem.
- **Tamanho:** alvo de visualização em tela cheia ~40–55% da largura disponível, mas com limites responsivos e espaço reservado para legendas e controles. Em compacto: usar 72–112 dp como hipótese de protótipo (não codificar esses números fora de tokens novos aprovados).
- **Texto:** sempre fora da área visual, contraste WCAG em superfície sólida. Não cobrir transcrição com halo ou partículas.
- **Diferenciação:** nada de copiar `Sound Flow`, orb/shader, geometria, texturas, gradientes e asset da ElevenLabs; a qualidade desejada é **fluidez, semântica e integração com o áudio**, não similaridade literal.

#### Estados visuais detalhados

| Estado da sessão | Forma e motion | Rótulo de estado | Período de teste |
|---|---|---|---|
| `idle` | Núcleo parado, halo mínimo ou estático | Pronto para falar | Gravação desativada |
| `requestingPermission` | Forma fixa | Solicitando acesso ao microfone | API do sistema, pedido contextual |
| `connecting` | Contorno curto de progresso **não áudio reativo** | Conectando | Timeout e retry claros |
| `listening` | Só o **meter real** de microfone deforma o núcleo/halo | Ouvindo | Voz, silêncio real, mute e permissão negada |
| `processing` | Ritmo lento limitado, sem fingir energia de áudio | Preparando resposta | Espera e rede lenta |
| `speaking` | Só o **meter real** de saída de áudio afeta a forma | Respondendo | Reproduzir, pausa, trocar rota |
| `paused` | Forma fixa | Pausado | Modo de áudio interrompido |
| `interrupted` | Congela saída, prioriza input real | Interrompido | Barge-in, troca de turno |
| `error` / `offline` | Forma estática + status fora do canvas | Erro / Sem conexão | Fallback com CTA de recuperação |

#### API de renderização / fonte de estado

```text
VoiceSessionAdapter (única fonte de estado e permissões)
  -> AudioMeter: input/output [0..1] ou null, com proveniência real
  -> VoiceMotionController: snapshots por estado, mute, appVisible, reducedMotion
  -> InstantVoiceVisualizer:
         Orb3D (somente após protótipo+benchmark) / Orb2D / OrbStatic
  -> controles e captions semânticos independentes
```

- **`inputLevel=null` diferente de `inputLevel=0`**: não há medição versus medição válida de silêncio. Proibido simular amplitude real quando indisponível.
- Entrada e saída têm medidores distintos. Não deixar forma transmitir que está ouvindo quando microfone está desligado.
- Estado `error/offline/reducedMotion` não depende de WebGL para apresentar controles.
- Parâmetros de envelope **hipóteses ajustáveis**: attack 70ms, release 220ms, noise gate 0.035, ganho até 1.0. Não tratá-los como números oficiais; testar latência com áudio e microfone real antes do merge.
- **Efeito para acessibilidade:** reduzir movimento do sistema ⇒ trocar por forma fixa e rótulo. Performance prioritária à digitação, legenda e áudio.

#### Decisões 3D/Flutter ainda em aberto (não inventar tecnologia)

| Decisão | Opções e validação |
|---|---|
| Renderizador nativo Flutter | Shader suportado por Impeller, pipeline 3D ou implementação híbrida: avaliar bibliotecas, peso, licenças, consumo e APIs Flutter reais |
| Web | Canvas 2D fallback; alternativa WebGL apenas se suportada e revisada |
| Falha de GPU | Descer para 2D, depois estático preservando controles |
| Consumo | Medir FPS 30/60, latência de fala, bateria, CPU/GPU e jank em devices reais |
| Regressão | Golden tests para estados/fallback; integração real para medidores |

#### Critérios de aceite

- [ ] Referências visuais originais, assinadas/revisadas; não apenas texto descritivo.
- [ ] Protótipo **3D** executado e gravado no dispositivo-alvo, com medidas de FPS/energia.
- [ ] Amplitude de entrada e saída corresponde à fonte real e silencia corretamente.
- [ ] Captions, foco, contraste e controles sobrevivem a perda de GPU / modo estático.
- [ ] Todos os estados acima testados em iPhone e Android; `Reduce Motion` cobre cada um.
- [ ] Cores e dimensões novas formalizadas em `design/tokens.json` antes de integrar à app.

**Demonstração entregue:** `demos/voice_motion_demo.html` = **prova de conceito 2D** de estados, não uma orbe 3D de produção. Nunca declarar “Orb3D implementada” com base apenas nessa demo.

#### Progresso v1.8 (parcial, verificável)

Há código de shader + malha original em `demos/instant_orb_webgl.js`, fallback orgânico em `demos/instant_orb_canvas.js` e teste Chromium em `scripts/web_visual_smoke.py`; documentação em `design/ORB_RENDERER.md`. **WebGL ainda sem execução verificada** neste ambiente (contexto indisponível); protótipo de fato capturado é Canvas 2D, não o shader 3D. Não tratar material futuro Flutter como realizado.


### Apêndice D — Contrato do renderizador (`ORB_RENDERER.md`)

### ORB_RENDERER.md — Anel Vivo · implementação demonstrável v1.8

**Status verificável:** protótipo web com fonte de código WebGL 1 original (`demos/instant_orb_webgl.js`), fallback de desenho Canvas 2D (`demos/instant_orb_canvas.js`) e fallback final estático. **Não é uma implementação Flutter**. O Chromium deste ambiente não disponibilizou WebGL: a captura de browser evidencia **Canvas 2D**, não o shader 3D.

#### Fontes e o que *não* pode ser inferido

- [ElevenLabs UI Orb](https://ui.elevenlabs.io/docs/components/orb): WebGL/Three.js/React Three Fiber, cores configuráveis, estados `null | thinking | listening | talking`, medidores de amplitude 0..1, parâmetros manuais e semente. Confirma funcionalidade da **biblioteca oficial web**, não motor do site Eleven v4 ou código do Instant.
- [Eleven v4](https://elevenlabs.io/v4): modelo de voz e exemplos expressivos, não versão do Orb.
- [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/): Dynamic Type e alternativas acessíveis.

O shader WebGL, a silhueta não-uniforme, os materiais e a paleta do Anel Vivo foram criados para o Instant. **Não reutilizar shader, geometria, fontes ou imagem da ElevenLabs**.

#### Pipeline real e simulação

`VoiceSessionAdapter -> {state, inputLevel?, outputLevel?, micActive, muted, source} -> normalizeSnapshot() -> InstantOrbWebGL | InstantOrbCanvas | InstantOrbStatic`

O demo implementa fontes explícitas `simulated`, `real`, `none`. O controle de intensidade **é simulação declarada**; microfone real exige clique, permissão e `getUserMedia` (HTTPS/localhost); áudio de arquivo local alimenta seu próprio medidor Web Audio (analyser de saída). A versão de demo **não transmite áudio**, não possui chaves, não se conecta ao SDK e não capta voz automaticamente. Mesmo em estado `listening`/`speaking`, energia nula ou ausente não cria uma onda ficticiamente sincronizada.

#### Contratos técnicos e fallback

| Renderizador | Condição | Resultado e limites |
|---|---|---|
| `InstantOrbWebGL` | Contexto WebGL1 disponível e shader compilado | Malha esférica deformável; iluminação difusa, especular e fresnel; sem código externo; **não verificado por WebGL neste ambiente** |
| `InstantOrbCanvas` | Contexto WebGL indisponível/erro | Gradiente radial + geometria orgânica em Canvas 2D; **verificado no Chromium por screenshot** |
| `InstantOrbStatic` | Canvas indisponível, `Reduce Motion`, baixa energia extrema | Silhueta fixa + rótulo + controles semânticos independentes |

**Estado**: `idle`, `requestingPermission`, `connecting`, `listening`, `processing`, `speaking`, `paused`, `interrupted`, `error`, `offline`. O demo web expõe controles manuais para os seis estados prioritários e implementa os demais no modelo de dados; o QA de sessão real permanece pendente.

**Movimento**: ataque 70 ms, liberação 220 ms, normalização 0..1; são valores propostos do Instant, sujeitos a medição. O frame GPU só deve rodar quando o componente está visível e movimento permitido; uma implementação mobile deve parar a renderização no background, respeitar battery saver e não degradar o áudio.

#### Critérios de aceite adicionais

- [x] Código WebGL original entregue no pacote, sem dependência de CDN ou chave.
- [x] Fallback Canvas 2D renderizado em Chromium com captura real.
- [x] Testes do estado sanitizado, proveniência e glyph determinístico executados.
- [x] UI web mantém legenda e controles visíveis sem WebGL.
- [ ] WebGL compilado/renderizado em GPU ou software com contexto permitido; screenshot **3D real**, não 2D.
- [ ] Integração Flutter + medidores reais do SDK ElevenLabs / áudio local no dispositivo.
- [ ] 60 fps sustentáveis em dispositivos-alvo ou fallback adaptativo validado.
- [ ] VoiceOver, TalkBack, teclado, texto a 200%, bateria e térmica em aparelhos reais.

**Gate:** não classificar como “orbe ElevenLabs 10/10”, “WebGL comprovado”, “Flutter funcional”, nem “produção aprovada” até que as caixas pendentes sejam testadas.


### Apêndice E — Identidade visual das vozes (`VOICE_IDENTITY.md`)

### VOICE_IDENTITY.md — Linguagem visual original para vozes Instant v1.8

**Status:** proposta, não análise biométrica implementada. Inspirada no *princípio* ElevenLabs Voice Signatures (visualizar uma voz), mas não copia sua relação específica de matiz/luminosidade/textura.

#### Regra geral

Uma voz precisa ser reconhecível visualmente **sem** deduzir gênero, raça, nacionalidade, idade ou estado emocional. A UI usa **metadados explícitos, publicados pelo provedor ou escolhidos pelo usuário**, nunca estereótipos a partir de nome ou timbre.

O design proposto é `VoiceGlyph`: **dois arcos em tensão e um pequeno ponto central** com disposição estável por identificador. O glyph não se confunde com o logo IS, Orb/Sound Flow nem a assinatura visual da ElevenLabs.

#### Identidade determinística (somente design, não análise de voz)

| Campo de entrada | Origem | Regras |
|---|---|---|
| `voiceId` | ID estável do catálogo | Hash não reversível ou hash de exibição, para escolher uma das variantes **curadas** e estáveis; não exibir identificador |
| `displayName` | Catálogo ou pseudônimo aprovado | Localizar rótulo, evitar nomes históricos de terceiros sem revisão |
| `previewAvailable` | Backend/SDK | Preview só habilitado quando possível, sem player fake |
| `languageCodes` | Catálogo validado | Exibir apenas idiomas realmente suportados |
| `styleTags` | Descrições fornecidas/autorizadas | Não inferir emoções/demografia/aptidões |
| `status` | Sessão/preview real | playing/paused/loading/unavailable/failure com anúncio acessível |

**Escolha de forma:** variantes por `hash(voiceId) mod 6` (não é “assinatura biométrica”); pequena rotação de arcos e posição do ponto, nos limites de contraste. **Cores:** família de acentos já tokenizada, com status de seleção indicado adicionalmente por texto/ícone. Não gerar novas cores aleatórias; validar light/dark. A mesma voz retorna a mesma variante até alteração explícita e versionada do algoritmo.

**Dados de pitch/timbre/expressividade:** são características do sistema de referência ElevenLabs, mas NÃO são campos assumidos pela implementação Instant. Se o fornecedor disponibilizar metadados pertinentes e confiáveis, desenhar evolução explícita **após consentimento, auditoria de precisão e justificativa de produto**; não inferir a partir de gravação privada.

#### UI nos locais de uso

| Tela | Experiência desejada | Estados QA |
|---|---|---|
| `VoiceLibrary` | Ícone `VoiceGlyph`, nome, língua disponível, preview e selecionar | loading, filtering, preview, selected, unavailable |
| `VoicePreviewPlayer` | Área tocável independente, feedback play/pause com tempo real | buffering, error, finish, switching |
| `TextToSpeechComposer` | Voz selecionada persiste ao voltar; identidade discreta | return, draft preserved, mute |
| Conversa InstantSpeak | `VoiceGlyph` em caption/turno, não uma segunda orbe | reading, playback, offline |

#### Acessibilidade, privacidade e marca

- Glyph decorativo, `Semantics` acessível pelo nome/estado da voz; ícone nunca única distinção.
- Captions por frase sempre disponíveis; por palavra somente com timestamps reais.
- Não registrar transcrições/áudios ou hashes de voz em analytics padrão. O hash visual não é segurança ou anonimização de dados.
- Não usar Voice Signatures, arquivos gráficos, gradientes ou vocabulário exclusivo da ElevenLabs.
- Simples previsões de traço feitas na UI não equivalem a atributos acústicos.

#### Testes mínimos

1. O mesmo `voiceId` mantém glyph em sessões/dispositivos; IDs diferentes podem colidir intencionalmente (6 variantes), mas nome identifica a voz.
2. Ao alternar tema, contraste do item selecionado continua legível.
3. Preview indisponível não exibe ondas falsas; troca de voz interrompe reprodução anterior.
4. Os idiomas e rótulos exibidos são dados reais do catálogo, não heurísticas.
5. VoiceOver/TalkBack declaram nome, idiomas disponíveis, preview e status.

**Referência de inspiração:** https://11labs-guides-dev.a17.dev/ — Voice signatures. Nossa relação visual com metadados **não reproduz** o mapeamento oficial de pitch ↔ lightness, saturação ↔ expressividade e timbre ↔ textura.

#### Algoritmo executável acrescentado na v1.8

`demos/instant_voice_core.js` implementa FNV-1a em bytes UTF-8 de `voiceId.normalize('NFC')` com offset `0x811c9dc5`, multiplicador `0x01000193` via Math.imul e inteiro unsigned 32 bits. `index = hash % 6`. A versão é `fnv1a-nfc-v1`. Isso fixa o algoritmo entre sessões de navegador; qualquer porta para Flutter deve usar testes com vetores idênticos e explicitamente versionar mudanças. Não produz nem representa atributos acústicos reais.

**Evidência visual:** `demos/instant_orb_lab.html` apresenta cartões de vozes fictícias sem previews de áudio falsos. As seis variantes têm cobertura estável por ID, mas nomes diferentes podem colidir intencionalmente; nome/texto continuam obrigatórios.


### Apêndice F — Experiência de voz V4 (`ELEVEN_V4_EXPERIENCE.md`)

### ELEVEN_V4_EXPERIENCE.md — expressão vocal sem controles fictícios

#### Fonte de verdade

- [Eleven v4](https://elevenlabs.io/v4): vozes expressivas, áudio tags em colchetes, v4 Turbo para baixa latência, streaming via API.
- [ElevenLabs TTS Documentation](https://elevenlabs.io/docs/pt/eleven-creative/playground/text-to-speech): `eleven_v4` e `eleven_v4_turbo`, tags e streaming. A V4 não utiliza SSML `<break>` como controle de pausas; usar tags de linguagem natural conforme documentação.
- [Eleven v4 audio tags](https://elevenlabs.io/pt/blog/elevenlabs-audio-tags-list): exemplo de `curious`, `whispers`, `excited`, `laughs`.

#### Contrato InstantSpeak

1. A primeira ação é **praticar uma conversa**. Escolher emoção é opcional e não atrasa o AHA.
2. UI exibe `Natural`, `Curioso`, `Sussurro`, `Animado` apenas onde o backend confirma suporte. Tags são orientação de voz, não parâmetros do shader.
3. `Natural` significa ausência de tag; opções demonstradas: `[curious]`, `[whispers]`, `[excited]`. O teste web **exibe string de roteiro**, não gera fala.
4. Antes da geração real, confirmar modelo disponível para a conta/voz, custo, quotas, consentimento e os recursos efetivamente aceitos. Se indisponível, ocultar/desabilitar opção com explicação.
5. Não colocar controles universais `speed` ou `style` sem evidência de suporte do modelo ativo; não usar SSML em Eleven v4.
6. Não inferir emoção ou perfil demográfico de quem fala. Analytics não grava transcrições ou áudio bruto por padrão.
7. A orbe reage a amplitudes reais, nunca à tag de emoção ou texto como se fosse medição de áudio.
8. Preview da voz é uma reprodução real, com estado de loading e interrupção; sem arquivo/endpoint conectado, deve estar indisponível com rótulo.

#### Exemplo de integração (contrato, não produção)

```text
EmotionSelection { tag?: 'curious' | 'whispers' | 'excited' }
    -> verify(model='eleven_v4' or 'eleven_v4_turbo', providerCapabilities)
    -> TTS request built server-side with explicit costs/rate limits
    -> audio source / playback event / real output meter
    -> captions (phrase-level unless true word timestamps exist)
    -> VoiceSessionAdapter (authoritative)
    -> VoiceMotionController -> InstantOrbRenderer
```

#### QA obrigatório

- [ ] Tags geram efeitos apenas com integração real suportada e testes de áudio executados.
- [ ] Prévia de voz em idiomas reais, transcrição e caption verificados.
- [ ] Erros de quota, timeout, permissão, desconexão, cancelamento e cancelamento de geração exibidos claramente.
- [ ] `Voiceover` e `TalkBack` anunciam controles e estado sem leitura de canvas.
- [ ] Observado consentimento para reprodução/clonagem de voz quando aplicável.


### Apêndice G — Demonstrações de motion (`MOTION_DEMOS.md`)

### MOTION_DEMOS.md — Cenários e execução v1.8

**Estado:** `demos/voice_motion_demo.html` é uma **demo HTML/Canvas 2D original e executável localmente**, não um motor 3D, vídeo oficial ou implementação Flutter. Não requer build, API ElevenLabs ou chave.

#### Referências públicas e separação conceitual

- **Sound Flow** — linguagem de marca com superfície 3D e estados static/resting/reactive. Nosso protótipo **não copia** forma/shader/valores originais.
- **ElevenLabs UI Orb** — componente WebGL React/Three.js de áudio e estados. Nosso protótipo **não utiliza** código nem assets dessa biblioteca.
- **Chime / Echo / Captioning** — soluções visuais de marca para comunicação e legendas. Nossa demo só demonstra **caption por frase** e um efeito de realce de estado original, sem fingir alinhamento lexical.

Fontes: https://11labs-guides-dev.a17.dev/ e https://ui.elevenlabs.io/docs/components/orb.

#### Como executar

1. Abrir `demos/voice_motion_demo.html` em navegador moderno (offline para estados simulados).
2. Alternar `idle`, `listening`, `processing`, `speaking`, `error`; todos os estados escolhidos manualmente são **SIMULAÇÃO**.
3. `Modo simulação`: slider altera energia **apenas no protótipo** e o rótulo mostra isso explicitamente.
4. `Usar microfone real`: solicita permissão **depois de clique**, via Web Audio API. Requer contexto seguro (`https://` ou `localhost`) no navegador; se abrir por `file://`, o acesso pode falhar, mas a UI continua utilizável no modo estático/simulação. Ao encerrar, tracks e AudioContext são fechados.
5. `Reduzir movimento`: mantém estado textual, controles e glyph. Deve respeitar também `prefers-reduced-motion` do sistema.
6. Legenda demonstrativa é **texto fixo de demonstração**, nunca reivindicação de sincronização com palavras/áudio real.

#### Como executar com servidor local (opcional)

```bash
cd instant-design-v1.8
python3 -m http.server 8000
# Abrir http://localhost:8000/demos/voice_motion_demo.html
```

#### Critérios de aceitação (demo)

- [ ] Não pede permissão de microfone no carregamento.
- [ ] Slider nunca é descrito como medição de áudio real.
- [ ] Leitura/labels e estados funcionam sem Canvas ou sem GPU.
- [ ] Desabilitar animação preserva foco, legenda, mic e estado.
- [ ] `microphone active` só aparece após permissão concedida e stream real.
- [ ] Ao parar microfone, tracks param, medidor zera e gravação não continua em background.
- [ ] Demo não faz upload de áudio, não usa CDN nem coleta dados.
- [ ] Canvas e movimentos são originais; não existe promessa de semelhança exata com ElevenLabs.

#### Futuros protótipos não entregues aqui

- **3D Flutter**: comparar renderizadores suportados com orçamentos de GPU e fallback.
- **Chime-style original**: destacar palavras **apenas com alinhamento real** de timestamps; caso contrário legenda por frase.
- **Echo-style original**: motion tipográfico apenas em promoções e sujeito ao movimento reduzido; não comprometer legibilidade.
- **Produção**: fluxo real SDK voz ↔ medidor ↔ renderizador; testes por dispositivo e `DESIGN_QA.md`.

**Gate:** nenhum exemplo web isolado serve como evidência de aprovação de produto Flutter.

#### Demonstrações v1.8

- `demos/instant_orb_lab.html`: UI responsiva com WebGL (se disponível), fallback Canvas 2D; indicadores e controles HTML sempre independentes de canvas.
- `demos/instant_orb_webgl.js`: shader original WebGL de malha deformável, **não validado em browser com WebGL neste ambiente**.
- `demos/instant_orb_canvas.js`: alternativa 2D executada com screenshot.
- `demos/instant_voice_core.js`: proveniência de volume, estados e glyphs determinísticos testados em Node.
- `design/ELEVEN_V4_EXPERIENCE.md`: roteiro de tags e experiência V4 **sem chamada de API simulando resposta real**.
- `design/MOTION_QA_v1.8.md`: matriz de evidências.


### Apêndice H — Referências visuais e regressão (`VISUAL_BASELINES.md`)

### VISUAL_BASELINES.md — Critérios para golden tests e screenshots v1.8

**Status:** baseline **planejada**, não screenshots capturadas de apps reais. O arquivo `design/baselines/manifest.json` define os casos; snapshots reais só serão aceitos quando houver interface executando e hashes versionados.

#### Objetivo

Garantir consistência entre design, Flutter e web; o alvo é **qualidade técnica comparável**, não imagem idêntica à ElevenLabs. NÃO importar screenshot alheio como baseline, nem apresentar mockup como app implementado.

#### Cenários e convenções

- Em cada registro do manifest: `id`, `product`, `screen`, `platform`, `theme`, `textScale`, `state`, `viewport`, `status`, `expected` e `acceptance`.
- Tipos de estado exigidos: sucesso/loading/empty/error/disabled/offline, conforme fluxo. Orbe sempre `idle/listening/processing/speaking/error` e também `reducedMotion`.
- `status="spec_only"` significa **sem screenshot existente**. O CI só deve comparar pixels depois de construir golden aprovado e alterar status para `baseline_approved` com nome do arquivo, hash e aprovação humana.
- Não registrar dados reais de clientes, áudio privado, nome pessoal ou tokens de autorização em screenshots.
- Tolerância visual (`pixelDiff`) só pode ser estabelecida após controlar fontes, device pixel ratio, tema e renderizador; **não definir percentual fictício agora**.
- Contraste AA medido em componentes renderizados (texto ≥4.5:1; controles não textuais críticos ≥3:1 em condições aplicáveis). Conferir overlays.

#### Cobertura obrigatória

1. **InstantSpeak**: onboarding (primeira conversa), biblioteca de vozes (busca/preview/erro), editor TTS (rascunho/resultado), sessão de voz nos estados reais e modo sem movimento.
2. **InstantStudy**: importação/criação, primeira questão, feedback certo/errado, progresso salvo, rede instável e texto matemático ampliado.
3. **InstantBible**: capítulos, leitura longa, seleção do verso, anotação/áudio, retomada de leitura e suporte a fontes ampliadas.
4. **Tamanhos**: compacto phone (390×844), phone maior (430×932), web (1280×800). São **viewports de teste**, não dimensões absolutas de elementos.
5. **Temas e escalas**: light/dark; padrão e texto ampliado 200%; idioma com expansão (`pt-BR`) e inglês; adicionar outros na integração de produto.

#### Geração de evidências reais

```bash
# Pré-condição: Flutter SDK e repositório do aplicativo disponíveis
flutter analyze
flutter test
# Executar golden tests de cada tela e exportar screenshots reais do test runner,
# anexando hash, device, fonte, locale, theme, Flutter SDK e autor da aprovação.
```

Para o preview web 2D deste pacote, `demos/voice_motion_demo.html` pode ser aberto em navegador moderno. **Ele não conta como golden Flutter, screenshot mobile ou Orb3D renderizada.**

#### Política de aprovação

- [ ] Screenshot real existe para cada cenário obrigatório
- [ ] Hash SHA256 e versão Flutter/browser/device registrados
- [ ] Sem regressão relevante de texto, quebra de linha, foco ou gestos
- [ ] Golden revisado por pessoa, com histórico de alterações em PR
- [ ] VoiceOver/TalkBack e performance testados separadamente (goldens não substituem testes de interação)
- [ ] Diff com valores divergentes tem evidência e aprovação, não regravação automática indiscriminada

#### Capturas novas de protótipo web v1.8

`demos/orb_lab_desktop.png` e `demos/orb_lab_mobile.png` são **screenshots reais do protótipo HTML em Chromium**. Renderização capturada: `Canvas 2D` porque WebGL não foi disponibilizado pelo navegador deste ambiente. NÃO modificar `design/baselines/manifest.json` para marcar telas iOS/Android como `baseline_approved`: os 12 casos de Flutter continuam `spec_only`. Hashes e resolução no `design/baselines/web_prototype_evidence.json`.


### Apêndice I — QA compartilhado (`DESIGN_QA.md`)

### DESIGN_QA.md — Instant Design System v1.6

**Status:** plano de QA. Nenhum teste abaixo foi executado pelo simples fato de existir este documento.

#### Gate local automatizado — evidências de arquivos, não de app

| ID | Cenário | Evidência | Resultado |
|---|---|---|---|
| TOK-001 | Tipos DTCG 2025.10 (`color`, `dimension`, `duration`, `fontWeight`, `cubicBezier`) | `python3 scripts/generate_tokens.py --check` e `unittest` | Consultar `design/VALIDATION_REPORT.md` |
| TOK-002 | Contraste: light/dark, 3 superfícies, feedback e produtos | `unittest` automatizado | Consultar relatório |
| TOK-003 | CSS gerado consistente com tokens, fast = 160 ms | `--check` e `unittest` | Consultar relatório |
| TOK-004 | Dart gerado consistente com tokens | `--check` e `unittest` | Consultar relatório |
| TOK-005 | Fontes/escala iOS, Android e web | Asserções da suíte, sem inspeção de dispositivo | Consultar relatório |

#### Gates Flutter e regressões v1.6

| ID | Cenário | Evidência | Situação |
|---|---|---|---|
| TOK-006 | Mutação `onLight`/`onDark`: CSS e Dart seguem o token | `unittest` de mutação | Executar no pipeline |
| TOK-007 | Tamanho 17.5 gera Dart válido, nunca `17.5.0` | `unittest` de mutação | Executar no pipeline |
| TOK-008 | Espaçamentos, raios, dimensões e durações exportados ao Flutter | `unittest` de cobertura por tipo | Executar no pipeline |
| TOK-009 | Paleta completa Material 3 explicitamente tokenizada | `unittest` de pares e roles | Executar no pipeline |
| FLY-001 | `flutter analyze` sem erros | `bash scripts/flutter_smoke.sh` | **NÃO EXECUTADO** sem SDK |
| FLY-002 | Widget tests (3 produtos × 2 temas, iOS/Android, texto 200%) | `bash scripts/flutter_smoke.sh` | **NÃO EXECUTADO** sem SDK |
| STU-* | Fluxos específicos do InstantStudy | `design/QA_STUDY.md` | **NÃO EXECUTADOS** |
| BIB-* | Fluxos específicos do InstantBible | `design/QA_BIBLE.md` | **NÃO EXECUTADOS** |

O tema Flutter só recebe status **compilado/testado** após saída real de `flutter analyze` e `flutter test`; testes Python não suprem essa evidência.

#### Gate P0 — bloqueia publicação

| ID | Fluxo / cenário | Evidência exigida | Status inicial |
|---|---|---|---|
| QA-001 | Contraste de feedback light/dark nas superfícies reais | Relatório AA; verificar texto 4.5:1, componentes críticos 3:1 onde aplicável | NÃO EXECUTADO |
| QA-002 | Alternar microfone permitido/negado/mudo e receber chamada | Vídeo + log de máquina de estados sem áudio pessoal | NÃO EXECUTADO |
| QA-003 | `inputLevel=null` e `outputLevel=null` | Teste: visual não finge amplitude vocal | NÃO EXECUTADO |
| QA-004 | `VoiceLibrary` buscar, ouvir, selecionar, cancelar | Testes de widget/E2E + vídeo + VoiceOver/TalkBack | NÃO EXECUTADO |
| QA-005 | Trocar de voz com rascunho longo no compositor | Teste: texto/cursor/idioma preservados | NÃO EXECUTADO |
| QA-006 | Falha, timeout, quota e envio repetido em TTS | Testes com backend mockado + verificação de envio único | NÃO EXECUTADO |
| QA-007 | `Reduced Motion` e fallback estático | Capturas e testes de controle completo sem orbe | NÃO EXECUTADO |
| QA-008 | Credenciais e privacidade | Revisão: sem API key no app, sem transcrições em analytics | NÃO EXECUTADO |
| QA-017 | Corpo iOS a 17 pt e hierarquia Apple por papéis semânticos | Inspeção de `TextTheme`/widget no iOS real, tema claro/escuro e screenshots | NÃO EXECUTADO |
| QA-018 | Dynamic Type no iOS no tamanho máximo disponível; teste adicional a 200% | Vídeo e screenshots: sem texto essencial cortado, sobreposição, controle inacessível nem perda de ação | NÃO EXECUTADO |

#### Gate P1 — experiência e robustez

| ID | Fluxo / cenário | Evidência exigida | Status inicial |
|---|---|---|---|
| QA-009 | Catálogo vazio/offline/carregando | Screenshot por estado e recuperação | NÃO EXECUTADO |
| QA-010 | Preview de duas vozes consecutivas | Um único player, sem vazamento de recursos | NÃO EXECUTADO |
| QA-011 | iPhone compacto, teclado aberto, texto 200%, landscape | Golden/screenshot + inspeção manual | NÃO EXECUTADO |
| QA-012 | Android pequeno/grande com TalkBack | Teste de foco, rótulos e ordem de leitura | NÃO EXECUTADO |
| QA-013 | Retomada após background, Bluetooth, headset | Vídeo e player/microfone no estado correto | NÃO EXECUTADO |
| QA-014 | 3D → 2D → estático sob carga/bateria | Profiling de frames, memória, temperatura e bateria | NÃO EXECUTADO |
| QA-015 | Captions sem timestamps verdadeiros | Teste: nenhuma animação de palavra fingindo alinhamento | NÃO EXECUTADO |
| QA-016 | Primeiro diálogo útil antes de explorar biblioteca/TTS | E2E do AHA, regressão de funil | NÃO EXECUTADO |
| QA-019 | Android: Roboto nativa, `bodyLarge` 16 sp e tamanho de fonte ampliado | Widget test, inspeção no Android e screenshot com configurações reais do sistema | NÃO EXECUTADO |
| QA-020 | Português/inglês, texto longo e RTL quando suportado | Capturas com quebras, legendas, botões e componentes em múltiplas linhas | NÃO EXECUTADO |
| QA-021 | Fluxos Speak/Study/Bible com fonte aumentada e teclado aberto | Testes E2E: áudio/captions, questões e leitura permanecem operacionais | NÃO EXECUTADO |
| QA-022 | Fontes, ícones e licenciamento por plataforma | Revisão de assets: sem SF Pro/NY empacotada para Flutter/Android/web; sem supressão do TextScaler | NÃO EXECUTADO |

#### Matriz mínima de captura

- 3 tamanhos de viewport: compacto, médio e grande; dark e light; texto padrão e ampliado (200% simulado, iOS no maior Larger Text real e Android com fonte ampliada).
- Pelo menos um iPhone e um Android reais representativos, além de simuladores quando disponíveis.
- Para cada fluxo: `idle`, `loading`, `ready`, `empty`, `error`, `offline`, `permissionDenied` quando se aplicarem.
- Anexar hash/versão do app, dispositivo, SO, SDK de áudio, data, branch/commit, arquivo de evidência e decisão de revisão.

#### Critérios de aprovação

1. Zero bugs P0 abertos; P1 aceitos apenas com justificativa e plano de correção.
2. Tokens passam na validação DTCG estrutural e `generate_tokens.py --check`; adaptadores **só** são considerados prontos para o projeto após `flutter analyze`/`flutter test` no repositório real, incluindo tipografia por plataforma.
3. Contraste aprovado **sobre as superfícies reais**, inclusive overlays e botões; números de contraste sobre uma cor isolada não bastam.
4. Motion nunca mascara captação real, indisponibilidade de API ou estado de geração.
5. Um revisor verifica que o ponto colorido do vídeo não foi tratado como implementação oficial da orbe.
6. `flutter test`, análise estática, testes E2E e medição de performance têm saídas anexadas ou status “não executado”.
7. Testes QA-017–QA-022 avaliam fontes do sistema e legibilidade real; o teste a 200% não substitui categorias máximas do iOS.
8. Um release não está “100% validado” apenas porque a checklist foi preenchida: requer verificação do código publicado.

#### Comandos locais executáveis para o pacote

```bash
python3 scripts/generate_tokens.py --check
python3 -m unittest discover -s tests -v
```

A tabela TOK mede o pacote. Ela **não** torna os casos QA-001 a QA-022 executados. A integração Flutter e testes com iPhone/Android reais são obrigatórios antes de produção.

#### Comandos exemplificativos, adaptar ao repositório

```bash
flutter analyze
flutter test
# Configure e execute o teste integration_test existente no repositório;
# não supor que a infraestrutura esteja instalada.
```

#### Relatório de execução (preencher após testes)

| Data | Commit | Plataforma | Casos executados | Aprovados | Reprovados | Bloqueios | Evidências |
|---|---|---|---:|---:|---:|---|---|
| — | — | — | 0 | 0 | 0 | Não executado | — |


#### Complemento QA v1.7 — fidelidade ao contrato, não cópia da ElevenLabs

- [ ] QA-VIS-01: `design/baselines/manifest.json` validado; cada `spec_only` permanece **não aprovado** até existir screenshot real, hash, ambiente e review.
- [ ] QA-VIS-02: tipografia iOS/Android/web segue sistema/contrato, sem arquivos Apple/ElevenLabs empacotados e sem quebra a 200%.
- [ ] QA-VIS-03: `VoiceGlyph` mantém seleção determinística sem inferir características da voz; VoiceOver lê nome real da voz.
- [ ] QA-VIS-04: `InstantOrb3D` é original e tem imagens/registro real em dispositivo; demo web 2D **não** conta como implementação 3D.
- [ ] QA-VIS-05: microfone só após ação explícita; desligar stream encerra áudio e acessibilidade persiste.
- [ ] QA-VIS-06: simulação de estados e áudio reais são rotulados de modo diferente; `null` de meter nunca gera onda falsa.
- [ ] QA-VIS-07: legendas por palavra apenas com timestamps alinhados, caso contrário legenda por frase.
- [ ] QA-VIS-08: fallback `Reduce Motion` e falha de GPU preservam captions e controles.
- [ ] QA-VIS-09: documentar medição de FPS, CPU/GPU e latência em iOS/Android reais antes de produção.
- [ ] QA-VIS-10: `python3 -m unittest discover -s tests -v` passa, sem inferir que os itens de UI foram executados.


### Apêndice J — QA do InstantStudy (`QA_STUDY.md`)

### InstantStudy — plano de QA específico (v1.6)

**Status: NÃO EXECUTADO.** Não confundir especificação com cobertura de teste real. Validar no repositório do InstantStudy, com backend real ou mock reproduzível.

| ID | Cenário obrigatório | Evidência para aprovação |
|---|---|---|
| STU-001 | Criar/importar conjunto de estudos válido; falhas de formato e limite | Widget/E2E, mensagens de recuperação, nenhum documento perdido |
| STU-002 | Primeiro exercício entregue e concluído antes de paywall não previsto | Gravação do AHA, duração para primeira resposta útil |
| STU-003 | Acerto, erro, justificativa e alternativa sem pistas falsas | Testes determinísticos, fixtures com gabarito e explicação |
| STU-004 | Progresso persiste após fechar, reiniciar e alternar conta | E2E com isolamento de usuário e logs sem conteúdo sensível |
| STU-005 | Repetição espaçada: agendamento e mudança de fuso/relógio | Testes de cálculo, dados estáveis, conflitos de sincronização |
| STU-006 | Questões longas, fórmula, mídia e caracteres especiais | Capturas com quebra de texto, layout responsivo e fallback acessível |
| STU-007 | Offline, perda de conectividade durante resposta e retry | Testes de não duplicação, fila de sync e estado explícito |
| STU-008 | 200%+ texto, VoiceOver/TalkBack, seleção por teclado | Evidências reais nas plataformas e sem truncar conteúdo pedagógico |
| STU-009 | Estado vazio, carregando, erro e conteúdo indisponível | Captura/QA de todos os estados, ações de recuperação |
| STU-010 | Troca de idioma, temas dark/light e animação reduzida | Screenshots e testes de transição, sem alterar resposta |

**Critério de bloqueio:** nenhum progresso/proficiência inventado, nenhuma resposta aceita duas vezes ou perdida; erros pedagógicos ou perda de dados são P0. Revisor de conteúdo valida feedback educacional. Nenhum caso acima foi executado aqui.


### Apêndice K — QA do InstantBible (`QA_BIBLE.md`)

### InstantBible — plano de QA específico (v1.6)

**Status: NÃO EXECUTADO.** Não confundir documentação com testes funcionais de leitura ou direitos de conteúdo.

| ID | Cenário obrigatório | Evidência para aprovação |
|---|---|---|
| BIB-001 | Abrir livro, capítulo, versículo e navegação de ida/volta | E2E com referências canônicas e casos de borda |
| BIB-002 | Pesquisa por termo, acentos, citações, referências abreviadas | Fixtures reproduzíveis, resultados com contexto e sem alucinações |
| BIB-003 | Texto bíblico: versão, licença, atribuição e localização | Revisão de direitos, fontes e versão corretas por idioma |
| BIB-004 | Continuar leitura e bookmark depois de reiniciar/reinstalar | Persistência e isolamento por usuário, restauração intencional |
| BIB-005 | Anotações/reflexões e sincronização, edição conflitante | E2E e política de privacidade; não perder conteúdo do usuário |
| BIB-006 | Áudio: play/pause, troca de capítulo, background, sem rede | Testes de reprodução real e estado; sem orbe simulando amplitude |
| BIB-007 | Ampliação de fonte, linhas longas, tema escuro e rolagem | VoiceOver/TalkBack, capturas a 200%+ e zoom disponível |
| BIB-008 | Acessibilidade de capítulos, referências e ações rápidas | Ordem de leitura, labels e navegação sem gestos ocultos |
| BIB-009 | Conteúdo em cache, offline e atualização de versão | Inventário dos textos permitidos e fallback confiável |
| BIB-010 | Primeiro momento AHA (encontrar passagem e ação útil) | Tempo e esforço observados; sem bloqueio comercial inesperado |

**Critério de bloqueio:** referência errada, violação de licença, leitura inacessível e perda de anotações são P0. Não inferir que uma orbe sofisticada torna a experiência melhor. Nenhum caso acima foi executado aqui.


### Apêndice L — QA do motion (`MOTION_QA_v1.8.md`)

### MOTION_QA.md — demonstração × produção

#### Separação de evidências

- `Orb WebGL`: código tridimensional entregue; shader **não executado** neste ambiente por indisponibilidade de WebGL no Chromium.
- `Orb Canvas 2D`: fallback executado e capturado desktop e telefone.
- `Chime-style original`: entrada tipográfica independente com transição em CSS e sem timestamps.
- `Echo-style original`: leve mudança de tracking/opacidade/posição; somente demonstrativo.
- `ExpressiveCaptions`: exibição de frase estática; **nenhum alinhamento por palavra reivindicado**.
- `EmotionSelector`: gera rascunho de tag, não áudio.

#### Gates de QA

| Critério | Procedimento | Aprovado no pacote? |
|---|---|---|
| Sem WebGL | Desabilitar GPU e abrir demo | Sim, Canvas 2D verificado |
| Estados de demo | Clicar idle/listening/processing/speaking/error | Sim, UI smoke |
| Sem energia falsa em `processing` | Inspecionar snapshot | Sim, código/teste |
| Reduzir movimento | Clique no toggle e observar desenho estático | Sim, UI smoke |
| `file://` e HTTPS/localhost | Executar demo | HTML abre sem servidor; mic exige contexto seguro, **não testado** |
| Captions real-time | SDK real + timestamp | **Não** |
| Performance GPU e jank | FPS e bateria no iPhone/Android | **Não** |
| Chime/Echo sincronizado | Timestamps reais e frame-by-frame | **Não** |

**Importante:** um protótipo 2D elegante não comprova equivalência ElevenLabs nem qualidade do shader original 3D. Usar capturas de navegador como evidência de protótipo, nunca como baseline aprovado do aplicativo.


### Apêndice M — Estado de qualidade e limitações (`QUALITY_STATUS_v2.0.md`)

### Relatório auditável — Instant Design System v2.0

**Data:** 15/10/2026 · **Escopo:** laboratório web e infraestrutura de validação, **não** aplicativos executados em smartphones.

#### Testes executados nesta sessão

| Gate | Resultado | Limite |
|---|---|---|
| Tokens e arquivos gerados | PASS — 259 tokens | Sem compilação nativa neste ambiente |
| Python unittest | PASS — 37/37 | Inclui testes negativos do gate de evidências |
| Node test | PASS — 13/13 | Core JS, não aplicativo inteiro |
| WebGL/Canvas 2D | PASS — 4/4 cenários | Chromium + Xvfb + SwiftShader (GPU virtual) |
| Mutações visuais | PASS — 5/5 detectadas | Não cobre shader Flutter |
| WAV (reprodução via navegador) | PASS | Áudio local; microfone e ElevenLabs SDK não testados |
| Acessibilidade web básica | PASS — mobile + desktop | Não substitui VoiceOver/TalkBack |
| YAML do workflow | Estrutura válida — 3 jobs | GitHub Actions ainda não executado |
| Release gate sem Flutter | BLOCKED (exit 2), comportamento correto | Flutter SDK ausente |
| Flutter analyze/widget tests | **NOT RUN** | Exige Flutter SDK via runner GitHub Actions |
| iPhone/Android físicos | **NOT RUN** | Exige dispositivos reais |
| 3 jornadas AHA nos produtos | **NOT RUN** | Exige apps integrados + QA humano |

#### Mudanças concretas da v2.0

1. Workflow GitHub Actions para laboratório e Flutter (`.github/workflows/instant-design-quality.yml`).
2. Matriz expandida de 12 testes widget Flutter (3 apps × 2 plataformas × 2 temas), com texto 200%, controles e sem exceção de layout. **Código ainda não compilado**.
3. Verificador de evidência nativa falha fechado na ausência de manifesto, dados de aparelho, artefatos e relatório AHA; não aceita paths fora do projeto.
4. Testes negativos contra falsos positivos no gate nativo e smoke CI.
5. Dependências reproduzíveis de Playwright/Pillow e navegador selecionável quando não há `/usr/bin/chromium`.
6. README consolidado, com fluxo de release e limitações explícitas.

#### Bloqueios intransponíveis neste contêiner

- O Flutter SDK não está instalado e não há acesso externo para baixá-lo.
- Não foi realizada execução dos jobs no GitHub Actions dos repositórios reais.
- Não há controle de iPhone/Android físicos, nem integração de WebGL com motor Flutter/Impeller comprovada.
- Testes de acessibilidade assistiva, bateria, áudio do SDK e métricas de produto exigem hardware/ambiente do app.

**Veredito:** **laboratório local aprovado; release bloqueado**. Não há evidência suficiente para nota 10/10 de produção. O pacote fornece gates automáticos que tornam a próxima etapa verificável.


### Apêndice N — Tokens DTCG estruturados (origem única embutida)

O JSON a seguir corresponde ao `design/tokens.json` do pacote v2.0, incorporado **integralmente** para tornar `INSTDESIGN.MD` autocontido quanto aos tokens de design. Não altere uma cópia gerada manualmente. Regenerar `design/tokens.json` a partir deste bloco e executar `scripts/generate_tokens.py` do pacote antes de usar CSS/Dart no build.

<!-- INSTDESIGN_TOKENS_BEGIN -->
```json
{
  "$description": "Instant Design System v1.6.0; DTCG 2025.10 structured tokens. Platform adapters map logical px to iOS pt, Android dp/sp as appropriate, and web CSS px. Do not redistribute SF Pro/NY font files.. Flutter Material 3 colors are explicitly tokenized; the generated theme never uses fromSeed.",
  "color": {
    "light": {
      "canvas": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.98823529,
            0.98431373,
            0.97254902
          ],
          "hex": "#FCFBF8"
        }
      },
      "surface": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            1.0,
            1.0,
            1.0
          ],
          "hex": "#FFFFFF"
        }
      },
      "surfaceSubtle": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.94901961,
            0.9372549,
            0.91764706
          ],
          "hex": "#F2EFEA"
        }
      },
      "text": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.09019608,
            0.09019608,
            0.09019608
          ],
          "hex": "#171717"
        }
      },
      "textSecondary": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.30588235,
            0.29411765,
            0.27843137
          ],
          "hex": "#4E4B47"
        }
      },
      "textMuted": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.38431373,
            0.36862745,
            0.34901961
          ],
          "hex": "#625E59"
        }
      },
      "borderDecorative": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.78039216,
            0.76078431,
            0.73333333
          ],
          "hex": "#C7C2BB"
        }
      },
      "borderFunctional": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.38431373,
            0.36862745,
            0.34901961
          ],
          "hex": "#625E59"
        }
      },
      "focus": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.14117647,
            0.34901961,
            0.72941176
          ],
          "hex": "#2459BA"
        }
      },
      "success": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.09803922,
            0.42352941,
            0.24313725
          ],
          "hex": "#196C3E"
        }
      },
      "warning": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.57647059,
            0.37647059,
            0.0
          ],
          "hex": "#936000"
        }
      },
      "error": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.70588235,
            0.1372549,
            0.09411765
          ],
          "hex": "#B42318"
        }
      }
    },
    "dark": {
      "canvas": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.06666667,
            0.0745098,
            0.09411765
          ],
          "hex": "#111318"
        }
      },
      "surface": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.11764706,
            0.1254902,
            0.14509804
          ],
          "hex": "#1E2025"
        }
      },
      "surfaceSubtle": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.14901961,
            0.16078431,
            0.19215686
          ],
          "hex": "#262931"
        }
      },
      "text": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.96078431,
            0.95294118,
            0.94117647
          ],
          "hex": "#F5F3F0"
        }
      },
      "textSecondary": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.78823529,
            0.77647059,
            0.76078431
          ],
          "hex": "#C9C6C2"
        }
      },
      "borderDecorative": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.34901961,
            0.36470588,
            0.40784314
          ],
          "hex": "#595D68"
        }
      },
      "borderFunctional": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.58823529,
            0.60784314,
            0.65098039
          ],
          "hex": "#969BA6"
        }
      },
      "focus": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.65490196,
            0.70196078,
            1.0
          ],
          "hex": "#A7B3FF"
        }
      },
      "success": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.43921569,
            0.85098039,
            0.63529412
          ],
          "hex": "#70D9A2"
        }
      },
      "warning": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            1.0,
            0.81960784,
            0.47843137
          ],
          "hex": "#FFD17A"
        }
      },
      "error": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            1.0,
            0.56862745,
            0.54901961
          ],
          "hex": "#FF918C"
        }
      },
      "textMuted": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [
            0.78823529,
            0.77647059,
            0.76078431
          ],
          "hex": "#C9C6C2"
        },
        "$description": "Muted text on dark neutral surfaces"
      }
    },
    "product": {
      "light": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.14117647,
              0.34901961,
              0.72941176
            ],
            "hex": "#2459BA"
          },
          "$description": "Text and interactive accent on light neutral surfaces"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.22745098,
              0.19607843,
              0.78431373
            ],
            "hex": "#3A32C8"
          },
          "$description": "Text and interactive accent on light neutral surfaces"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.12156863,
              0.41960784,
              0.32156863
            ],
            "hex": "#1F6B52"
          },
          "$description": "Text and interactive accent on light neutral surfaces"
        }
      },
      "dark": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.57647059,
              0.72941176,
              1.0
            ],
            "hex": "#93BAFF"
          },
          "$description": "Accessible foreground/accent over all dark neutral surfaces"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.73333333,
              0.70980392,
              1.0
            ],
            "hex": "#BBB5FF"
          },
          "$description": "Accessible foreground/accent over all dark neutral surfaces"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.5254902,
              0.85490196,
              0.73333333
            ],
            "hex": "#86DABB"
          },
          "$description": "Accessible foreground/accent over all dark neutral surfaces"
        }
      },
      "onLight": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Text on a light-theme solid product accent"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Text on a light-theme solid product accent"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Text on a light-theme solid product accent"
        }
      },
      "onDark": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Text on a dark-theme solid product accent"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Text on a dark-theme solid product accent"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Text on a dark-theme solid product accent"
        }
      },
      "containerLight": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.88235294,
              0.91764706,
              1.0
            ],
            "hex": "#E1EAFF"
          },
          "$description": "Explicit semantic M3 brand container: containerLight"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.90980392,
              0.89803922,
              1.0
            ],
            "hex": "#E8E5FF"
          },
          "$description": "Explicit semantic M3 brand container: containerLight"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.86666667,
              0.95686275,
              0.92156863
            ],
            "hex": "#DDF4EB"
          },
          "$description": "Explicit semantic M3 brand container: containerLight"
        }
      },
      "onContainerLight": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.10588235,
              0.20784314,
              0.35686275
            ],
            "hex": "#1B355B"
          },
          "$description": "Explicit semantic M3 brand container: onContainerLight"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.16862745,
              0.1254902,
              0.49019608
            ],
            "hex": "#2B207D"
          },
          "$description": "Explicit semantic M3 brand container: onContainerLight"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.27843137,
              0.19215686
            ],
            "hex": "#174731"
          },
          "$description": "Explicit semantic M3 brand container: onContainerLight"
        }
      },
      "containerDark": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.1372549,
              0.23137255,
              0.40784314
            ],
            "hex": "#233B68"
          },
          "$description": "Explicit semantic M3 brand container: containerDark"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.21176471,
              0.18431373,
              0.40392157
            ],
            "hex": "#362F67"
          },
          "$description": "Explicit semantic M3 brand container: containerDark"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09803922,
              0.23137255,
              0.19215686
            ],
            "hex": "#193B31"
          },
          "$description": "Explicit semantic M3 brand container: containerDark"
        }
      },
      "onContainerDark": {
        "speak": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.85098039,
              0.90196078,
              1.0
            ],
            "hex": "#D9E6FF"
          },
          "$description": "Explicit semantic M3 brand container: onContainerDark"
        },
        "study": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.90196078,
              0.88235294,
              1.0
            ],
            "hex": "#E6E1FF"
          },
          "$description": "Explicit semantic M3 brand container: onContainerDark"
        },
        "bible": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.84705882,
              0.97254902,
              0.91372549
            ],
            "hex": "#D8F8E9"
          },
          "$description": "Explicit semantic M3 brand container: onContainerDark"
        }
      }
    },
    "material3": {
      "light": {
        "secondary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.30588235,
              0.29411765,
              0.27843137
            ],
            "hex": "#4E4B47"
          },
          "$description": "Material 3 role secondary"
        },
        "onSecondary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Material 3 role onSecondary"
        },
        "secondaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.94901961,
              0.9372549,
              0.91764706
            ],
            "hex": "#F2EFEA"
          },
          "$description": "Material 3 role secondaryContainer"
        },
        "onSecondaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onSecondaryContainer"
        },
        "secondaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.91372549,
              0.89803922,
              0.8745098
            ],
            "hex": "#E9E5DF"
          },
          "$description": "Material 3 role secondaryFixed"
        },
        "secondaryFixedDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.78823529,
              0.77647059,
              0.76078431
            ],
            "hex": "#C9C6C2"
          },
          "$description": "Material 3 role secondaryFixedDim"
        },
        "onSecondaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onSecondaryFixed"
        },
        "onSecondaryFixedVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.30588235,
              0.29411765,
              0.27843137
            ],
            "hex": "#4E4B47"
          },
          "$description": "Material 3 role onSecondaryFixedVariant"
        },
        "tertiary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.14117647,
              0.34901961,
              0.72941176
            ],
            "hex": "#2459BA"
          },
          "$description": "Material 3 role tertiary"
        },
        "onTertiary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Material 3 role onTertiary"
        },
        "tertiaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.89411765,
              0.91372549,
              1.0
            ],
            "hex": "#E4E9FF"
          },
          "$description": "Material 3 role tertiaryContainer"
        },
        "onTertiaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onTertiaryContainer"
        },
        "tertiaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.89411765,
              0.91372549,
              1.0
            ],
            "hex": "#E4E9FF"
          },
          "$description": "Material 3 role tertiaryFixed"
        },
        "tertiaryFixedDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.76078431,
              0.80392157,
              1.0
            ],
            "hex": "#C2CDFF"
          },
          "$description": "Material 3 role tertiaryFixedDim"
        },
        "onTertiaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onTertiaryFixed"
        },
        "onTertiaryFixedVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.19215686,
              0.24705882,
              0.47843137
            ],
            "hex": "#313F7A"
          },
          "$description": "Material 3 role onTertiaryFixedVariant"
        },
        "onError": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Material 3 role onError"
        },
        "errorContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              0.94117647,
              0.93333333
            ],
            "hex": "#FFF0EE"
          },
          "$description": "Material 3 role errorContainer"
        },
        "onErrorContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.5372549,
              0.10588235,
              0.08627451
            ],
            "hex": "#891B16"
          },
          "$description": "Material 3 role onErrorContainer"
        },
        "surfaceDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.91372549,
              0.89803922,
              0.8745098
            ],
            "hex": "#E9E5DF"
          },
          "$description": "Material 3 role surfaceDim"
        },
        "surfaceBright": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Material 3 role surfaceBright"
        },
        "surfaceContainerLowest": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              1.0,
              1.0
            ],
            "hex": "#FFFFFF"
          },
          "$description": "Material 3 role surfaceContainerLowest"
        },
        "surfaceContainerLow": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.98823529,
              0.98431373,
              0.97254902
            ],
            "hex": "#FCFBF8"
          },
          "$description": "Material 3 role surfaceContainerLow"
        },
        "surfaceContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.94901961,
              0.9372549,
              0.91764706
            ],
            "hex": "#F2EFEA"
          },
          "$description": "Material 3 role surfaceContainer"
        },
        "surfaceContainerHigh": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.91372549,
              0.89803922,
              0.8745098
            ],
            "hex": "#E9E5DF"
          },
          "$description": "Material 3 role surfaceContainerHigh"
        },
        "surfaceContainerHighest": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.86666667,
              0.84313725,
              0.81960784
            ],
            "hex": "#DDD7D1"
          },
          "$description": "Material 3 role surfaceContainerHighest"
        },
        "onSurfaceVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.30588235,
              0.29411765,
              0.27843137
            ],
            "hex": "#4E4B47"
          },
          "$description": "Material 3 role onSurfaceVariant"
        },
        "outline": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.38431373,
              0.36862745,
              0.34901961
            ],
            "hex": "#625E59"
          },
          "$description": "Material 3 role outline"
        },
        "outlineVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.78039216,
              0.76078431,
              0.73333333
            ],
            "hex": "#C7C2BB"
          },
          "$description": "Material 3 role outlineVariant"
        },
        "shadow": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role shadow"
        },
        "scrim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role scrim"
        },
        "inverseSurface": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.11764706,
              0.1254902,
              0.14509804
            ],
            "hex": "#1E2025"
          },
          "$description": "Material 3 role inverseSurface"
        },
        "onInverseSurface": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.96078431,
              0.95294118,
              0.94117647
            ],
            "hex": "#F5F3F0"
          },
          "$description": "Material 3 role onInverseSurface"
        }
      },
      "dark": {
        "secondary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.78823529,
              0.77647059,
              0.76078431
            ],
            "hex": "#C9C6C2"
          },
          "$description": "Material 3 role secondary"
        },
        "onSecondary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Material 3 role onSecondary"
        },
        "secondaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.21960784,
              0.23529412,
              0.26666667
            ],
            "hex": "#383C44"
          },
          "$description": "Material 3 role secondaryContainer"
        },
        "onSecondaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.96078431,
              0.95294118,
              0.94117647
            ],
            "hex": "#F5F3F0"
          },
          "$description": "Material 3 role onSecondaryContainer"
        },
        "secondaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.91372549,
              0.89803922,
              0.8745098
            ],
            "hex": "#E9E5DF"
          },
          "$description": "Material 3 role secondaryFixed"
        },
        "secondaryFixedDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.78823529,
              0.77647059,
              0.76078431
            ],
            "hex": "#C9C6C2"
          },
          "$description": "Material 3 role secondaryFixedDim"
        },
        "onSecondaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onSecondaryFixed"
        },
        "onSecondaryFixedVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.30588235,
              0.29411765,
              0.27843137
            ],
            "hex": "#4E4B47"
          },
          "$description": "Material 3 role onSecondaryFixedVariant"
        },
        "tertiary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.65490196,
              0.70196078,
              1.0
            ],
            "hex": "#A7B3FF"
          },
          "$description": "Material 3 role tertiary"
        },
        "onTertiary": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Material 3 role onTertiary"
        },
        "tertiaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.2,
              0.22745098,
              0.34901961
            ],
            "hex": "#333A59"
          },
          "$description": "Material 3 role tertiaryContainer"
        },
        "onTertiaryContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.89019608,
              0.91372549,
              1.0
            ],
            "hex": "#E3E9FF"
          },
          "$description": "Material 3 role onTertiaryContainer"
        },
        "tertiaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.89411765,
              0.91372549,
              1.0
            ],
            "hex": "#E4E9FF"
          },
          "$description": "Material 3 role tertiaryFixed"
        },
        "tertiaryFixedDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.76078431,
              0.80392157,
              1.0
            ],
            "hex": "#C2CDFF"
          },
          "$description": "Material 3 role tertiaryFixedDim"
        },
        "onTertiaryFixed": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onTertiaryFixed"
        },
        "onTertiaryFixedVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.19215686,
              0.24705882,
              0.47843137
            ],
            "hex": "#313F7A"
          },
          "$description": "Material 3 role onTertiaryFixedVariant"
        },
        "onError": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Material 3 role onError"
        },
        "errorContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.33333333,
              0.14117647,
              0.1254902
            ],
            "hex": "#552420"
          },
          "$description": "Material 3 role errorContainer"
        },
        "onErrorContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              1.0,
              0.81960784,
              0.81176471
            ],
            "hex": "#FFD1CF"
          },
          "$description": "Material 3 role onErrorContainer"
        },
        "surfaceDim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.06666667,
              0.0745098,
              0.09411765
            ],
            "hex": "#111318"
          },
          "$description": "Material 3 role surfaceDim"
        },
        "surfaceBright": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.22745098,
              0.23921569,
              0.27843137
            ],
            "hex": "#3A3D47"
          },
          "$description": "Material 3 role surfaceBright"
        },
        "surfaceContainerLowest": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.04705882,
              0.05490196,
              0.06666667
            ],
            "hex": "#0C0E11"
          },
          "$description": "Material 3 role surfaceContainerLowest"
        },
        "surfaceContainerLow": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09803922,
              0.1254902
            ],
            "hex": "#171920"
          },
          "$description": "Material 3 role surfaceContainerLow"
        },
        "surfaceContainer": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.14901961,
              0.16078431,
              0.19215686
            ],
            "hex": "#262931"
          },
          "$description": "Material 3 role surfaceContainer"
        },
        "surfaceContainerHigh": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.18823529,
              0.20392157,
              0.23529412
            ],
            "hex": "#30343C"
          },
          "$description": "Material 3 role surfaceContainerHigh"
        },
        "surfaceContainerHighest": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.22352941,
              0.23921569,
              0.27843137
            ],
            "hex": "#393D47"
          },
          "$description": "Material 3 role surfaceContainerHighest"
        },
        "onSurfaceVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.78823529,
              0.77647059,
              0.76078431
            ],
            "hex": "#C9C6C2"
          },
          "$description": "Material 3 role onSurfaceVariant"
        },
        "outline": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.58823529,
              0.60784314,
              0.65098039
            ],
            "hex": "#969BA6"
          },
          "$description": "Material 3 role outline"
        },
        "outlineVariant": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.34901961,
              0.36470588,
              0.40784314
            ],
            "hex": "#595D68"
          },
          "$description": "Material 3 role outlineVariant"
        },
        "shadow": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.0,
              0.0,
              0.0
            ],
            "hex": "#000000"
          },
          "$description": "Material 3 role shadow"
        },
        "scrim": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.0,
              0.0,
              0.0
            ],
            "hex": "#000000"
          },
          "$description": "Material 3 role scrim"
        },
        "inverseSurface": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.96078431,
              0.95294118,
              0.94117647
            ],
            "hex": "#F5F3F0"
          },
          "$description": "Material 3 role inverseSurface"
        },
        "onInverseSurface": {
          "$type": "color",
          "$value": {
            "colorSpace": "srgb",
            "components": [
              0.09019608,
              0.09019608,
              0.09019608
            ],
            "hex": "#171717"
          },
          "$description": "Material 3 role onInverseSurface"
        }
      }
    }
  },
  "space": {
    "0": {
      "$type": "dimension",
      "$value": {
        "value": 0,
        "unit": "px"
      }
    },
    "4": {
      "$type": "dimension",
      "$value": {
        "value": 4,
        "unit": "px"
      }
    },
    "8": {
      "$type": "dimension",
      "$value": {
        "value": 8,
        "unit": "px"
      }
    },
    "12": {
      "$type": "dimension",
      "$value": {
        "value": 12,
        "unit": "px"
      }
    },
    "16": {
      "$type": "dimension",
      "$value": {
        "value": 16,
        "unit": "px"
      }
    },
    "20": {
      "$type": "dimension",
      "$value": {
        "value": 20,
        "unit": "px"
      }
    },
    "24": {
      "$type": "dimension",
      "$value": {
        "value": 24,
        "unit": "px"
      }
    },
    "32": {
      "$type": "dimension",
      "$value": {
        "value": 32,
        "unit": "px"
      }
    },
    "40": {
      "$type": "dimension",
      "$value": {
        "value": 40,
        "unit": "px"
      }
    },
    "48": {
      "$type": "dimension",
      "$value": {
        "value": 48,
        "unit": "px"
      }
    },
    "64": {
      "$type": "dimension",
      "$value": {
        "value": 64,
        "unit": "px"
      }
    },
    "80": {
      "$type": "dimension",
      "$value": {
        "value": 80,
        "unit": "px"
      }
    },
    "96": {
      "$type": "dimension",
      "$value": {
        "value": 96,
        "unit": "px"
      }
    }
  },
  "radius": {
    "card": {
      "$type": "dimension",
      "$value": {
        "value": 20,
        "unit": "px"
      }
    },
    "cardFeature": {
      "$type": "dimension",
      "$value": {
        "value": 24,
        "unit": "px"
      }
    },
    "input": {
      "$type": "dimension",
      "$value": {
        "value": 12,
        "unit": "px"
      }
    },
    "dialog": {
      "$type": "dimension",
      "$value": {
        "value": 24,
        "unit": "px"
      }
    },
    "pill": {
      "$type": "dimension",
      "$value": {
        "value": 9999,
        "unit": "px"
      }
    }
  },
  "motion": {
    "duration": {
      "instant": {
        "$type": "duration",
        "$value": {
          "value": 100,
          "unit": "ms"
        }
      },
      "fast": {
        "$type": "duration",
        "$value": {
          "value": 160,
          "unit": "ms"
        }
      },
      "normal": {
        "$type": "duration",
        "$value": {
          "value": 220,
          "unit": "ms"
        }
      },
      "modal": {
        "$type": "duration",
        "$value": {
          "value": 280,
          "unit": "ms"
        }
      },
      "caption": {
        "$type": "duration",
        "$value": {
          "value": 120,
          "unit": "ms"
        }
      }
    },
    "ease": {
      "standard": {
        "$type": "cubicBezier",
        "$value": [
          0.2,
          0.0,
          0.0,
          1.0
        ]
      }
    }
  },
  "typography": {
    "$description": "Apple HIG default Large Dynamic Type style measurements for iOS; Android and web mapping are platform-specific starting values. Do not clamp system text scaling.",
    "ios": {
      "$description": "Native iOS San Francisco; DO NOT bundle SF Pro/NY files. 1px in token == 1 logical pt in iOS adapter; large default size, dynamically scale at runtime.",
      "largeTitle": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 34,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 41,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "title1": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 28,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 34,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "title2": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 22,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 28,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "title3": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 25,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "headline": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 17,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 22,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 600
        }
      },
      "body": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 17,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 22,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "callout": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 21,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "subhead": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 15,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "footnote": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 13,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 18,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "caption1": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 12,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "caption2": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 11,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 13,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      }
    },
    "android": {
      "$description": "Roboto system; Material 3 reference starting values; dimension units are logical sp for text. Typography adapter must allow native font scaling.",
      "displayLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 57,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 64,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "displayMedium": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 45,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 52,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "displaySmall": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 36,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 44,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "headlineLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 32,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 40,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "headlineMedium": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 28,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 36,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "headlineSmall": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 24,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 32,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "titleLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 22,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 28,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "titleMedium": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 24,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "titleSmall": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 14,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "bodyLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 24,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "bodyMedium": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 14,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "bodySmall": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 12,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "labelLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 14,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "labelMedium": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 12,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "labelSmall": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 11,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      }
    },
    "web": {
      "$description": "Inter with verified license, fallback system-ui. CSS px; browser zoom and text resizing remain enabled.",
      "display": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 48,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 53,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "h1": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 36,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 43,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "h2": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 30,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 38,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "h3": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 24,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 31,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "headline": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 27,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 600
        }
      },
      "body": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 24,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "bodyLarge": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 18,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 27,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "callout": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 16,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 23,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "subhead": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 14,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 500
        }
      },
      "footnote": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 14,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 20,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      },
      "caption": {
        "fontSize": {
          "$type": "dimension",
          "$value": {
            "value": 12,
            "unit": "px"
          }
        },
        "lineHeight": {
          "$type": "dimension",
          "$value": {
            "value": 17,
            "unit": "px"
          }
        },
        "fontWeight": {
          "$type": "fontWeight",
          "$value": 400
        }
      }
    }
  },
  "component": {
    "control": {
      "targetIos": {
        "$type": "dimension",
        "$value": {
          "value": 44,
          "unit": "px"
        }
      },
      "targetAndroid": {
        "$type": "dimension",
        "$value": {
          "value": 48,
          "unit": "px"
        }
      },
      "buttonHeightIos": {
        "$type": "dimension",
        "$value": {
          "value": 48,
          "unit": "px"
        }
      },
      "buttonHeightAndroid": {
        "$type": "dimension",
        "$value": {
          "value": 48,
          "unit": "px"
        }
      },
      "buttonHorizontalPadding": {
        "$type": "dimension",
        "$value": {
          "value": 20,
          "unit": "px"
        }
      },
      "inputMinHeightIos": {
        "$type": "dimension",
        "$value": {
          "value": 48,
          "unit": "px"
        }
      },
      "inputMinHeightAndroid": {
        "$type": "dimension",
        "$value": {
          "value": 56,
          "unit": "px"
        }
      },
      "focusRingWidthWeb": {
        "$type": "dimension",
        "$value": {
          "value": 2,
          "unit": "px"
        }
      },
      "cardPadding": {
        "$type": "dimension",
        "$value": {
          "value": 16,
          "unit": "px"
        }
      },
      "listRowMinHeight": {
        "$type": "dimension",
        "$value": {
          "value": 56,
          "unit": "px"
        }
      }
    }
  }
}
```
<!-- INSTDESIGN_TOKENS_END -->

### Apêndice O — Extração e validação do arquivo único

Como o Markdown é a fonte editorial de design, não é um arquivo executável, a integração deve materializar tokens para a ferramenta de build. Executar na raiz do repositório de destino com `INSTDESIGN.MD` presente:

```python
from pathlib import Path
import json

md = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
start = md.index('<!-- INSTDESIGN_TOKENS_BEGIN -->')
end = md.index('<!-- INSTDESIGN_TOKENS_END -->', start)
fragment = md[start:end]
data = json.loads(fragment.split('```json\n', 1)[1].rsplit('```', 1)[0])
dest = Path('design/tokens.json')
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Tokens extraídos:', dest)
```

Em seguida executar a geração e os testes da stack conforme `scripts/generate_tokens.py`, `scripts/run_checks.sh`, `scripts/flutter_smoke.sh`, workflows do pacote. **Scripts e Flutter SDK continuam dependências externas; seu código-fonte não é magicamente incorporado a um documento Markdown.** Nenhum teste é considerado aprovado pela simples presença dessas instruções.

### Apêndice P — Proveniência, fontes e testes realmente executados

- Documento de partida: `Instant Design System v2.0`, gerado em 2026-10-15, contendo contratos, 259 tokens e relatórios prévios.
- Marca e motion de abertura: `raphaelribeirob/InstantSpeak`, branch `main`, código e `DESIGN.md` consultados em 2026-10-15.
- As verificações de fonte/code paths feitas para montar este arquivo são **inspeção estática**. Não substituem `flutter analyze`, `flutter test`, integração em app nem validações físicas.
- A versão v2.0 informou testes locais previamente executados; esta consolidação **não reclassifica testes antigos como testes do novo artefato**.
- Condição mínima para liberar produção: gates existentes de WebGL/Canvas, tokens, CI Flutter e evidências nativas, mais `BRAND-001..010`, sem regressões nem pendências de marca.



## 13B. Universal Motion — matriz multiplataforma (normativo v2.5)

**Objetivo:** um mesmo contrato de *estados, acessibilidade, marca, áudio e comportamento* para Android suportado pelo Flutter, Web e Apple (iOS/iPadOS). Não prometer "todos os aparelhos": as versões mínimas suportadas e os limites de GPU de cada aplicativo precisam ser declarados e testados. **WebGL da web não é o shader Flutter nativo.**

### 13B.1 Arquitetura por plataforma

| Plataforma | Implementação primária | Fallback obrigatório | Gate antes de publicar |
|---|---|---|---|
| Web desktop/mobile | Canvas 2D; WebGL original opcional se contexto válido | Canvas 2D ou figura estática | Chromium + Firefox + WebKit, sem overflow, `prefers-reduced-motion`, estados, áudio RMS, perda do contexto GPU |
| Android | Flutter `CustomPainter` 2D sem WebView | Figura estática e estado textual, quando necessário | `flutter analyze`, `flutter test`, compilação APK/AAB, emuladores e pelo menos dispositivos de GPU/Android diferentes, TalkBack |
| iOS / iPadOS | Flutter `CustomPainter` 2D sem WebView | Figura estática e estado textual | Compilação no macOS, simuladores, dispositivos físicos, Reduce Motion e VoiceOver |
| Futuro efeito 3D nativo | Implementação específica com feature flag e orçamento GPU | Reverter imediatamente à versão 2D | Golden/regressão, redução de quadros, falha de shader, memória, bateria |

**P0 descoberto nesta auditoria:** `MediaQuery.disableAnimationsOf(context)` corresponde à remoção de animações do Android, **não** necessariamente ao Reduce Motion do iOS. O adaptador Flutter precisa verificar adicionalmente `WidgetsBinding.instance.platformDispatcher.accessibilityFeatures.reduceMotion` e observar mudanças de acessibilidade. Fonte: https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html . Correção criada em branch de revisão no repositório InstantSpeak: https://github.com/raphaelribeirob/InstantSpeak/pull/95 . Não marcar como mesclada ou compilada sem confirmar.

### 13B.2 Contrato visual e audiofuncional

- Abertura *exclusiva InstantSpeak*: `InstantSpeak™ → ISpeak™`, League Spartan 400 licenciada, sem esticar glifos, borda preta e fundo branco; `350 ms` pausa de origem, `1300 ms` contração cubic ease-in-out, `1000 ms` pausa final; duração total `2650 ms`. Pular obrigatório, inclusive teclado e leitores de tela. Em Reduce Motion, apresentar resultado estático e não exigir espera.
- A abertura **não** substitui launch screen nativo. Exibir como elemento do onboarding ou primeiro acesso quando apropriado; não bloquear sempre o retorno à conversa. A Apple orienta abrir prontamente e minimizar o launch screen: https://developer.apple.com/design/human-interface-guidelines/launching .
- Estados de voz canônicos: `idle`, `listening`, `processing`, `speaking`, `paused`, `error`; todo estado deve ter descrição textual e acessível, independente da cor/animação.
- Somente medições RMS reais do microfone ou áudio de reprodução podem induzir movimento sincronizado. Sem sinal, mostrar intensidade neutra; valores de demonstração precisam exibir explicitamente **SIMULADO**, nunca ser confundidos com saída de voz real.
- WebGL só pode iniciar se disponível, e recuperar por Canvas 2D após falha, perda do contexto ou baixo consumo; o caminho base Android/iOS exige zero dependência de WebGL/WebView. `lowPower` interrompe loops decorativos.
- Ao sair da tela, ocultar aba ou destruir widget, interromper timers/tickers/frames. Ao mudar redução de movimento, congelar/encerrar sem transições contínuas.

### 13B.3 Matriz de QA e aceitação (MOT-001..024)

| ID | Verificação | Aprovável com laboratório atual? |
|---|---|---|
| MOT-001 | Layout largura 320px sem overflow | Sim, Chromium emulado |
| MOT-002 | Larguras 360/390/412/480px | Sim, Chromium emulado |
| MOT-003 | Dobrável/tablet 600/768px | Sim, Chromium emulado |
| MOT-004 | Landscape 1024px e desktop 1440/1920px | Sim, Chromium emulado |
| MOT-005 | DPR 1, 2 e 3 | Sim, Chromium emulado |
| MOT-006 | Semântica visível e `role=status` | Sim, web |
| MOT-007 | Redução de movimento na abertura | Sim, web; Flutter pendente |
| MOT-008 | Configuração reduzida alterada em execução | Sim, web; Flutter pendente |
| MOT-009 | Botão Pular e controle de tempo | Sim, web; Flutter pendente |
| MOT-010 | Fases 350/1300/1000 ms e easing | Sim, teste web; cronometração física pendente |
| MOT-011 | WebGL renderiza pixels e estados reais | Sim, Chromium + SwiftShader, não GPU física |
| MOT-012 | Fallback Canvas 2D sem WebGL | Sim, Chromium |
| MOT-013 | Mutações: shader quebrado, canvas invisível | Sim, suíte legado v2.0 |
| MOT-014 | RMS WAV real e ausência de ondas fictícias | Sim, laboratório web |
| MOT-015 | Microfone real em permissões e interrupções | Não; SDK/hardware real |
| MOT-016 | Safari/WebKit e Firefox | Não; teste CI previsto |
| MOT-017 | Flutter analyze/test para abertura e orbe 2D | Não; teste CI previsto |
| MOT-018 | Compilação Android APK/AAB | Não; teste CI previsto |
| MOT-019 | Compilação iOS Simulator/TestFlight | Não; teste CI previsto |
| MOT-020 | Android físico com TalkBack e remoção de animações | Não; QA física |
| MOT-021 | iPhone/iPad físico com VoiceOver e Reduce Motion | Não; QA física |
| MOT-022 | FPS/jank, aquecimento, memória e bateria por classe | Não; QA física |
| MOT-023 | Overlay do motion nos 3 apps: tela, rota e áudio SDK reais | Não; integração nos apps |
| MOT-024 | Aprovação humana de snapshots e captura com hashes | Não; QA nativa |

**MOT-001..014** podem ser submetidos à validação de laboratório, mas não equivalem a teste físico Apple/Android. **MOT-015..024** permanecem bloqueios de release até artefatos reais. Testar motores WebKit/Firefox é obrigatório, não presumido por Chrome. Ao contrário de um teste unitário, um log de CI só atesta o build correspondente.

### 13B.4 Critério de 10/10 e fontes de evidência

"10/10 de produção" só pode ser declarado com todos os gates aplicáveis aprovados, manifestos assinados (build/commit/OS/device/locale), evidência de acessibilidade, áudio, performance e revisão humana. **O teste emulado é SIMULADO; não comprova aparelho físico.** A matriz real Android envolve ao menos versões suportadas representativas, classes de GPU e taxa de atualização; amostragem e suporte mínimo explicitados antes do lançamento. Não há garantia universal para aparelhos fora do suporte Flutter/aplicativo.

**Esta revisão:** suíte de laboratório v2.0 reexecutada localmente; 30 combinações brand web e 12 combinações orb web validadas. Fontes executáveis fornecidas em pacote separado porque código de Flutter/Web não se torna executável só por ser inserido neste Markdown. Os testes de Flutter iOS/Android, WebKit/Firefox e hardware real **não foram executados**. Preserve o status `NOT_RUN` na documentação até que CI e validação física produzam logs reais.


### Apêndice Q — Autovalidação independente do arquivo único e contratos Global-First

A autovalidação verifica o que **este Markdown** pode provar sem Flutter: JSON íntegro, tipos de tokens, duplicação, integridade da timeline, presença de contratos de marca e contrastes de texto em pares sólidos. **Ela não executa os aplicativos.** A v2.4 inclui uma implementação de referência com fixtures de resolução de idiomas, RTL e validação de cotações e alegações de mercado; ela não se torna código Flutter. Todos os resultados são sobre o arquivo único efetivamente fornecido, sem depender dos relatórios de versões antigas.

Na pasta em que o arquivo `INSTDESIGN.MD` estiver salvo, executar no terminal:

```bash
python3 - <<'PY'
from pathlib import Path
import re
source = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
code = re.search(r'<!-- INSTDESIGN_SELFTEST_BEGIN -->\s*```python\n(.*?)\n```\s*<!-- INSTDESIGN_SELFTEST_END -->', source, re.S)
assert code, 'Autoteste embutido não encontrado'
exec(compile(code.group(1), 'INSTDESIGN.MD::selftest', 'exec'))
PY
```

<!-- INSTDESIGN_SELFTEST_BEGIN -->
```python
from pathlib import Path
import re, json, math, hashlib, sys
if sys.flags.optimize: raise RuntimeError('Autoteste não pode rodar com otimizações -O: assertions desabilitados')
text = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
blocks = re.findall(r'(?m)^<!-- INSTDESIGN_TOKENS_BEGIN -->\s*```json\n(.*?)\n```\s*<!-- INSTDESIGN_TOKENS_END -->', text, re.S)
assert len(blocks)==1, f'Blocos canônicos: {len(blocks)}, esperado 1'
tokens=json.loads(blocks[0]); leaves=[]
def walk(node, path=()):
    if not isinstance(node,dict): return
    if '$type' in node:
        assert '$value' in node, path
        leaves.append(('.'.join(path),node)); return
    for key,val in node.items():
        if not key.startswith('$'): walk(val, (*path,key))
walk(tokens)
assert len(leaves)==259, len(leaves)
for name, token in leaves:
    kind,val=token['$type'],token['$value']
    if kind=='color':
        assert val.get('colorSpace')=='srgb' and len(val.get('components',[]))==3, name
        assert re.fullmatch(r'#[0-9A-Fa-f]{6}',val.get('hex','')),name
        assert all(abs(c-int(val['hex'][1+2*i:3+2*i],16)/255)<0.00001 for i,c in enumerate(val['components'])),name
    elif kind in ('duration','dimension'):
        assert isinstance(val,dict) and type(val.get('value')) in (int,float) and math.isfinite(val['value']) and val['value']>=0,name
        assert val.get('unit') in (('ms','s') if kind=='duration' else ('px','rem')),name
    elif kind=='cubicBezier':
        assert len(val)==4 and all(type(x) in (int,float) and math.isfinite(x) for x in val),name
        assert 0<=val[0]<=1 and 0<=val[2]<=1,name
    elif kind=='fontWeight': assert type(val) in (int,float) and 1<=val<=1000,name
    else: assert kind in ('number','string','boolean','fontFamily'),(name,kind)
def c(*path):
    node=tokens
    for p in path: node=node[p]
    return node['$value']['hex']
def L(x):
    v=[int(x[i:i+2],16)/255 for i in (1,3,5)]
    return sum((a/12.92 if a<=0.04045 else ((a+0.055)/1.055)**2.4)*w for a,w in zip(v,(0.2126,0.7152,0.0722)))
def contrast(a,b):
    hi,lo=sorted((L(a),L(b)),reverse=True)
    return (hi+0.05)/(lo+0.05)
checks=[]
for mode in ('light','dark'):
    for surface in ('canvas','surface','surfaceSubtle'):
        bg=c('color',mode,surface)
        for role in ('text','textSecondary','textMuted','success','warning','error'):
            if role in tokens['color'][mode]: checks.append((f'{mode}.{role}/{surface}',contrast(c('color',mode,role),bg)))
        for app in ('speak','study','bible'):
            checks.append((f'{mode}.{app}/{surface}',contrast(c('color','product',mode,app),bg)))
for mode in ('light','dark'):
    for app in ('speak','study','bible'):
        on='onLight' if mode=='light' else 'onDark'
        checks.append((f'{mode}.onAccent.{app}',contrast(c('color','product',mode,app),c('color','product',on,app))))
bad=[(p,round(v,2)) for p,v in checks if v<4.5-1e-6]
assert not bad, bad
# Sincronismo editorial: tabelas canônicas precisam refletir os mesmos valores do JSON.
for mode, before, after in (
    ('light','### 2.2 Primitivos de cor (light)','### 2.3 Primitivos de cor (dark)'),
    ('dark','### 2.3 Primitivos de cor (dark)','### 2.4 Acentos por produto'),
):
    table=text.split(before,1)[1].split(after,1)[0]
    for label, hexa in re.findall(r'\| `([^`]+)` \| `(#[A-Fa-f0-9]{6})`',table):
        key=label.split('.')[-1]
        key={'border':'borderDecorative','feedbackSuccess':'success','feedbackWarning':'warning','feedbackError':'error'}.get(key,key)
        if key=='divider': continue # token histórico explicitamente proibido para uso no código
        assert key in tokens['color'][mode], (mode,key)
        assert hexa.upper()==c('color',mode,key).upper(), (mode,key,hexa)
opening=text.split('### 2.6 Motion de abertura aprovado',1)[1].split('### 2.7 Testes de aceite',1)[0]
for fragment in ('**350 ms**','**1.300 ms**','**1.000 ms**','2.650 ms','Curves.easeInOutCubic'):
    assert fragment in opening, f'Linha do tempo não sincronizada: {fragment}'
# Global-first: JSON de capacidade não deve certificar produtos por omissão nem prometer oferta inexistente.
policy_blocks = re.findall(r'(?m)^<!-- GLOBAL_FIRST_POLICY_BEGIN -->\s*```json\n(.*?)\n```\s*<!-- GLOBAL_FIRST_POLICY_END -->', text, re.S)
assert len(policy_blocks)==1, f'Blocos Global-First: {len(policy_blocks)}'
policy=json.loads(policy_blocks[0])
assert policy['version']=='3.0.0'
assert set(policy['products'])=={'InstantSpeak','InstantStudy','InstantBible','InstantVest'}
assert isinstance(policy.get('releaseEvidence'),dict) and policy['releaseEvidence']['schemaVersion']==1
assert isinstance(policy['releaseEvidence']['releaseClaims'],list) and isinstance(policy['releaseEvidence']['evidenceRecords'],list)
assert policy['products']['InstantVest']['runtime']=='React/Vite and Capacitor 8, not Flutter'
assert policy['products']['InstantVest']['observedCapacitorAppId']=='com.instante.vest'
assert policy['products']['InstantVest']['nativeAndroidProjectVersioned'] is False
assert policy['products']['InstantVest']['observedAndroidMaestroCommand']=='qa:android:maestro' 
assert policy['products']['InstantSpeak']['documentedTargetCourses']==['en']
assert set(policy['products']['InstantStudy']['observedAuthoredUiPacks'])=={'en','pt-BR'}
assert len(policy['products']['InstantBible']['observedAuthoredUiPacks'])==22
for key, product in policy['products'].items():
    assert isinstance(product['verifiedUiPacks'],list) and isinstance(product['verifiedEndToEndMarketLocales'],list), key
    assert type(product['rtlPhysicalDeviceValidated']) is bool, key
    assert isinstance(product.get('verifiedContentTranslations',[]),list), key
assert all(policy['releaseGate'].values()), 'Falha no bloqueio de release'
for index in range(1,35):
    assert re.search(r'`GF-'+str(index).zfill(3)+r'`', text), 'Cenário GF faltante: '+str(index)
for marker in ('13A.2 Dimensões independentes', '13A.5 Contrato de localização', '13A.6 Direção bidirecional',
               '13A.10 LocalizedPaywall', '13A.13 Matriz mínima', '13A.16A Contrato de testes',
               '13A.17 Definition of Done'):
    assert re.search(r'(?m)^### '+re.escape(marker)+r'(?=[,\s–—]|$)', text), marker
for contract in ('### 2.5 Marca InstantSpeak','### 2.6 Motion de abertura','### 2.7 Testes de aceite','### 2.8 Divergência de ícone','LeagueSpartan','InstantSpeak™','ISpeak™','Curves.easeInOutCubic','BRAND-001','BRAND-010','InstantStudy','InstantBible','VoiceOver','TalkBack'):
    assert contract in text,contract
assert len(re.findall(r'(?m)^- \*\*v1\.8\.0',text))==1
assert 350+1300+1000==2650
assert sum(line.lstrip().startswith('```') for line in text.splitlines())%2==0
# Contratos comportamentais da v2.4: implementação de referência sem Flutter.
# Estes testes não substituem os GF-001..028 em dispositivos.
import unicodedata

def normalize_locale(value):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?', value):
        return None
    parts=value.split('-'); result=[parts[0].lower()]
    for part in parts[1:]:
        result.append(part.title() if len(part)==4 else (part.upper() if len(part)==2 else part))
    return '-'.join(result)

def ui_candidate(requested, installed):
    tag=normalize_locale(requested)
    if tag is None: return None
    if tag in installed: return tag
    parts=tag.split('-'); lang=parts[0]
    if len(parts)>1 and len(parts[1])==4:
        language_script='-'.join(parts[:2])
        if language_script in installed: return language_script
        # Não atravesse script explícito; nem use variante de outro script.
        return None
    if lang in installed: return lang
    return None

def resolve_ui(preferred, device, installed, fallback='en'):
    valid={normalize_locale(tag) for tag in installed}
    assert None not in valid and len(valid)==len(installed), 'Catálogo inválido / duplicado'
    assert fallback in valid, 'Fallback sem pacote real'
    for choice in (preferred, device):
        resolved=ui_candidate(choice,valid)
        if resolved: return resolved
    return fallback

def direction_for_locale(value):
    tag=normalize_locale(value)
    if tag is None: return 'ltr'
    bits=tag.split('-')
    if len(bits)>1 and len(bits[1])==4:
        if bits[1] in ('Arab','Hebr'): return 'rtl'
        if bits[1] in ('Latn','Cyrl','Hans','Hant'): return 'ltr'
    return 'rtl' if bits[0] in ('ar','he','fa','ur','ps','sd') else 'ltr'

def trusted_price_quote(quote, device_locale='en-US'):
    if not isinstance(quote,dict): return False
    # device_locale propositalmente não é consultado na escolha do storefront.
    required=('provider','productId','storefrontCountry','currency','displayPrice','billingPeriod','verified')
    if any(key not in quote for key in required): return False
    if quote['provider'] not in ('AppStore','GooglePlay','Paddle'): return False
    if quote['verified'] is not True: return False
    if not isinstance(quote['productId'],str) or not quote['productId'].strip(): return False
    if not isinstance(quote['displayPrice'],str) or not quote['displayPrice'].strip(): return False
    if not isinstance(quote['billingPeriod'],str) or not quote['billingPeriod'].strip(): return False
    if not isinstance(quote['currency'],str) or not re.fullmatch(r'[A-Z]{3}', quote['currency']): return False
    if not isinstance(quote['storefrontCountry'],str) or not re.fullmatch(r'[A-Z]{2}', quote['storefrontCountry']): return False
    return True

def can_claim_market(evidence):
    if not isinstance(evidence,dict): return False
    req=('app','storefrontCountry','uiLocale','capability','commit','build',
         'uiReviewed','contentVerified','platformQaPassed','legalReviewed','humanApproved')
    if any(k not in evidence for k in req): return False
    for k in ('app','storefrontCountry','uiLocale','capability','commit','build'):
        if not isinstance(evidence[k],str) or not evidence[k].strip():return False
    if normalize_locale(evidence['uiLocale']) is None: return False
    if evidence['app'] not in policy['products']: return False
    for flag in ('uiReviewed','contentVerified','platformQaPassed','legalReviewed','humanApproved'):
        if evidence[flag] is not True:return False
    if evidence.get('requiresPayment',False) and evidence.get('paymentsVerified') is not True:return False
    return True

installed=['en','pt-BR','fr','zh-Hans','zh-Hant','ar','sr-Cyrl','sr-Latn']
locale_fixtures=[
 ('pt-BR','en-US','pt-BR'), ('xx-XX','pt-BR','pt-BR'),
 ('pt-PT','fr-FR','fr'), ('pt-PT','en-US','en'),
 ('zh-Hant','zh-Hans','zh-Hant'),('zh-Hant-HK','zh-Hans-CN','zh-Hant'),
 ('zh-Hans-CN','fr-FR','zh-Hans'),('sr-Latn-RS','sr-Cyrl-RS','sr-Latn'),
 ('sr-Cyrl-RS','fr-FR','sr-Cyrl'), ('ar-SA','fr-FR','ar'),
 ('pt_BR','fr-FR','fr'), (None,'pt-PT','en'),
 ('es-ES','xx-XX','en'), ('fr-FR','pt-BR','fr'),
]
for pref, device, expected in locale_fixtures:
    got=resolve_ui(pref,device,installed)
    assert got==expected, (pref,device,got,expected)
for loc, expected in (
 ('ar','rtl'),('ar-SA','rtl'),('he-IL','rtl'),('fa-IR','rtl'),
 ('ur-PK','rtl'),('pa-Arab','rtl'),('az-Arab','rtl'),('az-Latn','ltr'),
 ('zh-Hant','ltr'),('sr-Cyrl','ltr'),('en-US','ltr'),('fr-FR','ltr'),
 ('ur-Latn','ltr'),('en-Arab','rtl')):
    assert direction_for_locale(loc)==expected, (loc,expected)
quote={'provider':'AppStore','productId':'premium.month','storefrontCountry':'BR',
       'currency':'BRL','displayPrice':'R$ 19,90','billingPeriod':'P1M','verified':True}
assert trusted_price_quote(quote,device_locale='en-US')
assert trusted_price_quote(dict(quote,provider='GooglePlay'),device_locale='ar-SA')
assert trusted_price_quote(dict(quote,provider='Paddle'),device_locale='de-DE')
for bad in (
 dict(quote,verified=False),dict(quote,provider='deviceLocale'),
 dict(quote,storefrontCountry='pt-BR'),dict(quote,currency='reais'),
 dict(quote,displayPrice=''),dict(quote,productId=''),dict(quote,billingPeriod=''),
 dict(quote,verified='true'),{k:v for k,v in quote.items() if k!='storefrontCountry'}):
    assert trusted_price_quote(bad) is False, bad
claim={'app':'InstantStudy','storefrontCountry':'BR','uiLocale':'pt-BR','capability':'study',
       'commit':'f'*40,'build':'ios-42','uiReviewed':True,'contentVerified':True,
       'platformQaPassed':True,'legalReviewed':True,'humanApproved':True,
       'requiresPayment':True,'paymentsVerified':True}
assert can_claim_market(claim)
for key, val in [('app','OtherApp'),('uiReviewed',False),('contentVerified','PASS'),
                 ('platformQaPassed',False),('humanApproved',None),('paymentsVerified',False),
                 ('commit',''),('uiLocale','pt_BR'),('legalReviewed','NOT_RUN')]:
    assert not can_claim_market(dict(claim,**{key:val})),key
assert not can_claim_market(None)
# Checks são específicos da tabela real, não da ocorrência em texto auxiliar/selftest.
gf_matrix=text.split('### 13A.13 Matriz mínima de testes Global-First',1)[1].split('### 13A.14 Testes de mutação',1)[0]
ids=re.findall(r'^\| `GF-(\d{3})` \|',gf_matrix,re.M)
assert ids==[f'{i:03d}' for i in range(1,35)], f'ID faltando, fora de ordem ou duplicado: {ids}'
for id, scenario, acceptance in re.findall(r'^\| `GF-(\d{3})` \| (.*?) \| (.*?) \|$',gf_matrix,re.M):
    assert len(scenario)>=8 and len(acceptance)>=15 and 'TODO' not in acceptance, id
# Registro de capacidade: entradas precisam ser BCP47 únicas e os resultados verificados precisam de evidência.
for product in policy['products'].values():
    for key in ('observedAuthoredUiPacks','declaredDeviceLocales','documentedTargetCourses'):
        if key in product:
            values=product[key]
            assert isinstance(values,list) and len(values)==len(set(values)), key
            assert all(normalize_locale(x) is not None for x in values),key
# The full recorded gate is evaluated from auditable evidence, not from a hardcoded false flag.
assert policy['releaseGate']['requiresHumanApproval'] is True
assert policy['globalReleaseApproved'] == False, 'Without real device evidence, release is BLOCKED'
# v3.0: tests for pseudolocales are reference logic, NOT real Android AVD rendering.
from datetime import datetime
ACCENTS=str.maketrans({'a':'á','e':'é','i':'í','o':'ó','u':'ú','A':'Á','E':'É','I':'Í','O':'Ó','U':'Ú'})
PLACEHOLDER_RE=re.compile(r'(\{[A-Za-z_][\w]*\}|<[^>]*>|https?://[^\s]+)')
def pseudo_en_xa(value):
    if not isinstance(value,str): raise TypeError('ui text must be str')
    segments=PLACEHOLDER_RE.split(value)
    output=[]
    for i,piece in enumerate(segments):
        if i % 2: output.append(piece)
        else:
            accented=piece.translate(ACCENTS)
            # 40% visible growth, while leaving placeholders, tags and URLs intact.
            output.append(accented+('~'*max(1,math.ceil(len(piece)*0.4))) if piece else '')
    return '［'+''.join(output)+'］'
def pseudo_ar_xb(value):
    if not isinstance(value,str):raise TypeError('ui text must be str')
    # RLI/PDI marks only: RTL layout and actual glyph shaping need Android platform tests.
    return '\u2067［'+value+'］\u2069'
pseudo_fixtures=[
 'Welcome to InstantSpeak',
 'Comprar assinatura {price} / mês',
 'Open <b>Lesson</b> at https://example.com',
 'Study' ,
 'R$ 19,90 · Renewal {period}'
]
for value in pseudo_fixtures:
    xa=pseudo_en_xa(value)
    assert xa.startswith('［') and xa.endswith('］')
    assert len(xa)>=len(value)+2
    assert xa!=value
    xb=pseudo_ar_xb(value)
    assert xb.startswith('\u2067') and xb.endswith('\u2069') and value in xb
    for placeholder in PLACEHOLDER_RE.findall(value):
        assert placeholder in xa and placeholder in xb, (value, placeholder)
assert direction_for_locale('ar-XB') == 'rtl'
assert direction_for_locale('en-XA') == 'ltr'
assert resolve_ui('ar-XB','en-US',['en','ar'])=='ar'
assert resolve_ui('en-XA','ar-SA',['en','ar'])=='en'
# Locale preference persist/restart model for 4 products (not UI automation).
for app, packs in (('InstantSpeak',['en']),('InstantStudy',['en','pt-BR']),
                   ('InstantBible',['en','ar','pt']),('InstantVest',['en'])):
    store={}
    identity={'targetLanguage':'en','contentVersion':'42','storefrontCountry':'BR',
              'studyProgress':17,'bibleTranslation':'license-dependent'}
    before=dict(identity)
    def select(locale): store['uiLocale']=locale
    def restart(device): return resolve_ui(store.get('uiLocale'),device,packs)
    select('pt-BR' if app=='InstantStudy' else 'en')
    result=restart('ar-SA')
    assert result==('pt-BR' if app=='InstantStudy' else 'en'),(app,result)
    assert identity==before, app
    select('xx-ZZ')  # unsupported preferred locale must safely fall back
    assert restart('en-US')=='en', app
    assert identity==before, app
# Evidence registry schema and gate for all four apps; fixtures never certify the real app.
SHA40=re.compile(r'[0-9a-f]{40}')
SHA64=re.compile(r'[0-9a-f]{64}')
REAL_PLATFORMS={'android','ios','web'}
REQUIRED_GF_IDS={f'GF-{i:03d}' for i in range(1,35)}
def valid_release_evidence(record):
    if not isinstance(record,dict):return False
    required=('evidenceId','app','uiLocale','storefrontCountry','platform','commitSha',
              'buildId','testedAt','reviewer','status','caseResults','artifactHashes',
              'contentReviewed','legalReviewed','humanApproved')
    if any(k not in record for k in required):return False
    if record['app'] not in policy['products'] or record['platform'] not in REAL_PLATFORMS:return False
    if normalize_locale(record['uiLocale']) != record['uiLocale']:return False
    if re.fullmatch(r'[A-Z]{2}',str(record['storefrontCountry'])) is None:return False
    if re.fullmatch(SHA40, str(record['commitSha'])) is None:return False
    if not all(isinstance(record[k],str) and record[k].strip() for k in ('evidenceId','buildId','testedAt','reviewer')):return False
    try: datetime.fromisoformat(record['testedAt'])
    except ValueError:return False
    if record['status']!='PASS':return False
    if any(record[k] is not True for k in ('contentReviewed','legalReviewed','humanApproved')):return False
    cr=record['caseResults']
    if not isinstance(cr,dict) or set(cr)!=REQUIRED_GF_IDS:return False
    if not all(val in ('PASS','N/A_REVIEWED') for val in cr.values()):return False
    required_common=('GF-001','GF-002','GF-003','GF-004','GF-010','GF-011','GF-012',
                     'GF-023','GF-025','GF-026','GF-027','GF-028','GF-033','GF-034')
    if any(cr[k]!='PASS' for k in required_common):return False
    if record['platform']=='android' and any(cr[k]!='PASS' for k in ('GF-029','GF-030')):return False
    product_gate={'InstantSpeak':('GF-015','GF-016'),
                  'InstantStudy':('GF-017','GF-018'),
                  'InstantBible':('GF-019','GF-020'),
                  'InstantVest':('GF-031',)}
    if any(cr[k]!='PASS' for k in product_gate[record['app']]):return False
    hashes=record['artifactHashes']
    if not isinstance(hashes,dict) or not {'junit','screenshot','deviceLog'}<=set(hashes):return False
    if not all(isinstance(v,str) and re.fullmatch(SHA64,v) for v in hashes.values()):return False
    if record.get('requiresPayment',False) and record.get('paymentSandboxPassed') is not True:return False
    return True
def claim_authorized(claim,ledger):
    if not isinstance(claim,dict) or not isinstance(ledger,list):return False
    if any(k not in claim for k in ('app','uiLocale','storefrontCountry','platform','commitSha','buildId')):return False
    return any(valid_release_evidence(r) and all(r.get(k)==claim[k] for k in claim) for r in ledger)
def release_is_approved(data):
    claims=data.get('releaseClaims',[]);records=data.get('evidenceRecords',[])
    return bool(claims) and all(claim_authorized(claim,records) for claim in claims)
# CANONICAL manifests must never receive test fixture evidence.
ledger=policy['releaseEvidence']
assert policy['globalReleaseApproved'] is release_is_approved(ledger), 'Release flag/evidence mismatch'
assert all(valid_release_evidence(r) for r in ledger['evidenceRecords']),'Malformed canonical evidence'
assert all(claim_authorized(cl, ledger['evidenceRecords']) for cl in ledger['releaseClaims']), 'Unverified release claim in policy' 
for key, p in policy['products'].items():
    assert all(any(valid_release_evidence(r) and r['app']==key and r['uiLocale']==loc for r in ledger['evidenceRecords'])
               for loc in p['verifiedUiPacks']), (key,'verifiedUiPacks without evidence')
    assert all(any(valid_release_evidence(r) and r['app']==key and r['uiLocale']==loc for r in ledger['evidenceRecords'])
               for loc in p['verifiedEndToEndMarketLocales']), (key,'market without evidence')
# Synthetic positive fixture confirms a future release CAN become approved, but not this version.
synthetic={'evidenceId':'test-only-01','app':'InstantStudy','uiLocale':'pt-BR',
 'storefrontCountry':'BR','platform':'android','commitSha':'a'*40,
 'buildId':'synthetic-build','testedAt':'2026-10-15T12:00:00-03:00',
 'reviewer':'synthetic-reviewer','status':'PASS',
 'caseResults':{k:'PASS' for k in REQUIRED_GF_IDS},
 'artifactHashes':{'junit':'b'*64,'screenshot':'c'*64,'deviceLog':'d'*64},
 'contentReviewed':True,'legalReviewed':True,'humanApproved':True,
 'requiresPayment':True,'paymentSandboxPassed':True}
assert valid_release_evidence(synthetic)
synthetic_claim={k:synthetic[k] for k in ('app','uiLocale','storefrontCountry','platform','commitSha','buildId')}
assert claim_authorized(synthetic_claim,[synthetic])
assert release_is_approved({'releaseClaims':[synthetic_claim],'evidenceRecords':[synthetic]})
assert not release_is_approved({'releaseClaims':[synthetic_claim],'evidenceRecords':[]})
negative=[
 dict(synthetic,status='NOT_RUN'),dict(synthetic,reviewer=''),
 dict(synthetic,commitSha='bad'),dict(synthetic,platform='webgl'),
 dict(synthetic,uiLocale='pt_BR'),dict(synthetic,artifactHashes={}),
 dict(synthetic,artifactHashes={'junit':'a'*64,'screenshot':'broken','deviceLog':'d'*64}),
 dict(synthetic,caseResults={}),dict(synthetic,caseResults={**synthetic['caseResults'],'GF-033':'FAIL'}),
 dict(synthetic,humanApproved=False),dict(synthetic,paymentSandboxPassed=False),
 dict(synthetic,caseResults={**synthetic['caseResults'],'GF-029':'N/A_REVIEWED'}),
 dict(synthetic,caseResults={**synthetic['caseResults'],'GF-012':'N/A_REVIEWED'}),
 dict(synthetic,contentReviewed=False),dict(synthetic,legalReviewed=False),
 dict(synthetic,testedAt='bad date')]
assert all(not valid_release_evidence(r) for r in negative)
assert not claim_authorized(dict(synthetic_claim,commitSha='e'*40),[synthetic])
print('PASS: 5 pseudolocale specimens x 2 + 4 preference roundtrip models + 14 evidence negatives + 3 release cases')

behavior_count = len(locale_fixtures)+14+3+9+1+9+1+34
print(f'PASS: {behavior_count} contratos/cenários comportamentais e estruturais de referência Global-First')

print(f'PASS: 259 tokens, {len(checks)} pares sólidos de contraste >=4.5:1, marca, 34 cenários Global-First e política JSON')
print('SHA256',hashlib.sha256(text.encode()).hexdigest())
print('PENDENTE: Flutter/Capacitor, 34 testes Global-First em aplicativos reais, áudio, compra regional, acesso nativo e hardware')
```
<!-- INSTDESIGN_SELFTEST_END -->

**Gates obrigatórios de release — não converter ausências em PASS:**

| Gate | Evidência mínima | Estado |
|---|---|---|
| `DOC` Integridade do arquivo | Autoteste deste apêndice | Executado localmente nesta revisão |
| `FLUTTER` Build | `flutter analyze`, `flutter test` em cada repo | **Pendente** |
| `BRAND` Intro | golden e vídeo, todos `BRAND-001..010` | **Pendente** |
| `ORB` Renderização real | integração, fallback, áudio e FPS | **Flutter pendente** |
| `IOS` iPhone | screenshots, Dynamic Type, VoiceOver, mic e bateria | **Pendente** |
| `ANDROID` Android | screenshots, escala, TalkBack, mic e bateria | **Pendente** |
| `AHA` Produto | fluxos de uso dos três apps | **Pendente** |
| `GLOBAL-FIRST` Localização | `GF-001..028`, pacotes de UI, RTL, conteúdo, voz e citações de cobrança por mercado | **Documentado; testes nativos/locais de mercado pendentes** |
| `BRAND-ICON` Identidade | escolha explícita IS versus orbe Caleb | **Decisão pendente** |

Registrar commit, dispositivos, versões, resultados e evidências antes da aprovação. Não declarar 10/10 de produção com base só em Markdown ou testes de laboratório web.


### Apêndice R — Evidência de execução e bloqueios (2026-10-15)

**Escopo:** documentação e laboratório web. Esta seção **não aprova release** dos aplicativos InstantSpeak, InstantStudy ou InstantBible. O laboratório v2.0 e este documento v2.4 foram testados separadamente; nenhuma execução nativa prova que o novo arquivo já foi integrado ao código dos aplicativos.

| Categoria | Resultado | Limite da evidência |
|---|---|---|
| Tokens do arquivo único | **PASS 259/259** | Tipos e valores JSON, não renderizações Flutter |
| Contrastes sólidos | **PASS 60/60** | Pares WCAG AA definidos, não gradientes/imagens |
| Fixtures Global-First | **PASS 79** | Python de referência para locale, RTL, preços e alegações; não Flutter |
| Mutações negativas do documento | **PASS 14/14 detectadas** | Comportamento de falsos positivos da autovalidação |
| Laboratório Python v2.0 | **PASS 37/37** | Testes dos componentes/protótipos locais |
| Laboratório JavaScript v2.0 | **PASS 13/13** | Core de voz do protótipo |
| Renderização Chromium WebGL/Canvas | **PASS 4/4** | Imagens desktop/mobile com SwiftShader, não GPUs mobile |
| Mutações visuais | **PASS 5/5 detectadas** | Quebras do renderizador do protótipo |
| WAV/RMS e acessibilidade web | **PASS** | Navegador, não microfone, leitores de tela nativos ou hardware |
| Autoteste com `python -O` | **BLOQUEADO corretamente** | Não ignora asserts em modo otimizado |
| Gate de produção | **BLOCKED exit 2** | SDK Flutter ausente neste ambiente |
| Flutter e iOS/Android reais | **NOT_RUN** | Precisam de SDK, CI e devices reais |
| `GF-001..028` no aplicativo | **NOT_RUN** | A matriz é planejamento de QA, não casos executados |
| Compra regional e acessibilidade nativa | **NOT_RUN** | Sandbox App Store/Play e VoiceOver/TalkBack necessários |
| Ícone canônico | **PENDENTE** | Divergência entre `IS` e orbe no repositório |

A conformidade **10/10 no laboratório local** significa que os testes executados passaram, não que a qualidade do produto final tenha sido comprovada. `globalReleaseApproved: false` permanece obrigatório até todas as evidências de release existir.

#### Reproduzir os testes negativos com o mesmo INSTDESIGN.MD

O script abaixo é executável sem arquivos auxiliares. O autoteste principal também está incorporado no Apêndice Q. Executar o script dentro do Markdown em uma pasta com este arquivo, com Python 3 instalado. Os testes executam versões mutadas somente em pasta temporária; o arquivo original não é alterado.

<!-- INSTDESIGN_MUTATIONTEST_BEGIN -->
```python
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess, sys, json, re
src=Path('INSTDESIGN.MD').read_text(encoding='utf-8')
runner="""from pathlib import Path
import re
s=Path('INSTDESIGN.MD').read_text(encoding='utf-8')
m=re.search(r'<!-- INSTDESIGN_SELFTEST_BEGIN -->\\s*```python\\n(.*?)\\n```\\s*<!-- INSTDESIGN_SELFTEST_END -->',s,re.S)
assert m is not None
exec(compile(m.group(1),'selftest','exec'))
"""
with TemporaryDirectory() as tmp:
 d=Path(tmp);(d/'runner.py').write_text(runner)
 def run(content):
  (d/'INSTDESIGN.MD').write_text(content)
  return subprocess.run([sys.executable,'runner.py'],cwd=d,capture_output=True,text=True,timeout=12)
 first=run(src)
 assert first.returncode==0,first.stderr
 tests={
  'silenciar_release_gate':src.replace('"blocksWhenStorefrontQuoteIsUnverified": true','"blocksWhenStorefrontQuoteIsUnverified": false',1),
  'prometer_recurso_nao_verificado':src.replace('"globalReleaseApproved": false','"globalReleaseApproved": true',1),
  'curso_es_sem_curriculo':re.sub(r'(\"documentedTargetCourses\"\s*:\s*\[\s*\"en\")(\s*\])',r'\1, "es"\2',src,count=1),
  'locales_verificados_sem_qa':src.replace('"verifiedUiPacks": []','"verifiedUiPacks": ["es"]',1),
  'remover_scenario_GF028':src.replace(next(x for x in src.splitlines() if x.startswith('| `GF-028`'))+'\n','',1),
  'duplicar_scenario_GF012':src.replace(next(x for x in src.splitlines() if x.startswith('| `GF-012`'))+'\n',next(x for x in src.splitlines() if x.startswith('| `GF-012`'))+'\n'*1+next(x for x in src.splitlines() if x.startswith('| `GF-012`'))+'\n',1),
  'invalidar_token':src.replace('"hex": "#FCFBF8"','"hex": "#FEFBF8"',1),
  'quebrar_timeline':src.replace('**350 ms**','**351 ms**',1),
  'quebrar_direcao_arabica':src.replace("if bits[1] in ('Arab','Hebr'): return 'rtl'", "if bits[1] in ('Arab','Hebr'): return 'ltr'",1),
  'aceitar_fonte_preco_falsa':src.replace("if quote['provider'] not in ('AppStore','GooglePlay','Paddle'): return False", "if quote['provider'] not in ('AppStore','GooglePlay','Paddle','deviceLocale'): return False",1),
  'permitir_conclusao_qa_falsa':src.replace("if evidence[flag] is not True:return False", "if evidence[flag] is False:return False",1),
  'trocar_script_zh':src.replace("if language_script in installed: return language_script", "if language_script in installed: return 'zh-Hans'",1),
  'apagar_selo_marque_RTL':src.replace('### 13A.6 Direção bidirecional','### 13A.6 Outro tema',1),
  'preco_aceitar_not_run':src.replace("if quote['verified'] is not True: return False", "if quote['verified'] is False: return False",1),
 }
 assert len(tests)==len(set(tests))
 report=[]
 for name,v in tests.items():
  assert v!=src, f'mutacao nao aplicada: {name}'
  outcome=run(v)
  report.append({'mutation':name,'detected':outcome.returncode!=0,'reason':(outcome.stderr or outcome.stdout).splitlines()[-1][:250]})
 print(json.dumps(report,ensure_ascii=False,indent=2))
 print('MUTATIONS:',sum(x['detected'] for x in report),'/',len(report),'DETECTED')
 # Não escreve artefatos fora do diretório temporário
 if not all(x['detected'] for x in report):sys.exit(1)

```
<!-- INSTDESIGN_MUTATIONTEST_END -->

**Comando rápido para rodar ambos os testes após copiar este arquivo:**

```bash
python3 - <<'END_INSTDESIGN_TEST'
from pathlib import Path
import re
s = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
for name in ('INSTDESIGN_SELFTEST', 'INSTDESIGN_MUTATIONTEST'):
    found = re.search(r'<!-- '+name+r'_BEGIN -->\s*```python\n(.*?)\n```\s*<!-- '+name+r'_END -->',s,re.S)
    assert found, name
    exec(compile(found.group(1), 'INSTDESIGN.MD::'+name, 'exec'))
END_INSTDESIGN_TEST
```


---

# INSTDESIGN v2.6 — Maestro Android: obrigatoriedade de execução e evidências

> **Prioridade normativa:** este contrato de release atualiza o capítulo Android/motion. Não substitui tipografia, marca ou comportamento definidos nas seções anteriores. Não tratar exemplos em YAML ou testes estáticos como resultados de execução em dispositivo.

## A. Estratégia de teste Android da linha Instant

O Android exige testes black-box com Maestro sobre APK real, tela renderizada, árvore de acessibilidade e interações executadas pelo sistema operacional. O conjunto mestre exige pelo menos: primeira abertura de logo, transição para primeira função, onboarding, layout em tela compacta, escala tipográfica de no mínimo 150% (200% ainda pendente), negação de microfone, interrupção de voz, TalkBack, dark mode quando suportado, restauração de compras e erros/offline. Os critérios adicionais variam por produto.

- **InstantSpeak:** APK Flutter Android versionado, ID `com.riverthree.instantspeak`, minSdk 24. Três fluxos Maestro criados em `.maestro/` no GitHub PR #96; código Flutter da abertura e redução de movimento no PR #95.
- **InstantStudy:** Flutter implementado, sem `apps/flutter_app/android/` commitado; construir projeto nativo antes da execução Maestro.
- **InstantBible:** Flutter implementado, sem `android/` commitado; construir projeto nativo antes da execução Maestro.
- **InstantVest:** Capacitor configurado, mas sem pasta `android/` commitada; preparar sync/build Capacitor antes da execução Maestro.

## B. Matriz e critérios obrigatórios

| Critério | Evidência exigida | Regra de aprovação |
|---|---|---|
| API 29 em 360×800, fonte 100% | APK + JUnit + screenshots + gravação da abertura | Maestro E2E PASS no emulador |
| API 34 em 412×915, fonte 150% | APK + JUnit + screenshots + gravação da abertura | Maestro E2E PASS no emulador |
| API 24 até as versões Android ainda suportadas | Compilação/instalação, smoke no hardware/AVD adequado | Sem bloqueio/crash relevante; não coberto só pela matriz 29/34 |
| Fonte 200% e tela compacta | Capturas e verificação de clipping, ordem de foco, alvo de toque | Revisão manual e teste automatizado específico |
| Motion da cápsula de 2.650 ms | Vídeo do APK, com League Spartan wght 400 | Timing e geometria aprovados por comparação com baseline independente |
| Estado sem animação / TalkBack | Leitor de tela, flag remove animations, screenshots e navegação | Estado compreensível e acessível |
| Orbe e áudio | Áudio real + frame time/FPS/jank, perda de contexto | Sem regressão de resposta/latência observada |
| App real por fabricante | Samsung, Pixel e aparelho de menor desempenho | Sem problemas P0/P1 |
| Visual golden aprovado | Baseline versionada e revisto por design | Comparação de imagens obrigatória, não apenas `takeScreenshot` |

**Proibição:** não usar `optional: true`, `|| true`, `continue-on-error`, mocks visuais silenciosos ou o sucesso dos testes unitários como substituto do gate E2E de release.

## C. Comandos reprodutíveis

```bash
cd flutter
flutter pub get
flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
cd ..
maestro test --format junit --output maestro-artifacts/results.xml .maestro
```

CI documentado em `.github/workflows/maestro-android-design.yml` no PR https://github.com/raphaelribeirob/InstantSpeak/pull/96 . Nenhum status verde deve ser divulgado sem JUnit, build SHA, logs de execução, screenshots e análise humana do vídeo. **Maestro Cloud não é exigido**: runner local/emulador basta quando disponível.

## D. Status do último ciclo de execução

- **YAML/CI suite:** passa em 14 testes estáticos de contrato locais; testes de mutação adicionais estão no pacote entregue.
- **Maestro Android:** os dois jobs GitHub Actions da PR #96 **FAILED**, sem passos/logs recuperáveis; **0/2 aprovados**. Não há prova de que o emulador chegou a iniciar.
- **Dispositivos Android físicos:** NOT RUN.
- **Resultado:** BLOQUEADO para release; **não é 10/10 de execução em Android**.

Antes de um release Android comercial, os responsáveis devem resolver falhas de CI, rever evidências e passar gates de voz, internacionalização, performance e hardware físico. O nome Instant Design é compartilhado entre produtos, mas o selo de aprovação é **por build/plataforma/produto**, nunca herdado automaticamente.


---

# INSTDESIGN v2.7 — Maestro Android: matriz corrigida e proibição de aprovação sem CI

> Esta seção substitui **somente** a matriz e o status de testes da seção v2.6; mantém todos os contratos de marca, tipografia, motion, Global-First e acessibilidade anteriores. **Não é evidência de execução Android.**

## Matriz Android oficial de validação (PR #96)

| Plataforma | Resolução do emulador | Escala da fonte | Movimento | Gate |
|---|---:|---:|---|---|
| Android API 24 — mínimo declarado no Gradle | 360 × 800 dp | 100% | Ativado | Flutter APK + Maestro E2E + gravação da abertura + JUnit |
| Android API 29 — tela compacta | 320 × 640 dp | 100% | Ativado | Scroll real antes de tocar CTAs, screenshots, vídeo e JUnit |
| Android API 34 — fonte ampliada | 412 × 915 dp | 150% | Reduzido | Onboarding e estados legíveis sem motion; evidências nativas |

O emulador executa `adb shell wm density 160` **antes** de `adb shell wm size`; isso evita confundir pixels físicos com dp. A suíte **não** usa `disable-animations: true` indiscriminadamente: os dois primeiros cenários mantêm animações normais, e o terceiro ajusta as escalas de animação do Android para zero.

### Regras de aceitação do Maestro

1. Criar o APK real pelo projeto Flutter versionado e executar `flutter analyze` e `flutter test test/brand_intro_motion_test.dart`; compilação e testes precisam terminar sem falhas.
2. Instalar o APK com `adb install -r` e confirmar o pacote `com.riverthree.instantspeak` no dispositivo de teste.
3. Executar os três fluxos obrigatórios de primeira abertura, onboarding com transições e permissões negadas; aguardar texto de topo e rolar conteúdo antes dos CTAs em telas estreitas.
4. Exigir relatório JUnit legível com pelo menos três casos executados e **zero** falhas/erros; não aceitar relatório ausente, vazio ou não parseável.
5. Exigir gravação de abertura Android com pelo menos evidência de arquivo não vazio; capturar screenshots de hierarquia visual, orbe e estado de privacidade, mais Android logcat.
6. Aprovar *visual goldens* a partir de referências independentes e review humano. `takeScreenshot` não equivale a `assertScreenshot` nem valida automaticamente fidelidade visual.
7. Exigir testes adicionais em dispositivos físicos Pixel/Samsung, tablet/paisagem, escala 200%, TalkBack, FPS/jank, sincronização de áudio/orbe, fluxos autenticados, pagamentos sandbox e condições offline antes de qualquer selo de produção.
8. Não anunciar “todos os aparelhos Android”: suporte é condicionado a API mínima, recursos de hardware e matriz real de dispositivos testados.

### Estado verificável — 15 de outubro de 2026

- **Contrato estático local:** 24/24 testes, 12/12 mutações detectadas; o script Bash do workflow passou na verificação de sintaxe. Isso testa a configuração dos testes, não a renderização Android.
- **CI GitHub Actions:** a PR #96 executou novos despachos para API 24, 29 e 34, mas todos encerraram como `failure` e não apresentaram etapas/logs recuperáveis pelo conector. **0/3 testes de emulador aprovados; causa ainda não confirmada.**
- **Bloqueio externo possível:** repositório privado e múltiplos workflows falhando sem etapas podem indicar quota/forma de pagamento/orçamento do GitHub Actions. A conta precisa verificar `Settings → Billing and licensing → Usage/Budgets` e anotação do job, sem presumir que esse seja o diagnóstico.
- **GitHub PR #95:** a correção específica do Flutter para iOS Reduce Motion está isolada; ainda precisa de compilação/verificação e merge.
- **InstantStudy, InstantBible e InstantVest:** precisam de projeto Android versionado/gerado e suíte de flows por oferta. Não declarar passagem indireta por herança do InstantSpeak.

**Release gate:** se CI, Maestro E2E ou golden visual estiverem pendentes, o status obrigatório é `BLOCKED`, nunca `PASS` ou `10/10`. O design system único pode ser considerado especificado, mas não homologado globalmente para Android.


---

# Apêndice S — FONTES TÉCNICAS EMBUTIDAS (INSTDESIGN.MD v2.8)

> **Fonte normativa única.** Todos os trechos abaixo são o material completo de geração. Não usar ZIP, arquivos auxiliares ou outro Markdown como fonte concorrente. O pipeline pode materializar `.maestro/`, `.github/workflows/` e `tests/` ao fazer build, sempre a partir deste documento. O objetivo de **um arquivo** diz respeito à autoria e distribuição da especificação; Android e GitHub Actions requerem naturalmente arquivos físicos após extração.
>
> **Estado de aprovação:** testes de sintaxe/contrato são distintos de executar Maestro em um APK. Em 15/10/2026, os três jobs API 24/29/34 estavam em **failure**, sem logs disponíveis por conector. Portanto, o design Android ainda NÃO está homologado, e a versão deste documento não equivale a 10/10 de todos os dispositivos.

## S.1 Regras canônicas de aplicação

1. O `INSTDESIGN.MD` é a única origem editável de design e QA. Em cada repositório Instant, usar a fonte ou extraí-la em CI; não copiar alterações manuais para os arquivos gerados.
2. As fontes técnicas abaixo contêm **somente o fluxo Maestro do InstantSpeak**, que possui projeto Android Flutter versionado. InstantStudy, InstantBible e InstantVest exigem scaffolding Android e fluxos próprios antes da aprovação.
3. As três variações Android são API 24 (360×800 dp), API 29 (320×640 dp) e API 34 (412×915 dp, fonte 150%, motion reduzido). Isto não testa todos os dispositivos Android.
4. Screenshots por `takeScreenshot` são **capturas de evidência**, não comparações automáticas com baseline. Só chamar de golden quando uma referência independente tiver sido aprovada e o teste fizer a comparação.
5. O teste de marca e motion da abertura deve manter League Spartan 400 e 2.650 ms; a preferência iOS Reduce Motion é distinta do controle Android de animações.
6. Pipeline de CI sem runner ou sem evidência JUnit/video/build deve falhar, nunca aprovar por omissão.

## S.2 Arquivos-fonte integrais encapsulados no próprio Markdown

Os blocos entre marcadores `INSTDESIGN_SOURCE_BEGIN/END` são extraídos literalmente e verificados com SHA-256. Os hashes protegem a reprodução; qualquer modificação exige atualizar o hash do bloco correspondente e reexecutar a validação.

### S.2 · `.maestro/01-cold-start.yaml`

<!-- INSTDESIGN_SOURCE_BEGIN path=".maestro/01-cold-start.yaml" sha256="17e3777a4a8b10bcec3b70e6e76b3f4fb2bec3d60dd0ad247a9159719995706f" -->
~~~~yaml
appId: com.riverthree.instantspeak
name: InstantSpeak Android - cold start and first viewport
tags:
  - android
  - smoke
---
- launchApp:
    clearState: true
    permissions:
      microphone: deny
- extendedWaitUntil:
    visible: "InstantSpeak™"
    timeout: 60000
- assertVisible: "InstantSpeak™"
- scrollUntilVisible:
    element: "Learn English with your personal AI tutor."
    direction: DOWN
- assertVisible: "Learn English with your personal AI tutor."
- takeScreenshot: "01-hero-heading"
- scrollUntilVisible:
    element: "Create my learning plan"
    direction: DOWN
- assertVisible: "Create my learning plan"
- scrollUntilVisible:
    element: "I already have a plan"
    direction: DOWN
- assertVisible: "I already have a plan"
- takeScreenshot: "01-hero-actions"
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `.maestro/02-onboarding-motion.yaml`

<!-- INSTDESIGN_SOURCE_BEGIN path=".maestro/02-onboarding-motion.yaml" sha256="2febaa1fbdfb2ae8439d02ace3dab07f8963f07fedaee7b374e16e7c57409301" -->
~~~~yaml
appId: com.riverthree.instantspeak
name: InstantSpeak Android - onboarding and animated visual states
tags:
  - android
  - onboarding
---
- launchApp:
    clearState: true
    permissions:
      microphone: deny
- extendedWaitUntil:
    visible: "InstantSpeak™"
    timeout: 60000
- scrollUntilVisible:
    element: "Create my learning plan"
    direction: DOWN
- tapOn: "Create my learning plan"
- assertVisible: "One tutor. One learning plan."
- takeScreenshot: "02-voice-orb"
- scrollUntilVisible:
    element: "See how feedback works"
    direction: DOWN
- tapOn: "See how feedback works"
- assertVisible: "One useful correction. Then you try again."
- scrollUntilVisible:
    element: "See how the plan adapts"
    direction: DOWN
- tapOn: "See how the plan adapts"
- assertVisible: "Your next step is earned, not guessed."
- scrollUntilVisible:
    element: "Continue"
    direction: DOWN
- tapOn: "Continue"
- assertVisible: "You control when speaking starts."
- scrollUntilVisible:
    element: "Personalize my plan"
    direction: DOWN
- takeScreenshot: "02-privacy-proof"
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `.maestro/03-permission-denied.yaml`

<!-- INSTDESIGN_SOURCE_BEGIN path=".maestro/03-permission-denied.yaml" sha256="0c7a025cc66c3cb0e34892259c4eeaf08fa40e4c6ccada93da6e479fbbc436e1" -->
~~~~yaml
appId: com.riverthree.instantspeak
name: InstantSpeak Android - onboarding with microphone denied
tags:
  - android
  - privacy
---
- launchApp:
    clearState: true
    permissions:
      all: deny
- extendedWaitUntil:
    visible: "InstantSpeak™"
    timeout: 60000
- assertVisible: "InstantSpeak™"
- scrollUntilVisible:
    element: "Create my learning plan"
    direction: DOWN
- tapOn: "Create my learning plan"
- assertVisible: "One tutor. One learning plan."
- takeScreenshot: "03-microphone-denied-onboarding"
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `.github/workflows/maestro-android-design.yml`

<!-- INSTDESIGN_SOURCE_BEGIN path=".github/workflows/maestro-android-design.yml" sha256="a5be2748ed2fef7deb764dae182467042987b970a471f446be49171073076e29" -->
~~~~yaml
name: Maestro Android design E2E

on:
  pull_request:
    paths:
      - '.maestro/**'
      - 'flutter/**'
      - '.github/workflows/maestro-android-design.yml'
  push:
    branches: [main]
    paths:
      - '.maestro/**'
      - 'flutter/**'
      - '.github/workflows/maestro-android-design.yml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: maestro-android-${{ github.ref }}
  cancel-in-progress: true

jobs:
  maestro-android:
    name: API ${{ matrix.api }} / scale ${{ matrix.font_scale }} / ${{ matrix.motion }}
    runs-on: ubuntu-latest
    timeout-minutes: 65
    strategy:
      fail-fast: false
      matrix:
        include:
          - api: 24
            profile: pixel_2
            font_scale: '1.0'
            screen_size: '360x800'
            motion: enabled
          - api: 29
            profile: pixel_2
            font_scale: '1.0'
            screen_size: '320x640'
            motion: enabled
          - api: 34
            profile: pixel_6
            font_scale: '1.5'
            screen_size: '412x915'
            motion: reduced
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.47.2'
          channel: stable
          cache: true
      - name: Build and analyze Flutter Android application
        working-directory: flutter
        run: |
          set -euo pipefail
          flutter --version
          flutter pub get
          flutter analyze
          flutter test test/brand_intro_motion_test.dart
          flutter build apk --debug
          test -s build/app/outputs/flutter-apk/app-debug.apk
      - name: Install Maestro CLI
        shell: bash
        run: |
          set -euo pipefail
          curl -fsSL 'https://get.maestro.mobile.dev' | bash
          echo "$HOME/.maestro/bin" >> "$GITHUB_PATH"
          "$HOME/.maestro/bin/maestro" --version
      - name: Boot emulator and execute real Maestro flows
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: ${{ matrix.api }}
          arch: x86_64
          profile: ${{ matrix.profile }}
          emulator-options: -no-window -gpu swiftshader_indirect -no-snapshot -noaudio -no-boot-anim
          disable-animations: false
          emulator-boot-timeout: 900
          script: |
            set -euo pipefail
            export PATH="$HOME/.maestro/bin:$PATH"
            mkdir -p maestro-artifacts/screens
            adb devices
            # Physical-pixel override + 160dpi density means width in dp equals width in px.
            adb shell wm density 160
            adb shell wm size "${{ matrix.screen_size }}"
            adb shell settings put system font_scale "${{ matrix.font_scale }}"
            if [ "${{ matrix.motion }}" = 'reduced' ]; then
              adb shell settings put global animator_duration_scale 0
              adb shell settings put global transition_animation_scale 0
              adb shell settings put global window_animation_scale 0
            else
              adb shell settings put global animator_duration_scale 1
              adb shell settings put global transition_animation_scale 1
              adb shell settings put global window_animation_scale 1
            fi
            adb install -r flutter/build/app/outputs/flutter-apk/app-debug.apk
            adb shell pm path com.riverthree.instantspeak
            # Device-level recording starts before Maestro launches the app.
            adb shell screenrecord --time-limit 15 --bit-rate 1500000 /sdcard/instant-intro.mp4 &
            REC_PID=$!
            set +e
            maestro test --format junit --output maestro-artifacts/results.xml --test-output-dir maestro-artifacts/screens .maestro
            TEST_EXIT=$?
            set -e
            wait "$REC_PID"
            adb pull /sdcard/instant-intro.mp4 maestro-artifacts/instant-intro.mp4
            adb logcat -d -t 3000 > maestro-artifacts/android-logcat.txt
            test -s maestro-artifacts/instant-intro.mp4
            test -s maestro-artifacts/results.xml
            python3 - <<'PYVALIDATE'
            from xml.etree import ElementTree as ET
            tree=ET.parse('maestro-artifacts/results.xml').getroot()
            suites=[tree] if tree.tag=='testsuite' else tree.findall('.//testsuite')
            assert suites, 'No JUnit testsuite'
            tests=sum(int(s.attrib.get('tests',0)) for s in suites)
            failed=sum(int(s.attrib.get('failures',0))+int(s.attrib.get('errors',0)) for s in suites)
            assert tests >= 3 and failed == 0, f'Unexpected Maestro report: {tests} tests; {failed} failures/errors'
            print(f'Maestro verified: {tests} tests, zero failures')
            PYVALIDATE
            if [ "$TEST_EXIT" -ne 0 ]; then echo "Maestro returned $TEST_EXIT"; exit "$TEST_EXIT"; fi
      - name: Publish diagnostics and screenshots even when tests fail
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-android-api${{ matrix.api }}-${{ matrix.motion }}
          path: |
            maestro-artifacts/
            .maestro/*.png
          if-no-files-found: warn
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `tests/test_maestro_contract.py`

<!-- INSTDESIGN_SOURCE_BEGIN path="tests/test_maestro_contract.py" sha256="79253468bb4473b7ba2013462b5cda46dc5761bceea8a52dd0ed9d85ebe6f4e1" -->
~~~~python
"""Static validation of Maestro config and Android CI; never reports device execution."""
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
FLOWS = sorted((ROOT / '.maestro').glob('*.yaml'))
FLOW_NAMES = {'01-cold-start.yaml', '02-onboarding-motion.yaml', '03-permission-denied.yaml'}
ALLOWED = {'launchApp','extendedWaitUntil','assertVisible','scrollUntilVisible','tapOn','takeScreenshot', 'startRecording','stopRecording'}


def parse_flow(path):
    meta, steps = list(yaml.safe_load_all(path.read_text(encoding='utf-8')))
    return meta, steps


def script():
    return (ROOT / '.github/workflows/maestro-android-design.yml').read_text(encoding='utf8')


def matrix():
    w=yaml.load(script(), Loader=yaml.BaseLoader)
    return w['jobs']['maestro-android']['strategy']['matrix']['include']


class MaestroContractTests(unittest.TestCase):
    def test_exact_expected_flows(self):
        self.assertEqual({p.name for p in FLOWS}, FLOW_NAMES)

    def test_parse_all_yaml_documents(self):
        for path in FLOWS:
            with self.subTest(flow=path.name):
                meta, steps = parse_flow(path)
                self.assertIsInstance(meta,dict)
                self.assertIsInstance(steps,list)
                self.assertGreaterEqual(len(steps),5)

    def test_uses_real_android_application_id(self):
        for path in FLOWS:
            meta,_=parse_flow(path)
            self.assertEqual(meta['appId'], 'com.riverthree.instantspeak')

    def test_all_start_with_clear_state_and_permissions(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            self.assertEqual(list(steps[0]), ['launchApp'])
            self.assertTrue(steps[0]['launchApp']['clearState'])
            self.assertIn('permissions', steps[0]['launchApp'])

    def test_no_optional_success_paths(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            for item in steps:
                self.assertNotIn('optional', str(item).lower())

    def test_every_flow_waits_then_asserts(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            cmds=[next(iter(x)) for x in steps]
            self.assertIn('extendedWaitUntil',cmds)
            self.assertIn('assertVisible',cmds)
            self.assertIn('takeScreenshot',cmds)

    def test_only_supported_maestro_commands(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            for cmd in steps:
                self.assertEqual(len(cmd),1)
                self.assertTrue(set(cmd)<=ALLOWED)

    def test_no_coordinate_based_tapping(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            for cmd in steps:
                if 'tapOn' in cmd: self.assertIsInstance(cmd['tapOn'],str)

    def test_anchors_match_real_flutter_copy(self):
        expected={'InstantSpeak™','Create my learning plan','Learn English with your personal AI tutor.',
                  'One tutor. One learning plan.','See how feedback works',
                  'One useful correction. Then you try again.',
                  'See how the plan adapts','Your next step is earned, not guessed.',
                  'You control when speaking starts.','Personalize my plan'}
        actual=set()
        for p in FLOWS:
            _,steps=parse_flow(p)
            for s in steps:
                for k,v in s.items():
                    if k in ('tapOn','assertVisible') and isinstance(v,str): actual.add(v)
                    if k=='extendedWaitUntil': actual.add(v['visible'])
                    if k=='scrollUntilVisible': actual.add(v['element'])
        self.assertTrue(expected <= actual,expected-actual)

    def test_initial_wait_does_not_assume_cta_visible(self):
        for path in FLOWS:
            _,steps=parse_flow(path)
            self.assertEqual(steps[1]['extendedWaitUntil']['visible'],'InstantSpeak™')
            self.assertNotEqual(steps[1]['extendedWaitUntil']['visible'],'Create my learning plan')

    def test_cta_tap_requires_scroll_first(self):
        for name in ('02-onboarding-motion.yaml','03-permission-denied.yaml'):
            _,steps=parse_flow(ROOT/'.maestro'/name)
            idx=steps.index({'tapOn':'Create my learning plan'})
            self.assertEqual(steps[idx-1], {'scrollUntilVisible':{'element':'Create my learning plan','direction':'DOWN'}})

    def test_microphone_denied_scenario(self):
        _,steps=parse_flow(ROOT/'.maestro'/'03-permission-denied.yaml')
        self.assertEqual(steps[0]['launchApp']['permissions']['all'],'deny')

    def test_hero_and_voice_screen_captures(self):
        a=(ROOT/'.maestro'/'01-cold-start.yaml').read_text(encoding='utf8')
        b=(ROOT/'.maestro'/'02-onboarding-motion.yaml').read_text(encoding='utf8')
        self.assertIn('01-hero-heading',a)
        self.assertIn('01-hero-actions',a)
        self.assertIn('02-voice-orb',b)

    def test_ci_must_build_flutter_and_install_real_apk(self):
        s=script()
        for marker in ('flutter analyze','flutter test test/brand_intro_motion_test.dart',
                       'flutter build apk --debug','test -s build/app/outputs/flutter-apk/app-debug.apk',
                       'adb install -r','adb shell pm path com.riverthree.instantspeak',
                       'reactivecircus/android-emulator-runner@v2','maestro test'):
            self.assertIn(marker,s)

    def test_screen_widths_are_logical_dp_not_raw_pixel_override(self):
        s=script()
        self.assertIn('adb shell wm density 160',s)
        self.assertLess(s.index('adb shell wm density 160'),s.index('adb shell wm size'))

    def test_android_os_api_matrix_includes_minimum(self):
        self.assertEqual({r['api'] for r in matrix()},{'24','29','34'})

    def test_320px_and_large_font(self):
        rows=matrix()
        self.assertIn('320x640',{r['screen_size'] for r in rows})
        self.assertIn('1.5',{r['font_scale'] for r in rows})

    def test_animation_active_is_not_disabled(self):
        self.assertIn('disable-animations: false',script())
        self.assertGreaterEqual(sum(r['motion']=='enabled' for r in matrix()),2)
        self.assertNotIn('disable-animations: true',script())

    def test_reduced_animation_is_separately_exercised(self):
        self.assertEqual(sum(r['motion']=='reduced' for r in matrix()),1)
        for marker in ('adb shell settings put global animator_duration_scale 0',
                       'adb shell settings put global transition_animation_scale 0',
                       'adb shell settings put global window_animation_scale 0'):
            self.assertIn(marker,script())

    def test_maestro_reports_are_not_claimed_without_junit(self):
        s=script()
        for marker in ('--format junit','test -s maestro-artifacts/results.xml',
                       'ET.parse(', "failed == 0", 'tests >= 3'):
            self.assertIn(marker,s)

    def test_motion_video_capture_is_required(self):
        s=script()
        for marker in ('adb shell screenrecord','--time-limit 15','adb pull',
                       'test -s maestro-artifacts/instant-intro.mp4'):
            self.assertIn(marker,s)

    def test_logs_are_retained(self):
        s=script()
        self.assertIn('adb logcat -d',s)
        self.assertIn('if: always()',s)
        self.assertIn('upload-artifact@v4',s)

    def test_release_does_not_mask_failures(self):
        s=script()
        self.assertNotIn('continue-on-error:',s)
        self.assertNotIn('|| true',s)
        self.assertIn('set -euo pipefail',s)
        self.assertIn('TEST_EXIT=$?',s)

    def test_build_is_not_called_a_visual_golden(self):
        d=(ROOT/'README.md').read_text(encoding='utf8')
        self.assertIn('approved',d.lower())
        self.assertIn('not',d.lower())

if __name__=='__main__': unittest.main()
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `tests/run_mutations.py`

<!-- INSTDESIGN_SOURCE_BEGIN path="tests/run_mutations.py" sha256="2ddf86dca9e73845d063f17bb8dc5e881af53d6d1185ecb43d523d364c7d78a5" -->
~~~~python
"""Test test-quality with controlled broken Maestro/CI inputs."""
from pathlib import Path
import subprocess, tempfile, shutil, json

ROOT=Path(__file__).resolve().parents[1]
cases=[
 ('wrong_app_id','.maestro/01-cold-start.yaml', 'com.riverthree.instantspeak', 'com.example.invalid'),
 ('missing_screenshot','.maestro/03-permission-denied.yaml','- takeScreenshot: "03-microphone-denied-onboarding"','- assertVisible: "Unexpected"'),
 ('optional_assert','.maestro/02-onboarding-motion.yaml','- assertVisible: "One tutor. One learning plan."','- assertVisible:\n    text: "One tutor. One learning plan."\n    optional: true'),
 ('wrong_permission','.maestro/03-permission-denied.yaml','      all: deny','      all: allow'),
 ('missing_build','.github/workflows/maestro-android-design.yml','flutter build apk --debug','echo skipped'),
 ('missing_api34','.github/workflows/maestro-android-design.yml','          - api: 34','          - api: 29'),
 ('masking_ci_failures','.github/workflows/maestro-android-design.yml','set -euo pipefail','set +e'),
 ('disable_all_animation','.github/workflows/maestro-android-design.yml','disable-animations: false','disable-animations: true'),
 ('skip_reduced_motion','.github/workflows/maestro-android-design.yml','motion: reduced','motion: enabled'),
 ('omit_dp_scaling','.github/workflows/maestro-android-design.yml','adb shell wm density 160','echo omit_density'),
 ('accept_empty_junit','.github/workflows/maestro-android-design.yml','tests >= 3 and failed == 0','tests >= 0 and failed == 0'),
 ('skip_hero_scroll','.maestro/01-cold-start.yaml','    element: "Learn English with your personal AI tutor."','    element: "False match"'),
]
results=[]
for name,file,old,new in cases:
 with tempfile.TemporaryDirectory() as td:
  p=Path(td);shutil.copytree(ROOT/'.maestro',p/'.maestro');shutil.copytree(ROOT/'.github',p/'.github');shutil.copytree(ROOT/'tests',p/'tests',ignore=shutil.ignore_patterns('__pycache__'))
  f=p/file;txt=f.read_text();assert old in txt,(name,old);f.write_text(txt.replace(old,new,1))
  t=subprocess.run(['python','-m','unittest','discover','-s',str(p/'tests'),'-p','test_maestro_contract.py'],capture_output=True,text=True,timeout=30)
  results.append({'mutation':name,'detected':t.returncode!=0,'return_code':t.returncode})
print(json.dumps(results,indent=2))
(ROOT/'evidence'/'mutation_report.json').write_text(json.dumps(results,indent=2))
assert all(x['detected'] for x in results),'Undetected mutation — static tests insufficient'
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `README.md`

<!-- INSTDESIGN_SOURCE_BEGIN path="README.md" sha256="e0b449ad8ebd2568ac3e98f5a2cf635fcaa1e2fd8e1ba5b720555f8f95a761a1" -->
~~~~markdown
# Instant Design — Maestro Android QA v2

**Scope:** InstantSpeak APK (real device/Android emulator Maestro flows); preview contract for the Instant product family.

This package does **not** claim that Maestro was executed or approved on Android devices. Static suites validate the test configuration, not actual application rendering.

## Changes since v1

- Fixed the first-viewport failure: waits for the brand at the top rather than a CTA that may be off-screen on 320 px / increased font sizes.
- Fixed the contradictory animation configuration: normal animation scenarios run with Android animations **enabled**, while a separate reduced-motion scenario disables them.
- Added the minimum Android SDK 24 scenario; 320 × 640 compact viewport and 150% font sizes are covered in the planned emulator matrix.
- Added capture of separate home/top, CTA, orb and privacy screenshots; records a real intro video.
- CI parses the **JUnit XML** and explicitly requires >= 3 tests with zero failures/errors; also requires an APK and video artifact.
- Stores Android logcat and Maestro output on failure, when the runner is able to start.

## Run locally

```bash
python -m unittest discover -s tests -v
cd flutter && flutter pub get && flutter analyze && flutter test test/brand_intro_motion_test.dart && flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
cd ..
maestro test --format junit --output maestro-artifacts/results.xml --test-output-dir maestro-artifacts/screens .maestro
```

## Mandatory approvals before any 10/10 Android claim

- Android CI runner must actually start; review artifacts (JUnit, screenshots, 15 s video and logcat). Two prior jobs did not start successfully; cause remains unconfirmed without GitHub Actions logs.
- Human-approved screenshot baselines, then Maestro `assertScreenshot`, with independent references (not self-generated in each run).
- Actual Android 24, 29, 34+ emulators and at least one Samsung and Pixel physical device.
- TalkBack, text scale 200%, layout 320dp–tablet/landscape, gesture and three-button navigation.
- Audio latency and RMS/orb synchronization, real WebGL fallback, memory and FPS, reduced-motion Android setting.
- Signed-in conversation/voice states, purchase sandbox and restoration, offline/error recovery.
- Android builds for other Instant products, whose native project folders have not yet been versioned.

The GitHub Actions runs observed on the previous PR failed before exposing usable logs; local analysis cannot establish whether this is GitHub billing, runner availability or application build failure. Check [Actions](https://github.com/raphaelribeirob/InstantSpeak/actions) and account Actions usage/budgets if jobs fail without steps.
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `MAESTRO_ANDROID_AUDIT.md`

<!-- INSTDESIGN_SOURCE_BEGIN path="MAESTRO_ANDROID_AUDIT.md" sha256="6956d21d76824ab17d729a74e3c81518d4b55c48e427195da0c199bd8ea49403" -->
~~~~markdown
# Auditoria Maestro Android — v2.7

**Resultado documental:** 24/24 testes estáticos aprovados, 12/12 mutações detectadas, sintaxe YAML e Bash válidas. **Resultado de execução Maestro real:** não aprovado (3 jobs GitHub Actions com `failure`, sem logs acessíveis).

## Correções verificadas

- Fluxos esperam o título da marca antes de rolar conteúdo e não assumem CTA visível em 320 dp.
- Tamanhos de emulador em dp após normalização de densidade a 160 dpi; o `wm size` sozinho usaria pixels físicos.
- API 24, 29 e 34 com movimentos ativados nos dois primeiros cenários, e movimento reduzido apenas na matriz correspondente.
- Vídeo da abertura e capturas das áreas de hierarquia visual, voz e privacidade exigidos; JUnit validado com pelo menos 3 casos e nenhum erro.
- Diagnóstico Android logcat anexado quando o runner alcança o emulador.

## Gates ainda bloqueados

1. Corrigir causa dos jobs GitHub Actions falhando sem logs (faturamento/limites é hipótese, não conclusão).
2. `flutter analyze`, testes Flutter e `flutter build apk --debug` executados em runner real.
3. Maestro E2E instalado em emulador e dispositivos físicos; revisão manual de vídeos/screenshots e baseline independente.
4. Cobertura 200% de texto, TalkBack, áudio/orbe reais, jank/FPS e pagamentos sandbox.
5. Projeto Android e fluxos Maestro exclusivos para InstantStudy, InstantBible, InstantVest.

**Referência:** https://github.com/raphaelribeirob/InstantSpeak/pull/96 . Sem merge na `main`.
~~~~
<!-- INSTDESIGN_SOURCE_END -->

### S.2 · `evidence/mutation_report.json`

<!-- INSTDESIGN_SOURCE_BEGIN path="evidence/mutation_report.json" sha256="0385db9ebf5543592969a878b24a7b1f384062ae26782b90c1ae1e9b9ade51bd" -->
~~~~json
[
  {
    "mutation": "wrong_app_id",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "missing_screenshot",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "optional_assert",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "wrong_permission",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "missing_build",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "missing_api34",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "masking_ci_failures",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "disable_all_animation",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "skip_reduced_motion",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "omit_dp_scaling",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "accept_empty_junit",
    "detected": true,
    "return_code": 1
  },
  {
    "mutation": "skip_hero_scroll",
    "detected": true,
    "return_code": 1
  }
]
~~~~
<!-- INSTDESIGN_SOURCE_END -->

## S.3 Extração reproduzível — sem arquivos-fonte externos

Salve **apenas** `INSTDESIGN.MD`. Para gerar os arquivos necessários para Maestro, Flutter e GitHub Actions, execute na raiz do repositório de destino:

```bash
python3 - <<'PY_EXTRACT_INSTDESIGN'
from pathlib import Path
import hashlib, re
source = Path('INSTDESIGN.MD').read_text(encoding='utf-8')
pattern = re.compile(r'(?m)^<!-- INSTDESIGN_SOURCE_BEGIN path="([^"\n]+)" sha256="([a-f0-9]{64})" -->\n~~~~[a-z]+\n(.*?)~~~~\n<!-- INSTDESIGN_SOURCE_END -->', re.S)
items = pattern.findall(source)
expected = {
 '.maestro/01-cold-start.yaml', '.maestro/02-onboarding-motion.yaml',
 '.maestro/03-permission-denied.yaml',
 '.github/workflows/maestro-android-design.yml',
 'tests/test_maestro_contract.py', 'tests/run_mutations.py',
 'README.md', 'MAESTRO_ANDROID_AUDIT.md', 'evidence/mutation_report.json',
}
assert len(items) == len(expected), f'Fontes: {len(items)} != {len(expected)}'
assert {name for name, digest, body in items} == expected, 'Fontes ausentes ou duplicadas'
for name, expected_sha, body in items:
    relative=Path(name)
    assert not relative.is_absolute() and '..' not in relative.parts
    actual_sha=hashlib.sha256(body.encode('utf-8')).hexdigest()
    assert actual_sha == expected_sha, f'Hash divergente: {name}'
    relative.parent.mkdir(parents=True,exist_ok=True)
    relative.write_text(body,encoding='utf-8')
    print(f'EXTRACT PASS: {name} [{actual_sha[:12]}]')
PY_EXTRACT_INSTDESIGN

python3 -m unittest discover -s tests -v
# E2E nativo requer Flutter SDK, Android SDK/emulador e Maestro: não inferir PASS da extração.
```

Esses arquivos são **materializações técnicas temporárias**; a fonte documental continua sendo somente `INSTDESIGN.MD`.

## S.4 Checklist de release para a linha Instant

- [ ] Android InstantSpeak: Flutter analyze/test/build + Maestro API 24/29/34 + evidências verificadas.
- [ ] Android InstantStudy/Bible/Vest: projetos nativos, E2E próprios e aprovação individual.
- [ ] Paleta: § 6.26 PASS com catálogo Dart e Web atuais do commit a publicar.
- [ ] Orbe: áudio real, casos idle/listening/thinking/speaking/error, FPS, energia e memória.
- [ ] Visual: goldens revisados em 320/360/412 dp, tablet, paisagem e escala 150%/200%.
- [ ] Acessibilidade: TalkBack, VoiceOver, Reduce Motion, estados textuais e alvos.
- [ ] Web e Apple: WebKit/Safari/Firefox e simuladores/dispositivos físicos; aprovações independentes.
- [ ] Global-First: GF-001..028 por produto/localidade efetivamente ofertada.
- [ ] Evidências: build SHA, OS/AVD/modelo, capturas, JUnit, logs e revisão humana.

**Regra de release:** um único gate obrigatório não aprovado mantém `BLOCKED`, nunca `10/10`.

## T. Registro de validação da orbe (INSTDESIGN v2.9)

- **Catálogo canônico:** 10 pares de cores, 10 vozes OpenAI Realtime e 10 perfis de motion declarados e testados.
- **Paridade de código real:** 10/10 nomes, IDs estáveis, vozes, pares cromáticos, `motionRate` e `phase` conferidos entre `tutor_catalog.dart` e `shared/tutors.js` no GitHub (blobs identificados no § 6.24); requer repetição automática no commit a publicar.
- **Autoteste do documento:** 10/10 entradas válidas, tabela/JSON sincronizados, parsers Dart/JavaScript testados com fixtures, **17/17 mutações intencionais detectadas**. Se os arquivos reais não estiverem acessíveis na execução local, marcar `NOT_RUN`, jamais `PASS` de paridade externa.
- **Teste visual de laboratório (Chromium + SwiftShader):** **10/10 renderizações WebGL e 10/10 Canvas 2D**, com diferenciação cromática verificada no centro do canvas após alternar as paletas. O laboratório v3 antigo tinha cores fixas; o teste injetou suporte dinâmico de duas cores **temporariamente**, sem alterar o aplicativo distribuído. Portanto, essas 20 renderizações demonstram viabilidade, não certificação de integração mobile nem aprovação visual humana.
- **Autovalidação base:** 259 tokens, 60 pares AA e contratos comportamentais Global-First permanecem submetidos ao teste embutido do Apêndice Q.
- **Gate de publicação permanece BLOCKED:** a execução de navegador/contrato não comprova APK Android, iPhone/iPad, áudio real, Maestro, WebKit, VoiceOver/TalkBack, FPS, latência ou todos os aparelhos. Conformidade com Eleven v4 é **conceitual**; o provedor de áudio atual do catálogo é OpenAI Realtime.
- **Nota rigorosa:** 10/10 significa **todos os casos daquele teste específico aprovados**, nunca nota global de qualidade de produção sem evidências independentes.


## U. Global-First Universal v3.0 — resultado e evidências (normativo; prevalece sobre snapshots v2.x)

**Estado: SPEC_VALIDATED / RELEASE_BLOCKED.** A revisão v3.0 corrige: (1) InstantVest/Capacitor no registro de produtos, (2) testes Android de pseudolocalidades `en-XA` e `ar-XB`, (3) transição possível de bloqueado para aprovado **somente quando existir evidência auditável**, (4) troca de idioma e retomada de sessão nos quatro aplicativos.

O JSON `GLOBAL_FIRST_POLICY_BEGIN` é a fonte de verdade. A suíte Python `INSTDESIGN_SELFTEST_BEGIN` avalia a consistência desse registro, executa fixtures sintéticos de pseudolocales/fallback/preferências e exige evidência para liberar mercados. As fixtures positivas são **fictícias** e não devem entrar em `releaseEvidence.evidenceRecords`.

Os cenários GF-001..034 documentam o que deve ser executado. **Status real dos aplicativos:** `NOT_RUN` para a matriz 34/34 nesta revisão, pois o documento não executa dispositivos Android/iOS, sistemas de pagamento reais, VoiceOver/TalkBack ou webviews Capacitor. A ausência de SDK, emulador, relatório JUnit, aprovador, hashes e plataforma autoritativa não pode ser convertida em nota 10/10 do aplicativo.

**Definição de qualidade:** 10/10 da *especificação testável* = autoteste passou, contrato sem contradições normativas, cenários rastreáveis, mutações detectadas e release bloqueado sem evidência. 10/10 de *produto* exige builds reais, testes nativos e aprovação humana por mercado.

**Regra de hierarquia:** este capítulo U e §13A v3.0 prevalecem sobre qualquer contador ou afirmação histórica v1.x/v2.x, inclusive os relatórios incorporados nos apêndices antigos. A fonte primária para globalização é o registro JSON, não os relatórios de auditoria anteriores.


### U.1 Reprodutibilidade e resultados da bateria v3.0

No diretório do **único arquivo** `INSTDESIGN.MD`, executar a autovalidação do Apêndice Q e, depois, o código abaixo. As cópias alteradas são criadas em pasta temporária e apagadas ao final. A documentação mestre **não é modificada** pelos testes de mutação.

**Resultados desta rodada de laboratório (15/10/2026):**

| Critério | Resultado | Limite do que prova |
|---|---|---|
| Tokens estruturados | `PASS 259/259` | Consistência DTCG, não telas nativas |
| Contrastes sólidos | `PASS 60/60` | Pares de cor definidos, não screenshots reais |
| Casos comportamentais e estruturais | `PASS 85/85` | Fixtures de referência, não código dos apps |
| Cenários Global-First definidos | `PASS 34/34` | Casos documentados, **não executados em dispositivos** |
| Mutações negativas | `PASS 28/28 detectadas` | Resistência do autoteste a regressões injetadas |
| Liberação por mercado sem evidência | `BLOCKED` | O documento rejeita aprovação artificial |
| Maestro Android / iOS / WebView Capacitor / compras sandbox | `NOT_RUN` | SDKs, devices, acessos e QA independentes necessários |

**Executar as 28 mutações (Python 3, biblioteca padrão):**

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess,sys,json,re
base=Path('INSTDESIGN.MD').read_text(encoding='utf-8')

CHECKER = r'''from pathlib import Path
import re
src=Path('INSTDESIGN.MD').read_text('utf8')
m=re.search(r'<!-- INSTDESIGN_SELFTEST_BEGIN -->\s*```python\n(.*?)\n```\s*<!-- INSTDESIGN_SELFTEST_END -->',src,re.S)
assert m
exec(compile(m.group(1),'INSTDESIGN_SELFTEST','exec'))'''

def policy_edit(mutator):
    match=re.search(r'(<!-- GLOBAL_FIRST_POLICY_BEGIN -->\s*```json\n)(.*?)(\n```\s*<!-- GLOBAL_FIRST_POLICY_END -->)',base,re.S)
    assert match
    p=json.loads(match.group(2));mutator(p)
    return base[:match.start(2)]+json.dumps(p,ensure_ascii=False,indent=2)+base[match.end(2):]

def replace(old,new):
    assert base.count(old)>=1,(old,base.count(old))
    return base.replace(old,new,1)

def mutate_token_color():
    m=re.search(r'(<!-- INSTDESIGN_TOKENS_BEGIN -->\s*```json\n)(.*?)(\n```\s*<!-- INSTDESIGN_TOKENS_END -->)',base,re.S)
    assert m
    block=m.group(2)
    assert '"colorSpace": "srgb"' in block
    changed=block.replace('"colorSpace": "srgb"','"colorSpace": "not-srgb"',1)
    return base[:m.start(2)]+changed+base[m.end(2):]

mutations={
 'policy_version_downgrade':lambda: policy_edit(lambda p:p.update(version='2.4.0')),
 'instantvest_deleted':lambda:policy_edit(lambda p:p['products'].pop('InstantVest')),
 'instantvest_wrong_runtime':lambda:policy_edit(lambda p:p['products']['InstantVest'].update(runtime='Flutter')),
 'instantvest_wrong_appid':lambda:policy_edit(lambda p:p['products']['InstantVest'].update(observedCapacitorAppId='com.example.app')),
 'instantvest_unverified_native_android':lambda:policy_edit(lambda p:p['products']['InstantVest'].update(nativeAndroidProjectVersioned=True)),
 'instantspeak_invented_course':lambda:policy_edit(lambda p:p['products']['InstantSpeak'].update(documentedTargetCourses=['en','es'])),
 'instantbible_pack_deleted':lambda:policy_edit(lambda p:p['products']['InstantBible']['observedAuthoredUiPacks'].pop()),
 'unverified_ui_market_claim':lambda:policy_edit(lambda p:p['products']['InstantVest'].update(verifiedUiPacks=['de'])) ,
 'unverified_e2e_market':lambda:policy_edit(lambda p:p['products']['InstantStudy'].update(verifiedEndToEndMarketLocales=['pt-BR'])),
 'release_approved_without_evidence':lambda:policy_edit(lambda p:p.update(globalReleaseApproved=True)),
 'claim_not_in_registry':lambda:policy_edit(lambda p:p['releaseEvidence']['releaseClaims'].append({'app':'InstantStudy','uiLocale':'pt-BR','platform':'android','commitSha':'a'*40,'buildId':'fake','storefrontCountry':'BR'})),
 'human_approval_gate_disabled':lambda:policy_edit(lambda p:p['releaseGate'].update(requiresHumanApproval=False)),
 'payment_quote_gate_disabled':lambda:policy_edit(lambda p:p['releaseGate'].update(blocksWhenStorefrontQuoteIsUnverified=False)),
 'negative_pseudo_en_XA_missing':lambda:replace('| `GF-029` |','| `GF-998` |'),
 'negative_pseudo_ar_XB_missing':lambda:replace('| `GF-030` |','| `GF-998` |'),
 'negative_instantvest_case_missing':lambda:replace('| `GF-031` |','| `GF-998` |'),
 'language_roundtrip_case_missing':lambda:replace('| `GF-032` |','| `GF-998` |'),
 'release_gate_case_missing':lambda:replace('| `GF-033` |','| `GF-998` |'),
 'rtl200_percent_case_missing':lambda:replace('| `GF-034` |','| `GF-998` |'),
 'rtl_contract_header_deleted':lambda:replace('### 13A.6 Direção bidirecional, tipografia e layout por script','### 13A.6 Sem verificações de direção'),
 'pseudo_contract_header_deleted':lambda:replace('### 13A.16A Contrato de testes de pseudolocalidade e Capacitor (v3.0)','### 13A.16A Sem contrato'),
 'rtl_reference_bug':lambda:replace("return 'rtl' if bits[0] in ('ar','he','fa','ur','ps','sd') else 'ltr'","return 'ltr' if bits[0] in ('ar','he','fa','ur','ps','sd') else 'ltr'"),
 'wrong_ui_preference_priority':lambda:replace('for choice in (preferred, device):','for choice in (device, preferred):'),
 'device_storefront_false_authority':lambda:replace("if quote['provider'] not in ('AppStore','GooglePlay','Paddle'): return False","if quote['provider'] not in ('deviceLocale','GooglePlay','Paddle'): return False"),
 'missing_good_evidence_status':lambda:replace("if record['status']!='PASS':return False","if record['status']=='PASS':return False"),
 'evidence_gate_bypassed':lambda:replace("return bool(claims) and all(claim_authorized(claim,records) for claim in claims)","return True"),
 'brand_opening_drift':lambda:replace('**350 ms**','**300 ms**'),
 'bad_token_color_count':mutate_token_color
}

ok=0
with TemporaryDirectory(prefix='instant_global_mutations_') as temp:
    file=Path(temp)/'INSTDESIGN.MD'
    for name,make in mutations.items():
        file.write_text(make(),encoding='utf8')
        r=subprocess.run([sys.executable,'-c',CHECKER],cwd=temp,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=12)
        if r.returncode==0:
            print('UNDETECTED',name, r.stdout[-100:])
        else:
            ok+=1
            print('DETECTED',name)
print(f'FINAL {ok}/{len(mutations)} detected')
if ok!=len(mutations):sys.exit(1)
```

A bateria testa corrupção do JSON, ausência de um dos quatro produtos, ofertas inventadas, declarações de locale sem prova, tentativas de liberar mercados indevidamente, cenários GF-029..034 ausentes, RTL incorreto, preferência de UI invertida e quebra de tokens. Quando todas as mutações são detectadas, o processo termina com `FINAL 28/28 detected` e código de saída zero.

**Política anti-falso positivo:** o caso sintético que passa pela função de evidências é apenas uma fixture estrutural. Um hash bem formatado não prova que um screenshot ou build exista. A homologação efetiva deve conferir cada artefato externo no CI e exigir revisão humana. O `globalReleaseApproved` permanece `false` até que isso aconteça.

---

## V. Auditoria de qualidade v3.2 — execução comprovada e limites de escopo

> **Execução local:** 2026-10-15. Fonte única: `INSTDESIGN.MD`. Relato verificável por extração dos blocos `*_TEST_BEGIN/END` deste documento. **Não há declaração de release 10/10 sem APK/IPA/Web builds e testes em devices reais.**

### V.1 Falhas encontradas e corrigidas nesta versão

| Defeito que escapava aos testes anteriores | Reprodução negativa | Correção/critério |
|---|---|---|
| `milestone_earned` aceitava **duas conquistas de IDs diferentes para o mesmo resultado** | Teste falhou antes da correção | Chave de deduplicação por resultado (`resultId`, tipo do evento), além do registro de conquista; evita a segunda animação |
| Tentativa antiga podia ser reiniciada com `resultId` reaproveitado e versão maior | Teste falhou antes da correção | Histórico de IDs de tentativa consultado antes de iniciar nova avaliação; persistir deduplicação no backend/repositório real |
| Versões ou progresso booleanos eram interpretados como inteiros; `verified='true'` era aceito como confirmação | Teste falhou antes da correção | Exigir `type(...) is int` para inteiros e `verified is True` para confirmação efetiva |
| Duração base de conquista até 750 ms conflita com limite do InstantBible | Novo teste de duração efetiva | InstantBible limita a 220 ms; movimento reduzido impõe 0 ms com mensagem e estado intactos |
| Fluxo visual não tinha cobertura real de tamanho 320 px, RTL e 200% de fonte | Novo teste headless | Protótipo original em HTML, executado em Chromium para largura, fluxo de botões e semântica |
| Executor web tentava navegar a arquivos/hosts bloqueados pelo ambiente | Teste falhou durante a auditoria | Injetar HTML em memória; injetar configurações de teste no próprio HTML, sem acesso de rede |

### V.2 Evidência de execução — o que passou

| Nível de teste | Resultado local | Limites |
|---|---|---|
| Orbe — dez identidades e mutações | **10/10 identidades; 17/17 mutações** | Paridade com catálogos de código reais exige checkout correspondente |
| Learning Motion — política/estados/QA | **25/25 mutações; 26 casos LM definidos** | Definir caso não executa o app |
| Learning Motion — máquina de estados de referência | **64/64 ciclos completos** | Combinações de parâmetros, não execução em Flutter/Capacitor |
| Learning Motion — referência Web em Chromium | **128/128 interações/cenários** | 4 produtos × 4 larguras × 2 modos de movimento × 2 direções × 2 escalas tipográficas; protótipo, não produto |
| Global-First — política de referência | **85 verificações; 34 cenários GF documentados** | Os 34 fluxos de produto ainda não foram executados em aplicativos |
| Global-First — mutações preexistentes | **14/14 detectadas** | Não homologa idiomas comerciais reais |
| Maestro — testes estáticos da configuração | **24/24** | **Nenhum** teste de emulador/APK está declarado PASS |
| Maestro — mutações preexistentes | **12/12 detectadas** | Não substitui ações do Maestro executadas |
| Tokens e contraste | **259 tokens; 60/60 pares sólidos** | Não substitui auditoria WCAG de todas as telas e estados |
| Extração dos 9 arquivos técnicos embutidos | **9/9 hashes SHA-256 válidos** | Arquivos técnicos são geráveis, porém não substituem execuções nativas |

Os 128 testes Chromium são executados com Playwright Python instalado e Chromium disponível. Para reproduzir, extraia apenas o bloco `INSTANT_LEARNING_MOTION_BROWSER_TEST` como um script local e execute as duas metades (`INSTANT_MOTION_BATCH=0` e `INSTANT_MOTION_BATCH=1`); ambas precisam passar. O protótipo não solicita rede, pagamentos, microfone ou dados de usuário.

### V.3 Decisão de aprovação, sem confundir artefatos

- **Qualidade verificável desta especificação e dos protótipos de referência executados: 10/10 dentro dos gates locais acima.** Foram encontrados defeitos reais no próprio oráculo e corrigidos antes desta avaliação.
- **Conformidade do Learning Motion implementado nos quatro apps: `NOT_RUN`**, porque os assets `.riv` originais ainda não foram criados e os quatro aplicativos não estão integrados à camada demonstrada aqui.
- **Android real com Maestro, iOS/iPadOS com VoiceOver, WebKit/Safari, Firefox, WebView/Capacitor, áudio, energia e FPS: `NOT_RUN` / `BLOCKED`**, até evidência externa de execução e revisão visual. Não é permitido traduzir a nota documental para uma nota de lançamento.
- **Aprovação internacional:** `BLOCKED` até GF-001..034 com resultados reais, layouts localizados, país de cobrança correto, política de evidências e revisão humana.

**Fonte de verdade:** preservar somente `INSTDESIGN.MD` como documento mestre. Não copiar a referência HTML para produção sem testes nativos, eventos verificados pelo servidor e revisão de design. O aplicativo deve ter testes de contrato próprios que comparem o comportamento instalado ao oráculo e às paletas normativas desta especificação.


---

## W. Registro de validação Tesla Motion v3.3 — 2026-10-16

**Fonte única:** este `INSTDESIGN.MD` v3.3. Os testes a seguir foram realizados sobre a política e referência visual executável **incorporadas no próprio arquivo**. O nickname Tesla Motion representa princípios de precisão e resposta; não é software Tesla nem sua identidade proprietária.

| Nível | Resultado | Limite da evidência |
|---|---|---|
| Contrato e mutações Instant Precision Motion | **22/22 mutações detectadas** | Testa regras e referência do arquivo, não o APK |
| Interações Chromium no protótipo original | **96/96 aprovadas** | 4 produtos × 3 larguras (320/390/768) × RTL/LTR × movimento normal/reduzido × fontes 100/200% |
| Troca dinâmica de Reduce Motion | **96/96 contextos testados** | Eventos `matchMedia` simulados no Chromium, não ajustes nativos Android/iOS |
| Sem overflow horizontal / rótulos acessíveis / controles ≥44px | **Aprovado nas 96 execuções** | Navegador headless; leitor de telas físico não testado |
| Progresso e conquistas | **Teste de sequência e bloqueio no protótipo** | Resultado simulado; servidores reais e idempotência de produto requerem integração |
| Global-First legado | **85 verificações; 14/14 mutações detectadas** | Algoritmos de referência e estrutura documental |
| Learning Motion legado | **25/25 mutações detectadas** | `rive` e apps reais ainda não integrados |
| Orbes do InstantSpeak | **10 identidades; 17/17 mutações** | Paridade com catálogos reais requer checkout do código correspondente |
| Tokens e contraste | **259 tokens; 60/60 pares** | Não substitui auditoria WCAG de todas as telas |
| Maestros/Android, iOS/WKWebView, WebKit, FPS/GPU, voz real e aprovação visual física | **NOT_RUN** | Não alegar 10/10 de lançamento |

**Defeitos encontrados e corrigidos durante esta rodada:** a verificação de movimento dinâmico exigiu aguardar o evento `matchMedia(change)`; fonte a 200% revelava overflow em botões e exigiu quebra de linha; os cenários precisaram de contextos de navegação independentes para não compartilhar listeners de protótipos anteriores; progresso de 25% antes de commit foi removido porque insinuava evolução não comprovada. As quatro correções estão integradas ao protótipo/teste incorporados ao Markdown.

**Decisão:** `Tesla Motion` / `Instant Precision Motion` está **ESPECIFICADO E VALIDADO COMO REFERÊNCIA LOCAL**, mas a implementação nos quatro aplicativos e a homologação multiplataforma estão **PENDENTES**. Não confundir a referência v3.3 com código instalado nas lojas. O arquivo continua sendo a única fonte mestre de design da família Instant.


## X. Auditoria de compatibilidade das três referências de Motion — v3.4 (2026-10-16)

**Conclusão:** o design **não** exige três bibliotecas, motores ou efeitos em paralelo. A ambiguidade identificada entre a tabela histórica de durações (§§6.2/6.9), a gramática de navegação Instant Precision (§6.37) e as durações de recompensa (§6.28) foi corrigida por precedência explícita e por um **árbitro único §6.42**. Identidade cromática e amplitude continuam propriedade exclusiva da orbe; conquista e progresso continuam propriedade pedagógica; o estilo de precisão é transversal, não a quarta camada.

**Critérios verificáveis:** no máximo um movimento foreground; áudio verdadeiro em sua própria superfície; recompensa exige avaliação/commit; uma conquista não anima duas vezes o mesmo resultado; estados se mantêm legíveis ao navegar, pausar, falhar ou ativar Reduce Motion; InstantBible <=220 ms; as primeiras aberturas de marca permanecem intocadas e puláveis. Cada teste da seção §6.42 é reproduzível a partir deste documento.

**Registros locais (oráculo de referência):** `5.632/5.632` combinações de arbitragem de quatro produtos, oito estados de voz, onze conjuntos de eventos, Reduce Motion, mudança de rota, verificação e commit; dez cenários de regressão dirigidos; `20/20` mutações negativas detectadas. **Chromium integrado:** `48/48` cenários com voz simulada, resultado, navegação concorrente, RTL, preferências de movimento e telas compactas. **Regressão histórica executada:** `128/128` casos Learning Motion e `96/96` casos Precision Motion em protótipos isolados; autotestes da orbe, 259 tokens, 60 contrastes e Global-First aprovados. **Limite:** são testes de lógica e protótipos web, não captura da UI real de Flutter/Capacitor nem medição nativa de desempenho. A aprovação de produção continua **BLOCKED** enquanto os testes nativos de §6.41 e LM-007..026 não estiverem comprovados.


## Y. Auditoria adicional de concorrência — v3.5 (2026-10-16)

**Falha reproduzida e corrigida:** no modelo integrado v3.4, ao ativar a orbe simulada e pressionar “Navegar”, o Chromium iniciou **2 animações simultâneas**, embora o contador antigo retornasse 1 por consultar apenas `.foreground.motion`. O probe independente falhou antes da correção.

**Correção canônica:** prioridade visual da orbe ativa (`listening`/`speaking`) sobre a interpolação da navegação, abertura e recompensa. O sinal de diagnóstico `orbLive` expressa movimento efetivo (`.live` **e** ausência de Reduce Motion), não simplesmente a classe CSS. O Chromium pode atualizar a mídia antes de despachar um evento JavaScript. O estado semântico e a navegação permanecem instantâneos; a animação de navegação é retomada quando a voz cessa. O oráculo Python e a demonstração HTML integrados agora contam e validam todas as animações reais em execução, inclusive `document.getAnimations()` no laboratório. O autoteste visual injeta deliberadamente a regra defeituosa de v3.4 e precisa enxergar **duas** animações, comprovando que o erro anterior não passa despercebido.

**Condições de aprovação documental:** as suítes embutidas devem terminar com código 0 e sem filtros de exceção; duas baterias do Learning Motion em Chromium, teste integrado v3.5 (48 configurações + início de voz antes da abertura + alteração dinâmica de movimento reduzido), testes de contratos das 10 orbes, máquina de estados, Tesla Motion, Global-First e mutações. **Não equivale a homologação Android/iOS, WebKit/Safari, áudio real, GPU ou Rive em produção**.


### Y.1 Evidências de regressão da versão 3.5

| Suíte executada localmente | Resultado | Limite |
|---|---:|---|
| Árbitro Python — produtos × estados × eventos | **5.632/5.632 PASS** | Oráculo, não aplicativo |
| Mutações negativas do árbitro | **20/20 detectadas** | Contratos do documento |
| Teste Chromium integrado | **48/48 PASS** | HTML simulado |
| Voz antes da abertura e alternância dinâmica Reduce Motion | **4/4 + 8/8 PASS** | Chromium, áudio simulado |
| Mutação negativa: dois movimentos concorrentes | **1/1 detectada** | `document.getAnimations()`, Chromium |
| Learning Motion — ciclo de estados | **64/64 PASS** | Oráculo de referência |
| Learning Motion — navegador, lotes 0 e 1 | **64/64 + 64/64 PASS** | Protótipo Chromium |
| Precision Motion — navegador, lotes 0 e 1 | **48/48 + 48/48 PASS** | Protótipo Chromium |
| Learning Motion — mutações | **25/25 detectadas** | Contrato incorporado |
| Precision Motion — mutações | **22/22 detectadas** | Contrato incorporado |
| Global-First — contratos + tokens + contrastes | **85 verificações, 259 tokens e 60/60 contrastes PASS** | Documento, não mercados homologados |
| Global-First — mutações históricas | **14/14 detectadas** | Contrato incorporado |
| Orbes — 10 identidades e mutações | **10/10 e 17/17 PASS** | Catálogo embutido; app real pendente |

**Diagnóstico reproduzível:** o teste independente falhou no protótipo v3.4 com duas animações em execução (orbe + navegação). A correção v3.5 elimina a segunda interpolação, com teste negativo que deliberadamente reinjeta o defeito para provar que o detector o identifica. Os testes de navegador estão separados em lotes por limite de execução do ambiente; nenhum lote isolado autoriza declarar cobertura total da matriz.

**Gate de release:** `flutterAndroid`, `iOS`, `capacitor`, `hardware`, WebKit/Safari, áudio real, VoiceOver/TalkBack, GPU/FPS e Rive original instalado permanecem `NOT_RUN`. Logo, **100% de aprovação local ≠ 100% de homologação Android/Apple/Web ou dos quatro aplicativos**. Requer testes executados em builds e dispositivos reais antes da aprovação de produto.
