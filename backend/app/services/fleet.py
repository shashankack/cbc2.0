"""Bus fleet CRUD."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.campus import Campus
from app.models.enums import BusStatus, MembershipRole
from app.models.fleet import Bus
from app.models.user import User
from app.services.auth import ensure_membership, get_or_create_user


def _get_campus(db: Session, college_id: uuid.UUID, campus_id: uuid.UUID) -> Campus:
    campus = db.scalar(
        select(Campus).where(Campus.id == campus_id, Campus.college_id == college_id)
    )
    if campus is None:
        raise AppError("NOT_FOUND", "Campus not found.", status_code=404)
    return campus


def list_buses(
    db: Session, college_id: uuid.UUID, campus_id: uuid.UUID | None = None
) -> list[Bus]:
    stmt = select(Bus).where(Bus.college_id == college_id).order_by(Bus.registration_number)
    if campus_id is not None:
        stmt = stmt.where(Bus.campus_id == campus_id)
    return list(db.scalars(stmt).all())


def create_bus(
    db: Session,
    college_id: uuid.UUID,
    *,
    campus_id: uuid.UUID,
    registration_number: str,
    capacity: int,
    driver_email: str | None = None,
) -> Bus:
    _get_campus(db, college_id, campus_id)
    reg = registration_number.strip().upper()
    if capacity < 1:
        raise AppError("VALIDATION_ERROR", "capacity must be >= 1.", status_code=422)
    exists = db.scalar(
        select(Bus).where(
            Bus.college_id == college_id,
            Bus.registration_number == reg,
        )
    )
    if exists is not None:
        raise AppError("CONFLICT", "Bus registration already exists.", status_code=409)

    driver_user_id = None
    if driver_email:
        driver = get_or_create_user(db, driver_email)
        ensure_membership(
            db,
            college_id=college_id,
            user_id=driver.id,
            role=MembershipRole.DRIVER,
        )
        driver_user_id = driver.id

    bus = Bus(
        college_id=college_id,
        campus_id=campus_id,
        registration_number=reg,
        capacity=capacity,
        status=BusStatus.AVAILABLE,
        driver_user_id=driver_user_id,
    )
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


def update_bus(
    db: Session,
    college_id: uuid.UUID,
    bus_id: uuid.UUID,
    *,
    status: str | None = None,
    capacity: int | None = None,
    driver_email: str | None = None,
    clear_driver: bool = False,
) -> Bus:
    bus = db.scalar(
        select(Bus).where(Bus.id == bus_id, Bus.college_id == college_id)
    )
    if bus is None:
        raise AppError("NOT_FOUND", "Bus not found.", status_code=404)

    if status is not None:
        if status not in {s.value for s in BusStatus}:
            raise AppError("VALIDATION_ERROR", "Invalid bus status.", status_code=422)
        bus.status = status
    if capacity is not None:
        if capacity < 1:
            raise AppError("VALIDATION_ERROR", "capacity must be >= 1.", status_code=422)
        bus.capacity = capacity
    if clear_driver:
        bus.driver_user_id = None
    elif driver_email is not None:
        driver = get_or_create_user(db, driver_email)
        ensure_membership(
            db,
            college_id=college_id,
            user_id=driver.id,
            role=MembershipRole.DRIVER,
        )
        bus.driver_user_id = driver.id

    db.commit()
    db.refresh(bus)
    return bus
