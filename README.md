# College Bus Route & Seat Allocation System

Multi-college bus management and seat allocation platform: routes, preferences, capacity-aware proposals, disruption reassignment, and QR boarding.

## Stack

- Frontend: Next.js, TypeScript, Material UI, Leaflet
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Optional: separate ML demand-prediction service

## Documentation

- Scope: [docs/requirements/PROJECT_REQUIREMENTS.md](docs/requirements/PROJECT_REQUIREMENTS.md)
- Agent rules: [AGENTS.md](AGENTS.md)
- Setup: [docs/development/SETUP_GUIDE.md](docs/development/SETUP_GUIDE.md)
- Branching: [docs/development/BRANCHING_AND_RELEASES.md](docs/development/BRANCHING_AND_RELEASES.md)

## Repository layout

```text
frontend/      Next.js + MUI app
backend/       FastAPI core API
ml-service/    Optional demand prediction
docs/          Requirements, architecture, API, setup
scripts/       Utility scripts
```

## Quick start

See [SETUP_GUIDE.md](docs/development/SETUP_GUIDE.md). This repo is built stage-by-stage for a hackathon prototype.

## Branches

- `production` — integration (PR only)
- `feat/ml-demand-forecast` — ML
- `feat/ui-design-system` — MUI / UI
- `feat/demo-qa-docs` — demo data, tests, docs
