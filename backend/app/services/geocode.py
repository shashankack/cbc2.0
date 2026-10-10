"""Nominatim reverse geocoding for human-readable stop names."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_CACHE: dict[tuple[float, float], str] = {}
_USER_AGENT = "UniTransit-CBC/1.0 (planning-stop-names; local-dev)"


def _round_key(lat: float, lng: float) -> tuple[float, float]:
    return (round(lat, 4), round(lng, 4))


def _pick_label(payload: dict[str, Any]) -> str | None:
    address = payload.get("address") or {}
    for key in (
        "neighbourhood",
        "suburb",
        "quarter",
        "residential",
        "village",
        "town",
        "city_district",
        "municipality",
        "road",
        "hamlet",
    ):
        value = address.get(key)
        if isinstance(value, str) and value.strip():
            label = value.strip()
            city = address.get("city") or address.get("town") or address.get("state_district")
            if city and isinstance(city, str) and city.strip() and city.strip().lower() not in label.lower():
                return f"{label}, {city.strip()}"
            return label
    name = payload.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    display = payload.get("display_name")
    if isinstance(display, str) and display.strip():
        # First two comma parts are usually enough for a stop label.
        parts = [p.strip() for p in display.split(",") if p.strip()]
        return ", ".join(parts[:2]) if parts else None
    return None


def reverse_place_name(lat: float, lng: float) -> str:
    """Best-effort place label; falls back to coordinates if geocode fails."""
    key = _round_key(lat, lng)
    cached = _CACHE.get(key)
    if cached:
        return cached

    fallback = f"Stop {lat:.4f}, {lng:.4f}"
    try:
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "jsonv2",
                    "zoom": 16,
                    "addressdetails": 1,
                },
                headers={
                    "Accept": "application/json",
                    "User-Agent": _USER_AGENT,
                },
            )
        if resp.status_code != 200:
            _CACHE[key] = fallback
            return fallback
        label = _pick_label(resp.json()) or fallback
        # Keep labels short for map/table UI.
        if len(label) > 64:
            label = label[:61].rstrip() + "…"
        _CACHE[key] = label
        return label
    except Exception:  # noqa: BLE001 — planning must not fail on geocode
        logger.debug("reverse geocode failed for %s,%s", lat, lng, exc_info=True)
        _CACHE[key] = fallback
        return fallback
