set search_path to agesoma_p0, public;

-- Tenant-safe usage accounting. Actual charge settlement remains a separate
-- server-side operation; this migration never charges a customer or grants
-- permission to modify budgets from the client.

alter table persistent_workers
  add column if not exists budget_currency text not null default 'USD';

alter table persistent_workers
  drop constraint if exists persistent_workers_budget_currency_check;
alter table persistent_workers
  add constraint persistent_workers_budget_currency_check
  check (budget_currency ~ '^[A-Z]{3}$');

-- Keep both tenant and worker bound in a composite key. Deleting a worker
-- nulls the reference without deleting the watcher itself.
alter table watchers drop constraint if exists watchers_worker_tenant_fk;
alter table watchers add constraint watchers_worker_tenant_fk
  foreign key (tenant_id,worker_id)
  references persistent_workers(tenant_id,id)
  on delete set null (worker_id);

create table if not exists tenant_usage_budgets (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  monthly_budget_cents bigint not null,
  currency text not null default 'USD',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_usage_budgets_nonnegative_check check (monthly_budget_cents >= 0),
  constraint tenant_usage_budgets_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint tenant_usage_budgets_status_check check (status in ('active','paused'))
);

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
  constraint task_usage_ledger_status_check check (status in ('reserved','settled','released')),
  constraint task_usage_ledger_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint task_usage_ledger_reserved_nonnegative_check check (reserved_cost_cents >= 0),
  constraint task_usage_ledger_actual_nonnegative_check check (actual_cost_cents >= 0),
  constraint task_usage_ledger_input_nonnegative_check check (input_tokens is null or input_tokens >= 0),
  constraint task_usage_ledger_output_nonnegative_check check (output_tokens is null or output_tokens >= 0),
  constraint task_usage_ledger_total_nonnegative_check check (total_tokens is null or total_tokens >= 0),
  constraint task_usage_ledger_browser_nonnegative_check check (browser_seconds is null or browser_seconds >= 0),
  constraint task_usage_ledger_api_nonnegative_check check (api_calls is null or api_calls >= 0)
);

alter table task_usage_ledger drop constraint if exists task_usage_ledger_task_tenant_fk;
alter table task_usage_ledger add constraint task_usage_ledger_task_tenant_fk
  foreign key (tenant_id,task_id)
  references tasks(tenant_id,id)
  on delete cascade;

alter table task_usage_ledger drop constraint if exists task_usage_ledger_worker_tenant_fk;
alter table task_usage_ledger add constraint task_usage_ledger_worker_tenant_fk
  foreign key (tenant_id,worker_id)
  references persistent_workers(tenant_id,id)
  on delete set null (worker_id);

create index if not exists task_usage_ledger_tenant_period_idx
  on task_usage_ledger (tenant_id,period_start,status,updated_at desc);
create index if not exists task_usage_ledger_worker_period_idx
  on task_usage_ledger (tenant_id,worker_id,period_start,status);

-- Owners manage budget policy through a privileged server role only.
alter table tenant_usage_budgets enable row level security;
alter table tenant_usage_budgets force row level security;
drop policy if exists tenant_isolation on tenant_usage_budgets;
create policy tenant_isolation on tenant_usage_budgets for select to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
grant select on tenant_usage_budgets to authenticated;

alter table task_usage_ledger enable row level security;
alter table task_usage_ledger force row level security;
drop policy if exists tenant_isolation on task_usage_ledger;
create policy tenant_isolation on task_usage_ledger for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
grant select,insert,update,delete on task_usage_ledger to authenticated;
