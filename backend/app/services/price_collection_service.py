from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import PriceOffer, PriceSnapshot, Product


DEFAULT_PRICE_SOURCE = [
    {
        "product_external_key": "serum",
        "retailer_id": "golden-apple",
        "retailer_name": "Золотое Яблоко",
        "price": 1370,
        "old_price": 1790,
        "discount_label": "-23%",
        "stock_status": "В наличии",
        "url": None,
    },
    {
        "product_external_key": "spf",
        "retailer_id": "ozon",
        "retailer_name": "Ozon",
        "price": 820,
        "old_price": None,
        "discount_label": None,
        "stock_status": "проверить продавца",
        "url": None,
    },
]


async def load_price_source() -> list[dict[str, Any]]:
    source = settings.price_sources_url
    if not source:
        return DEFAULT_PRICE_SOURCE
    if source.startswith("http://") or source.startswith("https://"):
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(source)
            response.raise_for_status()
        payload = response.json()
    else:
        payload = json.loads(Path(source).read_text())
    if isinstance(payload, dict):
        payload = payload.get("offers", [])
    if not isinstance(payload, list):
        raise ValueError("Price source must be a list or {'offers': [...]}")
    return payload


async def collect_price_offers(session: AsyncSession) -> dict:
    rows = await load_price_source()
    upserted = 0
    skipped = 0
    for row in rows:
        product = await session.scalar(select(Product).where(Product.external_key == row.get("product_external_key")))
        if not product:
            skipped += 1
            continue
        existing = await session.scalar(
            select(PriceOffer).where(
                PriceOffer.product_id == product.id,
                PriceOffer.retailer_id == row["retailer_id"],
            )
        )
        if not existing:
            existing = PriceOffer(product_id=product.id, retailer_id=row["retailer_id"], retailer_name=row["retailer_name"], price=row["price"])
            session.add(existing)
        existing.retailer_name = row["retailer_name"]
        existing.price = int(row["price"])
        existing.old_price = row.get("old_price")
        existing.discount_label = row.get("discount_label")
        existing.stock_status = row.get("stock_status", "unknown")
        existing.url = row.get("url")
        collected_at = datetime.now(UTC)
        existing.collected_at = collected_at
        session.add(
            PriceSnapshot(
                product_id=product.id,
                retailer_id=row["retailer_id"],
                retailer_name=row["retailer_name"],
                price=int(row["price"]),
                old_price=row.get("old_price"),
                discount_label=row.get("discount_label"),
                stock_status=row.get("stock_status", "unknown"),
                url=row.get("url"),
                collected_at=collected_at,
            )
        )
        upserted += 1
    await session.commit()
    return {"source": settings.price_sources_url or "default_static", "upserted": upserted, "skipped": skipped}
