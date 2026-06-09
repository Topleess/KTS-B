import asyncio
import json

from app.core.database import SessionLocal
from app.services.worker_service import run_all_workers


async def main() -> None:
    async with SessionLocal() as session:
        result = await run_all_workers(session)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
