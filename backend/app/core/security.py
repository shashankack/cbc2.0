"""Hashing helpers for OTP codes and session tokens."""

from __future__ import annotations

import hashlib
import hmac
import secrets

from app.core.config import settings


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_secret(value: str) -> str:
    digest = hmac.new(
        settings.secret_key.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    )
    return digest.hexdigest()


def hash_otp_code(email: str, code: str) -> str:
    return hash_secret(f"otp:{normalize_email(email)}:{code}")


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def generate_dns_txt_token() -> str:
    return f"cbc-domain-verify={secrets.token_urlsafe(24)}"


def hash_session_token(token: str) -> str:
    return hash_secret(f"session:{token}")
