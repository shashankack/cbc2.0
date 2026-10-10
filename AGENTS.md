# Agent instructions — College Bus Route & Seat Allocation System

## Human-operated coding mode

**Default:** generate code and instructions; prefer not applying changes unless the project owner explicitly asks you to create or edit files.

1. Prefer providing exact file paths and complete proposed contents when in planning mode.
2. When the owner asks to create, scaffold, or apply changes, follow that instruction for the agreed stage only.
3. Do not commit, push, merge, or force-push unless the owner explicitly requests it.
4. Never claim that a command, test, build, migration or deployment succeeded unless results are available.
5. Work in small stages. Do not dump an entire application in one response.
6. End each stage with a verification checklist when handing off to the owner.
7. When asked to implement a feature, first list the files that would change and why, then implement only the agreed stage.
8. If a requested change affects an API contract, schema, shared component or dependency, call it out before writing code.
9. Do not silently change the agreed stack, scope, endpoint names, field names, enums, role names or branch strategy.
10. If requirements conflict or are missing, identify the conflict and ask one concise clarification rather than inventing behavior.
11. Do not include fake credentials, real secrets or actual personal data in examples.

## Cross-agent synchronization

1. `docs/requirements/PROJECT_REQUIREMENTS.md` is the authoritative product scope.
2. `docs/api/API_CONTRACT.md` is the authoritative API contract once agreed.
3. `docs/architecture/DATA_MODEL.md` is the authoritative schema/relationship contract once agreed.
4. Store supporting docs under the correct `docs/` subfolder.
5. Update existing docs rather than duplicating them.
6. Use `UPPER_SNAKE_CASE.md` filenames; cross-link with relative Markdown links.
7. Agent-generated docs are proposals until the project owner reviews them.
8. Shared enums, field names and response types must not be independently redefined.
9. UI agents may use mock data only when marked as mock; match agreed API types.
10. There is no ML agent or ML service — do not implement ML.
11. The UI/UX agent must use MUI, must not add Tailwind, and may edit only `frontend/components/`.
12. Contract changes need impact analysis and owner approval.
13. Stay on the assigned branch; do not touch unrelated modules.
14. If a dependency interface is missing, define a small mock contract and document it.

## Required response format

1. Stage and goal
2. Assumptions / unresolved questions
3. Files to create or change
4. Code or document contents (or applied changes summary)
5. Commands for the human to run (when applicable)
6. Expected output
7. Manual verification checklist
8. Tests to add or run
9. Integration/branch notes
10. Known limitations and next stage

## Stack lock

- Frontend: Next.js + TypeScript + MUI (not Tailwind)
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- **No heavy ML models.** QR boarding/attendance is in scope. Planning uses Excel import + clustering + rule-based bus assignment.
- Student pick/drop is locked after admin confirms a planning batch.
- Do not introduce Redis, Celery, Kafka, GraphQL, a second ORM, or another UI framework without owner approval.
- UI/UX edits only `frontend/components/`; owner must not edit that folder.

<!-- BEGIN ADCE -->
## ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run `adce status`.
2. Run `adce context --task "<current task>" --format markdown`.
3. Read sections in order: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT.
4. Do not trust CAUTION artifacts over TRUST ORDER / VERIFIED sources.
5. Run `adce conflicts` (and `adce analyze` if available) when CAUTION is non-empty.
6. Set known trust with `adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING`.
7. Run `adce structure` (default profile: software-eng). Replace stub content in `requirements/`, `design/`, `architecture/`, `decisions/`, `security/`, `schemas/`, `docs/testing/`, and API specs with real project knowledge when those files are still stubs or SUGGESTED.
8. Developers: fill those artifacts yourself, or prompt the coding agent to draft them from the current task/codebase, then review and verify (`adce artifact verify`).
<!-- END ADCE -->
