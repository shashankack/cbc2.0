"""Bus schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class BusCreate(BaseModel):
    campus_id: UUID
    registration_number: str = Field(min_length=1, max_length=64)
    capacity: int = Field(ge=1)
    driver_email: EmailStr | None = None


class BusUpdate(BaseModel):
    status: str | None = None
    capacity: int | None = Field(default=None, ge=1)
    driver_email: EmailStr | None = None
    clear_driver: bool = False


class BusOut(ORMModel):
    id: UUID
    college_id: UUID
    campus_id: UUID
    registration_number: str
    capacity: int
    status: str
    driver_user_id: UUID | None
    created_at: datetime
    driver_email: str | None = None
    campus_code: str | None = None
    campus_name: str | None = None
