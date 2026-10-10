"""ORM models — import all so Alembic and Base.metadata see them."""

from app.models.campus import Campus, CampusSettings
from app.models.college import College, CollegeApplication, CollegeDomain
from app.models.otp import OtpChallenge
from app.models.session import AuthSession
from app.models.user import CollegeMembership, User

__all__ = [
    "AuthSession",
    "Campus",
    "CampusSettings",
    "College",
    "CollegeApplication",
    "CollegeDomain",
    "CollegeMembership",
    "OtpChallenge",
    "User",
]
