create table if not exists agesoma_p0.approval_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  task_id uuid not null references agesoma_p0.tasks(id) on delete cascade,
  action_class text not null,
  scope jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agesoma_p0.policy_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references agesoma_p0.tenants(id) on delete cascade,
  task_id uuid references agesoma_p0.tasks(id) on delete cascade,
  action_class text,
  risk_class text,
  decision text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists approval_grants_task_idx on agesoma_p0.approval_grants (task_id, expires_at desc);
