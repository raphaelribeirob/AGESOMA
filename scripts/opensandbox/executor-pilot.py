#!/usr/bin/env python3
"""Local-only AGESOMA OpenSandbox executor diagnostic.

Four independently running browser-capable sandboxes, HMAC attestations, and
one allowlisted offline browser diagnostic. This is an integration-test
controller, NOT a production/multi-tenant service, general AI tool, or VPS.
"""
import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import os
import re
import secrets
import signal

from aiohttp import web
from opensandbox import Sandbox
from opensandbox.config import ConnectionConfig

EXECUTIVES = ("executive", "finance", "growth", "product")
CAPABILITIES = ["browser", "terminal", "filesystem"]
PROTOCOL = "agesoma-executor-v1"
UUID = re.compile(r"^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$", re.I)
SESSION = re.compile(r"^session_[a-z0-9_-]{12,80}$")
MAX_BODY = 4096

OFFLINE_BROWSER = r'''
from playwright.sync_api import sync_playwright
from urllib.parse import quote
import hashlib
import json
import os
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    try:
        page = browser.new_page()
        html = '<title>AGESOMA Diagnóstico</title><h1 id="status">waiting</h1><button id="go">Executar</button><script>document.querySelector("#go").onclick = function(){document.querySelector("#status").textContent = "executed";}</script>'
        page.goto("data:text/html," + quote(html, safe=""))
        assert page.title() == "AGESOMA Diagnóstico"
        page.locator("#go").click()
        assert page.locator("#status").inner_text() == "executed"
        image = "/tmp/agesoma-diagnostic.png"
        page.screenshot(path=image)
        png = open(image, "rb").read()
        assert len(png) > 1000 and png[:8] == b"\x89PNG\r\n\x1a\n"
        print("AGESOMA_DIAGNOSTIC=" + json.dumps({
            "status":"success", "browser":"chromium",
            "dom":"executed", "image_sha256":hashlib.sha256(png).hexdigest(),
            "image_bytes":len(png), "external_actions":0
        },separators=(",",":")),flush=True)
    finally:
        browser.close()
'''

def compact(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)

def sign(secret, payload):
    return hmac.new(secret.encode(), compact(payload).encode(), hashlib.sha256).hexdigest()

def iso_after(seconds):
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds)).isoformat(timespec="milliseconds").replace("+00:00", "Z")

def check_message(actual, expected):
    return isinstance(actual,str) and len(actual)==64 and hmac.compare_digest(actual, expected)

async def json_body(request):
    if request.content_length is not None and request.content_length > MAX_BODY:
        raise web.HTTPRequestEntityTooLarge(max_size=MAX_BODY, actual_size=request.content_length)
    try:
        value = await request.json()
    except Exception:
        raise web.HTTPBadRequest()
    if not isinstance(value,dict) or len(compact(value))>MAX_BODY:
        raise web.HTTPBadRequest()
    return value

class Executor:
    def __init__(self, config, secret):
        self.config=config
        self.secret=secret
        self.sandboxes={}
        self.ids={}
        self.lock=asyncio.Lock()
        self.executions={}
    async def start(self):
        for name in EXECUTIVES:
            sb = await Sandbox.create("opensandbox/playwright:latest", timeout=timedelta(minutes=12), connection_config=self.config)
            self.sandboxes[name]=sb
            self.ids[name]="session_"+secrets.token_hex(12)
            print("PROVISIONED: "+name, flush=True)
    async def close(self):
        for name,sb in reversed(list(self.sandboxes.items())):
            try:
                await sb.destroy()
                print("CLEANUP: "+name,flush=True)
            except Exception as exc:
                print("CLEANUP_ERROR: "+name+" "+type(exc).__name__,flush=True)
    async def healthy(self):
        try:
            for name,sb in self.sandboxes.items():
                result=await sb.commands.run("printf AGESOMA_READY")
                stdout="".join(x.text for x in result.logs.stdout)
                if "AGESOMA_READY" not in stdout:
                    return False
            return len(self.sandboxes)==len(EXECUTIVES)
        except Exception:
            return False

async def health(request):
    service=request.app["executor"]
    return web.json_response({"status":"ready" if len(service.sandboxes)==4 else "starting"},status=200 if len(service.sandboxes)==4 else 503)

async def attest(request):
    service=request.app["executor"]
    body=await json_body(request)
    nonce=body.get("nonce")
    if body.get("protocol") != PROTOCOL or not isinstance(nonce,str) or not re.fullmatch(r"[0-9a-f]{48}",nonce):
        raise web.HTTPBadRequest()
    if not await service.healthy():
        raise web.HTTPServiceUnavailable()
    payload={
        "protocol":PROTOCOL, "nonce":nonce,"engine":"opensandbox",
        "isolation":"agent", "capabilities":CAPABILITIES,
        "sessions":{k:service.ids[k] for k in EXECUTIVES},
        "expiresAt":iso_after(2000 / 1000)
    }
    return web.json_response({**payload,"signature":sign(service.secret,payload)})

