export type BusinessDomain = "sales" | "service" | "operations" | "finance" | "marketing" | "general";
export type SignalDirection = "improving" | "stable" | "worsening" | "unknown";
export type BusinessHealth = "healthy" | "watch" | "strained" | "critical" | "unknown";

export type BusinessSignal = {
  key: string;
  label: string;
  domain: BusinessDomain;
  direction: SignalDirection;
  severity: number;
  confidence: number;
  evidenceCount: number;
  observedAt?: string | null;
  value?: number | null;
  unit?: string | null;
};

export type BusinessState = {
  domain: BusinessDomain;
  health: BusinessHealth;
  healthScore: number;
  confidence: number;
  primaryConstraint: string | null;
  signalCount: number;
  worseningSignals: number;
  improvingSignals: number;
  signals: BusinessSignal[];
};

export type InterventionCandidate = {
  id: string;
  domain: BusinessDomain;
  title: string;
  action: string;
  resource: string | null;
  confidence: number;
  urgency: number;
  goalAlignment: number;
  evidenceStrength: number;
  reversible: boolean;
  requiresApproval: boolean;
  expectedValueCents?: number | null;
  expectedCostCents?: number | null;
  expectedLossCents?: number | null;
  payload?: Record<string, unknown>;
};

export type RankedIntervention = InterventionCandidate & {
  priorityScore: number;
  rationale: string[];
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function normalizedSignal(signal: BusinessSignal): BusinessSignal {
  return {
    ...signal,
    severity: clamp01(signal.severity),
    confidence: clamp01(signal.confidence),
    evidenceCount: Math.max(0, Math.trunc(signal.evidenceCount || 0))
  };
}

function healthFromScore(score: number, confidence: number): BusinessHealth {
  if (confidence < 0.25) return "unknown";
  if (score >= 80) return "healthy";
  if (score >= 60) return "watch";
  if (score >= 35) return "strained";
  return "critical";
}

export function deriveBusinessState(domain: BusinessDomain, inputSignals: BusinessSignal[]): BusinessState {
  const signals = inputSignals
    .filter((signal) => signal.domain === domain)
    .map(normalizedSignal)
    .filter((signal) => signal.key.trim().length > 0 && signal.label.trim().length > 0)
    .slice(0, 50);

  if (signals.length === 0) {
    return {
      domain,
      health: "unknown",
      healthScore: 50,
      confidence: 0,
      primaryConstraint: null,
      signalCount: 0,
      worseningSignals: 0,
      improvingSignals: 0,
      signals: []
    };
  }

  let weightedSeverity = 0;
  let totalWeight = 0;
  let confidenceWeight = 0;

  for (const signal of signals) {
    const directionWeight = signal.direction === "worsening"
      ? 1
      : signal.direction === "improving"
        ? -0.6
        : signal.direction === "stable"
          ? 0.15
          : 0.35;
    const evidenceWeight = Math.min(1, Math.log2(signal.evidenceCount + 1) / 3);
    const weight = Math.max(0.05, signal.confidence * (0.5 + 0.5 * evidenceWeight));
    weightedSeverity += signal.severity * directionWeight * weight;
    totalWeight += weight;
    confidenceWeight += signal.confidence * (0.5 + 0.5 * evidenceWeight);
  }

  const pressure = totalWeight > 0 ? weightedSeverity / totalWeight : 0;
  const healthScore = clampScore(82 - pressure * 70);
  const confidence = clamp01(confidenceWeight / signals.length);

  const primary = signals
    .filter((signal) => signal.direction === "worsening" || signal.direction === "unknown")
    .sort((a, b) => (b.severity * b.confidence) - (a.severity * a.confidence))[0] ?? null;

  return {
    domain,
    health: healthFromScore(healthScore, confidence),
    healthScore,
    confidence,
    primaryConstraint: primary?.label ?? null,
    signalCount: signals.length,
    worseningSignals: signals.filter((signal) => signal.direction === "worsening").length,
    improvingSignals: signals.filter((signal) => signal.direction === "improving").length,
    signals
  };
}

function economicsSignal(candidate: InterventionCandidate) {
  const value = candidate.expectedValueCents;
  const cost = candidate.expectedCostCents;
  const loss = candidate.expectedLossCents;
  if (value == null || cost == null || loss == null) return 0.5;
  const net = value - cost - loss;
  if (net <= 0) return 0;
  if (value <= 0) return 0.5;
  return clamp01(net / value);
}

export function scoreIntervention(candidate: InterventionCandidate, state?: BusinessState | null): RankedIntervention {
  const confidence = clamp01(candidate.confidence);
  const urgency = clamp01(candidate.urgency);
  const goalAlignment = clamp01(candidate.goalAlignment);
  const evidenceStrength = clamp01(candidate.evidenceStrength);
  const economics = economicsSignal(candidate);
  const reversibility = candidate.reversible ? 1 : 0.35;
  const statePressure = state && state.health !== "unknown"
    ? clamp01((100 - state.healthScore) / 100)
    : 0.35;

  const score = 100 * (
    0.23 * confidence +
    0.19 * evidenceStrength +
    0.18 * urgency +
    0.16 * goalAlignment +
    0.10 * statePressure +
    0.08 * economics +
    0.06 * reversibility
  );

  const rationale: string[] = [];
  if (evidenceStrength >= 0.7) rationale.push("evidência forte");
  if (confidence >= 0.7) rationale.push("alta confiança");
  if (urgency >= 0.7) rationale.push("urgência alta");
  if (goalAlignment >= 0.7) rationale.push("forte alinhamento com a meta");
  if (statePressure >= 0.6) rationale.push("atua sobre uma área pressionada");
  if (candidate.reversible) rationale.push("trabalho reversível");
  if (candidate.requiresApproval) rationale.push("exige decisão do dono antes do efeito externo");

  return {
    ...candidate,
    confidence,
    urgency,
    goalAlignment,
    evidenceStrength,
    priorityScore: clampScore(score),
    rationale
  };
}

export function rankInterventions(candidates: InterventionCandidate[], states: BusinessState[] = []) {
  const byDomain = new Map(states.map((state) => [state.domain, state]));
  return candidates
    .filter((candidate) => candidate.id.trim() && candidate.title.trim() && candidate.action.trim())
    .map((candidate) => scoreIntervention(candidate, byDomain.get(candidate.domain)))
    .filter((candidate) => candidate.evidenceStrength >= 0.35 && candidate.confidence >= 0.35)
    .sort((a, b) => b.priorityScore - a.priorityScore || b.confidence - a.confidence);
}

export function chooseNextIntervention(candidates: InterventionCandidate[], states: BusinessState[] = []) {
  return rankInterventions(candidates, states)[0] ?? null;
}
