"""Trip, QR, location, distress endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.trips import (
    AttendanceRowOut,
    BoardingOut,
    BoardRequest,
    DistressIn,
    DistressOut,
    DriverDutyOut,
    EmergencyOut,
    ItineraryStopOut,
    LocationOut,
    LocationPingIn,
    QrRefreshOut,
    TripCreate,
    TripOut,
    TripStartOut,
)
from app.services import trips as trip_service
from app.services.auth import require_college_roles

router = APIRouter(tags=["trips"])


def _trip_out(db: DbSession, trip) -> TripOut:
    return TripOut.model_validate(trip_service.serialize_trip(db, trip))


@router.get(
    "/colleges/{college_id}/me/driver-duty",
    response_model=DriverDutyOut,
)
def get_driver_duty(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> DriverDutyOut:
    return DriverDutyOut.model_validate(
        trip_service.get_driver_duty(db, college_id, user)
    )


@router.post(
    "/colleges/{college_id}/me/driver-duty/start",
    response_model=TripStartOut,
)
def start_driver_duty(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> TripStartOut:
    result = trip_service.start_driver_duty(db, college_id, user)
    return TripStartOut(
        trip=TripOut.model_validate(result["trip"]),
        qr_token=result["qr_token"],
        expires_in_seconds=result["expires_in_seconds"],
        itinerary=[ItineraryStopOut(**s) for s in result["itinerary"]],
    )


@router.post(
    "/colleges/{college_id}/me/driver-duty/end",
    response_model=TripOut,
)
def end_driver_duty(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> TripOut:
    trip = trip_service.end_driver_duty(db, college_id, user)
    return _trip_out(db, trip)


@router.get(
    "/colleges/{college_id}/trips",
    response_model=list[TripOut],
)
def list_trips(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: Annotated[str | None, Query()] = None,
) -> list[TripOut]:
    rows = trip_service.list_trips(db, college_id, user, status=status)
    return [_trip_out(db, t) for t in rows]


@router.post(
    "/colleges/{college_id}/trips",
    response_model=TripOut,
    status_code=201,
)
def create_trip(
    college_id: uuid.UUID,
    body: TripCreate,
    db: DbSession,
    user: CurrentUser,
) -> TripOut:
    trip = trip_service.create_trip(
        db,
        college_id=college_id,
        route_id=body.route_id,
        bus_id=body.bus_id,
        actor=user,
    )
    return _trip_out(db, trip)


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/start",
    response_model=TripStartOut,
)
def start_trip(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> TripStartOut:
    result = trip_service.start_trip(db, college_id, trip_id, user)
    return TripStartOut(
        trip=_trip_out(db, result["trip"]),
        qr_token=result["qr_token"],
        expires_in_seconds=result["expires_in_seconds"],
        itinerary=[ItineraryStopOut(**s) for s in result["itinerary"]],
    )


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/qr/refresh",
    response_model=QrRefreshOut,
)
def refresh_qr(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> QrRefreshOut:
    result = trip_service.refresh_qr(db, college_id, trip_id, user)
    return QrRefreshOut(**result)


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/end",
    response_model=TripOut,
)
def end_trip(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> TripOut:
    trip = trip_service.end_trip(db, college_id, trip_id, user)
    return _trip_out(db, trip)


@router.get(
    "/colleges/{college_id}/trips/{trip_id}/itinerary",
    response_model=list[ItineraryStopOut],
)
def itinerary(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> list[ItineraryStopOut]:
    require_college_roles(
        db, user, college_id, {"driver", "college_admin", "student"}
    )
    rows = trip_service.get_trip_itinerary(db, college_id, trip_id)
    return [ItineraryStopOut(**r) for r in rows]


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/location",
    response_model=TripOut,
)
def ping_location(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    body: LocationPingIn,
    db: DbSession,
    user: CurrentUser,
) -> TripOut:
    trip = trip_service.ping_location(
        db, college_id, trip_id, user, lat=body.lat, lng=body.lng
    )
    return _trip_out(db, trip)


@router.get(
    "/colleges/{college_id}/trips/{trip_id}/location",
    response_model=LocationOut,
)
def get_location(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> LocationOut:
    require_college_roles(
        db, user, college_id, {"driver", "college_admin", "student"}
    )
    return LocationOut(**trip_service.get_trip_location(db, college_id, trip_id))


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/board",
    response_model=BoardingOut,
    status_code=201,
)
def board(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    body: BoardRequest,
    db: DbSession,
    user: CurrentUser,
) -> BoardingOut:
    record = trip_service.board_with_qr(
        db,
        college_id=college_id,
        trip_id=trip_id,
        qr_token=body.qr_token,
        actor=user,
    )
    return BoardingOut.model_validate(record)


@router.post(
    "/colleges/{college_id}/trips/{trip_id}/distress",
    response_model=DistressOut,
    status_code=201,
)
def distress(
    college_id: uuid.UUID,
    trip_id: uuid.UUID,
    body: DistressIn,
    db: DbSession,
    user: CurrentUser,
) -> DistressOut:
    result = trip_service.raise_distress(
        db, college_id, trip_id, user, lat=body.lat, lng=body.lng
    )
    return DistressOut(
        distress_event=result["distress_event"],
        emergency_reallocation=result["emergency_reallocation"],
    )


@router.get(
    "/colleges/{college_id}/emergency-reallocations",
    response_model=list[EmergencyOut],
)
def list_emergencies(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
    status: Annotated[str | None, Query()] = "proposed",
) -> list[EmergencyOut]:
    rows = trip_service.list_emergency_reallocations(
        db, college_id, status=status
    )
    return [EmergencyOut.model_validate(r) for r in rows]


@router.post(
    "/colleges/{college_id}/emergency-reallocations/{realloc_id}/confirm",
    response_model=EmergencyOut,
)
def confirm_emergency(
    college_id: uuid.UUID,
    realloc_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> EmergencyOut:
    row = trip_service.confirm_emergency(db, college_id, realloc_id)
    return EmergencyOut.model_validate(row)


@router.get(
    "/colleges/{college_id}/me/active-trip",
    response_model=TripOut | None,
)
def my_active_trip(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> TripOut | None:
    require_college_roles(db, user, college_id, {"student", "college_admin"})
    trip = trip_service.student_active_trip(db, college_id, user)
    if trip is None:
        return None
    return _trip_out(db, trip)


@router.get(
    "/colleges/{college_id}/analytics/attendance",
    response_model=list[AttendanceRowOut],
)
def attendance_analytics(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> list[AttendanceRowOut]:
    rows = trip_service.attendance_analytics(db, college_id)
    return [AttendanceRowOut(**r) for r in rows]
