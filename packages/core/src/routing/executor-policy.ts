import type {
  ExecutorDecision,
  RequestPlan,
  TeamMemberForCoordination
} from "./types";
import { normalizeText } from "./text";

function memberWords(member: TeamMemberForCoordination) {
  return normalizeText([
    member.roleTitle,
    member.department ?? "",
    ...(member.responsibilities ?? []),
    ...(member.skills ?? [])
  ].join(" "));
}

export function decideExecutor(
  plan: RequestPlan,
  members: TeamMemberForCoordination[]
): ExecutorDecision {
  const active = members.filter(
    (member) => !member.availability || member.availability === "active"
  );
  const request = normalizeText(plan.originalRequest);

  for (const member of active) {
    const name = normalizeText(member.name);
    if (name.length >= 2 && request.includes(name)) {
      return {
        executorType: "human",
        teamMemberId: member.id,
        teamMemberName: member.name,
        reason: "Pessoa indicada no pedido.",
        confidence: 1
      };
    }
  }

  const requestWords = new Set(
    normalizeText(`${plan.originalRequest} ${plan.domain}`)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3)
  );

  const ranked = active
    .map((member) => {
      const description = memberWords(member);
      let score = 0;
      for (const word of requestWords) {
        if (description.includes(word)) score += 1;
      }
      return { member, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (best && best.score > 0 && (plan.mode === "act" || plan.mode === "commit")) {
    return {
      executorType: "human",
      teamMemberId: best.member.id,
      teamMemberName: best.member.name,
      reason: "Melhor correspondência entre responsabilidade e trabalho.",
      confidence: Math.min(0.9, 0.6 + best.score * 0.1)
    };
  }

  return {
    executorType: "hermes",
    teamMemberId: null,
    teamMemberName: null,
    reason: "Trabalho digital, de preparação ou de coordenação executado pela AGESOMA.",
    confidence: 0.85
  };
}
