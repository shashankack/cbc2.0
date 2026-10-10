# Architecture overview

**Canonical docs:** [docs/architecture/SYSTEM_ARCHITECTURE.md](../docs/architecture/SYSTEM_ARCHITECTURE.md) · [docs/architecture/DATA_MODEL.md](../docs/architecture/DATA_MODEL.md) · [docs/api/API_CONTRACT.md](../docs/api/API_CONTRACT.md)

## Runtime

```text
Next.js (4 portals)
    HTTPS REST /api/v1
FastAPI (auth, tenancy, fleet, allocation, trips, audit)
    ├── PostgreSQL (+ PostGIS optional)
    └── ml-service (optional; graceful timeout/fallback)
```

## Authority

- DB + backend business rules are authoritative
- Frontend validation is UX only
- Never trust client-supplied `college_id`, role, or identity for authz
- Allocation is a scarcity-first heuristic → proposals → atomic admin confirm

## Packages

| Path | Role |
|------|------|
| `frontend/` | Next.js + MUI |
| `backend/` | Core FastAPI API |
| `ml-service/` | Optional demand prediction |
| `docs/` | Authoritative project documentation |

## Current stage

Stage 1 scaffold complete (health endpoints, MUI shell). Next: Stage 2 skeleton (CORS, DB config wiring, portal route stubs).
