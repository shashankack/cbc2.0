"""Outbound email adapter (dev logs OTP; SMTP optional)."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(email: str, code: str) -> None:
    subject = "Your College Bus login code"
    body = (
        f"Your one-time login code is: {code}\n\n"
        f"It expires in {settings.otp_expiry_seconds // 60} minutes.\n"
        "If you did not request this, ignore this email.\n"
    )

    if settings.app_env == "development" or not settings.smtp_host:
        # Never log the code at INFO in production paths; development console only.
        logger.warning("DEV OTP for %s: %s", email, code)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_user:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
