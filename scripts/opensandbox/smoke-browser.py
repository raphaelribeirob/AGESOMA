#!/usr/bin/env python3
"""Offline, disposable OpenSandbox Chromium proof, not AGESOMA agent execution."""
import asyncio
import base64
from datetime import timedelta
import os

from opensandbox import Sandbox
from opensandbox.config import ConnectionConfig

BROWSER_SCRIPT = """
from playwright.sync_api import sync_playwright
from urllib.parse import quote
import os
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page()
    html = '<title>AGESOMA QA</title><h1 id="status">ready</h1><button id="go">Run</button><script>document.querySelector("#go").onclick = function() { document.querySelector("#status").textContent = "clicked"; }</script>'
    page.goto("data:text/html," + quote(html, safe=""))
    assert page.title() == 'AGESOMA QA', page.title()
    page.locator('#go').click()
    assert page.locator('#status').inner_text() == 'clicked', page.locator('#status').inner_text()
    screenshot = '/tmp/agesoma-browser-smoke.png'
    page.screenshot(path=screenshot)
    assert os.path.getsize(screenshot) > 1000
    print('BROWSER_OK:title-click-js-screenshot', flush=True)
    browser.close()
"""


async def main():
    key = os.environ.get("OPEN_SANDBOX_API_KEY")
    domain = os.environ.get("OPEN_SANDBOX_DOMAIN", "127.0.0.1:8080")
    if not key or domain not in ("127.0.0.1:8080", "localhost:8080"):
        raise SystemExit("Secure local OpenSandbox required")
    config = ConnectionConfig(domain=domain, api_key=key, use_server_proxy=True)
    sandbox = await Sandbox.create(
        "opensandbox/playwright:latest",
        timeout=timedelta(minutes=8),
        connection_config=config,
    )
    try:
        encoded = base64.b64encode(BROWSER_SCRIPT.encode("utf8")).decode("ascii")
        result = await sandbox.commands.run(
            f"python3 -c 'import base64;exec(base64.b64decode(\"{encoded}\"))'"
        )
        output = "".join(item.text for item in result.logs.stdout)
        if "BROWSER_OK:title-click-js-screenshot" not in output:
            errors = "".join(item.text for item in result.logs.stderr)
            raise RuntimeError("Chromium E2E not confirmed; stdout=" + output[:1000] +
                               ", stderr=" + errors[:1000])
        print("PASS: actual Chromium browser interaction and screenshot inside Linux sandbox", flush=True)
        print("LIMIT: no VNC/UI streaming, persistence, dispatcher or real company integrations", flush=True)
    finally:
        await sandbox.destroy()
        print("CLEANUP: browser sandbox destroyed", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
