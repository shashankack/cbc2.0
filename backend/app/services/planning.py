"""Rule-based clustering, routing, bus assignment, confirm."""

from __future__ import annotations

import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError
from app.models.campus import Campus, CampusSettings
from app.models.enums import (
    BusStatus,
    PlanningItemStatus,
    PlanningRunStatus,
    RouteStatus,
    StopSource,
    StudentStatus,
)
from app.models.fleet import Bus
from app.models.mixins import utcnow
from app.models.planning import (
    Allocation,
    PlanningRun,
    PlanningRunItem,
    Route,
    RouteStop,
    Stop,
)
from app.models.student import Student, StudentImportBatch
from app.services.geo import Point, centroid, dbscan, nearest_neighbor_order


def _campus_settings(
    db: Session, college_id: uuid.UUID, campus_id: uuid.UUID
) -> CampusSettings:
    settings = db.scalar(
        select(CampusSettings).where(
            CampusSettings.college_id == college_id,
            CampusSettings.campus_id == campus_id,
        )
    )
    if settings is None:
        raise AppError(
            "CONFLICT",
            "Campus settings required before planning.",
            status_code=409,
        )
    return settings


def run_planning(
    db: Session,
    *,
    college_id: uuid.UUID,
    campus_id: uuid.UUID,
    created_by_user_id: uuid.UUID,
    import_batch_id: uuid.UUID | None = None,
) -> PlanningRun:
    campus = db.scalar(
        select(Campus).where(Campus.id == campus_id, Campus.college_id == college_id)
    )
    if campus is None:
        raise AppError("NOT_FOUND", "Campus not found.", status_code=404)
    if campus.lat is None or campus.lng is None:
        raise AppError(
            "CONFLICT",
            "Campus coordinates are required before planning. "
            "Set lat/lng on the campus so routes can start and end at campus.",
            status_code=409,
        )
    settings = _campus_settings(db, college_id, campus_id)

    if import_batch_id is not None:
        batch = db.scalar(
            select(StudentImportBatch).where(
                StudentImportBatch.id == import_batch_id,
                StudentImportBatch.college_id == college_id,
                StudentImportBatch.campus_id == campus_id,
            )
        )
        if batch is None:
            raise AppError("NOT_FOUND", "Import batch not found.", status_code=404)
        students = list(
            db.scalars(
                select(Student).where(
                    Student.college_id == college_id,
                    Student.campus_id == campus_id,
                    Student.import_batch_id == import_batch_id,
                    Student.status.in_(
                        [StudentStatus.IMPORTED, StudentStatus.NEEDS_ADMIN_REVIEW]
                    ),
                )
            ).all()
        )
    else:
        students = list(
            db.scalars(
                select(Student).where(
                    Student.college_id == college_id,
                    Student.campus_id == campus_id,
                    Student.status.in_(
                        [StudentStatus.IMPORTED, StudentStatus.NEEDS_ADMIN_REVIEW]
                    ),
                )
            ).all()
        )

    if not students:
        raise AppError(
            "CONFLICT",
            "No imported students available for planning.",
            status_code=409,
        )

    buses = list(
        db.scalars(
            select(Bus).where(
                Bus.college_id == college_id,
                Bus.campus_id == campus_id,
                Bus.status == BusStatus.AVAILABLE,
            ).order_by(Bus.capacity.desc())
        ).all()
    )
    if not buses:
        raise AppError(
            "CONFLICT",
            "No available buses on this campus.",
            status_code=409,
        )

    run = PlanningRun(
        college_id=college_id,
        campus_id=campus_id,
        import_batch_id=import_batch_id,
        created_by_user_id=created_by_user_id,
        status=PlanningRunStatus.DRAFT,
    )
    db.add(run)
    db.flush()

    points = [
        Point(id=s.id, lat=s.home_lat, lng=s.home_lng) for s in students
    ]
    clusters, noise = dbscan(
        points,
        eps_m=float(settings.cluster_eps_m),
        min_samples=settings.cluster_min_samples,
    )

    student_by_id = {s.id: s for s in students}
    stop_for_cluster: dict[int, Stop] = {}
    members_by_stop: dict[uuid.UUID, list[uuid.UUID]] = {}

    for cid, members in clusters.items():
        lat, lng = centroid(members)
        stop = Stop(
            college_id=college_id,
            campus_id=campus_id,
            planning_run_id=run.id,
            name=f"Cluster {cid + 1}",
            lat=lat,
            lng=lng,
            source=StopSource.CLUSTER,
        )
        db.add(stop)
        db.flush()
        stop_for_cluster[cid] = stop
        members_by_stop[stop.id] = [m.id for m in members]  # type: ignore[misc]

    # Snap or review noise
    review_ids: list[uuid.UUID] = []
    for p in noise:
        sid = p.id  # type: ignore[assignment]
        from app.services.geo import haversine_m

        best_stop = None
        best_dist = None
        for stop in stop_for_cluster.values():
            dist = haversine_m(p.lat, p.lng, stop.lat, stop.lng)
            if best_dist is None or dist < best_dist:
                best_dist = dist
                best_stop = stop
        if best_stop is not None and best_dist is not None and best_dist <= settings.max_walk_to_stop_m:
            members_by_stop.setdefault(best_stop.id, []).append(sid)
            item_status = PlanningItemStatus.SNAPPED
            stop_id = best_stop.id
        else:
            review_ids.append(sid)
            item_status = PlanningItemStatus.NEEDS_ADMIN_REVIEW
            stop_id = None
            student_by_id[sid].status = StudentStatus.NEEDS_ADMIN_REVIEW

        if stop_id is not None:
            # item created later with route/bus
            pass
        db.add(
            PlanningRunItem(
                college_id=college_id,
                planning_run_id=run.id,
                student_id=sid,
                stop_id=stop_id,
                route_id=None,
                bus_id=None,
                status=item_status,
            )
        )

    # Items for clustered members (not noise)
    noise_ids = {p.id for p in noise}
    for cid, members in clusters.items():
        stop = stop_for_cluster[cid]
        for m in members:
            if m.id in noise_ids:
                continue
            db.add(
                PlanningRunItem(
                    college_id=college_id,
                    planning_run_id=run.id,
                    student_id=m.id,  # type: ignore[arg-type]
                    stop_id=stop.id,
                    route_id=None,
                    bus_id=None,
                    status=PlanningItemStatus.PROPOSED,
                )
            )

    db.flush()

    # Depot stop: every route starts and ends at campus.
    campus_stop = Stop(
        college_id=college_id,
        campus_id=campus_id,
        planning_run_id=run.id,
        name=f"{campus.name} (campus)",
        lat=float(campus.lat),
        lng=float(campus.lng),
        source=StopSource.CAMPUS,
    )
    db.add(campus_stop)
    db.flush()

    # Assemble multi-stop routes: NN order from campus depot, packed by capacity.
    stop_points = [
        Point(id=s.id, lat=s.lat, lng=s.lng) for s in stop_for_cluster.values()
    ]
    depot = Point(id=campus_stop.id, lat=float(campus.lat), lng=float(campus.lng))
    ordered_stops = nearest_neighbor_order(stop_points, depot=depot)
    bus_iter = list(buses)
    bus_idx = 0
    route_num = 0

    def _mark_students_for_review(student_ids: list[uuid.UUID]) -> None:
        for sid in student_ids:
            item = db.scalar(
                select(PlanningRunItem).where(
                    PlanningRunItem.planning_run_id == run.id,
                    PlanningRunItem.student_id == sid,
                )
            )
            if item is None:
                continue
            if item.status != PlanningItemStatus.NEEDS_ADMIN_REVIEW:
                item.status = PlanningItemStatus.NEEDS_ADMIN_REVIEW
                student_by_id[sid].status = StudentStatus.NEEDS_ADMIN_REVIEW

    def _bind_students(
        *,
        route: Route,
        bus: Bus,
        student_ids: list[uuid.UUID],
    ) -> None:
        for sid in student_ids:
            item = db.scalar(
                select(PlanningRunItem).where(
                    PlanningRunItem.planning_run_id == run.id,
                    PlanningRunItem.student_id == sid,
                )
            )
            if item is None:
                continue
            item.route_id = route.id
            item.bus_id = bus.id
            if item.status != PlanningItemStatus.NEEDS_ADMIN_REVIEW:
                item.status = (
                    PlanningItemStatus.SNAPPED
                    if item.status == PlanningItemStatus.SNAPPED
                    else PlanningItemStatus.PROPOSED
                )
                student_by_id[sid].status = StudentStatus.ALLOCATED

    stop_i = 0
    while stop_i < len(ordered_stops):
        stop_id = ordered_stops[stop_i].id  # type: ignore[assignment]
        members = members_by_stop.get(stop_id, [])
        if not members:
            stop_i += 1
            continue

        if bus_idx >= len(bus_iter):
            leftover: list[uuid.UUID] = []
            for sp in ordered_stops[stop_i:]:
                leftover.extend(members_by_stop.get(sp.id, []))  # type: ignore[arg-type]
            _mark_students_for_review(leftover)
            break

        bus = bus_iter[bus_idx]
        bus_idx += 1
        packed: list[tuple[uuid.UUID, list[uuid.UUID]]] = []
        headcount = 0

        while stop_i < len(ordered_stops):
            sid = ordered_stops[stop_i].id  # type: ignore[assignment]
            stop_members = members_by_stop.get(sid, [])
            n = len(stop_members)
            if n == 0:
                stop_i += 1
                continue

            # Single stop larger than this bus: fill what fits, leave rest for next bus.
            if not packed and n > bus.capacity:
                chunk = stop_members[: bus.capacity]
                rest = stop_members[bus.capacity :]
                members_by_stop[sid] = rest
                packed.append((sid, chunk))
                headcount = len(chunk)
                # Do not advance stop_i — remaining headcount stays on this stop.
                break

            if headcount + n > bus.capacity:
                break

            packed.append((sid, stop_members))
            headcount += n
            stop_i += 1

        if not packed:
            # Could not place current stop on any remaining bus capacity.
            _mark_students_for_review(members)
            stop_i += 1
            continue

        if headcount < settings.min_students_per_route:
            _mark_students_for_review(
                [sid for _, m in packed for sid in m]
            )
            continue

        route_num += 1
        route = Route(
            college_id=college_id,
            campus_id=campus_id,
            planning_run_id=run.id,
            name=f"Route {route_num}",
            status=RouteStatus.DRAFT,
        )
        db.add(route)
        db.flush()
        # Sequence: campus → pickups → campus
        db.add(
            RouteStop(
                college_id=college_id,
                route_id=route.id,
                stop_id=campus_stop.id,
                sequence=1,
            )
        )
        for seq, (packed_stop_id, packed_members) in enumerate(packed, start=2):
            db.add(
                RouteStop(
                    college_id=college_id,
                    route_id=route.id,
                    stop_id=packed_stop_id,
                    sequence=seq,
                )
            )
            _bind_students(route=route, bus=bus, student_ids=packed_members)
        db.add(
            RouteStop(
                college_id=college_id,
                route_id=route.id,
                stop_id=campus_stop.id,
                sequence=len(packed) + 2,
            )
        )

    run.status = PlanningRunStatus.PROPOSED
    db.commit()
    db.refresh(run)
    return get_planning_run(db, college_id, run.id)


