from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CareEvent, PriceOffer, Product, RoutinePlan, RoutineStep, SkinProfile, User, UserProduct


PRODUCTS = [
    {
        "external_key": "cleanser",
        "brand": "Medik8",
        "name": "Gentle Cleanser",
        "category": "Очищение",
        "description": "мягкое начало без пересушивания",
        "image_url": "/assets/products/cleanser.png",
        "actives": ["глицерин", "пантенол", "мягкие ПАВ"],
        "inci": "Aqua, Glycerin, Panthenol, Cocamidopropyl Betaine, Sodium Chloride.",
    },
    {
        "external_key": "serum",
        "brand": "KTS BEAUTY",
        "name": "Niacinamide 10%",
        "category": "Сыворотка",
        "description": "ниацинамид для тона и себума",
        "image_url": "/assets/products/serum.png",
        "actives": ["ниацинамид", "пантенол", "цинк"],
        "inci": "Aqua, Niacinamide, Propanediol, Zinc PCA, Panthenol, Betaine, Glycerin.",
    },
    {
        "external_key": "cream",
        "brand": "Innisfree",
        "name": "Rice Probiotics Barrier Cream",
        "category": "Крем",
        "description": "поддержка барьера",
        "image_url": "/assets/products/cream.png",
        "actives": ["церамиды", "рисовые пробиотики", "сквалан"],
        "inci": "Aqua, Squalane, Ceramide NP, Rice Ferment, Glycerin.",
    },
    {
        "external_key": "spf",
        "brand": "Beauty of Joseon",
        "name": "Relief Sun SPF50+ PA++++",
        "category": "SPF",
        "description": "защита каждый день",
        "image_url": "/assets/products/spf.png",
        "actives": ["spf-фильтры", "рисовый экстракт", "пробиотики"],
        "inci": "Aqua, Dibutyl Adipate, Propanediol, Niacinamide, Rice Extract.",
    },
    {
        "external_key": "oil",
        "brand": "DHC",
        "name": "Deep Cleansing Oil",
        "category": "Очищение",
        "description": "очищение SPF и макияжа",
        "image_url": "/assets/products/oil.png",
        "actives": ["оливковое масло", "витамин E"],
        "inci": "Olea Europaea Fruit Oil, Sorbeth-30 Tetraoleate, Tocopherol.",
    },
]


async def ensure_demo_data(session: AsyncSession) -> User:
    user = await session.scalar(select(User).where(User.telegram_user_id == 1000001))
    if user:
        return user

    user = User(telegram_user_id=1000001, telegram_username="demo_cosmeto", display_name="Аня")
    session.add(user)
    await session.flush()

    session.add(
        SkinProfile(
            user_id=user.id,
            skin_type="Комбинированная кожа",
            sensitivity_level="medium",
            budget_limit=4000,
            goals=["постакне", "жирный блеск", "ровный тон"],
            restrictions={"exclude": ["агрессивные кислоты"], "sensitivity": {"fragrance": True}},
            preferred_retailers=["golden-apple", "letual", "rive-gauche", "ozon"],
            location_mode="manual",
            manual_city="Москва",
        )
    )

    products: dict[str, Product] = {}
    for item in PRODUCTS:
        product = Product(**item)
        session.add(product)
        products[item["external_key"]] = product
    await session.flush()

    for key, status, note, left in [
        ("serum", "used", "Использую с 12 мая", 45),
        ("spf", "ending", "Осталось примерно на 10 дней", 18),
        ("cream", "bad", "Вызвал высыпания", 65),
        ("oil", "repeat", "Купить снова", 30),
    ]:
        session.add(UserProduct(user_id=user.id, product_id=products[key].id, status=status, note=note, amount_left_percent=left))

    plan = RoutinePlan(user_id=user.id, version=1, is_active=True)
    session.add(plan)
    await session.flush()

    routine_rows = [
        ("morning", 1, "cleanser", "cleansing", "мягкое начало без пересушивания", "Очищение убирает себум и остатки ночного ухода.", "Нанеси на влажную кожу, смой прохладной водой."),
        ("morning", 2, "serum", "serum", "ниацинамид для тона и себума", "Ниацинамид помогает с жирным блеском и следами постакне.", "2-3 капли после очищения, перед кремом."),
        ("morning", 3, "cream", "moisturizing", "поддержка барьера", "Барьерная поддержка снижает риск раздражения от активов.", "Горошина крема после сыворотки."),
        ("morning", 4, "spf", "spf", "защита каждый день", "SPF помогает не усиливать постакне и неровный тон.", "Два пальца средства за 15 минут до выхода."),
        ("evening", 1, "oil", "oil_cleanse", "смыть SPF", "Гидрофильное масло растворяет SPF и плотные текстуры.", "Нанеси на сухую кожу, эмульгируй водой и смой."),
        ("evening", 2, "cleanser", "cleansing", "второй этап", "Второй этап убирает остатки масла.", "Мягко вспень и смой."),
        ("evening", 3, "cream", "moisturizing", "восстановление", "Ночью коже нужна поддержка барьера.", "Нанеси тонким слоем."),
    ]
    for period, order, key, step_type, purpose, rationale, instructions in routine_rows:
        session.add(
            RoutineStep(
                routine_plan_id=plan.id,
                period=period,
                sequence_order=order,
                product_id=products[key].id,
                step_type=step_type,
                purpose=purpose,
                rationale=rationale,
                instructions=instructions,
                schedule_rule={"days": "daily"},
            )
        )

    for retailer_id, retailer_name, product_key, price, old_price, discount, stock in [
        ("letual", "ЛЭТУАЛЬ", "serum", 1290, 1790, "-28%", "В наличии"),
        ("golden-apple", "Золотое Яблоко", "serum", 1390, None, None, "В наличии"),
        ("rive-gauche", "РИВ ГОШ", "serum", 1510, None, None, "В наличии"),
        ("ozon", "Ozon", "serum", 1240, None, None, "проверить продавца"),
        ("wildberries", "Wildberries", "serum", 1199, None, None, "есть риск дублей"),
    ]:
        session.add(
            PriceOffer(
                product_id=products[product_key].id,
                retailer_id=retailer_id,
                retailer_name=retailer_name,
                price=price,
                old_price=old_price,
                discount_label=discount,
                stock_status=stock,
            )
        )

    for event_type, title, body in [
        ("spf_reminder", "Напоминание о SPF", "Не забудь обновить SPF после обеда."),
        ("product_ending", "Сыворотка заканчивается", "Осталось примерно на 10 дней использования."),
        ("price_drop", "Новая цена", "Для Niacinamide 10% найдено предложение дешевле."),
    ]:
        session.add(CareEvent(user_id=user.id, event_type=event_type, title=title, body=body))

    await session.commit()
    return user
