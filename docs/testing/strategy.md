# Testing strategy

**Canonical plans:** [TEST_PLAN.md](./TEST_PLAN.md) · [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md)

## Approach

- Backend: Pytest + HTTPX/TestClient against FastAPI
- Frontend: build/lint as gate; component tests later if time allows
- Prefer testing authorization, tenancy, capacity, and boarding uniqueness early
- ML: contract tests + prove core works when ML is unreachable

## Current automated tests

- `backend/tests/test_health.py`
- `ml-service/tests/test_health.py`

## Priority suites (by stage)

1. Auth/OTP + domain gates
2. Campus settings + stop matching boundaries
3. Allocation capacity + atomic confirm
4. Disruption proposals (no silent reassignment)
5. QR boarding duplicates / expiry / wrong trip
