"""Platform operator college onboarding."""

from __future__ import annotations

import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import normalize_email
from app.models.college import College, CollegeApplication
from app.models.enums import ApplicationStatus, CollegeStatus, MembershipRole
from app.models.mixins import utcnow
from app.models.user import CollegeMembership, User
from app.services.auth import get_or_create_user

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _validate_slug(slug: str) -> str:
    cleaned = slug.strip().lower()
    if not _SLUG_RE.match(cleaned) or len(cleaned) < 2 or len(cleaned) > 64:
        raise AppError(
            "VALIDATION_ERROR",
            "Slug must be 2–64 chars of lowercase letters, numbers, and hyphens.",
            status_code=422,
        )
    return cleaned


def submit_college_application(
    db: Session,
    *,
    college_name: str,
    slug: str,
    applicant_email: str,
    applicant_full_name: str | None,
) -> CollegeApplication:
    cleaned_slug = _validate_slug(slug)
    email = normalize_email(applicant_email)

    existing_college = db.scalar(select(College).where(College.slug == cleaned_slug))
    if existing_college is not None:
        raise AppError("CONFLICT", "College slug already exists.", status_code=409)

    pending = db.scalar(
        select(CollegeApplication).where(
            CollegeApplication.slug == cleaned_slug,
            CollegeApplication.status == ApplicationStatus.PENDING,
        )
    )
    if pending is not None:
        raise AppError(
            "CONFLICT",
            "A pending application already uses this slug.",
            status_code=409,
        )

    application = CollegeApplication(
        college_name=college_name.strip(),
        slug=cleaned_slug,
        applicant_email=email,
        applicant_full_name=applicant_full_name.strip() if applicant_full_name else None,
        status=ApplicationStatus.PENDING,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def list_applications(
    db: Session, status: str | None = None
) -> list[CollegeApplication]:
    stmt = select(CollegeApplication).order_by(CollegeApplication.created_at.desc())
    if status:
        stmt = stmt.where(CollegeApplication.status == status)
    return list(db.scalars(stmt).all())


def approve_application(
    db: Session,
    application_id: uuid.UUID,
    *,
    admin_email: str | None = None,
    admin_full_name: str | None = None,
    notes: str | None = None,
) -> College:
    application = db.get(CollegeApplication, application_id)
    if application is None:
        raise AppError("NOT_FOUND", "College application not found.", status_code=404)
    if application.status != ApplicationStatus.PENDING:
        raise AppError(
            "CONFLICT",
            "Only pending applications can be approved.",
            status_code=409,
        )

    if db.scalar(select(College).where(College.slug == application.slug)):
        raise AppError("CONFLICT", "College slug already exists.", status_code=409)

    college = College(
        name=application.college_name,
        slug=application.slug,
        status=CollegeStatus.ACTIVE,
        application_id=application.id,
    )
    db.add(college)
    db.flush()

    email = normalize_email(admin_email or application.applicant_email)
    name = admin_full_name or application.applicant_full_name
    admin = get_or_create_user(db, email, name)

    existing = db.scalar(
        select(CollegeMembership).where(
            CollegeMembership.college_id == college.id,
            CollegeMembership.user_id == admin.id,
            CollegeMembership.role == MembershipRole.COLLEGE_ADMIN,
        )
    )
    if existing is None:
        db.add(
            CollegeMembership(
                college_id=college.id,
                user_id=admin.id,
                role=MembershipRole.COLLEGE_ADMIN,
            )
        )

    application.status = ApplicationStatus.APPROVED
    application.reviewed_at = utcnow()
    application.review_notes = notes
    db.commit()
    db.refresh(college)
    return college


def reject_application(
    db: Session,
    application_id: uuid.UUID,
    *,
    notes: str | None = None,
) -> CollegeApplication:
    application = db.get(CollegeApplication, application_id)
    if application is None:
        raise AppError("NOT_FOUND", "College application not found.", status_code=404)
    if application.status != ApplicationStatus.PENDING:
        raise AppError(
            "CONFLICT",
            "Only pending applications can be rejected.",
            status_code=409,
        )
    application.status = ApplicationStatus.REJECTED
    application.reviewed_at = utcnow()
    application.review_notes = notes
    db.commit()
    db.refresh(application)
    return application
