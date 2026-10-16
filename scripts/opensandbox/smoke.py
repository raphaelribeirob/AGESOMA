#!/usr/bin/env python3
"""One harmless sandbox lifecycle test: create, echo, then destroy."""
import asyncio
from datetime import timedelta
import os

from opensandbox import Sandbox
from opensandbox.config import ConnectionConfig

MARKER = "AGESOMA_OPEN_SANDBOX_OK"


async def main() -> None:
    api_key = os.environ.get("OPEN_SANDBOX_API_KEY")
    domain = os.environ.get("OPEN_SANDBOX_DOMAIN", "127.0.0.1:8080")
    if not api_key:
        raise SystemExit("Refusing to run without OPEN_SANDBOX_API_KEY")
    if domain not in ("127.0.0.1:8080", "localhost:8080"):
        raise SystemExit("Pilot smoke test is restricted to the local host")

    config = ConnectionConfig(
        domain=domain,
        api_key=api_key,
        use_server_proxy=True,
    )
    sandbox = await Sandbox.create(
        "alpine:3.20",
        timeout=timedelta(minutes=3),
        connection_config=config,
    )
    try:
        result = await sandbox.commands.run("printf AGESOMA_OPEN_SANDBOX_OK")
        stdout = "".join(fragment.text for fragment in result.logs.stdout)
        if MARKER not in stdout:
            raise RuntimeError("Sandbox ran but did not return the expected marker")
        print("PASS: OpenSandbox created an isolated test sandbox and executed a command.")
    finally:
        # kill all test resources even when the assertion fails.
        await sandbox.destroy()
        print("CLEANUP: sandbox destroyed.")


if __name__ == "__main__":
    asyncio.run(main())
