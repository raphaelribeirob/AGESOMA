set search_path to agesoma_p0, public;

-- Muse-inspired product experience: persistent main/side conversations and UI-oriented indexes.

create table if not exists conversation_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind text not null default 'side',
  title text not null,
  status text not null default 'active',
  parent_thread_id uuid references conversation_threads(id) on delete set null,
  source_task_id uuid references tasks(id) on delete set null,
  source_artifact_id uuid references artifacts(id) on delete set null,
  created_by text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind in ('main','side')),
  check (status in ('active','archived'))
);

create unique index if not exists conversation_threads_one_main_idx
  on conversation_threads (tenant_id)
  where kind='main' and status='active';

create index if not exists conversation_threads_tenant_updated_idx
  on conversation_threads (tenant_id,status,last_message_at desc nulls last,updated_at desc);

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (role in ('user','assistant'))
);

create index if not exists conversation_messages_thread_created_idx
  on conversation_messages (tenant_id,thread_id,created_at asc);

create index if not exists artifacts_tenant_created_idx
  on artifacts (tenant_id,created_at desc);

create index if not exists opportunities_tenant_open_created_idx
  on opportunities (tenant_id,status,created_at desc)
  where status in ('open','accepted');

alter table conversation_threads enable row level security;
alter table conversation_threads force row level security;
drop policy if exists tenant_isolation on conversation_threads;
create policy tenant_isolation on conversation_threads for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table conversation_messages enable row level security;
alter table conversation_messages force row level security;
drop policy if exists tenant_isolation on conversation_messages;
create policy tenant_isolation on conversation_messages for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on conversation_threads,conversation_messages to authenticated;
