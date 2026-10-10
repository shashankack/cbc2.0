"""Auth request/response schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class OtpRequestBody(BaseModel):
    email: EmailStr


class OtpVerifyBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)


class OtpRequestResponse(BaseModel):
    status: str
    expires_in_seconds: int


class MembershipOut(ORMModel):
    college_id: UUID
    role: str


class MeResponse(ORMModel):
    id: UUID
    email: str
    full_name: str | None
    is_platform_operator: bool
    memberships: list[MembershipOut]
