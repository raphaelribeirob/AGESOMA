import { sql } from "@agesoma/db";

export type ProductTask = {
  id: string;
  tenant_id: string;
  workflow_id: string | null;
  action_type: string;
  payload: Record<string, unknown>;
};

type HermesResult = {
  output?: unknown;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function persistProductOutput(task: ProductTask, result: HermesResult) {
  const output = record(result.output);
  if (!output) return;

  const artifact = record(output.artifact);
  const title = text(artifact?.title) ?? text(output.title) ?? text(task.payload.objective) ?? "Trabalho concluído";
  const kind = text(artifact?.kind) ?? "result";
  const content = artifact?.content ?? output;
  const evidence = record(output.evidence) ?? {};

  await sql(`insert into artifacts (tenant_id, task_id, kind, title, content, evidence) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb)`, [
    task.tenant_id, task.id, kind, title, JSON.stringify(content), JSON.stringify(evidence)
  ]);

  const opportunities = Array.isArray(output.opportunities) ? output.opportunities : [];
  for (const raw of opportunities.slice(0, 10)) {
    const item = record(raw);
    const itemTitle = text(item?.title);
    const summary = text(item?.summary);
    if (!itemTitle || !summary) continue;
    await sql(`insert into opportunities (tenant_id, watcher_id, goal_id, source_task_id, title, summary, proposed_action, evidence, confidence, status) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,'open')`, [
      task.tenant_id,
      typeof task.payload.watcherId === "string" ? task.payload.watcherId : null,
      typeof task.payload.goalId === "string" ? task.payload.goalId : null,
      task.id,
      itemTitle,
      summary,
      JSON.stringify(record(item?.proposedAction) ?? {}),
      JSON.stringify(record(item?.evidence) ?? {}),
      Math.max(0, Math.min(1, number(item?.confidence) ?? 0))
    ]);
  }

  const outcome = record(output.outcome);
  if (outcome?.verified === true && task.workflow_id) {
    const evidenceSource = text(outcome.evidenceSource);
    if (evidenceSource) {
      const revenue = Math.max(0, Math.trunc(number(outcome.attributedRevenueCents) ?? 0));
      const cost = Math.max(0, Math.trunc(number(outcome.totalCostCents) ?? 0));
      await sql(`insert into outcome_events (tenant_id, workflow_id, task_id, outcome_type, outcome_value_cents, attributed_revenue_cents, total_cost_cents, net_value_cents, attribution_confidence, evidence_source, verified_at, evidence) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),$11::jsonb)`, [
        task.tenant_id,
        task.workflow_id,
        task.id,
        text(outcome.type) ?? "verified_change",
        Math.max(0, Math.trunc(number(outcome.valueCents) ?? revenue)),
        revenue,
        cost,
        revenue - cost,
        Math.max(0, Math.min(1, number(outcome.confidence) ?? 0)),
        evidenceSource,
        JSON.stringify(record(outcome.evidence) ?? evidence)
      ]);
    }
  }

  const recipe = record(output.toolRecipe);
  const recipeName = text(recipe?.name);
  const recipeDescription = text(recipe?.description);
  if ((task.action_type === "business.observe" || task.action_type === "business.work") && recipeName && recipeDescription) {
    await sql(`insert into tool_recipes (tenant_id, name, description, definition, status, created_from_task_id) values ($1,$2,$3,$4::jsonb,'draft',$5) on conflict (tenant_id, name) do update set description=excluded.description, definition=excluded.definition, status='draft', created_from_task_id=excluded.created_from_task_id, updated_at=now()`, [
      task.tenant_id, recipeName, recipeDescription, JSON.stringify(recipe), task.id
    ]);
  }
}
