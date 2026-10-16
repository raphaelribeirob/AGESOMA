#!/usr/bin/env bash
# AGESOMA OpenSandbox local pilot. Docker and uvx must already be installed.
set -Eeuo pipefail
umask 077

VERSION="1.1.1"
BASE="${AGESOMA_OPENSANDBOX_HOME:-$HOME/.config/agesoma}"
CONFIG="$BASE/opensandbox.toml"
SECRETS="$BASE/opensandbox.env"
STORAGE="$HOME/.local/share/agesoma/opensandbox"
MODE="${1:-start}"

if [[ "$MODE" != "start" && "$MODE" != "check" ]]; then
  echo "Usage: $0 [check|start]" >&2
  exit 2
fi
for bin in docker uvx python3 curl; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing prerequisite: $bin" >&2
    exit 1
  fi
done
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon unavailable or permission denied. Do not run this installer as root; configure the host first." >&2
  exit 1
fi
if [[ "$MODE" == "check" ]]; then
  echo "Prerequisites OK: Docker daemon, uvx, Python and curl."
  echo "Target: localhost:8080; no port exposed publicly by this script."
  exit 0
fi

mkdir -p "$BASE" "$STORAGE"
chmod 700 "$BASE" "$STORAGE"

# Generate a random per-host key. Never write it to source control or terminal output.
if [[ ! -e "$SECRETS" ]]; then
  python3 - "$SECRETS" <<'PY'
from pathlib import Path
import secrets
import sys
p = Path(sys.argv[1])
key = secrets.token_hex(32)
# x-mode refuses to clobber an existing key.
with p.open("x", encoding="ascii") as file:
    file.write(f'export OPEN_SANDBOX_API_KEY={key}\n')
    file.write(f'export OPENSANDBOX_SERVER_API_KEY={key}\n')
PY
  chmod 600 "$SECRETS"
fi

# Local-only pilot config. The runtime may run untrusted code; do not treat this
# Docker mode as strong tenant isolation or expose it to customer workloads.
python3 - "$CONFIG" "$STORAGE" <<'PY'
from pathlib import Path
import json
import sys

config = Path(sys.argv[1])
storage = str(Path(sys.argv[2]).resolve())
if config.exists():
    print(f"Existing config preserved: {config}")
else:
    contents = (
        '[server]\n'
        'host = "127.0.0.1"\n'
        'port = 8080\n'
        'max_sandbox_timeout_seconds = 1800\n\n'
        '[runtime]\n'
        'type = "docker"\n'
        'execd_image = "opensandbox/execd:v1.1.0"\n\n'
        '[docker]\n'
        'network_mode = "bridge"\n'
        'publish_host = "127.0.0.1"\n'
        'drop_capabilities = ["AUDIT_WRITE", "MKNOD", "NET_ADMIN", "NET_RAW", "SYS_ADMIN", "SYS_MODULE", "SYS_PTRACE", "SYS_TIME", "SYS_TTY_CONFIG"]\n'
        'no_new_privileges = true\n'
        'pids_limit = 512\n\n'
        '[storage]\n'
        f'allowed_host_paths = [{json.dumps(storage)}]\n\n'
        '[store]\n'
        'type = "sqlite"\n'
        'path = "~/.opensandbox/opensandbox.db"\n\n'
        '[ingress]\n'
        'mode = "direct"\n'
    )
    with config.open("x", encoding="utf-8") as file:
        file.write(contents)
    print(f"Created local pilot config: {config}")
PY
chmod 600 "$CONFIG"
# shellcheck disable=SC1090
source "$SECRETS"
export SANDBOX_CONFIG_PATH="$CONFIG"
export OPENSANDBOX_DISABLE_METRICS=1
echo "Starting OpenSandbox ${VERSION} on localhost:8080."
echo "Keep this terminal open, then run: bash scripts/opensandbox/smoke.sh"
exec uvx --from "opensandbox-server==${VERSION}" opensandbox-server --config "$CONFIG"
