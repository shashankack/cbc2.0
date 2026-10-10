# Branching and releases

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Integration (PR only) |
| `production` | Reserved for future deploy (not created yet) |
| `feat/ui-design-system` | UI/UX — `frontend/components/` only |
| `feat/demo-qa-docs` | Demo data, tests, docs, slides |
| `feat/<short-description>` | Narrow owner-approved work |
| `fix/<short-description>` | Bug fixes |

**Deleted / do not use:** `feat/ml-demand-forecast`

## Rules

1. Branch from `main`.
2. No direct pushes to `main`.
3. Open PRs; merge after review.
4. Never commit secrets or real PII.
5. Respect [TEAM_OWNERSHIP.md](./TEAM_OWNERSHIP.md).
6. No force-push on shared branches unless all agree.

## Teammate prompts

[TEAMMATE_PROMPTS.md](./TEAMMATE_PROMPTS.md)

## Branch protection (`main`)

Require PR before merge; block force pushes; block deletions.
