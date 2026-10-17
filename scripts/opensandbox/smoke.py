#!/usr/bin/env python3
"""Disposable OpenSandbox runtime proof: shell, filesystem and two isolated sessions.

Do not confuse this proof with an AGESOMA executive computer, browser or
persistent dispatcher. Docker local mode is NOT a multi-tenant security boundary.
"""
import asyncio
from datetime import timedelta
import os

from opensandbox import Sandbox
from opensandbox.config import ConnectionConfig

MARKER = "AGESOMA_OPEN_SANDBOX_OK"
FILE = "/tmp/agesoma-pilot-probe"
SECRET = "qa-only-fixture-no-user-data"


def output(result):
    return "".join(fragment.text for fragment in result.logs.stdout)


async def main() -> None:
    api_key = os.environ.get("OPEN_SANDBOX_API_KEY")
    domain = os.environ.get("OPEN_SANDBOX_DOMAIN", "127.0.0.1:8080")
    if not api_key:
        raise SystemExit("Refusing to run without OPEN_SANDBOX_API_KEY")
    if domain not in ("127.0.0.1:8080", "localhost:8080"):
        raise SystemExit("Pilot smoke test is restricted to the local host")

    config = ConnectionConfig(domain=domain, api_key=api_key, use_server_proxy=True)
    first = None
    second = None
    try:
        first = await Sandbox.create(
            "alpine:3.20",
            timeout=timedelta(minutes=3),
            connection_config=config,
        )
        print("STAGE 1: provisioned disposable Linux sandbox A", flush=True)
        result = await first.commands.run(
            f"sh -c 'mkdir -p /tmp && printf {SECRET} > {FILE} && printf {MARKER}'"
        )
        if MARKER not in output(result):
            raise AssertionError("A could not execute a real terminal command")
        readback = await first.commands.run(f"cat {FILE}")
        if output(readback).strip() != SECRET:
            raise AssertionError("A did not preserve its file across terminal commands")
        print("PASS: sandbox A real terminal + filesystem state across commands", flush=True)

        second = await Sandbox.create(
            "alpine:3.20",
            timeout=timedelta(minutes=3),
            connection_config=config,
        )
        print("STAGE 2: provisioned disposable Linux sandbox B", flush=True)
        isolation = await second.commands.run(
            f"sh -c 'if test -e {FILE}; then printf LEAK; else printf NO_LEAK; fi'"
        )
        if output(isolation).strip() != "NO_LEAK":
            raise AssertionError("Sandbox B observed A's private file")
        print("PASS: sandbox B cannot see A's test file in isolated /tmp", flush=True)
        print("LIMIT: no Chromium, VNC, real AGESOMA task, persistence or tenant isolation proof", flush=True)
    finally:
        for name, sandbox in (("B", second), ("A", first)):
            if sandbox is not None:
                try:
                    await sandbox.destroy()
                    print(f"CLEANUP: sandbox {name} destroyed", flush=True)
                except Exception as exc:
                    print(f"CLEANUP FAILURE {name}: {type(exc).__name__}", flush=True)
                    raise


if __name__ == "__main__":
    asyncio.run(main())
