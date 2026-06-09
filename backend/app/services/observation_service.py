from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Observation, User
from app.schemas.observation import ObservationCreate


async def create_observation(session: AsyncSession, user: User, payload: ObservationCreate) -> Observation:
    observation = Observation(user_id=user.id, **payload.model_dump())
    session.add(observation)
    await session.commit()
    await session.refresh(observation)
    return observation


async def list_observations(session: AsyncSession, user: User, limit: int = 30) -> list[Observation]:
    result = await session.scalars(
        select(Observation).where(Observation.user_id == user.id).order_by(Observation.created_at.desc()).limit(limit)
    )
    return list(result.all())
