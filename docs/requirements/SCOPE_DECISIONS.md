# Scope decisions

| Decision | Choice | Date |
|----------|--------|------|
| UI library | MUI (not Tailwind) | 2026-10-10 |
| Auth | Email OTP on verified college domains | 2026-10-10 |
| Allocation | Deterministic scarcity-first heuristic; admin confirm | 2026-10-10 |
| Distance MVP | Haversine (label as straight-line, not walking) | 2026-10-10 |
| ML | Optional separate service; synthetic demo OK if labelled | 2026-10-10 |
| Branches | `main` (integration); `production` reserved for later deploy; + `feat/ml-demand-forecast`, `feat/ui-design-system`, `feat/demo-qa-docs` | 2026-10-10 |
| API prefix | `/api/v1`, JSON, `snake_case` | 2026-10-10 |
