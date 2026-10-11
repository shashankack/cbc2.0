# UniTransit — College Bus Route & Seat Allocation

College admins import student locations, build clustered multi-stop bus routes, lock pickups, then run trips with driver QR boarding, live maps, and emergency reallocation.

**Product UI name:** UniTransit  
**Stack lock:** Next.js + TypeScript + MUI · FastAPI + SQLAlchemy + Alembic + PostgreSQL · **no heavy ML**

## What it does

| Role | Capabilities |
|------|----------------|
| **College admin** | Campuses & depot pins, Excel/CSV upload, plan/edit/lock routes, buses & drivers, trip history, boarding counts, bus problems & emergencies |
| **Student** | OTP login, locked pickup/bus, scan driver QR to board, live trip map |
| **Driver** | Start/end trip, show boarding QR, live GPS, distress → replacement plan |
| **Platform operator** | Approve college email domains |

Planning uses DBSCAN-style clustering + rule-based bus assignment (capacity, walk distance). After admin locks a plan, student pick/drop is fixed until the next cycle.

## Repo layout

```text
frontend/   Next.js App Router + MUI (light theme) + Leaflet maps
backend/    FastAPI API, Alembic migrations, PES demo seed scripts
docs/       Requirements, API contract, architecture, setup
```

## Quick start

### 1. Postgres

```powershell
docker compose up -d
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- OpenAPI: http://localhost:8000/docs  
- Health: http://localhost:8000/api/v1/health  
- In development, OTP codes are printed in the uvicorn log (`DEV OTP for …`).

### 3. Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000

`NEXT_PUBLIC_API_BASE_URL` may be:

- `http://localhost:8000/api/v1` — direct to API, or  
- `/api/v1` — same-origin proxy via Next (`next.config.ts` rewrites), useful for phone/ngrok testing with one tunnel.

## PES demo seed (optional)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts\seed_demo_pes.py
```

Then in Admin → Upload students, import  
`backend/scripts/fixtures/pes_ring_road_students.csv`  
(~150 students → expect ~3 multi-stop routes on campus RING).

- Admin: `admin@pes.edu` (OTP in API log)  
- Regenerate CSV: `python scripts/generate_pes_students_csv.py`

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/requirements/PROJECT_REQUIREMENTS.md](docs/requirements/PROJECT_REQUIREMENTS.md) | Authoritative product scope |
| [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md) | API contract |
| [docs/architecture/DATA_MODEL.md](docs/architecture/DATA_MODEL.md) | Schema / relationships |
| [docs/architecture/ROUTING_AND_CLUSTERING.md](docs/architecture/ROUTING_AND_CLUSTERING.md) | Planning rules |
| [docs/development/SETUP_GUIDE.md](docs/development/SETUP_GUIDE.md) | Full setup |
| [docs/development/DOCKER.md](docs/development/DOCKER.md) | Compose / Postgres |
| [docs/ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md](docs/ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md) | UI inventory |

## Branching

- **`main`** — only long-lived branch; **PR required** (no direct push).  
- Short-lived `feat/*` / `fix/*` branches for work; delete after merge.

## Out of scope

Redis, Celery, Kafka, GraphQL, Tailwind, second ORM, or ML services — without explicit owner approval.
