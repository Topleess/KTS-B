from fastapi import APIRouter, Response
from sqlalchemy import select

from app.api.deps import CurrentUser, SessionDep
from app.core.security import create_access_token, verify_telegram_init_data
from app.models import User
from app.schemas.auth import AuthResponse, TelegramAuthRequest
from app.services.seed import ensure_demo_data

router = APIRouter(prefix="/auth", tags=["auth"])
me_router = APIRouter(tags=["auth"])


@router.post("/telegram", response_model=AuthResponse)
async def telegram_auth(payload: TelegramAuthRequest, response: Response, session: SessionDep) -> AuthResponse:
    tg_user = verify_telegram_init_data(payload.init_data)
    telegram_user_id = int(tg_user["id"])
    user = await session.scalar(select(User).where(User.telegram_user_id == telegram_user_id))
    if not user:
        user = User(
            telegram_user_id=telegram_user_id,
            telegram_username=tg_user.get("username"),
            display_name=tg_user.get("first_name"),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        user.telegram_username = tg_user.get("username")
        user.display_name = tg_user.get("first_name")
        await session.commit()
        await session.refresh(user)
    token = create_access_token(user.id)
    response.set_cookie("cosmeto_session", token, httponly=True, secure=True, samesite="none")
    return AuthResponse(user=user)


@router.post("/dev", response_model=AuthResponse)
async def dev_auth(response: Response, session: SessionDep) -> AuthResponse:
    user = await ensure_demo_data(session)
    token = create_access_token(user.id)
    response.set_cookie("cosmeto_session", token, httponly=True, secure=False, samesite="lax")
    return AuthResponse(user=user)


@router.post("/dev-login", response_model=AuthResponse)
async def dev_login(response: Response, session: SessionDep) -> AuthResponse:
    return await dev_auth(response, session)


@router.get("/me", response_model=AuthResponse)
async def me(user: CurrentUser) -> AuthResponse:
    return AuthResponse(user=user)


@me_router.get("/me", response_model=AuthResponse)
async def root_me(user: CurrentUser) -> AuthResponse:
    return AuthResponse(user=user)


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("cosmeto_session")
    return {"status": "ok"}
