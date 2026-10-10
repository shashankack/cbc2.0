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
2. No direct pushes to `main` (branch protection — PR only).
3. Open PRs; merge after review and relevant checks.
4. Never commit secrets or real personal data.
5. Respect [TEAM_OWNERSHIP.md](./TEAM_OWNERSHIP.md) file boundaries to avoid merge conflicts.
6. No force-push on shared branches unless all collaborators agree.
7. Create `production` later when a separate release/deploy line is needed; do not treat it as the day-to-day integration branch until then.

## Teammate onboarding prompts

Copy-paste prompts: [TEAMMATE_PROMPTS.md](./TEAMMATE_PROMPTS.md)

## Recommended GitHub branch protection (`main`)

Enable on GitHub → Settings → Rules → Rulesets (or Branches → Branch protection):

1. Require a pull request before merging
2. Require approvals: at least 1 (optional for solo hackathon; set 0 only if needed)
3. Dismiss stale approvals when new commits are pushed
4. Do not allow bypassing the above settings (except temporary admin emergency)
5. Block force pushes
6. Block deletions
7. Restrict who can push to matching branches: nobody (PR only)

Optional later: require status checks when CI exists.
