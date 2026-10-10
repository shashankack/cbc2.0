# College Bus Route & Seat Allocation System

Admin Excel import → cluster stops/routes → rule-based buses → locked pickups → driver itinerary, QR attendance, live bus map, distress reallocation.

## Stack

- Frontend: Next.js, TypeScript, Material UI, Leaflet
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **No ML.** Maps: OSM (+ optional OSRM). Planning: distance + approx time (no traffic).

## Docs

- Features: [docs/requirements/FEATURES.md](docs/requirements/FEATURES.md)
- Requirements: [docs/requirements/PROJECT_REQUIREMENTS.md](docs/requirements/PROJECT_REQUIREMENTS.md)
- UI pages/components: [docs/ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md](docs/ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md)
- Ownership: [docs/development/TEAM_OWNERSHIP.md](docs/development/TEAM_OWNERSHIP.md)
- Teammate prompts: [docs/development/TEAMMATE_PROMPTS.md](docs/development/TEAMMATE_PROMPTS.md)
- Setup: [docs/development/SETUP_GUIDE.md](docs/development/SETUP_GUIDE.md)

## Layout

```text
frontend/   Next.js + MUI (UI teammate owns frontend/components only)
backend/    FastAPI core API
docs/       Requirements, architecture, API, setup
scripts/    Utility scripts
```

## Quick start

```powershell
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Branches

- `main` — integration (PR only)
- `dev` — owner implementation (PR into `main`)
- `feat/ui-design-system` — components only
- `feat/demo-qa-docs` — demo/docs/QA
