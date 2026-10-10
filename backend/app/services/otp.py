"""OTP challenge create / verify."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.core.security import generate_otp_code, hash_otp_code, normalize_email
from app.models.mixins import utcnow
from app.models.otp import OtpChallenge
from app.services.mailer import send_otp_email


def request_otp(db: Session, email: str) -> dict[str, str | int]:
    normalized = normalize_email(email)
    now = utcnow()

    recent = db.scalar(
        select(OtpChallenge)
        .where(OtpChallenge.email == normalized)
        .order_by(OtpChallenge.created_at.desc())
        .limit(1)
    )
    if recent is not None and recent.consumed_at is None:
        age = (now - recent.created_at).total_seconds()
        if age < settings.otp_request_cooldown_seconds:
            raise AppError(
                "CONFLICT",
                "Please wait before requesting another OTP.",
                status_code=409,
            )

    code = generate_otp_code()
    challenge = OtpChallenge(
        email=normalized,
        code_hash=hash_otp_code(normalized, code),
        expires_at=now + timedelta(seconds=settings.otp_expiry_seconds),
        attempts=0,
    )
    db.add(challenge)
    db.commit()

    send_otp_email(normalized, code)
    return {
        "status": "sent",
        "expires_in_seconds": settings.otp_expiry_seconds,
    }


def verify_otp(db: Session, email: str, code: str) -> None:
    normalized = normalize_email(email)
    now = utcnow()

    challenge = db.scalar(
        select(OtpChallenge)
        .where(
            OtpChallenge.email == normalized,
            OtpChallenge.consumed_at.is_(None),
        )
        .order_by(OtpChallenge.created_at.desc())
        .limit(1)
    )
    if challenge is None:
        raise AppError("UNAUTHORIZED", "Invalid or expired OTP.", status_code=401)

    if challenge.expires_at < now:
        raise AppError("UNAUTHORIZED", "Invalid or expired OTP.", status_code=401)

    if challenge.attempts >= settings.otp_max_attempts:
        raise AppError(
            "FORBIDDEN",
            "Too many OTP attempts. Request a new code.",
            status_code=403,
        )

    challenge.attempts += 1
    if challenge.code_hash != hash_otp_code(normalized, code.strip()):
        db.commit()
        raise AppError("UNAUTHORIZED", "Invalid or expired OTP.", status_code=401)

    challenge.consumed_at = now
    db.commit()
