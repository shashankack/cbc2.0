# Design overview

**Canonical UI docs:** [docs/ui-ux/DESIGN_SYSTEM.md](../docs/ui-ux/DESIGN_SYSTEM.md) · [docs/ui-ux/COMPONENT_CONTRACTS.md](../docs/ui-ux/COMPONENT_CONTRACTS.md)

## UI system

- Material UI (MUI) only — no Tailwind
- Theme: `frontend/theme/`
- Shared primitives: `frontend/components/`
- Feature UI: `frontend/features/<feature>/components/`
- Map: Leaflet + OpenStreetMap; distinguish selected point vs existing stop
- Label Haversine as straight-line approximation, never “walking distance”

## Portals

1. Student — OTP login, campus, preferences, map pickup, allocation status, QR scan
2. College admin — campuses, fleet/routes, allocation review, disruptions
3. Platform operator — college + domain approval
4. Driver — trip start/end, rotating QR, passenger manifest

## States

Every interactive surface needs loading / empty / error / success.
