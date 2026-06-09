from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, SessionDep
from app.models import UploadedPhoto, User
from app.schemas.product import ScanCandidateRead, ScanIdentifyRequest, UploadedPhotoAccessRead, UploadedPhotoRead
from app.services.product_service import confirm_scan_candidate, identify_scan, save_upload
from app.services.profile_service import has_accepted_consent
from app.services.storage_service import create_storage_access, resolve_local_storage_path

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("/uploads", response_model=UploadedPhotoRead)
async def upload_scan_photo(
    session: SessionDep,
    user: CurrentUser,
    file: UploadFile = File(...),
    photo_type: str = Form("product"),
    consent_status: str = Form("granted"),
) -> UploadedPhotoRead:
    if not await has_accepted_consent(session, user, "photo_analysis"):
        raise HTTPException(status_code=403, detail="Photo analysis consent is required")
    return await save_upload(session, user, file, photo_type, consent_status)


async def get_user_photo(session: AsyncSession, user: User, photo_id: UUID) -> UploadedPhoto:
    photo = await session.get(UploadedPhoto, photo_id)
    if not photo or photo.user_id != user.id or photo.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo


@router.get("/uploads/{photo_id}/access", response_model=UploadedPhotoAccessRead)
async def uploaded_photo_access(photo_id: UUID, session: SessionDep, user: CurrentUser) -> UploadedPhotoAccessRead:
    photo = await get_user_photo(session, user, photo_id)
    try:
        access = create_storage_access(str(photo.storage_path), f"/api/v1/scans/uploads/{photo.id}/content")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Stored object not found") from None
    return UploadedPhotoAccessRead(
        url=access.url,
        expires_in_seconds=access.expires_in_seconds,
        access_type=access.access_type,
    )


@router.get("/uploads/{photo_id}/content")
async def uploaded_photo_content(photo_id: UUID, session: SessionDep, user: CurrentUser) -> FileResponse:
    photo = await get_user_photo(session, user, photo_id)
    path = resolve_local_storage_path(str(photo.storage_path))
    if not path:
        raise HTTPException(status_code=404, detail="Stored object is not available through backend streaming")
    return FileResponse(path)


@router.post("/identify", response_model=list[ScanCandidateRead])
async def identify(payload: ScanIdentifyRequest, session: SessionDep, user: CurrentUser) -> list[ScanCandidateRead]:
    return await identify_scan(session, user, payload.query, payload.photo_id)


@router.post("/{candidate_id}/confirm", response_model=ScanCandidateRead)
async def confirm(candidate_id: UUID, session: SessionDep, user: CurrentUser) -> ScanCandidateRead:
    candidate = await confirm_scan_candidate(session, user, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Scan candidate not found")
    return candidate
