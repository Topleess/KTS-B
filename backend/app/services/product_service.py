from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models import Observation, PriceAlert, PriceOffer, PriceSnapshot, Product, ScanCandidate, UploadedPhoto, User, UserProduct
from app.models.action import PendingAction
from app.schemas.product import PriceSummaryRead, ProductCheckResponse, RecommendationRead, UserProductDetailRead, UserProductSummaryRead
from app.services.profile_service import get_profile
from app.services.storage_service import store_upload


def _product_query() -> Select[tuple[Product]]:
    return select(Product).order_by(Product.brand, Product.name)


async def list_products(session: AsyncSession) -> list[Product]:
    return list((await session.scalars(_product_query())).all())


async def list_user_products(session: AsyncSession, user: User) -> list[UserProduct]:
    result = await session.scalars(
        select(UserProduct).where(UserProduct.user_id == user.id).options(selectinload(UserProduct.product)).order_by(UserProduct.created_at.desc())
    )
    return list(result.all())


async def summarize_user_products(session: AsyncSession, user: User) -> UserProductSummaryRead:
    owned_products = await list_user_products(session, user)
    alerts = await session.scalars(select(PriceAlert).where(PriceAlert.user_id == user.id, PriceAlert.is_active.is_(True)))
    tracked_product_ids = {alert.product_id for alert in alerts.all()}
    by_status: dict[str, int] = {}
    for owned in owned_products:
        by_status[owned.status] = by_status.get(owned.status, 0) + 1
    return UserProductSummaryRead(
        total=len(owned_products),
        by_status=by_status,
        low_amount_count=len([owned for owned in owned_products if owned.amount_left_percent is not None and owned.amount_left_percent <= 20]),
        tracked_count=len([owned for owned in owned_products if owned.product_id in tracked_product_ids]),
        wishlist_count=by_status.get("wishlist", 0),
        active_count=sum(by_status.get(status, 0) for status in ["used", "repeat", "ending"]),
    )


async def get_user_product(session: AsyncSession, user: User, owned_id: UUID) -> UserProduct | None:
    return await session.scalar(
        select(UserProduct)
        .where(UserProduct.id == owned_id, UserProduct.user_id == user.id)
        .options(selectinload(UserProduct.product))
    )


def next_owned_product_action(owned: UserProduct, alerts: list[PriceAlert], observations: list[Observation], price_summary: PriceSummaryRead) -> str:
    if owned.amount_left_percent is not None and owned.amount_left_percent <= 20:
        return "compare_prices"
    if owned.status in {"bad", "archived"}:
        return "find_replacement"
    if not observations:
        return "add_observation"
    if price_summary.best_offer and not alerts:
        return "track_price"
    return "keep_in_routine"


async def get_user_product_detail(session: AsyncSession, user: User, owned_id: UUID) -> UserProductDetailRead | None:
    owned = await get_user_product(session, user, owned_id)
    if not owned:
        return None
    price_summary = await get_price_summary(session, owned.product_id)
    alerts = list(
        (
            await session.scalars(
                select(PriceAlert)
                .where(PriceAlert.user_id == user.id, PriceAlert.product_id == owned.product_id, PriceAlert.is_active.is_(True))
                .options(selectinload(PriceAlert.product))
                .order_by(PriceAlert.created_at.desc())
            )
        ).all()
    )
    observations = list(
        (
            await session.scalars(
                select(Observation)
                .where(Observation.user_id == user.id, Observation.product_id == owned.product_id)
                .order_by(Observation.created_at.desc())
                .limit(5)
            )
        ).all()
    )
    return UserProductDetailRead(
        owned=owned,
        price_summary=price_summary,
        active_price_alerts=alerts,
        recent_observations=observations,
        next_action=next_owned_product_action(owned, alerts, observations, price_summary),
    )


async def add_user_product(
    session: AsyncSession,
    user: User,
    product_id: UUID,
    status: str = "used",
    note: str = "",
    amount_left_percent: int | None = None,
    commit: bool = True,
) -> UserProduct:
    product = await session.get(Product, product_id)
    if not product:
        raise ValueError("Product not found")
    owned = await session.scalar(select(UserProduct).where(UserProduct.user_id == user.id, UserProduct.product_id == product_id))
    if owned:
        owned.status = status
        owned.note = note
        owned.amount_left_percent = amount_left_percent
    else:
        owned = UserProduct(
            user_id=user.id,
            product_id=product_id,
            status=status,
            note=note,
            amount_left_percent=amount_left_percent,
        )
        session.add(owned)
    if commit:
        await session.commit()
    else:
        await session.flush()
    await session.refresh(owned, attribute_names=["product"])
    return owned


