set search_path to agesoma_p0, public;

-- AGESOMA presents one Jarvis to the owner, while keeping a persistent digital workforce
-- behind that single interface. Agents are stateful identities; execution remains ephemeral
-- and continues through the existing HERMES/Work Cell runtime.
create table if not exists digital_agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  template_key text not null,
  name text not null,
  role_title text not null,
  domain text not null,
  purpose text not null,
  responsibilities jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  preferred_resources jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  autonomy_mode text not null default 'bounded',
  memory_namespace text not null,
  hired_at timestamptz not null default now(),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, template_key),
  unique (tenant_id, memory_namespace),
  unique (tenant_id, id),
  check (domain in ('sales','marketing','service','finance','operations','general')),
  check (status in ('active','paused','retired')),
  check (autonomy_mode in ('observe','bounded','manual')),
  check (jsonb_typeof(responsibilities) = 'array'),
  check (jsonb_typeof(skills) = 'array'),
  check (jsonb_typeof(preferred_resources) = 'array')
);

create index if not exists digital_agents_tenant_status_idx
  on digital_agents (tenant_id, status, updated_at desc);
create index if not exists digital_agents_tenant_domain_idx
  on digital_agents (tenant_id, domain, status);

-- Logical ownership of a task by a digital agent is deliberately separate from
-- work_assignments. work_assignments answers "which runtime/person executes it?";
-- agent_task_assignments answers "which persistent AGESOMA specialist owns it?".
create unique index if not exists tasks_tenant_id_id_idx on tasks (tenant_id, id);

create table if not exists agent_task_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid not null,
  agent_id uuid not null,
  assigned_reason text not null,
  created_at timestamptz not null default now(),
  unique (task_id),
  foreign key (tenant_id, task_id) references tasks(tenant_id, id) on delete cascade,
  foreign key (tenant_id, agent_id) references digital_agents(tenant_id, id) on delete cascade
);

create index if not exists agent_task_assignments_tenant_agent_idx
  on agent_task_assignments (tenant_id, agent_id, created_at desc);

-- One database-level provisioning function is used for both existing and future tenants.
-- Jarvis also calls an idempotent application-level provisioner as a defensive fallback.
create or replace function seed_default_digital_agents(p_tenant_id uuid)
returns void
language sql
as $$
  insert into digital_agents (
    tenant_id, template_key, name, role_title, domain, purpose,
    responsibilities, skills, preferred_resources, memory_namespace
  )
  select
    p_tenant_id,
    a.template_key,
    a.name,
    a.role_title,
    a.domain,
    a.purpose,
    a.responsibilities::jsonb,
    a.skills::jsonb,
    a.preferred_resources::jsonb,
    'agent:' || a.template_key
  from (values
    ('sales','Agente de Vendas','Especialista comercial digital','sales','Aumentar receita acompanhando oportunidades, leads, propostas e follow-ups.','["qualificar leads","recuperar oportunidades","preparar propostas","acompanhar pipeline"]','["crm","follow-up","propostas","qualificação","conversão"]','["crm","whatsapp","email","calendar"]'),
    ('marketing','Agente de Marketing','Especialista de crescimento digital','marketing','Gerar demanda e melhorar aquisição usando evidências da empresa e dos canais.','["analisar aquisição","preparar campanhas","avaliar canais","produzir ativos de marketing"]','["marketing","campanhas","conteúdo","aquisição","ads"]','["web","files","email"]'),
    ('service','Agente de Atendimento','Especialista de relacionamento com clientes','service','Resolver demandas de clientes com rapidez, contexto e consistência.','["responder clientes","acompanhar tickets","identificar risco de churn","organizar retornos"]','["atendimento","suporte","whatsapp","email","retenção"]','["whatsapp","email","crm"]'),
    ('finance','Agente Financeiro','Especialista financeiro digital','finance','Acompanhar cobranças, recebimentos, custos e sinais financeiros que exigem ação.','["acompanhar cobranças","analisar recebimentos","preparar conciliações","sinalizar riscos financeiros"]','["financeiro","cobrança","faturas","margem","recebimentos"]','["finance","files","email","whatsapp"]'),
    ('operations','Agente de Operações','Especialista de operações digitais','operations','Fazer processos, rotinas e trabalho interno avançarem com menos coordenação manual.','["organizar processos","preparar documentos","acompanhar tarefas","resolver rotinas operacionais"]','["operações","processos","documentos","planilhas","coordenação"]','["files","web","email","calendar"]'),
    ('research','Agente de Pesquisa','Analista digital da empresa','general','Investigar perguntas abertas, comparar evidências e preparar decisões para o Jarvis.','["pesquisar","comparar evidências","resumir contexto","preparar recomendações"]','["pesquisa","análise","síntese","benchmark","documentação"]','["web","files"]')
  ) as a(template_key,name,role_title,domain,purpose,responsibilities,skills,preferred_resources)
  on conflict (tenant_id, template_key) do nothing;
$$;

select seed_default_digital_agents(id) from tenants;

create or replace function provision_default_digital_agents_for_new_tenant()
returns trigger
language plpgsql
as $$
begin
  perform seed_default_digital_agents(new.id);
  return new;
end;
$$;

drop trigger if exists tenants_provision_default_digital_agents on tenants;
create trigger tenants_provision_default_digital_agents
after insert on tenants
for each row execute function provision_default_digital_agents_for_new_tenant();

alter table digital_agents enable row level security;
alter table digital_agents force row level security;
drop policy if exists tenant_isolation on digital_agents;
create policy tenant_isolation on digital_agents for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table agent_task_assignments enable row level security;
alter table agent_task_assignments force row level security;
drop policy if exists tenant_isolation on agent_task_assignments;
create policy tenant_isolation on agent_task_assignments for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select, insert, update, delete on digital_agents, agent_task_assignments to authenticated;
