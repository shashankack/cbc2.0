"""End-to-end demo: seed → import → plan → confirm → drive → board.

Usage (from backend/, venv active, Postgres up):
  python scripts/demo_dry_run.py
"""

from __future__ import annotations

import importlib.util
import io
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from app.core.config import settings
from app.db import session as db_session
from app.main import app

_SEED_PATH = Path(__file__).resolve().parent / "seed_demo_pes.py"
_spec = importlib.util.spec_from_file_location("seed_demo_pes", _SEED_PATH)
assert _spec and _spec.loader
seed = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(seed)

ADMIN_EMAIL = seed.ADMIN_EMAIL
DRIVER_EMAIL = "driver@pes.edu"
FIXTURE_CSV = seed.FIXTURE_CSV
_login = seed._login


def main() -> int:
    settings.otp_request_cooldown_seconds = 0
    if not FIXTURE_CSV.is_file():
        print(f"Missing fixture CSV: {FIXTURE_CSV}")
        return 1

    print("=== 1) Seed PES college / RING / buses / drivers ===")
    seed.main()

    db_session.get_engine()
    with TestClient(app) as client:
        print("=== 2) Admin login + import students CSV ===")
        _login(client, ADMIN_EMAIL)

        me = client.get("/api/v1/auth/me")
        assert me.status_code == 200, me.text
        memberships = me.json().get("memberships") or []
        college_id = next(
            (m["college_id"] for m in memberships if m.get("role") == "college_admin"),
            None,
        )
        assert college_id, me.text

        campuses = client.get(f"/api/v1/colleges/{college_id}/campuses")
        assert campuses.status_code == 200, campuses.text
        campus = next(c for c in campuses.json() if c["code"] == "RING")
        campus_id = campus["id"]

        csv_bytes = FIXTURE_CSV.read_bytes()
        imp = client.post(
            f"/api/v1/colleges/{college_id}/imports/students",
            data={"campus_id": str(campus_id)},
            files={"file": ("students.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert imp.status_code == 201, imp.text
        batch = imp.json()
        print(
            f"  Import batch {batch['id'][:8]}… valid={batch.get('valid_count')} "
            f"invalid={batch.get('invalid_count')}"
        )
        assert batch.get("valid_count", 0) > 0

        print("=== 3) Run planning proposal (may take a bit — reverse-geocode names) ===")
        plan = client.post(
            f"/api/v1/colleges/{college_id}/planning-runs",
            json={"campus_id": campus_id, "import_batch_id": batch["id"]},
        )
        assert plan.status_code == 201, plan.text
        run = plan.json()
        run_id = run["id"]
        print(
            f"  Run {run_id[:8]}… status={run['status']} "
            f"routes={len(run['routes'])} stops={len(run['stops'])} "
            f"items={len(run['items'])}"
        )
        assert run["status"] == "proposed"
        assert len(run["routes"]) >= 1

        review = [i for i in run["items"] if i["status"] == "needs_admin_review"]
        confirmable = [
            i
            for i in run["items"]
            if i["status"] in ("proposed", "snapped")
            and i.get("stop_id")
            and i.get("route_id")
            and i.get("bus_id")
        ]
        print(
            f"  Confirmable={len(confirmable)} · left in admin review={len(review)} "
            "(review leftovers stay unlocked; confirm packs only assigned seats)"
        )
        assert confirmable, "planning produced no confirmable assignments"

        print("=== 4) Confirm plan (lock pickups) ===")
        conf = client.post(
            f"/api/v1/colleges/{college_id}/planning-runs/{run_id}/confirm"
        )
        assert conf.status_code == 200, conf.text
        assert conf.json()["status"] == "confirmed"
        print("  Confirmed.")

        print("=== 5) Driver start duty (QR session) ===")
        _login(client, DRIVER_EMAIL)
        duty = client.get(f"/api/v1/colleges/{college_id}/me/driver-duty")
        assert duty.status_code == 200, duty.text
        assert duty.json().get("can_start") is True, duty.text
        started = client.post(f"/api/v1/colleges/{college_id}/me/driver-duty/start")
        assert started.status_code == 200, started.text
        body = started.json()
        trip_id = body["trip"]["id"]
        qr_token = body["qr_token"]
        payload = f"CBC1:{trip_id}|{qr_token}"
        bus_reg = duty.json().get("bus_registration")
        print(f"  Trip {trip_id}")
        print(f"  Bus  {bus_reg}")
        print(f"  Paste QR (non-Chromium fallback): {payload}")

        depot_lat = float(campus.get("lat") or 12.93424)
        depot_lng = float(campus.get("lng") or 77.53432)
        loc = client.post(
            f"/api/v1/colleges/{college_id}/trips/{trip_id}/location",
            json={"lat": depot_lat, "lng": depot_lng},
        )
        assert loc.status_code == 200, loc.text

        print("=== 6) Student board with QR token ===")
        _login(client, ADMIN_EMAIL)
        students = client.get(f"/api/v1/colleges/{college_id}/students")
        assert students.status_code == 200, students.text
        student_emails = [s["email"] for s in students.json() if s.get("email")]
        assert student_emails, "no student emails"

        boarded_email = None
        last_err = ""
        for email in student_emails:
            _login(client, email)
            board = client.post(
                f"/api/v1/colleges/{college_id}/trips/{trip_id}/board",
                json={"qr_token": qr_token},
            )
            if board.status_code == 201:
                boarded_email = email
                print(f"  Boarded OK as {email}")
                break
            last_err = f"{board.status_code} {board.text}"
        assert boarded_email, f"no student could board this trip: {last_err}"

        dup = client.post(
            f"/api/v1/colleges/{college_id}/trips/{trip_id}/board",
            json={"qr_token": qr_token},
        )
        assert dup.status_code == 409, dup.text
        print("  Duplicate boarding correctly rejected (409).")

        print()
        print("Demo dry-run PASSED.")
        print(f"  College:  {college_id}")
        print(f"  Campus:   RING ({campus_id})")
        print(f"  Trip:     {trip_id}")
        print(f"  Bus:      {bus_reg}")
        print(f"  Admin:    {ADMIN_EMAIL}")
        print(f"  Driver:   {DRIVER_EMAIL}")
        print(f"  Student:  {boarded_email}")
        print(f"  Paste QR: {payload}")
        print()
        print("UI check: Student -> Board")
        print("  Chromium: Start camera and scan driver QR")
        print("  Other browsers: paste CBC1 payload above")
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"FAILED: {exc}")
        raise SystemExit(1) from exc
