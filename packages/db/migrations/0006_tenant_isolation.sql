-- Production hardening: app-facing connections must operate through tenant RLS.
set search_path to agesoma_p0, public;

grant usage on schema agesoma_p0 to authenticated;
grant select on tenants to authenticated;

grant select, insert, update, delete on
  goals, workflows, tasks, approval_grants, policy_decisions, outcome_events,
  learning_records, watchers, work_cells, tenant_memberships, credential_handles,
  egress_decisions, opportunities, artifacts, autonomy_rules, tool_recipes
  to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'goals','workflows','tasks','approval_grants','policy_decisions','outcome_events',
    'learning_records','watchers','work_cells','tenant_memberships','credential_handles',
    'egress_decisions','opportunities','artifacts','autonomy_rules','tool_recipes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;
