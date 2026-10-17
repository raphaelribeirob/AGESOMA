# PLATFORMDESIGN.md — Brand-independent foundation for Instant and Dots

> **Version 1.0 · 17 October 2026 · design contracts, not a shared visual theme.**
> Canonical product design stays inside each application's own `DESIGN.md`.

## Identity hierarchy

```text
PLATFORM (this repository): auth adapters, model gateway, usage, policies, tools
 ├─ INSTANT FAMILY (first)
 │   ├─ InstantSpeak     → InstantSpeak/DESIGN.md [white, voice-first]
 │   ├─ InstantStudy     → InstantStudy/DESIGN.md [editorial learning]
 │   └─ InstantBible     → InstantBible/DESIGN.md [quiet, text/ritual-first]
 └─ DOTS FAMILY (second)
     └─ DotSpeak         → DotSpeak/DESIGN.md [warm paper, companion-first]
LEGACY AGESOMA CONSOLE → AGEDESIGN.md v1.2 [dark precision; independent]
```

## Portable primitives (no common visual skin)

Reusable `ProductShell`, `Action`, `Field`, `Typography`, `Status`, `VoiceSession` and `SafeApproval` should accept **product-owned** semantic tokens instead of importing AGE global CSS. Reuse only behavior, accessibility contracts and instrumented state transitions. Tokens should be namespaced by product and family; never set the entire monorepo's `:root` based on one family.

**Instant**: mobile-first, light/quiet experiences. InstantSpeak specifically uses #FFFFFF canvas, black ink, #F5F3F1 surfaces; its audio orb is a real integration and must not be replaced with generic animation. InstantStudy has a separate design with warm industrial tones; InstantBible is editorial and scripture-led. No single Instant palette replaces these canonical variants.

**Dots**: the DotSpeak implementation's canonical palette starts with #FBF7F2 (background), #FFFFFF (surface), #292724 (ink), #E6DDD5 (outline) and blue #0061EF (Leonardo interaction). Dot identities, guardian controls and effects belong inside Dots product code; never clone the AGE executive badges or a fake orb. Other future Dots products can define other visual semantics.

**AGESOMA**: keep current Linear-inspired Midnight CSS scoped to `.ageTheme` for the authenticated/legacy business console. It is **not** the new family brand and must not override Instant or Dots colors/typography.

## Family portal implementation

- `/instant`: Instant-first catalog, inspired by the existing white editorial product design; it is **not** a live app launcher or a shared-login dashboard.
- `/dots`: Dots phase-two catalog with warm-paper foundation; distinct wordmark.
- `apps/web/app/families/family-home.module.css`: local CSS Module variables `--family-*` scoped to root. No new global `:root` tokens.
- `/start` and `/workforce`: old AGE offerings and backend UI remain reachable. They are not automatically new family products.

## Cross-platform acceptance standards

- Flutter, Android, iOS, web all keep touch targets ≥44–48px, proper reduced-motion fallback, keyboard/voice accessibility as relevant, no decorative state pretending a real microphone/camera/agent is active.
- The application must own localization, timezone, billing display and product lifecycle; no prices or currencies leaked across apps.
- Shared data adapters require verified product identity, per-tenant authorization, user consent and auditable scope. DotSpeak's child-facing data cannot traverse to AGE Workforce or another product without verified guardian policy.
- Font files must be licensed and bundled by each application. Never distribute proprietary Berkeley Mono or other paid brand fonts by copying them.
- The platform may share reusable *motion state machines* and measured UX metrics, but not blindly blend ElevenLabs/GrokBot/Duolingo/Higgsfield effects.
- A new product is accepted only after it has its own `DESIGN.md`, `OFERTA.md` or equivalent product contract, distinct product ID and namespace, CI and delivery pipeline, and tenant isolation tests.
- Design changes in the AGESOMA repo never override source files in sibling repositories without their own PR and device validation.

## Rollout plan

1. One tested shared adapter with InstantSpeak, including service authentication, per-app metering and verified entitlement, without merging Firebase sessions into Better Auth.
2. After quality metrics, integrate InstantStudy and InstantBible individually.
3. Build Dots adapters only after guardian consent, child data minimization and retention review are enforced in the actual backend.
4. Shared account/login or subscription bundles are separate business and migration projects, **not enabled by the registry**.

This file is the platform design contract. More engineering detail:
[PLATFORM_INSTANT_DOTS.md](docs/PLATFORM_INSTANT_DOTS.md).
