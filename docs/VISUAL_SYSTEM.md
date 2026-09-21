# AGESOMA Visual System

## Purpose

The visual system supports one product idea: AGESOMA should feel like a calm operating intelligence for a business, not an enterprise dashboard or an AI control panel.

## Core language

- warm off-white canvas;
- translucent white surfaces with low-contrast borders;
- compact 11–18 px radii;
- dark charcoal primary actions;
- light headline weights with tight tracking;
- restrained secondary copy;
- subtle photographic/fractal grain;
- blue/cyan/violet intelligence material reserved for active AI;
- thin progress indicators and low-shadow hierarchy;
- mobile geometry that remains product-native rather than dashboard-like.

## Product-specific rules

AGESOMA keeps its own wordmark, product identity and operating semantics.

Expressive intelligence material should appear only when intelligence is materially active. Routine operational surfaces should remain quiet and legible.

The visual hierarchy should prioritize:

1. the current owner objective;
2. work in progress;
3. decisions that require the owner;
4. verified results;
5. supporting business context.

Internal architecture concepts such as HERMES, Sentinel, Work Cells, models, prompts and routing must not become customer-facing visual concepts.

## Canonical implementation

`apps/web/app/agesoma-visual-system.css` is the product-specific visual adaptation layer loaded by the web layout.

Supporting design-system assets include:

- `apps/web/app/agesoma-brand.css`;
- `apps/web/app/riverthree-fonts.css`;
- `apps/web/app/riverthree-v418.css`;
- `apps/web/app/agesoma-conversation.css`.

RiverThree is the internal design contract used by R3 products. AGESOMA applies that contract through its own product-specific package and visual layer.

Core product semantics must never depend on decorative styling.
