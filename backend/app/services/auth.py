"""Auth session and user helpers."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.errors import AppError
from app.core.security import (
    generate_session_token,
    hash_session_token,
    normalize_email,
)
from app.models.mixins import utcnow
from app.models.session import AuthSession
from app.models.user import CollegeMembership, User
from app.services.otp import request_otp, verify_otp


def get_or_create_user(db: Session, email: str, full_name: str | None = None) -> User:
    normalized = normalize_email(email)
    user = db.scalar(select(User).where(User.email == normalized))
    if user is None:
        user = User(email=normalized, full_name=full_name)
        db.add(user)
        db.flush()

    bootstrap = normalize_email(settings.bootstrap_operator_email)
    if normalized == bootstrap and not user.is_platform_operator:
        user.is_platform_operator = True

    if full_name and not user.full_name:
        user.full_name = full_name

    db.flush()
    return user


def create_session(db: Session, user: User) -> str:
    raw = generate_session_token()
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(raw),
        expires_at=utcnow() + timedelta(seconds=settings.session_ttl_seconds),
    )
    db.add(session)
    db.flush()
    return raw


def revoke_session(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    session = db.scalar(
        select(AuthSession).where(
            AuthSession.token_hash == hash_session_token(raw_token),
            AuthSession.revoked_at.is_(None),
        )
    )
    if session is None:
        return
    session.revoked_at = utcnow()
    db.commit()


def resolve_session_user(db: Session, raw_token: str | None) -> User | None:
    if not raw_token:
        return None
    session = db.scalar(
        select(AuthSession)
        .where(
            AuthSession.token_hash == hash_session_token(raw_token),
            AuthSession.revoked_at.is_(None),
        )
        .options(selectinload(AuthSession.user).selectinload(User.memberships))
    )
    if session is None:
        return None
    if session.expires_at < utcnow():
        return None
    return session.user


def login_with_otp(db: Session, email: str, code: str) -> tuple[User, str]:
    verify_otp(db, email, code)
    user = get_or_create_user(db, email)
    token = create_session(db, user)
    db.commit()
    db.refresh(user)
    return user, token


def start_otp(db: Session, email: str) -> dict[str, str | int]:
    return request_otp(db, email)


def user_memberships(db: Session, user: User) -> list[CollegeMembership]:
    return list(
        db.scalars(
            select(CollegeMembership).where(CollegeMembership.user_id == user.id)
        ).all()
    )


def require_user(user: User | None) -> User:
    if user is None:
        raise AppError("UNAUTHORIZED", "Authentication required.", status_code=401)
    return user


def require_operator(user: User) -> User:
    if not user.is_platform_operator:
        raise AppError("FORBIDDEN", "Platform operator role required.", status_code=403)
    return user


def require_college_admin(db: Session, user: User, college_id) -> None:
    membership = db.scalar(
        select(CollegeMembership).where(
            CollegeMembership.user_id == user.id,
            CollegeMembership.college_id == college_id,
            CollegeMembership.role == "college_admin",
        )
    )
    if membership is None and not user.is_platform_operator:
        raise AppError("FORBIDDEN", "College admin role required.", status_code=403)
