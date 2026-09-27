set search_path to agesoma_p0, public;

-- P0 architecture hardening: tenant-safe watcher FK plus task-level usage metering.
-- Costs are stored in the worker budget currency (USD by default).

alter table persistent_workers
  add column if not exists budget_currency text not null default 'USD';

alter table persistent_workers drop constraint if exists persistent_workers_budget_currency_check;
alter table persistent_workers
  add constraint persistent_workers_budget_currency_check
  check (budget_currency ~ '^[A-Z]{3}$');

alter table watchers drop constraint if exists watchers_worker_tenant_fk;
alter table watchers
  add constraint watchers_worker_tenant_fk
  foreign key (tenant_id,worker_id)
  references persistent_workers(tenant_id,id)
  on delete set null (worker_id);

create table if not exists task_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  worker_id uuid,
  task_id uuid not null,
  period_start date not null default date_trunc('month', now())::date,
  status text not null default 'reserved',
  currency text not null default 'USD',
  reserved_cost_cents bigint not null default 0,
  actual_cost_cents bigint not null default 0,
  cost_source text not null default 'reservation',
  input_tokens bigint,
  output_tokens bigint,
  total_tokens bigint,
  browser_seconds numeric(14,3),
  api_calls integer,
  raw_usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (tenant_id,task_id),
  check (status in ('reserved','settled','released')),
  check (currency ~ '^[A-Z]{3}$'),
  check (reserved_cost_cents >= 0),
  check (actual_cost_cents >= 0),
  check (input_tokens is null or input_tokens >= 0),
  check (output_tokens is null or output_tokens >= 0),
  check (total_tokens is null or total_tokens >= 0),
  check (browser_seconds is null or browser_seconds >= 0),
  check (api_calls is null or api_calls >= 0)
);

alter table task_usage_ledger drop constraint if exists task_usage_ledger_task_tenant_fk;
alter table task_usage_ledger
  add constraint task_usage_ledger_task_tenant_fk
  foreign key (tenant_id,task_id)
  references tasks(tenant_id,id)
  on delete cascade;

alter table task_usage_ledger drop constraint if exists task_usage_ledger_worker_tenant_fk;
alter table task_usage_ledger
  add constraint task_usage_ledger_worker_tenant_fk
  foreign key (tenant_id,worker_id)
  references persistent_workers(tenant_id,id)
  on delete set null (worker_id);

create index if not exists task_usage_ledger_tenant_period_idx
  on task_usage_ledger (tenant_id,period_start,status,updated_at desc);
create index if not exists task_usage_ledger_worker_period_idx
  on task_usage_ledger (tenant_id,worker_id,period_start,status);

alter table task_usage_ledger enable row level security;
alter table task_usage_ledger force row level security;
drop policy if exists tenant_isolation on task_usage_ledger;
create policy tenant_isolation on task_usage_ledger for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on task_usage_ledger to authenticated;
