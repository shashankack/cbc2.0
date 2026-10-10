"""Trip, QR, location, distress endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.trips import (
    BoardingOut,
    BoardRequest,
    DistressIn,
    DistressOut,
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
    return TripOut.model_validate(trip)


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
        trip=TripOut.model_validate(result["trip"]),
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
    return TripOut.model_validate(trip)


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
    return TripOut.model_validate(trip)


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
