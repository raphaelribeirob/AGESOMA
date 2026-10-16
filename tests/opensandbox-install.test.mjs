import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const install = path.join(root, "scripts/opensandbox/install.sh");
const shellSmoke = path.join(root, "scripts/opensandbox/smoke.sh");
const pySmoke = path.join(root, "scripts/opensandbox/smoke.py");

test("bootstrap and smoke scripts parse; Python pilot smoke parses", () => {
  execFileSync("bash", ["-n", install]);
  execFileSync("bash", ["-n", shellSmoke]);
  execFileSync("python3", ["-c", "import ast,sys; ast.parse(open(sys.argv[1],encoding='utf-8').read())", pySmoke]);
});

test("bootstrap writes local-only, authenticated server config without Docker", () => {
  const source = readFileSync(install, "utf8");
  assert.match(source, /OPENSANDBOX_SERVER_API_KEY/);
  assert.doesNotMatch(source, /OPENSANDBOX_INSECURE_SERVER=YES/);
  assert.match(source, /opensandbox-server==/);
  const marker = 'python3 - "$CONFIG" "$STORAGE" <<\'PY\'\n';
  assert.ok(source.includes(marker), "config-generator heredoc should exist");
  const snippet = source.split(marker)[1].split("\nPY\n")[0];
  const temp = mkdtempSync(path.join(tmpdir(), "agesoma-osb-"));
  try {
    const config = path.join(temp, "opensandbox.toml");
    const storage = path.join(temp, "storage");
    execFileSync("python3", ["-c", snippet, config, storage], { stdio: "pipe" });
    const read = readFileSync(config, "utf8");
    assert.match(read, /host = "127\.0\.0\.1"/);
    assert.match(read, /publish_host = "127\.0\.0\.1"/);
    assert.match(read, /max_sandbox_timeout_seconds = 1800/);
    assert.match(read, /allowed_host_paths =/);
    assert.match(read, /no_new_privileges = true/);
    const inspect = `import tomllib,sys,json
with open(sys.argv[1], "rb") as f:
    d=tomllib.load(f)
assert d["server"]["host"]=="127.0.0.1"
assert d["docker"]["publish_host"]=="127.0.0.1"
assert d["runtime"]["type"]=="docker"
assert d["storage"]["allowed_host_paths"]==[sys.argv[2]]
print("CONFIG_OK")`;
    const proof = execFileSync("python3", ["-c", inspect, config, storage], { encoding: "utf8" });
    assert.match(proof, /CONFIG_OK/);
    // Second invocation must validate, not silently overwrite the file.
    execFileSync("python3", ["-c", snippet, config, storage], { stdio: "pipe" });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("pilot docs never claim deployed hardware or live tenant isolation", () => {
  const doc = readFileSync(path.join(root, "docs/OPENSANDBOX_INSTALL.md"), "utf8");
  assert.match(doc, /não instalado em servidor AGESOMA/);
  assert.match(doc, /não.*isolamento forte/i);
  assert.match(doc, /bash scripts\/opensandbox\/smoke.sh/);
});
