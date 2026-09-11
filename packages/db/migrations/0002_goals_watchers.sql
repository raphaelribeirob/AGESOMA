set search_path to agesoma_p0, public;

alter table if exists goals add column if not exists objective_key text;
alter table if exists goals add column if not exists target_value_cents bigint;
alter table if exists goals add column if not exists horizon_days int;
alter table if exists goals add column if not exists config jsonb not null default '{}'::jsonb;
alter table if exists goals add column if not exists updated_at timestamptz not null default now();

create table if not exists watchers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  kind text not null,
  status text not null default 'active',
  cadence text,
  config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  next_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind in ('event','schedule','watch')),
  check (status in ('active','paused','completed','failed'))
);

create table if not exists work_cells (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  namespace text not null unique,
  status text not null default 'provisioning',
  config jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('provisioning','ready','degraded','disabled'))
);

create index if not exists watchers_due_idx on watchers (status, next_check_at);
create index if not exists watchers_tenant_goal_idx on watchers (tenant_id, goal_id);
