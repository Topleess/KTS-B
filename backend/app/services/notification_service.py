from __future__ import annotations

from datetime import UTC, datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import CareEvent, User
from app.services.profile_service import get_notification_settings


EVENT_SETTING_MAP = {
    "price_drop": "price_alerts",
    "uv_high": "uv_alerts",
    "routine_time": "routine_reminders",
    "spf_reminder": "uv_alerts",
    "product_low": "price_alerts",
    "product_ending": "price_alerts",
}


def render_event_message(event: CareEvent) -> str:
    body = f"\n\n{event.body}" if event.body else ""
    return f"{event.title}{body}"


async def event_notifications_enabled(session: AsyncSession, user: User, event: CareEvent) -> bool:
    settings_read = await get_notification_settings(session, user)
    setting_name = EVENT_SETTING_MAP.get(event.event_type)
    if not setting_name:
        return True
    return bool(getattr(settings_read, setting_name))


async def send_telegram_message(telegram_user_id: int, text: str) -> dict:
    if not settings.telegram_notifications_enabled:
        return {"status": "dry_run", "provider": "telegram", "chat_id": telegram_user_id, "reason": "disabled"}
    if not settings.telegram_bot_token:
        return {"status": "dry_run", "provider": "telegram", "chat_id": telegram_user_id}
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.post(
            f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
            json={"chat_id": telegram_user_id, "text": text, "disable_web_page_preview": True},
        )
        response.raise_for_status()
        payload = response.json()
    return {"status": "sent", "provider": "telegram", "message_id": payload.get("result", {}).get("message_id")}


async def dispatch_unread_event_notifications(session: AsyncSession, limit: int = 50) -> dict:
    result = await session.scalars(
        select(CareEvent).where(CareEvent.is_read.is_(False)).order_by(CareEvent.created_at.asc()).limit(limit)
    )
    checked = 0
    sent = 0
    skipped = 0
    dry_run = 0
    failed = 0
    for event in result.all():
        checked += 1
        payload = dict(event.payload or {})
        notification = dict(payload.get("notification") or {})
        if notification.get("status") in {"sent", "dry_run"}:
            skipped += 1
            continue
        user = await session.get(User, event.user_id)
        if not user or not user.telegram_user_id:
            skipped += 1
            payload["notification"] = {"status": "skipped", "reason": "no_telegram_user_id"}
            event.payload = payload
            continue
        if not await event_notifications_enabled(session, user, event):
            skipped += 1
            payload["notification"] = {"status": "skipped", "reason": "disabled_by_user"}
            event.payload = payload
            continue
        try:
            delivery = await send_telegram_message(user.telegram_user_id, render_event_message(event))
            delivery["delivered_at"] = datetime.now(UTC).isoformat()
            payload["notification"] = delivery
            event.payload = payload
            sent += int(delivery["status"] == "sent")
            dry_run += int(delivery["status"] == "dry_run")
        except Exception as error:
            failed += 1
            payload["notification"] = {"status": "failed", "error": str(error), "failed_at": datetime.now(UTC).isoformat()}
            event.payload = payload
    await session.commit()
    return {"checked": checked, "sent": sent, "dry_run": dry_run, "skipped": skipped, "failed": failed}
