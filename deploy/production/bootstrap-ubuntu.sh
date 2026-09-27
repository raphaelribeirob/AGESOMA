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
  chmod 600 .env
  echo "Created $ROOT/deploy/production/.env"
  echo "Fill DATABASE_URL, Better Auth, trust/egress/workcell-control secrets, Hermes/broker secrets and AI provider configuration, then run this script again."
  exit 2
fi

chmod 600 .env
if grep -q 'replace-with' .env; then
  echo "Refusing to start while placeholder secrets remain in .env. Update every required secret first."
  exit 3
fi

docker compose build worker trust-store brain
docker compose up -d
docker compose ps
