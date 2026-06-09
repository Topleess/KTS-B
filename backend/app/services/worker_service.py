from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Observation, PriceAlert, PriceOffer, Product, User, UserProduct
from app.services.environment_service import get_environment_context
from app.services.event_service import create_event_once
from app.services.notification_service import dispatch_unread_event_notifications
from app.services.price_collection_service import collect_price_offers
from app.services.profile_service import get_profile


async def run_price_collection(session: AsyncSession) -> dict:
    return await collect_price_offers(session)


async def run_price_alerts(session: AsyncSession) -> dict:
    alerts = await session.scalars(
        select(PriceAlert)
        .where(PriceAlert.is_active.is_(True))
        .options(selectinload(PriceAlert.product))
    )
    created = 0
    checked = 0
    for alert in alerts.all():
        checked += 1
        offers = await session.scalars(
            select(PriceOffer).where(PriceOffer.product_id == alert.product_id).order_by(PriceOffer.price.asc())
        )
        best_offer = offers.first()
        if not best_offer:
            continue
        target_price = alert.threshold_price or best_offer.price
        if best_offer.price <= target_price:
            user = await session.get(User, alert.user_id)
            if not user:
                continue
            event = await create_event_once(
                session,
                user,
                "price_drop",
                f"Цена ниже порога: {alert.product.name if alert.product else 'средство'}",
                f"{best_offer.retailer_name}: {best_offer.price} ₽.",
                {"product_id": str(alert.product_id), "offer_id": str(best_offer.id), "price": best_offer.price},
            )
            created += int(event is not None)
    await session.commit()
    return {"checked": checked, "created_events": created}


async def run_product_low_events(session: AsyncSession) -> dict:
    owned_products = await session.scalars(
        select(UserProduct).where(UserProduct.amount_left_percent <= 20).options(selectinload(UserProduct.product))
    )
    created = 0
    checked = 0
    for owned in owned_products.all():
        checked += 1
        user = await session.get(User, owned.user_id)
        if not user:
            continue
        event = await create_event_once(
            session,
            user,
            "product_low",
            f"{owned.product.name} заканчивается",
            owned.note or "Пора проверить цену или подобрать замену.",
            {"product_id": str(owned.product_id), "amount_left_percent": owned.amount_left_percent},
        )
        created += int(event is not None)
    await session.commit()
    return {"checked": checked, "created_events": created}


async def run_environment_events(session: AsyncSession) -> dict:
    users = await session.scalars(select(User))
    checked = 0
    created = 0
    for user in users.all():
        checked += 1
        profile = await get_profile(session, user)
        environment = await get_environment_context(profile.manual_city)
        if environment.uv_index < 6:
            continue
        event = await create_event_once(
            session,
            user,
            "uv_high",
            "Сегодня высокий UV",
            environment.spf_hint,
            {
                "city": environment.city,
                "uv_index": environment.uv_index,
                "temperature_c": environment.temperature_c,
                "source": environment.source,
            },
        )
        created += int(event is not None)
    await session.commit()
    return {"checked": checked, "created_events": created}


async def run_routine_notifications(session: AsyncSession) -> dict:
    users = await session.scalars(select(User))
    checked = 0
    created = 0
    for user in users.all():
        checked += 1
        event = await create_event_once(
            session,
            user,
            "routine_time",
            "Время ухода",
            "Утренняя рутина уже готова.",
            {"period": "morning"},
        )
        created += int(event is not None)
    await session.commit()
    return {"checked": checked, "created_events": created}


async def run_observation_followups(session: AsyncSession) -> dict:
    observations = await session.scalars(select(Observation).order_by(Observation.created_at.desc()).limit(100))
    checked = 0
    created = 0
    for observation in observations.all():
        checked += 1
        if not observation.product_id and observation.severity < 2:
            continue
        user = await session.get(User, observation.user_id)
        if not user:
            continue
        product = await session.get(Product, observation.product_id) if observation.product_id else None
        subject = product.name if product else "реакции кожи"
        event = await create_event_once(
            session,
            user,
            "followup",
            f"Как кожа после {subject}?",
            "Отметьте ощущение сейчас, чтобы уход точнее подстроился под реакцию.",
            {
                "observation_id": str(observation.id),
                "product_id": str(observation.product_id) if observation.product_id else None,
                "severity": observation.severity,
            },
        )
        created += int(event is not None)
    await session.commit()
    return {"checked": checked, "created_events": created}


async def run_notification_dispatch(session: AsyncSession) -> dict:
    return await dispatch_unread_event_notifications(session)


async def run_all_workers(session: AsyncSession) -> dict:
    return {
        "price_collection": await run_price_collection(session),
        "price_alerts": await run_price_alerts(session),
        "product_low": await run_product_low_events(session),
        "environment_events": await run_environment_events(session),
        "routine_notifications": await run_routine_notifications(session),
        "observation_followups": await run_observation_followups(session),
        "notification_dispatch": await run_notification_dispatch(session),
    }
