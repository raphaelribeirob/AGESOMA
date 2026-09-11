create table if not exists agesoma_p0.outcome_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  workflow_id uuid references agesoma_p0.workflows(id) on delete set null,
  task_id uuid references agesoma_p0.tasks(id) on delete set null,
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
  gross_margin_bps integer not null default 0,
  attribution_confidence numeric(5,4) not null default 0,
  evidence_source text not null,
  verified_at timestamptz not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.learning_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  workflow_id uuid references agesoma_p0.workflows(id) on delete set null,
  task_id uuid references agesoma_p0.tasks(id) on delete set null,
  lesson_type text not null,
  content jsonb not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.runtime_heartbeats (
  service text primary key,
  instance_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now()
);

create index if not exists outcome_events_tenant_created_idx on agesoma_p0.outcome_events (tenant_id, created_at desc);
