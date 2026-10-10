"""User and membership models."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.college import College


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_platform_operator: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    memberships: Mapped[list[CollegeMembership]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class CollegeMembership(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "college_memberships"
    __table_args__ = (
        UniqueConstraint(
            "college_id",
            "user_id",
            "role",
            name="uq_college_memberships_college_user_role",
        ),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)

    user: Mapped[User] = relationship(back_populates="memberships")
    college: Mapped[College] = relationship(back_populates="memberships")