async def update_user_product(
    session: AsyncSession,
    user: User,
    owned_id: UUID,
    updates: dict,
) -> UserProduct | None:
    owned = await session.get(UserProduct, owned_id)
    if not owned or owned.user_id != user.id:
        return None
    for key, value in updates.items():
        setattr(owned, key, value)
    await session.commit()
    await session.refresh(owned, attribute_names=["product"])
    return owned


async def remove_user_product(session: AsyncSession, user: User, owned_id: UUID) -> bool:
    owned = await session.get(UserProduct, owned_id)
    if not owned or owned.user_id != user.id:
        return False
    await session.delete(owned)
    await session.commit()
    return True


async def get_product(session: AsyncSession, product_id: UUID) -> Product | None:
    return await session.get(Product, product_id)


async def list_price_offers(session: AsyncSession, product_id: UUID) -> list[PriceOffer]:
    result = await session.scalars(select(PriceOffer).where(PriceOffer.product_id == product_id).order_by(PriceOffer.price.asc()))
    return list(result.all())


async def list_price_history(session: AsyncSession, product_id: UUID, limit: int = 100) -> list[PriceSnapshot]:
    result = await session.scalars(
        select(PriceSnapshot)
        .where(PriceSnapshot.product_id == product_id)
        .order_by(PriceSnapshot.collected_at.desc())
        .limit(min(limit, 500))
    )
    return list(result.all())


async def get_price_summary(session: AsyncSession, product_id: UUID) -> PriceSummaryRead:
    offers = await list_price_offers(session, product_id)
    history = await list_price_history(session, product_id, limit=500)
    prices = [offer.price for offer in offers]
    last_collected_at = max((snapshot.collected_at for snapshot in history), default=None)
    return PriceSummaryRead(
        product_id=product_id,
        best_offer=offers[0] if offers else None,
        average_price=round(sum(prices) / len(prices)) if prices else None,
        min_price=min(prices) if prices else None,
        max_price=max(prices) if prices else None,
        offers_count=len(offers),
        history_count=len(history),
        last_collected_at=last_collected_at,
    )


async def list_recommendations(session: AsyncSession, user: User) -> list[RecommendationRead]:
    _ = user
    products = await list_products(session)
    recommendations: list[RecommendationRead] = []
    for product in products:
        offers = await list_price_offers(session, product.id)
        best_offer = offers[0] if offers else None
        score = 78
        reasons = product.actives[:2] or [product.description]
        if product.category == "SPF":
            score = 92
            reasons = ["важен при постакне и высоком UV", "можно встроить в утренний уход"]
        elif "ниацинамид" in " ".join(product.actives).lower():
            score = 89
            reasons = ["поддерживает ровный тон", "помогает с себумом"]
        recommendations.append(
            RecommendationRead(
                product=product,
                score=score,
                reasons=reasons,
                best_offer=best_offer,
                next_action="compare_prices" if best_offer else "open_product",
            )
        )
    return sorted(recommendations, key=lambda item: item.score, reverse=True)


async def get_recommendation(session: AsyncSession, user: User, product_id: UUID) -> RecommendationRead | None:
    recommendations = await list_recommendations(session, user)
    return next((item for item in recommendations if item.product.id == product_id), None)


async def create_recommendation_action(session: AsyncSession, user: User, action_type: str, payload: dict, title: str, summary: str) -> PendingAction:
    action = PendingAction(
        user_id=user.id,
        action_type=action_type,
        payload=payload,
        preview={"title": title, "summary": summary, "requires_confirmation": True},
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.pending_action_ttl_minutes),
    )
    session.add(action)
    await session.commit()
    await session.refresh(action)
    return action


async def preview_recommendation_add_owned(session: AsyncSession, user: User, product_id: UUID) -> PendingAction | None:
    recommendation = await get_recommendation(session, user, product_id)
    if not recommendation:
        return None
    return await create_recommendation_action(
        session,
        user,
        "add_owned_product",
        {
            "product_id": str(product_id),
            "status": "wishlist",
            "note": f"Добавлено из рекомендации: {', '.join(recommendation.reasons[:2])}",
            "amount_left_percent": None,
        },
        "Добавить средство на полку",
        f"{recommendation.product.brand} {recommendation.product.name} появится в разделе «Мои средства».",
    )


async def preview_recommendation_price_tracking(session: AsyncSession, user: User, product_id: UUID) -> PendingAction | None:
    recommendation = await get_recommendation(session, user, product_id)
    if not recommendation:
        return None
    threshold_price = recommendation.best_offer.price if recommendation.best_offer else None
    return await create_recommendation_action(
        session,
        user,
        "start_price_tracking",
        {
            "product_id": str(product_id),
            "threshold_price": threshold_price,
            "retailers": [recommendation.best_offer.retailer_id] if recommendation.best_offer else [],
        },
        "Отслеживать цену",
        f"Создам алерт по лучшей текущей цене: {threshold_price or 'без порога'} ₽.",
    )


