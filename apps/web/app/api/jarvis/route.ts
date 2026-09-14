import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCapabilityScope,
  decideExecutor,
  getActionPolicy,
  routeBusinessRequest,
  serializeCapabilityScope,
  type TeamMemberForCoordination
} from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("message"), message: z.string().min(2).max(4000) }),
  z.object({ action: z.literal("approve"), taskId: z.string().uuid() })
]);

type TeamRow = {
  id: string;
  name: string;
  role_title: string;
  department: string | null;
  responsibilities: unknown;
  skills: unknown;
  availability: string;
};

type ApprovalTask = {
  id: string;
  status: string;
  action_type: string;
  payload: Record<string, unknown>;
};

type Snapshot = {
  team_count: string | number;
  active_work: string | number;
  blocked_work: string | number;
  approvals: string | number;
  verified_count: string | number;
  net_value_cents: string | number;
};

type BrainFact = { fact?: string };

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function money(cents: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(cents) / 100);
}

function canApprove(role: string) {
  return role === "owner" || role === "admin";
}

function canonicalScope(task: ApprovalTask) {
  const scope = buildCapabilityScope({ taskId: task.id, action: task.action_type, payload: task.payload });
  const policy = getActionPolicy(task.action_type);
  if (!policy) return { error: "Ação desconhecida", scope: null, policy: null } as const;
  if (policy.riskClass === "R2" || policy.riskClass === "R3") {
    if (!scope.destination || !scope.operation || !scope.resource) {
      return { error: "A ação ainda não está completamente resolvida", scope: null, policy } as const;
    }
    if (policy.riskClass === "R3" && scope.amountCents === null) {
      return { error: "A ação exige um valor explícito antes da aprovação", scope: null, policy } as const;
    }
  }
  return { error: null, scope, policy } as const;
}

async function snapshot(tenantId: string) {
  const [row] = await tenantSql<Snapshot>(tenantId, `
    select
      (select count(*) from team_members where tenant_id=$1 and availability <> 'inactive') as team_count,
      (select count(*) from work_assignments where tenant_id=$1 and status in ('assigned','in_progress')) as active_work,
      (select count(*) from work_assignments where tenant_id=$1 and status='blocked') as blocked_work,
      (select count(*) from tasks where tenant_id=$1 and status='awaiting_approval') as approvals,
      (select count(*) from outcome_events where tenant_id=$1) as verified_count,
      (select coalesce(sum(net_value_cents),0) from outcome_events where tenant_id=$1) as net_value_cents
  `, [tenantId]);
  return row ?? { team_count: 0, active_work: 0, blocked_work: 0, approvals: 0, verified_count: 0, net_value_cents: 0 };
}

async function firstApproval(tenantId: string) {
  const tasks = await tenantSql<ApprovalTask>(tenantId, `
    select id,status,action_type,payload
    from tasks
    where tenant_id=$1 and status='awaiting_approval'
    order by created_at asc
    limit 5
  `, [tenantId]);

  for (const task of tasks) {
    const resolved = canonicalScope(task);
    if (resolved.error || !resolved.scope) continue;
    const summary = typeof task.payload.proposedSummary === "string"
      ? task.payload.proposedSummary
      : typeof task.payload.objective === "string"
        ? task.payload.objective
        : "Há uma ação aguardando sua autorização.";
    return { taskId: task.id, summary };
  }
  return null;
}

