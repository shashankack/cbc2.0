# Setup guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Git
- Docker Desktop (for Postgres) — see [DOCKER.md](./DOCKER.md)

## Environment

1. Copy `.env.example` → `.env` at repo root (optional reference).
2. Copy `backend/.env.example` → `backend/.env`.
3. Copy `NEXT_PUBLIC_API_BASE_URL` into `frontend/.env.local`.

Default local DB URL (matches Docker Compose):

```env
DATABASE_URL=postgresql+pg8000://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/college_bus
```

## Database (Docker)

```powershell
cd c:\crucifer\CBC
docker compose up -d
docker compose ps
```

Details: [DOCKER.md](./DOCKER.md).

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

http://localhost:3000

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Bootstrap operator: set `BOOTSTRAP_OPERATOR_EMAIL` in `backend/.env`, then request/verify OTP for that email. In development, OTP codes are printed in the API process log.

- Health: http://localhost:8000/api/v1/health
- Ready: http://localhost:8000/api/v1/ready
- OpenAPI: http://localhost:8000/docs

API contract: [../api/API_CONTRACT.md](../api/API_CONTRACT.md)

## Not used

- No `ml-service`
- No `feat/ml-demand-forecast` branch
