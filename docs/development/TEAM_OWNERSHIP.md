# Team ownership (conflict-avoidance)

Repo: https://github.com/shashankack/cbc2.0  
Integration branch: `main` (PR only)

## Hard file boundaries

| Role | Branch | May edit | Must not edit |
|------|--------|----------|---------------|
| **Project owner** | short-lived `feat/*` → PR to `main` | `backend/`, `frontend/` **except** `frontend/components/`, docs they own | `frontend/components/` |
| **UI/UX** | `feat/ui-design-system` | **`frontend/components/` only** | Everything else |
| **Demo / QA / docs** | `feat/demo-qa-docs` | `docs/presentation/`, `docs/testing/`, `scripts/` | `frontend/components/`, core allocation/auth |

## Removed

- `feat/ml-demand-forecast` — **deleted**. No ML work.
- `ml-service/` — not part of the product.

## UI handoff

- Pages + component inventory: [../ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md](../ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md)
- Copy on UI branch for teammate: `frontend/components/HANDOFF_PAGES_AND_COMPONENTS.md`
- Prompts: [TEAMMATE_PROMPTS.md](./TEAMMATE_PROMPTS.md)

## Sync rules

1. `git fetch origin` then `git merge origin/main` each session.
2. Small PRs inside your ownership table.
3. Never commit on `main` directly.
4. Need a file outside your zone? Ask the owner.
