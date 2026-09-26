import { redirect } from "next/navigation";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../lib/auth-workspace";
import AgesomaClient from "./agesoma-client";

export const dynamic = "force-dynamic";

type Summary = {
  active_work: string | number;
  blocked_work: string | number;
  approvals: string | number;
  verified_count: string | number;
  net_value_cents: string | number;
};

type ApprovalRow = {
  id: string;
  payload: Record<string, unknown>;
};

type ProactiveRow = {
  id: string;
  summary: string;
  kind: string;
};

function money(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(Number(value) / 100);
}

async function loadInitialState(tenantId: string) {
  const [summary] = await tenantSql<Summary>(tenantId, `
    select
      (select count(*) from work_assignments where tenant_id=$1 and status in ('assigned','in_progress')) as active_work,
      (select count(*) from work_assignments where tenant_id=$1 and status='blocked') as blocked_work,
      (select count(*) from tasks where tenant_id=$1 and status='awaiting_approval') as approvals,
      (select count(*) from outcome_events where tenant_id=$1) as verified_count,
      (select coalesce(sum(net_value_cents),0) from outcome_events where tenant_id=$1) as net_value_cents
  `, [tenantId]);

  const [[approval], [interruption]] = await Promise.all([
    tenantSql<ApprovalRow>(tenantId, `
      select id,payload
      from tasks
      where tenant_id=$1 and status='awaiting_approval'
      order by created_at asc
      limit 1
    `, [tenantId]),
    tenantSql<ProactiveRow>(tenantId, `
      select id,summary,kind
      from proactive_interruptions
      where tenant_id=$1 and status='unread'
      order by created_at desc
      limit 1
    `, [tenantId])
  ]);

  return {
    summary: summary ?? { active_work: 0, blocked_work: 0, approvals: 0, verified_count: 0, net_value_cents: 0 },
    approval: approval ?? null,
    interruption: interruption ?? null
  };
}

function approvalSummary(payload: Record<string, unknown>) {
  if (typeof payload.proposedSummary === "string" && payload.proposedSummary.trim()) return payload.proposedSummary;
  if (typeof payload.objective === "string" && payload.objective.trim()) return payload.objective;
  return "Há uma ação aguardando sua autorização.";
}

export default async function Home() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) redirect("/sign-in");

  const state = await loadInitialState(authenticated.tenantId);
  const active = Number(state.summary.active_work);
  const blocked = Number(state.summary.blocked_work);
  const approvals = Number(state.summary.approvals);
  const verified = Number(state.summary.verified_count);
  const value = Number(state.summary.net_value_cents);
  const firstName = authenticated.user.name?.trim().split(/\s+/)[0] || "";

  const parts: string[] = [];
  if (active) parts.push(`${active} tarefa${active === 1 ? " está" : "s estão"} em andamento`);
  if (blocked) parts.push(`${blocked} ${blocked === 1 ? "está travada" : "estão travadas"}`);
  if (approvals) parts.push(`${approvals} decisão${approvals === 1 ? " precisa" : "ões precisam"} de você`);
  if (verified) parts.push(`${verified} resultado${verified === 1 ? " foi verificado" : "s foram verificados"}`);
  if (!parts.length) parts.push("Nada exige sua atenção agora");

  return (
    <AgesomaClient
      initial={{
        greeting: firstName ? `Olá, ${firstName}.` : "Olá.",
        brief: state.interruption
          ? `${state.interruption.summary} ${parts.join(". ")}. O que você quer que eu resolva?`
          : `${parts.join(". ")}. O que você quer que eu resolva?`,
        activeWork: active,
        verifiedResults: verified,
        verifiedValue: money(value),
        approval: state.approval ? {
          taskId: state.approval.id,
          summary: approvalSummary(state.approval.payload)
        } : null
      }}
    />
  );
}
