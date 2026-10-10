"""Seed Demo College (pes.edu) for local E2E: students, buses, driver, plan, confirm.

Usage (from backend/, venv active):
  python scripts/seed_demo_pes.py
"""

from __future__ import annotations

import io
import sys
import uuid
from pathlib import Path

# Allow `python scripts/seed_demo_pes.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_otp_code, normalize_email
from app.db import session as db_session
from app.main import app
from app.models.campus import Campus
from app.models.college import College, CollegeDomain
from app.models.otp import OtpChallenge

COLLEGE_ID = uuid.UUID("3663844f-925e-4281-984e-6d34d0d40c29")
ADMIN_EMAIL = "admin@demo-12006554.edu"
DRIVER_EMAIL = "driver@pes.edu"
DOMAIN = "pes.edu"


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


def main() -> None:
    settings.otp_request_cooldown_seconds = 0
    db_session.get_engine()
    assert db_session.SessionLocal is not None

    db = db_session.SessionLocal()
    try:
        college = db.get(College, COLLEGE_ID)
        if college is None:
            raise SystemExit(f"College {COLLEGE_ID} not found")
        campus = db.scalar(
            select(Campus).where(Campus.college_id == COLLEGE_ID).limit(1)
        )
        if campus is None:
            raise SystemExit("No campus on Demo College — create one first")
        campus_id = campus.id
        domain = db.scalar(
            select(CollegeDomain).where(
                CollegeDomain.college_id == COLLEGE_ID,
                CollegeDomain.domain == DOMAIN,
            )
        )
        if domain is None or domain.status != "active":
            raise SystemExit(f"Active domain {DOMAIN} missing on college")
    finally:
        db.close()

    with TestClient(app) as client:
        _login(client, ADMIN_EMAIL)

        # Tighten clustering for small demo cohorts
        settings_resp = client.put(
            f"/api/v1/colleges/{COLLEGE_ID}/campuses/{campus_id}/settings",
            json={
                "max_walk_to_stop_m": 800,
                "cluster_eps_m": 500,
                "cluster_min_samples": 2,
                "min_students_per_route": 2,
            },
        )
        assert settings_resp.status_code == 200, settings_resp.text

        buses = []
        for reg, capacity in (("KA01PE1001", 40), ("KA01PE1002", 40)):
            bus = client.post(
                f"/api/v1/colleges/{COLLEGE_ID}/buses",
                json={
                    "campus_id": str(campus_id),
                    "registration_number": reg,
                    "capacity": capacity,
                    "driver_email": DRIVER_EMAIL if reg.endswith("1001") else None,
                },
            )
            if bus.status_code == 409:
                listed = client.get(f"/api/v1/colleges/{COLLEGE_ID}/buses")
                assert listed.status_code == 200, listed.text
                match = next(
                    (b for b in listed.json() if b["registration_number"] == reg),
                    None,
                )
                assert match is not None
                buses.append(match)
                print(f"Bus {reg} already exists: {match['id']}")
            else:
                assert bus.status_code == 201, bus.text
                buses.append(bus.json())
                print(f"Created bus {reg}: {bus.json()['id']}")

        # Two geographic clusters (~8 students each) around Bangalore
        clusters = [
            (12.9716, 77.5946),
            (12.9352, 77.6245),
        ]
        rows = ["name,srn,email,lat,lng"]
        n = 0
        for ci, (base_lat, base_lng) in enumerate(clusters):
            for j in range(8):
                n += 1
                rows.append(
                    "Student {n},PES{n:03d},student{n}@{domain},"
                    "{lat:.6f},{lng:.6f}".format(
                        n=n,
                        domain=DOMAIN,
                        lat=base_lat + j * 0.00035,
                        lng=base_lng + j * 0.00035,
                    )
                )
        # Keep alice in the first cluster area (already seeded; import skips duplicates)
        csv_bytes = ("\n".join(rows)).encode("utf-8")

        imp = client.post(
            f"/api/v1/colleges/{COLLEGE_ID}/imports/students",
            data={"campus_id": str(campus_id)},
            files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert imp.status_code == 201, imp.text
        batch = imp.json()
        print(
            f"Import batch {batch['id']}: valid={batch['valid_count']} "
            f"invalid={batch['error_count']}"
        )

        plan = client.post(
            f"/api/v1/colleges/{COLLEGE_ID}/planning-runs",
            json={
                "campus_id": str(campus_id),
                "import_batch_id": batch["id"],
            },
        )
        assert plan.status_code == 201, plan.text
        run = plan.json()
        print(
            f"Planning run {run['id']}: status={run['status']} "
            f"routes={len(run['routes'])} items={len(run['items'])}"
        )
        assert run["status"] == "proposed", run
        assert run["routes"], "expected at least one route"

        confirm = client.post(
            f"/api/v1/colleges/{COLLEGE_ID}/planning-runs/{run['id']}/confirm"
        )
        assert confirm.status_code == 200, confirm.text
        confirmed = confirm.json()
        print(f"Confirmed run: status={confirmed['status']}")

        route_id = confirmed["routes"][0]["id"]
        bus_id = buses[0]["id"]

        trip = client.post(
            f"/api/v1/colleges/{COLLEGE_ID}/trips",
            json={"route_id": route_id, "bus_id": bus_id},
        )
        assert trip.status_code == 201, trip.text
        trip_id = trip.json()["id"]
        print(f"Scheduled trip: {trip_id}")

    print()
    print("=== Demo accounts (OTP from uvicorn / API log) ===")
    print(f"  Admin:   {ADMIN_EMAIL}  -> /admin")
    print(f"  Driver:  {DRIVER_EMAIL}  -> /driver")
    print(f"  Student: alice@pes.edu or student1@{DOMAIN} -> /student")
    print()
    print("=== Driver start ===")
    print(f"  College: {COLLEGE_ID}")
    print(f"  Route:   {route_id}")
    print(f"  Bus:     {bus_id}")
    print(f"  Trip:    {trip_id}  (or create again in UI)")
    print()
    print("After driver starts: student Live map + Board with that trip ID.")


if __name__ == "__main__":
    main()
