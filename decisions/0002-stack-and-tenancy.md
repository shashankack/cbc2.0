# ADR 0002 — Stack and multi-college tenancy

## Status

Accepted

## Context

24-hour hackathon; need a simple, secure multi-tenant prototype.

## Decision

- Frontend: Next.js App Router + TypeScript + MUI (not Tailwind)
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Auth: email OTP on operator-approved, DNS-verified college domains
- Tenancy: every tenant-owned row scoped by `college_id`; enforce at DB where practical
- Distance MVP: Haversine straight-line; campus-specific max distance from DB only
- ML: separate optional service; never overrides hard allocation constraints
- Branches: `main` integration; `production` reserved for a future deploy line; teammate branches `feat/ml-demand-forecast`, `feat/ui-design-system`, `feat/demo-qa-docs`

## Consequences

No Redis/Celery/Kafka/GraphQL/second ORM/Tailwind without owner approval. Allocation confirmation must be transactional and atomic.