def get_planning_run(
    db: Session, college_id: uuid.UUID, run_id: uuid.UUID
) -> PlanningRun:
    run = db.scalar(
        select(PlanningRun)
        .where(PlanningRun.id == run_id, PlanningRun.college_id == college_id)
        .options(
            selectinload(PlanningRun.stops),
            selectinload(PlanningRun.routes).selectinload(Route.route_stops).selectinload(RouteStop.stop),
            selectinload(PlanningRun.items),
        )
    )
    if run is None:
        raise AppError("NOT_FOUND", "Planning run not found.", status_code=404)
    return run


def list_planning_runs(db: Session, college_id: uuid.UUID) -> list[PlanningRun]:
    return list(
        db.scalars(
            select(PlanningRun)
            .where(PlanningRun.college_id == college_id)
            .order_by(PlanningRun.created_at.desc())
        ).all()
    )


def confirm_planning_run(
    db: Session, college_id: uuid.UUID, run_id: uuid.UUID
) -> PlanningRun:
    run = get_planning_run(db, college_id, run_id)
    if run.status != PlanningRunStatus.PROPOSED:
        raise AppError(
            "CONFLICT",
            "Only proposed planning runs can be confirmed.",
            status_code=409,
        )

    confirmable = [
        i
        for i in run.items
        if i.status in {PlanningItemStatus.PROPOSED, PlanningItemStatus.SNAPPED}
        and i.stop_id
        and i.route_id
        and i.bus_id
    ]
    if not confirmable:
        raise AppError(
            "CONFLICT",
            "No confirmable student assignments in this planning run.",
            status_code=409,
        )

    # Capacity check per bus
    by_bus: dict[uuid.UUID, list[PlanningRunItem]] = defaultdict(list)
    for item in confirmable:
        assert item.bus_id is not None
        by_bus[item.bus_id].append(item)

    for bus_id, items in by_bus.items():
        bus = db.get(Bus, bus_id)
        if bus is None or bus.college_id != college_id:
            raise AppError("CONFLICT", "Assigned bus missing.", status_code=409)
        if bus.status != BusStatus.AVAILABLE:
            raise AppError(
                "CONFLICT",
                f"Bus {bus.registration_number} is not available.",
                status_code=409,
            )
        if len(items) > bus.capacity:
            raise AppError(
                "CONFLICT",
                f"Bus {bus.registration_number} over capacity.",
                status_code=409,
            )

    for item in confirmable:
        existing = db.scalar(
            select(Allocation).where(
                Allocation.college_id == college_id,
                Allocation.student_id == item.student_id,
            )
        )
        if existing is not None:
            raise AppError(
                "CONFLICT",
                "Student already has a locked allocation.",
                status_code=409,
            )
        db.add(
            Allocation(
                college_id=college_id,
                planning_run_id=run.id,
                student_id=item.student_id,
                stop_id=item.stop_id,  # type: ignore[arg-type]
                route_id=item.route_id,  # type: ignore[arg-type]
                bus_id=item.bus_id,  # type: ignore[arg-type]
            )
        )
        item.status = PlanningItemStatus.CONFIRMED
        student = db.get(Student, item.student_id)
        if student is not None:
            student.status = StudentStatus.LOCKED

    for route in run.routes:
        route.status = RouteStatus.CONFIRMED

    run.status = PlanningRunStatus.CONFIRMED
    run.confirmed_at = utcnow()

    # Auto-schedule today's trips for each confirmed route/bus/driver pairing.
    from app.services import trips as trip_service

    trip_service.schedule_trips_for_assignments(
        db,
        college_id,
        [
            (item.route_id, item.bus_id)  # type: ignore[arg-type]
            for item in confirmable
            if item.route_id and item.bus_id
        ],
    )

    db.commit()
    return get_planning_run(db, college_id, run.id)
