from __future__ import annotations

import asyncio
import json
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.worker_service import (
    run_environment_events,
    run_notification_dispatch,
    run_observation_followups,
    run_price_alerts,
    run_price_collection,
    run_product_low_events,
    run_routine_notifications,
)

JobRunner = Callable[[AsyncSession], Awaitable[dict[str, Any]]]


@dataclass(frozen=True)
class ScheduledJob:
    name: str
    interval_seconds: int
    runner: JobRunner


def build_job_schedule() -> list[ScheduledJob]:
    return [
        ScheduledJob("price_collection", settings.job_price_collection_interval_seconds, run_price_collection),
        ScheduledJob("price_alerts", settings.job_price_alerts_interval_seconds, run_price_alerts),
        ScheduledJob("product_low", settings.job_product_low_interval_seconds, run_product_low_events),
        ScheduledJob("environment_events", settings.job_environment_events_interval_seconds, run_environment_events),
        ScheduledJob("routine_notifications", settings.job_routine_notifications_interval_seconds, run_routine_notifications),
        ScheduledJob("observation_followups", settings.job_observation_followups_interval_seconds, run_observation_followups),
        ScheduledJob("notification_dispatch", settings.job_notification_dispatch_interval_seconds, run_notification_dispatch),
    ]


def due_jobs(schedule: list[ScheduledJob], last_run_at: dict[str, float], now: float) -> list[ScheduledJob]:
    return [
        job
        for job in schedule
        if job.interval_seconds > 0 and now - last_run_at.get(job.name, 0) >= job.interval_seconds
    ]


async def run_due_jobs(
    session: AsyncSession,
    schedule: list[ScheduledJob] | None = None,
    last_run_at: dict[str, float] | None = None,
    now: float | None = None,
) -> dict[str, Any]:
    schedule = schedule or build_job_schedule()
    last_run_at = last_run_at if last_run_at is not None else {}
    now = now if now is not None else time.time()
    due = due_jobs(schedule, last_run_at, now)
    result: dict[str, Any] = {"ran": {}, "skipped": [job.name for job in schedule if job not in due], "now": now}
    for job in due:
        try:
            result["ran"][job.name] = await job.runner(session)
        except Exception as error:  # pragma: no cover - exercised by live worker processes
            result["ran"][job.name] = {"status": "failed", "error": str(error)}
        finally:
            last_run_at[job.name] = now
    return result


async def run_scheduler(
    *,
    session_factory: async_sessionmaker[AsyncSession] = SessionLocal,
    tick_seconds: float | None = None,
    max_ticks: int | None = None,
) -> None:
    tick_seconds = tick_seconds if tick_seconds is not None else settings.jobs_scheduler_tick_seconds
    schedule = build_job_schedule()
    last_run_at: dict[str, float] = {}
    ticks = 0
    while True:
        ticks += 1
        async with session_factory() as session:
            result = await run_due_jobs(session, schedule=schedule, last_run_at=last_run_at)
        print(json.dumps({"tick": ticks, **result}, ensure_ascii=False), flush=True)
        if max_ticks is not None and ticks >= max_ticks:
            return
        await asyncio.sleep(max(tick_seconds, 0.1))
