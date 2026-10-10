"""Trip / QR / distress schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TripCreate(BaseModel):
    route_id: UUID
    bus_id: UUID


class TripOut(ORMModel):
    id: UUID
    college_id: UUID
    campus_id: UUID
    route_id: UUID
    bus_id: UUID
    driver_user_id: UUID
    status: str
    started_at: datetime | None
    ended_at: datetime | None
    last_lat: float | None
    last_lng: float | None
    last_location_at: datetime | None
    route_name: str | None = None
    bus_registration: str | None = None
    driver_email: str | None = None
    duration_seconds: int | None = None


class DriverDutyOut(BaseModel):
    bus_id: UUID
    bus_registration: str
    route_id: UUID
    route_name: str
    campus_id: UUID
    trip: TripOut | None = None
    can_start: bool
    can_end: bool
    can_distress: bool


class ItineraryStopOut(BaseModel):
    sequence: int
    stop_id: UUID
    name: str
    lat: float
    lng: float


class TripStartOut(BaseModel):
    trip: TripOut
    qr_token: str
    expires_in_seconds: int
    itinerary: list[ItineraryStopOut]


class QrRefreshOut(BaseModel):
    qr_token: str
    expires_in_seconds: int


class LocationPingIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationOut(BaseModel):
    trip_id: UUID
    status: str
    lat: float | None
    lng: float | None
    recorded_at: datetime | None


class BoardRequest(BaseModel):
    qr_token: str = Field(min_length=8)


class BoardingOut(ORMModel):
    id: UUID
    trip_id: UUID
    student_id: UUID
    boarded_at: datetime


class DistressIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class DistressEventOut(ORMModel):
    id: UUID
    trip_id: UUID
    bus_id: UUID
    lat: float
    lng: float
    status: str
    recorded_at: datetime


class EmergencyOut(ORMModel):
    id: UUID
    distress_event_id: UUID
    status: str
    plan_json: dict
    confirmed_at: datetime | None


class DistressOut(BaseModel):
    distress_event: DistressEventOut
    emergency_reallocation: EmergencyOut
