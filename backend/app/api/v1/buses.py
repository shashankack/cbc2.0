"""Bus fleet endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.fleet import BusCreate, BusOut, BusUpdate
from app.services import fleet as fleet_service

router = APIRouter(prefix="/colleges/{college_id}/buses", tags=["buses"])


@router.get("", response_model=list[BusOut])
def list_buses(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
    campus_id: uuid.UUID | None = Query(default=None),
) -> list[BusOut]:
    rows = fleet_service.list_buses(db, college_id, campus_id=campus_id)
    return [BusOut.model_validate(fleet_service.bus_to_dict(db, r)) for r in rows]


@router.post("", response_model=BusOut, status_code=201)
def create_bus(
    college_id: uuid.UUID,
    body: BusCreate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> BusOut:
    row = fleet_service.create_bus(
        db,
        college_id,
        campus_id=body.campus_id,
        registration_number=body.registration_number,
        capacity=body.capacity,
        driver_email=str(body.driver_email) if body.driver_email else None,
    )
    return BusOut.model_validate(fleet_service.bus_to_dict(db, row))


@router.patch("/{bus_id}", response_model=BusOut)
def update_bus(
    college_id: uuid.UUID,
    bus_id: uuid.UUID,
    body: BusUpdate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> BusOut:
    row = fleet_service.update_bus(
        db,
        college_id,
        bus_id,
        status=body.status,
        capacity=body.capacity,
        driver_email=str(body.driver_email) if body.driver_email else None,
        clear_driver=body.clear_driver,
    )
    return BusOut.model_validate(fleet_service.bus_to_dict(db, row))
