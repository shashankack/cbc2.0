"""College admin schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class DomainCreate(BaseModel):
    domain: str = Field(min_length=3, max_length=255)


class DomainOut(ORMModel):
    id: UUID
    college_id: UUID
    domain: str
    dns_txt_token: str
    status: str
    dns_verified_at: datetime | None
    created_at: datetime


class CampusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=64)


class CampusSettingsOut(ORMModel):
    max_walk_to_stop_m: int
    cluster_eps_m: int
    cluster_min_samples: int
    min_students_per_route: int


class CampusOut(ORMModel):
    id: UUID
    college_id: UUID
    name: str
    code: str
    created_at: datetime
    settings: CampusSettingsOut | None = None


class CampusSettingsUpdate(BaseModel):
    max_walk_to_stop_m: int = Field(ge=1)
    cluster_eps_m: int = Field(ge=1)
    cluster_min_samples: int = Field(ge=1)
    min_students_per_route: int = Field(ge=1)
