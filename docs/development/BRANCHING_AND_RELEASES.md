# Branching and releases

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Integration-ready code; PR merges only |
| `production` | Reserved for a future deploy/release branch (not created yet) |
| `feat/ml-demand-forecast` | ML teammate |
| `feat/ui-design-system` | MUI theme and UI components |
| `feat/demo-qa-docs` | Demo data, tests, docs, slides |
| `feat/<short-description>` | Narrow owner-approved work |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation-only |

## Rules

1. Branch from `main`.
2. No direct pushes to `main` (use PRs once branch protection is enabled).
3. Open PRs; merge after review and relevant checks.
4. Never commit secrets or real personal data.
5. Avoid changing the same files across parallel branches without an agreed contract.
6. No force-push on shared branches unless all collaborators agree.
7. Create `production` later when a separate release/deploy line is needed; do not treat it as the day-to-day integration branch until then.
