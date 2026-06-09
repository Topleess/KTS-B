from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.observation import ObservationCreate, ObservationRead
from app.services.observation_service import create_observation, list_observations

router = APIRouter(prefix="/observations", tags=["observations"])


@router.get("", response_model=list[ObservationRead])
async def observations_index(session: SessionDep, user: CurrentUser) -> list[ObservationRead]:
    return await list_observations(session, user)


@router.get("/summary")
async def observations_summary(session: SessionDep, user: CurrentUser) -> dict:
    observations = await list_observations(session, user, limit=100)
    if not observations:
        return {"total": 0, "average_severity": 0, "top_feelings": []}
    counts: dict[str, int] = {}
    for item in observations:
        counts[item.feeling] = counts.get(item.feeling, 0) + 1
    return {
        "total": len(observations),
        "average_severity": round(sum(item.severity for item in observations) / len(observations), 1),
        "top_feelings": sorted(counts.items(), key=lambda pair: pair[1], reverse=True)[:5],
    }


@router.post("", response_model=ObservationRead)
async def observations_create(payload: ObservationCreate, session: SessionDep, user: CurrentUser) -> ObservationRead:
    return await create_observation(session, user, payload)
