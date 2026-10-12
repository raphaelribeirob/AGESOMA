set search_path to agesoma_p0, public;

-- Self-service customer support. Public customer messages never become trusted facts.
-- Paid entitlements are CONTROL PLANE ONLY, written from verified Paddle events.

create table if not exists support_workspaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{4,59}$'),
  display_name text not null check(length(trim(display_name)) between 2 and 100),
  greeting text not null default 'Como posso ajudar?',
  owner_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,id)
);
-- Public directory contains only deliberately public slugs and tenant identifiers.
-- Tenant-owned records and entitlements remain protected by tenantSql RLS.
create table if not exists support_public_directory (
  slug text primary key check(slug ~ '^[a-z0-9][a-z0-9-]{4,59}
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_id uuid not null,
  question text not null check(length(trim(question)) between 5 and 300),
  answer text not null check(length(trim(answer)) between 5 and 2000),
  enabled boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade
);
create index if not exists support_knowledge_tenant_idx on support_knowledge(tenant_id,workspace_id,enabled,created_at desc);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_id uuid not null,
  question text not null check(length(question) between 3 and 1000),
  answer text not null,
  status text not null check(status in ('answered','needs_human')),
  knowledge_id uuid,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade,
  foreign key (knowledge_id) references support_knowledge(id) on delete set null
);
alter table support_messages enable row level security;
alter table support_messages force row level security;
create policy tenant_read on support_messages for select to authenticated
  using (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy tenant_insert on support_messages for insert to authenticated
  with check (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select,insert on support_messages to authenticated;

create index if not exists support_messages_customer_history_idx on support_messages(tenant_id,created_at desc);

-- Global per-workspace quota is atomic, cost-bounded and daily.
create table if not exists support_daily_usage (
  workspace_id uuid not null references support_workspaces(id) on delete cascade,
  usage_date date not null,
  hits integer not null check(hits>=0 and hits<=200),
  primary key(workspace_id,usage_date)
);

create table if not exists billing_checkout_intents (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_key text not null check(product_key='support'),
  created_by text not null,
  price_id text not null,
  paddle_transaction_id text unique,
  created_at timestamptz not null default now(),
  unique(tenant_id,id)
);
create table if not exists billing_entitlements (
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_key text not null check(product_key='support'),
  provider text not null check(provider='paddle'),
  subscription_id text not null unique,
  customer_id text,
  status text not null,
  latest_occurred_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(tenant_id,product_key)
);
create table if not exists billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['support_workspaces','support_knowledge','support_messages','billing_checkout_intents','billing_entitlements'] loop
    execute format('alter table %I enable row level security',t);
    execute format('alter table %I force row level security',t);
    execute format('drop policy if exists tenant_select on %I',t);
    execute format('create policy tenant_select on %I for select to authenticated using (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
    execute format('grant select on %I to authenticated',t);
  end loop;
end $$;
-- Application users may create and configure workspaces, but cannot write billing states.
create policy tenant_write on support_workspaces for all to authenticated
  using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy tenant_write on support_knowledge for all to authenticated
  using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy tenant_insert on billing_checkout_intents for insert to authenticated
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant insert,update on support_workspaces to authenticated;
grant insert,update,delete on support_knowledge to authenticated;
grant insert on billing_checkout_intents to authenticated;
-- Checkout association is privileged: authenticated callers never bind transaction IDs.
-- No select grants or RLS policies for anonymous users: the public endpoint
-- accesses a constrained, read-only service role after enforcing publication.
-- billing_entitlements and webhook_events intentionally no authenticated writes.
-- The public support_messages write is privileged and only through the bounded API.
),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  workspace_id uuid not null unique,
  foreign key (tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade
);
alter table support_public_directory enable row level security;
alter table support_public_directory force row level security;
create policy directory_lookup on support_public_directory for select to public using(true);
create policy directory_insert on support_public_directory for insert to authenticated
  with check (tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select on support_public_directory to public;
grant insert on support_public_directory to authenticated;

create table if not exists support_knowledge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_id uuid not null,
  question text not null check(length(trim(question)) between 5 and 300),
  answer text not null check(length(trim(answer)) between 5 and 2000),
  enabled boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade
);
create index if not exists support_knowledge_tenant_idx on support_knowledge(tenant_id,workspace_id,enabled,created_at desc);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace_id uuid not null,
  question text not null check(length(question) between 3 and 1000),
  answer text not null,
  status text not null check(status in ('answered','needs_human')),
  knowledge_id uuid,
  created_at timestamptz not null default now(),
  foreign key (tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade,
  foreign key (knowledge_id) references support_knowledge(id) on delete set null
);
create index if not exists support_messages_customer_history_idx on support_messages(tenant_id,created_at desc);

-- Global per-workspace quota is atomic, cost-bounded and daily.
create table if not exists support_daily_usage (
  workspace_id uuid not null references support_workspaces(id) on delete cascade,
  usage_date date not null,
  hits integer not null check(hits>=0 and hits<=200),
  primary key(workspace_id,usage_date)
);

create table if not exists billing_checkout_intents (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_key text not null check(product_key='support'),
  created_by text not null,
  price_id text not null,
  paddle_transaction_id text unique,
  created_at timestamptz not null default now(),
  unique(tenant_id,id)
);
create table if not exists billing_entitlements (
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_key text not null check(product_key='support'),
  provider text not null check(provider='paddle'),
  subscription_id text not null unique,
  customer_id text,
  status text not null,
  latest_occurred_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(tenant_id,product_key)
);
create table if not exists billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['support_workspaces','support_knowledge','support_messages','billing_checkout_intents','billing_entitlements'] loop
    execute format('alter table %I enable row level security',t);
    execute format('alter table %I force row level security',t);
    execute format('drop policy if exists tenant_select on %I',t);
    execute format('create policy tenant_select on %I for select to authenticated using (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
    execute format('grant select on %I to authenticated',t);
  end loop;
end $$;
-- Application users may create and configure workspaces, but cannot write billing states.
create policy tenant_write on support_workspaces for all to authenticated
  using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy tenant_write on support_knowledge for all to authenticated
  using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy tenant_insert on billing_checkout_intents for insert to authenticated
  with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant insert,update on support_workspaces to authenticated;
grant insert,update,delete on support_knowledge to authenticated;
grant insert on billing_checkout_intents to authenticated;
-- No select grants or RLS policies for anonymous users: the public endpoint
-- accesses a constrained, read-only service role after enforcing publication.
-- billing_entitlements and webhook_events intentionally no authenticated writes.
-- The public support_messages write is privileged and only through the bounded API.


-- The migration owner's server connection is the trusted control plane.
-- FORCE RLS still applies to the owner; allow it only for billing control tables.
-- The authenticated role continues to have no billing write policy.
do $$
declare owner_role text := current_user;
begin
 execute format('create policy internal_billing_control on billing_checkout_intents for all to %I using(true) with check(true)',owner_role);
 execute format('create policy internal_entitlement_control on billing_entitlements for all to %I using(true) with check(true)',owner_role);
end $$;
