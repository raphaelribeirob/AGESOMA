set search_path to agesoma_p0, public;

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_id text,
  name text not null,
  role_title text not null,
  department text,
  responsibilities jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  availability text not null default 'active',
  weekly_capacity_hours int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (availability in ('active','away','inactive')),
  check (weekly_capacity_hours is null or (weekly_capacity_hours >= 0 and weekly_capacity_hours <= 168)),
  check (jsonb_typeof(responsibilities) = 'array'),
  check (jsonb_typeof(skills) = 'array')
);

create unique index if not exists team_members_tenant_name_idx
  on team_members (tenant_id, lower(name));
create unique index if not exists team_members_tenant_actor_idx
  on team_members (tenant_id, actor_id) where actor_id is not null;
create index if not exists team_members_tenant_availability_idx
  on team_members (tenant_id, availability, updated_at desc);

create table if not exists work_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  executor_type text not null,
  team_member_id uuid references team_members(id) on delete set null,
  status text not null default 'assigned',
  reason text not null,
  assigned_by text not null default 'agesoma',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id),
  check (executor_type in ('human','hermes')),
  check (status in ('assigned','in_progress','blocked','completed','cancelled')),
  check (
    (executor_type = 'human' and team_member_id is not null)
    or (executor_type = 'hermes' and team_member_id is null)
  )
);

create index if not exists work_assignments_tenant_status_idx
  on work_assignments (tenant_id, status, updated_at desc);
create index if not exists work_assignments_member_status_idx
  on work_assignments (team_member_id, status, updated_at desc)
  where team_member_id is not null;

alter table team_members enable row level security;
alter table team_members force row level security;
drop policy if exists tenant_isolation on team_members;
create policy tenant_isolation on team_members for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table work_assignments enable row level security;
alter table work_assignments force row level security;
drop policy if exists tenant_isolation on work_assignments;
create policy tenant_isolation on work_assignments for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select, insert, update, delete on team_members, work_assignments to authenticated;
