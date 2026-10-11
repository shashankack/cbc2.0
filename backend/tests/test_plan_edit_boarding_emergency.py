"""Plan edit, boarding edges, disruption + emergency proximity (Docker Postgres)."""

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
from app.services.dns_verify import dns_verify_is_enabled


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


def _bootstrap_college(
    client: TestClient,
) -> tuple[str, str, str, str, str, str]:
    """Returns college_id, campus_id, admin_email, driver_email, domain, operator."""
    slug = f"edit-{uuid.uuid4().hex[:8]}"
    domain = f"{slug}.edu"
    admin_email = f"admin@{domain}"
    driver_email = f"driver@{domain}"
    operator = settings.bootstrap_operator_email

    app_resp = client.post(
        "/api/v1/operator/college-applications",
        json={
            "college_name": "Edit College",
            "slug": slug,
            "applicant_email": admin_email,
            "applicant_full_name": "Edit Admin",
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
        json={
            "name": "Main",
            "code": "MAIN",
            "lat": 12.9716,
            "lng": 77.5946,
        },
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

    return college_id, campus_id, admin_email, driver_email, domain, operator


def test_dns_verify_defaults() -> None:
    prev_flag = settings.dns_verify_enabled
    prev_env = settings.app_env
    try:
        settings.dns_verify_enabled = None
        settings.app_env = "production"
        assert dns_verify_is_enabled() is True
        settings.app_env = "development"
        assert dns_verify_is_enabled() is False
        settings.dns_verify_enabled = False
        settings.app_env = "production"
        assert dns_verify_is_enabled() is False
    finally:
        settings.dns_verify_enabled = prev_flag
        settings.app_env = prev_env


def test_plan_edit_merge_split_reorder_manual(client: TestClient) -> None:
    college_id, campus_id, admin_email, driver_email, domain, _ = _bootstrap_college(
        client
    )
    _login(client, admin_email)

    bus = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01ED1001",
            "capacity": 40,
            "driver_email": driver_email,
        },
    )
    assert bus.status_code == 201, bus.text

    base_lat, base_lng = 12.9716, 77.5946
    rows = ["name,srn,email,lat,lng"]
    for i in range(6):
        rows.append(
            f"Student {i},SRN{i},student{i}@{domain},"
            f"{base_lat + i * 0.00025},{base_lng + i * 0.00025}"
        )
    csv_bytes = ("\n".join(rows)).encode("utf-8")
    imp = client.post(
        f"/api/v1/colleges/{college_id}/imports/students",
        data={"campus_id": str(campus_id)},
        files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert imp.status_code == 201, imp.text
    batch_id = imp.json()["id"]

    plan = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs",
        json={"campus_id": campus_id, "import_batch_id": batch_id},
    )
    assert plan.status_code == 201, plan.text
    run = plan.json()
    run_id = run["id"]
    pickups = [s for s in run["stops"] if s["source"] != "campus"]
    assert len(pickups) >= 1
    route_id = run["routes"][0]["id"]

    manual = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/stops",
        json={
            "name": "Manual Gate",
            "lat": base_lat + 0.002,
            "lng": base_lng + 0.002,
            "route_id": route_id,
        },
    )
    assert manual.status_code == 201, manual.text
    manual_stop = next(s for s in manual.json()["stops"] if s["name"] == "Manual Gate")
    campus_ids_early = {s["id"] for s in manual.json()["stops"] if s["source"] == "campus"}
    route_after = next(r for r in manual.json()["routes"] if r["id"] == route_id)
    assert any(
        rs["stop_id"] == manual_stop["id"]
        for rs in route_after["route_stops"]
        if rs["stop_id"] not in campus_ids_early
    )

    # Assign one student onto the manual stop via split from first pickup if possible.
    source = pickups[0]
    students_on = [
        i["student_id"]
        for i in run["items"]
        if i["stop_id"] == source["id"]
    ]
    if len(students_on) >= 2:
        split = client.post(
            f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/stops/split",
            json={
                "stop_id": source["id"],
                "name": "Split stop",
                "lat": source["lat"] + 0.0005,
                "lng": source["lng"] + 0.0005,
                "student_ids": [students_on[0]],
            },
        )
        assert split.status_code == 200, split.text
        run = split.json()
        pickups = [s for s in run["stops"] if s["source"] != "campus"]

    merge_candidates = [s for s in pickups if s["id"] != manual_stop["id"]]
    if len(merge_candidates) >= 2:
        keep, drop = merge_candidates[0], merge_candidates[1]
        merged = client.post(
            f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/stops/merge",
            json={"keep_stop_id": keep["id"], "merge_stop_id": drop["id"]},
        )
        assert merged.status_code == 200, merged.text

    # Reorder: put manual stop first among pickups.
    detail = client.get(f"/api/v1/colleges/{college_id}/planning-runs/{run_id}")
    assert detail.status_code == 200
    run = detail.json()
    assert any(s["id"] == manual_stop["id"] for s in run["stops"])
    route_id = run["routes"][0]["id"]
    route = run["routes"][0]
    campus_ids = {s["id"] for s in run["stops"] if s["source"] == "campus"}
    pickup_ids = [
        rs["stop_id"]
        for rs in sorted(route["route_stops"], key=lambda x: x["sequence"])
        if rs["stop_id"] not in campus_ids
    ]
    pickup_ids = [manual_stop["id"]] + [
        sid for sid in pickup_ids if sid != manual_stop["id"]
    ]
    reordered = client.put(
        f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/routes/{route_id}/stops",
        json={"stop_ids": pickup_ids},
    )
    assert reordered.status_code == 200, reordered.text
    first_pickup = next(
        rs
        for rs in sorted(
            reordered.json()["routes"][0]["route_stops"], key=lambda x: x["sequence"]
        )
        if rs["stop_id"] not in campus_ids
    )
    assert first_pickup["stop_id"] == manual_stop["id"]


