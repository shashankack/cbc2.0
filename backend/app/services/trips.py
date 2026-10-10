"""Trips, QR boarding, driver location, distress."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
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
from app.models.campus import Campus
from app.models.fleet import Bus
from app.models.mixins import utcnow
from app.models.planning import Allocation, Route, RouteStop
from app.services.geo import haversine_m
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


def _utc_day_start(now: datetime | None = None) -> datetime:
    current = now or utcnow()
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    current = current.astimezone(timezone.utc)
    return current.replace(hour=0, minute=0, second=0, microsecond=0)


def serialize_trip(db: Session, trip: Trip) -> dict:
    route = db.get(Route, trip.route_id)
    bus = db.get(Bus, trip.bus_id)
    driver = db.get(User, trip.driver_user_id)
    duration = None
    if trip.started_at is not None and trip.ended_at is not None:
        duration = int((trip.ended_at - trip.started_at).total_seconds())
    return {
        "id": trip.id,
        "college_id": trip.college_id,
        "campus_id": trip.campus_id,
        "route_id": trip.route_id,
        "bus_id": trip.bus_id,
        "driver_user_id": trip.driver_user_id,
        "status": trip.status,
        "started_at": trip.started_at,
        "ended_at": trip.ended_at,
        "last_lat": trip.last_lat,
        "last_lng": trip.last_lng,
        "last_location_at": trip.last_location_at,
        "route_name": route.name if route else None,
        "bus_registration": bus.registration_number if bus else None,
        "driver_email": driver.email if driver else None,
        "duration_seconds": duration,
    }


def resolve_driver_assignment(
    db: Session, college_id: uuid.UUID, driver: User
) -> dict:
    """Bus assigned to driver + confirmed route from locked allocations."""
    bus = db.scalar(
        select(Bus).where(
            Bus.college_id == college_id,
            Bus.driver_user_id == driver.id,
        )
    )
    if bus is None:
        raise AppError(
            "CONFLICT",
            "No bus is assigned to your driver account. Ask college admin.",
            status_code=409,
        )
    if bus.status == BusStatus.UNAVAILABLE:
        raise AppError(
            "CONFLICT",
            f"Bus {bus.registration_number} is unavailable (maintenance).",
            status_code=409,
        )

    alloc = db.scalar(
        select(Allocation)
        .where(
            Allocation.college_id == college_id,
            Allocation.bus_id == bus.id,
        )
        .order_by(Allocation.created_at.desc())
    )
    if alloc is None:
        raise AppError(
            "CONFLICT",
            "No confirmed route for your bus yet. Wait for admin planning confirm.",
            status_code=409,
        )
    route = db.get(Route, alloc.route_id)
    if route is None or route.status != RouteStatus.CONFIRMED:
        raise AppError(
            "CONFLICT",
            "Assigned route is not confirmed.",
            status_code=409,
        )
    return {
        "bus": bus,
        "route": route,
        "campus_id": route.campus_id,
    }


def _today_trip_for_assignment(
    db: Session,
    *,
    college_id: uuid.UUID,
    driver_user_id: uuid.UUID,
    bus_id: uuid.UUID,
    route_id: uuid.UUID,
) -> Trip | None:
    day_start = _utc_day_start()
    return db.scalar(
        select(Trip)
        .where(
            Trip.college_id == college_id,
            Trip.driver_user_id == driver_user_id,
            Trip.bus_id == bus_id,
            Trip.route_id == route_id,
            Trip.created_at >= day_start,
        )
        .order_by(Trip.created_at.desc())
    )


def ensure_scheduled_trip(
    db: Session,
    *,
    college_id: uuid.UUID,
    route_id: uuid.UUID,
    bus_id: uuid.UUID,
    driver_user_id: uuid.UUID,
    campus_id: uuid.UUID,
) -> Trip:
    """Idempotent daily scheduled trip for a route/bus/driver assignment."""
    existing = _today_trip_for_assignment(
        db,
        college_id=college_id,
        driver_user_id=driver_user_id,
        bus_id=bus_id,
        route_id=route_id,
    )
    if existing is not None:
        return existing

    trip = Trip(
        college_id=college_id,
        campus_id=campus_id,
        route_id=route_id,
        bus_id=bus_id,
        driver_user_id=driver_user_id,
        status=TripStatus.SCHEDULED,
    )
    db.add(trip)
    db.flush()
    return trip


def schedule_trips_for_assignments(
    db: Session,
    college_id: uuid.UUID,
    assignments: list[tuple[uuid.UUID, uuid.UUID]],
) -> int:
    """Create today's scheduled trips for (route_id, bus_id) pairs. Returns count created/ensured."""
    count = 0
    seen: set[tuple[uuid.UUID, uuid.UUID]] = set()
    for route_id, bus_id in assignments:
        key = (route_id, bus_id)
        if key in seen:
            continue
        seen.add(key)
        bus = db.get(Bus, bus_id)
        route = db.get(Route, route_id)
        if bus is None or route is None or bus.driver_user_id is None:
            continue
        if bus.college_id != college_id or route.college_id != college_id:
            continue
        ensure_scheduled_trip(
            db,
            college_id=college_id,
            route_id=route_id,
            bus_id=bus_id,
            driver_user_id=bus.driver_user_id,
            campus_id=route.campus_id,
        )
        count += 1
    return count


