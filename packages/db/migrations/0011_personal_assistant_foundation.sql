set search_path to agesoma_p0, public;

-- Personal-assistant foundation: persistent context, connected services and bounded proactivity.
-- Memory is descriptive context only. It never grants authority.

alter table digital_agents drop constraint if exists digital_agents_domain_check;
alter table digital_agents
  add constraint digital_agents_domain_check
  check (domain in ('sales','marketing','paid_media','service','finance','operations','general'));

insert into digital_agents (
  tenant_id, template_key, name, role_title, domain, purpose,
  responsibilities, skills, preferred_resources, memory_namespace
)
select
  t.id,
  'paid_media',
  'Especialista de Mídia Paga',
  'Especialista digital de tráfego pago',
  'paid_media',
  'Analisar performance de mídia paga, preparar otimizações e executar mudanças aprovadas com controle de orçamento.',
  '["analisar campanhas","preparar otimizações","criar campanhas pausadas","gerenciar orçamento aprovado"]'::jsonb,
  '["meta ads","google ads","paid media","aquisição","criativos","orçamento"]'::jsonb,
  '["facebook","google_ads","web","files"]'::jsonb,
  'agent:paid_media'
from tenants t
on conflict (tenant_id, template_key) do nothing;

create table if not exists personal_context_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  subject text not null default 'self',
  kind text not null,
  value text not null,
  source_type text not null,
  source_ref text,
  provenance jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null default 1,
  status text not null default 'active',
  supersedes_id uuid references personal_context_entries(id) on delete set null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (source_type in ('user_onboarding','user_statement','user_correction','connected_service','task_outcome','system_inference')),
  check (status in ('active','superseded','deleted')),
  check (confidence >= 0 and confidence <= 1),
  check (length(trim(value)) > 0)
);

create index if not exists personal_context_tenant_status_idx
  on personal_context_entries (tenant_id, status, kind, created_at desc);
create index if not exists personal_context_supersedes_idx
  on personal_context_entries (tenant_id, supersedes_id)
  where supersedes_id is not null;

create table if not exists connected_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  external_account_id text not null,
  display_name text,
  auth_mode text not null default 'oauth',
  credential_handle_id uuid references credential_handles(id) on delete set null,
  capabilities jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, external_account_id),
  check (auth_mode in ('oauth','api_key','service_account','managed')),
  check (status in ('pending','active','revoked','error')),
  check (jsonb_typeof(capabilities) = 'array'),
  check (jsonb_typeof(permissions) = 'object')
);

create index if not exists connected_services_tenant_status_idx
  on connected_services (tenant_id, status, provider, updated_at desc);

create table if not exists proactivity_preferences (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  enabled boolean not null default false,
  timezone text not null default 'UTC',
  quiet_hours_start time,
  quiet_hours_end time,
  max_interruptions_per_day int not null default 3,
  allowed_kinds jsonb not null default '["calendar","communication","paid_media","general"]'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_interruptions_per_day between 0 and 24),
  check (jsonb_typeof(allowed_kinds) = 'array')
);

create table if not exists proactive_interruptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  watcher_id uuid references watchers(id) on delete set null,
  source_task_id uuid references tasks(id) on delete set null,
  kind text not null,
  summary text not null,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (status in ('unread','read','dismissed'))
);

create index if not exists proactive_interruptions_tenant_status_idx
  on proactive_interruptions (tenant_id, status, created_at desc);

alter table watchers
  add column if not exists connected_service_id uuid references connected_services(id) on delete set null,
  add column if not exists interrupt_policy text not null default 'only_if_actionable';

alter table watchers drop constraint if exists watchers_interrupt_policy_check;
alter table watchers
  add constraint watchers_interrupt_policy_check
  check (interrupt_policy in ('silent','only_if_actionable','always'));

create index if not exists watchers_connected_service_idx
  on watchers (tenant_id, connected_service_id, status);

alter table personal_context_entries enable row level security;
alter table personal_context_entries force row level security;
drop policy if exists tenant_isolation on personal_context_entries;
create policy tenant_isolation on personal_context_entries for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table connected_services enable row level security;
alter table connected_services force row level security;
drop policy if exists tenant_isolation on connected_services;
create policy tenant_isolation on connected_services for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table proactivity_preferences enable row level security;
alter table proactivity_preferences force row level security;
drop policy if exists tenant_isolation on proactivity_preferences;
create policy tenant_isolation on proactivity_preferences for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table proactive_interruptions enable row level security;
alter table proactive_interruptions force row level security;
drop policy if exists tenant_isolation on proactive_interruptions;
create policy tenant_isolation on proactive_interruptions for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select, insert, update, delete on
  personal_context_entries, connected_services, proactivity_preferences, proactive_interruptions
  to authenticated;
