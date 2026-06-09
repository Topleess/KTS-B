import asyncio
from pathlib import Path

from app.core.database import Base, SessionLocal, engine
from app.services.seed import ensure_demo_data


async def ensure_sqlite_columns() -> None:
    if engine.dialect.name != "sqlite":
        return
    async with engine.begin() as connection:
        result = await connection.exec_driver_sql("PRAGMA table_info(pending_actions)")
        columns = {row[1] for row in result.fetchall()}
        if "expires_at" not in columns:
            await connection.exec_driver_sql("ALTER TABLE pending_actions ADD COLUMN expires_at DATETIME")


async def main() -> None:
    Path("../.data").mkdir(parents=True, exist_ok=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await ensure_sqlite_columns()
    async with SessionLocal() as session:
        await ensure_demo_data(session)


if __name__ == "__main__":
    asyncio.run(main())
