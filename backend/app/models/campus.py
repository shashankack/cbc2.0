"""Campus and campus settings models."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.college import College


class Campus(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "campuses"
    __table_args__ = (
        UniqueConstraint("college_id", "code", name="uq_campuses_college_code"),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)

    college: Mapped[College] = relationship(back_populates="campuses")
    settings: Mapped[CampusSettings | None] = relationship(
        back_populates="campus",
        uselist=False,
        cascade="all, delete-orphan",
    )


class CampusSettings(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "campus_settings"
    __table_args__ = (
        UniqueConstraint(
            "college_id",
            "campus_id",
            name="uq_campus_settings_college_campus",
        ),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    campus_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("campuses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    max_walk_to_stop_m: Mapped[int] = mapped_column(Integer, nullable=False)
    cluster_eps_m: Mapped[int] = mapped_column(Integer, nullable=False)
    cluster_min_samples: Mapped[int] = mapped_column(Integer, nullable=False)
    min_students_per_route: Mapped[int] = mapped_column(Integer, nullable=False)

    college: Mapped[College] = relationship(back_populates="campus_settings")
    campus: Mapped[Campus] = relationship(back_populates="settings")
