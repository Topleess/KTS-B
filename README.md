# KTS Beauty / Cosmeto

Mobile-first prototype for a premium beauty assistant. The app now has a Next.js frontend and a FastAPI backend for profiles, routines, products, observations, price offers, action confirmations, and assistant SSE.

## Run Locally

**Prerequisites:** Node.js, Python 3.12+, Docker

1. Install dependencies:
   `npm install`
2. Install backend dependencies:
   `python3 -m venv .venv && source .venv/bin/activate && pip install -e "backend[test]"`
3. Copy env:
   `cp .env.example .env`
4. Start Postgres and Redis:
   `npm run db:up`
5. Run migrations:
   `npm run db:migrate`
6. Run the API:
   `npm run dev:api`
7. Run the frontend:
   `npm run dev`

Frontend: `http://localhost:3000`
Backend docs: `http://localhost:8000/docs`
Health: `GET /health`
Readiness: `GET /ready`

Useful backend endpoints now include:

- `POST /api/v1/auth/telegram` for Telegram Mini App initData
- `POST /api/v1/auth/dev-login` for local web fallback
- `GET /api/v1/care/today`
- `GET /api/v1/actions` and `/summary` for pending action history and expiry-aware UI
- `POST /api/v1/routines/generate` to turn onboarding answers into a fresh active routine
- `GET /api/v1/recommendations`
- `POST /api/v1/recommendations/{productId}/actions/add-owned` and `/track-price` to turn recommendations into confirmable actions
- `POST /api/v1/products/check` to check a SKU or raw INCI against the user profile
- `GET/POST/PATCH/DELETE /api/v1/products/owned` for the user's product shelf
- `POST /api/v1/scans/identify`
- `GET /api/v1/scans/uploads/{photoId}/access` to get an authorized local stream URL or S3 presigned URL
- `POST /api/v1/price-alerts`
- `GET /api/v1/prices/products/{productId}/summary` and `/history` for price comparison context
- `POST /api/v1/jobs/run` for local/dev worker checks
- `POST /api/v1/jobs/price-collection` to refresh configured price offers
- `POST /api/v1/jobs/notifications` to dispatch unread events to Telegram or dry-run without a bot token
- `POST /api/v1/jobs/observation-followups` to create reaction follow-up events from observations
- `GET /api/v1/events/summary`, `PATCH /api/v1/events/read-all`, and `PATCH /api/v1/events/dismiss-all` for the notification inbox
- `GET /api/v1/profile/data/export` to export user data
- `DELETE /api/v1/profile/account` to delete the user account and related private records

## Local API Without Docker

If Docker is not available, use the SQLite dev path:

```bash
npm run db:init:sqlite
npm run dev:api:sqlite
```

Postgres/Supabase remains the target database for production-like work; SQLite is only a local convenience for the prototype.

Weather/UV context uses Open-Meteo by default and falls back safely when the provider is disabled or unavailable.

Photo storage defaults to local `.data/uploads`; set `STORAGE_BACKEND=s3` with S3/Supabase-compatible credentials for private object storage. Uploaded photo reads go through `GET /api/v1/scans/uploads/{photoId}/access`, which returns a backend stream URL for local storage or a presigned S3 URL. Price collection can read static JSON from `PRICE_SOURCES_URL` as a first operator-controlled source.

`GET /api/v1/integrations/status` shows which external integrations are configured, using fallback, dry-run, or missing required production settings without exposing secret values.

When `OPENAI_API_KEY` is set, assistant responses use the OpenAI Responses API with a structured action proposal schema, then the backend converts the proposal into a confirmable pending action. Without a key or on provider errors, the backend falls back to deterministic local proposals.
Confirmed actions store rollback receipts; `POST /api/v1/actions/{actionId}/undo` reverses supported changes such as created observations, product-shelf entries, price alerts, and profile budget/goals updates.

The frontend bootstraps auth in [app/providers.tsx](/Users/nickylafazzi/Documents/Cosmetos/app/providers.tsx): Telegram `WebApp.initData` is sent to FastAPI when available; local development falls back to dev login.

For local worker smoke tests without HTTP:

```bash
npm run jobs:run:sqlite
```

For a long-running local scheduler:

```bash
npm run jobs:scheduler:sqlite -- --max-ticks 1
```

In production, manual job endpoints require `Authorization: Bearer <JOBS_ADMIN_TOKEN>`. Without `JOBS_ADMIN_TOKEN`, those endpoints stay closed; use the scheduler process instead.
