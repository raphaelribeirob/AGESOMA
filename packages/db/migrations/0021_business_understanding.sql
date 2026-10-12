set search_path to agesoma_p0, public;

-- AGESOMA Business Understanding Engine P0.
-- Onboarding facts are assertions until an authorized reviewer confirms them.
-- They are NEVER an authorization grant, contract verification, or proof of cash recovery.

-- Extend the existing company ontology instead of creating a second entity registry.
alter table company_entities drop constraint if exists company_entities_entity_type_check;
alter table company_entities add constraint company_entities_entity_type_check
  check (entity_type in (
    'company','person','customer','account','product','service','goal',
    'process','work','decision','conversation','transaction','evidence',
    'outcome','system','resource','supplier','contract','freight_invoice',
    'shipment','lane','rate_table','policy'
  ));

-- Composite FKs make cross-tenant references impossible even for privileged ingestion.
create unique index if not exists company_entities_tenant_id_id_business_idx
  on company_entities(tenant_id,id);
create unique index if not exists ontology_source_events_tenant_id_id_business_idx
  on ontology_source_events(tenant_id,id);

create table if not exists business_facts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  entity_id uuid not null,
  fact_key text not null,
  fact_value text not null,
  source_event_id uuid not null,
  evidence_ref text not null,
  status text not null default 'unreviewed',
  observed_at timestamptz not null default now(),
  valid_from timestamptz,
  valid_to timestamptz,
  created_by text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id,entity_id) references company_entities(tenant_id,id) on delete cascade,
  foreign key (tenant_id,source_event_id) references ontology_source_events(tenant_id,id) on delete restrict,
  check (fact_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  check (length(trim(fact_value)) between 1 and 2000),
  check (length(trim(evidence_ref)) between 1 and 320),
  check (status in ('unreviewed','owner_confirmed','disputed')),
  check (valid_to is null or valid_from is null or valid_to > valid_from),
  check (
    (status = 'unreviewed' and reviewed_at is null and reviewed_by is null)
    or (status <> 'unreviewed' and reviewed_at is not null and reviewed_by is not null
        and length(trim(coalesce(review_note,''))) > 0)
  )
);

create unique index if not exists business_facts_source_uniq
  on business_facts(tenant_id,entity_id,fact_key,source_event_id);
create index if not exists business_facts_context_idx
  on business_facts(tenant_id,entity_id,status,observed_at desc);
create index if not exists business_facts_review_idx
  on business_facts(tenant_id,status,created_at desc);

alter table business_facts enable row level security;
alter table business_facts force row level security;
drop policy if exists tenant_isolation on business_facts;
create policy tenant_isolation on business_facts for all to authenticated
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant select,insert,update on business_facts to authenticated;

-- Harden the pre-existing ontology: prevent references to entities/events owned by
-- other tenants, including through legacy ingestion paths.
alter table company_entity_aliases
  add constraint company_entity_aliases_entity_tenant_fk_business
  foreign key (tenant_id,entity_id) references company_entities(tenant_id,id)
  on delete cascade not valid;
alter table company_entity_aliases
  add constraint company_entity_aliases_source_tenant_fk_business
  foreign key (tenant_id,source_event_id) references ontology_source_events(tenant_id,id)
  on delete set null (source_event_id) not valid;
alter table company_relations
  add constraint company_relations_source_tenant_fk_business
  foreign key (tenant_id,source_entity_id) references company_entities(tenant_id,id)
  on delete cascade not valid;
alter table company_relations
  add constraint company_relations_target_tenant_fk_business
  foreign key (tenant_id,target_entity_id) references company_entities(tenant_id,id)
  on delete cascade not valid;
alter table company_relations
  add constraint company_relations_event_tenant_fk_business
  foreign key (tenant_id,source_event_id) references ontology_source_events(tenant_id,id)
  on delete set null (source_event_id) not valid;
-- Existing rows must be checked and constraints VALIDATEd in a separate release step.
