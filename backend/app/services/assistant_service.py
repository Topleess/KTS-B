from __future__ import annotations

import json
from collections.abc import AsyncIterator
from uuid import UUID

from openai import AsyncOpenAI, OpenAIError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.instructions import SYSTEM_INSTRUCTIONS
from app.ai.orchestrator import sse
from app.core.config import settings
from app.models import AssistantMessage, AssistantThread, Product, User
from app.schemas.action import ActionPreviewRequest
from app.schemas.assistant import AssistantRequest
from app.services.action_service import preview_action
from app.services.profile_service import has_accepted_consent

ALLOWED_ACTION_TYPES = {
    "add_observation",
    "start_price_tracking",
    "update_budget",
    "update_goals",
    "add_owned_product",
}

ACTION_PROPOSAL_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "text": {"type": "string"},
        "action_type": {
            "type": "string",
            "enum": sorted(ALLOWED_ACTION_TYPES),
        },
        "payload": {
            "type": "object",
            "additionalProperties": True,
            "properties": {
                "feeling": {"type": "string"},
                "severity": {"type": "integer"},
                "notes": {"type": "string"},
                "metrics": {"type": "object", "additionalProperties": True},
                "threshold_price": {"type": "integer"},
                "retailers": {"type": "array", "items": {"type": "string"}},
                "budget_limit": {"type": "integer"},
                "goals": {"type": "array", "items": {"type": "string"}},
                "product_id": {"type": "string"},
                "product_external_key": {"type": "string"},
                "status": {"type": "string"},
                "note": {"type": "string"},
                "amount_left_percent": {"type": "integer"},
            },
        },
    },
    "required": ["text", "action_type", "payload"],
}


async def get_or_create_thread(session: AsyncSession, user: User, payload: AssistantRequest) -> AssistantThread:
    if payload.thread_id:
        thread = await session.get(AssistantThread, payload.thread_id)
        if thread and thread.user_id == user.id:
            return thread
    thread = AssistantThread(user_id=user.id, surface=payload.surface, context=payload.context)
    session.add(thread)
    await session.flush()
    return thread


async def build_action_request(session: AsyncSession, message: str) -> ActionPreviewRequest:
    normalized = message.lower()
    if any(word in normalized for word in ["цель", "цели", "постакне", "себум"]):
        return ActionPreviewRequest(action_type="update_goals", payload={"goals": ["постакне", "ровный тон", "барьер кожи"]})
    if any(word in normalized for word in ["бюджет", "дешевле", "дороже"]):
        return ActionPreviewRequest(action_type="update_budget", payload={"budget_limit": 3500})
    if any(word in normalized for word in ["цена", "скидк", "отслеж"]):
        product = await session.scalar(select(Product).where(Product.external_key == "serum"))
        payload = {"threshold_price": 1200, "retailers": ["letual", "golden-apple"]}
        if product:
            payload["product_id"] = str(product.id)
        return ActionPreviewRequest(action_type="start_price_tracking", payload=payload)
    if any(word in normalized for word in ["добав", "полк", "средство"]):
        product = await session.scalar(select(Product).where(Product.external_key == "spf"))
        payload = {"status": "used", "note": "Добавлено из assistant proposal"}
        if product:
            payload["product_id"] = str(product.id)
        return ActionPreviewRequest(action_type="add_owned_product", payload=payload)
    return ActionPreviewRequest(
        action_type="add_observation",
        payload={"feeling": "после ухода", "severity": 2, "notes": message[:180]},
    )


async def product_id_from_external_key(session: AsyncSession, external_key: str | None) -> str | None:
    if not external_key:
        return None
    product = await session.scalar(select(Product).where(Product.external_key == external_key))
    return str(product.id) if product else None


async def normalize_action_proposal(session: AsyncSession, proposal: dict, fallback_message: str) -> ActionPreviewRequest:
    action_type = proposal.get("action_type")
    if action_type not in ALLOWED_ACTION_TYPES:
        return await build_action_request(session, fallback_message)
    payload = dict(proposal.get("payload") or {})
    if action_type in {"start_price_tracking", "add_owned_product"} and not payload.get("product_id"):
        product_id = await product_id_from_external_key(session, payload.get("product_external_key"))
        if not product_id:
            default_key = "serum" if action_type == "start_price_tracking" else "spf"
            product_id = await product_id_from_external_key(session, default_key)
        if product_id:
            payload["product_id"] = product_id
    payload.pop("product_external_key", None)
    if action_type == "add_observation":
        payload.setdefault("feeling", "после ухода")
        payload.setdefault("severity", 2)
        payload.setdefault("notes", fallback_message[:180])
        payload.setdefault("metrics", {})
    if action_type == "update_budget":
        payload["budget_limit"] = int(payload.get("budget_limit") or 3500)
    if action_type == "update_goals":
        payload["goals"] = list(payload.get("goals") or ["ровный тон", "барьер кожи"])
    if action_type == "start_price_tracking":
        payload.setdefault("threshold_price", 1200)
        payload.setdefault("retailers", ["letual", "golden-apple"])
    if action_type == "add_owned_product":
        payload.setdefault("status", "used")
        payload.setdefault("note", "Добавлено из assistant proposal")
    return ActionPreviewRequest(action_type=action_type, payload=payload)


