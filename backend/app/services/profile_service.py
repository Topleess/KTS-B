from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SkinProfile, User
from app.schemas.profile import SkinProfileUpdate
from app.schemas.settings import ConsentItem, ConsentUpdate, ConsentsRead, NotificationSettingsRead, NotificationSettingsUpdate, PermissionsRead, PermissionsUpdate


PERMISSION_VALUES = {"granted", "denied", "not_requested", "manual", "unavailable"}
CONSENT_KEYS = {"data_processing", "privacy_policy", "ai_personalization", "photo_analysis", "marketing_notifications"}
CONSENT_STATUSES = {"accepted", "revoked", "not_requested"}


def permissions_payload(profile: SkinProfile) -> dict:
    permissions = dict((profile.restrictions or {}).get("permissions", {}))
    return {
        "camera": permissions.get("camera", "not_requested"),
        "geolocation": permissions.get("geolocation", "manual"),
        "skin_photos": permissions.get("skin_photos", "not_requested"),
        "notifications": permissions.get("notifications", "not_requested"),
    }


def validate_permission_values(values: dict) -> None:
    invalid = {key: value for key, value in values.items() if value is not None and value not in PERMISSION_VALUES}
    if invalid:
        raise HTTPException(status_code=422, detail={"invalid_permissions": invalid, "allowed": sorted(PERMISSION_VALUES)})


def consent_defaults() -> dict[str, dict]:
    return {key: {"status": "not_requested", "version": "v0.1", "updated_at": None} for key in sorted(CONSENT_KEYS)}


def consents_payload(profile: SkinProfile) -> dict[str, dict]:
    stored = dict((profile.restrictions or {}).get("consents", {}))
    defaults = consent_defaults()
    for key, value in stored.items():
        if key in defaults and isinstance(value, dict):
            defaults[key].update(value)
    return defaults


async def has_accepted_consent(session: AsyncSession, user: User, key: str) -> bool:
    if key not in CONSENT_KEYS:
        return False
    profile = await get_profile(session, user)
    return consents_payload(profile)[key]["status"] == "accepted"


def validate_consent(key: str, payload: ConsentUpdate) -> None:
    if key not in CONSENT_KEYS:
        raise HTTPException(status_code=404, detail="Consent key not found")
    if payload.status not in CONSENT_STATUSES:
        raise HTTPException(status_code=422, detail={"invalid_status": payload.status, "allowed": sorted(CONSENT_STATUSES)})


async def get_profile(session: AsyncSession, user: User) -> SkinProfile:
    profile = await session.scalar(select(SkinProfile).where(SkinProfile.user_id == user.id))
    if profile:
        return profile
    profile = SkinProfile(user_id=user.id)
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def update_profile(session: AsyncSession, user: User, payload: SkinProfileUpdate) -> SkinProfile:
    profile = await get_profile(session, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    await session.commit()
    await session.refresh(profile)
    return profile


async def get_permissions(session: AsyncSession, user: User) -> PermissionsRead:
    profile = await get_profile(session, user)
    return PermissionsRead(**permissions_payload(profile))


async def get_consents(session: AsyncSession, user: User) -> ConsentsRead:
    profile = await get_profile(session, user)
    consents = consents_payload(profile)
    return ConsentsRead(consents=[ConsentItem(key=key, **value) for key, value in consents.items()])


async def update_consent(session: AsyncSession, user: User, key: str, payload: ConsentUpdate) -> ConsentItem:
    validate_consent(key, payload)
    profile = await get_profile(session, user)
    restrictions = dict(profile.restrictions or {})
    consents = consents_payload(profile)
    timestamp = datetime.now(UTC).isoformat()
    previous = dict(consents[key])
    consents[key] = {"status": payload.status, "version": payload.version, "updated_at": timestamp}
    history = list(restrictions.get("consent_history", []))
    history.append({"key": key, "previous": previous, "current": consents[key], "changed_at": timestamp})
    restrictions["consents"] = consents
    restrictions["consent_history"] = history[-100:]
    profile.restrictions = restrictions
    await session.commit()
    await session.refresh(profile)
    return ConsentItem(key=key, **consents[key])


async def update_permissions(session: AsyncSession, user: User, payload: PermissionsUpdate) -> PermissionsRead:
    profile = await get_profile(session, user)
    incoming = payload.model_dump(exclude_unset=True)
    validate_permission_values(incoming)

    restrictions = dict(profile.restrictions or {})
    current = permissions_payload(profile)
    current.update(incoming)
    restrictions["permissions"] = current
    restrictions["permissions_updated_at"] = datetime.now(UTC).isoformat()
    profile.restrictions = restrictions
    if "geolocation" in incoming:
        profile.location_mode = "telegram" if incoming["geolocation"] == "granted" else "manual"
    await session.commit()
    await session.refresh(profile)
    return await get_permissions(session, user)


async def get_notification_settings(session: AsyncSession, user: User) -> NotificationSettingsRead:
    profile = await get_profile(session, user)
    settings = profile.restrictions.get("notification_settings", {})
    return NotificationSettingsRead(
        routine_reminders=settings.get("routine_reminders", True),
        uv_alerts=settings.get("uv_alerts", True),
        price_alerts=settings.get("price_alerts", True),
        observation_followups=settings.get("observation_followups", True),
    )


async def update_notification_settings(
    session: AsyncSession, user: User, payload: NotificationSettingsUpdate
) -> NotificationSettingsRead:
    profile = await get_profile(session, user)
    restrictions = dict(profile.restrictions or {})
    current = (await get_notification_settings(session, user)).model_dump()
    current.update(payload.model_dump(exclude_unset=True))
    restrictions["notification_settings"] = current
    profile.restrictions = restrictions
    await session.commit()
    await session.refresh(profile)
    return await get_notification_settings(session, user)
