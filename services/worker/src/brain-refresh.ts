import {
  deriveBusinessState,
  getActionPolicy,
  rankInterventions,
  type BusinessDomain,
  type BusinessSignal,
  type InterventionCandidate
} from "@agesoma/core";
import { sql } from "@agesoma/db";

const DOMAINS: BusinessDomain[] = ["sales", "service", "operations", "finance", "marketing", "general"];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numeric(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp01(value: number | null, fallback = 0) {
  return Math.max(0, Math.min(1, value ?? fallback));
}

function domainFromPayload(payload: unknown): BusinessDomain {
  const requestPlan = record(record(payload)?.requestPlan);
  const value = text(requestPlan?.domain);
  return value && DOMAINS.includes(value as BusinessDomain) ? value as BusinessDomain : "general";
}

function evidenceSize(value: unknown) {
  if (Array.isArray(value)) return value.length;
  const item = record(value);
  return item ? Object.keys(item).length : 0;
}

type OpportunityRow = {
  id: string;
  source_task_id: string | null;
  goal_id: string | null;
  title: string;
  proposed_action: Record<string, unknown>;
  evidence: Record<string, unknown>;
  confidence: number | string;
  created_at: Date | string;
  task_payload: Record<string, unknown> | null;
};

type OutcomeRow = {
  id: string;
  task_id: string | null;
  outcome_type: string;
  attribution_confidence: number | string;
  evidence: Record<string, unknown>;
  verified_at: Date | string;
  task_payload: Record<string, unknown> | null;
};

export async function refreshBusinessBrain(tenantId: string) {
  const [opportunities, outcomes] = await Promise.all([
    sql<OpportunityRow>(`
      select o.id, o.source_task_id, o.goal_id, o.title, o.proposed_action,
             o.evidence, o.confidence, o.created_at, t.payload as task_payload
      from opportunities o
      left join tasks t on t.id=o.source_task_id and t.tenant_id=o.tenant_id
      where o.tenant_id=$1 and o.status='open' and o.created_at >= now() - interval '30 days'
      order by o.created_at desc
      limit 100
    `, [tenantId]),
    sql<OutcomeRow>(`
      select e.id, e.task_id, e.outcome_type, e.attribution_confidence,
             e.evidence, e.verified_at, t.payload as task_payload
      from outcome_events e
      left join tasks t on t.id=e.task_id and t.tenant_id=e.tenant_id
      where e.tenant_id=$1 and e.verified_at >= now() - interval '30 days'
      order by e.verified_at desc
      limit 100
    `, [tenantId])
  ]);

  const signals: BusinessSignal[] = [];
  const sourceByDomain = new Map<BusinessDomain, string>();

  for (const item of opportunities) {
    const currentDomain = domainFromPayload(item.task_payload);
    if (item.source_task_id && !sourceByDomain.has(currentDomain)) sourceByDomain.set(currentDomain, item.source_task_id);
    const confidence = clamp01(numeric(item.confidence));
    signals.push({
      key: `opportunity:${item.id}`,
      label: item.title,
      domain: currentDomain,
      direction: "worsening",
      severity: Math.max(0.2, confidence),
      confidence,
      evidenceCount: evidenceSize(item.evidence),
      observedAt: new Date(item.created_at).toISOString()
    });
  }

  for (const item of outcomes) {
    const currentDomain = domainFromPayload(item.task_payload);
    if (item.task_id && !sourceByDomain.has(currentDomain)) sourceByDomain.set(currentDomain, item.task_id);
    const confidence = clamp01(numeric(item.attribution_confidence));
    signals.push({
      key: `verified:${item.id}`,
      label: `Resultado verificado: ${item.outcome_type}`,
      domain: currentDomain,
      direction: "improving",
      severity: Math.max(0.15, confidence),
      confidence,
      evidenceCount: evidenceSize(item.evidence),
      observedAt: new Date(item.verified_at).toISOString()
    });
  }

  const states = DOMAINS
    .map((currentDomain) => deriveBusinessState(currentDomain, signals))
    .filter((state) => state.signalCount > 0);

  const snapshotIds = new Map<BusinessDomain, string>();
  for (const state of states) {
    const [row] = await sql<{ id: string }>(`
      insert into business_state_snapshots (
        tenant_id, source_task_id, domain, health, health_score, confidence,
        primary_constraint, signal_count, worsening_signals, improving_signals,
        signals, observed_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,now())
      on conflict (tenant_id, source_task_id, domain) do update set
        health=excluded.health,
        health_score=excluded.health_score,
        confidence=excluded.confidence,
        primary_constraint=excluded.primary_constraint,
        signal_count=excluded.signal_count,
        worsening_signals=excluded.worsening_signals,
        improving_signals=excluded.improving_signals,
        signals=excluded.signals,
        observed_at=excluded.observed_at
      returning id
    `, [tenantId, sourceByDomain.get(state.domain) ?? null, state.domain, state.health,
      state.healthScore, state.confidence, state.primaryConstraint, state.signalCount,
      state.worseningSignals, state.improvingSignals, JSON.stringify(state.signals)]);
    snapshotIds.set(state.domain, row.id);
  }

  const candidates: InterventionCandidate[] = opportunities.flatMap((item) => {
    const proposed = record(item.proposed_action);
    const action = text(proposed?.action);
    if (!proposed || !action) return [];
    const policy = getActionPolicy(action);
    if (!policy) return [];
    const evidenceItems = evidenceSize(item.evidence);
    return [{
      id: item.id,
      domain: domainFromPayload(item.task_payload),
      title: item.title,
      action,
      resource: text(proposed.resource),
      confidence: clamp01(numeric(item.confidence)),
      urgency: clamp01(numeric(proposed.urgency), 0.5),
      goalAlignment: item.goal_id ? 0.75 : 0.5,
      evidenceStrength: evidenceItems === 0 ? 0 : Math.min(1, 0.35 + evidenceItems * 0.15),
      reversible: policy.reversible,
      requiresApproval: policy.riskClass === "R2" || policy.riskClass === "R3" || policy.riskClass === "R4",
      payload: proposed
    }];
  });

  const ranked = rankInterventions(candidates, states).slice(0, 5);
  for (const candidate of ranked) {
    const source = opportunities.find((item) => item.id === candidate.id);
    if (!source) continue;
    await sql(`
      insert into intervention_decisions (
        tenant_id, source_task_id, goal_id, state_snapshot_id, candidate_key,
        domain, title, action_type, resource, priority_score, confidence,
        requires_approval, rationale, proposed_payload, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,'proposed')
      on conflict (tenant_id, source_task_id, candidate_key) do update set
        state_snapshot_id=excluded.state_snapshot_id,
        priority_score=excluded.priority_score,
        confidence=excluded.confidence,
        requires_approval=excluded.requires_approval,
        rationale=excluded.rationale,
        proposed_payload=excluded.proposed_payload,
        updated_at=now()
    `, [tenantId, source.source_task_id, source.goal_id, snapshotIds.get(candidate.domain) ?? null,
      candidate.id, candidate.domain, candidate.title, candidate.action, candidate.resource,
      candidate.priorityScore, candidate.confidence, candidate.requiresApproval,
      JSON.stringify(candidate.rationale), JSON.stringify(candidate.payload ?? {})]);
  }

  return { states, ranked };
}
