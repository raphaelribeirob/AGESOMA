# AGESOMA — Clean Vercel Project, New Account

## Intent
Provision **a brand-new AGESOMA web project** under the Vercel account controlled by `raphaelrbarroso@gmail.com`.
Keep GitHub repository `raphaelribeirob/AGESOMA` and all existing commits. Do not reuse or move the unrelated `agesoma-mcp-smoke` project on the old Vercel account.

**IMPORTANT:** This branch only stages configuration. It neither authenticates the destination account nor creates any project or deployment. No production publication is authorized.

## Verified repo facts
- npm workspaces at repository root: `apps/*`, `packages/*`, `services/*`.
- Web workspace: `apps/web`, Next.js and Better Auth.
- Node engine: **24.x**.
- Existing root `vercel.json` is for root-based deployment; the **new** Vercel project should instead set its Root Directory to `apps/web` and use the local `apps/web/vercel.json` with native Next.js build detection.
- Graphiti/Neo4j, background workers, pg-boss, HERMES and Work Cells run **outside** Vercel web functions.

## Destination connection prerequisites (user-controlled)
1. In ChatGPT Settings > Plugins, connect the Vercel account corresponding to the intended destination email.
2. Confirm `get_auth_user` resolves to the **target** identity (an email is not a Vercel team ID). Never guess a team ID from the email.
3. Authorize the GitHub repo under the target Vercel user/team. Leave old projects untouched.

## Create the new project
- Account/team: verify target identity explicitly, not the previously connected R3 team.
- Name: `agesoma` (subject to name availability).
- Repository: `raphaelribeirob/AGESOMA`.
- Framework: Next.js.
- **Root Directory:** `apps/web`.
- **Include source files outside the Root Directory:** ON (required for `packages/core` and `packages/db`).
- Install/Build/Output: **Framework defaults**; do not copy the root `vercel.json` custom `.next` workaround into the app project.
- Node.js: **24.x**.
- Production branch: `main` only after the operations-onboarding branch is reviewed and merged.
- Enable deployment protection and avoid public/custom domain assignment until preview, authentication and data security checks pass.

## Configure secrets and environments
Use `apps/web/.env.vercel.example` as **names-only** inventory.

Required for functional authenticated web:
- `DATABASE_URL`: new isolated Neon PostgreSQL database/branch connection URL. Configure SSL, do not use a localhost example.
- `AGESOMA_DB_SCHEMA=agesoma_p0`: schema created by AGESOMA migrations.
- `BETTER_AUTH_SECRET`: fresh cryptographically random secret (at least 32 characters); do not reuse another app's key.
- `BETTER_AUTH_URL`: final HTTPS origin of the specific Vercel environment.

Only when enabled:
- `AGESOMA_INTERNAL_API_TOKEN`, `OUTCOME_VERIFIER_TOKEN`: unique service tokens, not exposed to clients.
- `AGESOMA_BRAIN_URL` and `AGESOMA_BRAIN_INTERNAL_API_TOKEN`: only after private authenticated HTTPS Graphiti service exists (do not point at localhost or public Neo4j).
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`: optional analytics; never place secrets in NEXT_PUBLIC_ variables.

**Separate preview/prod database credentials, cookie URLs, authentication secrets and integrations.** The app currently has several runtime/background integrations; web-only Vercel hosting does not start them.

## Database and security release gate
1. Create a dedicated Neon project/branch after connection. Prefer Preview/Production isolation.
2. Run schema migrations in order using a controlled privileged process. Verify roles, tenant RLS and Better Auth tables.
3. Validate the app using a test organization, not customer financial data.
4. Validate `GET /api/health` (liveness only, NOT full readiness), sign-in, organization creation, tenant isolation, unauthorized API rejections and database access.
5. Check no Graphiti/Neo4j service, worker queue or financial execution is accidentally implied by the web deployment.
6. Run static checks (`node scripts/vercel-preflight.mjs`), `npm run typecheck`, `npm test`; optionally `node scripts/vercel-preflight.mjs --env` in a protected environment to check names/formats (never log values).
7. For a production release, review merge status of Operations, Business Understanding, ProofTree and Universal Onboarding; these features currently reside in branches, not `main`. Do not equate a successful web build with service readiness.
8. Keep production protected until reviewed code, DB migrations and E2E authorization tests are green.

## Architecture
- **Vercel**: authenticated Next.js frontend and control APIs only.
- **Neon**: tenant-isolated PostgreSQL, embeddings and validated context (after migration).
- **Graphiti + Neo4j**: separately deployed Company Brain (optional for initial web smoke tests).
- **Workers / pg-boss**: separate durable background runtime.
- **HERMES + Work Cells**: separate isolated execution substrate.
- **Sentinel / ProofTree**: authorization vs verification, neither assumed functional until fully integrated.

## Future steps when destination is available
1. Revalidate Vercel identity/team and the GitHub repo connection.
2. Create project under target scope from `apps/web` (do NOT deploy into old account).
3. Add verified environment configuration without exposing secrets in ChatGPT/GitHub.
4. Create a **protected preview** and inspect deployment and function logs.
5. Enable production only after business onboarding and security acceptance gates.

## Status
- [x] Repository structure inspected.
- [x] New web app config staged separately.
- [x] Secret names inventory and static preflight script staged.
- [ ] Target Vercel account connected and verified.
- [ ] New AGESOMA Vercel project created.
- [ ] Dedicated Neon environment provisioned and migrated.
- [ ] Preview deployment verified.
- [ ] Live production rollout authorized.
