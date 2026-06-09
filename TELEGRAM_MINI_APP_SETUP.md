# Telegram Mini App Setup

This project is a Next.js frontend on port `3000` with a FastAPI backend on port `8000`. In local development, Next.js proxies `/api/v1/*` to the backend so the Telegram WebView never calls `localhost:8000` directly.

## 1. Install Dependencies

```bash
npm install
python3 -m venv .venv
source .venv/bin/activate
pip install -e "backend[test]"
```

If you do not have Cloudflare Tunnel installed on macOS:

```bash
brew install cloudflared
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Set your bot token from BotFather:

```env
TELEGRAM_BOT_TOKEN="123456:your-bot-token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_bot_username"
NEXT_PUBLIC_API_BASE_URL="/api/v1"
FRONTEND_ORIGIN="http://localhost:3000"
```

Do not commit real secrets.

## 3. Start The Backend

SQLite local fallback:

```bash
npm run db:init:sqlite
npm run dev:api:sqlite
```

Postgres local setup:

```bash
npm run db:up
npm run db:migrate
npm run dev:api
```

Backend docs are available at `http://localhost:8000/docs`.

## 4. Start The Frontend

In a second terminal:

```bash
npm run dev
```

Open `http://localhost:3000` in a normal browser to verify the app still works outside Telegram. In development, the app uses `/auth/dev-login` when Telegram `initData` is not available.

## 5. Start The HTTPS Tunnel

In a third terminal:

```bash
npm run tunnel
```

Cloudflare prints a public URL like:

```text
https://xxxxx.trycloudflare.com
```

Use that exact HTTPS URL for Telegram.

## 6. Configure BotFather

Open BotFather and set the Mini App/Menu Button URL:

```text
BotFather -> Bot Settings -> Menu Button / Mini App URL
```

Paste the Cloudflare URL:

```text
https://xxxxx.trycloudflare.com
```

Эту ссылку нужно вставить в BotFather -> Bot Settings -> Menu Button / Mini App URL.

## 7. Verify Telegram Environment

Open your bot in Telegram and launch the Mini App. In development, the Profile screen shows a `Telegram debug` block with:

- Telegram WebApp availability
- `initData` presence
- Telegram user presence
- Telegram `id`, `username`, and `first_name`
- auth status or auth error

The debug block is hidden in production builds.

## 8. If The URL Changes

Free Cloudflare Tunnel URLs are temporary. If you stop and restart `npm run tunnel`, Cloudflare may generate a new `https://xxxxx.trycloudflare.com` URL.

When it changes:

1. Copy the new URL from the tunnel terminal.
2. Update BotFather's Menu Button / Mini App URL.
3. Fully close and reopen the Mini App in Telegram.

## 9. Cloudflare Tunnel Shows 502

Check these in order:

1. `npm run dev` is running and `http://localhost:3000` opens locally.
2. The tunnel command is `cloudflared tunnel --url http://localhost:3000`.
3. The frontend terminal has no build/runtime error.
4. The backend is running if the app needs API data.
5. The Next.js proxy can reach `http://localhost:8000/api/v1`.

## 10. Telegram User Does Not Appear

Common causes:

1. The app was opened in a normal browser instead of inside Telegram.
2. BotFather still points to an old tunnel URL.
3. The Mini App was not fully closed and reopened after changing the URL.
4. `TELEGRAM_BOT_TOKEN` is missing or does not match the bot that opened the Mini App.
5. The backend rejected `initData`; check the frontend `Telegram debug` block and backend logs.

`initDataUnsafe` is only used for display. Real authentication is done by validating raw `initData` on the backend.

## 11. Production / VPS Notes

For production:

1. Deploy the Next.js frontend and FastAPI backend behind HTTPS.
2. Set `APP_ENV="production"`.
3. Set a strong `JWT_SECRET`.
4. Set `ALLOW_DEV_AUTH="false"`.
5. Set the real `TELEGRAM_BOT_TOKEN`.
6. Point `NEXT_PUBLIC_API_BASE_URL` to the production API path or keep a same-origin `/api/v1` proxy.
7. Set BotFather's Mini App URL to the permanent HTTPS production URL.
