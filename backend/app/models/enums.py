"""Shared string enums used by models and APIs."""

from enum import StrEnum


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CollegeStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class DomainStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"


class MembershipRole(StrEnum):
    COLLEGE_ADMIN = "college_admin"
    STUDENT = "student"
    DRIVER = "driver"


class BusStatus(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    IN_SERVICE = "in_service"


class ImportBatchStatus(StrEnum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImportRowStatus(StrEnum):
    VALID = "valid"
    INVALID = "invalid"


class StudentStatus(StrEnum):
    IMPORTED = "imported"
    NEEDS_ADMIN_REVIEW = "needs_admin_review"
    ALLOCATED = "allocated"
    LOCKED = "locked"


class PlanningRunStatus(StrEnum):
    DRAFT = "draft"
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class PlanningItemStatus(StrEnum):
    PROPOSED = "proposed"
    SNAPPED = "snapped"
    NEEDS_ADMIN_REVIEW = "needs_admin_review"
    CONFIRMED = "confirmed"


class RouteStatus(StrEnum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"


class StopSource(StrEnum):
    CLUSTER = "cluster"
    MANUAL = "manual"


class TripStatus(StrEnum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    ENDED = "ended"


class DistressStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class EmergencyPlanStatus(StrEnum):
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
