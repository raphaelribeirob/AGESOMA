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

type AttentionMode = "silent" | "save" | "digest" | "notify" | "approval";

function clamp01(value: unknown, fallback: number) {
  const numeric = number(value);
  if (numeric === null) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function decideAttention(
  output: Record<string, unknown>,
  firstActionableSummary: string | null,
  suppressInterruptions: boolean,
  interruptPolicy: string
) {
  const signal = record(output.attention) ?? {};
  const requiresUser = signal.requiresUser === true || Boolean(record(output.proposedAction));
  const novelty = clamp01(signal.novelty, firstActionableSummary ? 0.65 : 0.2);
  const importance = clamp01(signal.importance, requiresUser ? 0.9 : firstActionableSummary ? 0.65 : 0.25);
  const urgency = clamp01(signal.urgency, requiresUser ? 0.8 : firstActionableSummary ? 0.45 : 0.2);
  const score = novelty * 0.3 + importance * 0.45 + urgency * 0.25;
  const summary = text(signal.summary) ?? firstActionableSummary ?? text(output.summary);
  const reason = text(signal.reason) ?? (
    requiresUser ? "A decisão exige participação explícita do usuário."
      : firstActionableSummary ? "Há informação nova com utilidade potencial."
        : "Nenhuma mudança relevante exige atenção imediata."
  );

  let mode: AttentionMode;
  if (interruptPolicy === "silent") mode = summary ? "save" : "silent";
  else if (requiresUser) mode = suppressInterruptions && urgency < 0.85 ? "digest" : "approval";
  else if (!summary || score < 0.25) mode = "silent";
  else if (score < 0.45) mode = "save";
  else if (score < 0.68 || suppressInterruptions) mode = "digest";
  else mode = "notify";

  return { novelty, importance, urgency, requiresUser, mode, reason, summary, score };
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
  if (!action) return;

  const policy = getActionPolicy(action);
  if (!policy || (policy.riskClass !== "R2" && policy.riskClass !== "R3")) return;

  const requestedAction = text(task.payload.requestedAction);
  const requestedPolicy = requestedAction ? getActionPolicy(requestedAction) : null;
  if (
    requestedAction &&
    requestedPolicy &&
    (requestedPolicy.riskClass === "R2" || requestedPolicy.riskClass === "R3") &&
    action !== requestedAction
  ) return;

  const destination = text(proposed.destination);
  const operation = text(proposed.operation);
  const resource = text(proposed.resource);
  if (!destination || !operation || !resource) return;

  const amountCents = proposed.amountCents === undefined
    ? null
    : cents(proposed.amountCents, 1_000_000_000);
  if (policy.riskClass === "R3" && amountCents === null) return;

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
    objective: text(task.payload.objective) ?? "Complete the resolved action.",
    destination,
    operation,
    resource,
    amountCents,
    parameters,
    parentTaskId: task.id,
    threadId: text(task.payload.threadId),
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

async function queueApiToolBuild(task: ProductTask, content: unknown) {
  if (task.action_type !== "api.discover") return;
  const discovery = record(content);
  const candidates = Array.isArray(discovery?.candidates) ? discovery!.candidates : [];
  const candidate = candidates
    .map((item) => record(item))
    .find((item) => text(item?.openApiUrl) && text(item?.url) && text(item?.name));
  if (!candidate) return;

  const specUrl = text(candidate.openApiUrl)!;
  const sourceUrl = text(candidate.url)!;
  const candidateName = text(candidate.name)!;
  const candidateAuth = text(candidate.auth) ?? "Unknown";
  const objective = text(discovery?.query) ?? text(task.payload.objective) ?? candidateName;
  const policy = getActionPolicy("api.tool_build");
  if (!policy) return;

  const [existing] = await sql<{ id: string }>(`
    select id from tasks
    where tenant_id=$1
      and action_type='api.tool_build'
      and payload->>'parentTaskId'=$2
      and payload->>'specUrl'=$3
      and status not in ('failed','denied')
    limit 1
  `,[task.tenant_id,task.id,specUrl]);
  if (existing) return;

  await sql(`
    insert into tasks (
      tenant_id,workflow_id,status,action_type,risk_class,reversible,external,
      expected_value_cents,expected_cost_cents,expected_loss_cents,confidence,payload
    ) values ($1,$2,'queued',$3,$4,$5,$6,0,0,0,1,$7::jsonb)
  `,[
    task.tenant_id,
    task.workflow_id,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    JSON.stringify({
      objective,
      candidateName,
      sourceUrl,
      specUrl,
      candidateAuth,
      parentTaskId: task.id,
      requestedBy: text(task.payload.requestedBy),
      outputContract: {
        toolRecipe: "Return only a read-only recipe derived from the supplied APIs.guru OpenAPI contract."
      }
    })
  ]);
}

async function persistApiToolRecipe(task: ProductTask, output: Record<string, unknown>) {
  const recipe = record(output.toolRecipe);
  const recipeName = text(recipe?.name);
  const recipeDescription = text(recipe?.description);
  if (!recipeName || !recipeDescription) return;

  if (task.action_type !== "api.tool_build") {
    if (task.action_type !== "business.observe" && task.action_type !== "business.work") return;
    await sql(`
      insert into tool_recipes (tenant_id,name,description,definition,status,created_from_task_id)
      values ($1,$2,$3,$4::jsonb,'draft',$5)
      on conflict (tenant_id,name) do update set
        description=excluded.description,
        definition=excluded.definition,
        status='draft',
        created_from_task_id=excluded.created_from_task_id,
        updated_at=now()
    `,[task.tenant_id,recipeName,recipeDescription,JSON.stringify(recipe),task.id]);
    return;
  }

  const definition = record(recipe?.definition);
  const validation = record(recipe?.validation) ?? {};
  const requestedStatus = text(recipe?.status);
  const riskClass = text(recipe?.riskClass) ?? "R1";
  const authMode = text(recipe?.authMode) ?? "unknown";
  const safeValidated = requestedStatus === "validated"
    && definition?.kind === "openapi_readonly"
    && validation.contractValid === true
    && validation.readOnly === true
    && riskClass === "R0"
    && authMode === "none";

  await sql(`
    insert into tool_recipes (
      tenant_id,name,description,definition,status,created_from_task_id,
      tool_kind,source_url,spec_url,base_url,risk_class,auth_mode,validation,permissions,last_tested_at
    ) values (
      $1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,now()
    )
    on conflict (tenant_id,name) do update set
      description=excluded.description,
      definition=excluded.definition,
      status=excluded.status,
      created_from_task_id=excluded.created_from_task_id,
      tool_kind=excluded.tool_kind,
      source_url=excluded.source_url,
      spec_url=excluded.spec_url,
      base_url=excluded.base_url,
      risk_class=excluded.risk_class,
      auth_mode=excluded.auth_mode,
      validation=excluded.validation,
      permissions=excluded.permissions,
      approved_by=null,
      approved_at=null,
      last_tested_at=excluded.last_tested_at,
      updated_at=now()
  `,[
    task.tenant_id,
    recipeName,
    recipeDescription,
    JSON.stringify(definition ?? {}),
    safeValidated ? "validated" : "draft",
    task.id,
    text(recipe?.toolKind) ?? "generic",
    text(recipe?.sourceUrl),
    text(recipe?.specUrl),
    text(recipe?.baseUrl),
    riskClass,
    authMode,
    JSON.stringify(validation),
    JSON.stringify(record(recipe?.permissions) ?? { read: true,write: false })
  ]);
}

async function persistToolInvocation(task: ProductTask, output: Record<string, unknown>) {
  if (task.action_type !== "business.observe" && task.action_type !== "business.work") return;
  const invocation = record(output.toolInvocation);
  if (!invocation) return;

  const recipeId = text(invocation.recipeId);
  const operationId = text(invocation.operationId);
  if (!recipeId || !operationId) return;
  const args = record(invocation.arguments) ?? {};

  const [recipe] = await sql<{
    id: string;
    base_url: string | null;
    definition: unknown;
  }>(`
    select id,base_url,definition
    from tool_recipes
    where tenant_id=$1
      and id=$2
      and status='approved'
      and risk_class='R0'
      and auth_mode='none'
      and tool_kind='openapi_readonly'
    limit 1
  `,[task.tenant_id,recipeId]);
  if (!recipe?.base_url) return;

  const definition = record(recipe.definition);
  const operations = Array.isArray(definition?.operations) ? definition!.operations : [];
  const operation = operations
    .map((item) => record(item))
    .find((item) => text(item?.operationId) === operationId);
  const method = text(operation?.method)?.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return;

  const policy = getActionPolicy("api.tool_read");
  if (!policy) return;

  const [existing] = await sql<{ id: string }>(`
    select id from tasks
    where tenant_id=$1
      and action_type='api.tool_read'
      and payload->>'parentTaskId'=$2
      and payload->>'recipeId'=$3
      and payload->>'operationId'=$4
      and status not in ('failed','denied')
    limit 1
  `,[task.tenant_id,task.id,recipeId,operationId]);
  if (existing) return;

  await sql(`
    insert into tasks (
      tenant_id,workflow_id,status,action_type,risk_class,reversible,external,
      expected_value_cents,expected_cost_cents,expected_loss_cents,confidence,payload
    ) values ($1,$2,'queued',$3,$4,$5,$6,0,0,0,1,$7::jsonb)
  `,[
    task.tenant_id,
    task.workflow_id,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    JSON.stringify({
      objective: text(invocation.summary) ?? text(task.payload.objective) ?? "Consultar ferramenta aprovada.",
      recipeId,
      operationId,
      arguments: args,
      destination: recipe.base_url,
      operation: method.toLowerCase(),
      resource: recipeId,
      parentTaskId: task.id,
      requestedBy: text(task.payload.requestedBy),
      outputContract: {
        artifact: "Return the provider response with the dynamic tool run id as evidence."
      }
    })
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

  const [persistedArtifact] = await sql<{ id: string }>(`
    insert into artifacts (tenant_id, task_id, kind, title, content, evidence)
    values ($1,$2,$3,$4,$5::jsonb,$6::jsonb)
    returning id
  `, [
    task.tenant_id, task.id, kind, title, JSON.stringify(content), JSON.stringify(evidence)
  ]);

  const threadId = typeof task.payload.threadId === "string" ? task.payload.threadId : null;
  if (threadId && persistedArtifact?.id) {
    const [thread] = await sql<{ id: string }>(`
      select id from conversation_threads
      where tenant_id=$1 and id=$2 and status='active'
      limit 1
    `, [task.tenant_id, threadId]);

    if (thread) {
      const completionText = text(output.summary) ?? `${title} está pronto.`;
      await sql(`
        insert into conversation_messages (tenant_id,thread_id,task_id,role,content,metadata)
        values ($1,$2,$3,'assistant',$4,$5::jsonb)
      `, [
        task.tenant_id,
        threadId,
        task.id,
        completionText,
        JSON.stringify({
          completed: true,
          artifactId: persistedArtifact.id,
          artifactKind: kind
        })
      ]);
      await sql(`
        update conversation_threads
        set last_message_at=now(),updated_at=now()
        where tenant_id=$1 and id=$2
      `, [task.tenant_id, threadId]);
    }
  }

  await queueApiToolBuild(task,content);

  const opportunities = Array.isArray(output.opportunities) ? output.opportunities : [];
  let firstActionableSummary: string | null = null;
  for (const raw of opportunities.slice(0, 10)) {
    const item = record(raw);
    const itemTitle = text(item?.title);
    const summary = text(item?.summary);
    if (!itemTitle || !summary) continue;
    if (!firstActionableSummary) firstActionableSummary = `${itemTitle}: ${summary}`;
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

  const watcherId = typeof task.payload.watcherId === "string" ? task.payload.watcherId : null;
  const interruptPolicy = typeof task.payload.interruptPolicy === "string"
    ? task.payload.interruptPolicy
    : "only_if_actionable";
  const suppressInterruptions = task.payload.suppressInterruptions === true;
  const timezone = typeof task.payload.timezone === "string" && task.payload.timezone.trim()
    ? task.payload.timezone.trim()
    : "UTC";
  const maxInterruptions = typeof task.payload.maxInterruptionsPerDay === "number"
    ? Math.max(0, Math.min(24, Math.trunc(task.payload.maxInterruptionsPerDay)))
    : 3;
  const proactiveKind = typeof task.payload.proactivityKind === "string"
    ? task.payload.proactivityKind
    : "general";

  if (watcherId) {
    const attention = decideAttention(output, firstActionableSummary, suppressInterruptions, interruptPolicy);
    const [decision] = await sql<{ id: string }>(`
      insert into attention_decisions (
        tenant_id,watcher_id,source_task_id,novelty,importance,urgency,
        requires_user,mode,reason,summary,metadata
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      on conflict (source_task_id) do update set
        novelty=excluded.novelty,
        importance=excluded.importance,
        urgency=excluded.urgency,
        requires_user=excluded.requires_user,
        mode=excluded.mode,
        reason=excluded.reason,
        summary=excluded.summary,
        metadata=excluded.metadata
      returning id
    `, [
      task.tenant_id,watcherId,task.id,attention.novelty,attention.importance,attention.urgency,
      attention.requiresUser,attention.mode,attention.reason,attention.summary,
      JSON.stringify({ score: attention.score, interruptPolicy, suppressInterruptions })
    ]);

    await sql(`
      insert into activity_events (
        tenant_id,task_id,event_type,title,summary,status,metadata
      ) values ($1,$2,'attention','Atenção avaliada',$3,$4,$5::jsonb)
    `, [
      task.tenant_id,
      task.id,
      attention.summary ?? attention.reason,
      attention.mode === "approval" ? "action_required" : attention.mode === "notify" ? "warning" : "info",
      JSON.stringify({ mode: attention.mode, novelty: attention.novelty, importance: attention.importance, urgency: attention.urgency })
    ]);

    if (attention.summary && ["digest","notify","approval"].includes(attention.mode)) {
      const [usage] = await sql<{ count: string | number }>(`
        select count(*) as count
        from proactive_interruptions
        where tenant_id=$1
          and delivery_mode in ('notify','approval')
          and created_at >= (date_trunc('day', now() at time zone $2) at time zone $2)
      `, [task.tenant_id, timezone]);

      const immediate = attention.mode === "notify" || attention.mode === "approval";
      const underDailyCap = Number(usage?.count ?? 0) < maxInterruptions;
      const deliveryMode = immediate && !underDailyCap ? "digest" : attention.mode;

      await sql(`
        insert into proactive_interruptions (
          tenant_id,watcher_id,source_task_id,attention_decision_id,kind,summary,status,delivery_mode
        ) values ($1,$2,$3,$4,$5,$6,'unread',$7)
        on conflict do nothing
      `, [task.tenant_id,watcherId,task.id,decision.id,proactiveKind,attention.summary,deliveryMode]);
    }
  }

  await sql(`
    insert into activity_events (tenant_id,task_id,event_type,title,summary,status,metadata)
    values ($1,$2,'completed',$3,$4,'success',$5::jsonb)
    on conflict (task_id,event_type) where task_id is not null and event_type='completed' do nothing
  `, [
    task.tenant_id,
    task.id,
    title,
    text(output.summary),
    JSON.stringify({ artifactKind: kind })
  ]);

  await persistHumanAssignments(task, output);
  await persistResolvedAction(task, output);

  if (await teamCoordinationAvailable()) {
    await sql(`
      update work_assignments
      set status='completed',updated_at=now()
      where tenant_id=$1 and task_id=$2 and executor_type='hermes'
    `, [task.tenant_id, task.id]);
  }

  await persistApiToolRecipe(task,output);
  await persistToolInvocation(task,output);
}
