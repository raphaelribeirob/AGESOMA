set search_path to agesoma_p0, public;
create unique index if not exists support_knowledge_tenant_key_idx on support_knowledge(tenant_id,id);
create table if not exists support_eval_cases (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references tenants(id) on delete cascade,
 workspace_id uuid not null,
 question text not null check(length(trim(question)) between 3 and 1000),
 expected_status text not null check(expected_status in ('answered','needs_human')),
 expected_knowledge_id uuid,
 created_by text not null,
 created_at timestamptz not null default now(),
 foreign key (tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade,
 foreign key (tenant_id,expected_knowledge_id) references support_knowledge(tenant_id,id) on delete cascade,
 check((expected_status='needs_human' and expected_knowledge_id is null)
    or (expected_status='answered' and expected_knowledge_id is not null))
);
create index if not exists support_eval_cases_tenant_idx on support_eval_cases(tenant_id,workspace_id);
create table if not exists support_eval_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references tenants(id) on delete cascade,
 workspace_id uuid not null,
 cases_count integer not null check(cases_count between 1 and 100),
 passed_count integer not null check(passed_count>=0 and passed_count<=cases_count),
 details jsonb not null,
 run_by text not null,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade
);
create index if not exists support_eval_runs_tenant_idx on support_eval_runs(tenant_id,created_at desc);
alter table support_eval_cases enable row level security;
alter table support_eval_cases force row level security;
alter table support_eval_runs enable row level security;
alter table support_eval_runs force row level security;
create policy cases_read on support_eval_cases for select to authenticated using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy cases_write on support_eval_cases for insert to authenticated with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy cases_delete on support_eval_cases for delete to authenticated using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy runs_read on support_eval_runs for select to authenticated using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
create policy runs_write on support_eval_runs for insert to authenticated with check(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select,insert,delete on support_eval_cases to authenticated;
grant select,insert on support_eval_runs to authenticated;
