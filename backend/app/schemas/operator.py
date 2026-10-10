"""Operator / college application schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class CollegeApplicationCreate(BaseModel):
    college_name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=64)
    applicant_email: EmailStr
    applicant_full_name: str | None = Field(default=None, max_length=255)


class CollegeApplicationOut(ORMModel):
    id: UUID
    college_name: str
    slug: str
    applicant_email: str
    applicant_full_name: str | None
    status: str
    reviewed_at: datetime | None
    review_notes: str | None
    created_at: datetime


class ApplicationDecision(BaseModel):
    notes: str | None = None
    admin_email: EmailStr | None = None
    admin_full_name: str | None = Field(default=None, max_length=255)


class CollegeOut(ORMModel):
    id: UUID
    name: str
    slug: str
    status: str
    created_at: datetime


class DomainApproveOut(ORMModel):
    id: UUID
    college_id: UUID
    domain: str
    status: str
    dns_verified_at: datetime | None


class DomainOut(ORMModel):
    id: UUID
    college_id: UUID
    college_name: str | None = None
    domain: str
    status: str
    dns_txt_token: str
    dns_verified_at: datetime | None
    created_at: datetime


class DomainDecision(BaseModel):
    notes: str | None = None
