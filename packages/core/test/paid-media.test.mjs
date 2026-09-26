import assert from "node:assert/strict";
import test from "node:test";
import { getActionPolicy } from "../src/action-registry.ts";

test("paid media reads are low risk", () => {
  const policy = getActionPolicy("paid_media.read");
  assert.equal(policy?.riskClass, "R0");
  assert.equal(policy?.external, true);
});

test("creating a paused paid media object requires explicit external approval", () => {
  for (const action of [
    "paid_media.create_campaign",
    "paid_media.create_adset",
    "paid_media.create_ad",
    "paid_media.update_ad_creative",
    "paid_media.pause_campaign"
  ]) {
    assert.equal(getActionPolicy(action)?.riskClass, "R2");
  }
});

test("paid media actions capable of spending money are R3", () => {
  for (const action of [
    "paid_media.enable_campaign",
    "paid_media.set_campaign_budget",
    "paid_media.set_adset_budget"
  ]) {
    assert.equal(getActionPolicy(action)?.riskClass, "R3");
  }
});