def inline_action_for_preview(action_type: str, action_id: UUID, payload: dict) -> dict:
    action_map = {
        "add_observation": ("open_observation_form", "проверить наблюдение"),
        "start_price_tracking": ("start_price_tracking", "включить отслеживание"),
        "update_budget": ("open_profile_setting", "обновить бюджет"),
        "update_goals": ("open_profile_setting", "обновить цели"),
        "add_owned_product": ("open_product", "добавить на полку"),
    }
    ui_action, label = action_map.get(action_type, ("open_profile_setting", "проверить действие"))
    return {
        "type": "inline_action",
        "label": label,
        "action": ui_action,
        "payload": {
            "action_id": str(action_id),
            "action_type": action_type,
            **({"product_id": payload.get("product_id")} if payload.get("product_id") else {}),
        },
    }


def rich_text_segments(text: str, action_type: str, action_id: UUID, payload: dict) -> list[dict]:
    lead = text.rstrip()
    if lead and not lead.endswith((".", "!", "?", ":")):
        lead += "."
    return [
        {"type": "text", "text": f"{lead} " if lead else ""},
        inline_action_for_preview(action_type, action_id, payload),
        {"type": "text", "text": "."},
    ]


async def build_openai_proposal(session: AsyncSession, thread: AssistantThread, payload: AssistantRequest) -> tuple[str, ActionPreviewRequest]:
    catalog = await session.execute(select(Product.external_key, Product.brand, Product.name, Product.category))
    catalog_text = "\n".join(
        f"- {external_key}: {brand} {name}, {category}" for external_key, brand, name, category in catalog.all()
    )
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.responses.create(
        model=settings.openai_model,
        instructions=(
            SYSTEM_INSTRUCTIONS
            + "\nReturn JSON only. Choose exactly one confirmable action. Use product_external_key from catalog when a product is needed."
        ),
        input=[
            {
                "role": "user",
                "content": (
                    f"Контекст экрана: {thread.context}\n"
                    f"Поверхность: {thread.surface}\n"
                    f"Каталог:\n{catalog_text}\n"
                    f"Сообщение пользователя: {payload.message}"
                ),
            }
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "cosmeto_assistant_proposal",
                "schema": ACTION_PROPOSAL_SCHEMA,
                "strict": False,
            }
        },
    )
    proposal = json.loads(response.output_text)
    return proposal.get("text") or "", await normalize_action_proposal(session, proposal, payload.message)


async def stream_assistant_session(session: AsyncSession, user: User, payload: AssistantRequest) -> AsyncIterator[str]:
    thread = await get_or_create_thread(session, user, payload)
    user_message = AssistantMessage(thread_id=thread.id, role="user", content=payload.message, blocks=[])
    session.add(user_message)
    await session.flush()

    yield sse("thread", {"thread_id": str(thread.id)})

    blocks: list[dict] = []
    text = "Я подготовила безопасное действие. Проверь карточку ниже: изменение применится только после подтверждения."
    action_request = await build_action_request(session, payload.message)
    ai_personalization_allowed = await has_accepted_consent(session, user, "ai_personalization")
    if settings.openai_api_key and ai_personalization_allowed:
        try:
            proposed_text, action_request = await build_openai_proposal(session, thread, payload)
            text = proposed_text or text
        except (OpenAIError, json.JSONDecodeError, TypeError, ValueError):
            text = "Я не смогла получить AI-ответ прямо сейчас, но подготовила безопасное действие для подтверждения."
    elif settings.openai_api_key and not ai_personalization_allowed:
        text = "Я подготовила локальное безопасное действие без отправки персонального контекста во внешний AI-сервис."

    action = await preview_action(session, user, action_request)

    text_block = {
        "type": "text",
        "text": text,
        "segments": rich_text_segments(text, action.action_type, action.id, action.payload),
    }
    blocks.append(text_block)
    yield sse("block", text_block)

    if settings.openai_api_key and not ai_personalization_allowed:
        privacy_block = {
            "type": "privacy_notice",
            "payload": {
                "consent_key": "ai_personalization",
                "status": "required",
                "message": "AI personalization consent is required before sending personal context to OpenAI.",
            },
        }
        blocks.append(privacy_block)
        yield sse("block", privacy_block)

    action_block = {
        "type": "action_card",
        "action_id": str(action.id),
        "card_type": action.action_type,
        "payload": {
            "title": action.preview.get("title"),
            "summary": action.preview.get("summary"),
            "action_type": action.action_type,
            "action_id": str(action.id),
            "payload": action.payload,
        },
    }
    blocks.append(action_block)
    yield sse("block", action_block)

    assistant_message = AssistantMessage(thread_id=thread.id, role="assistant", content=blocks[0].get("text", "") if blocks else "", blocks=blocks)
    session.add(assistant_message)
    await session.commit()
    yield sse("done", {"thread_id": str(thread.id), "message_id": str(assistant_message.id)})
