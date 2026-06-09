from collections.abc import AsyncIterator
import json
from uuid import uuid4

from openai import AsyncOpenAI

from app.ai.instructions import SYSTEM_INSTRUCTIONS
from app.core.config import settings


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def stream_assistant_reply(message: str, context: dict) -> AsyncIterator[str]:
    thread_id = str(context.get("thread_id") or uuid4())
    yield sse("thread", {"thread_id": thread_id})

    if not settings.openai_api_key:
        text = "Я могу предложить аккуратный следующий шаг: проверим текущее средство, сохраним ощущение кожи или подготовим изменение ухода на подтверждение."
        yield sse("block", {"type": "text", "text": text})
        yield sse(
            "block",
            {
                "type": "action_card",
                "payload": {
                    "action_type": "add_observation",
                    "title": "Сохранить наблюдение",
                    "payload": {"feeling": "после ухода", "severity": 2, "notes": message[:180]},
                },
            },
        )
        yield sse("done", {"thread_id": thread_id})
        return

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.responses.create(
        model=settings.openai_model,
        instructions=SYSTEM_INSTRUCTIONS,
        input=[
            {"role": "user", "content": f"Контекст: {json.dumps(context, ensure_ascii=False)}\nСообщение: {message}"}
        ],
    )
    yield sse("block", {"type": "text", "text": response.output_text})
    yield sse("done", {"thread_id": thread_id})
