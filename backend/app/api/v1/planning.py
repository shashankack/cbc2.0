"""Planning run endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_college_admin_access
from app.models.user import User
from app.schemas.planning import (
    PlanningItemOut,
    PlanningRunCreate,
    PlanningRunOut,
    ReviewItemAssign,
    RouteOut,
    RouteStopOut,
    StopOut,
)
from app.services import planning as planning_service

router = APIRouter(prefix="/colleges/{college_id}/planning-runs", tags=["planning"])


def _serialize_run(run) -> PlanningRunOut:
    routes = []
    for route in run.routes:
        stops = []
        for rs in route.route_stops:
            stops.append(
                RouteStopOut(
                    sequence=rs.sequence,
                    stop_id=rs.stop_id,
                    name=rs.stop.name if rs.stop else None,
                    lat=rs.stop.lat if rs.stop else None,
                    lng=rs.stop.lng if rs.stop else None,
                )
            )
        routes.append(
            RouteOut(
                id=route.id,
                name=route.name,
                status=route.status,
                route_stops=stops,
            )
        )
    return PlanningRunOut(
        id=run.id,
        college_id=run.college_id,
        campus_id=run.campus_id,
        import_batch_id=run.import_batch_id,
        status=run.status,
        confirmed_at=run.confirmed_at,
        created_at=run.created_at,
        stops=[StopOut.model_validate(s) for s in run.stops],
        routes=routes,
        items=[PlanningItemOut.model_validate(i) for i in run.items],
    )


@router.get("", response_model=list[PlanningRunOut])
def list_runs(
    college_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> list[PlanningRunOut]:
    runs = planning_service.list_planning_runs(db, college_id)
    return [
        PlanningRunOut(
            id=r.id,
            college_id=r.college_id,
            campus_id=r.campus_id,
            import_batch_id=r.import_batch_id,
            status=r.status,
            confirmed_at=r.confirmed_at,
            created_at=r.created_at,
        )
        for r in runs
    ]


@router.post("", response_model=PlanningRunOut, status_code=201)
def create_run(
    college_id: uuid.UUID,
    body: PlanningRunCreate,
    db: DbSession,
    admin: Annotated[User, Depends(require_college_admin_access)],
) -> PlanningRunOut:
    run = planning_service.run_planning(
        db,
        college_id=college_id,
        campus_id=body.campus_id,
        created_by_user_id=admin.id,
        import_batch_id=body.import_batch_id,
    )
    return _serialize_run(run)


@router.get("/{run_id}", response_model=PlanningRunOut)
def get_run(
    college_id: uuid.UUID,
    run_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> PlanningRunOut:
    run = planning_service.get_planning_run(db, college_id, run_id)
    return _serialize_run(run)


@router.post("/{run_id}/confirm", response_model=PlanningRunOut)
def confirm_run(
    college_id: uuid.UUID,
    run_id: uuid.UUID,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> PlanningRunOut:
    run = planning_service.confirm_planning_run(db, college_id, run_id)
    return _serialize_run(run)


@router.post(
    "/{run_id}/items/{item_id}/assign-stop",
    response_model=PlanningRunOut,
)
def assign_review_item(
    college_id: uuid.UUID,
    run_id: uuid.UUID,
    item_id: uuid.UUID,
    body: ReviewItemAssign,
    db: DbSession,
    _admin: Annotated[User, Depends(require_college_admin_access)],
) -> PlanningRunOut:
    run = planning_service.assign_review_item_to_stop(
        db,
        college_id,
        run_id,
        item_id,
        stop_id=body.stop_id,
        route_id=body.route_id,
        bus_id=body.bus_id,
    )
    return _serialize_run(run)
