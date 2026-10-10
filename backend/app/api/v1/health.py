"""Health and readiness endpoints."""

from fastapi import APIRouter

from app.db.session import check_database_connection

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
def ready() -> dict[str, str | bool]:
    db_ok = check_database_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": db_ok,
    }