async def preview_check_add_owned(session: AsyncSession, user: User, product_id: UUID) -> PendingAction | None:
    product = await session.get(Product, product_id)
    if not product:
        return None
    return await create_recommendation_action(
        session,
        user,
        "add_owned_product",
        {
            "product_id": str(product_id),
            "status": "wishlist",
            "note": "Добавлено из проверки средства",
            "amount_left_percent": None,
        },
        "Добавить после проверки",
        f"{product.brand} {product.name} появится на личной полке. Уход изменится только после подтверждения.",
    )


async def preview_check_price_tracking(session: AsyncSession, user: User, product_id: UUID) -> PendingAction | None:
    product = await session.get(Product, product_id)
    if not product:
        return None
    price_summary = await get_price_summary(session, product_id)
    threshold_price = price_summary.best_offer.price if price_summary.best_offer else None
    return await create_recommendation_action(
        session,
        user,
        "start_price_tracking",
        {
            "product_id": str(product_id),
            "threshold_price": threshold_price,
            "retailers": [price_summary.best_offer.retailer_id] if price_summary.best_offer else [],
        },
        "Отслеживать цену после проверки",
        f"Создам алерт для {product.brand} {product.name} по текущей лучшей цене: {threshold_price or 'без порога'} ₽.",
    )


async def preview_check_observation(session: AsyncSession, user: User, product_id: UUID | None, notes: str = "") -> PendingAction:
    product = await session.get(Product, product_id) if product_id else None
    product_label = f"{product.brand} {product.name}" if product else "средство из проверки"
    return await create_recommendation_action(
        session,
        user,
        "add_observation",
        {
            "product_id": str(product_id) if product_id else None,
            "feeling": "после проверки средства",
            "severity": 1,
            "notes": notes or f"Проверила {product_label}; нужно отследить реакцию после использования.",
            "metrics": {"source": "product_check"},
        },
        "Сохранить наблюдение",
        f"Добавлю заметку про {product_label} в дневник ощущений.",
    )


async def create_price_alert(
    session: AsyncSession, user: User, product_id: UUID, threshold_price: int | None, retailers: list[str]
) -> PriceAlert:
    alert = PriceAlert(user_id=user.id, product_id=product_id, threshold_price=threshold_price, retailers=retailers)
    session.add(alert)
    await session.commit()
    await session.refresh(alert, attribute_names=["product"])
    return alert


async def list_price_alerts(session: AsyncSession, user: User) -> list[PriceAlert]:
    result = await session.scalars(
        select(PriceAlert).where(PriceAlert.user_id == user.id).options(selectinload(PriceAlert.product)).order_by(PriceAlert.created_at.desc())
    )
    return list(result.all())


async def update_price_alert(
    session: AsyncSession, user: User, alert_id: UUID, threshold_price: int | None = None, retailers: list[str] | None = None, is_active: bool | None = None
) -> PriceAlert | None:
    alert = await session.get(PriceAlert, alert_id)
    if not alert or alert.user_id != user.id:
        return None
    if threshold_price is not None:
        alert.threshold_price = threshold_price
    if retailers is not None:
        alert.retailers = retailers
    if is_active is not None:
        alert.is_active = is_active
    await session.commit()
    await session.refresh(alert, attribute_names=["product"])
    return alert


async def save_upload(session: AsyncSession, user: User, file: UploadFile, photo_type: str, consent_status: str) -> UploadedPhoto:
    stored = await store_upload(str(user.id), file, photo_type)
    photo = UploadedPhoto(user_id=user.id, photo_type=photo_type, storage_path=stored.storage_path, consent_status=consent_status)
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    return photo


async def identify_scan(session: AsyncSession, user: User, query: str = "", photo_id: UUID | None = None) -> list[ScanCandidate]:
    normalized = query.strip().lower()
    products = await list_products(session)
    ranked = [
        product
        for product in products
        if not normalized or normalized in product.name.lower() or normalized in product.brand.lower() or normalized in product.category.lower()
    ][:3]
    if not ranked:
        ranked = products[:3]
    candidates: list[ScanCandidate] = []
    for index, product in enumerate(ranked):
        candidate = ScanCandidate(
            user_id=user.id,
            uploaded_photo_id=photo_id,
            product_id=product.id,
            query=query,
            confidence=max(55, 92 - index * 12),
            raw_payload={"recognition": "catalog_match", "source": "query" if query else "mock_image"},
        )
        session.add(candidate)
        candidates.append(candidate)
    await session.commit()
    for candidate in candidates:
        await session.refresh(candidate, attribute_names=["product"])
    return candidates


async def confirm_scan_candidate(session: AsyncSession, user: User, candidate_id: UUID) -> ScanCandidate | None:
    candidate = await session.get(ScanCandidate, candidate_id)
    if not candidate or candidate.user_id != user.id:
        return None
    candidate.status = "confirmed"
    await session.commit()
    await session.refresh(candidate, attribute_names=["product"])
    return candidate


