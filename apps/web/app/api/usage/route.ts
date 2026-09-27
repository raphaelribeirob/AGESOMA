import { NextResponse } from "next/server";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) {
    return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const [budget] = await tenantSql<{
    monthly_budget_cents: string | number;
    currency: string;
    status: string;
  }>(authenticated.tenantId, `
    select monthly_budget_cents,currency,status
    from tenant_usage_budgets
    where tenant_id=$1
    limit 1
  `, [authenticated.tenantId]);

  const [summary] = await tenantSql<{
    committed_cents: string | number;
    settled_cents: string | number;
    reserved_cents: string | number;
    currency: string | null;
  }>(authenticated.tenantId, `
    select
      coalesce(sum(case when status='settled' then actual_cost_cents when status='reserved' then reserved_cost_cents else 0 end),0) as committed_cents,
      coalesce(sum(case when status='settled' then actual_cost_cents else 0 end),0) as settled_cents,
      coalesce(sum(case when status='reserved' then reserved_cost_cents else 0 end),0) as reserved_cents,
      max(currency) as currency
    from task_usage_ledger
    where tenant_id=$1
      and period_start=date_trunc('month',now())::date
      and status in ('reserved','settled')
  `, [authenticated.tenantId]);

  const workers = await tenantSql<{
    worker_id: string | null;
    worker_key: string | null;
    worker_name: string | null;
    monthly_budget_cents: string | number | null;
    budget_currency: string | null;
    committed_cents: string | number;
    settled_cents: string | number;
    reserved_cents: string | number;
    tasks: string | number;
  }>(authenticated.tenantId, `
    select
      l.worker_id,
      pw.worker_key,
      pw.name as worker_name,
      pw.monthly_budget_cents,
      pw.budget_currency,
      coalesce(sum(case when l.status='settled' then l.actual_cost_cents when l.status='reserved' then l.reserved_cost_cents else 0 end),0) as committed_cents,
      coalesce(sum(case when l.status='settled' then l.actual_cost_cents else 0 end),0) as settled_cents,
      coalesce(sum(case when l.status='reserved' then l.reserved_cost_cents else 0 end),0) as reserved_cents,
      count(*) filter (where l.status in ('reserved','settled')) as tasks
    from task_usage_ledger l
    left join persistent_workers pw
      on pw.tenant_id=l.tenant_id and pw.id=l.worker_id
    where l.tenant_id=$1
      and l.period_start=date_trunc('month',now())::date
    group by l.worker_id,pw.worker_key,pw.name,pw.monthly_budget_cents,pw.budget_currency
    order by committed_cents desc
  `, [authenticated.tenantId]);

  const recent = await tenantSql(authenticated.tenantId, `
    select
      l.task_id,l.worker_id,pw.worker_key,l.status,l.currency,
      l.reserved_cost_cents,l.actual_cost_cents,l.cost_source,
      l.input_tokens,l.output_tokens,l.total_tokens,l.browser_seconds,l.api_calls,
      l.updated_at
    from task_usage_ledger l
    left join persistent_workers pw
      on pw.tenant_id=l.tenant_id and pw.id=l.worker_id
    where l.tenant_id=$1
      and l.period_start=date_trunc('month',now())::date
    order by l.updated_at desc
    limit 50
  `, [authenticated.tenantId]);

  return NextResponse.json({
    periodStart: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0,10),
    currency: budget?.currency ?? summary?.currency ?? "USD",
    monthlyBudgetCents: budget ? Number(budget.monthly_budget_cents) : null,
    budgetStatus: budget?.status ?? "uninitialized",
    committedCents: Number(summary?.committed_cents ?? 0),
    settledCents: Number(summary?.settled_cents ?? 0),
    reservedCents: Number(summary?.reserved_cents ?? 0),
    workers: workers.map((row) => ({
      workerId: row.worker_id,
      workerKey: row.worker_key,
      workerName: row.worker_name,
      monthlyBudgetCents: row.monthly_budget_cents === null ? null : Number(row.monthly_budget_cents),
      budgetCurrency: row.budget_currency,
      committedCents: Number(row.committed_cents),
      settledCents: Number(row.settled_cents),
      reservedCents: Number(row.reserved_cents),
      tasks: Number(row.tasks)
    })),
    recent
  });
}
