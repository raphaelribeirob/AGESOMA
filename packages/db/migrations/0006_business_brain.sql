set search_path to agesoma_p0, public;

create table if not exists business_state_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_task_id uuid references tasks(id) on delete set null,
  domain text not null,
  health text not null,
  health_score integer not null,
  confidence numeric(5,4) not null,
  primary_constraint text,
  signal_count integer not null default 0,
  worsening_signals integer not null default 0,
  improving_signals integer not null default 0,
  signals jsonb not null default '[]'::jsonb,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (domain in ('sales','service','operations','finance','marketing','general')),
  check (health in ('healthy','watch','strained','critical','unknown')),
  check (health_score between 0 and 100),
  check (confidence between 0 and 1)
);

create table if not exists intervention_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_task_id uuid references tasks(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  state_snapshot_id uuid references business_state_snapshots(id) on delete set null,
  domain text not null,
  title text not null,
  action_type text not null,
  resource text,
  priority_score integer not null,
  confidence numeric(5,4) not null,
  requires_approval boolean not null default false,
  rationale jsonb not null default '[]'::jsonb,
  proposed_payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (domain in ('sales','service','operations','finance','marketing','general')),
  check (priority_score between 0 and 100),
  check (confidence between 0 and 1),
  check (status in ('proposed','approved','queued','executed','dismissed'))
);

create index if not exists business_state_latest_idx
  on business_state_snapshots (tenant_id, domain, observed_at desc);
create index if not exists intervention_decisions_queue_idx
  on intervention_decisions (tenant_id, status, priority_score desc, created_at desc);

-- App-facing reads remain tenant scoped. The worker/service role keeps its
-- cross-tenant database role and does not SET ROLE authenticated.
grant select, insert, update, delete on business_state_snapshots, intervention_decisions to authenticated;

alter table business_state_snapshots enable row level security;
alter table business_state_snapshots force row level security;
drop policy if exists tenant_isolation on business_state_snapshots;
create policy tenant_isolation on business_state_snapshots for all to authenticated
using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table intervention_decisions enable row level security;
alter table intervention_decisions force row level security;
drop policy if exists tenant_isolation on intervention_decisions;
create policy tenant_isolation on intervention_decisions for all to authenticated
using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
