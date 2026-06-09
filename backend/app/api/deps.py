from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import resolve_current_user
from app.models import User

SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(request: Request, session: SessionDep) -> User:
    return await resolve_current_user(request, session)


CurrentUser = Annotated[User, Depends(get_current_user)]
