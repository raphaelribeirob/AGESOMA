import assert from "node:assert/strict";
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { test } from "node:test";
import { verifyExecutorAttestation } from "../apps/web/lib/executive-executor-readiness.ts";
import { runExecutorDiagnosticWithTransport, ExecutorDiagnosticError } from "../apps/web/lib/executive-executor-diagnostic.ts";

const origin = process.env.AGESOMA_QA_EXECUTOR_ORIGIN ?? "http://127.0.0.1:8091";
const secret = process.env.AGESOMA_EXECUTOR_ATTEST_SECRET;
const workers = ["executive","finance","growth","product"];
if (!secret || secret.length < 32) throw new Error("CI-only executor secret required");
if (origin !== "http://127.0.0.1:8091") throw new Error("Do not test against customer infrastructure");

function mac(value) {
  return createHmac("sha256",secret).update(JSON.stringify(value)).digest("hex");
}
async function post(path,data) {
  const response=await fetch(origin+path,{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json"},
    body:JSON.stringify(data),
    signal:AbortSignal.timeout(90000)
  });
  const text=await response.text();
  let json;
  try {json=JSON.parse(text);} catch {json={error:text.slice(0,300)};}
  return {status:response.status,json};
}
function task(tenantId,taskId,executive,action="qa.browser") {
  const value={
    protocol:"agesoma-executor-v1",tenantId,taskId,executive,action,
    expiresAt:new Date(Date.now()+20_000).toISOString(),
    nonce:randomBytes(16).toString("hex")
  };
  return {...value,signature:mac(value)};
}

test("running host proves four real, distinct and signed executive sessions",async()=>{
  const nonce=randomBytes(24).toString("hex");
  const r=await post("/v1/attest",{protocol:"agesoma-executor-v1",nonce});
  assert.equal(r.status,200,JSON.stringify(r.json));
  const check=verifyExecutorAttestation(r.json,nonce,secret,Date.now());
  assert.equal(check.ready,true,JSON.stringify(check));
  if(check.ready) {
    assert.deepEqual(Object.keys(check.sessionIds),workers);
    assert.equal(new Set(Object.values(check.sessionIds)).size,4);
  }
});

test("actual browser task executes under executive and returns tamper-evident receipt",async()=>{
  const tenantId=randomUUID(),taskId=randomUUID();
  const request=task(tenantId,taskId,"executive");
  const result=await post("/v1/execute",request);
  assert.equal(result.status,200,JSON.stringify(result.json));
  const receipt=result.json;
  const {signature,...signed}=receipt;
  assert.equal(signature,mac(signed));
  assert.equal(receipt.taskId,taskId);
  assert.equal(receipt.tenantId,tenantId);
  assert.equal(receipt.executive,"executive");
  assert.equal(receipt.status,"completed");
  assert.equal(receipt.proof.browser,"chromium");
  assert.equal(receipt.proof.dom,"executed");
  assert.match(receipt.proof.image_sha256,/^[a-f0-9]{64}$/);
  assert.ok(receipt.proof.image_bytes>1000);
  assert.equal(receipt.proof.external_actions,0);
  const replay=await post("/v1/execute",task(tenantId,taskId,"executive"));
  assert.equal(replay.status,409,JSON.stringify(replay.json));
});

test("finance agent has its own real browser session and separate receipt",async()=>{
  const tenantId=randomUUID(),taskId=randomUUID();
  const r=await post("/v1/execute",task(tenantId,taskId,"finance"));
  assert.equal(r.status,200,JSON.stringify(r.json));
  assert.equal(r.json.executive,"finance");
  assert.equal(r.json.signature,mac((({signature,...value})=>value)(r.json)));
});

test("executor refuses forged signature, unapproved action, invalid company IDs and expired grants",async()=>{
  const tenantId=randomUUID(),taskId=randomUUID();
  const malformed=[
    {...task(tenantId,taskId,"growth"),signature:"0".repeat(64)},
    task(tenantId,taskId,"growth","shell.arbitrary"),
    task(tenantId,taskId,"unknown"),
    task("invalid",taskId,"product"),
    task(tenantId,"invalid","product"),
    {...task(tenantId,taskId,"product"),expiresAt:new Date(Date.now()-90_000).toISOString()}
  ];
  for(const req of malformed) {
    const res=await post("/v1/execute",req);
    assert.ok([400,403].includes(res.status),JSON.stringify({req:{action:req.action,executive:req.executive},res}));
  }
  const invalidAttest=await post("/v1/attest",{protocol:"agesoma-executor-v1",nonce:"broken"});
  assert.equal(invalidAttest.status,400);
});

test("AGESOMA web diagnostic bridge verifies real sandbox receipt, session and offline scope",async()=>{
  const nonce=randomBytes(24).toString("hex");
  const attested=await post("/v1/attest",{protocol:"agesoma-executor-v1",nonce});
  assert.equal(attested.status,200);
  const check=verifyExecutorAttestation(attested.json,nonce,secret,Date.now());
  assert.equal(check.ready,true);
  if(!check.ready)throw new Error("four-sandbox attestation failed");
  const tenantId=randomUUID();
  const report=await runExecutorDiagnosticWithTransport({
    tenantId,executive:"growth",expectedSessionId:check.sessionIds.growth,secret
  },async body=>{
    const res=await post("/v1/execute",body);
    assert.equal(res.status,200,JSON.stringify(res.json));
    return res.json;
  });
  assert.equal(report.tenantId,tenantId);
  assert.equal(report.executive,"growth");
  assert.equal(report.sessionId,check.sessionIds.growth);
  assert.equal(report.verified,true);
  assert.equal(report.scope,"offline_test_page_only");
  assert.match(report.screenshotSha256,/^[a-f0-9]{64}$/);
});

test("AGESOMA client rejects tampered execution evidence and another session",async()=>{
  const tenantId=randomUUID();
  const ctx={tenantId,executive:"product",expectedSessionId:"session_known_not_pilot_1234",secret};
  const invalid={
    protocol:"agesoma-executor-v1",tenantId,taskId:randomUUID(),executive:"product",
    action:"qa.browser",sessionId:ctx.expectedSessionId,status:"completed",
    proof:{status:"success",browser:"chromium",dom:"executed",
      image_sha256:"0".repeat(64),image_bytes:6000,external_actions:0},
    finishedAt:new Date().toISOString()
  };
  for (const forged of [
    {...invalid,signature:"0".repeat(64)},
    {...invalid,signature:mac(invalid)},
    {...invalid,sessionId:"session_other_123456789"}
  ]){
    await assert.rejects(
      runExecutorDiagnosticWithTransport(ctx,async()=>forged),
      e=>e instanceof ExecutorDiagnosticError && e.kind==="invalid_receipt"
    );
  }
});
