"""Trips, QR boarding, driver location, distress."""

from __future__ import annotations

import secrets
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError
from app.core.security import hash_secret
from app.models.enums import (
    BusStatus,
    DistressStatus,
    EmergencyPlanStatus,
    RouteStatus,
    TripStatus,
)
from app.models.fleet import Bus
from app.models.mixins import utcnow
from app.models.planning import Allocation, Route, RouteStop
from app.models.student import Student
from app.models.trip import (
    BoardingRecord,
    DistressEvent,
    EmergencyReallocation,
    Trip,
    TripLocationPing,
    TripQrToken,
)
from app.models.user import User

QR_TTL_SECONDS = 300


def _hash_qr(raw: str) -> str:
    return hash_secret(f"qr:{raw}")


def create_trip(
    db: Session,
    *,
    college_id: uuid.UUID,
    route_id: uuid.UUID,
    bus_id: uuid.UUID,
    actor: User,
) -> Trip:
    route = db.scalar(
        select(Route).where(
            Route.id == route_id,
            Route.college_id == college_id,
            Route.status == RouteStatus.CONFIRMED,
        )
    )
    if route is None:
        raise AppError("NOT_FOUND", "Confirmed route not found.", status_code=404)

    bus = db.scalar(
        select(Bus).where(Bus.id == bus_id, Bus.college_id == college_id)
    )
    if bus is None:
        raise AppError("NOT_FOUND", "Bus not found.", status_code=404)
    if bus.driver_user_id is None:
        raise AppError("CONFLICT", "Bus has no assigned driver.", status_code=409)

    if not actor.is_platform_operator and actor.id != bus.driver_user_id:
        # college admin may create scheduled trip for the driver
        from app.services.auth import require_college_roles

        try:
            require_college_roles(db, actor, college_id, {"college_admin"})
        except AppError:
            raise AppError(
                "FORBIDDEN",
                "Only the assigned driver or college admin can create this trip.",
                status_code=403,
            ) from None

    trip = Trip(
        college_id=college_id,
        campus_id=route.campus_id,
        route_id=route.id,
        bus_id=bus.id,
        driver_user_id=bus.driver_user_id,
        status=TripStatus.SCHEDULED,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def list_trips(
    db: Session,
    college_id: uuid.UUID,
    actor: User,
    *,
    status: str | None = None,
) -> list[Trip]:
    """List trips. Drivers see only their own; admins/operators see college-wide."""
    from app.services.auth import require_college_roles

    is_admin = False
    try:
        require_college_roles(db, actor, college_id, {"college_admin"})
        is_admin = True
    except AppError:
        require_college_roles(db, actor, college_id, {"driver"})

    stmt = (
        select(Trip)
        .where(Trip.college_id == college_id)
        .order_by(Trip.created_at.desc())
    )
    if status:
        stmt = stmt.where(Trip.status == status)
    if not is_admin and not actor.is_platform_operator:
        stmt = stmt.where(Trip.driver_user_id == actor.id)
    return list(db.scalars(stmt).all())


def _get_trip(db: Session, college_id: uuid.UUID, trip_id: uuid.UUID) -> Trip:
    trip = db.scalar(
        select(Trip).where(Trip.id == trip_id, Trip.college_id == college_id)
    )
    if trip is None:
        raise AppError("NOT_FOUND", "Trip not found.", status_code=404)
    return trip


def _require_driver(trip: Trip, actor: User) -> None:
    if actor.is_platform_operator:
        return
    if actor.id != trip.driver_user_id:
        raise AppError("FORBIDDEN", "Driver role required for this trip.", status_code=403)


def start_trip(db: Session, college_id: uuid.UUID, trip_id: uuid.UUID, actor: User) -> dict:
    trip = _get_trip(db, college_id, trip_id)
    _require_driver(trip, actor)
    if trip.status != TripStatus.SCHEDULED:
        raise AppError("CONFLICT", "Only scheduled trips can be started.", status_code=409)

    # revoke any prior QR
    prior = db.scalars(
        select(TripQrToken).where(
            TripQrToken.trip_id == trip.id,
            TripQrToken.revoked_at.is_(None),
        )
    ).all()
    now = utcnow()
    for token in prior:
        token.revoked_at = now

    raw = secrets.token_urlsafe(24)
    db.add(
        TripQrToken(
            college_id=college_id,
            trip_id=trip.id,
            token_hash=_hash_qr(raw),
            expires_at=now + timedelta(seconds=QR_TTL_SECONDS),
        )
    )
    trip.status = TripStatus.ACTIVE
    trip.started_at = now
    bus = db.get(Bus, trip.bus_id)
    if bus is not None:
        bus.status = BusStatus.IN_SERVICE

    db.commit()
    itinerary = get_trip_itinerary(db, college_id, trip_id)
    return {"trip": trip, "qr_token": raw, "expires_in_seconds": QR_TTL_SECONDS, "itinerary": itinerary}


def refresh_qr(db: Session, college_id: uuid.UUID, trip_id: uuid.UUID, actor: User) -> dict:
    trip = _get_trip(db, college_id, trip_id)
    _require_driver(trip, actor)
    if trip.status != TripStatus.ACTIVE:
        raise AppError("CONFLICT", "QR only available for active trips.", status_code=409)

    now = utcnow()
    for token in db.scalars(
        select(TripQrToken).where(
            TripQrToken.trip_id == trip.id,
            TripQrToken.revoked_at.is_(None),
        )
    ).all():
        token.revoked_at = now

    raw = secrets.token_urlsafe(24)
    db.add(
        TripQrToken(
            college_id=college_id,
            trip_id=trip.id,
            token_hash=_hash_qr(raw),
            expires_at=now + timedelta(seconds=QR_TTL_SECONDS),
        )
    )
    db.commit()
    return {"qr_token": raw, "expires_in_seconds": QR_TTL_SECONDS}


def end_trip(db: Session, college_id: uuid.UUID, trip_id: uuid.UUID, actor: User) -> Trip:
    trip = _get_trip(db, college_id, trip_id)
    _require_driver(trip, actor)
    if trip.status != TripStatus.ACTIVE:
        raise AppError("CONFLICT", "Only active trips can be ended.", status_code=409)

    now = utcnow()
    trip.status = TripStatus.ENDED
    trip.ended_at = now
    for token in db.scalars(
        select(TripQrToken).where(
            TripQrToken.trip_id == trip.id,
            TripQrToken.revoked_at.is_(None),
        )
    ).all():
        token.revoked_at = now

    bus = db.get(Bus, trip.bus_id)
    if bus is not None:
        bus.status = BusStatus.AVAILABLE

    db.commit()
    db.refresh(trip)
    return trip


def get_trip_itinerary(
    db: Session, college_id: uuid.UUID, trip_id: uuid.UUID
) -> list[dict]:
    trip = _get_trip(db, college_id, trip_id)
    stops = db.scalars(
        select(RouteStop)
        .where(RouteStop.route_id == trip.route_id, RouteStop.college_id == college_id)
        .options(selectinload(RouteStop.stop))
        .order_by(RouteStop.sequence)
    ).all()
    return [
        {
            "sequence": rs.sequence,
            "stop_id": rs.stop_id,
            "name": rs.stop.name,
            "lat": rs.stop.lat,
            "lng": rs.stop.lng,
        }
        for rs in stops
    ]


def ping_location(
    db: Session,
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    actor: User,
    *,
    lat: float,
    lng: float,
) -> Trip:
    trip = _get_trip(db, college_id, trip_id)
    _require_driver(trip, actor)
    if trip.status != TripStatus.ACTIVE:
        raise AppError(
            "CONFLICT",
            "Location sharing only allowed on active trips.",
            status_code=409,
        )
    now = utcnow()
    db.add(
        TripLocationPing(
            college_id=college_id,
            trip_id=trip.id,
            lat=lat,
            lng=lng,
            recorded_at=now,
        )
    )
    trip.last_lat = lat
    trip.last_lng = lng
    trip.last_location_at = now
    db.commit()
    db.refresh(trip)
    return trip


def get_trip_location(db: Session, college_id: uuid.UUID, trip_id: uuid.UUID) -> dict:
    trip = _get_trip(db, college_id, trip_id)
    return {
        "trip_id": trip.id,
        "status": trip.status,
        "lat": trip.last_lat,
        "lng": trip.last_lng,
        "recorded_at": trip.last_location_at,
    }


def board_with_qr(
    db: Session,
    *,
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    qr_token: str,
    actor: User,
) -> BoardingRecord:
    trip = _get_trip(db, college_id, trip_id)
    if trip.status != TripStatus.ACTIVE:
        raise AppError("CONFLICT", "Trip is not active.", status_code=409)

    token = db.scalar(
        select(TripQrToken).where(
            TripQrToken.trip_id == trip.id,
            TripQrToken.token_hash == _hash_qr(qr_token),
            TripQrToken.revoked_at.is_(None),
        )
    )
    if token is None or token.expires_at < utcnow():
        raise AppError("UNAUTHORIZED", "Invalid or expired QR token.", status_code=401)

    student = db.scalar(
        select(Student).where(
            Student.college_id == college_id,
            Student.user_id == actor.id,
        )
    )
    if student is None:
        raise AppError("FORBIDDEN", "Student profile required.", status_code=403)

    allocation = db.scalar(
        select(Allocation).where(
            Allocation.college_id == college_id,
            Allocation.student_id == student.id,
            Allocation.route_id == trip.route_id,
            Allocation.bus_id == trip.bus_id,
        )
    )
    if allocation is None:
        raise AppError(
            "FORBIDDEN",
            "You are not allocated to this trip bus/route.",
            status_code=403,
        )

    existing = db.scalar(
        select(BoardingRecord).where(
            BoardingRecord.trip_id == trip.id,
            BoardingRecord.student_id == student.id,
        )
    )
    if existing is not None:
        raise AppError("CONFLICT", "Already boarded this trip.", status_code=409)

    record = BoardingRecord(
        college_id=college_id,
        trip_id=trip.id,
        student_id=student.id,
        boarded_at=utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def raise_distress(
    db: Session,
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    actor: User,
    *,
    lat: float,
    lng: float,
) -> dict:
    trip = _get_trip(db, college_id, trip_id)
    _require_driver(trip, actor)
    if trip.status != TripStatus.ACTIVE:
        raise AppError("CONFLICT", "Distress only on active trips.", status_code=409)

    event = DistressEvent(
        college_id=college_id,
        trip_id=trip.id,
        bus_id=trip.bus_id,
        lat=lat,
        lng=lng,
        status=DistressStatus.OPEN,
        recorded_at=utcnow(),
    )
    db.add(event)
    db.flush()

    allocated = list(
        db.scalars(
            select(Allocation).where(
                Allocation.college_id == college_id,
                Allocation.route_id == trip.route_id,
                Allocation.bus_id == trip.bus_id,
            )
        ).all()
    )
    boarded_ids = set(
        db.scalars(
            select(BoardingRecord.student_id).where(BoardingRecord.trip_id == trip.id)
        ).all()
    )
    remaining = [a for a in allocated if a.student_id not in boarded_ids]
    need = len(remaining)

    available = list(
        db.scalars(
            select(Bus).where(
                Bus.college_id == college_id,
                Bus.campus_id == trip.campus_id,
                Bus.status == BusStatus.AVAILABLE,
                Bus.id != trip.bus_id,
            )
        ).all()
    )
    available.sort(key=lambda b: (b.capacity < need, -b.capacity))

    chosen: list[dict] = []
    seats = 0
    for bus in available:
        if seats >= need:
            break
        chosen.append(
            {
                "bus_id": str(bus.id),
                "registration_number": bus.registration_number,
                "capacity": bus.capacity,
                "distance_m_approx": None,
            }
        )
        seats += bus.capacity

    plan = {
        "boarded_count": len(boarded_ids),
        "remaining_count": need,
        "seats_proposed": seats,
        "replacement_buses": chosen,
        "remaining_student_ids": [str(a.student_id) for a in remaining],
        "note": "Rule-based proposal; admin must confirm.",
    }
    realloc = EmergencyReallocation(
        college_id=college_id,
        distress_event_id=event.id,
        status=EmergencyPlanStatus.PROPOSED,
        plan_json=plan,
    )
    db.add(realloc)
    db.commit()
    db.refresh(event)
    db.refresh(realloc)
    return {"distress_event": event, "emergency_reallocation": realloc}


def confirm_emergency(
    db: Session,
    college_id: uuid.UUID,
    realloc_id: uuid.UUID,
) -> EmergencyReallocation:
    row = db.scalar(
        select(EmergencyReallocation).where(
            EmergencyReallocation.id == realloc_id,
            EmergencyReallocation.college_id == college_id,
        )
    )
    if row is None:
        raise AppError("NOT_FOUND", "Emergency reallocation not found.", status_code=404)
    if row.status != EmergencyPlanStatus.PROPOSED:
        raise AppError("CONFLICT", "Plan is not in proposed status.", status_code=409)
    row.status = EmergencyPlanStatus.CONFIRMED
    row.confirmed_at = utcnow()
    event = db.get(DistressEvent, row.distress_event_id)
    if event is not None:
        event.status = DistressStatus.RESOLVED
    db.commit()
    db.refresh(row)
    return row


def my_allocation(db: Session, college_id: uuid.UUID, actor: User) -> Allocation | None:
    student = db.scalar(
        select(Student).where(
            Student.college_id == college_id,
            Student.user_id == actor.id,
        )
    )
    if student is None:
        return None
    return db.scalar(
        select(Allocation).where(
            Allocation.college_id == college_id,
            Allocation.student_id == student.id,
        )
    )
