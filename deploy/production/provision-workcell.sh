#!/bin/sh
set -eu

TENANT_ID="${1:?usage: provision-workcell.sh <tenant-uuid>}"
BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
: "${DATABASE_URL:?DATABASE_URL is required to register the Work Cell}"
: "${TRUST_STORE_MASTER_SECRET:?TRUST_STORE_MASTER_SECRET is required}"
: "${EGRESS_CONTROL_TOKEN:?EGRESS_CONTROL_TOKEN is required}"

derive_token() {
  label="$1"
  printf '%s' "$label:$TENANT_ID" | openssl dgst -sha256 -hmac "$TRUST_STORE_MASTER_SECRET" | awk '{print $2}'
}

TRUST_STORE_SENTINEL_TOKEN="$(derive_token sentinel)"
TRUST_STORE_AUTHD_TOKEN="$(derive_token authd)"
TRUST_STORE_BROWSER_TOKEN="$(derive_token browser_broker)"
TRUST_STORE_BROWSER_CDP_TOKEN="$(derive_token browser_cdp_gateway)"
AUTHD_BROWSER_TOKEN="$(derive_token authd-browser)"
AUTHD_BROWSER_CDP_TOKEN="$(derive_token authd-browser-cdp)"
AUTHD_PRIVSEP_TOKEN="$(derive_token authd-privsep)"
EGRESS_BROWSER_TOKEN="$(derive_token egress-browser)"
EGRESS_PRIVSEP_TOKEN="$(derive_token egress-privsep)"
BROWSER_CDP_TOKEN="$(derive_token browser-cdp)"
BROWSER_SUBAGENT_TOKEN="$(derive_token browser-subagent)"
BROWSER_SAFETY_TOKEN="$(derive_token browser-safety)"
MODEL_GATEWAY_TOKEN="$(derive_token model-gateway)"

case "$TENANT_ID" in
  *[!0-9a-fA-F-]*|'') echo "invalid tenant id" >&2; exit 2 ;;
esac

docker network inspect "agesoma-cell-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-cell-$TENANT_ID" >/dev/null

docker network inspect "agesoma-credentials-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-credentials-$TENANT_ID" >/dev/null

docker network inspect "agesoma-browser-control-$TENANT_ID" >/dev/null 2>&1 || \
  docker network create --internal "agesoma-browser-control-$TENANT_ID" >/dev/null

docker inspect agesoma-trust-store >/dev/null 2>&1 || {
  echo "agesoma-trust-store is not running" >&2
  exit 3
}

docker network connect --alias "trust-store-$TENANT_ID" "agesoma-credentials-$TENANT_ID" agesoma-trust-store 2>/dev/null || true

AGESOMA_TENANT_ID="$TENANT_ID" \
TRUST_STORE_SENTINEL_TOKEN="$TRUST_STORE_SENTINEL_TOKEN" \
TRUST_STORE_AUTHD_TOKEN="$TRUST_STORE_AUTHD_TOKEN" \
TRUST_STORE_BROWSER_TOKEN="$TRUST_STORE_BROWSER_TOKEN" \
TRUST_STORE_BROWSER_CDP_TOKEN="$TRUST_STORE_BROWSER_CDP_TOKEN" \
AUTHD_BROWSER_TOKEN="$AUTHD_BROWSER_TOKEN" \
AUTHD_BROWSER_CDP_TOKEN="$AUTHD_BROWSER_CDP_TOKEN" \
AUTHD_PRIVSEP_TOKEN="$AUTHD_PRIVSEP_TOKEN" \
EGRESS_BROWSER_TOKEN="$EGRESS_BROWSER_TOKEN" \
EGRESS_PRIVSEP_TOKEN="$EGRESS_PRIVSEP_TOKEN" \
EGRESS_CONTROL_TOKEN="$EGRESS_CONTROL_TOKEN" \
BROWSER_CDP_TOKEN="$BROWSER_CDP_TOKEN" \
BROWSER_SUBAGENT_TOKEN="$BROWSER_SUBAGENT_TOKEN" \
BROWSER_SAFETY_TOKEN="$BROWSER_SAFETY_TOKEN" \
MODEL_GATEWAY_TOKEN="$MODEL_GATEWAY_TOKEN" \
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
docker exec agesoma-control-worker node -e "fetch('http://sentinel-$TENANT_ID:8081/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec agesoma-control-worker node -e "fetch('http://egress-$TENANT_ID:8085/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec agesoma-control-worker node -e "fetch('http://model-gateway-$TENANT_ID:8086/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec agesoma-control-worker node -e "fetch('http://trust-store-$TENANT_ID:8084/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec "agesoma-cell-$TENANT_ID-browser-broker-1" node -e "fetch('http://127.0.0.1:8082/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec "agesoma-cell-$TENANT_ID-browser-subagent-1" node -e "fetch('http://127.0.0.1:8087/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec "agesoma-cell-$TENANT_ID-browser-cdp-gateway-1" node -e "fetch('http://127.0.0.1:8088/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec "agesoma-cell-$TENANT_ID-browser-safety-1" node -e "fetch('http://127.0.0.1:8089/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
docker exec "agesoma-cell-$TENANT_ID-authd-1" node -e "fetch('http://127.0.0.1:8083/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

RUNTIME_NAMESPACE="cell:$TENANT_ID"
FILE_NAMESPACE="$RUNTIME_NAMESPACE:files"
MEMORY_NAMESPACE="$RUNTIME_NAMESPACE:memory"
CREDENTIAL_NAMESPACE="$RUNTIME_NAMESPACE:credentials"
CONFIG_JSON="{\"hermesHost\":\"hermes-$TENANT_ID\",\"browserBrokerHost\":\"browser-$TENANT_ID\",\"browserSubagentHost\":\"browser-subagent\",\"browserCdpGatewayHost\":\"browser-cdp-gateway\",\"browserSafetyHost\":\"browser-safety\",\"credentialBrokerHost\":\"broker-$TENANT_ID\",\"sentinelHost\":\"sentinel-$TENANT_ID\",\"egressGatewayHost\":\"egress-$TENANT_ID\",\"modelGatewayHost\":\"model-gateway-$TENANT_ID\",\"trustStoreHost\":\"trust-store-$TENANT_ID\",\"authdMode\":\"caller-scoped-surrogates\",\"egress\":\"forced-sentinel-v3-gateway\",\"browserControl\":\"aria-subagent-safety-v1\",\"modelCredentials\":\"gateway-only\",\"isolation\":\"per-tenant-networks-no-workcell-db\"}"

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

insert into credential_handles (tenant_id,provider,handle,scopes,secret_class,status)
values
  (:'"'"'tenant'"'"'::uuid,'steel','cred://steel/default','["browser_broker:browser.provider","browser_cdp_gateway:browser.cdp"]'::jsonb,'browser_provider','active'),
  (:'"'"'tenant'"'"'::uuid,'whatsapp','cred://whatsapp/default','["privsep_broker:whatsapp.send"]'::jsonb,'provider_token','active'),
  (:'"'"'tenant'"'"'::uuid,'windsor','cred://windsor/default','["privsep_broker:paid_media.read","privsep_broker:paid_media.write"]'::jsonb,'api_key','active')
on conflict (tenant_id,provider,handle) do update set
  scopes=excluded.scopes,
  secret_class=excluded.secret_class,
  status='active',
  updated_at=now();
SQL'

echo "Work Cell ready and registered: $TENANT_ID"
