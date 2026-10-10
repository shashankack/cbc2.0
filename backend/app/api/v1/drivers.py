"""Driver roster endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.drivers import DriverCreate, DriverOut
from app.services import drivers as driver_service

router = APIRouter(
    prefix="/colleges/{college_id}/drivers",
    tags=["drivers"],
)


@router.get("", response_model=list[DriverOut])
def list_drivers(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> list[DriverOut]:
    rows = driver_service.list_drivers(db, college_id)
    return [DriverOut.model_validate(r) for r in rows]


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(
    college_id: uuid.UUID,
    body: DriverCreate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> DriverOut:
    row = driver_service.create_driver(
        db,
        college_id,
        email=str(body.email),
        full_name=body.full_name,
    )
    return DriverOut.model_validate(row)
