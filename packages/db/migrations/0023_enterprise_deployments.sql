set search_path to agesoma_p0, public;

-- Reusable enterprise service deployment plans. They are deliberately DRAFT-ONLY.
-- Intake values and source references are NOT verified documents or signed consent.
create table if not exists enterprise_deployment_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_by text not null check (length(trim(created_by)) > 0),
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  template_version text not null check (template_version = 'freight-recovery.v1'),
  intake jsonb not null check (jsonb_typeof(intake) = 'object'),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  status text not null default 'draft' check (status = 'draft'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);
create index if not exists enterprise_deployment_plans_tenant_created_idx
  on enterprise_deployment_plans(tenant_id,created_at desc);
alter table enterprise_deployment_plans enable row level security;
alter table enterprise_deployment_plans force row level security;
drop policy if exists tenant_isolation on enterprise_deployment_plans;
create policy tenant_isolation on enterprise_deployment_plans for select to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
drop policy if exists tenant_insert_only on enterprise_deployment_plans;
create policy tenant_insert_only on enterprise_deployment_plans for insert to authenticated
  with check (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select, insert on enterprise_deployment_plans to authenticated;
-- No UPDATE or DELETE grant: immutable business drafts; replay via a new key.
-- No public route for execution, proof attestation, credentials, or claims.
