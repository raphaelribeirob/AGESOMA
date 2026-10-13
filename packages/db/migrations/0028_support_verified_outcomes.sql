set search_path to agesoma_p0, public;

-- REA-12 / REA-17: Decision telemetry distinct from human and customer outcomes.
alter table support_messages
 add column if not exists decision_latency_ms integer check (decision_latency_ms between 0 and 600000),
 add column if not exists decision_reason text;
create index if not exists support_messages_tenant_time_idx on support_messages(tenant_id,created_at desc);

-- A ticket marked resolved by an operator is NOT proof that the customer's
-- problem was solved. This confirmation comes from the holder of the private
-- ticket token; one assessment per ticket, without retaining a new identity.
create unique index if not exists support_tickets_tenant_id_idx on support_tickets(tenant_id,id);
create table if not exists support_customer_outcomes (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references tenants(id) on delete cascade,
 workspace_id uuid not null,
 ticket_id uuid not null unique,
 verdict text not null check(verdict in ('resolved','not_resolved')),
 created_at timestamptz not null default now(),
 foreign key(tenant_id,workspace_id) references support_workspaces(tenant_id,id) on delete cascade,
 foreign key(tenant_id,ticket_id) references support_tickets(tenant_id,id) on delete cascade
);
create index if not exists support_customer_outcomes_tenant_created_idx
 on support_customer_outcomes(tenant_id,created_at desc);
alter table support_customer_outcomes enable row level security;
alter table support_customer_outcomes force row level security;
create policy tenant_read on support_customer_outcomes for select to authenticated
 using(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
grant select on support_customer_outcomes to authenticated;
-- No authenticated INSERT/UPDATE/DELETE permissions; only the trusted public
-- endpoint may insert once, after verifying the bearer token and ticket state.


-- RLS integration fix: the public support API uses a privileged runtime
-- connection for narrowly scoped ticket creation, token lookup and feedback.
-- Without these policies, FORCE RLS silently denies that workflow for a
-- non-BYPASSRLS database user. Never grant this role to untrusted clients.
do $$
declare privileged_role text := current_user;
begin
 execute format('create policy internal_messages_insert on support_messages for insert to %I with check(true)',privileged_role);
 execute format('create policy internal_tickets_read on support_tickets for select to %I using(true)',privileged_role);
 execute format('create policy internal_tickets_insert on support_tickets for insert to %I with check(true)',privileged_role);
 execute format('create policy internal_feedback_insert on support_customer_outcomes for insert to %I with check(true)',privileged_role);
end $$;

-- Production validation MUST use a dedicated non-BYPASSRLS app role. The
-- migration owner role assumption must be reconciled with the DATABASE_URL
-- login before applying this migration to real Neon staging.
