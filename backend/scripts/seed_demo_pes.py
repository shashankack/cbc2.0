"""Seed PES University / Ring Road Campus for manual import + planning demos.

Creates (or updates) college, campus, domain, settings, buses, and drivers.
Does NOT import students or run planning — upload the CSV yourself.

Demo sizing (after import + planning on RING):
  - 150 students in 3 corridors × 5 neighborhood pickups (10 each)
    West (Kengeri→Hosakerehalli), South (BTM→Girinagar), North (Magadi→Mysore Rd)
  - 7 available buses @ capacity 55 (385 seats; ~3 used for routes, rest spare)
  - expect 3 multi-stop routes (about 5 pickups each) back to RING depot

Usage (from backend/, venv active):
  python scripts/seed_demo_pes.py

CSV for admin Import page:
  scripts/fixtures/pes_ring_road_students.csv
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.core.config import settings
from app.core.security import hash_otp_code, normalize_email
from app.db import session as db_session
from app.main import app
from app.models.campus import Campus, CampusSettings
from app.models.college import College, CollegeDomain
from app.models.enums import (
    BusStatus,
    CollegeStatus,
    DomainStatus,
    MembershipRole,
)
from app.models.fleet import Bus
from app.models.otp import OtpChallenge
from app.models.planning import (
    Allocation,
    PlanningRun,
    PlanningRunItem,
    Route,
    RouteStop,
    Stop,
)
from app.models.student import Student, StudentImportBatch, StudentImportRow
from app.models.trip import (
    BoardingRecord,
    DistressEvent,
    EmergencyReallocation,
    Trip,
    TripLocationPing,
    TripQrToken,
)
from app.models.user import CollegeMembership, User
from app.services.auth import ensure_membership, get_or_create_user

COLLEGE_NAME = "PES University"
CAMPUS_NAME = "Ring Road Campus"
CAMPUS_CODE = "RING"
DOMAIN = "pes.edu"
ADMIN_EMAIL = "admin@pes.edu"
DRIVER_EMAILS = (
    ("driver@pes.edu", "PES Driver 1"),
    ("driver2@pes.edu", "PES Driver 2"),
    ("driver3@pes.edu", "PES Driver 3"),
    ("driver4@pes.edu", "PES Driver 4"),
    ("driver5@pes.edu", "PES Driver 5"),
    ("driver6@pes.edu", "PES Driver 6"),
    ("driver7@pes.edu", "PES Driver 7"),
)
# 150 students / 3 corridors ≈ 50 per route → capacity 55 fills one bus per corridor.
# Extra buses stay available for disruption / emergency demos.
BUS_SPECS = (
    ("KA01PE1001", 55, "driver@pes.edu"),
    ("KA01PE1002", 55, "driver2@pes.edu"),
    ("KA01PE1003", 55, "driver3@pes.edu"),
    ("KA01PE1004", 55, "driver4@pes.edu"),
    ("KA01PE1005", 55, "driver5@pes.edu"),
    ("KA01PE1006", 55, "driver6@pes.edu"),
    ("KA01PE1007", 55, "driver7@pes.edu"),
)

FIXTURE_CSV = Path(__file__).resolve().parent / "fixtures" / "pes_ring_road_students.csv"


def _otp(email: str) -> str:
    assert db_session.SessionLocal is not None
    db = db_session.SessionLocal()
    try:
        challenge = db.scalar(
            select(OtpChallenge)
            .where(OtpChallenge.email == normalize_email(email))
            .order_by(OtpChallenge.created_at.desc())
            .limit(1)
        )
        assert challenge is not None, f"no OTP challenge for {email}"
        code = "123456"
        challenge.code_hash = hash_otp_code(email, code)
        db.commit()
        return code
    finally:
        db.close()


def _login(client: TestClient, email: str) -> None:
    r = client.post("/api/v1/auth/otp/request", json={"email": email})
    assert r.status_code == 200, r.text
    code = _otp(email)
    r = client.post("/api/v1/auth/otp/verify", json={"email": email, "code": code})
    assert r.status_code == 200, r.text


def _wipe_college_ops(db, college_id: uuid.UUID) -> None:
    """Clear prior demo ops data so a fresh CSV import can run cleanly."""
    trip_ids = list(db.scalars(select(Trip.id).where(Trip.college_id == college_id)))
    if trip_ids:
        distress_ids = list(
            db.scalars(
                select(DistressEvent.id).where(DistressEvent.trip_id.in_(trip_ids))
            )
        )
        if distress_ids:
            db.execute(
                delete(EmergencyReallocation).where(
                    EmergencyReallocation.distress_event_id.in_(distress_ids)
                )
            )
        db.execute(delete(DistressEvent).where(DistressEvent.trip_id.in_(trip_ids)))
        db.execute(delete(BoardingRecord).where(BoardingRecord.trip_id.in_(trip_ids)))
        db.execute(delete(TripLocationPing).where(TripLocationPing.trip_id.in_(trip_ids)))
        db.execute(delete(TripQrToken).where(TripQrToken.trip_id.in_(trip_ids)))
        db.execute(delete(Trip).where(Trip.id.in_(trip_ids)))

    db.execute(delete(Allocation).where(Allocation.college_id == college_id))
    db.execute(
        delete(PlanningRunItem).where(PlanningRunItem.college_id == college_id)
    )
    route_ids = list(db.scalars(select(Route.id).where(Route.college_id == college_id)))
    if route_ids:
        db.execute(delete(RouteStop).where(RouteStop.route_id.in_(route_ids)))
    db.execute(delete(Route).where(Route.college_id == college_id))
    db.execute(delete(Stop).where(Stop.college_id == college_id))
    db.execute(delete(PlanningRun).where(PlanningRun.college_id == college_id))

    batch_ids = list(
        db.scalars(
            select(StudentImportBatch.id).where(
                StudentImportBatch.college_id == college_id
            )
        )
    )
    if batch_ids:
        db.execute(
            delete(StudentImportRow).where(StudentImportRow.batch_id.in_(batch_ids))
        )
    db.execute(
        delete(StudentImportBatch).where(StudentImportBatch.college_id == college_id)
    )
    db.execute(delete(Student).where(Student.college_id == college_id))
    db.execute(delete(Bus).where(Bus.college_id == college_id))
    db.commit()


def _ensure_college(db) -> College:
    college = db.scalar(
        select(College).where(College.name == COLLEGE_NAME).limit(1)
    )
    if college is None:
        # Reuse prior demo college if present, else create.
        college = db.scalar(
            select(College)
            .where(College.slug == "demo-12006554")
            .limit(1)
        )
    if college is None:
        college = College(
            name=COLLEGE_NAME,
            slug="pes-university",
            status=CollegeStatus.ACTIVE,
        )
        db.add(college)
        db.flush()
    else:
        college.name = COLLEGE_NAME
        college.slug = "pes-university"
        college.status = CollegeStatus.ACTIVE
        db.flush()
    return college


def _ensure_campus(db, college: College) -> Campus:
    campus = db.scalar(
        select(Campus).where(
            Campus.college_id == college.id,
            Campus.code == CAMPUS_CODE,
        )
    )
    # Real PES University (Outer Ring Road / Hosakerehalli) — matches Nominatim
    # "PES University" search. Do not use a BTM/Koramangala stand-in.
    depot_lat, depot_lng = 12.93424, 77.53432

    if campus is None:
        campus = Campus(
            college_id=college.id,
            name=CAMPUS_NAME,
            code=CAMPUS_CODE,
            lat=depot_lat,
            lng=depot_lng,
        )
        db.add(campus)
        db.flush()
    else:
        campus.name = CAMPUS_NAME
        campus.lat = depot_lat
        campus.lng = depot_lng
        db.flush()

    settings_row = db.scalar(
        select(CampusSettings).where(
            CampusSettings.college_id == college.id,
            CampusSettings.campus_id == campus.id,
        )
    )
    if settings_row is None:
        settings_row = CampusSettings(
            college_id=college.id,
            campus_id=campus.id,
            max_walk_to_stop_m=800,
            cluster_eps_m=500,
            cluster_min_samples=2,
            min_students_per_route=2,
        )
        db.add(settings_row)
    else:
        settings_row.max_walk_to_stop_m = 800
        settings_row.cluster_eps_m = 500
        settings_row.cluster_min_samples = 2
        settings_row.min_students_per_route = 2
    db.flush()
    return campus


def _ensure_domain(db, college: College) -> CollegeDomain:
    domain = db.scalar(
        select(CollegeDomain).where(
            CollegeDomain.college_id == college.id,
            CollegeDomain.domain == DOMAIN,
        )
    )
    now = datetime.now(timezone.utc)
    if domain is None:
        domain = CollegeDomain(
            college_id=college.id,
            domain=DOMAIN,
            dns_txt_token="dev-pes-ring-road",
            dns_verified_at=now,
            status=DomainStatus.ACTIVE,
        )
        db.add(domain)
    else:
        domain.status = DomainStatus.ACTIVE
        domain.dns_verified_at = domain.dns_verified_at or now
    db.flush()
    return domain


def main() -> None:
    if not FIXTURE_CSV.is_file():
        raise SystemExit(f"Missing fixture CSV: {FIXTURE_CSV}")

    settings.otp_request_cooldown_seconds = 0
    db_session.get_engine()
    assert db_session.SessionLocal is not None

    db = db_session.SessionLocal()
    try:
        college = _ensure_college(db)
        campus = _ensure_campus(db, college)
        _ensure_domain(db, college)

        admin = get_or_create_user(db, ADMIN_EMAIL, "PES Admin")
        ensure_membership(
            db,
            college_id=college.id,
            user_id=admin.id,
            role=MembershipRole.COLLEGE_ADMIN,
        )
        drivers_by_email: dict[str, User] = {}
        for driver_email, driver_name in DRIVER_EMAILS:
            driver = get_or_create_user(db, driver_email, driver_name)
            ensure_membership(
                db,
                college_id=college.id,
                user_id=driver.id,
                role=MembershipRole.DRIVER,
            )
            drivers_by_email[driver_email] = driver
        db.commit()

        _wipe_college_ops(db, college.id)

        for reg, capacity, driver_email in BUS_SPECS:
            bus = Bus(
                college_id=college.id,
                campus_id=campus.id,
                registration_number=reg,
                capacity=capacity,
                status=BusStatus.AVAILABLE,
                driver_user_id=drivers_by_email[driver_email].id,
            )
            db.add(bus)
        db.commit()

        college_id = college.id
        campus_id = campus.id
    finally:
        db.close()

    # Smoke-check admin can list campuses via API
    with TestClient(app) as client:
        _login(client, ADMIN_EMAIL)
        r = client.get(f"/api/v1/colleges/{college_id}/campuses")
        assert r.status_code == 200, r.text

    bus_label = ", ".join(
        f"{reg} (cap {cap}, {drv})" for reg, cap, drv in BUS_SPECS
    )
    print("PES University seed ready (no students imported).")
    print()
    print(f"  College:  {COLLEGE_NAME}  ({college_id})")
    print(f"  Campus:   {CAMPUS_NAME} [{CAMPUS_CODE}]  ({campus_id})")
    print("  Depot:    12.93424, 77.53432 (PES University ORR — routes start/end here)")
    print(f"  Domain:   {DOMAIN} (active)")
    print(f"  Admin:    {ADMIN_EMAIL}")
    print(f"  Drivers:  {', '.join(e for e, _ in DRIVER_EMAILS)}")
    print(f"  Buses:    {bus_label}")
    print("  Expected after import+plan: 3 routes × ~5 pickups (West / South / North)")
    print()
    print("Manual import CSV (3 corridors × 5 pickups × 10 students):")
    print(f"  {FIXTURE_CSV}")
    print(f"  ({sum(1 for _ in FIXTURE_CSV.open(encoding='utf-8')) - 1} students)")
    print()
    print("Regenerate CSV if needed:")
    print("  python scripts/generate_pes_students_csv.py")
    print()
    print("Steps:")
    print(f"  1. Login as {ADMIN_EMAIL} (OTP in uvicorn log)")
    print("  2. Admin -> Upload students")
    print(f"  3. Select campus {CAMPUS_CODE} ({campus_id})")
    print("  4. Upload the CSV above")
    print("  5. Continue to Plan routes")
    print("  6. Build draft routes, then Lock in routes")


if __name__ == "__main__":
    main()
