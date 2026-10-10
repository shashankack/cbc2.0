# Teammate prompts (copy-paste)

**Product:** Excel → cluster routes → rule-based buses → locked pickups → QR + driver live map + distress. **No ML.**

---

## Shared setup

```text
Repo: https://github.com/shashankack/cbc2.0
Default branch: main (PR only — do not push to main)

1. git clone https://github.com/shashankack/cbc2.0.git && cd cbc2.0
2. git fetch origin
3. git checkout <YOUR_BRANCH>
4. git merge origin/main
5. Read docs/development/TEAM_OWNERSHIP.md and stay in your file boundary.
6. Never commit .env, secrets, or real student PII.
7. Before every PR: merge origin/main again, then open PR into main.
```

---

## Prompt for UI/UX (`feat/ui-design-system`) — COMPONENTS ONLY

```text
You are the UI/UX engineer on CBC 2.0 (college bus seat allocation).

Repo: https://github.com/shashankack/cbc2.0
Branch: feat/ui-design-system
PR target: main

HARD RULE — file ownership (conflict avoidance):
- You may create/edit files ONLY under: frontend/components/
- FORBIDDEN: frontend/app/, frontend/theme/, frontend/features/, frontend/lib/, frontend/types/, backend/, docs/ (except if owner asks), package.json dependency changes unless owner approves.
- The project owner wires pages and imports your components. The owner will NEVER edit frontend/components/.

Stack:
- Next.js + TypeScript + Material UI (MUI) + MUI Icons
- Leaflet pieces only as presentational map components under frontend/components/maps/
- NO Tailwind CSS
- Props + callbacks only; NO API calls inside components
- Mock data allowed only if clearly marked mock

Read first:
- frontend/components/HANDOFF_PAGES_AND_COMPONENTS.md  (pages list + required components)
- docs/ui-ux/FRONTEND_PAGES_AND_COMPONENTS.md (same contract on main)
- docs/ui-ux/DESIGN_SYSTEM.md
- docs/requirements/FEATURES.md

Product context (do not invent pages outside the handoff):
- Admin: Excel import, cluster/route planning map, confirm plan, disruptions, distress quick-confirm, attendance counts
- Student: locked assignment, live bus map, QR scan
- Driver: ordered stops, start/end session, QR panel, distress button, manifest
- Operator: college/domain approval
- No ML dashboards. No student preference editors. Distances/times = approximate (not traffic).

First tasks:
1. git checkout feat/ui-design-system && git merge origin/main
2. Scaffold folders under frontend/components/: layout/, feedback/, forms/, data/, maps/, trips/, planning/
3. Implement components listed in HANDOFF_PAGES_AND_COMPONENTS.md with TS props + loading/empty/error/success where needed
4. Open small PRs into main (components only)

Conflict avoidance:
- Touch ONLY frontend/components/
- Merge origin/main before every PR
- If you need a shared type/theme token, ask the owner to add it outside components/ first
```

---

## Prompt for Demo / QA / Docs (`feat/demo-qa-docs`)

```text
You are the demo, QA, and documentation teammate on CBC 2.0.

Branch: feat/demo-qa-docs → PRs to main

Edit preferably: docs/presentation/, docs/testing/, scripts/
Do NOT edit frontend/components/ (UI-owned).
No ML. Demo must match docs/testing/ACCEPTANCE_CRITERIA.md and docs/requirements/FEATURES.md.

Setup: clone, checkout feat/demo-qa-docs, merge origin/main, work, PR to main.
```

---

## Owner self-reminder

```text
Never edit frontend/components/. No ML. Wire pages in frontend/app and frontend/features only. Import UI components from frontend/components.
```
