set search_path to agesoma_p0, public;

-- Event-driven routines: durable untrusted event inbox plus per-routine webhook authentication.

create unique index if not exists watchers_tenant_id_id_idx
  on watchers (tenant_id,id);

create table if not exists routine_webhook_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  watcher_id uuid not null,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  unique (tenant_id,watcher_id),
  check (secret_hash ~ '^[0-9a-f]{64}$')
);

alter table routine_webhook_secrets drop constraint if exists routine_webhook_secrets_watcher_tenant_fk;
alter table routine_webhook_secrets
  add constraint routine_webhook_secrets_watcher_tenant_fk
  foreign key (tenant_id,watcher_id)
  references watchers(tenant_id,id)
  on delete cascade;

create table if not exists routine_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  watcher_id uuid not null,
  trigger_kind text not null,
  source text not null,
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  task_id uuid,
  received_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_kind in ('event','webhook','manual')),
  check (status in ('pending','dispatched','dropped','failed')),
  check (length(source) between 1 and 120),
  check (idempotency_key is null or length(idempotency_key) between 1 and 240),
  check (jsonb_typeof(payload)='object')
);

alter table routine_events drop constraint if exists routine_events_watcher_tenant_fk;
alter table routine_events
  add constraint routine_events_watcher_tenant_fk
  foreign key (tenant_id,watcher_id)
  references watchers(tenant_id,id)
  on delete cascade;

alter table routine_events drop constraint if exists routine_events_task_tenant_fk;
alter table routine_events
  add constraint routine_events_task_tenant_fk
  foreign key (tenant_id,task_id)
  references tasks(tenant_id,id)
  on delete set null (task_id);

create unique index if not exists routine_events_watcher_idempotency_idx
  on routine_events (watcher_id,idempotency_key)
  where idempotency_key is not null;

create index if not exists routine_events_pending_idx
  on routine_events (status,available_at,received_at)
  where status='pending';

create index if not exists routine_events_tenant_watcher_idx
  on routine_events (tenant_id,watcher_id,received_at desc);

alter table routine_webhook_secrets enable row level security;
alter table routine_webhook_secrets force row level security;
drop policy if exists tenant_isolation on routine_webhook_secrets;
create policy tenant_isolation on routine_webhook_secrets for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table routine_events enable row level security;
alter table routine_events force row level security;
drop policy if exists tenant_isolation on routine_events;
create policy tenant_isolation on routine_events for select to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select on routine_events to authenticated;