def test_boarding_duplicate_and_emergency_distance(client: TestClient) -> None:
    college_id, campus_id, admin_email, driver_email, domain, _ = _bootstrap_college(
        client
    )
    _login(client, admin_email)

    bus_a = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01EM2001",
            "capacity": 40,
            "driver_email": driver_email,
        },
    )
    assert bus_a.status_code == 201, bus_a.text
    bus_a_id = bus_a.json()["id"]

    # Spare bus for emergency proximity.
    bus_b = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01EM2002",
            "capacity": 40,
        },
    )
    assert bus_b.status_code == 201, bus_b.text

    base_lat, base_lng = 12.9716, 77.5946
    rows = ["name,srn,email,lat,lng"]
    for i in range(4):
        rows.append(
            f"Student {i},SRN{i},student{i}@{domain},"
            f"{base_lat + i * 0.0003},{base_lng + i * 0.0003}"
        )
    csv_bytes = ("\n".join(rows)).encode("utf-8")
    imp = client.post(
        f"/api/v1/colleges/{college_id}/imports/students",
        data={"campus_id": str(campus_id)},
        files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert imp.status_code == 201, imp.text
    batch_id = imp.json()["id"]

    plan = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs",
        json={"campus_id": campus_id, "import_batch_id": batch_id},
    )
    assert plan.status_code == 201, plan.text
    run_id = plan.json()["id"]
    confirm = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/confirm"
    )
    assert confirm.status_code == 200, confirm.text

    _login(client, driver_email)
    started = client.post(f"/api/v1/colleges/{college_id}/me/driver-duty/start")
    assert started.status_code == 200, started.text
    trip_id = started.json()["trip"]["id"]
    qr = started.json()["qr_token"]

    student_email = f"student0@{domain}"
    _login(client, student_email)
    board = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/board",
        json={"qr_token": qr},
    )
    assert board.status_code == 201, board.text
    dup = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/board",
        json={"qr_token": qr},
    )
    assert dup.status_code == 409, dup.text

    active = client.get(f"/api/v1/colleges/{college_id}/me/active-trip")
    assert active.status_code == 200
    assert active.json() is not None
    assert active.json()["id"] == trip_id

    _login(client, driver_email)
    distress = client.post(
        f"/api/v1/colleges/{college_id}/trips/{trip_id}/distress",
        json={"lat": base_lat + 0.01, "lng": base_lng + 0.01},
    )
    assert distress.status_code == 201, distress.text
    plan_json = distress.json()["emergency_reallocation"]["plan_json"]
    replacements = plan_json["replacement_buses"]
    assert replacements
    assert "distance_m_approx" in replacements[0]
    assert isinstance(replacements[0]["distance_m_approx"], (int, float))
    realloc_id = distress.json()["emergency_reallocation"]["id"]

    _login(client, admin_email)
    conf = client.post(
        f"/api/v1/colleges/{college_id}/emergency-reallocations/{realloc_id}/confirm"
    )
    assert conf.status_code == 200, conf.text
    assert conf.json()["status"] == "confirmed"
    assert bus_a_id  # original bus still referenced in setup


