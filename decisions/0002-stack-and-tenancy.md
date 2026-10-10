# ADR 0002 — Stack and multi-college tenancy

## Status

Accepted (updated)

## Decision

- Frontend: Next.js App Router + TypeScript + MUI (not Tailwind)
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Auth: email OTP on operator-approved, DNS-verified college domains
- Tenancy: `college_id` on tenant-owned rows
- Planning: Excel import + clustering + rule-based bus assignment
- Trip day: QR boarding, driver itinerary, driver-phone live location, distress reallocation
- Distance/time MVP: distance + approx time only (no live traffic)
- ML: **none**
- Branches: `main`, `feat/ui-design-system`, `feat/demo-qa-docs`

## Consequences

No Redis/Celery/Kafka/GraphQL/second ORM/Tailwind/ML service without owner approval.
