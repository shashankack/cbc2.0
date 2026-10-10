"""Fleet → import → plan → trip flow (Docker Postgres)."""

from __future__ import annotations

import io
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_otp_code, normalize_email
from app.db import session as db_session
from app.main import app
from app.models.otp import OtpChallenge


@pytest.fixture(scope="module")
def client() -> TestClient:
    settings.otp_request_cooldown_seconds = 0
    db_session.get_engine()
    with TestClient(app) as c:
        yield c


def _otp(email: str) -> str:
    db_session.get_engine()
    assert db_session.SessionLocal is not None
    db = db_session.SessionLocal()
    try:
        challenge = db.scalar(
            select(OtpChallenge)
            .where(OtpChallenge.email == normalize_email(email))
            .order_by(OtpChallenge.created_at.desc())
            .limit(1)
        )
        assert challenge is not None
        code = "123456"
        challenge.code_hash = hash_otp_code(email, code)
        db.commit()
        return code
    finally:
        db.close()


def _login(client: TestClient, email: str) -> None:
    assert client.post("/api/v1/auth/otp/request", json={"email": email}).status_code == 200
    code = _otp(email)
    resp = client.post("/api/v1/auth/otp/verify", json={"email": email, "code": code})
    assert resp.status_code == 200, resp.text


def test_fleet_import_plan_trip(client: TestClient) -> None:
    slug = f"fleet-{uuid.uuid4().hex[:8]}"
    domain = f"{slug}.edu"
    admin_email = f"admin@{domain}"
    driver_email = f"driver@{domain}"
    operator = settings.bootstrap_operator_email

    app_resp = client.post(
        "/api/v1/operator/college-applications",
        json={
            "college_name": "Fleet College",
            "slug": slug,
            "applicant_email": admin_email,
            "applicant_full_name": "Fleet Admin",
        },
    )
    assert app_resp.status_code == 201, app_resp.text
    application_id = app_resp.json()["id"]

    _login(client, operator)
    college = client.post(
        f"/api/v1/operator/college-applications/{application_id}/approve",
        json={},
    )
    assert college.status_code == 200, college.text
    college_id = college.json()["id"]

    _login(client, admin_email)
    campus = client.post(
        f"/api/v1/colleges/{college_id}/campuses",
        json={"name": "Main", "code": "MAIN"},
    )
    assert campus.status_code == 201, campus.text
    campus_id = campus.json()["id"]

    settings_resp = client.put(
        f"/api/v1/colleges/{college_id}/campuses/{campus_id}/settings",
        json={
            "max_walk_to_stop_m": 800,
            "cluster_eps_m": 500,
            "cluster_min_samples": 2,
            "min_students_per_route": 2,
        },
    )
    assert settings_resp.status_code == 200, settings_resp.text

    domain_resp = client.post(
        f"/api/v1/colleges/{college_id}/domains",
        json={"domain": domain},
    )
    assert domain_resp.status_code == 201, domain_resp.text
    domain_id = domain_resp.json()["id"]

    _login(client, operator)
    assert (
        client.post(f"/api/v1/operator/domains/{domain_id}/approve").status_code == 200
    )

    _login(client, admin_email)
    bus = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01AB1234",
            "capacity": 40,
            "driver_email": driver_email,
        },
    )
    assert bus.status_code == 201, bus.text
    bus_id = bus.json()["id"]

    # Cluster of 4 nearby students
    base_lat, base_lng = 12.9716, 77.5946
    rows = ["name,srn,email,lat,lng"]
    for i in range(4):
        rows.append(
            f"Student {i},SRN{i},student{i}@{domain},{base_lat + i * 0.0003},{base_lng + i * 0.0003}"
        )
    csv_bytes = ("\n".join(rows)).encode("utf-8")

    imp = client.post(
        f"/api/v1/colleges/{college_id}/imports/students",
        data={"campus_id": str(campus_id)},
        files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert imp.status_code == 201, imp.text
    assert imp.json()["valid_count"] == 4
    batch_id = imp.json()["id"]

    plan = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs",
        json={"campus_id": campus_id, "import_batch_id": batch_id},
    )
    assert plan.status_code == 201, plan.text
    run_id = plan.json()["id"]
    assert plan.json()["status"] == "proposed"
    assert len(plan.json()["routes"]) >= 1
    route_id = plan.json()["routes"][0]["id"]

    confirm = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/confirm"
    )
    assert confirm.status_code == 200, confirm.text
    assert confirm.json()["status"] == "confirmed"

    trip = client.post(
        f"/api/v1/colleges/{college_id}/trips",
        json={"route_id": route_id, "bus_id": bus_id},
    )
    assert trip.status_code == 201, trip.text
    trip_id = trip.json()["id"]

    _login(client, driver_email)
    started = client.post(f"/api/v1/colleges/{college_id}/trips/{trip_id}/start")
    assert started.status_code == 200, started.text
    qr = started.json()["qr_token"]
    assert started.json()["itinerary"]

    loc = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/location",
        json={"lat": base_lat, "lng": base_lng},
    )
    assert loc.status_code == 200, loc.text
    assert loc.json()["last_lat"] == base_lat

    student_email = f"student0@{domain}"
    _login(client, student_email)
    board = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/board",
        json={"qr_token": qr},
    )
    assert board.status_code == 201, board.text

    alloc = client.get(f"/api/v1/colleges/{college_id}/me/allocation")
    assert alloc.status_code == 200
    assert alloc.json() is not None

    _login(client, driver_email)
    distress = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/distress",
        json={"lat": base_lat, "lng": base_lng},
    )
    assert distress.status_code == 201, distress.text
    realloc_id = distress.json()["emergency_reallocation"]["id"]

    _login(client, admin_email)
    conf = client.post(
        f"/api/v1/colleges/{college_id}/emergency-reallocations/{realloc_id}/confirm"
    )
    assert conf.status_code == 200, conf.text
    assert conf.json()["status"] == "confirmed"

    _login(client, driver_email)
    ended = client.post(f"/api/v1/colleges/{college_id}/trips/{trip_id}/end")
    assert ended.status_code == 200, ended.text
    assert ended.json()["status"] == "ended"
