# AGEDESIGN.md — AGESOMA Design System

> Versão: 1.2 · 17/10/2026 · Estado: **especificação pronta para implementar; não homologada em dispositivos**  
> Marca: **AGESOMA** · Categoria: **Workforce OS com agentes de IA** · Plataformas: **Web responsiva, iOS e Android (quando aplicável)**  
> Referência visual vigente: **Midnight Precision** inspirado na descrição Linear — Style Reference fornecida pelo proprietário. A antiga referência Tesla permanece histórica para proporção de marca/motion, não define a paleta ativa.  
> Fontes normativas: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Android — Touch target size](https://support.google.com/accessibility/android/answer/7101858).

## 0A. Emenda normativa v1.2 — MIDNIGHT PRECISION (sobrescreve v1.1 em cores, tipografia e superfícies)

> **Prioridade:** quando houver divergência nesta especificação, a emenda v1.2 governa exclusivamente o design do aplicativo AGE. As regras anteriores sobre informação verdadeira, acessibilidade, AGE Motion, supervisão, quatro agentes e não-fabricação de estados continuam válidas. **Não copiar a marca, ícones, logotipos, ilustrações, prints nem código proprietário da Linear.** Apenas aplicar os padrões visuais descritos pelo proprietário à identidade original AGESOMA.

**Tema padrão nas superfícies AGE:** escuro. Background `#08090A` (Void); cartão `#0F1011` (Carbon); elevação `#161718` (Obsidian); borda fina `#23252A` e separação `#383B3F`. Texto principal `#FFFFFF`, secundário `#D0D6E0`, metadados `#8A8F98`. `#62666D` apenas para ornamentação/inatividade, não para texto obrigatório que precise de AA. **Ação primária única de destaque:** `#E4F222` (Acid Lime), com texto `#08090A`; nenhuma outra cor cromática como CTA. `#27A644`, `#EB5757`, `#02B8CC`, `#6366F1` e `#8B5CF6` reservadas para referências, nunca como falsos indicadores de estado. Estados críticos usam semântica, ícone e texto; cores de mensagem têm contraste corrigido no tema.

**Tipografia:** Inter Variable para toda a UI e títulos; pesos 400/510, até 590 para ênfase, tracking `-.022em` a partir de 48px e `-.012em` para outros títulos. Metadados técnicos em JetBrains Mono Variable (alternativa livre ao Berkeley Mono comercial). Features `cv01`, `ss03` e `zero` ativas. Não exibir Berkeley Mono sem licença e nunca distribuir fontes comerciais.

**Componentes:** cartões com 12px de raio, botões/inputs 6px, chips tipo pill 9999px; espaçamento de base 4px. Bordas hairline 0.5px nos cartões quando as condições do dispositivo permitem, com contraste e foco acessíveis. Não substituir affordance por contraste insuficiente. Área de toque de ações principais permanece **48px** no mobile, mesmo com densidade compacta. Elevação por superfície e borda, sem sombras pesadas. Sem gradientes em botões, textos, logotipos ou cards. Movimento discretíssimo vinculado a eventos reais; `prefers-reduced-motion` sempre prevalece. Destaque aceso NÃO sinaliza agente ativo sem evidência de execução.

**Composição:** até 1200px no showroom, hero editorial, demonstração real do produto abaixo, logo AGESOMA original em branco, sem depoimentos/logos fictícios. O workspace precisa preservar navegação, aprovação, rastreio e lista de agentes mesmo quando divergir do layout marketing sem sidebar da inspiração. Não inventar imagens ou screenshots da UI em produção. Os quatro cargos ficam CEO+COO, CFO, CMO+CRO, CTO+CPO.

**Escopo técnico:** `apps/web/app/linear-midnight.css` implementa overrides **dentro de `.ageTheme`** (showroom `/start`, workforce `/workforce`, entrevista `/workforce/ceo` e chat autenticado). Os tokens legados de `:root` v1.1 permanecem por enquanto para páginas ainda não migradas — **não** significa tema escuro homologado globalmente. O SVG `agesoma-wordmark-age.svg` original é monocromático e recebe inversão de contraste somente nas superfícies escurecidas. As regras de onboarding, privacidade, cobrança e autorização não mudam nesta emenda.

**Aceite:** Node tests, build Next, TypeScript, contraste WCAG AA de texto, dark/light mismatch, 320/390/768/1440, navegação por teclado e leitor de tela. Não declarar 10/10 nem produção pronta sem evidências visuais e E2E em dispositivos reais.

---

## 0. Contrato de implementação

Este documento é a fonte de verdade de **identidade visual, layout, componentes, estados e critérios de aceitação** da AGESOMA. Qualquer implementação deve seguir estas regras sem copiar código, logotipo, fotografia ou material proprietário da Tesla, SpaceX ou do Refero.

**Definição do produto:** uma empresa conecta sistemas; a AGESOMA compreende o contexto autorizado; agentes especializados executam trabalho com ferramentas e computadores próprios, sob controles de permissão e supervisão humana. Experiência de aquisição simples, semelhante ao B2C, para um produto usado por negócios.

**Oferta de entrada:** uma experiência pronta de **Atendimento Web** com demonstração, configuração guiada, compra e expansão para quatro agentes executivos: **CEO+COO**, **CFO**, **CMO+CRO**, **CTO+CPO**. Atendimento integra CEO+COO como capacidade; Vendas integra CMO+CRO. Não representar capacidades ainda em protótipo como entregues. Não representar esses papéis como capacidades entregues quando ainda estiverem em protótipo.

**Motion oficial da AGESOMA:** linguagem de movimento inspirada no **ElevenLabs UI** (componentes open source); estados operacionais independentes de estados de conversa por voz. Ver seção 8.

**Duas superfícies, um sistema:**
1. **Showroom** (`/` e páginas comerciais): narrativa com produto como protagonista, grandes imagens/vídeos autênticos, poucos textos e CTA inequívoco.
2. **Workspace** (`/workforce` e fluxos autenticados): produtividade verificável, estados reais de execução, logs, computadores dos agentes e aprovação humana. Nunca sacrificar controles por estética.

### Princípios inegociáveis

- **Produto em primeiro lugar:** demonstrar o que o agente faz em vez de usar ilustrações genéricas de robôs.
- **Precisão tecnológica:** texto neutro, alinhamentos deliberados, pouco ruído, ritmo visual uniforme.
- **Uma ação principal por contexto:** azul saturado somente no CTA dominante; exceções semânticas são estados de sistema.
- **Movimento responsivo:** a animação reage a áudio e eventos reais, não inventa atividade de agente; estética calma e premium.
- **Confiança operacional:** separar claramente **demonstração**, **prévia**, **execução real**, **aguardando aprovação** e **resultado comprovado**.
- **Controle explícito:** dados conectados, permissões, custos, reversibilidade e ações externas sempre compreensíveis.
- **Marca distinta:** inspiração funcional e visual, sem reproduzir o lettering de outras empresas nem reutilizar o mascote dos produtos Dots.
- **Global por padrão:** interfaces traduzíveis, acessíveis e adaptáveis a diferentes idiomas, formatos monetários e dispositivos.

---

## 1. Identidade e marca

### 1.1 Palavra-marca AGESOMA

- Exibir **AGESOMA** em caixa alta com construção geométrica horizontal e precisão de engenharia.
- Usar como ponto de partida a **última imagem gerada da AGESOMA na conversa**: A sem travessa, G estrutural, E em três faixas, S horizontal, O retangular suavizado e M angular.
- **Logo é um desenho vetorial próprio, não uma fonte de texto.** Não assumir que existe um arquivo TTF/OTF ou uma licença de uso da Tesla/SpaceX.
- Acabamento: **preto grafite sólido, opaco, sem relevo, brilho, ruído, extrusão ou sombra**; preservar anti-aliasing limpo.
- Fundo preferencial: branco. Versão reversa: branco sobre superfície grafite escura, somente quando o contraste permitir.
- Área livre: ao menos a altura do traço superior do A ao redor; nunca comprimir, deformar ou ajustar o tracking entre letras individualmente pelo CSS.
- Uso: cabeçalho, tela inicial e materiais institucionais. O produto interno usa marca discreta, sem repetição decorativa.

### 1.2 Vetor de referência do lettering atual (provisório)

SVG vetorizado automaticamente a partir da **imagem de trabalho mais recente**. É um ponto de partida para engenharia gráfica, **não um logotipo final homologado**. Revisar manualmente curvas, pesos, terminações e kerning antes de definir o arquivo oficial. O trecho abaixo é autocontido e pode ser salvo posteriormente como `agesoma-wordmark.svg`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1970 132" role="img" aria-labelledby="agesoma-title" width="100%">
  <title id="agesoma-title">AGESOMA</title>
  <path fill="#171A20" fill-rule="evenodd" d="M589 109 L597 117 L597 118 L598 118 L603 123 L604 123 L606 125 L607 125 L610 127 L612 127 L613 128 L615 128 L616 129 L782 129 L783 128 L788 127 L789 126 L792 125 L794 123 L795 123 L798 120 L799 120 L809 109 Z M592 55 L593 56 L593 57 L603 67 L604 67 L606 69 L607 69 L609 71 L610 71 L613 73 L615 73 L616 74 L619 74 L620 75 L773 75 L774 74 L779 73 L780 72 L787 69 L790 66 L791 66 L802 55 Z M1694 129 L1695 130 L1696 129 L1697 130 L1705 130 L1706 129 L1719 129 L1720 130 L1721 130 L1722 129 L1728 129 L1829 28 L1830 28 L1831 27 L1837 27 L1838 28 L1839 28 L1850 39 L1850 40 L1868 58 L1868 59 L1884 75 L1884 76 L1900 92 L1900 93 L1935 129 L1937 129 L1938 130 L1958 130 L1959 129 L1967 129 L1968 130 L1968 129 L1955 116 L1955 115 L1930 90 L1930 89 L1912 71 L1912 70 L1895 53 L1895 52 L1879 36 L1879 35 L1862 18 L1862 17 L1856 11 L1856 10 L1852 6 L1851 6 L1849 4 L1847 4 L1844 2 L1824 2 L1823 3 L1821 3 L1817 6 L1816 6 L1812 10 L1812 11 L1702 121 L1702 122 L1695 129 Z M0 129 L0 130 L1 129 L2 129 L3 130 L31 130 L32 129 L35 128 L135 28 L136 28 L137 27 L143 27 L144 28 L145 28 L159 42 L159 43 L176 60 L176 61 L193 78 L193 79 L209 95 L209 96 L241 129 L244 129 L245 130 L264 130 L265 129 L273 129 L274 130 L274 129 L251 106 L251 105 L234 88 L234 87 L218 71 L218 70 L202 54 L202 53 L171 21 L171 20 L163 12 L163 11 L157 5 L156 5 L153 3 L151 3 L150 2 L132 2 L131 3 L128 3 L127 4 L124 5 L117 12 L117 13 L114 16 L113 16 L113 17 L112 18 L111 18 L109 20 L109 21 L104 26 L103 26 Z M1391 1 L1391 129 L1413 129 L1413 37 L1414 36 L1415 36 L1420 40 L1423 41 L1425 43 L1426 43 L1428 45 L1429 45 L1431 47 L1432 47 L1434 49 L1435 49 L1437 51 L1438 51 L1440 53 L1441 53 L1443 55 L1444 55 L1446 57 L1447 57 L1449 59 L1450 59 L1452 61 L1453 61 L1461 67 L1464 68 L1466 70 L1467 70 L1469 72 L1470 72 L1472 74 L1473 74 L1475 76 L1476 76 L1478 78 L1479 78 L1481 80 L1482 80 L1484 82 L1485 82 L1487 84 L1488 84 L1490 86 L1491 86 L1493 88 L1494 88 L1496 90 L1497 90 L1499 92 L1500 92 L1502 94 L1503 94 L1505 96 L1506 96 L1508 98 L1509 98 L1517 104 L1522 104 L1523 103 L1524 103 L1527 100 L1528 100 L1536 94 L1539 93 L1541 91 L1542 91 L1544 89 L1545 89 L1553 83 L1556 82 L1558 80 L1559 80 L1561 78 L1562 78 L1564 76 L1565 76 L1567 74 L1568 74 L1576 68 L1579 67 L1581 65 L1582 65 L1584 63 L1585 63 L1587 61 L1588 61 L1590 59 L1591 59 L1599 53 L1602 52 L1604 50 L1605 50 L1607 48 L1608 48 L1610 46 L1611 46 L1619 40 L1620 40 L1624 37 L1625 37 L1626 38 L1626 129 L1649 129 L1649 75 L1650 74 L1650 72 L1649 71 L1649 1 L1638 1 L1637 2 L1634 2 L1633 3 L1632 3 L1630 5 L1629 5 L1627 7 L1626 7 L1624 9 L1623 9 L1620 12 L1617 13 L1611 18 L1608 19 L1605 22 L1604 22 L1602 24 L1601 24 L1599 26 L1598 26 L1596 28 L1595 28 L1593 30 L1592 30 L1590 32 L1589 32 L1587 34 L1586 34 L1584 36 L1583 36 L1581 38 L1580 38 L1578 40 L1577 40 L1575 42 L1574 42 L1572 44 L1571 44 L1569 46 L1568 46 L1566 48 L1565 48 L1563 50 L1562 50 L1560 52 L1559 52 L1557 54 L1556 54 L1554 56 L1553 56 L1551 58 L1550 58 L1548 60 L1547 60 L1545 62 L1544 62 L1542 64 L1541 64 L1539 66 L1538 66 L1536 68 L1535 68 L1533 70 L1532 70 L1530 72 L1529 72 L1527 74 L1524 75 L1520 78 L1517 77 L1515 75 L1514 75 L1512 73 L1511 73 L1509 71 L1508 71 L1506 69 L1505 69 L1503 67 L1502 67 L1500 65 L1499 65 L1496 62 L1495 62 L1493 60 L1492 60 L1490 58 L1489 58 L1487 56 L1486 56 L1484 54 L1483 54 L1481 52 L1480 52 L1478 50 L1477 50 L1474 47 L1473 47 L1469 44 L1468 44 L1465 41 L1464 41 L1462 39 L1461 39 L1459 37 L1458 37 L1456 35 L1455 35 L1453 33 L1452 33 L1449 30 L1448 30 L1446 28 L1445 28 L1443 26 L1442 26 L1440 24 L1439 24 L1437 22 L1436 22 L1434 20 L1433 20 L1431 18 L1430 18 L1427 15 L1426 15 L1424 13 L1423 13 L1421 11 L1420 11 L1417 8 L1416 8 L1411 4 L1410 4 L1407 2 L1404 2 L1403 1 Z M1126 16 L1126 18 L1125 19 L1125 111 L1126 112 L1126 114 L1127 115 L1129 120 L1134 125 L1135 125 L1137 127 L1139 127 L1140 128 L1142 128 L1143 129 L1268 129 L1269 130 L1278 130 L1279 129 L1324 129 L1325 128 L1327 128 L1328 127 L1333 125 L1338 120 L1338 119 L1341 115 L1341 113 L1342 112 L1342 108 L1343 107 L1343 24 L1342 23 L1342 18 L1341 17 L1339 12 L1335 7 L1334 7 L1331 4 L1330 4 L1329 3 L1327 3 L1326 2 L1323 2 L1322 1 L1145 1 L1144 2 L1141 2 L1140 3 L1135 5 L1128 12 L1128 13 Z M1147 26 L1151 22 L1152 22 L1153 21 L1314 21 L1315 22 L1316 22 L1319 25 L1319 26 L1320 27 L1320 104 L1319 105 L1319 106 L1316 109 L1311 109 L1310 110 L1309 109 L1256 109 L1255 110 L1225 110 L1224 109 L1205 109 L1204 110 L1192 110 L1191 109 L1164 109 L1163 110 L1154 110 L1153 109 L1151 109 L1147 105 Z M864 9 L864 10 L863 11 L863 13 L862 14 L862 62 L863 63 L863 65 L866 69 L866 70 L870 73 L871 73 L872 74 L874 74 L875 75 L1052 75 L1055 78 L1055 106 L1052 109 L882 109 L881 110 L878 110 L877 111 L868 115 L856 127 L856 128 L855 129 L854 129 L855 130 L856 129 L863 129 L864 130 L880 130 L881 129 L917 129 L918 130 L929 130 L930 129 L1064 129 L1065 128 L1067 128 L1068 127 L1071 126 L1075 121 L1075 120 L1076 119 L1076 117 L1077 116 L1077 68 L1076 67 L1076 65 L1075 64 L1074 61 L1068 56 L1066 56 L1065 55 L887 55 L884 52 L884 24 L887 21 L1053 21 L1054 20 L1057 20 L1058 19 L1060 19 L1061 18 L1066 16 L1068 14 L1069 14 L1082 1 L876 1 L875 2 L870 3 Z M592 1 L605 14 L606 14 L608 16 L609 16 L614 19 L616 19 L617 20 L620 20 L621 21 L784 21 L785 20 L789 20 L790 19 L791 19 L792 18 L794 18 L798 15 L799 15 L802 12 L803 12 L813 1 Z M538 0 L537 1 L335 1 L334 2 L332 2 L331 3 L328 4 L324 8 L324 9 L322 12 L322 15 L321 16 L321 114 L322 115 L323 120 L327 125 L328 125 L330 127 L331 127 L332 128 L334 128 L335 129 L534 129 L534 57 L404 57 L404 58 L416 70 L417 70 L419 72 L420 72 L427 76 L430 76 L431 77 L510 77 L512 79 L512 107 L510 109 L347 109 L346 108 L345 108 L343 105 L343 25 L344 24 L344 23 L347 21 L509 21 L510 20 L514 20 L515 19 L524 15 L533 7 L533 6 L538 1 Z"/>
</svg>
```

### 1.3 Ícone de aplicativo (a desenhar e validar)

- Derivar um monograma autoral **A** ou **AG** da geometria da palavra-marca.
- Área óptica centralizada, sem texto miúdo; versões sobre claro e escuro.
- Não copiar o T de Tesla, o X da SpaceX ou personagens dos Dots.
- Não declarar o ícone aprovado até validação em tamanhos 16, 24, 32, 48, 64, 120, 180 e 512 px.

---

## 2. Tokens de cor

Inspirado na lógica cromática do Refero: branco, grafite e tons neutros com **um azul reservado à ação prioritária**. Diferenciação deliberada: **AGE Blue `#385CE5`** em vez do azul de referência `#3E6AE1`.

| Token | HEX | Papel |
| --- | --- | --- |
| `--age-accent` | `#385CE5` | CTA principal, foco operacional ativo e links com ação (não títulos) |
| `--age-on-accent` | `#FFFFFF` | Texto em CTA |
| `--age-black` | `#000000` | Logo em versão preta e ícones sólidos |
| `--age-ink` | `#171A20` | Títulos e fundo de controle escuro |
| `--age-text` | `#393C41` | Corpo e navegação |
| `--age-muted` | `#5C5E62` | Metadados, legendas, texto secundário |
| `--age-placeholder` | `#5C5E62` | Placeholders legíveis |
| `--age-border` | `#CCCCCC` | Divisórias e bordas de controles |
| `--age-surface` | `#FFFFFF` | Fundo principal e cartões |
| `--age-surface-subtle` | `#EEEEEE` | Cartões secundários e área de trabalho |
| `--age-surface-warm` | `#E5E3DF` | Sessão editorial rara; evitar no workspace |
| `--age-success` | `#146C43` | Estado positivo, apenas uso semântico |
| `--age-warning` | `#995A00` | Requer atenção, apenas uso semântico |
| `--age-danger` | `#B42318` | Falha, risco ou ação destrutiva |

**Contraste esperado:** `#385CE5` sobre branco tem razão aproximada de **5,48:1**; `#171A20` sobre branco ≈ **17,43:1**; `#393C41` sobre branco ≈ **11,07:1**. Para outros pares (inclusive backgrounds com imagem), medir, não presumir.

**Regras de cor**
- Azul: um único botão primário visualmente dominante por região de ação. Pode marcar foco e seleção operacional quando isso for essencial ao entendimento.
- Verde, âmbar e vermelho: restritos a **status**, erros e confirmação de ações perigosas; nunca usados como decoração ou marca de agentes.
- Nunca comunicar status só pela cor. Combinar rótulo, ícone e texto.
- Texto sobre hero precisa de fundo previsível ou tratamento localizado de contraste. Se imagem não sustentar legibilidade, mover texto para bloco sólido.
- Bordas cinza-claro não devem ser usadas como única indicação de foco ou estado de erro.
- **Dark mode:** não habilitar automaticamente nesta versão; especificar um tema escuro completo e validá-lo antes de oferecer alternância.

---

## 3. Tipografia

O Refero descreve **Universal Sans** para a Tesla. **Não incorporar Universal Sans sem licença válida**. Usar famílias com licença adequada no produto; manter o lettering da AGESOMA como SVG independente.

| Papel | Família recomendada | Peso | Desktop | Mobile |
| --- | --- | --- | --- | --- |
| Logo | SVG exclusivo AGESOMA | Vetor | proporcional | proporcional |
| Display/hero | `Manrope`, `Inter`, sans-serif | 500 | 48/56 | 36/42 |
| H1 | `Manrope`, `Inter`, sans-serif | 500 | 40/48 | 32/40 |
| H2 | `Manrope`, `Inter`, sans-serif | 500 | 28/36 | 24/32 |
| H3 | `Inter`, sans-serif | 500 | 20/28 | 20/28 |
| Corpo | `Inter`, system-ui, sans-serif | 400 | 16/24 | 16/24 |
| UI densa | `Inter`, system-ui, sans-serif | 400–500 | 14/20 | 14/20 quando legível |
| Label | `Inter`, system-ui, sans-serif | 500 | 14/20 | 14/20 |
| Caption | `Inter`, system-ui, sans-serif | 400 | 12/16 | 12/16 |
| Dados/IDs | `ui-monospace`, `SFMono-Regular`, monospace | 400–500 | 13/20 | 13/20 |

Os pares `48/56` significam **font-size/line-height em px** (web); usar equivalentes escaláveis em cada plataforma nativa, respeitando tamanho dinâmico.

- Letter-spacing padrão: `0`. Para cabeçalhos caixa alta e microtítulos, no máximo `0.04em` se melhorar leitura.
- Evitar tudo em maiúsculas fora de marca, etiquetas curtas e categorias.
- Alinhar copy operacional à esquerda; só centralizar headline e CTA do showroom quando isso for coerente com imagem.
- A frase principal de marketing deve caber em até duas linhas no desktop e três no mobile em circunstâncias normais, **sem truncar traduções**.
- Não usar tamanho menor que 12 px para informação essencial; preferir corpo 16 px.

---

## 4. Grid, espaçamento e forma

**Unidade base: `4px`.** Escala autorizada: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

| Elemento | Regra |
| --- | --- |
| Gap inline padrão | 8 px |
| Gap entre controles | 12–16 px |
| Padding do cartão | 24 px desktop, 16 px mobile |
| Padding do layout | 32–48 px desktop, 16–24 px mobile |
| Botões/inputs | Radius 4 px |
| Cartões e modais | Radius 8 px |
| Ícones | 20–24 px; traço de 1,75–2 px |
| Altura botão | 48 px web e touch; aceitar mínimo nativo e alvo de toque adequado |
| Altura input | 48 px no formulário padrão |
| Borda | 1 px, `--age-border` |
| Sombras | Nenhuma por padrão; elevação discreta somente em camadas flutuantes |
| Conteúdo textual editorial | Máximo aproximado 70–80 caracteres por linha |

**Web breakpoints iniciais:** compacto `< 600px`; médio `600–1023px`; expandido `≥ 1024px`. Preferir **container queries** onde componentes sejam independentes da viewport.

**Layout showroom**
- Seção hero ocupa ao menos 85–100svh (com solução para teclado e navegador mobile).
- Imagem/prova de produto em tela cheia com composição responsiva e safe areas.
- CTA + CTA secundário centralizados na landing; em celular podem empilhar em largura confortável.
- Seções subsequentes mostram uma capacidade por vez, com vídeo curto/preview do produto, nunca fotos automotivas.

**Layout workspace**
- Desktop: navegação lateral enxuta (240 px), área central flexível e painel contextual opcional (320–360 px).
- Tablet: navegação condensada; painel de computador usa largura predominante.
- Mobile: navegação principal reduzida, agente e tarefa em sequência vertical; computador em tela focada/fullscreen; nenhum controle crítico atrás de hover.
- Preferir painéis e listas funcionais a conteúdo hero em tela inteira durante execução.
- Estados persistentes (trabalhando/pausado/erro) sempre visíveis em todos os tamanhos.

---

## 5. Componentes canônicos

Cada componente tem versão padrão, hover/foco, pressionado, desabilitado, loading, erro quando aplicável, teclado e leitor de tela.

### `AGE/Button`
- Variantes: `primary` (azul), `secondary` (contorno grafite), `tertiary` (texto), `danger` (vermelho só em ação destrutiva).
- Primário: fundo azul, texto branco, 4 px radius, altura mínima 48 px.
- Secundário: contorno e texto `--age-ink` em superfície clara.
- Ordem mobile quando empilhados: ação principal acima da secundária.
- Nunca colocar três CTAs de mesmo peso na mesma região.
- Sempre mostrar um rótulo de resultado: “Conectar”, “Ver demonstração”, “Aprovar e executar”, “Pausar agente”, etc.

### `AGE/Input`, `AGE/Select`, `AGE/Textarea`
- Label sempre visível; placeholder é exemplo, não substitui label.
- Texto de ajuda ao lado correto do campo. Mensagem de erro explica como corrigir.
- Nunca limpar dados preenchidos ao falhar uma conexão.
- Senhas/segredos via fluxos protegidos; não exibir tokens completos, credenciais ou payloads sensíveis.

### `AGE/AgentCard`
- Nome, função, **capacidade efetivamente disponível**, integração ativa, status, última execução e CTA contextual.
- Visual abstrato exclusivo da AGESOMA: monograma/símbolo geométrico neutro, **sem reutilizar mascote Dot**. `AGE/VoiceOrb` pode aparecer ao iniciar voz, **não** substitui o ícone de marca nem fica girando em todos os cartões.
- Uma mesma estrutura para CEO+COO, CFO, CMO+CRO e CTO+CPO (quatro identidades, sem uma quinta identidade de Atendimento). Não inventar poderes ou conectores ativos.

### `AGE/ComputerViewport`
- Área de trabalho isolada de um agente. Mostrar **prova visual**, fonte da sessão e indicador de ambiente (demo/teste/produção).
- Barra mínima: nome do agente, sistema/alvo, status da conexão, controlar/observar, pausar, expandir, encerrar.
- Falha de streaming não significa falha da tarefa: apresentar esses eventos separadamente.
- Indicador visual de execução usa `AGE/ActivityIndicator`, nunca o estado `talking` do orb; pausa e erro devem vir do orquestrador real.
- Evitar publicar prints com dados pessoais, senhas, IDs de terceiros ou conteúdo de clientes sem autorização.

### `AGE/RunTimeline`
- Exibir: horário, agente, ação, serviço usado, intenção, status, resultado e eventual link de evidência.
- Mensagens reais com carimbo temporal confiável; não simular progresso apenas por animação.
- Estados: `draft`, `awaiting_approval`, `queued`, `running`, `paused`, `succeeded`, `failed`, `canceled`.
- Erros apresentam `Tentar novamente` apenas quando tecnicamente seguro e sem risco de duplicar ações externas.

### `AGE/ApprovalPanel`
- Prévia inequívoca: “O que será feito?”, “Em qual conta?”, “Com quais dados?”, “Quanto custa?”, “Como cancelar ou reverter?”.
- Exigir confirmação explícita em ações financeiras, publicação, exclusão, envio externo ou mudanças irreversíveis.
- Aprovar, rejeitar e pedir revisão precisam de feedback persistido e auditável.
- Não autorizar ações apenas com motion, hover ou transição automática.

### `AGE/IntegrationTile`
- Logo autêntico e autorizado do provedor quando permitido; nome, permissões, último sync, escopo e ações de revogação.
- Estados separados: conectado, autorização expirada, aguardando permissões, desconectado, com erro.
- Não indicar que a AGESOMA “leu a empresa inteira” sem escopos e consentimento reais.

### `AGE/EvidenceReceipt`
- Provar resultado: tarefa, antes/depois verificável, timestamp, fonte e confirmação externa quando disponível.
- Separar “concluído pelo agente” de “confirmado no sistema de destino”.
- Nunca apresentar números econômicos, ROI ou economias como medidos sem fontes.

### `AGE/PlanCard`
- Preço, moeda, recorrência, quotas, integrações, custo variável e limites destacados antes do checkout.
- Não usar contagem regressiva falsa, dark patterns nem esconder condição de cancelamento.

### Estados comuns
- `Loading`: skeleton com dimensões estáveis e indicação textual se demora.
- `Empty`: explicar o que falta, próxima ação e benefício; jamais preencher com dados fictícios como reais.
- `Permission denied`: explicar permissão exata que está faltando, sem pressionar autorização irrestrita.
- `Offline/stream lost`: exibir estado real do cliente **sem inferir estado do backend**.
- `Failure`: causa conhecida quando possível, próxima ação, ID de suporte e persistência do que já funcionou.
- `Success`: feedback discreto, com link para evidência ou próximo passo.

---

## 6. Telas e jornadas de referência

### Site comercial (showroom)

| Rota | Conteúdo central | CTA primário |
| --- | --- | --- |
| `/` | Mensagem curta + demonstração verdadeira do produto em uso | `Testar AGESOMA` |
| `/como-funciona` | Conectar → entender → aprovar → executar → comprovar | `Ver demonstração` |
| `/atendimento` | Primeira oferta padronizada com caso de uso, limitações, exemplos | `Configurar atendimento` |
| `/precos` | Pacotes reais e transparentes | `Começar` |
| `/seguranca` | Permissões, isolamento, auditoria, privacidade | `Ver controles` |

**Hero sugerido**
- Headline: **“Sua empresa conecta. Seus agentes executam.”**
- Apoio: **“Conecte suas ferramentas, configure sua equipe de IA e acompanhe cada tarefa com controle e evidências.”**
- Primário: **“Testar AGESOMA”**; secundário: **“Ver como funciona”**.
- Visual: vídeo curto mostrando um workspace real ou demo claramente identificada, não robôs 3D ou promessas não implementadas.

### Produto (workspace)

| Rota | Objetivo | Evento de sucesso |
| --- | --- | --- |
| `/onboarding` | Criar workspace, identificar a empresa, definir consentimentos | Empresa configurada |
| `/integrations` | Conectar fontes autorizadas, escopos e revogação | Integração validada |
| `/workforce` | Ver agentes, capacidades, tarefas e custo | Agente escolhido |
| `/workforce/:id` | Ver computador do agente, ações, status e controles | Execução compreendida |
| `/runs/:id` | Acompanhar etapas, evidências e decisões | Resultado verificado |
| `/approvals` | Autorizar ou recusar ações de risco | Decisão registrada |
| `/billing` | Plano, quotas, uso e faturamento | Transparência financeira |
| `/settings/security` | Papéis, acessos, isolamento e logs | Permissões auditáveis |

**Jornada primária de ativação:** ver demonstração → criar conta → selecionar caso de uso → conectar com mínimo privilégio → validar contexto → prévia → aprovar primeira ação → acompanhar execução → receber prova → optar por próxima automação.

**AHA:** não é apenas “criei um agente”; ocorre quando uma tarefa útil foi realmente executada e **comprovada** no sistema de destino. Instrumentar separadamente `demo_viewed`, `integration_connected`, `agent_configured`, `run_approved`, `run_started`, `run_succeeded`, `outcome_verified`.

### Área de computadores
- Cada agente tem computador/sessão isolados **somente se a infraestrutura realmente oferecer isolamento**.
- Painel pode exibir navegador remoto, operações em andamento e logs resumidos.
- A interface **não confunde sandbox visual com segurança garantida**: fornecer escopo e política de acesso efetivos.
- Compartilhamento entre agentes somente com permissões explícitas e auditáveis.
- Estados de custo de execução e recursos visíveis quando disponíveis.

---

## 7. Imagens e direção de arte

**Mostrar software real em uso**: captura limpa do workspace, computador de agente, antes/depois, históricos de execução, integrações e resultados verificáveis.

- Showroom: grandes visualizações de produto, bordas discretas, áreas de respiro e profundidade produzida pelo conteúdo, não por sombras artificiais.
- Enquadrar telas sem expor senhas, chaves, dados reais de clientes ou nomes não autorizados.
- Preferir capturas reais; renders conceituais devem ter etiqueta explícita “Conceito” ou “Demonstração”.
- Não usar fotos de carros, foguetes, logotipo Tesla/SpaceX, avatares realistas enganosos ou imagens de bancos de imagem genéricas.
- Formatos: SVG para ícones; AVIF/WebP otimizados para imagens; vídeo com poster e legenda; fallback estático.
- Reservar tamanhos de imagem para evitar CLS; carregar hero de forma priorizada com orçamento de desempenho.

---

## 8. AGE MOTION — linguagem inspirada em ElevenLabs UI

> **Status:** especificação aprovada como DIREÇÃO DE DESIGN; ainda não implementada/testada no aplicativo.  
> **Fontes:** [ElevenLabs UI (repositório MIT)](https://github.com/elevenlabs/ui), [Orb oficial](https://ui.elevenlabs.io/docs/components/orb), [Live Waveform](https://ui.elevenlabs.io/docs/components/live-waveform), [Bar Visualizer](https://ui.elevenlabs.io/docs/components/bar-visualizer), [SDK React](https://elevenlabs.io/docs/eleven-agents/libraries/react).  
> **Interpretação:** inspirar-se nos componentes open source de interface, **não** copiar vídeos, logotipos, marcas, vozes proprietárias ou motion assets privados. Licença MIT do repositório deve ser preservada nos termos aplicáveis, após revisão das dependências e seus avisos.

### 8.1 Direção visual e princípios

- **Visual:** movimento fluido, orgânico, responsivo e preciso; estética cinematográfica discreta, sem excesso de partículas, neon, parallax ou vibração gratuita.
- **Regra de ouro:** motion **comunica estados reais** de interação e execução; nunca inventa tarefa concluída, microfone ativo, conversa em andamento ou sucesso.
- **Arquitetura visual:** showroom pode usar um orb de demonstração claramente rotulado; workspace usa movimento funcional e apenas **um orb animado principal por sessão de voz visível**.
- **Não confundir produtos:** orb AGESOMA é indicador de áudio/atividade, **não é mascote**, não herda cores, olhos, corpo ou personalidade do mascote da linha Dots.
- **Identidade:** preto/grafite e branco continuam dominantes; brilho e gradiente ficam restritos à *superfície interna do orb*. Não introduzir sombras pesadas ou nova paleta na interface.
- **Qualidade perceptiva:** movimento contínuo com suavização temporal, baixa amplitude em repouso, sem saltos quando áudio ou estado muda; evitar repetição mecânica.
- **Clareza:** nome do agente e rótulo textual do estado sempre aparecem perto da visualização. Orb, onda e barra são **ornamentos informativos**, não substituem textos, botões ou recibos.

### 8.2 Componentes AGE e relação com ElevenLabs UI

| Componente AGE | Referência técnica | Quando usar | Fallback obrigatório |
| --- | --- | --- | --- |
| `AGE/VoiceOrb` | `Orb` (Three.js/React Three Fiber) | Sessão ativa de conversa por voz, home de voz, demonstração identificada | Círculo estático com contorno/gradiente leve + rótulo |
| `AGE/LiveWaveform` | `LiveWaveform` | Exibir captação de áudio **autorizada**; reagir somente a níveis reais | Linha fixa + “Microfone inativo” |
| `AGE/BarVisualizer` | `BarVisualizer` | Entrada/saída de voz em interface compacta | Barras estáticas + rótulo |
| `AGE/VoiceButton` | `VoiceButton` | Iniciar/encerrar voz com feedback de gravação | Botão acessível padrão com ícone e texto |
| `AGE/ActivityIndicator` | Implementação AGESOMA, **sem mapear para voz** | Executar tarefa em computador, fila, sincronização, aprovação | Status textual e timestamp da última atualização |
| `AGE/Transition` | CSS transform/opacity ou equivalente nativo | Navegação, modal, painel, feedback curto | Troca instantânea |

**Regra de uso:** a biblioteca ElevenLabs UI é opcional e aberta para personalização. A AGESOMA **não depende da API paga da ElevenLabs** para renderizar animações. Uso de voz, transcrição, TTS, STT e agentes de conversação são integrações separadas, com suas próprias permissões, custos e políticas.

### 8.3 Máquina de estados — duas dimensões independentes

**A. Conversa por voz (vinculada à sessão e ao usuário):**

| Estado AGESOMA | Estado suportado por `Orb` | Motion | Rótulo visível |
| --- | --- | --- | --- |
| `voice_idle` | `null` | Orb parado ou respiração sutil (sem sugerir conexão) | “Iniciar conversa” |
| `voice_connecting` | `null` | Progresso de conexão discreto, não waveform falsa | “Conectando…” |
| `voice_listening` | `listening` | Orb reage **somente** ao nível real de entrada autorizado | “Ouvindo” |
| `voice_thinking` | `thinking` | Movimento orgânico de amplitude moderada, sem pulso de áudio falso | “Preparando resposta” |
| `voice_speaking` | `talking` | Movimento responde ao nível real de saída | “Respondendo por voz” |
| `voice_muted` | `null` | Reduzir a atividade; indicador de microfone desativado | “Microfone desligado” |
| `voice_disconnected` | `null` | Parar reação e indicar reconexão | “Conversa desconectada” |
| `voice_error` | `null` | Transição única para fallback estático | “Não foi possível iniciar o áudio” |

**B. Trabalho do agente (vinculado ao backend de tarefas):** `draft`, `awaiting_approval`, `queued`, `running`, `paused`, `succeeded`, `failed`, `canceled`. Usar `AGE/ActivityIndicator` e a timeline de execução. **NÃO** mapear `running` para `Orb.talking`, `awaiting_approval` para `Orb.listening` ou `succeeded` para explosão de partículas. Um agente pode executar tarefas enquanto a conversa está desconectada: estados devem continuar independentes.

**Origem da verdade:** estados, timestamps e eventos vêm da sessão de voz ou do orquestrador. Animações interpolam **apresentação**, não fabricam eventos. Ações críticas exigem `AGE/ApprovalPanel`, nunca mudança de cor ou gesto de orb como consentimento.

### 8.4 Tokens AGE Motion V1 — valores de projeto (não oficiais da ElevenLabs)

| Token | Valor inicial | Aplicação |
| --- | --- | --- |
| `--age-motion-instant` | `90ms` | feedback básico de pressão |
| `--age-motion-fast` | `140ms` | hover, foco secundário |
| `--age-motion-base` | `220ms` | troca de controles, tabs, estado |
| `--age-motion-panel` | `280ms` | entrada/saída de modal ou painel |
| `--age-motion-slow` | `440ms` | hero, narrativa de showroom |
| `--age-motion-audio-smoothing` | `120ms` | suavização visual de níveis de áudio (referência) |
| `--age-ease` | `cubic-bezier(0.2, 0, 0, 1)` | transições utilitárias |
| `--age-orb-blue-1` | `#385CE5` | cor primária do orb |
| `--age-orb-blue-2` | `#A5B9E8` | cor de equilíbrio do orb |
| `--age-orb-size-hero` | `min(280px, 60vw)` | destaque de voz / showroom |
| `--age-orb-size-panel` | `112px` | tela de agente com voz |
| `--age-orb-size-compact` | `48px` | visual reduzido se houver espaço |

**Movimentos por evento:**

- Pressionar/hover: `120–160ms`, `ease-out`, sem escala maior que `1.02` nos controles de operação.
- Entrar componente: `180–240ms`, opacidade + translação **até 8px**.
- Abrir modal/painel: `220–280ms`; foco vai ao diálogo sem aguardar animação.
- Trocar agentes/abas: `160–220ms` com crossfade sutil; sessões e ações não reiniciam.
- Showroom/hero: `400–600ms` opcional, com poster estático e sem bloquear CTA.
- Voz: orb em movimento contínuo **apenas enquanto estiver visível e permitido**; amplitude deriva de áudio de entrada/saída real ou estado de pensamento informado pelo SDK.
- Em espera: pode haver respiração mínima **somente em tela de voz aberta**, sem sugerir que está gravando.
- Erro/sucesso: **uma** transição curta para estado fixo; sem loop de celebração.
- Espera indeterminada: mostrar spinner/pulsação utilitária com texto; não porcentagens falsas, contagens não verificadas ou movimento que implique execução confirmada.

### 8.5 Integração web recomendada (React/Next.js)

**Preparo do projeto:** React com shadcn/ui + Tailwind instalado. Componente de orb oficial pode ser adicionado com a CLI documentada:

```bash
npx @elevenlabs/cli@latest components add orb
```

**Observações:** revisar o código importado e dependências (`three`, `@react-three/fiber`, `@react-three/drei`) antes de integrar; fixar versões aprovadas no lockfile, verificar licença e bundle. A CLI adiciona **componente visual**, não habilita voz, autenticação ou agente automaticamente.

**Exemplo de contrato de uso — apenas em componente client-side com sessão de voz real:**

```tsx
"use client"
import { Orb } from "@/components/ui/orb"
import { useConversation } from "@elevenlabs/react"

type VoiceMotionState = null | "listening" | "thinking" | "talking"

export function AGEVoiceOrb({
  state,
}: {
  state: VoiceMotionState // derivado do estado real da sessão
}) {
  const conversation = useConversation() // integrar com a sessão existente, não iniciar aqui
  return (
    <div aria-hidden="true" className="h-28 w-28">
      <Orb
        colors={["#385CE5", "#A5B9E8"]}
        seed={3077}
        agentState={state}
        getInputVolume={() => conversation.getInputVolume()}
        getOutputVolume={() => conversation.getOutputVolume()}
      />
    </div>
  )
}
```

- Acima é um **exemplo de contrato**, não código executado/validado neste repositório. A conversão entre status do SDK e `VoiceMotionState` deve ocorrer no adaptador da aplicação; nunca presumir que `useConversation()` já esteja conectado.
- Renderizar com **importação dinâmica somente no cliente**, sem SSR de WebGL; prever placeholder SSR de tamanho estável, fallback em erro de contexto e cleanup de sessão.
- Sessão de áudio precisa de **ação explícita do usuário** e permissão real do navegador/sistema. Mic desligado = níveis zerados; nunca coletar/armazenar áudio sem base legal, transparência e controles.
- Não montar dezenas de canvases simultaneamente em listas de agentes. Um orb 3D máximo na região de foco; itens secundários usam ícone/indicador 2D.
- Níveis do SDK `getInputVolume()`/`getOutputVolume()` são normalizados `0–1`; tratar valores ausentes como `0`, limitar amplitude a faixa válida e suavizar variações para evitar jitter.
- Para modo **sem voz** (uso de outro modelo ou apenas agentes de computador), manter animações AGE em CSS ou canvas local; não inventar ondas que pareçam áudio real.

### 8.6 Mobile nativo, tablet e condições de baixo desempenho

- **Web mobile:** reduzir resolução do WebGL em telas pequenas e alta densidade, desativar efeitos caros em bateria fraca **quando sinal disponível e permitido** e suspender frames quando fora da viewport.
- **iOS/Android nativos/Flutter:** reproduzir **design e estados** com renderer nativo/SKIA/Rive ou solução licenciada equivalente. O componente React/Three.js **não é portável diretamente** para Flutter/SwiftUI/Compose; evitar embutir WebView pesado só para exibir o orb.
- WebView ou WebGL **não pode ser requisito** para completar tarefas, aprovar transações ou fazer login.
- **Estratégia de fallback em três níveis:** nível 1 `3D` (equipamento compatível); nível 2 `2D` (CSS/SVG/Canvas/native simples); nível 3 `static` (reduced motion, consumo elevado, falha de renderer).
- Redesenho para mobile: orb maior somente no fluxo de voz em tela dedicada; status e botões de pausa/mudo/encerrar permanecem legíveis e operáveis.
- **Metas de desempenho para validação, não resultados medidos:** 60fps quando viável, mínimo aceitável de 30fps no hardware alvo durante animações não críticas; evitar regressão de entrada, LCP e consumo de bateria. Ajustar metas por dispositivo conforme testes com profiling.

### 8.7 Acessibilidade e confiança

- `prefers-reduced-motion: reduce` **elimina movimento contínuo do orb**, waveform animada não essencial e transições grandes; manter texto, status, ações e foco disponíveis.
- Conteúdo 3D/canvas é `aria-hidden` quando decorativo; perto dele deve existir texto acessível de estado, atualização **somente quando estado muda**, sem anúncios por frame.
- Não depender de amplitude, velocidade ou cor para distinguir ouvir/pensar/falar; usar rótulos “Ouvindo”, “Preparando resposta” e “Respondendo por voz”.
- Nunca iniciar captação automaticamente porque o usuário abriu o workspace; respeitar muting, permissão negada e interrupções de chamada.
- Controles acessíveis: pausar, mudo, encerrar voz, visualizar transcrição (quando disponível), voltar ao teclado/texto. Não prender o usuário em modal de voz.
- Motion não é sistema de notificações de ação financeira, permissão ou aprovação; `AGE/ApprovalPanel` oferece conteúdo e confirmação explícita.
- Reduzir efeitos ou pausar requestAnimationFrame em aba/tela oculta **sem alterar o estado do backend**.

### 8.8 Testes de aceite para AGE Motion (exigidos antes de alegar 10/10)

- [ ] Voice state `idle/listening/thinking/talking/muted/disconnected/error` mapeado corretamente; rótulo visível.
- [ ] Orb só reage a áudio **real e autorizado**; sem microfone ativado sozinho e sem visualização falsa de voz.
- [ ] Running/paused/approval/failure do computador são independentes da sessão de voz.
- [ ] Mudanças rápidas de estado (ouvir→pensar→falar→desconectar) sem travamentos ou estado visual obsoleto.
- [ ] Testar WebGL habilitado, indisponível, contexto perdido e retorno de aba; fallback em todos os casos.
- [ ] Testar `prefers-reduced-motion`, VoiceOver/TalkBack, teclado, foco e controles de mute/encerrar.
- [ ] Não degradar fluxo de tarefas no Android/iOS de entrada nem bloqueá-lo ao desativar orb.
- [ ] Testar 320px/390px/768px/1440px e orientação paisagem, 200% de zoom e dispositivos com pouca memória.
- [ ] Registrar FPS médio/pior caso, long tasks, uso de CPU/GPU e regressões do Lighthouse/LCP/CLS na build real.
- [ ] Testar voz vs. texto, reconexão, permissão negada, offline, áudio sem sinal e múltiplos agentes sem canvases simultâneos.
- [ ] Testar fallback estático e legibilidade de texto com todas as localizações suportadas.
- [ ] Validar licenças da biblioteca, versões fixadas e ausência de assets proprietários incorporados indevidamente.

**Resultado atual:** regras documentadas; **nenhum teste de FPS, WebGL, acessibilidade ou dispositivo executado nesta atualização**. Não declarar homologação até medição em aplicação funcional.

---

## 9. Responsividade, acessibilidade e globalização

### Acessibilidade — critérios de aceite

- **WCAG 2.2 AA** como meta da experiência web, inclusive teclado, foco, labels, contraste, reflow e leitores de tela.
- Texto normal: **contraste ≥ 4,5:1**; texto grande e elementos gráficos relevantes: **≥ 3:1** quando aplicável.
- Foco visível e distinto de hover, com indicador robusto em superfícies claras e escuras.
- Áreas clicáveis: web touch **≥ 48×48 CSS px** como decisão do produto; iOS alvo **≥ 44×44 pt**; Android alvo **≥ 48×48 dp**.
- Ícones de controles recebem nomes acessíveis; notificações async têm anúncio adequado e não roubam foco.
- Suporte a zoom de texto, tamanho dinâmico, navegação por teclado e navegação por leitor de tela.
- Capturas do computador do agente oferecem resumo textual acessível do progresso e ações críticas; não depender só de vídeo remoto.
- Erros, status e prioridades combinam **rótulo + sinal visual**, não apenas cor.

### Globalização

- Idioma inicial do produto pode ser `pt-BR`; preparar `en-US` e outros idiomas sem reescrever componentes.
- Todas as strings em arquivos de tradução; nenhuma palavra embutida dentro de PNG ou SVG operacional.
- Formatar datas, horas, moedas, separadores numéricos e plural com APIs de internacionalização.
- Timezone do usuário separado de timestamps de backend, que devem ser persistidos em UTC.
- Tolerar aumento de até 40% no comprimento do texto; botões quebram/expandem sem cortar a tradução.
- RTL: não presumir esquerda→direita em componentes, ícones direcionais e ordenação de foco.
- Não confundir país de operação, residência legal ou moeda de faturamento.

### Plataforma

- **Web:** mouse, teclado, touch, PWA quando apropriado; painel de computador tolera perda de conexão.
- **iOS:** safe areas, Dynamic Type, gestos nativos e regiões de toque de pelo menos 44 pt; não sobrepor controles ao indicador de início.
- **Android:** janela insets, teclado, TalkBack, 48 dp de touch target e reflow em landscape/tablet.
- **Tablet/foldables:** layouts adaptativos, multitarefa e resize sem apagar uma tarefa em execução.

---

## 10. Tokens CSS — implementação web

Estes tokens são **AGE**, não cópia literal dos tokens Tesla do site de referência.

```css
:root {
  color-scheme: light;
  --age-accent: #385ce5;
  --age-on-accent: #ffffff;
  --age-black: #000000;
  --age-ink: #171a20;
  --age-text: #393c41;
  --age-muted: #5c5e62;
  --age-placeholder: #5c5e62;
  --age-border: #cccccc;
  --age-surface: #ffffff;
  --age-surface-subtle: #eeeeee;
  --age-surface-warm: #e5e3df;
  --age-success: #146c43;
  --age-warning: #995a00;
  --age-danger: #b42318;

  --age-font-display: "Manrope", "Inter", system-ui, sans-serif;
  --age-font-ui: "Inter", system-ui, sans-serif;
  --age-font-mono: ui-monospace, "SFMono-Regular", monospace;

  --age-space-1: 4px;
  --age-space-2: 8px;
  --age-space-3: 12px;
  --age-space-4: 16px;
  --age-space-5: 20px;
  --age-space-6: 24px;
  --age-space-8: 32px;
  --age-space-10: 40px;
  --age-space-12: 48px;
  --age-space-16: 64px;

  --age-radius-control: 4px;
  --age-radius-card: 8px;
  --age-border-width: 1px;
  --age-control-height: 48px;
  --age-motion-instant: 90ms;
  --age-motion-fast: 140ms;
  --age-motion-base: 220ms;
  --age-motion-panel: 280ms;
  --age-motion-slow: 440ms;
  --age-motion-audio-smoothing: 120ms;
  --age-orb-blue-1: #385ce5;
  --age-orb-blue-2: #a5b9e8;
  --age-orb-size-hero: min(280px, 60vw);
  --age-orb-size-panel: 112px;
  --age-orb-size-compact: 48px;
  --age-ease: cubic-bezier(0.2, 0, 0, 1);
}

.age-button {
  min-height: var(--age-control-height);
  border-radius: var(--age-radius-control);
  padding: 10px 24px;
  font: 500 14px/20px var(--age-font-ui);
  cursor: pointer;
  transition: background-color var(--age-motion-fast) var(--age-ease),
              border-color var(--age-motion-fast) var(--age-ease);
}
.age-button--primary {
  background: var(--age-accent);
  color: var(--age-on-accent);
  border: 1px solid var(--age-accent);
}
.age-button--secondary {
  background: transparent;
  color: var(--age-ink);
  border: 1px solid var(--age-ink);
}
.age-button:focus-visible {
  outline: 3px solid var(--age-ink);
  outline-offset: 3px;
}
.age-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
@media (prefers-reduced-motion: reduce) {
  .age-button { transition: none; }
}
```

### Tailwind v4 (mapeamento mínimo)

```css
@theme inline {
  --color-age-accent: var(--age-accent);
  --color-age-ink: var(--age-ink);
  --color-age-text: var(--age-text);
  --color-age-muted: var(--age-muted);
  --color-age-surface: var(--age-surface);
  --color-age-surface-subtle: var(--age-surface-subtle);
  --font-age-ui: var(--age-font-ui);
  --font-age-display: var(--age-font-display);
  --radius-age-control: var(--age-radius-control);
  --radius-age-card: var(--age-radius-card);
}
```

### Flutter / nativo (mapeamento, não código executado)

- `AGEColors.*` corresponde exatamente aos valores hex definidos em `:root`.
- `AGEType.*` corresponde aos pesos e tamanhos da tabela tipográfica, usando `sp`/escalabilidade apropriada à plataforma.
- `AGEInsets.*` corresponde à escala de 4 px, ajustada para `dp`/pontos.
- `AGEComponents` são o ponto central de Button, Input, AgentCard, RunTimeline, ApprovalPanel e VoiceOrb com fallback 2D/estático.
- `AGEVoiceMotionState` espelha estados semânticos, não a implementação WebGL; compatibilidade visual deve ser medida, não presumida.
- Tests golden/goldens referenciam os mesmos estados semanticamente; **não** assumir igualdade de raster entre sistemas.

---

## 11. Segurança de apresentação e confiança

A aparência de um computador ativo não é prova de que trabalho foi executado. A interface deve exibir dados de backend reais e rastreáveis.

- **Demonstração:** banner/label persistente; dados de exemplo sintéticos ou anonimizados.
- **Modo real:** confirma workspace, conta conectada, permissões válidas e escopo da ação.
- **Aprovação:** sempre antes de ações irreversíveis/sensíveis, com justificativa e consequência clara.
- **Resultado:** fornecer recibo com evidência e distinção entre tentado, concluído e verificado externamente.
- **Segredos:** nunca renderizar tokens, credenciais ou screenshots sensíveis em estados de erro e logs compartilhados.
- **Abandono/reconexão:** retomar execução com estado reconciliado, nunca recriar ação automaticamente sem idempotência.
- **Telemetria:** limitar coleta ao necessário, com tratamento seguro e acessos adequados.

---

## 12. Auditoria e testes de aceite

**Importante:** os critérios abaixo são requisitos de validação. **Nenhum teste real de aplicativo ou device foi executado ao criar este arquivo.** Não declarar 10/10, 100% aprovado ou conformidade AA sem evidência.

### Matriz por superfície

| Superfície | Teste obrigatório | Ferramenta possível |
| --- | --- | --- |
| Web showroom | Responsividade, hero legível, CTA e LCP/CLS | Playwright, Lighthouse |
| Web workspace | Aprovar/pausar/reconectar, states async, navegação teclado | Playwright |
| Acessibilidade web | Labels, foco, contraste, estrutura, zoom, WCAG | axe-core + revisão manual |
| Android | Touch targets, TalkBack, teclado, rotação, tarefa longa | Maestro + Accessibility Scanner |
| iOS | VoiceOver, Dynamic Type, safe areas, gestos | XCTest/XCUITest + Maestro conforme compatibilidade |
| Tablets/foldables | Reflow, panes, rotação e resumption | Testes em simulador/device |
| Marca | SVG pixel/geometry, tamanhos e fundos | Comparação visual humana + snapshots |
| AGE Motion / Voz | Orb, waveform, áudio real, fallback, reduced-motion, desempenho | Playwright + profiling + testes manuais em dispositivos |
| Ações de IA | Diferenciar demo/real, permissões, erro de stream e execução | E2E de backend e contratos |

### Viewports representativas

`320×568`, `375×667`, `390×844`, `430×932`, `768×1024`, `1024×768`, `1280×800`, `1440×900` e `1920×1080`. Validar também orientação paisagem, zoom do navegador, redução de movimento, conexão lenta e teclado aberto.

### Critérios de rejeição automática

- [ ] Sem corte de CTA, título, tabela crítica, status ou controles de aprovação.
- [ ] Sem overflow horizontal inesperado em viewport compacta.
- [ ] Sem botão inoperante ou estado de sucesso fictício.
- [ ] Sem ação externa executada sem autorização necessária.
- [ ] Sem simulação visual confundida com execução verdadeira.
- [ ] Sem texto principal abaixo de 4,5:1 em contraste; sem estado que dependa apenas de cor.
- [ ] Sem foco invisível ou armadilha de teclado.
- [ ] Sem touch target abaixo do padrão da plataforma.
- [ ] Sem animação que ignora `prefers-reduced-motion`.
- [ ] Sem orb sugerindo gravação de áudio desativada ou tarefa executada sem evidência.
- [ ] Sem dependência funcional de WebGL ou áudio para usar o workspace.
- [ ] Sem segredo ou dado real de terceiro nos screenshots de marketing.
- [ ] Sem perda silenciosa de execução após reconexão ou troca de tela.
- [ ] Sem uso indevido de fonte/logotipo protegido sem licença.

### Rubrica de qualidade (não é nota obtida)

- **Identidade e consistência:** 20 pontos.
- **Hierarquia visual e conversão:** 15 pontos.
- **Clareza operacional e rastreabilidade:** 20 pontos.
- **Acessibilidade e globalização:** 15 pontos.
- **Responsividade e ergonomia:** 10 pontos.
- **Segurança de UX e consentimento:** 10 pontos.
- **Motion e desempenho percebido:** 10 pontos.

**Gate para release:** 100/100 na rubrica só após revisão humana e testes documentados em dispositivos; **zero falhas bloqueantes** na matriz. Notas conceituais não substituem execução.

---

## 13. Como o agente de desenvolvimento deve usar este arquivo

1. Ler todo o `AGEDESIGN.md` antes de criar ou alterar uma tela.
2. Fazer inventário de cores, tipografia, componentes e estados existentes no repositório.
3. Corrigir divergências adotando tokens AGE; não duplicar estilos isolados.
4. Implementar primeiro `AGE/Button`, `AGE/Input`, `AGE/AgentCard`, `AGE/ComputerViewport`, `AGE/RunTimeline` e `AGE/ApprovalPanel`; depois integrar `AGE/VoiceOrb` e fallbacks com estados reais.
5. Aplicar à landing e ao `/workforce`, preservando lógica real e autorizações.
6. Verificar telas vazias, loading, falhas e conectividade antes dos estados ideais.
7. Executar testes da matriz e registrar resultados, screenshots, dispositivos e falhas remanescentes.
8. Nunca declarar funcionalidade ou qualidade como concluída sem artefato verificável.

### Checklist de governança

- Mudança de cor, fonte, grid ou motion global exige alteração neste arquivo.
- AGE Motion v1 utiliza ElevenLabs UI como referência **técnica e visual**, sem impor dependência do fornecedor de voz.
- Mudança de comportamento de IA, permissão ou faturamento exige revisão de UX e segurança.
- Componentes novos precisam de estado padrão, erro, loading, foco, tradução e versão mobile.
- Screenshots de testes devem ser produzidos da build efetivamente testada.
- A versão final do SVG de logo precisa de revisão visual e decisão explícita de congelamento.

---

## 14. Fontes e escopo de adaptação

- [Refero Styles — Tesla](https://styles.refero.design/style/7266b546-2fb0-465c-acd6-79001c39829a) — inspiração em vitrine cinematográfica, neutros, espaçamento base 4 px e poucos CTAs.
- [ElevenLabs UI — biblioteca MIT](https://github.com/elevenlabs/ui) — referência open source de orb, waveform e controles de voz.
- [ElevenLabs UI — Orb](https://ui.elevenlabs.io/docs/components/orb) — estados e integração com níveis de áudio.
- [ElevenLabs — SDK React](https://elevenlabs.io/docs/eleven-agents/libraries/react) — leitura de volumes de entrada e saída.
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/) — acessibilidade e contraste.
- [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) — interação de toque e dimensões.
- [Android Accessibility — Touch Target](https://support.google.com/accessibility/android/answer/7101858) — área de interação mínima recomendada.

**Autoria e limites:** as regras do produto, componentes de agentes, segurança, jornadas e tokens AGE são adaptações originais. O SVG é uma vetorização técnica do rascunho de logo fornecido nesta conversa. Nenhuma licença de uso de marca/fonte de terceiros está implícita.