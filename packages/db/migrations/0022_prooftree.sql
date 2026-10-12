set search_path to agesoma_p0, public;

-- ProofTree assertions and decisions are CONTROL-PLANE ONLY.
-- Authenticated product users can inspect permitted rows, but cannot forge
-- attestations, trusted evidence or successful decisions through this role.
create table if not exists prooftree_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  task_id uuid not null,
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  executor_id text not null check (length(trim(executor_id)) > 0),
  risk text not null check (risk in ('low','moderate','high','critical')),
  human_reviewed boolean not null default false,
  human_reviewer_id text,
  human_reviewed_at timestamptz,
  check (not human_reviewed or (human_reviewer_id is not null and length(trim(human_reviewer_id)) > 0 and human_reviewed_at is not null and human_reviewer_id <> executor_id)),
  status text not null default 'collecting' check (status in ('collecting','ready','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,task_id,subject_hash),
  unique (tenant_id,id),
  foreign key (tenant_id,task_id) references tasks(tenant_id,id) on delete cascade
);
create index if not exists prooftree_runs_pending_idx
  on prooftree_runs(tenant_id,status,created_at desc);

create table if not exists prooftree_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  run_id uuid not null,
  evidence_key text not null check (length(trim(evidence_key)) > 0),
  kind text not null check (kind in ('source_document','calculation','external_settlement','policy')),
  origin text not null check (origin in ('trusted_connector','deterministic_rule','human_review','model_claim')),
  reference text not null check (length(trim(reference)) > 0),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id,run_id,evidence_key),
  foreign key (tenant_id,run_id) references prooftree_runs(tenant_id,id) on delete cascade
);

create table if not exists prooftree_attestations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  run_id uuid not null,
  verifier_id text not null check (length(trim(verifier_id)) > 0),
  method text not null check (method in ('source_check','deterministic_recalculation','policy_check','model_review')),
  decision text not null check (decision in ('pass','fail','abstain')),
  evidence_keys text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (tenant_id,run_id,verifier_id),
  foreign key (tenant_id,run_id) references prooftree_runs(tenant_id,id) on delete cascade
);

create table if not exists prooftree_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  run_id uuid not null,
  decision text not null check (decision in ('PASS','REVIEW','BLOCK')),
  reasons text[] not null default '{}',
  evidence_ids text[] not null default '{}',
  verifier_ids text[] not null default '{}',
  assessed_at timestamptz not null default now(),
  unique (tenant_id,run_id),
  foreign key (tenant_id,run_id) references prooftree_runs(tenant_id,id) on delete cascade
);

do $$
declare t text;
begin
  foreach t in array array['prooftree_runs','prooftree_evidence','prooftree_attestations','prooftree_decisions'] loop
    execute format('alter table %I enable row level security',t);
    execute format('alter table %I force row level security',t);
    execute format('drop policy if exists tenant_isolation on %I',t);
    execute format(
      'create policy tenant_isolation on %I for select to authenticated using (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t
    );
    execute format('grant select on %I to authenticated',t);
  end loop;
end $$;
-- Ingest/attestation writes are deliberately reserved for the trusted internal
-- worker/database role; they must NEVER be exposed via a user-authorized API.
