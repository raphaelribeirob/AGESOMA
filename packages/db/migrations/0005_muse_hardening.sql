-- InstantWork Muse-alignment hardening.

create table if not exists agesoma_p0.tenant_memberships (
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  actor_id text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (tenant_id, actor_id)
);

alter table agesoma_p0.approval_grants
  add column if not exists scope_hash text,
  add column if not exists approved_by text,
  add column if not exists nonce uuid,
  add column if not exists consumed_at timestamptz;

create unique index if not exists approval_grants_nonce_idx on agesoma_p0.approval_grants (nonce) where nonce is not null;
create index if not exists approval_grants_scope_idx on agesoma_p0.approval_grants (tenant_id, task_id, action_class, scope_hash, expires_at desc);

create table if not exists agesoma_p0.work_cells (
  tenant_id uuid primary key references agesoma_p0.tenants(id) on delete cascade,
  runtime_namespace text not null unique,
  browser_profile_ref text unique,
  file_namespace text not null unique,
  memory_namespace text not null unique,
  credential_namespace text not null unique,
  isolation_status text not null default 'unprovisioned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (isolation_status in ('unprovisioned','provisioning','ready','blocked'))
);

create table if not exists agesoma_p0.credential_handles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  provider text not null,
  handle text not null,
  scopes jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, handle),
  check (status in ('active','revoked','expired'))
);

create table if not exists agesoma_p0.egress_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  task_id uuid references agesoma_p0.tasks(id) on delete cascade,
  destination text not null,
  operation text,
  action_class text not null,
  decision text not null,
  reason text not null,
  capability_hash text,
  created_at timestamptz not null default now(),
  check (decision in ('ALLOW','REVIEW','DENY'))
);

create table if not exists agesoma_p0.opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  watcher_id uuid,
  goal_id uuid,
  source_task_id uuid references agesoma_p0.tasks(id) on delete set null,
  title text not null,
  summary text not null,
  proposed_action jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','accepted','dismissed','completed'))
);

create table if not exists agesoma_p0.artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  task_id uuid references agesoma_p0.tasks(id) on delete set null,
  kind text not null,
  title text not null,
  content jsonb not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.autonomy_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  action_class text not null,
  destination text,
  operation text,
  resource_pattern text,
  decision text not null,
  max_amount_cents bigint,
  approved_by text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (decision in ('ALLOW','DENY'))
);

create table if not exists agesoma_p0.tool_recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  name text not null,
  description text not null,
  definition jsonb not null,
  status text not null default 'draft',
  created_from_task_id uuid references agesoma_p0.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  check (status in ('draft','approved','disabled'))
);

create index if not exists opportunities_tenant_status_idx on agesoma_p0.opportunities (tenant_id, status, created_at desc);
create index if not exists artifacts_tenant_task_idx on agesoma_p0.artifacts (tenant_id, task_id, created_at desc);
create index if not exists autonomy_rules_lookup_idx on agesoma_p0.autonomy_rules (tenant_id, action_class, destination, operation);
