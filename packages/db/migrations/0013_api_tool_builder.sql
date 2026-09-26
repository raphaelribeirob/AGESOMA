set search_path to agesoma_p0, public;

-- Dynamic API tools are registered as recipes. Only read-only, no-auth recipes
-- may become validated automatically. User approval is still required for reuse.

alter table tool_recipes
  add column if not exists tool_kind text not null default 'generic',
  add column if not exists source_url text,
  add column if not exists spec_url text,
  add column if not exists base_url text,
  add column if not exists risk_class text not null default 'R1',
  add column if not exists auth_mode text not null default 'unknown',
  add column if not exists validation jsonb not null default '{}'::jsonb,
  add column if not exists permissions jsonb not null default '{}'::jsonb,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists last_tested_at timestamptz;

alter table tool_recipes drop constraint if exists tool_recipes_status_check;
alter table tool_recipes
  add constraint tool_recipes_status_check
  check (status in ('draft','validated','approved','disabled'));

alter table tool_recipes drop constraint if exists tool_recipes_risk_class_check;
alter table tool_recipes
  add constraint tool_recipes_risk_class_check
  check (risk_class in ('R0','R1','R2','R3'));

alter table tool_recipes drop constraint if exists tool_recipes_auth_mode_check;
alter table tool_recipes
  add constraint tool_recipes_auth_mode_check
  check (auth_mode in ('none','api_key','oauth','unknown'));

create table if not exists tool_recipe_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  recipe_id uuid not null references tool_recipes(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  operation_id text not null,
  request_arguments jsonb not null default '{}'::jsonb,
  response_meta jsonb not null default '{}'::jsonb,
  status text not null,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (status in ('running','completed','failed','blocked'))
);

create index if not exists tool_recipes_tenant_status_idx
  on tool_recipes (tenant_id,status,updated_at desc);
create index if not exists tool_recipe_runs_tenant_created_idx
  on tool_recipe_runs (tenant_id,created_at desc);

alter table tool_recipes enable row level security;
alter table tool_recipes force row level security;
drop policy if exists tenant_isolation on tool_recipes;
create policy tenant_isolation on tool_recipes for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table tool_recipe_runs enable row level security;
alter table tool_recipe_runs force row level security;
drop policy if exists tenant_isolation on tool_recipe_runs;
create policy tenant_isolation on tool_recipe_runs for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on tool_recipes,tool_recipe_runs to authenticated;
