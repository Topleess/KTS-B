#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/cosmetos}"
DOMAIN="${DOMAIN:-kts.as-shamshurin.xyz}"
BRANCH="${BRANCH:-main}"
DEPLOY_KEY="${DEPLOY_KEY:-$APP_DIR/.deploy/github-actions-cosmetos}"

cd "$APP_DIR"

retry() {
  local attempts="$1"
  local delay="$2"
  shift 2

  for attempt in $(seq 1 "$attempts"); do
    if "$@"; then
      return 0
    fi
    if [ "$attempt" = "$attempts" ]; then
      return 1
    fi
    sleep "$delay"
  done
}

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env. Create it from .env.example.server before deploying." >&2
  exit 1
fi

if [ -f "$DEPLOY_KEY" ]; then
  export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
fi

echo "Fetching origin/${BRANCH} in ${APP_DIR}..."
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Rebuilding and starting containers..."
docker compose config --quiet
docker compose up -d --build --remove-orphans

docker compose ps

echo "Checking health endpoints..."
retry 12 5 curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8103/health >/dev/null
retry 12 5 curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8103/ready >/dev/null
retry 12 5 curl --fail --silent --show-error --max-time 10 --head http://127.0.0.1:3103 >/dev/null
retry 12 5 curl --noproxy '*' --fail --silent --show-error --max-time 15 "https://${DOMAIN}/health" >/dev/null
retry 12 5 curl --noproxy '*' --fail --silent --show-error --max-time 15 "https://${DOMAIN}/ready" >/dev/null
retry 12 5 curl --noproxy '*' --fail --silent --show-error --max-time 15 --head "https://${DOMAIN}" >/dev/null

echo "Deploy completed successfully for ${DOMAIN}."
