"""College driver roster."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MembershipRole
from app.models.fleet import Bus
from app.models.user import CollegeMembership, User
from app.services.auth import ensure_membership, get_or_create_user


def list_drivers(db: Session, college_id: uuid.UUID) -> list[dict]:
    memberships = list(
        db.scalars(
            select(CollegeMembership).where(
                CollegeMembership.college_id == college_id,
                CollegeMembership.role == MembershipRole.DRIVER,
            )
        ).all()
    )
    if not memberships:
        return []

    user_ids = [m.user_id for m in memberships]
    users = {
        u.id: u
        for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()
    }
    buses = list(
        db.scalars(
            select(Bus).where(
                Bus.college_id == college_id,
                Bus.driver_user_id.in_(user_ids),
            )
        ).all()
    )
    bus_by_driver = {b.driver_user_id: b for b in buses if b.driver_user_id}

    rows: list[dict] = []
    for m in memberships:
        user = users.get(m.user_id)
        if user is None:
            continue
        bus = bus_by_driver.get(user.id)
        rows.append(
            {
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "assigned_bus_id": bus.id if bus else None,
                "assigned_bus_registration": bus.registration_number if bus else None,
            }
        )
    rows.sort(key=lambda r: r["email"])
    return rows


def create_driver(
    db: Session,
    college_id: uuid.UUID,
    *,
    email: str,
    full_name: str | None = None,
) -> dict:
    user = get_or_create_user(db, email, full_name)
    ensure_membership(
        db,
        college_id=college_id,
        user_id=user.id,
        role=MembershipRole.DRIVER,
    )
    db.commit()
    db.refresh(user)
    bus = db.scalar(
        select(Bus).where(
            Bus.college_id == college_id,
            Bus.driver_user_id == user.id,
        )
    )
    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "assigned_bus_id": bus.id if bus else None,
        "assigned_bus_registration": bus.registration_number if bus else None,
    }
