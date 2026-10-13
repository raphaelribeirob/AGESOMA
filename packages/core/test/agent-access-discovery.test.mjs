import assert from "node:assert/strict";
import test from "node:test";
import {AGESOMA_AGENT_DISCOVERY} from "../src/agent-access-discovery.ts";
test("agent discovery fails closed: no implicit authentication, scopes or external tools",()=>{
 const spec=AGESOMA_AGENT_DISCOVERY;
 assert.equal(spec.security.personalAgentIdentity,"not_implemented");
 assert.equal(spec.security.userConsent,"not_implemented");
 assert.equal(spec.security.tokensIssued,false);
 assert.deepEqual(spec.security.delegatedScopes,[]);
 for(const capability of spec.capabilities){
  assert.equal(capability.delegatedAgentAccess,false);
  assert.equal(capability.externallyCallable,false);
  assert.deepEqual(capability.actions,[]);
 }
});
