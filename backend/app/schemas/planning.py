"""Planning schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class PlanningRunCreate(BaseModel):
    campus_id: UUID
    import_batch_id: UUID | None = None


class ReviewItemAssign(BaseModel):
    stop_id: UUID
    route_id: UUID | None = None
    bus_id: UUID | None = None


class ManualStopCreate(BaseModel):
    name: str
    lat: float
    lng: float
    # Optional route to attach the new pickup (appended before return to campus).
    route_id: UUID | None = None


class MergeStopsIn(BaseModel):
    keep_stop_id: UUID
    merge_stop_id: UUID


class SplitStopIn(BaseModel):
    stop_id: UUID
    name: str
    lat: float
    lng: float
    student_ids: list[UUID]


class ReorderRouteStopsIn(BaseModel):
    """Ordered pickup stop IDs (campus bookends applied automatically)."""
    stop_ids: list[UUID]


class StopOut(ORMModel):
    id: UUID
    name: str
    lat: float
    lng: float
    source: str


class RouteStopOut(ORMModel):
    sequence: int
    stop_id: UUID
    name: str | None = None
    lat: float | None = None
    lng: float | None = None


class RouteOut(ORMModel):
    id: UUID
    name: str
    status: str
    route_stops: list[RouteStopOut] = []


class PlanningItemOut(ORMModel):
    id: UUID
    student_id: UUID
    stop_id: UUID | None
    route_id: UUID | None
    bus_id: UUID | None
    status: str


class PlanningRunOut(ORMModel):
    id: UUID
    college_id: UUID
    campus_id: UUID
    import_batch_id: UUID | None
    status: str
    confirmed_at: datetime | None
    created_at: datetime
    stops: list[StopOut] = []
    routes: list[RouteOut] = []
    items: list[PlanningItemOut] = []


class AllocationOut(ORMModel):
    id: UUID
    student_id: UUID
    stop_id: UUID
    route_id: UUID
    bus_id: UUID
    planning_run_id: UUID
    stop_name: str | None = None
    stop_lat: float | None = None
    stop_lng: float | None = None
    route_name: str | None = None
    bus_registration_number: str | None = None
