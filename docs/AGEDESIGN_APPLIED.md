# AGE Design 1.1 — implementation map and validation

Date: 2026-10-16
Source of truth: [`AGEDESIGN.md`](../AGEDESIGN.md), originally user-owned library file AGEDESIGN.md v1.1.
Feature PR: https://github.com/raphaelribeirob/AGESOMA/pull/44
Stage: CODE REVIEW / DESIGN INTEGRATION — no production deployment or device homologation.

## Scope
- `/start` is the actual public showroom; `/` is an authenticated application home in the current repo. Preserve real purchase/demo semantics, rather than silently changing authorization/routing to match example URLs in the design spec.
- `/workforce` has four visible agents — CEO+COO, CFO, CMO+CRO, CTO+CPO — with operational status from a truthful empty preview. There are no fabricated live computers.
- Authenticated `/` has a compatible AGE surface including monochrome brand identity, navigation to `/workforce`, neutral messages, genuine approval cards and status-gated voice button. This is a presentation-layer migration; legacy business database/runtime behavior is unchanged.
- `agedesign` v1.1 also documents future WebGL/ElevenLabs-inspired voice orb. We adopted AGE transition timing, real-state-only motion and reduced-motion policies. We **did not install ElevenLabs UI/SDK or render an artificial voice orb** because there is no real audio-level stream suitable for that visualization. SpeechRecognition listening state now switches to active on the browser's `onstart` callback only. There are no false audio waveforms.

## Traceability

| Design requirement | Implementation |
| --- | --- |
| Canonical AGE design source | `AGEDESIGN.md` and `AGENTS.md` |
| White/graphite/AGE blue `#385CE5` | `apps/web/app/age-tokens.css` |
| Manrope display / Inter UI | self-hosted Fontsource variable font packages v5.3.0 in `apps/web/package.json`; imported by `apps/web/app/layout.tsx`; OFL-1.1 |
| AGE wordmark prototype | `apps/web/public/agesoma-wordmark-age.svg` — visual reference **not final homologated logo** |
| Shape (4px controls, 8px cards), space (4px) and 48px touch controls | shared AGE tokens, /start and /workforce styles |
| Neutral role identities (no Dots eyes/gradient) | `apps/web/app/workforce/workforce-preview.tsx`, `workforce-preview.module.css`, and `workforce-profiles.ts` |
| Product-first marketing hero and live demo | `apps/web/app/start/page.tsx`, `start-age.module.css`, `support-demo.tsx`, `support-demo-age.module.css` |
| AGE treatment of authenticated conversation | `apps/web/app/agesoma-client.tsx` + `age-product-bridge.css` |
| AGE/ComputerViewport | existing empty computer panel with authentic “não provisionado”, not a fake live VNC |
| AGE/ActivityIndicator and timeline | existing truthful zero-work / no-data states; full proof timeline depends on backend |
| AGE/ApprovalPanel | retained connected auth decisions, visually restyled through bridge |
| AGE Motion | CSS state transitions tied to actual interaction; explicit reduced-motion fallback; no fabricated voice activity |
| Accessibility, mobile and reduced motion | CSS media queries + visible focus + >=48px primary/tabs; device evaluation remains |
| Regression suites | `tests/agedesign-acceptance.test.mjs`, `tests/workforce-ui.test.mjs`, `tests/workforce-roles.test.mjs`; workflow `opensandbox-pilot.yml` |

## Verification and gates
1. Verified source directly through GitHub connector: matching CSS module classes in /start (19), demo (9), workforce (56); exact AGE token values; removed old colored mascot render; proper live demo endpoint; visible no-computer state.
2. Independently recalculated **11/11 sampled text color contrast combinations** against `#EEEEEE` using WCAG sRGB formula: minimum approximately **4.74:1** for warning text, others >=5.6:1. This is **source contrast**, not a raster screenshot audit and does not prove complete WCAG AA.
3. Automation test suites and CI entries are committed. The connected GitHub check query returned **no workflow runs** for the new commits; Node tests, TypeScript and Next build are **not confirmed**.
4. NOT done: visual screenshot review at 320/390/768/1440, Apple/Android accessibility, cross-browser testing, voice volume/Three.js/ElevenLabs runtime, site performance, release E2E and real OpenSandbox computers.
5. For a complete build on Node 24: `npm install`, `node --test tests/workforce-roles.test.mjs tests/workforce-ui.test.mjs tests/agedesign-acceptance.test.mjs`, `npm run typecheck`, `npm test`, `npm run build --workspace @agesoma/web`. Inspect browser output independently.

## Open issues
- The original AGE wordmark SVG is explicitly provisional. Needs manual optical refinement and product brand approval before freezing.
- Legacy root CSS is bridged rather than removed. Consolidate old visual-system files after full routes QA; do not delete unrelated production features.
- Full AGE/VoiceOrb and audio-driven ElevenLabs UI integration depend on user-authorized voice session and real volume data; motion fallback should always be static when idle.
- Four executive identities in the front-end do not yet mean four persistent backend workers or four live Linux computers. Separate tenant-safe migration and computer host tests still required.

**Release truth:** Design direction integrated in code; production UX quality cannot be scored 10/10 without successful CI, screenshots and device evidence.
