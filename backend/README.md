# Backend

FastAPI + SQLAlchemy + Alembic + PostgreSQL.

## Local run

```powershell
# From repo root — start Postgres
docker compose up -d

cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/api/v1/health
- Ready: http://localhost:8000/api/v1/ready
- OpenAPI: http://localhost:8000/docs

On Windows, prefer `postgresql+pg8000://…` if App Control blocks `psycopg` DLLs.

## Tests

```powershell
pytest -q
```

## Implemented now

Tenant foundation + OTP session auth + operator college onboarding + campuses/settings.
See `docs/api/API_CONTRACT.md`.
