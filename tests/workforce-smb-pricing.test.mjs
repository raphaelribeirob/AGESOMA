import test from "node:test";
import assert from "node:assert/strict";
import {
  SMB_LAUNCH_PLANS, FREE_CEO_DIAGNOSTIC,
  quoteBrlWorkCredits, hypotheticalMonthlyContribution
} from "../packages/core/src/workforce-smb-pricing.ts";

test("four real executive identities are included in each proposed SME plan", () => {
  const plans = Object.values(SMB_LAUNCH_PLANS);
  assert.equal(plans.length, 3);
  assert.deepEqual(plans.map(p=>p.monthlyPriceCentsBrl), [4900,12900,24900]);
  assert.deepEqual(plans.map(p=>p.includedUsageCreditsCentsBrl), [800,3000,7500]);
  assert.deepEqual(plans.map(p=>p.maxConcurrentComputers), [1,2,4]);
  for (const plan of plans) {
    assert.equal(plan.executiveAgentCount, 4);
    assert.equal(plan.maximumUnapprovedOverageCentsBrl, 0);
    assert.ok(plan.includedUsageCreditsCentsBrl < plan.monthlyPriceCentsBrl);
  }
  assert.equal(FREE_CEO_DIAGNOSTIC.maxAutonomousTasks, 0);
  assert.equal(FREE_CEO_DIAGNOSTIC.maxActiveComputers, 0);
});

test("cost USD $0.05 converts to R$0.275 with illustrative FX and 10% buffer -> R$0.76 usage credits", () => {
  const r = quoteBrlWorkCredits(50000n,5500000,6000,1000);
  assert.equal(r.providerCostMicroBrl, 275000n);
  assert.equal(r.riskAdjustedCostMicroBrl, 302500n);
  assert.equal(r.customerCreditsCentsBrl, 76n);
});

test("R$0.05 price for a tiny US$0.0027-only text call is computed in BRL without early USD-cent rounding", () => {
  const r = quoteBrlWorkCredits(2700n,5500000,6000,1000);
  assert.equal(r.providerCostMicroBrl, 14850n);
  assert.equal(r.customerCreditsCentsBrl, 5n);
});

test("zero use charges no credits; bad FX, margin, negative costs and invalid reserves are rejected", () => {
  assert.equal(quoteBrlWorkCredits(0n,5500000).customerCreditsCentsBrl,0n);
  assert.throws(()=>quoteBrlWorkCredits(-1n,5500000),RangeError);
  assert.throws(()=>quoteBrlWorkCredits(100n,0),RangeError);
  assert.throws(()=>quoteBrlWorkCredits(100n,NaN),RangeError);
  assert.throws(()=>quoteBrlWorkCredits(100n,5500000,10000),RangeError);
  assert.throws(()=>quoteBrlWorkCredits(100n,5500000,6000,10001),RangeError);
});

test("R$49 monthly SME feasibility stays positive only in bounded hypothetical costs", () => {
  // Example: paddle 5% plus $0.50 at USD/BRL 5.50 => R$5.20,
  // included credits R$8 imply <= R$3.20 underlying cost at 60% usage margin,
  // fixed infra allocation R$6 per tenant. No tax/refunds/support labor modeled.
  const r = hypotheticalMonthlyContribution(SMB_LAUNCH_PLANS.essencial,320,520,600);
  assert.equal(r.contributionCentsBrl,3460n);
  assert.ok(r.contributionMarginBps > 7000n);
  // Heavy users make the subscription unprofitable if hard caps aren't enforced.
  const heavy = hypotheticalMonthlyContribution(SMB_LAUNCH_PLANS.essencial,7000,520,600);
  assert.ok(heavy.contributionCentsBrl < 0n);
});

test("hypothetical projected contribution in all three tiers excludes tax, refunds and customer support", () => {
  const inputs = [
    [SMB_LAUNCH_PLANS.essencial, 320, 520, 600],
    [SMB_LAUNCH_PLANS.crescimento, 1200, 920, 1200],
    [SMB_LAUNCH_PLANS.pro, 3000, 1520, 2500]
  ];
  const expected = [3460n,9580n,17880n];
  for (const [i,[plan, variable, fee, infra]] of inputs.entries()) {
    const q = hypotheticalMonthlyContribution(plan,variable,fee,infra);
    assert.equal(q.contributionCentsBrl,expected[i]);
    assert.ok(q.contributionMarginBps >= 7000n);
  }
});
