"""College tenancy models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.campus import Campus, CampusSettings
    from app.models.user import CollegeMembership


class CollegeApplication(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "college_applications"

    college_name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    applicant_email: Mapped[str] = mapped_column(String(320), nullable=False)
    applicant_full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", server_default="pending"
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class College(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "colleges"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active", server_default="active"
    )
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("college_applications.id", ondelete="SET NULL"),
        nullable=True,
    )

    domains: Mapped[list[CollegeDomain]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
    )
    memberships: Mapped[list[CollegeMembership]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
    )
    campuses: Mapped[list[Campus]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
    )
    campus_settings: Mapped[list[CampusSettings]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
    )


class CollegeDomain(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "college_domains"

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    dns_txt_token: Mapped[str] = mapped_column(String(128), nullable=False)
    dns_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", server_default="pending"
    )

    college: Mapped[College] = relationship(back_populates="domains")
