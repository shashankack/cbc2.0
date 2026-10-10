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