async function searchBrain(tenantId: string, query: string) {
  const baseUrl = process.env.AGESOMA_BRAIN_URL?.trim();
  const token = process.env.AGESOMA_BRAIN_INTERNAL_API_TOKEN?.trim();
  if (!baseUrl || !token) return [] as string[];

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/search`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-agesoma-brain-token": token },
      body: JSON.stringify({ tenant_id: tenantId, query, limit: 5 }),
      signal: AbortSignal.timeout(6000),
      cache: "no-store"
    });
    if (!response.ok) return [] as string[];
    const data = await response.json() as { facts?: BrainFact[] };
    return (data.facts ?? []).map((item) => item.fact?.trim()).filter((item): item is string => Boolean(item)).slice(0, 4);
  } catch {
    return [] as string[];
  }
}

function looksLikeQuestion(message: string) {
  const normalized = message.trim().toLocaleLowerCase("pt-BR");
  return message.includes("?") || /^(como|o que|qual|quais|quem|quanto|quantos|onde|quando|por que|porque|me diga|me mostre|mostre|resuma|resumo|relatório|relatorio|status|situação|situacao)/.test(normalized);
}

async function answerQuestion(tenantId: string, message: string) {
  const [state, facts, approval] = await Promise.all([
    snapshot(tenantId),
    searchBrain(tenantId, message),
    firstApproval(tenantId)
  ]);

  const active = Number(state.active_work);
  const blocked = Number(state.blocked_work);
  const approvals = Number(state.approvals);
  const verified = Number(state.verified_count);
  const value = Number(state.net_value_cents);

  const lines = [
    active ? `Há ${active} trabalho${active === 1 ? "" : "s"} em andamento.` : "Não há trabalho ativo neste momento.",
    blocked ? `${blocked} trabalho${blocked === 1 ? " está" : "s estão"} travado${blocked === 1 ? "" : "s"}.` : "Nada está travado.",
    approvals ? `${approvals} decisão${approvals === 1 ? " precisa" : "ões precisam"} de você.` : "Não há decisões esperando por você.",
    verified ? `Já existem ${verified} resultado${verified === 1 ? "" : "s"} verificado${verified === 1 ? "" : "s"}, somando ${money(value)} de impacto confirmado.` : "Ainda não há resultado econômico verificado."
  ];

  if (facts.length) {
    lines.push(`No contexto da empresa, encontrei também: ${facts.join(" ")}`);
  }

  return { reply: lines.join(" "), approval };
}

async function createWork(tenantId: string, actorId: string, role: string, message: string) {
  let plan;
  try {
    plan = routeBusinessRequest(message);
  } catch {
    return { reply: "Entendi o pedido, mas ainda não consigo transformá-lo em um trabalho seguro. Diga o resultado que você quer em uma frase mais concreta.", approval: await firstApproval(tenantId) };
  }

  const rows = await tenantSql<TeamRow>(tenantId, `
    select id,name,role_title,department,responsibilities,skills,availability
    from team_members
    where tenant_id=$1 and availability='active'
    order by name asc
  `, [tenantId]);
  const team: TeamMemberForCoordination[] = rows.map((member) => ({
    id: member.id,
    name: member.name,
    roleTitle: member.role_title,
    department: member.department,
    responsibilities: list(member.responsibilities),
    skills: list(member.skills),
    availability: member.availability
  }));

  const decision = decideExecutor(plan, team);
  const isManager = canApprove(role);
  if (decision.executorType === "human" && plan.requiresApproval && !isManager) {
    return { reply: "Esse trabalho exige decisão do dono ou de um administrador antes de ser atribuído.", approval: await firstApproval(tenantId) };
  }

  const action = decision.executorType === "hermes" && plan.requiresApproval ? "business.work" : plan.action;
  const policy = getActionPolicy(action);
  if (!policy) return { reply: "Ainda não tenho uma forma segura de executar esse trabalho.", approval: await firstApproval(tenantId) };

  const [workflow] = await tenantSql<{ id: string }>(tenantId, `
    insert into workflows (tenant_id,key,version,status,config)
    values ($1,$2,1,'active',$3::jsonb)
    returning id
  `, [tenantId, `jarvis-${crypto.randomUUID()}`, JSON.stringify({ source: "jarvis_conversation", plan })]);

  const teamContext = team.map((member) => ({
    id: member.id,
    name: member.name,
    roleTitle: member.roleTitle,
    department: member.department ?? null,
    responsibilities: member.responsibilities ?? [],
    skills: member.skills ?? []
  }));

  const payload = JSON.stringify({
    objective: plan.originalRequest,
    requestedAction: plan.action,
    coordination: decision,
    teamContext,
    requestedBy: actorId,
    ownerRequested: isManager,
    conversationSurface: "jarvis",
    outputContract: {
      artifact: "Return a concise business artifact explaining what was organized or completed.",
      outcome: "Do not claim a business result verified unless a separate verifier supplied evidence.",
      proposedAction: plan.requiresApproval ? "Resolve the exact consequential action and request owner approval before the side effect." : "Use the shortest evidence-backed route that safely completes the business job."
    }
  });

  const [task] = await tenantSql<{ id: string; status: string }>(tenantId, `
    insert into tasks (
      tenant_id,workflow_id,status,action_type,risk_class,reversible,external,payload,dispatched_at
    ) values ($1,$2,'queued',$3,$4,$5,$6,$7::jsonb,$8)
    returning id,status
  `, [
    tenantId,
    workflow.id,
    policy.type,
    policy.riskClass,
    policy.reversible,
    policy.external,
    payload,
    decision.executorType === "human" ? new Date() : null
  ]);

  await tenantSql(tenantId, `
    insert into work_assignments (tenant_id,task_id,executor_type,team_member_id,status,reason,assigned_by)
    values ($1,$2,$3,$4,'assigned',$5,$6)
  `, [tenantId, task.id, decision.executorType, decision.teamMemberId, decision.reason, actorId]);

  const responsible = decision.executorType === "human" ? decision.teamMemberName ?? "sua equipe" : "eu";
  const approvalNote = plan.requiresApproval
    ? " Vou preparar a ação exata e pedir sua autorização antes de qualquer etapa consequencial."
    : " Vou acompanhar até haver uma entrega ou um bloqueio real.";

  return {
    reply: `Entendi. Coloquei ${responsible} para cuidar disso.${approvalNote}`,
    approval: await firstApproval(tenantId)
  };
}

async function approveTask(tenantId: string, actorId: string, role: string, taskId: string) {
  if (!canApprove(role)) return NextResponse.json({ error: "Somente o dono ou um administrador pode aprovar essa ação." }, { status: 403 });

  const [task] = await tenantSql<ApprovalTask>(tenantId, `
    select id,status,action_type,payload
    from tasks where id=$1 and tenant_id=$2 limit 1
  `, [taskId, tenantId]);
  if (!task) return NextResponse.json({ error: "A decisão não existe mais." }, { status: 404 });
  if (task.status !== "awaiting_approval") return NextResponse.json({ error: "Essa decisão já não está aguardando aprovação." }, { status: 409 });

  const resolved = canonicalScope(task);
  if (resolved.error || !resolved.scope) return NextResponse.json({ error: resolved.error ?? "Não foi possível validar a ação." }, { status: 409 });

  const serializedScope = serializeCapabilityScope(resolved.scope);
  const scopeHash = createHash("sha256").update(serializedScope).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await tenantSql(tenantId, `
    insert into approval_grants (tenant_id,task_id,action_class,scope,scope_hash,approved_by,nonce,expires_at)
    values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)
  `, [tenantId, taskId, task.action_type, serializedScope, scopeHash, actorId, randomUUID(), expiresAt]);
  await tenantSql(tenantId, `update tasks set status='queued',dispatched_at=null,updated_at=now() where id=$1 and tenant_id=$2`, [taskId, tenantId]);

  return NextResponse.json({ reply: "Aprovado. Vou executar exatamente o que foi autorizado e depois confirmar o resultado com evidência." });
}

export async function POST(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Não entendi essa mensagem." }, { status: 400 });

  if (parsed.data.action === "approve") {
    return approveTask(authenticated.tenantId, authenticated.actorId, authenticated.role, parsed.data.taskId);
  }

  const result = looksLikeQuestion(parsed.data.message)
    ? await answerQuestion(authenticated.tenantId, parsed.data.message)
    : await createWork(authenticated.tenantId, authenticated.actorId, authenticated.role, parsed.data.message);

  return NextResponse.json(result);
}
