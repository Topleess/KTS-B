from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Product, RoutinePlan, RoutineSession, RoutineStep, SkinProfile, User
from app.schemas.routine import RoutineQuestionnaireRequest, RoutineStepCreate, RoutineStepUpdate
from app.services.profile_service import get_profile


async def get_active_plan(session: AsyncSession, user: User) -> RoutinePlan:
    plan = await session.scalar(
        select(RoutinePlan)
        .where(RoutinePlan.user_id == user.id, RoutinePlan.is_active.is_(True))
        .options(selectinload(RoutinePlan.steps).selectinload(RoutineStep.product))
        .order_by(RoutinePlan.version.desc())
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No active routine plan")
    sort_plan_steps(plan)
    return plan


def sort_plan_steps(plan: RoutinePlan) -> None:
    period_order = {"morning": 0, "day": 1, "evening": 2}
    plan.steps = sorted(plan.steps, key=lambda step: (period_order.get(step.period, 99), step.sequence_order))


async def get_active_step(session: AsyncSession, user: User, step_id: UUID) -> RoutineStep:
    step = await session.scalar(
        select(RoutineStep)
        .join(RoutinePlan, RoutineStep.routine_plan_id == RoutinePlan.id)
        .where(RoutineStep.id == step_id, RoutinePlan.user_id == user.id, RoutinePlan.is_active.is_(True))
        .options(selectinload(RoutineStep.product))
    )
    if not step:
        raise HTTPException(status_code=404, detail="Routine step not found")
    return step


async def validate_step_product(session: AsyncSession, product_id: UUID | None) -> Product | None:
    if not product_id:
        return None
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def create_routine_step(session: AsyncSession, user: User, payload: RoutineStepCreate) -> RoutineStep:
    plan = await get_active_plan(session, user)
    await validate_step_product(session, payload.product_id)
    step = RoutineStep(
        routine_plan_id=plan.id,
        period=payload.period,
        sequence_order=payload.sequence_order,
        product_id=payload.product_id,
        step_type=payload.step_type,
        purpose=payload.purpose,
        rationale=payload.rationale,
        instructions=payload.instructions,
        schedule_rule=payload.schedule_rule,
        is_active=True,
    )
    session.add(step)
    await session.commit()
    await session.refresh(step, attribute_names=["product"])
    return step


async def update_routine_step(session: AsyncSession, user: User, step_id: UUID, payload: RoutineStepUpdate) -> RoutineStep:
    step = await get_active_step(session, user, step_id)
    updates = payload.model_dump(exclude_unset=True)
    if "product_id" in updates:
        await validate_step_product(session, updates["product_id"])
    for key, value in updates.items():
        setattr(step, key, value)
    await session.commit()
    await session.refresh(step, attribute_names=["product"])
    return step


async def deactivate_routine_step(session: AsyncSession, user: User, step_id: UUID) -> RoutineStep:
    step = await get_active_step(session, user, step_id)
    step.is_active = False
    await session.commit()
    await session.refresh(step, attribute_names=["product"])
    return step


async def start_session(session: AsyncSession, user: User, period: str) -> RoutineSession:
    plan = await get_active_plan(session, user)
    routine_session = RoutineSession(user_id=user.id, routine_plan_id=plan.id, period=period)
    session.add(routine_session)
    await session.commit()
    await session.refresh(routine_session)
    return routine_session


async def get_or_start_current_session(session: AsyncSession, user: User, period: str) -> RoutineSession:
    plan = await get_active_plan(session, user)
    routine_session = await session.scalar(
        select(RoutineSession)
        .where(
            RoutineSession.user_id == user.id,
            RoutineSession.routine_plan_id == plan.id,
            RoutineSession.period == period,
            RoutineSession.status.in_(["started", "in_progress"]),
        )
        .order_by(RoutineSession.started_at.desc())
    )
    if routine_session:
        return routine_session

    routine_session = RoutineSession(user_id=user.id, routine_plan_id=plan.id, period=period)
    session.add(routine_session)
    await session.commit()
    await session.refresh(routine_session)
    return routine_session


async def get_current_session(session: AsyncSession, user: User, period: str) -> RoutineSession | None:
    plan = await get_active_plan(session, user)
    return await session.scalar(
        select(RoutineSession)
        .where(
            RoutineSession.user_id == user.id,
            RoutineSession.routine_plan_id == plan.id,
            RoutineSession.period == period,
            RoutineSession.status.in_(["started", "in_progress"]),
        )
        .order_by(RoutineSession.started_at.desc())
    )


async def list_sessions(session: AsyncSession, user: User, limit: int = 20) -> list[RoutineSession]:
    rows = await session.scalars(
        select(RoutineSession)
        .where(RoutineSession.user_id == user.id)
        .order_by(RoutineSession.started_at.desc())
        .limit(min(max(limit, 1), 100))
    )
    return list(rows.all())


async def get_progress(session: AsyncSession, user: User, period: str) -> dict:
    plan = await get_active_plan(session, user)
    routine_session = await get_current_session(session, user, period)
    steps = [step for step in plan.steps if step.period == period and step.is_active]
    completed_ids = set(routine_session.completed_step_ids if routine_session else [])
    completed_steps = len([step for step in steps if str(step.id) in completed_ids])
    next_step = next((step for step in steps if str(step.id) not in completed_ids), None)
    total_steps = len(steps)
    return {
        "routine": plan,
        "session": routine_session,
        "period": period,
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "completion_percent": round((completed_steps / total_steps) * 100) if total_steps else 0,
        "next_step": next_step,
    }


async def complete_step(session: AsyncSession, user: User, routine_session_id: UUID, step_id: UUID) -> RoutineSession:
    routine_session = await session.get(RoutineSession, routine_session_id)
    if not routine_session or routine_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Routine session not found")
    step = await session.get(RoutineStep, step_id)
    if not step or step.routine_plan_id != routine_session.routine_plan_id or step.period != routine_session.period:
        raise HTTPException(status_code=404, detail="Routine step not found for this session")
    step_ids = {str(item) for item in routine_session.completed_step_ids}
    step_ids.add(str(step_id))
    routine_session.completed_step_ids = sorted(step_ids)
    routine_session.status = "in_progress"
    remaining = await session.scalar(
        select(func.count(RoutineStep.id)).where(
            RoutineStep.routine_plan_id == routine_session.routine_plan_id,
            RoutineStep.period == routine_session.period,
            RoutineStep.is_active.is_(True),
            RoutineStep.id.not_in([UUID(item) for item in routine_session.completed_step_ids]),
        )
    )
    if remaining == 0:
        routine_session.status = "completed"
        routine_session.completed_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(routine_session)
    return routine_session


async def complete_session(session: AsyncSession, user: User, routine_session_id: UUID) -> RoutineSession:
    routine_session = await session.get(RoutineSession, routine_session_id)
    if not routine_session or routine_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Routine session not found")
    routine_session.status = "completed"
    routine_session.completed_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(routine_session)
    return routine_session


def normalize_budget(value: str) -> int | None:
    return {"b1": 1500, "b2": 4000, "b3": 8000}.get(value)


def normalize_skin_type(value: str) -> str:
    return value or "Не указано"


def normalize_sensitivity(payload: RoutineQuestionnaireRequest) -> str:
    if payload.skinType == "Чувствительная" or any(payload.restrictions.sensitivity.values()):
        return "high"
    if payload.restrictions.exclude:
        return "medium"
    return "normal"


async def generate_routine_from_questionnaire(
    session: AsyncSession, user: User, payload: RoutineQuestionnaireRequest
) -> RoutinePlan:
    profile: SkinProfile = await get_profile(session, user)
    restrictions = dict(profile.restrictions or {})
    restrictions["onboarding"] = payload.model_dump()
    restrictions["exclude"] = payload.restrictions.exclude
    restrictions["sensitivity"] = payload.restrictions.sensitivity
    profile.skin_type = normalize_skin_type(payload.skinType)
    profile.sensitivity_level = normalize_sensitivity(payload)
    profile.budget_limit = normalize_budget(payload.budget)
    profile.goals = payload.focus
    profile.preferred_retailers = payload.stores
    profile.restrictions = restrictions

    product_rows = await session.scalars(select(Product).where(Product.external_key.in_(["cleanser", "serum", "cream", "spf", "oil"])))
    products = {product.external_key: product for product in product_rows.all()}

    current_version = await session.scalar(select(func.max(RoutinePlan.version)).where(RoutinePlan.user_id == user.id))
    await session.execute(update(RoutinePlan).where(RoutinePlan.user_id == user.id).values(is_active=False))
    plan = RoutinePlan(user_id=user.id, version=(current_version or 0) + 1, is_active=True)
    session.add(plan)
    await session.flush()

    focus_text = " ".join(payload.focus).lower()
    categories = set(payload.category)
    wants_spf = "spf" in categories or "spf-защита" in focus_text or "ровный тон" in focus_text or "постакне" in focus_text
    barrier_first = profile.sensitivity_level == "high" or "увлажнение" in focus_text or "чувствительность" in focus_text
    wants_sebum_help = "жирный блеск" in focus_text or "постакне" in focus_text or "ровный тон" in focus_text

    rows: list[tuple[str, int, str, str, str, str, str, dict]] = [
        (
            "morning",
            1,
            "cleanser",
            "cleansing",
            "мягкое очищение",
            "Начинаем с мягкой базы, чтобы не усиливать чувствительность и сухость.",
            "Нанеси на влажную кожу и смой прохладной водой.",
            {"days": "daily"},
        )
    ]
    order = 2
    if wants_sebum_help and not barrier_first:
        rows.append(
            (
                "morning",
                order,
                "serum",
                "serum",
                "работа с тоном и себумом",
                "Ниацинамид подходит как первый актив для жирного блеска, постакне и неровного тона.",
                "2-3 капли после очищения, затем крем.",
                {"days": "daily"},
            )
        )
        order += 1
    rows.append(
        (
            "morning",
            order,
            "cream",
            "moisturizing",
            "поддержка барьера",
            "Увлажнение удерживает рутину комфортной и снижает риск реакции на активы.",
            "Горошина крема после сыворотки или сразу после очищения.",
            {"days": "daily"},
        )
    )
    order += 1
    if wants_spf:
        rows.append(
            (
                "morning",
                order,
                "spf",
                "spf",
                "ежедневная защита",
                "SPF помогает не усиливать постакне, пигментацию и неровный тон.",
                "Два пальца средства за 15 минут до выхода.",
                {"days": "daily"},
            )
        )

    evening_rows: list[tuple[str, int, str, str, str, str, str, dict]] = [
        (
            "evening",
            1,
            "oil" if wants_spf else "cleanser",
            "oil_cleanse" if wants_spf else "cleansing",
            "снять SPF и загрязнения" if wants_spf else "вечернее очищение",
            "Если днём был SPF, первый этап помогает снять плотные фильтры без трения.",
            "Нанеси на сухую кожу, эмульгируй водой и смой." if wants_spf else "Мягко вспень и смой.",
            {"days": "daily"},
        )
    ]
    next_order = 2
    if wants_spf:
        evening_rows.append(
            (
                "evening",
                next_order,
                "cleanser",
                "cleansing",
                "второй этап",
                "Второй этап убирает остатки масла и SPF.",
                "Нанеси на влажную кожу и смой.",
                {"days": "daily"},
            )
        )
        next_order += 1
    if wants_sebum_help and barrier_first:
        evening_rows.append(
            (
                "evening",
                next_order,
                "serum",
                "serum",
                "мягкая работа с тоном",
                "При чувствительности актив лучше оставить на вечер и вводить постепенно.",
                "Начни через день; если комфортно, переходи на ежедневное использование.",
                {"days": "every_other_day"},
            )
        )
        next_order += 1
    evening_rows.append(
        (
            "evening",
            next_order,
            "cream",
            "moisturizing",
            "восстановление",
            "Ночью коже нужна поддержка барьера и спокойное восстановление.",
            "Нанеси тонким слоем как последний шаг.",
            {"days": "daily"},
        )
    )
    rows.extend(evening_rows)

    for period, order, key, step_type, purpose, rationale, instructions, schedule_rule in rows:
        product = products.get(key)
        session.add(
            RoutineStep(
                routine_plan_id=plan.id,
                period=period,
                sequence_order=order,
                product_id=product.id if product else None,
                step_type=step_type,
                purpose=purpose,
                rationale=rationale,
                instructions=instructions,
                schedule_rule=schedule_rule,
            )
        )

    await session.commit()
    created = await session.scalar(
        select(RoutinePlan)
        .where(RoutinePlan.id == plan.id)
        .options(selectinload(RoutinePlan.steps).selectinload(RoutineStep.product))
    )
    if not created:
        raise HTTPException(status_code=500, detail="Routine generation failed")
    sort_plan_steps(created)
    return created
