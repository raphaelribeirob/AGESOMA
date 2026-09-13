#!/bin/sh
set -eu

TENANT_ID="${1:?usage: provision-workcell.sh <tenant-uuid> [allowlist-file]}"
ALLOWLIST_FILE="${2:-$(pwd)/approved-domains.txt}"
BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

case "$TENANT_ID" in
  *[!0-9a-fA-F-]*|'') echo "invalid tenant id" >&2; exit 2 ;;
esac

test -f "$ALLOWLIST_FILE" || { echo "allowlist file not found: $ALLOWLIST_FILE" >&2; exit 2; }

docker network inspect agesoma-controlled-egress >/dev/null 2>&1 || \
  docker network create agesoma-controlled-egress >/dev/null

docker network inspect "agesoma-cell-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-cell-$TENANT_ID" >/dev/null

AGESOMA_TENANT_ID="$TENANT_ID" \
WORKCELL_ALLOWLIST_FILE="$ALLOWLIST_FILE" \
  docker compose \
    --project-name "agesoma-cell-$TENANT_ID" \
    --file "$BASE_DIR/workcell-compose.yml" \
    up -d

if docker inspect agesoma-control-worker >/dev/null 2>&1; then
  docker network connect "agesoma-cell-$TENANT_ID" agesoma-control-worker 2>/dev/null || true
fi

echo "Work Cell ready: $TENANT_ID"
