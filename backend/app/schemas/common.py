"""Shared schema helpers."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdResponse(ORMModel):
    id: UUID


class MessageStatus(BaseModel):
    status: str
