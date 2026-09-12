-- InstantWork Muse-alignment hardening.
set search_path to agesoma_p0, public;

create table if not exists tenant_memberships (
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_id text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (tenant_id, actor_id)
);

alter table approval_grants
  add column if not exists scope_hash text,
  add column if not exists approved_by text,
  add column if not exists nonce uuid,
  add column if not exists consumed_at timestamptz;

create unique index if not exists approval_grants_nonce_idx on approval_grants (nonce) where nonce is not null;
create index if not exists approval_grants_scope_idx on approval_grants (tenant_id, task_id, action_class, scope_hash, expires_at desc);

-- Extend the existing Work Cell registry instead of replacing it.
alter table work_cells
  add column if not exists runtime_namespace text,
  add column if not exists browser_profile_ref text,
  add column if not exists file_namespace text,
  add column if not exists memory_namespace text,
  add column if not exists credential_namespace text,
  add column if not exists isolation_status text not null default 'unprovisioned';

update work_cells
set runtime_namespace = coalesce(runtime_namespace, namespace),
    file_namespace = coalesce(file_namespace, namespace || ':files'),
    memory_namespace = coalesce(memory_namespace, namespace || ':memory'),
    credential_namespace = coalesce(credential_namespace, namespace || ':credentials'),
    isolation_status = case
      when status = 'ready' then 'ready'
      when status in ('degraded','disabled') then 'blocked'
      else 'provisioning'
    end;

alter table work_cells
  alter column runtime_namespace set not null,
  alter column file_namespace set not null,
  alter column memory_namespace set not null,
  alter column credential_namespace set not null;

create unique index if not exists work_cells_runtime_namespace_idx on work_cells (runtime_namespace);
create unique index if not exists work_cells_browser_profile_idx on work_cells (browser_profile_ref) where browser_profile_ref is not null;
create unique index if not exists work_cells_file_namespace_idx on work_cells (file_namespace);
create unique index if not exists work_cells_memory_namespace_idx on work_cells (memory_namespace);
create unique index if not exists work_cells_credential_namespace_idx on work_cells (credential_namespace);

create table if not exists credential_handles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  handle text not null,
  scopes jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, handle),
  check (status in ('active','revoked','expired'))
);

create table if not exists egress_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  destination text not null,
  operation text,
  action_class text not null,
  decision text not null,
  reason text not null,
  capability_hash text,
  created_at timestamptz not null default now(),
  check (decision in ('ALLOW','REVIEW','DENY'))
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  watcher_id uuid references watchers(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  source_task_id uuid references tasks(id) on delete set null,
  title text not null,
  summary text not null,
  proposed_action jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','accepted','dismissed','completed'))
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  kind text not null,
  title text not null,
  content jsonb not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists autonomy_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  action_class text not null,
  destination text,
  operation text,
  resource_pattern text,
  decision text not null,
  max_amount_cents bigint,
  approved_by text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (decision in ('ALLOW','DENY'))
);

create table if not exists tool_recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text not null,
  definition jsonb not null,
  status text not null default 'draft',
  created_from_task_id uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  check (status in ('draft','approved','disabled'))
);

create index if not exists opportunities_tenant_status_idx on opportunities (tenant_id, status, created_at desc);
create index if not exists artifacts_tenant_task_idx on artifacts (tenant_id, task_id, created_at desc);
create index if not exists autonomy_rules_lookup_idx on autonomy_rules (tenant_id, action_class, destination, operation);

-- App-facing connections run as role authenticated and must carry app.tenant_id.
-- The worker keeps its service/database role for cross-tenant dispatch and never receives
-- customer credentials directly.
do $$
declare
  t text;
begin
  foreach t in array array[
    'goals','workflows','tasks','approval_grants','policy_decisions','outcome_events',
    'learning_records','watchers','work_cells','tenant_memberships','credential_handles',
    'egress_decisions','opportunities','artifacts','autonomy_rules','tool_recipes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I for all to authenticated using (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) with check (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;
