# Setup guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Git
- PostgreSQL 16 (required from Stage 2/3 onward)

## Environment

1. Copy `.env.example` to `.env` at the repo root (never commit `.env`).
2. For Next.js, copy `NEXT_PUBLIC_API_BASE_URL` into `frontend/.env.local`.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Expected: app at `http://localhost:3000`.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Expected: API at `http://localhost:8000` and docs at `http://localhost:8000/docs` once Stage 2 health app exists.

## ML service

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Core allocation must keep working if this service is down.
