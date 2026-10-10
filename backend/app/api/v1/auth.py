"""Auth endpoints — OTP + session cookie."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, Response

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.schemas.auth import (
    MeResponse,
    MembershipOut,
    OtpRequestBody,
    OtpRequestResponse,
    OtpVerifyBody,
)
from app.schemas.common import MessageStatus
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    secure = settings.app_env != "development"
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.session_ttl_seconds,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
    )


def _me_payload(db: DbSession, user) -> MeResponse:
    memberships = [
        MembershipOut(college_id=m.college_id, role=m.role)
        for m in auth_service.user_memberships(db, user)
    ]
    return MeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_platform_operator=user.is_platform_operator,
        memberships=memberships,
    )


@router.post("/otp/request", response_model=OtpRequestResponse)
def otp_request(body: OtpRequestBody, db: DbSession) -> OtpRequestResponse:
    result = auth_service.start_otp(db, str(body.email))
    return OtpRequestResponse(**result)


@router.post("/otp/verify", response_model=MeResponse)
def otp_verify(
    body: OtpVerifyBody,
    db: DbSession,
    response: Response,
) -> MeResponse:
    user, token = auth_service.login_with_otp(db, str(body.email), body.code)
    _set_session_cookie(response, token)
    return _me_payload(db, user)


@router.post("/logout", response_model=MessageStatus)
def logout(
    db: DbSession,
    response: Response,
    session_token: Annotated[
        str | None, Cookie(alias=settings.session_cookie_name)
    ] = None,
) -> MessageStatus:
    auth_service.revoke_session(db, session_token)
    _clear_session_cookie(response)
    return MessageStatus(status="ok")


@router.get("/me", response_model=MeResponse)
def me(db: DbSession, user: CurrentUser) -> MeResponse:
    return _me_payload(db, user)
