"""Student import and list endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.api.deps import CurrentUser, DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.planning import AllocationOut
from app.schemas.students import ImportBatchOut, StudentOut
from app.services import imports as import_service
from app.services import trips as trip_service
from app.services.auth import require_college_roles

router = APIRouter(tags=["students"])


@router.post(
    "/colleges/{college_id}/imports/students",
    response_model=ImportBatchOut,
    status_code=201,
)
async def import_students(
    college_id: uuid.UUID,
    db: DbSession,
    admin: Annotated[User, Depends(require_college_admin_access)],
    campus_id: Annotated[uuid.UUID, Form()],
    file: UploadFile = File(...),
) -> ImportBatchOut:
    content = await file.read()
    filename = file.filename or "upload.csv"
    batch = import_service.import_students_file(
        db,
        college_id=college_id,
        campus_id=campus_id,
        uploaded_by_user_id=admin.id,
        filename=filename,
        content=content,
    )
    return ImportBatchOut.model_validate(import_service.serialize_batch(db, batch))


@router.get(
    "/colleges/{college_id}/imports/students",
    response_model=list[ImportBatchOut],
)
def list_import_batches(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
    campus_id: uuid.UUID | None = Query(default=None),
    active_only: bool = Query(
        default=False,
        description="If true, only completed batches with unlocked students.",
    ),
) -> list[ImportBatchOut]:
    rows = import_service.list_batches(db, college_id, campus_id=campus_id)
    out = [
        ImportBatchOut.model_validate(import_service.serialize_batch(db, r))
        for r in rows
    ]
    if active_only:
        out = [b for b in out if b.is_active]
    return out


@router.get(
    "/colleges/{college_id}/imports/students/{batch_id}",
    response_model=ImportBatchOut,
)
def get_import_batch(
    college_id: uuid.UUID,
    batch_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> ImportBatchOut:
    batch = import_service.get_batch(db, college_id, batch_id)
    return ImportBatchOut.model_validate(import_service.serialize_batch(db, batch))


@router.get("/colleges/{college_id}/students", response_model=list[StudentOut])
def list_students(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
    campus_id: uuid.UUID | None = Query(default=None),
) -> list[StudentOut]:
    rows = import_service.list_students(db, college_id, campus_id=campus_id)
    return [StudentOut.model_validate(r) for r in rows]


@router.get(
    "/colleges/{college_id}/me/allocation",
    response_model=AllocationOut | None,
)
def my_allocation(
    college_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> AllocationOut | None:
    require_college_roles(db, user, college_id, {"student", "college_admin"})
    detail = trip_service.allocation_detail(db, college_id, user)
    if detail is None:
        return None
    return AllocationOut.model_validate(detail)
