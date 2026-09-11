alter table tasks
  add column if not exists action_type text,
  add column if not exists reversible boolean not null default false,
  add column if not exists external boolean not null default true,
  add column if not exists expected_loss_cents bigint not null default 0,
  add column if not exists confidence numeric(5,4) not null default 0,
  add column if not exists grant_ref uuid references approval_grants(id) on delete set null,
  add column if not exists execution_started_at timestamptz,
  add column if not exists execution_finished_at timestamptz,
  add column if not exists execution_result jsonb,
  add column if not exists failure_reason text;

create index if not exists tasks_dispatch_idx
  on tasks (status, created_at)
  where status in ('queued', 'scheduled');

create index if not exists approval_grants_task_idx
  on approval_grants (task_id, expires_at desc);
