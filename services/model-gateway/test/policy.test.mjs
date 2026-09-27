import assert from "node:assert/strict";
import test from "node:test";
import { parseModelRoute } from "../src/policy.ts";

test("model gateway allows only inference surfaces", () => {
  assert.deepEqual(parseModelRoute("/openai/v1/responses"), {
    provider:"openai",
    host:"api.openai.com",
    path:"/v1/responses",
    upstreamPath:"/v1/responses"
  });
  assert.equal(parseModelRoute("/anthropic/v1/messages").provider,"anthropic");
  assert.equal(parseModelRoute("/nous/v1/chat/completions").provider,"nous");
});

test("model gateway preserves safe query strings on model listing", () => {
  const route=parseModelRoute("/openai/v1/models?limit=10");
  assert.equal(route.upstreamPath,"/v1/models?limit=10");
});

test("model gateway rejects credential and account-management endpoints", () => {
  for(const path of [
    "/openai/v1/files",
    "/openai/v1/fine_tuning/jobs",
    "/openai/v1/batches",
    "/anthropic/v1/organizations",
    "/nous/v1/files",
    "/proxy/https://example.com"
  ]){
    assert.throws(()=>parseModelRoute(path));
  }
});
