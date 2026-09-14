set search_path to agesoma_p0, public;

create table if not exists auth_organization_tenants (
  auth_organization_id text primary key,
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists auth_organization_tenants_tenant_idx
  on auth_organization_tenants (tenant_id);

-- This table is resolved only by the trusted AGESOMA web server before tenant RLS is entered.
-- It is intentionally not granted to the authenticated database role.
