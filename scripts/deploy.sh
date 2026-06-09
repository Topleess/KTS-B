#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/cosmetos}"
DOMAIN="${DOMAIN:-kts.as-shamshurin.xyz}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env. Create it from .env.example.server before deploying." >&2
  exit 1
fi

git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

docker compose config --quiet
docker compose up -d --build --remove-orphans

docker compose ps

curl --fail --silent --show-error --max-time 30 http://127.0.0.1:8103/health >/dev/null
curl --fail --silent --show-error --max-time 30 http://127.0.0.1:8103/ready >/dev/null
curl --fail --silent --show-error --max-time 30 --head http://127.0.0.1:3103 >/dev/null
curl --noproxy '*' --fail --silent --show-error --max-time 40 "https://${DOMAIN}/health" >/dev/null
curl --noproxy '*' --fail --silent --show-error --max-time 40 "https://${DOMAIN}/ready" >/dev/null
curl --noproxy '*' --fail --silent --show-error --max-time 40 --head "https://${DOMAIN}" >/dev/null

echo "Deploy completed successfully for ${DOMAIN}."
