#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash deploy/production/bootstrap-ubuntu.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git docker.io docker-compose-v2
systemctl enable --now docker

ROOT=${AGESOMA_ROOT:-/opt/agesoma}
if [ ! -d "$ROOT/.git" ]; then
  git clone https://github.com/raphaelribeirob/AGESOMA.git "$ROOT"
else
  git -C "$ROOT" pull --ff-only
fi

cd "$ROOT/deploy/production"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created $ROOT/deploy/production/.env"
  echo "Fill DATABASE_URL, HERMES_DOMAIN, HERMES_SERVICE_TOKEN and one model-provider API key, then run this script again."
  exit 2
fi

if grep -q 'replace-with-random-secret' .env; then
  echo "Refusing to start with placeholder HERMES_SERVICE_TOKEN. Update .env first."
  exit 3
fi

docker compose pull hermes gateway
docker compose build worker
docker compose up -d
docker compose ps
