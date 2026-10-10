"""Planning schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class PlanningRunCreate(BaseModel):
    campus_id: UUID
    import_batch_id: UUID | None = None


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
