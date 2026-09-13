import { getActionPolicy } from "@agesoma/core";
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

function cents(value: unknown, ceiling: number) {
  const numeric = number(value);
  if (numeric === null) return 0;
  return Math.max(0, Math.min(ceiling, Math.trunc(numeric)));
}

async function teamCoordinationAvailable() {
  const [row] = await sql<{ available: boolean }>(`
    select to_regclass('agesoma_p0.team_members') is not null
      and to_regclass('agesoma_p0.work_assignments') is not null as available
  `);
  return row?.available === true;
}

async function persistHumanAssignments(task: ProductTask, output: Record<string, unknown>) {
  if (task.payload.ownerRequested !== true) return;
  if (!(await teamCoordinationAvailable())) return;

  const rawAssignments = Array.isArray(output.humanAssignments) ? output.humanAssignments : [];
  if (!rawAssignments.length) return;

  const allowedTeam = Array.isArray(task.payload.teamContext) ? task.payload.teamContext : [];
  const allowedIds = new Set(
    allowedTeam
      .map((item) => text(record(item)?.id))
      .filter((id): id is string => Boolean(id))
  );
  if (!allowedIds.size) return;

  const policy = getActionPolicy("business.work");
  if (!policy) return;

  for (const raw of rawAssignments.slice(0, 10)) {
    const assignment = record(raw);
    const teamMemberId = text(assignment?.teamMemberId);
    const title = text(assignment?.title);
    const reason = text(assignment?.reason) ?? "Atribuído pela AGESOMA a partir da prioridade do dono.";
    if (!teamMemberId || !title || !allowedIds.has(teamMemberId)) continue;

    const [member] = await sql<{ id: string }>(`
      select id from team_members
      where id=$1 and tenant_id=$2 and availability='active'
      limit 1
    `, [teamMemberId, task.tenant_id]);
    if (!member) continue;

    const [existing] = await sql<{ id: string }>(`
      select t.id
      from tasks t
      join work_assignments a on a.task_id=t.id and a.tenant_id=t.tenant_id
      where t.tenant_id=$1
        and t.payload->>'parentTaskId'=$2
        and a.team_member_id=$3
        and t.payload->>'objective'=$4
        and a.status not in ('cancelled','completed')
      limit 1
    `, [task.tenant_id, task.id, teamMemberId, title]);
    if (existing) continue;

    const childPayload = {
      objective: title,
      parentTaskId: task.id,
      coordinationOnly: true,
      ownerRequested: true,
      requestedBy: text(task.payload.requestedBy),
      constraints: {
        reversibleInternalWorkOnly: true,
        noExternalMessages: true,
        noSpending: true,
        noCommercialCommitments: true,
        noPermissionChanges: true
      }
    };

    const [child] = await sql<{ id: string }>(`
      insert into tasks (
        tenant_id,workflow_id,status,action_type,risk_class,reversible,external,
        expected_value_cents,expected_cost_cents,expected_loss_cents,confidence,payload,dispatched_at
      ) values ($1,$2,'queued',$3,$4,$5,$6,0,0,0,0,$7::jsonb,now())
      returning id
    `, [
      task.tenant_id,
      task.workflow_id,
      policy.type,
      policy.riskClass,
      policy.reversible,
      policy.external,
      JSON.stringify(childPayload)
    ]);

    await sql(`
      insert into work_assignments (
        tenant_id,task_id,executor_type,team_member_id,status,reason,assigned_by
      ) values ($1,$2,'human',$3,'assigned',$4,'agesoma')
    `, [task.tenant_id, child.id, teamMemberId, reason]);
  }
}

async function persistResolvedAction(task: ProductTask, output: Record<string, unknown>) {
  if (task.payload.ownerRequested !== true) return;

  const proposed = record(output.proposedAction);
  if (!proposed) return;

  const action = text(proposed.action);
  if (action !== "business.act" && action !== "business.commit") return;

  const requestedAction = text(task.payload.requestedAction);
  if ((requestedAction === "business.act" || requestedAction === "business.commit") && action !== requestedAction) return;

  const destination = text(proposed.destination);
  const operation = text(proposed.operation);
  const resource = text(proposed.resource);
  if (!destination || !operation || !resource) return;

  const policy = getActionPolicy(action);
  if (!policy || (policy.riskClass !== "R2" && policy.riskClass !== "R3")) return;

  const amountCents = proposed.amountCents === undefined
    ? null
    : cents(proposed.amountCents, 1_000_000_000);
  if (action === "business.commit" && amountCents === null) return;

  const existing = await sql<{ id: string }>(`
    select id from tasks
    where tenant_id=$1
      and payload->>'parentTaskId'=$2
      and action_type=$3
      and status not in ('failed','denied')
    limit 1
  `, [task.tenant_id, task.id, action]);
  if (existing[0]) return;

  const parameters = record(proposed.parameters) ?? {};
  const expectedValueCents = cents(proposed.expectedValueCents, 1_000_000_000);
  const expectedCostCents = cents(proposed.expectedCostCents, 100_000_000);
  const expectedLossCents = cents(proposed.expectedLossCents, 1_000_000_000);
  const confidence = Math.max(0, Math.min(1, number(proposed.confidence) ?? 0));

  const payload = {
    objective: text(task.payload.objective) ?? "Complete the resolved business action.",
    destination,
    operation,
    resource,
    amountCents,
    parameters,
    parentTaskId: task.id,
    requestedBy: text(task.payload.requestedBy),
    ownerRequested: true,
    resolvedByHermes: true,
    resolutionEvidence: record(proposed.evidence) ?? {},
    proposedSummary: text(proposed.summary),
    outputContract: {
      artifact: "Return evidence of the exact action completed.",
      outcome: "Do not declare economic outcome verified. Provider-backed verification is separate."
    }
  };

  await sql(`
    insert into tasks (
      tenant_id, workflow_id, status, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    ) values ($1,$2,'awaiting_approval',$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
  `, [
    task.tenant_id,
    task.workflow_id,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    expectedValueCents,
    expectedCostCents,
    expectedLossCents,
    confidence,
    JSON.stringify(payload)
  ]);
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

  await persistHumanAssignments(task, output);
  await persistResolvedAction(task, output);

  if (await teamCoordinationAvailable()) {
    await sql(`
      update work_assignments
      set status='completed',updated_at=now()
      where tenant_id=$1 and task_id=$2 and executor_type='hermes'
    `, [task.tenant_id, task.id]);
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
