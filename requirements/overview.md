# Requirements overview

**Canonical source:** [docs/requirements/PROJECT_REQUIREMENTS.md](../docs/requirements/PROJECT_REQUIREMENTS.md)  
**Scope decisions:** [docs/requirements/SCOPE_DECISIONS.md](../docs/requirements/SCOPE_DECISIONS.md)

## Product

Multi-college bus route and seat allocation platform: buses, routes/stops, ranked student preferences, capacity-aware allocation proposals (admin-confirmed), disruption reassignment proposals, and QR boarding.

## Locked additions

- Multi-college tenancy with `college_id` scoping
- DNS-verified email domains + operator approval
- Campus-specific max walking-distance settings (no global fallback)
- Leaflet map pickup → nearest **existing** stop (no auto-create)
- Optional ML demand forecast; core must work if ML is down

## Roles

Platform operator · College administrator · Student · Driver

## Stack lock

Next.js + TypeScript + MUI (not Tailwind) · FastAPI · PostgreSQL · optional ML service

## Out of scope (defer)

Live GPS, turn-by-turn nav, push/SMS, native apps, production-grade ML claims
