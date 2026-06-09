# Cosmeto Backend

FastAPI backend for the Cosmeto / KTS Beauty prototype.

## Local Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e "backend[test]"
cp .env.example .env
```

Start Postgres and Redis:

```bash
docker compose up -d postgres redis
```

Run migrations and start the API:

```bash
npm run db:migrate
npm run dev:api
```

Docs: `http://localhost:8000/docs`
Health: `GET /health`
Readiness: `GET /ready`

Without Docker:

```bash
npm run db:init:sqlite
npm run dev:api:sqlite
```

## Dev Auth

In development, requests can send `X-Dev-User: demo`. Production auth must use `POST /api/v1/auth/telegram` with raw Telegram Mini App `initData`.
Production startup fails fast when `JWT_SECRET` is still the default value, `ALLOW_DEV_AUTH=true`, or `TELEGRAM_BOT_TOKEN` is missing.

Frontend session bootstrap calls:

- `POST /api/v1/auth/telegram` inside Telegram Mini App.
- `POST /api/v1/auth/dev-login` in local development.
- `GET /api/v1/me` to reuse an existing cookie session.

## Integration Status

`GET /api/v1/integrations/status` reports whether database, Telegram auth/notifications, OpenAI, weather, storage, price sources, and jobs are configured, in fallback, dry-run, or missing configuration. The response intentionally does not expose secret values.

## Privacy And Consents

`GET /api/v1/profile/consents` returns the user's data-processing consent states. `PATCH /api/v1/profile/consents/{key}` accepts or revokes a consent and records history in the profile restrictions payload. Supported keys include `data_processing`, `privacy_policy`, `ai_personalization`, `photo_analysis`, and `marketing_notifications`.

## Product Shelf

`GET /api/v1/products/owned` lists the user's shelf. `POST /api/v1/products/owned` adds or updates a product by `product_id`; `PATCH` updates status, note, or amount left; `DELETE` removes it from the shelf.

Recommendations can create confirmable actions directly:

- `POST /api/v1/recommendations/{productId}/actions/add-owned`
- `POST /api/v1/recommendations/{productId}/actions/track-price`

## Prices

`GET /api/v1/prices/products/{productId}` returns current offers. `GET /api/v1/prices/products/{productId}/history` returns collected price snapshots, and `/summary` returns best offer, min/max/average, and last collection time.

## Jobs

Manual worker endpoints are available outside production:

```bash
curl -X POST http://localhost:8000/api/v1/jobs/run
```

In production, manual job endpoints require `Authorization: Bearer <JOBS_ADMIN_TOKEN>`. Without `JOBS_ADMIN_TOKEN`, they remain closed.

They create events for price alerts, low products, high UV, and routine reminders.

`POST /api/v1/jobs/price-collection` refreshes `price_offers` from `PRICE_SOURCES_URL` or the built-in demo source.
`POST /api/v1/jobs/notifications` sends unread events through Telegram when `TELEGRAM_BOT_TOKEN` is configured; without a token it records a dry-run delivery.

## Events Inbox

`GET /api/v1/events` supports `status`, `event_type`, and `limit` filters. `GET /api/v1/events/summary` returns unread/dismissed counts. Use `PATCH /api/v1/events/read-all` or `/dismiss-all` for bulk inbox actions.

## Actions

`GET /api/v1/actions` lists pending/action history with optional `status` and `limit` filters. `GET /api/v1/actions/summary` returns counts by status and action type. Pending actions get `expires_at`; expired actions cannot be confirmed.
Confirmed actions store a receipt in their payload. `POST /api/v1/actions/{actionId}/undo` uses that receipt to roll back reversible changes such as created observations, price alerts, product-shelf entries, and profile budget/goals updates.

## Assistant

`POST /api/v1/assistant/stream` streams text blocks and a confirmable action card. With `OPENAI_API_KEY`, the API asks the OpenAI Responses API for a structured action proposal; without a key, it uses the local deterministic proposal builder.

CLI worker:

```bash
npm run jobs:run:sqlite
```

Long-running scheduler:

```bash
npm run jobs:scheduler:sqlite
```

Each job interval is configurable with `JOB_*_INTERVAL_SECONDS`; set an interval to `0` to disable that job.

## Storage

Uploads use local storage by default. For Supabase Storage or another S3-compatible service, set:

```env
STORAGE_BACKEND=s3
STORAGE_BUCKET=...
STORAGE_ENDPOINT=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

Photo reads are private. Use `GET /api/v1/scans/uploads/{photoId}/access`; local storage returns a backend stream URL, S3-compatible storage returns a presigned object URL.
