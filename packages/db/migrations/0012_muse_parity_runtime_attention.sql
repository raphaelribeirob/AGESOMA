set search_path to agesoma_p0, public;

-- Muse-parity layer: persistent personal runtime, first-class activity/goals,
-- granular connector permissions and an explicit attention decision log.

alter table work_cells
  add column if not exists runtime_mode text not null default 'personal_persistent',
  add column if not exists persistent_home boolean not null default true,
  add column if not exists runtime_owner_actor_id text,
  add column if not exists last_active_at timestamptz;

alter table work_cells drop constraint if exists work_cells_runtime_mode_check;
alter table work_cells
  add constraint work_cells_runtime_mode_check
  check (runtime_mode in ('personal_persistent','isolated_ephemeral'));

update work_cells
set runtime_mode='personal_persistent',
    persistent_home=true,
    last_active_at=coalesce(last_seen_at,updated_at,created_at)
where runtime_mode is distinct from 'personal_persistent'
   or persistent_home is distinct from true
   or last_active_at is null;

alter table goals
  add column if not exists description text,
  add column if not exists priority text not null default 'normal',
  add column if not exists progress numeric(5,4) not null default 0,
  add column if not exists due_at timestamptz,
  add column if not exists source text not null default 'user',
  add column if not exists archived_at timestamptz;

alter table goals drop constraint if exists goals_priority_check;
alter table goals add constraint goals_priority_check check (priority in ('low','normal','high'));
alter table goals drop constraint if exists goals_progress_check;
alter table goals add constraint goals_progress_check check (progress >= 0 and progress <= 1);
alter table goals drop constraint if exists goals_source_check;
alter table goals add constraint goals_source_check check (source in ('user','assistant','connected_service'));

create index if not exists goals_tenant_status_priority_idx
  on goals (tenant_id,status,priority,updated_at desc);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  event_type text not null,
  title text not null,
  summary text,
  status text not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_type in ('request','started','completed','blocked','approval','connection','goal','attention','system')),
  check (status in ('info','success','warning','action_required'))
);

create index if not exists activity_events_tenant_created_idx
  on activity_events (tenant_id,created_at desc);
create unique index if not exists activity_events_task_completed_idx
  on activity_events (task_id,event_type)
  where task_id is not null and event_type='completed';

create table if not exists attention_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  watcher_id uuid references watchers(id) on delete set null,
  source_task_id uuid references tasks(id) on delete set null,
  novelty numeric(5,4) not null default 0,
  importance numeric(5,4) not null default 0,
  urgency numeric(5,4) not null default 0,
  requires_user boolean not null default false,
  mode text not null,
  reason text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (novelty >= 0 and novelty <= 1),
  check (importance >= 0 and importance <= 1),
  check (urgency >= 0 and urgency <= 1),
  check (mode in ('silent','save','digest','notify','approval'))
);

create unique index if not exists attention_decisions_source_task_idx
  on attention_decisions (source_task_id)
  where source_task_id is not null;
create index if not exists attention_decisions_tenant_mode_idx
  on attention_decisions (tenant_id,mode,created_at desc);

alter table proactive_interruptions
  add column if not exists attention_decision_id uuid references attention_decisions(id) on delete set null,
  add column if not exists delivery_mode text not null default 'notify';

alter table proactive_interruptions drop constraint if exists proactive_interruptions_delivery_mode_check;
alter table proactive_interruptions
  add constraint proactive_interruptions_delivery_mode_check
  check (delivery_mode in ('digest','notify','approval'));

alter table activity_events enable row level security;
alter table activity_events force row level security;
drop policy if exists tenant_isolation on activity_events;
create policy tenant_isolation on activity_events for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table attention_decisions enable row level security;
alter table attention_decisions force row level security;
drop policy if exists tenant_isolation on attention_decisions;
create policy tenant_isolation on attention_decisions for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on activity_events,attention_decisions to authenticated;
