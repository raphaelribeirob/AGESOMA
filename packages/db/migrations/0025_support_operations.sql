set search_path to agesoma_p0, public;

-- Tenant-scoped operator inbox: unanswered requests require an actual human reply.
create unique index if not exists support_messages_tenant_id_unique on support_messages(tenant_id,id);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_id uuid not null,
  message_id uuid not null unique,
  lookup_hash text not null unique check(lookup_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'open' check(status in ('open','resolved')),
  operator_reply text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade,
  foreign key (tenant_id,message_id) references support_messages(tenant_id,id) on delete cascade,
  check (
    (status='open' and operator_reply is null and resolved_at is null and resolved_by is null)
    or (status='resolved' and operator_reply is not null and length(trim(operator_reply)) between 2 and 2000
      and resolved_at is not null and resolved_by is not null)
  )
);
create index if not exists support_tickets_inbox_idx on support_tickets(tenant_id,status,created_at desc);
alter table support_tickets enable row level security;
alter table support_tickets force row level security;
create policy support_tickets_read on support_tickets for select to authenticated
 using (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy support_tickets_create on support_tickets for insert to authenticated
 with check (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy support_tickets_resolve on support_tickets for update to authenticated
 using (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid)
 with check (tenant_id = nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select,insert,update on support_tickets to authenticated;

-- Server-only quota tables. Complement a production CDN/WAF; not a substitute.
create table if not exists support_hourly_usage (
  workspace_id uuid not null references support_workspaces(id) on delete cascade,
  usage_hour timestamptz not null,
  hits integer not null check(hits between 0 and 40),
  primary key(workspace_id,usage_hour)
);
create table if not exists support_visitor_usage (
  workspace_id uuid not null references support_workspaces(id) on delete cascade,
  visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),
  usage_date date not null,
  hits integer not null check(hits between 0 and 12),
  primary key(workspace_id,visitor_hash,usage_date)
);
