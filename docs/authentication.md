# AGESOMA authentication and tenant resolution

AGESOMA uses Better Auth as the replaceable identity/session layer and keeps business authorization inside AGESOMA.

## Boundary

```text
browser cookie
   ↓
Better Auth session
   ↓
Better Auth organization membership
   ↓
auth_organization_tenants
   ↓
AGESOMA tenant UUID
   ↓
tenant_memberships + PostgreSQL RLS
```

The browser no longer selects the owner workspace with `AGESOMA_DEFAULT_TENANT_ID`, a query parameter or `x-agesoma-actor-id`.

Better Auth proves user/session and organization membership. AGESOMA maps that organization to its canonical tenant and then enters the existing RLS boundary.

## Current P0 behavior

- email/password sessions are enabled;
- one Better Auth organization is allowed per user in the current P0 product;
- the first authenticated visit creates the user's organization if none exists;
- organization → tenant provisioning is serialized with a PostgreSQL advisory transaction lock;
- `tenant_memberships` receives the authenticated Better Auth user ID as `actor_id`;
- Graphiti, HERMES, Sentinel and outcome verification are unchanged.

## Database setup

Better Auth owns its identity tables in PostgreSQL `public`.

Run the Better Auth migration with the same `DATABASE_URL` used by AGESOMA:

```bash
npm run auth:migrate --workspace @agesoma/web
```

AGESOMA's own migration `packages/db/migrations/0008_auth_tenant_binding.sql` creates the organization-to-tenant binding table in `agesoma_p0`.

## Required environment

```text
BETTER_AUTH_SECRET=<high entropy secret, at least 32 characters>
BETTER_AUTH_URL=https://your-agesoma-host
DATABASE_URL=postgresql://...
```

`BETTER_AUTH_SECRET` must be unique from AGESOMA internal service tokens.

## Security invariants

1. Better Auth is identity infrastructure, not AGESOMA business authority.
2. An organization ID is not accepted from an unauthenticated browser as a tenant selector.
3. An authenticated user must be a member of the Better Auth organization before it can resolve to an AGESOMA tenant.
4. The organization-to-tenant binding table is not granted to the database `authenticated` role.
5. Existing service-to-service endpoints keep their internal bearer-token boundary.
6. `AGESOMA_DEFAULT_TENANT_ID` remains legacy/development-only and is not used by the authenticated home page.
