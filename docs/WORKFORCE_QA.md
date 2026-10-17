# AGESOMA Workforce — QA, acceptance & release gate

**Audit date:** 2026-10-16
**Change:** Four executive identities (CEO+COO, CFO, CMO+CRO, CTO+CPO) covering exactly seven corporate roles.
**Status:** Code review and source-level checks PASS; full runtime, CI and production acceptance NOT VERIFIED.

## Quality standards — no self-awarded 10/10

| Gate | Goal | Current evidence | Status |
| --- | --- | --- | --- |
| Executive ownership | Four identities; seven unique titles | `apps/web/app/workforce/workforce-profiles.ts` and core `executive-workforce.ts`; source contract audit | PASS source audit |
| Legacy capability routing | Every prior specialist capability owned by one executive identity; unknown fails closed | `executiveOwnerForCapability` returns null for unknown; 7 explicit mappings | PASS source audit |
| Security | No permission is conferred by role mapping | Read-only ownership function; Sentinel grants still needed | PASS design review, NOT PEN-TESTED |
| User-facing truth | No fictitious running computers or data | Local preview says no active sandbox; computer tab says not provisioned | PASS source audit |
| Visual accessibility | Small text contrast ≥ 4.5:1 | 11 sampled secondary UI text selectors; measured ≥5.79:1 for target light surfaces | PASS sampled source audit |
| Style completeness | All referenced CSS module classes defined | 55/55 referenced classes present | PASS source audit |
| Interaction | Keyboard focus, agent selection, expand/collapse, tabs, mobile | Component/event handlers and CSS present | PASS source review; E2E required |
| Reduced motion | Disable avatar animation when OS preference requests it | Media query present | PASS source audit |
| Automated tests | Governance and UI tests pass on Node24 in CI | Test files committed; workflow includes them | PENDING confirmed CI run |
| TypeScript and Next.js | `npm run typecheck`, `npm run build` succeed | Not executed on full repository | PENDING |
| Real Linux computers | Four distinct, authenticated, tenant-isolated sandbox sessions | Only OpenSandbox local pilot scripts committed | NOT IMPLEMENTED |
| True production operation | Tenants, rights, billing, telemetry, rollbacks and retention | No production staging evidence | BLOCKED |

**Audit results:** 28 out of 28 checks performed on actual GitHub source passed after two rounds of corrections. These checks are not equivalent to a complete Node test run, responsive browser inspection, actual computer sandbox provisioning or production testing.

## Source-level test coverage
1. `tests/workforce-roles.test.mjs`: four agents, 7 titles once, zero accidental fifth agent, all seven specialist capabilities mapped once, unknown fail-closed, role metadata complete.
2. `tests/workforce-ui.test.mjs`: missing CSS classes, empty-state honesty, aria pressed roles, selected buttons, modal-free navigation, WCAG AA sampled small text, reduced motion, mobile breakpoint.
3. `tests/opensandbox-install.test.mjs`: shell/Python syntax, loopback Docker config, secrets, TOML and installer safety.
4. `scripts/opensandbox/smoke.py`: real sandbox create/command/destroy **only when run against an authorized Linux host with Docker**.

All of the tests above are committed. **Their success in GitHub Actions has not been verified in this audit**.

## Required full validation
Run on Node24 with dependencies:
```bash
node --test tests/workforce-roles.test.mjs tests/workforce-ui.test.mjs
npm run typecheck
npm run build --workspace @agesoma/web
npm test
```

Validate desktop at 1440x900, tablet 1024x768, narrow mobile 390x844 and 320x640; test selection, keyboard tab/Enter/Space, screen reader labels, horizontal roster scrolling, high zoom (200%), long organization names, loading/empty/error states and reduced-motion emulation. Audit contrast on rendered backgrounds and visual regressions; source-level contrast samples are necessary but not sufficient.

Validate on the actual Linux host: OpenSandbox 1.1.1 successful startup, authentication enforced, create/execution/delete sandbox, isolated two-tenant and two-worker sessions, no cross-tenant access, resource limits, TTL, failure cleanup, credentials never exposed, allowlist/egress deny-by-default, and revocation. **The Docker pilot must not be offered to external untrusted tenants.** Separate broker and authenticated stream proxy are required before desktop takeover is enabled.

## Unresolved architectural mismatch — production-blocking
The existing `ensureAgentPackage` in `apps/web/app/api/agesoma/route.ts` and `ensurePersistentWorkerByTemplate` in `apps/web/lib/persistent-worker.ts` still create legacy specialist identities. This PR adds a **four-executive ownership contract** without attempting an unsafe migration of active tasks, memories, authorizations or production work cells. A future migration must:

1. Inventory existing `digital_agents`, `persistent_workers`, `agent_task_assignments` and task references by tenant (including active/approved/blocked work).
2. Create exactly four stable executive identities for each tenant with independent namespaces and tenancy constraints, preserving all legacy source IDs in migration audit.
3. Backfill task ownership and capability routing with explicit migration rules, while keeping existing jobs valid until drained; never recycle a credential namespace.
4. Update routine dispatch, browser profiles, session namespace and every reference path to use the four executive identities. Preserve independent Sentinel approvals.
5. Verify on a staging PostgreSQL database with RLS, rollback and historical memory compatibility. Then separately deploy.

**Do not claim four deployed workers until this migration passes.**

## Rating framework
Role architecture target: **10/10** only after governance tests, no duplicates, clear permissions and an authenticated preview demonstrate correct behavior. Full product target: **10/10** only after every gate above passes with independent evidence. Current score is provisional; 28/28 source checks cannot prove production quality.

## Useful evidence
- RFC: `docs/WORKFORCE_OS_BLUEPRINT.md`
- OpenSandbox pilot: `docs/OPENSANDBOX_INSTALL.md`
- PR: https://github.com/raphaelribeirob/AGESOMA/pull/44
- OpenSandbox runtime config: https://github.com/opensandbox-group/OpenSandbox/blob/main/docs/getting-started/configuration.md
- OpenSandbox Docker runtime does not support `secureAccess: true`: https://github.com/opensandbox-group/OpenSandbox/blob/main/docs/guides/secure-access.md
