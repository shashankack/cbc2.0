"""College-admin tenant endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.colleges import (
    CampusCreate,
    CampusOut,
    CampusSettingsOut,
    CampusSettingsUpdate,
    DomainCreate,
    DomainOut,
)
from app.services import colleges as college_service

router = APIRouter(prefix="/colleges", tags=["colleges"])


@router.post(
    "/{college_id}/domains",
    response_model=DomainOut,
    status_code=201,
)
def request_domain(
    college_id: uuid.UUID,
    body: DomainCreate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> DomainOut:
    row = college_service.request_domain(db, college_id, body.domain)
    return DomainOut.model_validate(row)


@router.get("/{college_id}/campuses", response_model=list[CampusOut])
def list_campuses(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> list[CampusOut]:
    rows = college_service.list_campuses(db, college_id)
    return [CampusOut.model_validate(r) for r in rows]


@router.post(
    "/{college_id}/campuses",
    response_model=CampusOut,
    status_code=201,
)
def create_campus(
    college_id: uuid.UUID,
    body: CampusCreate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> CampusOut:
    row = college_service.create_campus(
        db,
        college_id,
        name=body.name,
        code=body.code,
    )
    return CampusOut.model_validate(row)


@router.put(
    "/{college_id}/campuses/{campus_id}/settings",
    response_model=CampusSettingsOut,
)
def update_campus_settings(
    college_id: uuid.UUID,
    campus_id: uuid.UUID,
    body: CampusSettingsUpdate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> CampusSettingsOut:
    row = college_service.upsert_campus_settings(
        db,
        college_id,
        campus_id,
        max_walk_to_stop_m=body.max_walk_to_stop_m,
        cluster_eps_m=body.cluster_eps_m,
        cluster_min_samples=body.cluster_min_samples,
        min_students_per_route=body.min_students_per_route,
    )
    return CampusSettingsOut.model_validate(row)
