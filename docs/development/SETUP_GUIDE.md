# Setup guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Git
- PostgreSQL 16 (from Stage 3 onward)

## Environment

1. Copy `.env.example` → `.env` (never commit `.env`).
2. Copy `NEXT_PUBLIC_API_BASE_URL` into `frontend/.env.local`.

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
uvicorn app.main:app --reload --port 8000
```

http://localhost:8000/api/v1/health · http://localhost:8000/docs

## Not used

- No `ml-service`
- No `feat/ml-demand-forecast` branch
