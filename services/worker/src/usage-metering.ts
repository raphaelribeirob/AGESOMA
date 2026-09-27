import { transaction } from "@agesoma/db";

type BudgetReservation = {
  allowed: boolean;
  reservedCostCents: number;
  tenantMonthlyBudgetCents: number | null;
  workerMonthlyBudgetCents: number | null;
  monthCommittedCents: number;
  workerMonthCommittedCents: number;
  currency: string;
  reason: string;
};

export type NormalizedUsage = {
  actualCostCents: number | null;
  costSource: "hermes_actual" | "reservation_estimate";
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  browserSeconds: number | null;
  apiCalls: number | null;
  rawUsage: Record<string, unknown>;
};

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findNumeric(value: unknown, names: Set<string>, depth = 0): number | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumeric(item, names, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const [rawKey, item] of Object.entries(record)) {
    if (!names.has(key(rawKey))) continue;
    const found = numeric(item);
    if (found !== null) return found;
  }
  for (const item of Object.values(record)) {
    const found = findNumeric(item, names, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

function usageRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function normalizeHermesUsage(value: unknown): NormalizedUsage {
  const rawUsage = usageRecord(value);
  const cents = findNumeric(rawUsage, new Set(["totalcostcents","costcents","billedcostcents","actualcostcents"]));
  const usd = cents === null
    ? findNumeric(rawUsage, new Set(["totalcostusd","costusd","billedcostusd"]))
    : null;
  const actualCostCents = cents !== null
    ? Math.max(0, Math.round(cents))
    : usd !== null
      ? Math.max(0, Math.round(usd * 100))
      : null;
  const inputTokens = findNumeric(rawUsage, new Set(["inputtokens","prompttokens"]));
  const outputTokens = findNumeric(rawUsage, new Set(["outputtokens","completiontokens"]));
  const totalTokens = findNumeric(rawUsage, new Set(["totaltokens"]));
  const browserSeconds = findNumeric(rawUsage, new Set(["browserseconds","browsertimeseconds"]));
  const apiCalls = findNumeric(rawUsage, new Set(["apicalls","toolcalls"]));

  return {
    actualCostCents,
    costSource: actualCostCents === null ? "reservation_estimate" : "hermes_actual",
    inputTokens: inputTokens === null ? null : Math.trunc(inputTokens),
    outputTokens: outputTokens === null ? null : Math.trunc(outputTokens),
    totalTokens: totalTokens === null ? null : Math.trunc(totalTokens),
    browserSeconds,
    apiCalls: apiCalls === null ? null : Math.trunc(apiCalls),
    rawUsage
  };
}

function unknownTaskReserveCents() {
  const value = numeric(process.env.AGESOMA_UNKNOWN_TASK_RESERVE_CENTS);
  return value === null ? 25 : Math.trunc(value);
}

function defaultTenantMonthlyBudgetCents() {
  const value = numeric(process.env.AGESOMA_DEFAULT_MONTHLY_BUDGET_CENTS);
  return value === null ? 1000 : Math.trunc(value);
}

export async function reserveWorkerBudget(input: {
  tenantId: string;
  taskId: string;
  workerId: string | null;
  expectedCostCents: number;
}): Promise<BudgetReservation> {
  const reserve = Math.max(0, Math.trunc(input.expectedCostCents)) || unknownTaskReserveCents();

  return await transaction(async (client) => {
    const existing = await client.query<{
      status: "reserved" | "settled" | "released";
      reserved_cost_cents: string | number;
      actual_cost_cents: string | number;
      currency: string;
    }>(
      "select status,reserved_cost_cents,actual_cost_cents,currency from agesoma_p0.task_usage_ledger where tenant_id=$1 and task_id=$2 limit 1",
      [input.tenantId,input.taskId]
    );

    if (existing.rows[0]) {
      const row = existing.rows[0];
      if (row.status === "released") {
        await client.query(
          "delete from agesoma_p0.task_usage_ledger where tenant_id=$1 and task_id=$2 and status='released'",
          [input.tenantId,input.taskId]
        );
      } else {
        const committed = row.status === "settled"
          ? Number(row.actual_cost_cents)
          : Number(row.reserved_cost_cents);
        return {
          allowed: true,
          reservedCostCents: Number(row.reserved_cost_cents),
          tenantMonthlyBudgetCents: null,
          workerMonthlyBudgetCents: null,
          monthCommittedCents: committed,
          workerMonthCommittedCents: committed,
          currency: row.currency,
          reason: "Task already has an idempotent usage reservation."
        };
      }
    }

    let currency = (process.env.AGESOMA_COST_CURRENCY?.trim() || "USD").toUpperCase();
    let tenantMonthlyBudgetCents: number | null = null;
    let workerMonthlyBudgetCents: number | null = null;
    let monthCommittedCents = 0;
    let workerMonthCommittedCents = 0;

    await client.query(
      "insert into agesoma_p0.tenant_usage_budgets (tenant_id,monthly_budget_cents,currency,status) values ($1,$2,$3,'active') on conflict (tenant_id) do nothing",
      [input.tenantId,defaultTenantMonthlyBudgetCents(),currency]
    );

    const tenantBudget = await client.query<{
      monthly_budget_cents: string | number;
      currency: string;
      status: string;
    }>(
      "select monthly_budget_cents,currency,status from agesoma_p0.tenant_usage_budgets where tenant_id=$1 for update",
      [input.tenantId]
    );
    const tenantBudgetRow = tenantBudget.rows[0];
    if (!tenantBudgetRow || tenantBudgetRow.status !== "active") {
      return {
        allowed: false,
        reservedCostCents: 0,
        tenantMonthlyBudgetCents: tenantBudgetRow ? Number(tenantBudgetRow.monthly_budget_cents) : null,
        workerMonthlyBudgetCents: null,
        monthCommittedCents: 0,
        workerMonthCommittedCents: 0,
        currency: tenantBudgetRow?.currency ?? currency,
        reason: "Tenant usage budget is unavailable or paused."
      };
    }

    currency = tenantBudgetRow.currency;
    tenantMonthlyBudgetCents = Number(tenantBudgetRow.monthly_budget_cents);

    const tenantCommitted = await client.query<{ committed: string | number }>(
      "select coalesce(sum(case when status='reserved' then reserved_cost_cents when status='settled' then actual_cost_cents else 0 end),0) as committed from agesoma_p0.task_usage_ledger where tenant_id=$1 and period_start=date_trunc('month',now())::date and currency=$2 and status in ('reserved','settled')",
      [input.tenantId,currency]
    );
    monthCommittedCents = Number(tenantCommitted.rows[0]?.committed ?? 0);

    if (monthCommittedCents + reserve > tenantMonthlyBudgetCents) {
      return {
        allowed: false,
        reservedCostCents: 0,
        tenantMonthlyBudgetCents,
        workerMonthlyBudgetCents: null,
        monthCommittedCents,
        workerMonthCommittedCents: 0,
        currency,
        reason: "Tenant monthly usage budget would be exceeded."
      };
    }

    if (input.workerId) {
      const worker = await client.query<{
        status: string;
        monthly_budget_cents: string | number | null;
        budget_currency: string;
      }>(
        "select status,monthly_budget_cents,budget_currency from agesoma_p0.persistent_workers where tenant_id=$1 and id=$2 for update",
        [input.tenantId,input.workerId]
      );
      const row = worker.rows[0];
      if (!row || row.status !== "active") {
        return {
          allowed: false,
          reservedCostCents: 0,
          tenantMonthlyBudgetCents,
          workerMonthlyBudgetCents: null,
          monthCommittedCents,
          workerMonthCommittedCents: 0,
          currency,
          reason: "Persistent worker is unavailable for budget reservation."
        };
      }

      workerMonthlyBudgetCents = row.monthly_budget_cents === null ? null : Number(row.monthly_budget_cents);
      if (workerMonthlyBudgetCents !== null && row.budget_currency !== currency) {
        return {
          allowed: false,
          reservedCostCents: 0,
          tenantMonthlyBudgetCents,
          workerMonthlyBudgetCents,
          monthCommittedCents,
          workerMonthCommittedCents: 0,
          currency,
          reason: "Worker budget currency does not match tenant budget currency."
        };
      }

      const committed = await client.query<{ committed: string | number }>(
        "select coalesce(sum(case when status='reserved' then reserved_cost_cents when status='settled' then actual_cost_cents else 0 end),0) as committed from agesoma_p0.task_usage_ledger where tenant_id=$1 and worker_id=$2 and period_start=date_trunc('month',now())::date and currency=$3 and status in ('reserved','settled')",
        [input.tenantId,input.workerId,currency]
      );
      workerMonthCommittedCents = Number(committed.rows[0]?.committed ?? 0);

      if (workerMonthlyBudgetCents !== null && workerMonthCommittedCents + reserve > workerMonthlyBudgetCents) {
        return {
          allowed: false,
          reservedCostCents: 0,
          tenantMonthlyBudgetCents,
          workerMonthlyBudgetCents,
          monthCommittedCents,
          workerMonthCommittedCents,
          currency,
          reason: "Persistent worker monthly budget would be exceeded."
        };
      }
    }

    await client.query(
      "insert into agesoma_p0.task_usage_ledger (tenant_id,worker_id,task_id,status,currency,reserved_cost_cents,cost_source,raw_usage) values ($1,$2,$3,'reserved',$4,$5,'reservation','{}'::jsonb) on conflict (tenant_id,task_id) do nothing",
      [input.tenantId,input.workerId,input.taskId,currency,reserve]
    );

    return {
      allowed: true,
      reservedCostCents: reserve,
      tenantMonthlyBudgetCents,
      workerMonthlyBudgetCents,
      monthCommittedCents,
      workerMonthCommittedCents,
      currency,
      reason: workerMonthlyBudgetCents === null
        ? "Usage reserved inside the tenant monthly hard budget."
        : "Usage reserved inside tenant and worker monthly hard budgets."
    };
  });
}

export async function settleTaskUsage(input: {
  tenantId: string;
  taskId: string;
  workerId: string | null;
  usage: unknown;
}) {
  const normalized = normalizeHermesUsage(input.usage);

  return await transaction(async (client) => {
    const existing = await client.query<{
      reserved_cost_cents: string | number;
      currency: string;
    }>(
      "select reserved_cost_cents,currency from agesoma_p0.task_usage_ledger where tenant_id=$1 and task_id=$2 for update",
      [input.tenantId,input.taskId]
    );

    const reservation = existing.rows[0];
    const actualCostCents = normalized.actualCostCents ?? Number(reservation?.reserved_cost_cents ?? unknownTaskReserveCents());
    const currency = reservation?.currency ?? (process.env.AGESOMA_COST_CURRENCY?.trim() || "USD").toUpperCase();

    await client.query(
      "insert into agesoma_p0.task_usage_ledger (tenant_id,worker_id,task_id,status,currency,reserved_cost_cents,actual_cost_cents,cost_source,input_tokens,output_tokens,total_tokens,browser_seconds,api_calls,raw_usage,settled_at) values ($1,$2,$3,'settled',$4,0,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,now()) on conflict (tenant_id,task_id) do update set worker_id=coalesce(excluded.worker_id,task_usage_ledger.worker_id),status='settled',actual_cost_cents=excluded.actual_cost_cents,cost_source=excluded.cost_source,input_tokens=excluded.input_tokens,output_tokens=excluded.output_tokens,total_tokens=excluded.total_tokens,browser_seconds=excluded.browser_seconds,api_calls=excluded.api_calls,raw_usage=excluded.raw_usage,settled_at=now(),updated_at=now()",
      [
        input.tenantId,input.workerId,input.taskId,currency,actualCostCents,normalized.costSource,
        normalized.inputTokens,normalized.outputTokens,normalized.totalTokens,
        normalized.browserSeconds,normalized.apiCalls,JSON.stringify(normalized.rawUsage)
      ]
    );

    return { ...normalized, actualCostCents, currency };
  });
}

export async function releaseTaskReservation(input: { tenantId: string; taskId: string }) {
  await transaction(async (client) => {
    await client.query(
      "update agesoma_p0.task_usage_ledger set status='released',actual_cost_cents=0,settled_at=now(),updated_at=now() where tenant_id=$1 and task_id=$2 and status='reserved'",
      [input.tenantId,input.taskId]
    );
  });
}
