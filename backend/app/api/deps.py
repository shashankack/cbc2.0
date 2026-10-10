"""FastAPI dependencies."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services import auth as auth_service

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user_optional(
    db: DbSession,
    session_token: Annotated[
        str | None, Cookie(alias=settings.session_cookie_name)
    ] = None,
) -> User | None:
    return auth_service.resolve_session_user(db, session_token)


def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    return auth_service.require_user(user)


def get_platform_operator(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    return auth_service.require_operator(user)


def require_college_admin_access(
    college_id: uuid.UUID,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    auth_service.require_college_admin(db, user, college_id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]
OperatorUser = Annotated[User, Depends(get_platform_operator)]
