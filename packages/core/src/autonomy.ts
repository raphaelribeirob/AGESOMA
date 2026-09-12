import type { CapabilityScope } from "./action-registry";

export type AutonomyRule = {
  id: string;
  actionClass: string;
  destination: string | null;
  operation: string | null;
  resourcePattern: string | null;
  decision: "ALLOW" | "DENY";
  maxAmountCents: number | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

function matchText(rule: string | null, value: string | null) {
  if (!rule) return true;
  if (!value) return false;
  if (rule === "*") return true;
  if (rule.endsWith("*")) return value.startsWith(rule.slice(0, -1));
  return value === rule;
}

export function matchAutonomyRule(rule: AutonomyRule, scope: CapabilityScope, now = new Date()) {
  if (rule.revokedAt) return false;
  if (rule.expiresAt && rule.expiresAt.getTime() <= now.getTime()) return false;
  if (rule.actionClass !== scope.action) return false;
  if (!matchText(rule.destination, scope.destination)) return false;
  if (!matchText(rule.operation, scope.operation)) return false;
  if (!matchText(rule.resourcePattern, scope.resource)) return false;
  if (rule.maxAmountCents != null && scope.amountCents != null && scope.amountCents > rule.maxAmountCents) return false;
  return true;
}

export function resolveAutonomy(rules: AutonomyRule[], scope: CapabilityScope) {
  const matching = rules.filter((rule) => matchAutonomyRule(rule, scope));
  const deny = matching.find((rule) => rule.decision === "DENY");
  if (deny) return { decision: "DENY" as const, ruleId: deny.id };
  const allow = matching.find((rule) => rule.decision === "ALLOW");
  if (allow) return { decision: "ALLOW" as const, ruleId: allow.id };
  return { decision: "NONE" as const, ruleId: null };
}
