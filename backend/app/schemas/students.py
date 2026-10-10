"""Student import schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.schemas.common import ORMModel


class ImportBatchOut(ORMModel):
    id: UUID
    college_id: UUID
    campus_id: UUID
    filename: str
    status: str
    row_count: int
    valid_count: int
    error_count: int
    created_at: datetime
    campus_code: str | None = None
    campus_name: str | None = None
    # Students from this batch not yet locked (still in the planning pool).
    active_student_count: int = 0
    locked_student_count: int = 0
    # True when completed and at least one student is still unlocked.
    is_active: bool = False


class StudentOut(ORMModel):
    id: UUID
    college_id: UUID
    campus_id: UUID
    srn: str
    email: str
    full_name: str
    home_lat: float
    home_lng: float
    status: str
    import_batch_id: UUID | None
    created_at: datetime
