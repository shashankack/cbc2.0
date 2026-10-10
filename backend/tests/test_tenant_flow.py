"""Integration tests for tenant + auth happy path (needs Docker Postgres)."""

from __future__ import annotations

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


def _latest_otp_code(email: str) -> str:
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
        # Rewrite hash to a known test code (never log real OTP in assertions).
        code = "123456"
        challenge.code_hash = hash_otp_code(email, code)
        db.commit()
        return code
    finally:
        db.close()


def test_ready_database_true(client: TestClient) -> None:
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    assert response.json()["database"] is True


def test_operator_onboarding_and_campus(client: TestClient) -> None:
    slug = f"demo-{uuid.uuid4().hex[:8]}"
    applicant = f"admin@{slug}.edu"
    operator = settings.bootstrap_operator_email

    app_resp = client.post(
        "/api/v1/operator/college-applications",
        json={
            "college_name": "Demo College",
            "slug": slug,
            "applicant_email": applicant,
            "applicant_full_name": "Ada Admin",
        },
    )
    assert app_resp.status_code == 201, app_resp.text
    application_id = app_resp.json()["id"]

    # Login as bootstrap operator
    req = client.post("/api/v1/auth/otp/request", json={"email": operator})
    assert req.status_code == 200, req.text
    code = _latest_otp_code(operator)
    verify = client.post(
        "/api/v1/auth/otp/verify",
        json={"email": operator, "code": code},
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["is_platform_operator"] is True

    approve = client.post(
        f"/api/v1/operator/college-applications/{application_id}/approve",
        json={},
    )
    assert approve.status_code == 200, approve.text
    college_id = approve.json()["id"]

    # Login as college admin (applicant)
    req2 = client.post("/api/v1/auth/otp/request", json={"email": applicant})
    assert req2.status_code == 200
    admin_code = _latest_otp_code(applicant)
    verify2 = client.post(
        "/api/v1/auth/otp/verify",
        json={"email": applicant, "code": admin_code},
    )
    assert verify2.status_code == 200, verify2.text
    memberships = verify2.json()["memberships"]
    assert any(m["college_id"] == college_id for m in memberships)

    domain_resp = client.post(
        f"/api/v1/colleges/{college_id}/domains",
        json={"domain": f"{slug}.edu"},
    )
    assert domain_resp.status_code == 201, domain_resp.text
    domain_id = domain_resp.json()["id"]
    assert domain_resp.json()["dns_txt_token"].startswith("cbc-domain-verify=")

    # Switch back to operator cookie by re-login
    req3 = client.post("/api/v1/auth/otp/request", json={"email": operator})
    assert req3.status_code == 200
    op_code = _latest_otp_code(operator)
    client.post(
        "/api/v1/auth/otp/verify",
        json={"email": operator, "code": op_code},
    )
    domain_ok = client.post(f"/api/v1/operator/domains/{domain_id}/approve")
    assert domain_ok.status_code == 200, domain_ok.text
    assert domain_ok.json()["status"] == "active"

    # Admin again for campus
    req4 = client.post("/api/v1/auth/otp/request", json={"email": applicant})
    admin_code2 = _latest_otp_code(applicant)
    client.post(
        "/api/v1/auth/otp/verify",
        json={"email": applicant, "code": admin_code2},
    )

    campus = client.post(
        f"/api/v1/colleges/{college_id}/campuses",
        json={"name": "Main", "code": "MAIN"},
    )
    assert campus.status_code == 201, campus.text
    campus_id = campus.json()["id"]

    settings_resp = client.put(
        f"/api/v1/colleges/{college_id}/campuses/{campus_id}/settings",
        json={
            "max_walk_to_stop_m": 400,
            "cluster_eps_m": 250,
            "cluster_min_samples": 3,
            "min_students_per_route": 10,
        },
    )
    assert settings_resp.status_code == 200, settings_resp.text
    assert settings_resp.json()["max_walk_to_stop_m"] == 400

    listed = client.get(f"/api/v1/colleges/{college_id}/campuses")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["settings"]["cluster_eps_m"] == 250
