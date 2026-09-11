create extension if not exists vector;
create schema if not exists agesoma_p0;

create table if not exists agesoma_p0.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  language text not null default 'pt-BR',
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  key text not null,
  version integer not null default 1,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  unique (tenant_id, key, version)
);

create table if not exists agesoma_p0.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  workflow_id uuid references agesoma_p0.workflows(id) on delete set null,
  status text not null default 'queued',
  action_type text not null,
  risk_class text not null default 'R1',
  reversible boolean not null default false,
  external boolean not null default true,
  expected_value_cents bigint not null default 0,
  expected_cost_cents bigint not null default 0,
  expected_loss_cents bigint not null default 0,
  confidence numeric(5,4) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  dispatched_at timestamptz,
  execution_started_at timestamptz,
  execution_finished_at timestamptz,
  execution_result jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (risk_class in ('R0','R1','R2','R3','R4')),
  check (status in ('queued','awaiting_approval','running','completed','failed','denied'))
);

create index if not exists tasks_tenant_status_idx on agesoma_p0.tasks (tenant_id, status, dispatched_at);
