export type RiskClass = "R0" | "R1" | "R2" | "R3" | "R4";
export type SentinelDecision = "ALLOW" | "REVIEW" | "DENY";

export interface ActionRequest {
  type: string;
  riskClass: RiskClass;
  reversible: boolean;
  external: boolean;
  hasScopedGrant: boolean;
}

export interface SentinelResult {
  decision: SentinelDecision;
  reason: string;
}

export function evaluateSentinel(action: ActionRequest): SentinelResult {
  if (action.riskClass === "R4") return { decision: "DENY", reason: "R4 actions are prohibited by default." };
  if (action.riskClass === "R0" || action.riskClass === "R1") return { decision: "ALLOW", reason: "Read-only or reversible internal action." };
  if (action.riskClass === "R2" && action.hasScopedGrant) return { decision: "ALLOW", reason: "Bounded external action covered by a scoped grant." };
  if (action.riskClass === "R2") return { decision: "REVIEW", reason: "External action requires owner approval until a scoped grant exists." };
  return { decision: "REVIEW", reason: "Consequential action requires explicit approval." };
}