def get_driver_duty(db: Session, college_id: uuid.UUID, actor: User) -> dict:
    from app.services.auth import require_college_roles

    require_college_roles(db, actor, college_id, {"driver"})
    assignment = resolve_driver_assignment(db, college_id, actor)
    bus: Bus = assignment["bus"]
    route: Route = assignment["route"]
    trip = _today_trip_for_assignment(
        db,
        college_id=college_id,
        driver_user_id=actor.id,
        bus_id=bus.id,
        route_id=route.id,
    )
    status = trip.status if trip else None
    return {
        "bus_id": bus.id,
        "bus_registration": bus.registration_number,
        "route_id": route.id,
        "route_name": route.name,
        "campus_id": route.campus_id,
        "trip": serialize_trip(db, trip) if trip else None,
        "can_start": status in {None, TripStatus.SCHEDULED, TripStatus.ENDED},
        "can_end": status == TripStatus.ACTIVE,
        "can_distress": status == TripStatus.ACTIVE,
    }


def start_driver_duty(db: Session, college_id: uuid.UUID, actor: User) -> dict:
    from app.services.auth import require_college_roles

    require_college_roles(db, actor, college_id, {"driver"})
    assignment = resolve_driver_assignment(db, college_id, actor)
    bus: Bus = assignment["bus"]
    route: Route = assignment["route"]

    active = db.scalar(
        select(Trip).where(
            Trip.college_id == college_id,
            Trip.driver_user_id == actor.id,
            Trip.status == TripStatus.ACTIVE,
        )
    )
    if active is not None:
        # Resume: refresh QR for the already-active session.
        qr = refresh_qr(db, college_id, active.id, actor)
        itinerary = get_trip_itinerary(db, college_id, active.id)
        return {
            "trip": serialize_trip(db, active),
            "qr_token": qr["qr_token"],
            "expires_in_seconds": qr["expires_in_seconds"],
            "itinerary": itinerary,
        }

    trip = _today_trip_for_assignment(
        db,
        college_id=college_id,
        driver_user_id=actor.id,
        bus_id=bus.id,
        route_id=route.id,
    )
    if trip is None or trip.status == TripStatus.ENDED:
        trip = Trip(
            college_id=college_id,
            campus_id=route.campus_id,
            route_id=route.id,
            bus_id=bus.id,
            driver_user_id=actor.id,
            status=TripStatus.SCHEDULED,
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
    elif trip.status != TripStatus.SCHEDULED:
        raise AppError(
            "CONFLICT",
            f"Cannot start trip in status {trip.status}.",
            status_code=409,
        )

    result = start_trip(db, college_id, trip.id, actor)
    return {
        "trip": serialize_trip(db, result["trip"]),
        "qr_token": result["qr_token"],
        "expires_in_seconds": result["expires_in_seconds"],
        "itinerary": result["itinerary"],
    }


def end_driver_duty(db: Session, college_id: uuid.UUID, actor: User) -> Trip:
    from app.services.auth import require_college_roles

    require_college_roles(db, actor, college_id, {"driver"})
    active = db.scalar(
        select(Trip).where(
            Trip.college_id == college_id,
            Trip.driver_user_id == actor.id,
            Trip.status == TripStatus.ACTIVE,
        )
    )
    if active is None:
        raise AppError("CONFLICT", "No active trip to end.", status_code=409)
    return end_trip(db, college_id, active.id, actor)


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
    campus = db.get(Campus, trip.campus_id)
    depot_lat = float(campus.lat) if campus and campus.lat is not None else lat
    depot_lng = float(campus.lng) if campus and campus.lng is not None else lng

    def _bus_distance_m(bus: Bus) -> float:
        # Prefer last known ping on any trip for this bus; else campus depot.
        peer = db.scalar(
            select(Trip)
            .where(
                Trip.college_id == college_id,
                Trip.bus_id == bus.id,
                Trip.last_lat.is_not(None),
                Trip.last_lng.is_not(None),
            )
            .order_by(Trip.last_location_at.desc())
            .limit(1)
        )
        if peer and peer.last_lat is not None and peer.last_lng is not None:
            return haversine_m(lat, lng, float(peer.last_lat), float(peer.last_lng))
        return haversine_m(lat, lng, depot_lat, depot_lng)

    available.sort(
        key=lambda b: (_bus_distance_m(b), b.capacity < need, -b.capacity)
    )

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
                "distance_m_approx": round(_bus_distance_m(bus)),
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


def list_emergency_reallocations(
    db: Session,
    college_id: uuid.UUID,
    *,
    status: str | None = None,
) -> list[EmergencyReallocation]:
    stmt = (
        select(EmergencyReallocation)
        .where(EmergencyReallocation.college_id == college_id)
        .order_by(EmergencyReallocation.created_at.desc())
    )
    if status:
        stmt = stmt.where(EmergencyReallocation.status == status)
    return list(db.scalars(stmt).all())


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

    plan = row.plan_json or {}
    remaining_ids = [uuid.UUID(s) for s in plan.get("remaining_student_ids", [])]
    replacements = plan.get("replacement_buses") or []
    event = db.get(DistressEvent, row.distress_event_id)
    route_id = None
    if event is not None:
        trip = db.get(Trip, event.trip_id)
        if trip is not None:
            route_id = trip.route_id
            # Distressed bus leaves service until admin restores it.
            distressed_bus = db.get(Bus, trip.bus_id)
            if distressed_bus is not None:
                distressed_bus.status = BusStatus.UNAVAILABLE

    # Pack remaining students onto proposed replacement buses by capacity.
    next_idx = 0
    scheduled_pairs: list[tuple[uuid.UUID, uuid.UUID]] = []
    for bus_info in replacements:
        if next_idx >= len(remaining_ids):
            break
        bus_id = uuid.UUID(str(bus_info["bus_id"]))
        bus = db.get(Bus, bus_id)
        if bus is None or bus.college_id != college_id:
            continue
        if bus.status != BusStatus.AVAILABLE:
            continue
        capacity = int(bus_info.get("capacity") or bus.capacity)
        chunk = remaining_ids[next_idx : next_idx + capacity]
        next_idx += len(chunk)
        for sid in chunk:
            alloc = db.scalar(
                select(Allocation).where(
                    Allocation.college_id == college_id,
                    Allocation.student_id == sid,
                )
            )
            if alloc is None:
                continue
            alloc.bus_id = bus_id
            if route_id is not None:
                alloc.route_id = route_id
        if route_id is not None and chunk:
            scheduled_pairs.append((route_id, bus_id))

    if scheduled_pairs:
        schedule_trips_for_assignments(db, college_id, scheduled_pairs)

    applied = {
        **plan,
        "students_reassigned": next_idx,
        "applied": True,
    }
    row.plan_json = applied
    row.status = EmergencyPlanStatus.CONFIRMED
    row.confirmed_at = utcnow()
    if event is not None:
        event.status = DistressStatus.RESOLVED
    db.commit()
    db.refresh(row)
    return row


def student_active_trip(
    db: Session, college_id: uuid.UUID, actor: User
) -> Trip | None:
    """Active trip for the student's allocated bus (if running today)."""
    alloc = my_allocation(db, college_id, actor)
    if alloc is None:
        return None
    return db.scalar(
        select(Trip)
        .where(
            Trip.college_id == college_id,
            Trip.bus_id == alloc.bus_id,
            Trip.status == TripStatus.ACTIVE,
        )
        .order_by(Trip.started_at.desc())
        .limit(1)
    )


def attendance_analytics(db: Session, college_id: uuid.UUID) -> list[dict]:
    """Rule-based boarded vs assigned counts per trip (no ML)."""
    trips = list(
        db.scalars(
            select(Trip)
            .where(Trip.college_id == college_id)
            .order_by(Trip.created_at.desc())
            .limit(50)
        ).all()
    )
    rows: list[dict] = []
    for trip in trips:
        assigned = (
            db.scalar(
                select(func.count())
                .select_from(Allocation)
                .where(
                    Allocation.college_id == college_id,
                    Allocation.bus_id == trip.bus_id,
                    Allocation.route_id == trip.route_id,
                )
            )
            or 0
        )
        boarded = (
            db.scalar(
                select(func.count())
                .select_from(BoardingRecord)
                .where(BoardingRecord.trip_id == trip.id)
            )
            or 0
        )
        ser = serialize_trip(db, trip)
        rows.append(
            {
                "trip_id": trip.id,
                "status": trip.status,
                "route_name": ser.get("route_name"),
                "bus_registration": ser.get("bus_registration"),
                "started_at": trip.started_at,
                "ended_at": trip.ended_at,
                "assigned_count": int(assigned),
                "boarded_count": int(boarded),
                "no_show_count": max(0, int(assigned) - int(boarded)),
            }
        )
    return rows


def propose_bus_disruption(
    db: Session,
    college_id: uuid.UUID,
    bus_id: uuid.UUID,
) -> dict:
    """Non-emergency: mark bus unavailable and propose replacement for locked riders."""
    bus = db.get(Bus, bus_id)
    if bus is None or bus.college_id != college_id:
        raise AppError("NOT_FOUND", "Bus not found.", status_code=404)
    allocations = list(
        db.scalars(
            select(Allocation).where(
                Allocation.college_id == college_id,
                Allocation.bus_id == bus_id,
            )
        ).all()
    )
    if not allocations:
        bus.status = BusStatus.UNAVAILABLE
        db.commit()
        return {
            "bus_id": bus.id,
            "status": "unavailable",
            "affected_count": 0,
            "replacement_buses": [],
            "note": "Bus marked unavailable; no locked students to reassign.",
        }

    need = len(allocations)
    available = list(
        db.scalars(
            select(Bus).where(
                Bus.college_id == college_id,
                Bus.campus_id == bus.campus_id,
                Bus.status == BusStatus.AVAILABLE,
                Bus.id != bus.id,
            )
        ).all()
    )
    campus = db.get(Campus, bus.campus_id) if bus.campus_id else None
    depot_lat = float(campus.lat) if campus and campus.lat is not None else 0.0
    depot_lng = float(campus.lng) if campus and campus.lng is not None else 0.0
    # Prefer last known position of the disrupted bus; else campus depot.
    trip_for_pos = db.scalar(
        select(Trip)
        .where(
            Trip.college_id == college_id,
            Trip.bus_id == bus.id,
            Trip.last_lat.is_not(None),
            Trip.last_lng.is_not(None),
        )
        .order_by(Trip.last_location_at.desc())
        .limit(1)
    )
    ref_lat = (
        float(trip_for_pos.last_lat)
        if trip_for_pos and trip_for_pos.last_lat is not None
        else depot_lat
    )
    ref_lng = (
        float(trip_for_pos.last_lng)
        if trip_for_pos and trip_for_pos.last_lng is not None
        else depot_lng
    )

    def _alt_distance_m(alt: Bus) -> float:
        peer = db.scalar(
            select(Trip)
            .where(
                Trip.college_id == college_id,
                Trip.bus_id == alt.id,
                Trip.last_lat.is_not(None),
                Trip.last_lng.is_not(None),
            )
            .order_by(Trip.last_location_at.desc())
            .limit(1)
        )
        if peer and peer.last_lat is not None and peer.last_lng is not None:
            return haversine_m(ref_lat, ref_lng, float(peer.last_lat), float(peer.last_lng))
        return haversine_m(ref_lat, ref_lng, depot_lat, depot_lng)

    available.sort(key=lambda b: (_alt_distance_m(b), b.capacity < need, -b.capacity))
    chosen: list[dict] = []
    seats = 0
    for alt in available:
        if seats >= need:
            break
        chosen.append(
            {
                "bus_id": str(alt.id),
                "registration_number": alt.registration_number,
                "capacity": alt.capacity,
                "distance_m_approx": round(_alt_distance_m(alt)),
            }
        )
        seats += alt.capacity

    bus.status = BusStatus.UNAVAILABLE
    plan = {
        "kind": "disruption",
        "source_bus_id": str(bus.id),
        "affected_student_ids": [str(a.student_id) for a in allocations],
        "affected_count": need,
        "replacement_buses": chosen,
        "seats_proposed": seats,
        "route_id": str(allocations[0].route_id),
        "note": "Non-emergency disruption proposal; confirm to reassign.",
    }
    # Store as emergency reallocation without distress via a synthetic distress event
    # tied to an active/scheduled trip if present, else create a placeholder trip-less event.
    trip = db.scalar(
        select(Trip)
        .where(
            Trip.college_id == college_id,
            Trip.bus_id == bus.id,
            Trip.status.in_([TripStatus.SCHEDULED, TripStatus.ACTIVE]),
        )
        .order_by(Trip.created_at.desc())
        .limit(1)
    )
    if trip is None:
        db.commit()
        return {
            "bus_id": bus.id,
            "status": "unavailable",
            "affected_count": need,
            "replacement_buses": chosen,
            "emergency_reallocation_id": None,
            "note": "Bus unavailable; no trip to attach — reassign manually or confirm later.",
            "plan": plan,
        }

    event = DistressEvent(
        college_id=college_id,
        trip_id=trip.id,
        bus_id=bus.id,
        lat=trip.last_lat or 0.0,
        lng=trip.last_lng or 0.0,
        status=DistressStatus.OPEN,
        recorded_at=utcnow(),
    )
    db.add(event)
    db.flush()
    realloc = EmergencyReallocation(
        college_id=college_id,
        distress_event_id=event.id,
        status=EmergencyPlanStatus.PROPOSED,
        plan_json={
            **plan,
            "boarded_count": 0,
            "remaining_count": need,
            "remaining_student_ids": plan["affected_student_ids"],
        },
    )
    db.add(realloc)
    db.commit()
    db.refresh(realloc)
    return {
        "bus_id": bus.id,
        "status": "unavailable",
        "affected_count": need,
        "replacement_buses": chosen,
        "emergency_reallocation_id": realloc.id,
        "plan": realloc.plan_json,
        "note": "Proposal created — confirm on Emergency page.",
    }


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


def allocation_detail(
    db: Session, college_id: uuid.UUID, actor: User
) -> dict | None:
    """Allocation plus stop/route/bus labels for student portal display."""
    from app.models.planning import Stop

    row = my_allocation(db, college_id, actor)
    if row is None:
        return None
    stop = db.get(Stop, row.stop_id)
    route = db.get(Route, row.route_id)
    bus = db.get(Bus, row.bus_id)
    return {
        "id": row.id,
        "student_id": row.student_id,
        "stop_id": row.stop_id,
        "route_id": row.route_id,
        "bus_id": row.bus_id,
        "planning_run_id": row.planning_run_id,
        "stop_name": stop.name if stop else None,
        "stop_lat": stop.lat if stop else None,
        "stop_lng": stop.lng if stop else None,
        "route_name": route.name if route else None,
        "bus_registration_number": bus.registration_number if bus else None,
    }
