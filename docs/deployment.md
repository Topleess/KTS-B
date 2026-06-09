# Deployment

## Local development

Frontend:

```bash
npm install
npm run dev
```

Backend with local Postgres/Redis:

```bash
cp .env.example .env
docker compose up -d postgres redis
python3.12 -m venv .venv
. .venv/bin/activate
pip install -e "backend[test]"
npm run db:migrate
npm run dev:api
```

For ordinary local development the app can use development auth. The production Telegram Mini App auth is checked on the deployed HTTPS domain.

## GitHub Actions secrets

Add these repository secrets before pushing deployment changes to `main`:

```text
DEPLOY_HOST=45.150.238.106
DEPLOY_USER=deploy
DEPLOY_PATH=/opt/apps/cosmetos
DEPLOY_DOMAIN=kts.as-shamshurin.xyz
DEPLOY_SSH_KEY=<private key for the deploy user>
```

The private key is generated on the server at:

```text
/opt/apps/cosmetos/.deploy/github-actions-cosmetos
```

Do not commit `.env` or `.deploy/`.

## Production deploy flow

On every push to `main`, GitHub Actions:

1. Installs frontend dependencies, runs lint, and builds Next.js.
2. Installs backend dependencies with Python 3.12 and runs pytest.
3. Validates Docker Compose.
4. Connects to the VPS over SSH.
5. Runs `/opt/apps/cosmetos/scripts/deploy.sh`.

The deploy script fetches `origin/main`, resets the server worktree to it, rebuilds containers, starts them, runs Alembic migrations through the backend startup command, and checks local/public health endpoints.

## Manual server commands

```bash
cd /opt/apps/cosmetos
docker compose ps
docker compose logs -f --tail=100
docker compose up -d --build
docker compose restart backend frontend scheduler
```

Never use `docker compose down -v` unless you intentionally want to remove persistent database volumes.
