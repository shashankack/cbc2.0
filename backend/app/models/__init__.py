"""ORM models — import all so Alembic and Base.metadata see them."""

from app.models.campus import Campus, CampusSettings
from app.models.college import College, CollegeApplication, CollegeDomain
from app.models.fleet import Bus
from app.models.otp import OtpChallenge
from app.models.planning import (
    Allocation,
    PlanningRun,
    PlanningRunItem,
    Route,
    RouteStop,
    Stop,
)
from app.models.session import AuthSession
from app.models.student import Student, StudentImportBatch, StudentImportRow
from app.models.trip import (
    BoardingRecord,
    DistressEvent,
    EmergencyReallocation,
    Trip,
    TripLocationPing,
    TripQrToken,
)
from app.models.user import CollegeMembership, User

__all__ = [
    "Allocation",
    "AuthSession",
    "BoardingRecord",
    "Bus",
    "Campus",
    "CampusSettings",
    "College",
    "CollegeApplication",
    "CollegeDomain",
    "CollegeMembership",
    "DistressEvent",
    "EmergencyReallocation",
    "OtpChallenge",
    "PlanningRun",
    "PlanningRunItem",
    "Route",
    "RouteStop",
    "Stop",
    "Student",
    "StudentImportBatch",
    "StudentImportRow",
    "Trip",
    "TripLocationPing",
    "TripQrToken",
    "User",
]
