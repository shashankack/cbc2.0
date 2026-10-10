"""Driver roster schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class DriverCreate(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=255)


class DriverOut(BaseModel):
    user_id: UUID
    email: str
    full_name: str | None
    assigned_bus_id: UUID | None = None
    assigned_bus_registration: str | None = None
