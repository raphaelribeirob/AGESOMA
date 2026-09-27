import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  resolveWorkcellServiceBaseUrl,
  workcellControlHeaders,
  workcellControlToken
} from "../src/workcell-control.ts";

function restore(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("derives tenant-scoped gateway token and service URL", () => {
  const oldTemplate=process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE;
  const oldMaster=process.env.WORKCELL_CONTROL_MASTER_SECRET;
  const oldDirect=process.env.AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK;
  try {
    process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE="http://cell-control-{tenantId}:8090";
    process.env.WORKCELL_CONTROL_MASTER_SECRET="test-master-secret";
    process.env.AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK="false";

    const tenantId="00000000-0000-0000-0000-000000000001";
    const expected=createHmac("sha256","test-master-secret")
      .update(`workcell-control:${tenantId}`)
      .digest("hex");

    assert.equal(workcellControlToken(tenantId),expected);
    assert.deepEqual(workcellControlHeaders(tenantId),{"x-agesoma-workcell-token":expected});
    assert.equal(
      resolveWorkcellServiceBaseUrl(tenantId,"hermes"),
      `http://cell-control-${tenantId}:8090/v1/hermes`
    );
    assert.equal(
      resolveWorkcellServiceBaseUrl(tenantId,"broker"),
      `http://cell-control-${tenantId}:8090/v1/broker`
    );
    assert.equal(
      resolveWorkcellServiceBaseUrl(tenantId,"egress"),
      `http://cell-control-${tenantId}:8090/v1/egress`
    );
  } finally {
    restore("WORKCELL_CONTROL_BASE_URL_TEMPLATE",oldTemplate);
    restore("WORKCELL_CONTROL_MASTER_SECRET",oldMaster);
    restore("AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK",oldDirect);
  }
});

test("fails closed when gateway is unavailable and direct access is disabled", () => {
  const oldTemplate=process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE;
  const oldMaster=process.env.WORKCELL_CONTROL_MASTER_SECRET;
  const oldDirect=process.env.AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK;
  const oldHermes=process.env.HERMES_BASE_URL_TEMPLATE;
  try {
    delete process.env.WORKCELL_CONTROL_BASE_URL_TEMPLATE;
    delete process.env.WORKCELL_CONTROL_MASTER_SECRET;
    process.env.AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK="false";
    process.env.HERMES_BASE_URL_TEMPLATE="http://hermes-{tenantId}:8642";

    assert.throws(
      ()=>resolveWorkcellServiceBaseUrl("00000000-0000-0000-0000-000000000001","hermes"),
      /control gateway is required/
    );
  } finally {
    restore("WORKCELL_CONTROL_BASE_URL_TEMPLATE",oldTemplate);
    restore("WORKCELL_CONTROL_MASTER_SECRET",oldMaster);
    restore("AGESOMA_ALLOW_DIRECT_WORKCELL_NETWORK",oldDirect);
    restore("HERMES_BASE_URL_TEMPLATE",oldHermes);
  }
});
