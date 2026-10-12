import test from "node:test";
import assert from "node:assert/strict";
import {mintSupportSession,verifySupportSession} from "../src/support-session.ts";
const slug="s-"+"1".repeat(26),secret="0123456789abcdef".repeat(4),now=1780000000000;
test("signed sessions are tenant-scoped, tamper-resistant and expire",()=>{
 const token=mintSupportSession(slug,secret,now);
 const value=verifySupportSession(slug,token,secret,now);
 assert.match(value,/^[a-f0-9]{64}$/);
 assert.equal(verifySupportSession("s-"+"2".repeat(26),token,secret,now),null);
 assert.equal(verifySupportSession(slug,token.replace(/.$/,"0"),secret,now),null);
 assert.equal(verifySupportSession(slug,token,secret,now+15*24*3600*1000),null);
 assert.equal(verifySupportSession(slug,token,"weak",now),null);
});
