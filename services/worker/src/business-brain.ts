import {
  deriveBusinessState,
  getActionPolicy,
  rankInterventions,
  type BusinessDomain,
  type BusinessSignal,
  type InterventionCandidate
} from "@agesoma/core";
import { sql } from "@agesoma/db";
import type { ProductTask } from "./product-output";

const DOMAINS = new Set<BusinessDomain>(["sales", "service", "operations", "finance", "marketing", "general"]);
const DIRECTIONS = new Set(["improving", "stable", "worsening", "unknown"] as const);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp01(value: number | null, fallback = 0) {
  return Math.max(0, Math.min(1, value ?? fallback));
}

function domain(value: unknown): BusinessDomain {
  return typeof value === "string" && DOMAINS.has(value as BusinessDomain)
    ? value as BusinessDomain
    : "general";
}

function evidenceCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  const item = record(value);
  return item ? Object.keys(item).length : 0;
}

function parseSignal(value: unknown): BusinessSignal | null {
  const item = record(value);
  if (!item) return null;
  const key = text(item.key);
  const label = text(item.label);
  const rawDirection = text(item.direction);
  if (!key || !label || !rawDirection || !DIRECTIONS.has(rawDirection as never)) return null;

  const observedAt = text(item.observedAt);
  const parsedObservedAt = observedAt && Number.isFinite(Date.parse(observedAt))
    ? new Date(observedAt).toISOString()
    : new Date().toISOString();

  return {
    key,
    label,
    domain: domain(item.domain),
    direction: rawDirection as BusinessSignal["direction"],
    severity: clamp01(number(item.severity)),
    confidence: clamp01(number(item.confidence)),
    // Evidence count is derived from the attached evidence payload, not accepted
    // as a model-asserted scalar.
    evidenceCount: evidenceCount(item.evidence),
    observedAt: parsedObservedAt,
    value: number(item.value),
    unit: text(item.unit)
  };
}

function recent(signal: BusinessSignal, now = Date.now()) {
  if (!signal.observedAt) return true;
  const at = Date.parse(signal.observedAt);
  if (!Number.isFinite(at)) return false;
  return now - at <= 30 * 24 * 60 * 60_000;
}

function mergeSignals(previous: BusinessSignal[], incoming: BusinessSignal[]) {
  const merged = new Map<string, BusinessSignal>();
  for (const signal of previous.filter((item) => recent(item))) merged.set(signal.key, signal);
  for (const signal of incoming) merged.set(signal.key, signal);
  return [...merged.values()]
    .sort((a, b) => Date.parse(b.observedAt ?? "") - Date.parse(a.observedAt ?? ""))
    .slice(0, 50);
}

function parsePreviousSignals(value: unknown): BusinessSignal[] {
  return Array.isArray(value)
    ? value.map(parseSignal).filter((item): item is BusinessSignal => Boolean(item))
    : [];
}

function buildCandidates(task: ProductTask, output: Record<string, unknown>): InterventionCandidate[] {
  const opportunities = Array.isArray(output.opportunities) ? output.opportunities : [];
  return opportunities.slice(0, 10).flatMap((raw, index) => {
    const item = record(raw);
    const proposed = record(item?.proposedAction);
    const title = text(item?.title);
    const action = text(proposed?.action);
    if (!item || !proposed || !title || !action) return [];

    const policy = getActionPolicy(action);
    if (!policy) return [];

    const evidence = item.evidence;
    const evidenceItems = evidenceCount(evidence);
    const evidenceStrength = evidenceItems === 0 ? 0 : Math.min(1, 0.35 + evidenceItems * 0.15);

    return [{
      id: text(item.id) ?? `${task.id}:${index}`,
      domain: domain(item.domain),
      title,
      action,
      resource: text(proposed.resource) ?? (typeof task.payload.resource === "string" ? task.payload.resource : null),
      confidence: clamp01(number(item.confidence)),
      urgency: clamp01(number(item.urgency), 0.5),
      goalAlignment: clamp01(number(item.goalAlignment), typeof task.payload.goalId === "string" ? 0.7 : 0.5),
      evidenceStrength,
      reversible: policy.reversible,
      requiresApproval: policy.riskClass === "R2" || policy.riskClass === "R3" || policy.riskClass === "R4",
      expectedValueCents: number(proposed.expectedValueCents),
      expectedCostCents: number(proposed.expectedCostCents),
      expectedLossCents: number(proposed.expectedLossCents),
      payload: proposed
    }];
  });
}

export async function updateBusinessBrain(task: ProductTask, output: Record<string, unknown>) {
  const parsedSignals = (Array.isArray(output.businessSignals) ? output.businessSignals : [])
    .map(parseSignal)
    .filter((item): item is BusinessSignal => Boolean(item));

  const states = [];
  const snapshotIds = new Map<BusinessDomain, string>();

  for (const currentDomain of DOMAINS) {
    const incoming = parsedSignals.filter((signal) => signal.domain === currentDomain);
    if (incoming.length === 0) continue;

    const [previous] = await sql<{ signals: unknown }>(`
      select signals
      from business_state_snapshots
      where tenant_id=$1 and domain=$2
      order by observed_at desc
      limit 1
    `, [task.tenant_id, currentDomain]);

    const state = deriveBusinessState(
      currentDomain,
      mergeSignals(parsePreviousSignals(previous?.signals), incoming)
    );
    states.push(state);

    const [snapshot] = await sql<{ id: string }>(`
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
    `, [
      task.tenant_id,
      task.id,
      state.domain,
      state.health,
      state.healthScore,
      state.confidence,
      state.primaryConstraint,
      state.signalCount,
      state.worseningSignals,
      state.improvingSignals,
      JSON.stringify(state.signals)
    ]);
    snapshotIds.set(currentDomain, snapshot.id);
  }

  const ranked = rankInterventions(buildCandidates(task, output), states).slice(0, 5);
  for (const candidate of ranked) {
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
    `, [
      task.tenant_id,
      task.id,
      typeof task.payload.goalId === "string" ? task.payload.goalId : null,
      snapshotIds.get(candidate.domain) ?? null,
      candidate.id,
      candidate.domain,
      candidate.title,
      candidate.action,
      candidate.resource,
      candidate.priorityScore,
      candidate.confidence,
      candidate.requiresApproval,
      JSON.stringify(candidate.rationale),
      JSON.stringify(candidate.payload ?? {})
    ]);
  }

  return { states, ranked };
}