def split_inci(inci: str) -> list[str]:
    return [item.strip().strip(".") for item in inci.replace("\n", ",").split(",") if item.strip()]


def ingredient_key(ingredient: str) -> str:
    return ingredient.lower().replace("-", " ").strip()


def analyze_ingredients(ingredients: list[str], profile_restrictions: dict, sensitivity_level: str) -> tuple[list[str], list[str], list[str], list[str]]:
    useful_markers = {
        "niacinamide": "тон и себум",
        "panthenol": "поддержка барьера",
        "glycerin": "увлажнение",
        "squalane": "смягчение",
        "ceramide": "барьер",
        "zinc": "себум",
        "rice": "мягкая поддержка тона",
        "betaine": "увлажнение",
    }
    caution_markers = {
        "parfum": "отдушка",
        "fragrance": "отдушка",
        "linalool": "потенциальный аллерген отдушки",
        "limonene": "потенциальный аллерген отдушки",
        "retinol": "актив, вводить постепенно",
        "glycolic": "кислота",
        "salicylic": "кислота",
        "alcohol denat": "может сушить",
    }
    excluded = [item.lower() for item in profile_restrictions.get("exclude", [])]
    useful: list[str] = []
    neutral: list[str] = []
    caution: list[str] = []
    reasons: list[str] = []

    for ingredient in ingredients:
        key = ingredient_key(ingredient)
        matched_useful = next((label for marker, label in useful_markers.items() if marker in key), None)
        matched_caution = next((label for marker, label in caution_markers.items() if marker in key), None)
        matched_exclusion = next((item for item in excluded if item and (item in key or key in item)), None)
        if matched_exclusion:
            caution.append(ingredient)
            reasons.append(f"{ingredient}: совпадает с исключением профиля")
        elif matched_caution:
            caution.append(ingredient)
            reasons.append(f"{ingredient}: {matched_caution}")
        elif matched_useful:
            useful.append(ingredient)
            reasons.append(f"{ingredient}: {matched_useful}")
        else:
            neutral.append(ingredient)

    if sensitivity_level == "high" and any(ingredient_key(item) in {"parfum", "fragrance", "linalool", "limonene"} for item in caution):
        reasons.append("профиль отмечен как чувствительный, поэтому отдушки требуют осторожности")
    return useful, neutral[:12], caution, reasons


async def check_product(session: AsyncSession, user: User, query: str, inci: str | None = None) -> ProductCheckResponse:
    normalized = query.strip().lower()
    products = await list_products(session)
    product = next((item for item in products if normalized in item.name.lower() or normalized in item.brand.lower()), None)
    profile = await get_profile(session, user)
    inci_text = inci or (product.inci if product else query)
    ingredients = split_inci(inci_text)
    useful, neutral, caution_ingredients, ingredient_reasons = analyze_ingredients(
        ingredients, profile.restrictions or {}, profile.sensitivity_level
    )

    if not product:
        if ingredients:
            verdict = "fits_with_caution" if caution_ingredients else "needs_more_context"
            if profile.sensitivity_level == "high" and caution_ingredients:
                verdict = "avoid"
            return ProductCheckResponse(
                verdict=verdict,
                summary="Разобрала состав без точного SKU. Для финального вывода лучше подтвердить бренд и продукт.",
                reasons=ingredient_reasons[:5] or ["явных конфликтов в составе не найдено"],
                cautions=["нет подтверждённой карточки продукта", *[f"Проверь {item}" for item in caution_ingredients[:3]]],
                useful_ingredients=useful,
                neutral_ingredients=neutral,
                caution_ingredients=caution_ingredients,
            )
        return ProductCheckResponse(
            verdict="needs_more_context",
            summary="Я не нашла точное совпадение. Можно уточнить бренд, название или прислать фото упаковки.",
            reasons=["без подтверждения SKU лучше не делать вывод"],
            cautions=["не добавляю средство в уход автоматически"],
        )
    verdict = "fits"
    if caution_ingredients:
        verdict = "fits_with_caution"
    if profile.sensitivity_level == "high" and caution_ingredients:
        verdict = "avoid"
    return ProductCheckResponse(
        verdict=verdict,
        summary=f"{product.brand} {product.name} можно рассмотреть для текущего профиля.",
        reasons=ingredient_reasons[:5] or product.actives[:3] or ["формула не конфликтует с базовой рутиной"],
        cautions=[f"Проверь {item}" for item in caution_ingredients[:3]]
        or (["проверь индивидуальную реакцию на небольшом участке"] if product.category != "SPF" else []),
        useful_ingredients=useful,
        neutral_ingredients=neutral,
        caution_ingredients=caution_ingredients,
        product=product,
    )
