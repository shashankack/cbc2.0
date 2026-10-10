# Branching and releases

## Branches

| Branch | Purpose |
|--------|---------|
| `production` | Integration-ready code; PR merges only |
| `feat/ml-demand-forecast` | ML teammate |
| `feat/ui-design-system` | MUI theme and UI components |
| `feat/demo-qa-docs` | Demo data, tests, docs, slides |
| `feat/<short-description>` | Narrow owner-approved work |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation-only |

## Rules

1. Branch from `production`.
2. No direct pushes to `production`.
3. Open PRs; merge after review and relevant checks.
4. Never commit secrets or real personal data.
5. Avoid changing the same files across parallel branches without an agreed contract.
6. No force-push on shared branches unless all collaborators agree.
