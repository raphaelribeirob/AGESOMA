import assert from "node:assert/strict";
import test from "node:test";
import { deriveBusinessState, rankInterventions } from "../src/business-brain.ts";

test("Business Model turns worsening evidence into a strained state", () => {
  const state = deriveBusinessState("sales", [
    {
      key: "leads-without-followup",
      label: "Leads sem acompanhamento",
      domain: "sales",
      direction: "worsening",
      severity: 0.9,
      confidence: 0.9,
      evidenceCount: 5
    },
    {
      key: "pipeline-aging",
      label: "Pipeline envelhecendo",
      domain: "sales",
      direction: "worsening",
      severity: 0.75,
      confidence: 0.8,
      evidenceCount: 3
    }
  ]);

  assert.equal(state.domain, "sales");
  assert.ok(state.healthScore < 60);
  assert.ok(state.confidence >= 0.5);
  assert.equal(state.primaryConstraint, "Leads sem acompanhamento");
});

test("Manager Model prioritizes evidence-backed aligned intervention", () => {
  const states = [deriveBusinessState("sales", [{
    key: "leads-without-followup",
    label: "Leads sem acompanhamento",
    domain: "sales",
    direction: "worsening",
    severity: 0.9,
    confidence: 0.9,
    evidenceCount: 5
  }])];

  const ranked = rankInterventions([
    {
      id: "weak",
      domain: "sales",
      title: "Ideia pouco comprovada",
      action: "business.work",
      resource: "crm",
      confidence: 0.4,
      urgency: 0.3,
      goalAlignment: 0.4,
      evidenceStrength: 0.35,
      reversible: true,
      requiresApproval: false
    },
    {
      id: "strong",
      domain: "sales",
      title: "Preparar recuperação dos leads esquecidos",
      action: "business.work",
      resource: "crm",
      confidence: 0.9,
      urgency: 0.9,
      goalAlignment: 0.9,
      evidenceStrength: 0.9,
      reversible: true,
      requiresApproval: false
    }
  ], states);

  assert.equal(ranked[0]?.id, "strong");
  assert.ok((ranked[0]?.priorityScore ?? 0) > (ranked[1]?.priorityScore ?? 0));
});

test("Manager Model filters interventions without sufficient evidence", () => {
  const ranked = rankInterventions([{
    id: "unsupported",
    domain: "general",
    title: "Ação sem evidência",
    action: "business.work",
    resource: null,
    confidence: 0.9,
    urgency: 0.9,
    goalAlignment: 0.9,
    evidenceStrength: 0.1,
    reversible: true,
    requiresApproval: false
  }]);

  assert.equal(ranked.length, 0);
});
