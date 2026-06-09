from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response

from app.api.deps import CurrentUser, SessionDep
from app.models import UploadedPhoto
from app.schemas.profile import SkinProfileRead, SkinProfileUpdate
from app.schemas.settings import ConsentItem, ConsentUpdate, ConsentsRead, NotificationSettingsRead, NotificationSettingsUpdate, PermissionsRead, PermissionsUpdate
from app.services.privacy_service import delete_user_account, export_user_data
from app.services.profile_service import (
    get_consents,
    get_notification_settings,
    get_permissions,
    get_profile,
    update_consent,
    update_notification_settings,
    update_permissions,
    update_profile,
)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=SkinProfileRead)
async def read_profile(session: SessionDep, user: CurrentUser) -> SkinProfileRead:
    return await get_profile(session, user)


@router.patch("", response_model=SkinProfileRead)
async def patch_profile(payload: SkinProfileUpdate, session: SessionDep, user: CurrentUser) -> SkinProfileRead:
    return await update_profile(session, user, payload)


@router.get("/consents", response_model=ConsentsRead)
async def consents(session: SessionDep, user: CurrentUser) -> ConsentsRead:
    return await get_consents(session, user)


@router.patch("/consents/{key}", response_model=ConsentItem)
async def patch_consent(key: str, payload: ConsentUpdate, session: SessionDep, user: CurrentUser) -> ConsentItem:
    return await update_consent(session, user, key, payload)


@router.get("/permissions", response_model=PermissionsRead)
async def permissions(session: SessionDep, user: CurrentUser) -> PermissionsRead:
    return await get_permissions(session, user)


@router.patch("/permissions", response_model=PermissionsRead)
async def patch_permissions(payload: PermissionsUpdate, session: SessionDep, user: CurrentUser) -> PermissionsRead:
    return await update_permissions(session, user, payload)


@router.get("/notification-settings", response_model=NotificationSettingsRead)
async def notification_settings(session: SessionDep, user: CurrentUser) -> NotificationSettingsRead:
    return await get_notification_settings(session, user)


@router.patch("/notification-settings", response_model=NotificationSettingsRead)
async def patch_notification_settings(
    payload: NotificationSettingsUpdate, session: SessionDep, user: CurrentUser
) -> NotificationSettingsRead:
    return await update_notification_settings(session, user, payload)


@router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    photo = await session.get(UploadedPhoto, photo_id)
    if not photo or photo.user_id != user.id:
        raise HTTPException(status_code=404, detail="Photo not found")
    photo.deleted_at = datetime.now(UTC)
    await session.commit()
    return {"status": "deleted", "id": str(photo.id)}


@router.get("/data/export")
async def export_data(session: SessionDep, user: CurrentUser) -> dict:
    return await export_user_data(session, user)


@router.delete("/data")
async def delete_data(response: Response, session: SessionDep, user: CurrentUser) -> dict:
    result = await delete_user_account(session, user)
    response.delete_cookie("cosmeto_session")
    return result


@router.delete("/account")
async def delete_account(response: Response, session: SessionDep, user: CurrentUser) -> dict:
    result = await delete_user_account(session, user)
    response.delete_cookie("cosmeto_session")
    return result
