set search_path to agesoma_p0, public;

-- MUSE-style trust boundary: surrogate credentials, structured egress decisions
-- and brokered browser sessions. The agent runtime remains untrusted.

alter table credential_handles
  add column if not exists surrogate_id uuid not null default gen_random_uuid(),
  add column if not exists secret_class text not null default 'provider_token',
  add column if not exists last_used_at timestamptz;

create unique index if not exists credential_handles_surrogate_idx
  on credential_handles (tenant_id,surrogate_id);

alter table credential_handles drop constraint if exists credential_handles_secret_class_check;
alter table credential_handles
  add constraint credential_handles_secret_class_check
  check (secret_class in ('provider_token','browser_provider','oauth_connection','api_key'));

alter table egress_decisions
  add column if not exists method text,
  add column if not exists path text,
  add column if not exists protocol text,
  add column if not exists resolved_ip inet,
  add column if not exists data_taint text not null default 'clean',
  add column if not exists request_meta jsonb not null default '{}'::jsonb,
  add column if not exists grant_ref uuid references approval_grants(id) on delete set null,
  add column if not exists policy_version text not null default 'sentinel-v2';

alter table egress_decisions drop constraint if exists egress_decisions_data_taint_check;
alter table egress_decisions
  add constraint egress_decisions_data_taint_check
  check (data_taint in ('clean','public','personal','sensitive','credential'));

alter table tasks
  add column if not exists data_taint text not null default 'clean';

alter table tasks drop constraint if exists tasks_data_taint_check;
alter table tasks
  add constraint tasks_data_taint_check
  check (data_taint in ('clean','public','personal','sensitive','credential'));

create table if not exists browser_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  provider text not null default 'steel',
  provider_session_id text not null,
  profile_ref text,
  mode text not null default 'brokered',
  interactive boolean not null default false,
  status text not null default 'live',
  last_url text,
  data_taint text not null default 'clean',
  created_at timestamptz not null default now(),
  released_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (tenant_id,provider,provider_session_id),
  check (mode in ('brokered','human_takeover')),
  check (status in ('live','released','failed')),
  check (data_taint in ('clean','public','personal','sensitive','credential'))
);

create index if not exists browser_sessions_tenant_status_idx
  on browser_sessions (tenant_id,status,updated_at desc);

create table if not exists runtime_events (
  id bigserial primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  session_ref text,
  event_type text not null,
  trust_zone text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (trust_zone in ('runtime','browser_broker','privsep','authd','sentinel','control'))
);

create index if not exists runtime_events_tenant_task_idx
  on runtime_events (tenant_id,task_id,id);

alter table browser_sessions enable row level security;
alter table browser_sessions force row level security;
drop policy if exists tenant_isolation on browser_sessions;
create policy tenant_isolation on browser_sessions for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table runtime_events enable row level security;
alter table runtime_events force row level security;
drop policy if exists tenant_isolation on runtime_events;
create policy tenant_isolation on runtime_events for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update,delete on browser_sessions,runtime_events to authenticated;
grant usage,select on sequence runtime_events_id_seq to authenticated;
