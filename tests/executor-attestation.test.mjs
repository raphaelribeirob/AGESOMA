import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  REQUIRED_EXECUTIVE_WORKERS, signExecutorAttestation,
  verifyExecutorAttestation, validateExecutorEndpoint, probeExecutiveExecutor
} from "../apps/web/lib/executive-executor-readiness.ts";

const root=path.resolve(import.meta.dirname,"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const secret="test_only_dummy_executor_secret_123456789ABC";
const now=Date.parse("2026-10-17T12:00:00.000Z");
const nonce="c".repeat(48);
function attestation(overrides={}){
  const source={
    protocol:"agesoma-executor-v1",nonce,engine:"opensandbox",
    isolation:"agent",capabilities:["browser","terminal","filesystem"],
    sessions:{executive:"session_exec_01",finance:"session_fin_02",growth:"session_grow_03",product:"session_prod_04"},
    expiresAt:new Date(now+10_000).toISOString(),...overrides
  };
  return {...source,signature:signExecutorAttestation(source,secret)};
}
test("GrokBot-like roles need four unique signed agent desktop sessions",()=>{
  assert.deepEqual(REQUIRED_EXECUTIVE_WORKERS,["executive","finance","growth","product"]);
  const verified=verifyExecutorAttestation(attestation(),nonce,secret,now);
  assert.equal(verified.ready,true);
  if(verified.ready){
    assert.equal(verified.engine,"opensandbox");
    assert.equal(Object.values(verified.sessionIds).length,4);
  }
});
test("missing, forged, replayed, stale or future attestation is always rejected",()=>{
  const base=attestation();
  const inputs=[
    undefined,null,{},[],"healthy",
    {...base,signature:"0".repeat(64)},
    {...base,nonce:"wrong-nonce"},
    attestation({nonce:"wrong-nonce"}),
    attestation({expiresAt:new Date(now-1).toISOString()}),
    attestation({expiresAt:new Date(now+60_000).toISOString()}),
    attestation({engine:"docker"}),
    attestation({isolation:"tenant"}),
    attestation({capabilities:["browser","terminal"]}),
    attestation({sessions:{...base.sessions,product:"session_exec_01"}}),
    attestation({sessions:{...base.sessions,unapproved:"shadow_session"}}),
  ];
  for(const value of inputs)assert.deepEqual(
    verifyExecutorAttestation(value,nonce,secret,now),
    {ready:false,reason:"invalid_attestation"}
  );
});
test("only trusted HTTPS origin can be configured, no local/host/user credentials",()=>{
  for(const url of [
    "http://executor.example.com/","https://localhost/","https://127.0.0.1/",
    "https://[::1]/","https://admin:password@executor.example.com/",
    "https://executor.internal/","https://executor.example.com:8443/",
    "https://executor.example.com/path","https://executor.example.com/?token=123",
    "file:///root/secret","javascript:alert(1)","notaurl",
  ])assert.equal(validateExecutorEndpoint(url),null,url);
  assert.equal(validateExecutorEndpoint("https://executor.example.com/")?.hostname,"executor.example.com");
});
test("not configured, malformed config and unreachable executor are fail-closed",async()=>{
  assert.deepEqual(await probeExecutiveExecutor(undefined,undefined,now),{ready:false,reason:"not_configured"});
  assert.deepEqual(await probeExecutiveExecutor("http://bad.example.com",secret,now),{ready:false,reason:"invalid_configuration"});
  const oldFetch=globalThis.fetch;
  try{
    globalThis.fetch=async()=>{throw new Error("Connection refused");};
    assert.deepEqual(
      await probeExecutiveExecutor("https://executor.example.com/",secret,now),
      {ready:false,reason:"unreachable"}
    );
  }finally{globalThis.fetch=oldFetch;}
});
test("signed challenge verifies positive probe; blocked forged response and redirect",async()=>{
  const oldFetch=globalThis.fetch;
  try{
    globalThis.fetch=async(_url,opts)=>{
      const challenge=JSON.parse(opts.body);
      assert.equal(challenge.protocol,"agesoma-executor-v1");
      assert.equal(opts.method,"POST");
      assert.equal(opts.redirect,"error");
      assert.equal(opts.cache,"no-store");
      assert.equal(challenge.nonce.length,48);
      const signed=attestation({nonce:challenge.nonce});
      return {ok:true,headers:new Headers(),text:async()=>JSON.stringify(signed)};
    };
    assert.equal((await probeExecutiveExecutor("https://executor.example.com/",secret,now)).ready,true);
    globalThis.fetch=async()=>({ok:true,headers:new Headers(),text:async()=>JSON.stringify({ready:true})});
    assert.deepEqual(
      await probeExecutiveExecutor("https://executor.example.com/",secret,now),
      {ready:false,reason:"invalid_attestation"}
    );
    globalThis.fetch=async()=>({ok:false,headers:new Headers(),text:async()=>""});
    assert.deepEqual(
      await probeExecutiveExecutor("https://executor.example.com/",secret,now),
      {ready:false,reason:"unreachable"}
    );
  }finally{globalThis.fetch=oldFetch;}
});
test("new autonomous work cannot be queued solely because a database row says persistent",()=>{
  const route=read("apps/web/app/api/agesoma/route.ts");
  const worker=read("apps/web/lib/persistent-worker.ts");
  const screen=read("apps/web/app/workforce/workforce-preview.tsx");
  const page=read("apps/web/app/workforce/page.tsx");
  assert.match(worker,/runtime_strategy:\s*"shared_cell"/);
  assert.ok(route.indexOf("const executorReadiness =")<route.indexOf("const selectedWorker ="));
  assert.ok(route.indexOf("if (selectedAgent && !executorReadiness?.ready)")<route.indexOf("insert into workflows"));
  assert.match(route,/pedido NÃO foi enfileirado/);
  assert.doesNotMatch(route,/set runtime_mode='personal_persistent',persistent_home=true/);
  assert.match(route,/A tarefa está na fila; execução e resultado ainda precisam ser comprovados/);
  assert.match(route,/task\.payload\.digitalAgent \|\| task\.payload\.persistentWorker/);
  assert.match(screen,/Nenhum computador executivo verificado/);
  assert.match(page,/probeExecutiveExecutor/);
  assert.doesNotMatch(screen,/agente trabalhando neste momento\./i);
});