def test_disruption_proposal_and_domain_reject(client: TestClient) -> None:
    college_id, campus_id, admin_email, driver_email, domain, operator = (
        _bootstrap_college(client)
    )
    _login(client, admin_email)

    bus = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01DS3001",
            "capacity": 40,
            "driver_email": driver_email,
        },
    )
    assert bus.status_code == 201, bus.text
    bus_id = bus.json()["id"]

    spare = client.post(
        f"/api/v1/colleges/{college_id}/buses",
        json={
            "campus_id": campus_id,
            "registration_number": "KA01DS3002",
            "capacity": 40,
        },
    )
    assert spare.status_code == 201, spare.text

    base_lat, base_lng = 12.9716, 77.5946
    rows = ["name,srn,email,lat,lng"]
    for i in range(4):
        rows.append(
            f"Student {i},SRN{i},student{i}@{domain},"
            f"{base_lat + i * 0.0003},{base_lng + i * 0.0003}"
        )
    csv_bytes = ("\n".join(rows)).encode("utf-8")
    imp = client.post(
        f"/api/v1/colleges/{college_id}/imports/students",
        data={"campus_id": str(campus_id)},
        files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert imp.status_code == 201, imp.text
    plan = client.post(
        f"/api/v1/colleges/{college_id}/planning-runs",
        json={"campus_id": campus_id, "import_batch_id": imp.json()["id"]},
    )
    assert plan.status_code == 201, plan.text
    assert (
        client.post(
            f"/api/v1/colleges/{college_id}/planning-runs/{plan.json()['id']}/confirm"
        ).status_code
        == 200
    )

    disruption = client.post(
        f"/api/v1/colleges/{college_id}/buses/{bus_id}/disruption-proposal"
    )
    assert disruption.status_code == 200, disruption.text
    body = disruption.json()
    assert body.get("emergency_reallocation_id") or body.get("affected_count") is not None
    realloc_id = body.get("emergency_reallocation_id")
    if realloc_id:
        listed = client.get(
            f"/api/v1/colleges/{college_id}/emergency-reallocations?status=proposed"
        )
        assert listed.status_code == 200
        rows_out = listed.json()
        match = next(r for r in rows_out if r["id"] == realloc_id)
        assert match["plan_json"].get("kind") == "disruption"
        if match["plan_json"].get("replacement_buses"):
            assert "distance_m_approx" in match["plan_json"]["replacement_buses"][0]
        conf = client.post(
            f"/api/v1/colleges/{college_id}/emergency-reallocations/{realloc_id}/confirm"
        )
        assert conf.status_code == 200, conf.text

    # Domain reject UX path
    pending_domain = f"reject-{uuid.uuid4().hex[:6]}.edu"
    dom = client.post(
        f"/api/v1/colleges/{college_id}/domains",
        json={"domain": pending_domain},
    )
    assert dom.status_code == 201, dom.text
    domain_id = dom.json()["id"]

    _login(client, operator)
    listed = client.get("/api/v1/operator/domains?status=pending")
    assert listed.status_code == 200
    assert any(d["id"] == domain_id for d in listed.json())
    rejected = client.post(
        f"/api/v1/operator/domains/{domain_id}/reject",
        json={"notes": "TXT missing"},
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "rejected"
