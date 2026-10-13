set search_path to agesoma_p0, public;

-- Release gate: every change to a customer's approved knowledge or QA cases
-- invalidates previously passed tests. No prior run is grandfathered in.
alter table support_workspaces
 add column if not exists content_version bigint not null default 1;
alter table support_eval_runs
 add column if not exists content_version bigint not null default 0;
alter table support_eval_runs
 add column if not exists skill_version text not null default 'legacy-unverified';
alter table support_messages
 add column if not exists skill_version text not null default 'legacy-unverified';

create or replace function agesoma_p0.bump_support_content_version()
returns trigger language plpgsql security invoker set search_path=agesoma_p0,public as $$
declare affected_tenant uuid;
declare affected_workspace uuid;
begin
 if tg_op='DELETE' then
  affected_tenant:=old.tenant_id;
  affected_workspace:=old.workspace_id;
 else
  affected_tenant:=new.tenant_id;
  affected_workspace:=new.workspace_id;
 end if;
 update support_workspaces
 set content_version=content_version+1, updated_at=now()
 where tenant_id=affected_tenant and id=affected_workspace;
 return null;
end $$;

drop trigger if exists support_knowledge_bump_revision on support_knowledge;
create trigger support_knowledge_bump_revision
 after insert or update or delete on support_knowledge
 for each row execute function agesoma_p0.bump_support_content_version();

drop trigger if exists support_eval_cases_bump_revision on support_eval_cases;
create trigger support_eval_cases_bump_revision
 after insert or update or delete on support_eval_cases
 for each row execute function agesoma_p0.bump_support_content_version();

create index if not exists support_eval_runs_latest_skill_idx
 on support_eval_runs(tenant_id,workspace_id,created_at desc);

-- Hard release requirements (enforced by app routes with tenant-RLS reads):
-- 1) valid, active Paddle subscription
-- 2) explicit owner publish consent
-- 3) nonempty owner-approved knowledge
-- 4) a latest fully passing QA run with >=2 cases: answer AND abstain
-- 5) that run matches the current workspace content_version and skill version
-- 6) no release on fallback/unknown/missing evidence.
