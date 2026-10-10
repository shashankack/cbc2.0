"""Planning, stops, routes, allocations."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PlanningRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "planning_runs"

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
    import_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("student_import_batches.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="draft", server_default="draft"
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    stops: Mapped[list[Stop]] = relationship(back_populates="planning_run")
    routes: Mapped[list[Route]] = relationship(back_populates="planning_run")
    items: Mapped[list[PlanningRunItem]] = relationship(back_populates="planning_run")


class Stop(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stops"

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
    planning_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(
        String(32), nullable=False, default="cluster", server_default="cluster"
    )

    planning_run: Mapped[PlanningRun | None] = relationship(back_populates="stops")


class Route(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "routes"

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
    planning_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="draft", server_default="draft"
    )

    planning_run: Mapped[PlanningRun | None] = relationship(back_populates="routes")
    route_stops: Mapped[list[RouteStop]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RouteStop.sequence",
    )


class RouteStop(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "route_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "sequence", name="uq_route_stops_route_sequence"),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    route_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    route: Mapped[Route] = relationship(back_populates="route_stops")
    stop: Mapped[Stop] = relationship()


class PlanningRunItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "planning_run_items"
    __table_args__ = (
        UniqueConstraint(
            "planning_run_id",
            "student_id",
            name="uq_planning_run_items_run_student",
        ),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    planning_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stop_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stops.id", ondelete="SET NULL"),
        nullable=True,
    )
    route_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("routes.id", ondelete="SET NULL"),
        nullable=True,
    )
    bus_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("buses.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)

    planning_run: Mapped[PlanningRun] = relationship(back_populates="items")


class Allocation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "allocations"
    __table_args__ = (
        UniqueConstraint("college_id", "student_id", name="uq_allocations_college_student"),
    )

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    planning_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("planning_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stops.id", ondelete="RESTRICT"),
        nullable=False,
    )
    route_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("routes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    bus_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("buses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
