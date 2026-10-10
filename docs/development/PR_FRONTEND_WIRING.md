# PR draft — `feat/frontend-wiring` → `main`

Create when `gh auth login` is complete:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" pr create --base main --head feat/frontend-wiring --title "feat: UniTransit frontend wiring + fleet/trips backend" --body-file docs/development/PR_FRONTEND_WIRING.md
```

## Summary

- Backend: Docker Postgres, tenant OTP auth, operator onboarding, campuses/domains, fleet, Excel import, DBSCAN planning, trips/QR/GPS/distress
- Frontend: UniTransit light/dark theme, portal shells, API-wired operator/admin/student/driver flows
- Maps via client-only dynamic import (Leaflet SSR-safe)
- Demo seed script for `pes.edu` college; GET trips list; admin emergency confirm; richer student allocation labels

## Test plan

- [ ] `docker compose up -d` + `alembic upgrade head` + `uvicorn` + `npm run dev`
- [ ] Operator OTP → approve college; admin campuses/domain/settings
- [ ] Import students → planning run → confirm (map renders)
- [ ] Driver opens scheduled trip → start → QR + itinerary map
- [ ] Student assignment shows stop/route/bus names; live map + board
- [ ] Distress → admin `/admin/emergency` confirm
- [ ] Dark mode: map tiles readable; no `/driver` instant validation error

## Demo accounts (local seed)

| Role | Email |
|------|--------|
| Operator | `operator@example.com` |
| Admin | `admin@demo-12006554.edu` |
| Driver | `driver@pes.edu` |
| Student | `alice@pes.edu` |

OTP codes print in the API log (`DEV OTP for …`).
