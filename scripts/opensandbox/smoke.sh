#!/usr/bin/env bash
# Starts one disposable sandbox and destroys it. Run with the server already listening.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE="${AGESOMA_OPENSANDBOX_HOME:-$HOME/.config/agesoma}"
if [[ ! -r "$BASE/opensandbox.env" ]]; then
  echo "No local OpenSandbox credentials. Run install.sh start first." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$BASE/opensandbox.env"
export OPEN_SANDBOX_DOMAIN="127.0.0.1:8080"
if ! curl --fail --silent --show-error "http://127.0.0.1:8080/health" >/dev/null; then
  echo "OpenSandbox is not running on localhost:8080." >&2
  exit 1
fi
exec uv run --no-project --with "opensandbox==1.1.1" python "$ROOT/scripts/opensandbox/smoke.py"
