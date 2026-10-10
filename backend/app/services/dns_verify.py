"""DNS TXT verification for college domains."""

from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def dns_verify_is_enabled() -> bool:
    if settings.dns_verify_enabled is not None:
        return bool(settings.dns_verify_enabled)
    return settings.app_env.lower() == "production"


def dns_txt_contains(domain: str, expected_token: str) -> bool:
    if not dns_verify_is_enabled():
        return True

    try:
        import dns.resolver
    except ImportError:
        logger.error("dnspython not installed; cannot verify DNS")
        return False

    try:
        answers = dns.resolver.resolve(domain, "TXT")
    except Exception:
        return False

    for rdata in answers:
        for txt in rdata.strings:
            value = txt.decode("utf-8") if isinstance(txt, bytes) else str(txt)
            if expected_token in value:
                return True
    return False
