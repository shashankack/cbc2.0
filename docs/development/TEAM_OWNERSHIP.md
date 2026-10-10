# Team ownership (conflict-avoidance)

Repo: https://github.com/shashankack/cbc2.0  
Integration branch: `main` (protected — PR only)

## Hard file boundaries

| Role | Branch | May edit | Must not edit |
|------|--------|----------|---------------|
| **Project owner (you)** | short-lived `feat/*` → PR to `main` | `backend/`, `frontend/` **except** `frontend/components/`, root docs you own, integration | `frontend/components/` |
| **UI/UX** | `feat/ui-design-system` | **`frontend/components/` only** | Everything else (`frontend/app`, `theme`, `features`, `lib`, `types`, `backend/`, `ml-service/`, `docs/` unless asked) |
| **ML** | `feat/ml-demand-forecast` | `ml-service/` (+ `docs/ml/` if needed) | `frontend/`, `backend/` core allocation |
| **Demo / QA / docs** | `feat/demo-qa-docs` | `docs/presentation/`, `docs/testing/`, demo scripts under `scripts/`, test fixtures agreed with owner | `frontend/components/`, allocation engine, auth |

## UI handoff rule

1. UI/UX builds reusable MUI components only under `frontend/components/`.
2. Owner (and feature owners) **import** those components into `frontend/app/` and `frontend/features/` — they never modify files inside `frontend/components/`.
3. Shared props/types the UI needs must be agreed in [../ui-ux/COMPONENT_CONTRACTS.md](../ui-ux/COMPONENT_CONTRACTS.md) or `frontend/types/` **via owner PR first**, then UI consumes them.
4. No Tailwind. MUI only.

## Sync rules (avoid merge pain)

1. Start every work session: `git fetch origin` then `git merge origin/main` (or rebase if the team agrees).
2. Keep PRs small and within your ownership table.
3. Never commit on `main` directly.
4. If you need a file outside your zone, open an issue / ask the owner — do not “just edit it”.
5. Prefer adding new files inside your zone over editing shared files.

## Shared contracts (read-only for teammates unless owner updates)

- Product scope: `docs/requirements/PROJECT_REQUIREMENTS.md`
- API: `docs/api/API_CONTRACT.md` + root `openapi.yaml`
- Data model: `docs/architecture/DATA_MODEL.md`
- ML contract: `docs/ml/DEMAND_PREDICTION.md`
- UI contracts: `docs/ui-ux/COMPONENT_CONTRACTS.md`
