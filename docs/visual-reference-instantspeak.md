# AGESOMA visual reference — InstantSpeak

Canonical visual reference requested for AGESOMA: the current InstantSpeak product language.

Source inspected in `raphaelribeirob/InstantSpeak` main:

- `styles.css`
- `eleven-ui.css`
- `brand-splash.css`

The supplied Vercel deployment URL remains the intended visual product reference; the repository styles are the reproducible implementation source for the design language.

## Adopted language

AGESOMA adopts the visual grammar rather than the learning-product screen structure:

- warm off-white canvas (`#f7f7f5` family);
- translucent white panels with very low-contrast borders;
- compact 11–18 px radii instead of oversized SaaS pills/cards;
- dark charcoal primary actions;
- light headline weights and tight negative tracking;
- low-contrast neutral secondary copy;
- subtle photographic/fractal grain;
- blue/cyan/violet intelligence material reserved for active AI;
- thin progress bars, restrained chips and low-shadow hierarchy;
- mobile geometry that feels like a native product rather than an enterprise dashboard.

## AGESOMA-specific adaptations

The product is not turned into an InstantSpeak clone.

AGESOMA keeps:

- its own wordmark and product identity;
- Company Brain / Company Ontology semantics;
- operational desktop information density;
- owner decision, team, work and outcome hierarchy;
- RiverThree rule that expressive intelligence material appears only when intelligence is materially active.

The InstantSpeak visual language is applied to:

- owner home;
- operational cards/rows;
- onboarding;
- authentication;
- actions and progress;
- Intelligence Orb material.

## Canonical implementation

`apps/web/app/instantspeak-reference.css` is loaded last in the web layout and acts as the AGESOMA adaptation layer. Core product semantics must not depend on this stylesheet.

When InstantSpeak changes, visual changes should be intentionally ported into this layer rather than coupling AGESOMA directly to InstantSpeak code.
