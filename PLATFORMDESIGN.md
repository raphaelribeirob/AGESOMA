# PLATFORMDESIGN.md — Brand-independent foundation for Instant and Dots

> **Version 1.1 · 17 October 2026 · INSTDESIGN v3.5.0 installed as Instant family reference.**
 > **Hierarchy:** [`INSTDESIGN.MD`](INSTDESIGN.MD) v3.5.0 governs shared Instant conventions; each application's own `DESIGN.md` controls approved logos, launches, native exceptions and product-specific contracts. Dots and legacy AGE keep separate design governance.

## Identity hierarchy

```text
PLATFORM (this repository): auth adapters, model gateway, usage, policies, tools
 ├─ INSTANT FAMILY (first) → INSTDESIGN.MD v3.5.0 [canonical shared rules]
 │   ├─ InstantSpeak     → InstantSpeak/DESIGN.md [white, voice-first]
 │   ├─ InstantStudy     → InstantStudy/DESIGN.md [editorial learning]
 │   └─ InstantBible     → InstantBible/DESIGN.md [quiet, text/ritual-first]
 └─ DOTS FAMILY (second)
     └─ DotSpeak         → DotSpeak/DESIGN.md [warm paper, companion-first]
LEGACY AGESOMA CONSOLE → AGEDESIGN.md v1.2 [dark precision; independent]
```

## Portable primitives (no common visual skin)

Reusable `ProductShell`, `Action`, `Field`, `Typography`, `Status`, `VoiceSession` and `SafeApproval` should accept **product-owned** semantic tokens instead of importing AGE global CSS. Reuse only behavior, accessibility contracts and instrumented state transitions. Tokens should be namespaced by product and family; never set the entire monorepo's `:root` based on one family.

**Instant**: [`INSTDESIGN.MD`](INSTDESIGN.MD) v3.5.0 is now committed byte-for-byte (SHA-256 `ed77f98596ffc279812dc44a9643570c7a732451b253074b06364e8277f60cf8`). Its light neutral reference is canvas `#FCFBF8`, surface `#FFFFFF`, subtle `#F2EFEA`, text `#171717`, focus `#2459BA`; product accents are Speak `#2459BA`, Study `#3A32C8`, Bible `#1F6B52`, with paired dark-mode variants. Approved InstantSpeak Flutter `DESIGN.md` uses a white launch canvas and an exceptional static/motion wordmark; product-owned source prevails for these exceptions. Motion contract: ElevenLabs-inspired voice responses require real audio states; learning feedback is Duolingo-inspired but original; Tesla-inspired choreography is a transversal controller, not a competing animation layer. The 10 orbs are specs, **not live audio assets or working WebGL**. Do not invent an opening or voice orb for the platform storefront; the 2650 ms opening belongs only to InstantSpeak.

**Dots**: the DotSpeak implementation's canonical palette starts with #FBF7F2 (background), #FFFFFF (surface), #292724 (ink), #E6DDD5 (outline) and blue #0061EF (Leonardo interaction). Dot identities, guardian controls and effects belong inside Dots product code; never clone the AGE executive badges or a fake orb. Other future Dots products can define other visual semantics.

**AGESOMA**: keep current Linear-inspired Midnight CSS scoped to `.ageTheme` for the authenticated/legacy business console. It is **not** the new family brand and must not override Instant or Dots colors/typography.

## Family portal implementation

- `/instant`: Instant-first catalog using `INSTDESIGN.MD` §2.2/§2.4 semantic neutral colors and per-product accents; **not** a live app launcher, speech-orb or shared-login dashboard.
- `/dots`: Dots phase-two catalog with warm-paper foundation; distinct wordmark.
- `apps/web/app/families/family-home.module.css`: local CSS Module variables `--instant-*` and `--family-*` scoped to `.instant`; Dots stays `.dots`. No new global `:root` tokens. Never compile the 498 KB Markdown into the app bundle.
- `/start` and `/workforce`: old AGE offerings and backend UI remain reachable. They are not automatically new family products.

## Cross-platform acceptance standards

- Flutter, Android, iOS, web must follow `INSTDESIGN.MD` §13A Global-First/RTL and §13B Universal Motion plus platform-native input/semantics; keep touch targets ≥44–48px, proper reduced-motion fallback, keyboard/voice accessibility as relevant, no decorative state pretending a real microphone/camera/agent is active. The CI gate here does not replace native Flutter/Maestro/WebKit/screen reader QA.
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

**Version/source integrity:** root `INSTDESIGN.MD` is the exact source supplied by the user (Git blob SHA-1 `bdc0637745bb9227e7d07c7a4437f28cddbbdf85`, 498361 bytes). Update through an explicit file revision and contract test; never paraphrase it into a new master.

This file is the platform design contract. More engineering detail:
[PLATFORM_INSTANT_DOTS.md](docs/PLATFORM_INSTANT_DOTS.md).
