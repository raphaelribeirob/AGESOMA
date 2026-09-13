#!/bin/sh
set -eu

TENANT_ID="${1:?usage: provision-workcell.sh <tenant-uuid> [allowlist-file]}"
BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ALLOWLIST_FILE="${2:-$BASE_DIR/approved-domains.txt}"
: "${DATABASE_URL:?DATABASE_URL is required to register the Work Cell}"

case "$TENANT_ID" in
  *[!0-9a-fA-F-]*|'') echo "invalid tenant id" >&2; exit 2 ;;
esac

test -f "$ALLOWLIST_FILE" || { echo "allowlist file not found: $ALLOWLIST_FILE" >&2; exit 2; }

docker network inspect "agesoma-cell-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-cell-$TENANT_ID" >/dev/null

docker network inspect "agesoma-credentials-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-credentials-$TENANT_ID" >/dev/null

AGESOMA_TENANT_ID="$TENANT_ID" \
WORKCELL_ALLOWLIST_FILE="$ALLOWLIST_FILE" \
  docker compose \
    --project-name "agesoma-cell-$TENANT_ID" \
    --file "$BASE_DIR/workcell-compose.yml" \
    up -d

docker inspect agesoma-control-worker >/dev/null 2>&1 || {
  echo "agesoma-control-worker is not running" >&2
  exit 3
}

docker network connect "agesoma-cell-$TENANT_ID" agesoma-control-worker 2>/dev/null || true
docker network connect "agesoma-credentials-$TENANT_ID" agesoma-control-worker 2>/dev/null || true

docker exec agesoma-control-worker node -e "fetch('http://hermes-$TENANT_ID:8642/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec agesoma-control-worker node -e "fetch('http://broker-$TENANT_ID:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

RUNTIME_NAMESPACE="cell:$TENANT_ID"
FILE_NAMESPACE="$RUNTIME_NAMESPACE:files"
MEMORY_NAMESPACE="$RUNTIME_NAMESPACE:memory"
CREDENTIAL_NAMESPACE="$RUNTIME_NAMESPACE:credentials"
CONFIG_JSON="{\"hermesHost\":\"hermes-$TENANT_ID\",\"credentialBrokerHost\":\"broker-$TENANT_ID\",\"egress\":\"sentinel-proxy-v1\",\"isolation\":\"per-tenant-networks\"}"

docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -e TENANT_ID="$TENANT_ID" \
  -e RUNTIME_NAMESPACE="$RUNTIME_NAMESPACE" \
  -e FILE_NAMESPACE="$FILE_NAMESPACE" \
  -e MEMORY_NAMESPACE="$MEMORY_NAMESPACE" \
  -e CREDENTIAL_NAMESPACE="$CREDENTIAL_NAMESPACE" \
  -e CONFIG_JSON="$CONFIG_JSON" \
  postgres:17-alpine \
  sh -ec 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
    -v tenant="$TENANT_ID" \
    -v runtime="$RUNTIME_NAMESPACE" \
    -v files="$FILE_NAMESPACE" \
    -v memory="$MEMORY_NAMESPACE" \
    -v credentials="$CREDENTIAL_NAMESPACE" \
    -v config="$CONFIG_JSON" <<"SQL"
set search_path to agesoma_p0, public;
insert into work_cells (
  tenant_id, namespace, status, runtime_namespace, file_namespace,
  memory_namespace, credential_namespace, isolation_status, config, last_seen_at
) values (
  :'"'"'tenant'"'"'::uuid, :'"'"'runtime'"'"', '"'"'ready'"'"', :'"'"'runtime'"'"', :'"'"'files'"'"',
  :'"'"'memory'"'"', :'"'"'credentials'"'"', '"'"'ready'"'"', :'"'"'config'"'"'::jsonb, now()
)
on conflict (tenant_id) do update set
  namespace=excluded.namespace,
  status='"'"'ready'"'"',
  runtime_namespace=excluded.runtime_namespace,
  file_namespace=excluded.file_namespace,
  memory_namespace=excluded.memory_namespace,
  credential_namespace=excluded.credential_namespace,
  isolation_status='"'"'ready'"'"',
  config=excluded.config,
  last_seen_at=now(),
  updated_at=now();
SQL'

echo "Work Cell ready and registered: $TENANT_ID"
