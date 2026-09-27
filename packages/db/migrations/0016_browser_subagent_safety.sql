set search_path to agesoma_p0, public;

-- Browser subagent + independent browser safety boundary.

alter table browser_sessions
  add column if not exists last_snapshot_at timestamptz,
  add column if not exists safety_state jsonb not null default '{}'::jsonb;

alter table runtime_events drop constraint if exists runtime_events_trust_zone_check;
alter table runtime_events
  add constraint runtime_events_trust_zone_check
  check (trust_zone in (
    'runtime','browser_broker','browser_subagent','browser_safety','browser_cdp',
    'privsep','authd','sentinel','control'
  ));

update credential_handles
set scopes = case
  when provider='steel'
    then (
      select coalesce(jsonb_agg(distinct value), '[]'::jsonb)
      from jsonb_array_elements(scopes || '["browser_cdp_gateway:browser.cdp"]'::jsonb)
    )
  else scopes
end
where provider='steel' and status='active';

create index if not exists browser_sessions_tenant_task_live_idx
  on browser_sessions (tenant_id,task_id,updated_at desc)
  where status='live';
