set search_path to agesoma_p0, public;

-- P0 enforcement hardening: credential handles are explicit caller/purpose ACLs.

update credential_handles
set scopes = case provider
  when 'steel' then '["browser_broker:browser.provider"]'::jsonb
  when 'whatsapp' then '["privsep_broker:whatsapp.send"]'::jsonb
  when 'windsor' then '["privsep_broker:paid_media.read","privsep_broker:paid_media.write"]'::jsonb
  else scopes
end
where status='active';

alter table credential_handles drop constraint if exists credential_handles_scopes_array_check;
alter table credential_handles
  add constraint credential_handles_scopes_array_check
  check (jsonb_typeof(scopes)='array');

alter table egress_decisions
  alter column policy_version set default 'sentinel-v3';

create index if not exists egress_decisions_tenant_policy_created_idx
  on egress_decisions (tenant_id,policy_version,created_at desc);