async def execute(request):
    service=request.app["executor"]
    body=await json_body(request)
    expected_keys={"protocol","tenantId","taskId","executive","action","expiresAt","nonce","signature"}
    if set(body)!=expected_keys: raise web.HTTPBadRequest()
    signature=body.pop("signature")
    if not check_message(signature,sign(service.secret,body)):
        raise web.HTTPForbidden()
    if body["protocol"]!=PROTOCOL or body["action"]!="qa.browser" or body["executive"] not in EXECUTIVES:
        raise web.HTTPForbidden()
    if not UUID.fullmatch(str(body["tenantId"])) or not UUID.fullmatch(str(body["taskId"])) or not re.fullmatch(r"[0-9a-f]{32}",str(body["nonce"])):
        raise web.HTTPForbidden()
    try:
        expires=datetime.fromisoformat(body["expiresAt"].replace("Z","+00:00"))
        delta=(expires-datetime.now(timezone.utc)).total_seconds()
    except Exception:
        raise web.HTTPForbidden()
    if not 0<delta<=30:raise web.HTTPForbidden()
    key=(body["tenantId"],body["taskId"])
    # One execution per task ID; no unrestricted shell command or user HTML.
    async with service.lock:
        if key in service.executions:
            raise web.HTTPConflict(text="already executed")
        service.executions[key]="running"
        try:
            import base64
            script=base64.b64encode(OFFLINE_BROWSER.encode()).decode()
            cmd='python3 -c "import base64;exec(base64.b64decode(\''+script+'\'))"'
            result=await service.sandboxes[body["executive"]].commands.run(cmd)
            output="".join(x.text for x in result.logs.stdout)
            lines=[x.split("AGESOMA_DIAGNOSTIC=",1)[1] for x in output.splitlines() if "AGESOMA_DIAGNOSTIC=" in x]
            if len(lines)!=1: raise RuntimeError("browser receipt missing")
            detail=json.loads(lines[0])
            if detail.get("status")!="success" or detail.get("dom")!="executed":
                raise RuntimeError("browser failed")
            receipt={
                "protocol":PROTOCOL,"tenantId":body["tenantId"],"taskId":body["taskId"],
                "executive":body["executive"],"action":body["action"],
                "sessionId":service.ids[body["executive"]],
                "status":"completed","proof":detail,"finishedAt":iso_after(0)
            }
            service.executions[key]="completed"
            return web.json_response({**receipt,"signature":sign(service.secret,receipt)})
        except Exception as exc:
            service.executions[key]="failed"
            print("DIAGNOSTIC_ERROR: "+type(exc).__name__,flush=True)
            raise web.HTTPServiceUnavailable(text="diagnostic failed")

async def main():
    secret=os.environ.get("AGESOMA_EXECUTOR_ATTEST_SECRET","")
    if len(secret)<32: raise SystemExit("Missing AGESOMA_EXECUTOR_ATTEST_SECRET >=32 characters")
    if os.environ.get("OPEN_SANDBOX_DOMAIN") not in ("127.0.0.1:8080","localhost:8080"):
        raise SystemExit("Only local OpenSandbox pilot allowed")
    config=ConnectionConfig(
        domain=os.environ["OPEN_SANDBOX_DOMAIN"],
        api_key=os.environ.get("OPEN_SANDBOX_API_KEY",""),
        use_server_proxy=True
    )
    if not config.api_key: raise SystemExit("OpenSandbox key required")
    service=Executor(config,secret)
    runner=None
    try:
        await service.start()
        app=web.Application(client_max_size=MAX_BODY)
        app["executor"]=service
        app.router.add_get("/health",health)
        app.router.add_post("/v1/attest",attest)
        app.router.add_post("/v1/execute",execute)
        runner=web.AppRunner(app,access_log=None)
        await runner.setup()
        await web.TCPSite(runner,host="127.0.0.1",port=8091).start()
        print("EXECUTOR_PILOT_READY: four real sessions on localhost:8091",flush=True)
        stop=asyncio.Event()
        loop=asyncio.get_running_loop()
        for sig in (signal.SIGTERM,signal.SIGINT):
            loop.add_signal_handler(sig,stop.set)
        await stop.wait()
    finally:
        if runner: await runner.cleanup()
        await service.close()

if __name__=="__main__":
    asyncio.run(main())
