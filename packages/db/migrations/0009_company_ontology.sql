set search_path to agesoma_p0, public;

create table if not exists ontology_source_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_event_id text,
  payload_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists ontology_source_events_external_idx
  on ontology_source_events (tenant_id, provider, external_event_id)
  where external_event_id is not null;

create table if not exists company_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  entity_type text not null,
  canonical_name text not null,
  canonical_key text,
  status text not null default 'active',
  attributes jsonb not null default '{}'::jsonb,
  valid_from timestamptz,
  valid_to timestamptz,
  first_seen_event_id uuid references ontology_source_events(id) on delete set null,
  last_seen_event_id uuid references ontology_source_events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entity_type in ('company','person','customer','account','product','service','goal','process','work','decision','conversation','transaction','evidence','outcome','system','resource')),
  check (status in ('active','inactive','merged')),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create unique index if not exists company_entities_canonical_key_idx
  on company_entities (tenant_id, entity_type, canonical_key)
  where canonical_key is not null and status <> 'merged';
create index if not exists company_entities_type_idx
  on company_entities (tenant_id, entity_type, updated_at desc);

create table if not exists company_entity_aliases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  entity_id uuid not null references company_entities(id) on delete cascade,
  provider text not null,
  external_type text not null,
  external_id text not null,
  label text,
  confidence numeric(5,4) not null default 1,
  source_event_id uuid references ontology_source_events(id) on delete set null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, external_type, external_id),
  check (confidence >= 0 and confidence <= 1)
);

create index if not exists company_entity_aliases_entity_idx
  on company_entity_aliases (tenant_id, entity_id);

create table if not exists company_relations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_entity_id uuid not null references company_entities(id) on delete cascade,
  target_entity_id uuid not null references company_entities(id) on delete cascade,
  relation_type text not null,
  confidence numeric(5,4) not null default 1,
  attributes jsonb not null default '{}'::jsonb,
  source_event_id uuid references ontology_source_events(id) on delete set null,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_entity_id <> target_entity_id),
  check (relation_type in ('owns','employs','serves','buys','offers','responsible_for','contributes_to','depends_on','blocked_by','decided_by','discussed_in','produced','verifies','caused','used_by','belongs_to','related_to')),
  check (confidence >= 0 and confidence <= 1),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index if not exists company_relations_source_idx
  on company_relations (tenant_id, source_entity_id, relation_type);
create index if not exists company_relations_target_idx
  on company_relations (tenant_id, target_entity_id, relation_type);

-- Ontology data follows the same tenant RLS contract as the rest of AGESOMA.
grant select, insert, update, delete on
  ontology_source_events, company_entities, company_entity_aliases, company_relations
  to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ontology_source_events','company_entities','company_entity_aliases','company_relations'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I for all to authenticated using (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) with check (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;
