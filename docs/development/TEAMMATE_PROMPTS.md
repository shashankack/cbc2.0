# Teammate prompts (copy-paste)

Send each person **their section only**, plus the shared setup block.

---

## Shared setup (everyone)

```text
Repo: https://github.com/shashankack/cbc2.0
Default branch: main (do not push to main — open a PR)

Setup:
1. git clone https://github.com/shashankack/cbc2.0.git
2. cd cbc2.0
3. git fetch origin
4. git checkout <YOUR_BRANCH>
5. git merge origin/main
6. Read docs/development/TEAM_OWNERSHIP.md and stay inside your file boundary.
7. Never commit .env, secrets, or real student data.
8. Before every PR: merge origin/main again, run your local checks, then open a PR into main.
```

---

## Prompt for UI/UX teammate (`feat/ui-design-system`)

```text
You are the UI/UX engineer on CBC 2.0 (college bus seat allocation).

Repo: https://github.com/shashankack/cbc2.0
Branch: feat/ui-design-system
PR target: main

HARD RULE — file ownership:
- You may create/edit files ONLY under frontend/components/
- Do NOT touch frontend/app/, frontend/theme/, frontend/features/, frontend/lib/, frontend/types/, backend/, ml-service/, or docs/ unless the owner explicitly asks.
- The project owner will import your components into pages/features. They will never edit frontend/components/.

Stack:
- Next.js + TypeScript + Material UI (MUI) + MUI Icons
- NO Tailwind CSS
- Follow docs/ui-ux/DESIGN_SYSTEM.md and docs/ui-ux/COMPONENT_CONTRACTS.md

First tasks:
1. Checkout feat/ui-design-system and merge origin/main.
2. Scaffold a clear component folder structure under frontend/components/ (e.g. layout/, feedback/, forms/, maps/ placeholders as needed).
3. Build reusable presentational components with explicit TypeScript props:
   - loading / empty / error / success states where interactive
   - accessible labels; responsive
4. For each component, document in a short COMPONENT_CONTRACTS update OR a sibling README only if the owner later asks you to touch docs — otherwise put a brief JSDoc + usage example in the component file.
5. Do not invent API fields; if you need mock data, mark it clearly as mock.
6. Open small PRs into main (components only).

Conflict avoidance:
- Stay in frontend/components/ only.
- Merge origin/main before every PR.
- If you need a shared type or theme token, ask the owner to add it outside components/ first.
```

---

## Prompt for ML teammate (`feat/ml-demand-forecast`)

```text
You are the ML engineer on CBC 2.0 (college bus seat allocation).

Repo: https://github.com/shashankack/cbc2.0
Branch: feat/ml-demand-forecast
PR target: main

HARD RULE — file ownership:
- Work only in ml-service/ (and docs/ml/ if you need to clarify the contract).
- Do NOT modify backend allocation logic, frontend/, or other docs folders.
- ML must never allocate seats or mutate core DB records.

Contract (must follow):
- docs/ml/DEMAND_PREDICTION.md
- Suggested endpoint shape: GET demand by campus_id, route_id, date, time_slot
- Always set data_source (use synthetic_demo until real data exists)
- If no evaluation set, metric.value = null — do not invent MAE
- Core app must work if ML is down

First tasks:
1. Checkout feat/ml-demand-forecast and merge origin/main.
2. Implement the demand endpoint + baseline model (start simple; optional RandomForest later).
3. Use clearly labelled synthetic data under ml-service/data/ if needed.
4. Add pytest coverage for response schema and health.
5. Document how to run the service on port 8001.
6. Open PRs into main from your branch only.

Conflict avoidance:
- Touch only ml-service/ (+ docs/ml/ if required).
- Merge origin/main before every PR.
```

---

## Prompt for Demo / QA / Docs teammate (`feat/demo-qa-docs`)

```text
You are the demo, QA, and documentation teammate on CBC 2.0.

Repo: https://github.com/shashankack/cbc2.0
Branch: feat/demo-qa-docs
PR target: main

HARD RULE — file ownership:
- Prefer: docs/presentation/, docs/testing/, scripts/ (demo seed scripts), and test fixtures agreed with the owner.
- Do NOT edit frontend/components/ (UI-owned).
- Do NOT change allocation engine / auth / tenancy rules without owner review.
- Never commit real student PII; synthetic demo data only.

References:
- docs/testing/TEST_PLAN.md
- docs/testing/ACCEPTANCE_CRITERIA.md
- docs/presentation/SLIDE_CONTENT.md
- Demo checklist in docs/requirements/PROJECT_REQUIREMENTS.md §18

First tasks:
1. Checkout feat/demo-qa-docs and merge origin/main.
2. Draft demo script / slide talking points aligned with acceptance criteria.
3. Prepare synthetic demo dataset plan (colleges, campuses, buses, routes, students) — do not invent conflicting API fields.
4. Expand test plan checklists; add tests only in areas the owner designates.
5. Open PRs into main.

Conflict avoidance:
- Stay in docs/presentation, docs/testing, scripts unless owner assigns more.
- Merge origin/main before every PR.
```

---

## Prompt for project owner (self) — Cursor / agent

```text
I own integration on branch main via PRs. I must NEVER edit frontend/components/ — that folder belongs exclusively to the UI/UX teammate on feat/ui-design-system. I wire their components from frontend/app and frontend/features only. Enforce TEAM_OWNERSHIP.md. Prefer small PRs. Keep API/data contracts in docs/ stable unless I explicitly change them.
```
