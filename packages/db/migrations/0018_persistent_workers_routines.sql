set search_path to agesoma_p0, public;

-- Grok Bot-inspired internal runtime model.
-- AGESOMA remains one assistant in the product UI while specialized workers keep
-- persistent identities, sessions and bounded runtime state behind that surface.

create table if not exists persistent_workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  agent_id uuid not null,
  work_cell_id uuid,
  worker_key text not null,
  name text not null,
  status text not null default 'active',
  runtime_strategy text not null default 'shared_cell',
  session_namespace text not null,
  browser_namespace text not null,
  browser_profile_ref text,
  file_namespace text not null,
  memory_namespace text not null,
  credential_namespace text not null,
  max_parallel_jobs int not null default 3,
  monthly_budget_cents bigint,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, agent_id),
  unique (tenant_id, worker_key),
  unique (tenant_id, session_namespace),
  unique (tenant_id, browser_namespace),
  check (status in ('active','paused','retired')),
  check (runtime_strategy in ('shared_cell','dedicated_cell')),
  check (max_parallel_jobs between 1 and 32),
  check (monthly_budget_cents is null or monthly_budget_cents >= 0)
);

create unique index if not exists work_cells_tenant_id_id_idx
  on work_cells (tenant_id,id);
create unique index if not exists persistent_workers_tenant_id_id_idx
  on persistent_workers (tenant_id,id);

alter table persistent_workers
  add constraint persistent_workers_agent_tenant_fk
  foreign key (tenant_id,agent_id) references digital_agents(tenant_id,id) on delete cascade;
alter table persistent_workers
  add constraint persistent_workers_work_cell_tenant_fk
  foreign key (tenant_id,work_cell_id) references work_cells(tenant_id,id) on delete set null;

create index if not exists persistent_workers_tenant_status_idx
  on persistent_workers (tenant_id,status,updated_at desc);
create index if not exists persistent_workers_work_cell_idx
  on persistent_workers (work_cell_id,status);

alter table tasks
  add column if not exists worker_id uuid;

alter table tasks drop constraint if exists tasks_worker_tenant_fk;
alter table tasks
  add constraint tasks_worker_tenant_fk
  foreign key (tenant_id,worker_id) references persistent_workers(tenant_id,id) on delete set null;

create index if not exists tasks_tenant_worker_status_idx
  on tasks (tenant_id,worker_id,status,updated_at desc);

alter table watchers
  add column if not exists worker_id uuid,
  add column if not exists trigger_kind text not null default 'cadence',
  add column if not exists trigger_config jsonb not null default '{}'::jsonb;

alter table watchers drop constraint if exists watchers_worker_tenant_fk;
alter table watchers
  add constraint watchers_worker_tenant_fk
  foreign key (tenant_id,worker_id) references persistent_workers(tenant_id,id) on delete set null;

alter table watchers drop constraint if exists watchers_trigger_kind_check;
alter table watchers
  add constraint watchers_trigger_kind_check
  check (trigger_kind in ('cadence','event','webhook','manual'));

create index if not exists watchers_tenant_worker_status_idx
  on watchers (tenant_id,worker_id,status,next_check_at);

create table if not exists worker_handoffs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_worker_id uuid not null,
  target_worker_id uuid not null,
  source_task_id uuid references tasks(id) on delete set null,
  target_task_id uuid references tasks(id) on delete set null,
  status text not null default 'requested',
  reason text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  check (source_worker_id <> target_worker_id),
  check (status in ('requested','accepted','completed','rejected','cancelled'))
);

alter table worker_handoffs
  add constraint worker_handoffs_source_tenant_fk
  foreign key (tenant_id,source_worker_id) references persistent_workers(tenant_id,id) on delete cascade;
alter table worker_handoffs
  add constraint worker_handoffs_target_tenant_fk
  foreign key (tenant_id,target_worker_id) references persistent_workers(tenant_id,id) on delete cascade;

create index if not exists worker_handoffs_tenant_status_idx
  on worker_handoffs (tenant_id,status,created_at desc);
create index if not exists worker_handoffs_target_status_idx
  on worker_handoffs (target_worker_id,status,created_at desc);
create unique index if not exists worker_handoffs_source_target_idx
  on worker_handoffs (source_task_id,target_worker_id)
  where source_task_id is not null;

-- Existing agents become persistent workers. They share the tenant Work Cell at first,
-- but keep isolated logical state. Dedicated cells can be introduced later per worker
-- without changing the product surface.
insert into persistent_workers (
  tenant_id,agent_id,work_cell_id,worker_key,name,runtime_strategy,
  session_namespace,browser_namespace,browser_profile_ref,file_namespace,memory_namespace,
  credential_namespace,last_active_at
)
select
  a.tenant_id,
  a.id,
  wc.id,
  a.template_key,
  a.name,
  'shared_cell',
  'worker:' || a.template_key,
  'browser:' || a.template_key,
  null,
  'worker:' || a.template_key || ':files',
  a.memory_namespace,
  'worker:' || a.template_key || ':credentials',
  a.last_used_at
from digital_agents a
left join lateral (
  select id
  from work_cells
  where tenant_id=a.tenant_id
  order by case status when 'ready' then 0 when 'provisioning' then 1 else 2 end, updated_at desc
  limit 1
) wc on true
on conflict (tenant_id,agent_id) do update set
  work_cell_id=coalesce(excluded.work_cell_id,persistent_workers.work_cell_id),
  name=excluded.name,
  memory_namespace=excluded.memory_namespace,
  updated_at=now();

-- Backfill task ownership from the existing agent assignment model.
update tasks t
set worker_id=pw.id
from agent_task_assignments ata
join persistent_workers pw
  on pw.tenant_id=ata.tenant_id and pw.agent_id=ata.agent_id
where ata.tenant_id=t.tenant_id
  and ata.task_id=t.id
  and t.worker_id is null;

alter table persistent_workers enable row level security;
alter table persistent_workers force row level security;
drop policy if exists tenant_isolation on persistent_workers;
create policy tenant_isolation on persistent_workers for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table worker_handoffs enable row level security;
alter table worker_handoffs force row level security;
drop policy if exists tenant_isolation on worker_handoffs;
create policy tenant_isolation on worker_handoffs for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on persistent_workers,worker_handoffs to authenticated;
