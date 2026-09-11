create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  language text default 'pt-BR',
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null,
  version int not null default 1,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  unique (tenant_id, key, version)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  status text not null default 'queued',
  action_type text,
  risk_class text not null default 'R1',
  reversible boolean not null default false,
  external boolean not null default true,
  expected_value_cents bigint not null default 0,
  expected_cost_cents bigint not null default 0,
  expected_loss_cents bigint not null default 0,
  confidence numeric(5,4) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  execution_started_at timestamptz,
  execution_finished_at timestamptz,
  execution_result jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('queued','awaiting_approval','running','completed','failed','denied'))
);

create table if not exists approval_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  action_class text not null,
  scope jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists policy_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  decision text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists outcome_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  outcome_type text not null,
  outcome_value_cents bigint not null default 0,
  attributed_revenue_cents bigint not null default 0,
  model_cost_cents bigint not null default 0,
  api_cost_cents bigint not null default 0,
  messaging_cost_cents bigint not null default 0,
  browser_cost_cents bigint not null default 0,
  human_cost_cents bigint not null default 0,
  total_cost_cents bigint not null default 0,
  net_value_cents bigint not null default 0,
  gross_margin_bps int not null default 0,
  attribution_confidence numeric(5,4) not null default 0,
  evidence_source text not null,
  verified_at timestamptz not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists learning_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  lesson_type text not null,
  content jsonb not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists outcome_events_tenant_created_idx on outcome_events (tenant_id, created_at desc);
create index if not exists tasks_tenant_status_idx on tasks (tenant_id, status);
create index if not exists approval_grants_task_idx on approval_grants (task_id, expires_at desc);
