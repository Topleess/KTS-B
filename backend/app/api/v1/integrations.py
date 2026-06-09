from fastapi import APIRouter

from app.api.deps import SessionDep
from app.schemas.integration import IntegrationsStatusRead
from app.services.integration_service import integrations_status

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/status", response_model=IntegrationsStatusRead)
async def status(session: SessionDep) -> IntegrationsStatusRead:
    return await integrations_status(session)
