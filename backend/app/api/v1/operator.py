"""Platform operator endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query

from app.api.deps import DbSession, OperatorUser
from app.schemas.operator import (
    ApplicationDecision,
    CollegeApplicationCreate,
    CollegeApplicationOut,
    CollegeOut,
    DomainApproveOut,
)
from app.services import colleges as college_service
from app.services import operator as operator_service

router = APIRouter(prefix="/operator", tags=["operator"])


@router.post(
    "/college-applications",
    response_model=CollegeApplicationOut,
    status_code=201,
)
def submit_application(
    body: CollegeApplicationCreate,
    db: DbSession,
) -> CollegeApplicationOut:
    """Public college onboarding application."""
    row = operator_service.submit_college_application(
        db,
        college_name=body.college_name,
        slug=body.slug,
        applicant_email=str(body.applicant_email),
        applicant_full_name=body.applicant_full_name,
    )
    return CollegeApplicationOut.model_validate(row)


@router.get("/college-applications", response_model=list[CollegeApplicationOut])
def list_applications(
    db: DbSession,
    _operator: OperatorUser,
    status: str | None = Query(default=None),
) -> list[CollegeApplicationOut]:
    rows = operator_service.list_applications(db, status=status)
    return [CollegeApplicationOut.model_validate(r) for r in rows]


@router.post(
    "/college-applications/{application_id}/approve",
    response_model=CollegeOut,
)
def approve_application(
    application_id: uuid.UUID,
    db: DbSession,
    _operator: OperatorUser,
    body: ApplicationDecision | None = None,
) -> CollegeOut:
    decision = body or ApplicationDecision()
    college = operator_service.approve_application(
        db,
        application_id,
        admin_email=str(decision.admin_email) if decision.admin_email else None,
        admin_full_name=decision.admin_full_name,
        notes=decision.notes,
    )
    return CollegeOut.model_validate(college)


@router.post(
    "/college-applications/{application_id}/reject",
    response_model=CollegeApplicationOut,
)
def reject_application(
    application_id: uuid.UUID,
    db: DbSession,
    _operator: OperatorUser,
    body: ApplicationDecision | None = None,
) -> CollegeApplicationOut:
    decision = body or ApplicationDecision()
    row = operator_service.reject_application(
        db,
        application_id,
        notes=decision.notes,
    )
    return CollegeApplicationOut.model_validate(row)


@router.post("/domains/{domain_id}/approve", response_model=DomainApproveOut)
def approve_domain(
    domain_id: uuid.UUID,
    db: DbSession,
    _operator: OperatorUser,
) -> DomainApproveOut:
    row = college_service.approve_domain(db, domain_id)
    return DomainApproveOut.model_validate(row)
