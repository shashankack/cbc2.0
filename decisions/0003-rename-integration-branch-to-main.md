# ADR 0003 — Integration branch is `main`

## Status

Accepted

## Context

The repo initially used `production` as the integration branch per early planning docs. The owner decided to follow the common GitHub default (`main`) and introduce a separate `production` branch later for release/deploy.

## Decision

1. Rename the integration branch from `production` to `main`.
2. Use `main` as the PR target for day-to-day work.
3. Do not create `production` until a distinct deploy/release workflow is needed.

## Consequences

Update branching docs and SCOPE_DECISIONS. Historical mentions of `production` as the integration branch in archived requirements text are superseded by this ADR and [BRANCHING_AND_RELEASES.md](../docs/development/BRANCHING_AND_RELEASES.md).
