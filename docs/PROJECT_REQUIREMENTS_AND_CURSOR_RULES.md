# College Bus Route & Seat Allocation System
## Project Requirements, Repository Plan, and Cursor Agent Instructions

**Project type:** 24-hour hackathon prototype  
**Status:** Scope locked for implementation  
**Primary owner:** Core application development and integration  
**Frontend UI library:** Material UI (MUI), not Tailwind CSS

---

## 1. Project summary

Build a web-based platform that helps colleges manage bus routes, stops, seat capacity, student route preferences, seat allocation, bus disruptions, and boarding confirmation.

The platform supports multiple colleges. Each college has isolated data, its own administrators, one or more campuses, buses, routes, stops, and campus-specific pickup-distance settings. Students sign in using email OTP on a domain configured and approved for their college.

The core allocation engine is deterministic and rule-based. A separate optional machine-learning module forecasts demand and possible seat shortages. The core application must continue to function if the ML service is unavailable.

### One-line summary

A multi-college bus management and seat allocation platform that matches students to eligible routes and available seats, with administrator-reviewed allocations and QR-based boarding confirmation.

### Scope note

The organizers' original problem statement must be copied verbatim from the official source into the presentation. The uploaded CBC 2.0 PPTX is a presentation template, not the original problem statement. Do not claim that every enhancement in this document was explicitly required by the organizers.

---

## 2. Locked feature scope

### 2.1 Core problem features

1. **Bus management**
   - Create and manage buses.
   - Store registration number, capacity, campus, and operational status.
   - Mark a bus unavailable when required.

2. **Route and stop management**
   - Create routes and define ordered stops.
   - Assign one bus to one route for the MVP.
   - Associate routes and stops with the correct college and campus.

3. **Student registration and route preferences**
   - Students sign in using email OTP.
   - Students choose their campus from the campus list configured by their college.
   - Students can submit multiple ranked route/stop preferences.
   - Students can choose a predefined stop or select a pickup point on a map.

4. **Capacity-aware seat allocation**
   - Generate a batch of proposed allocations.
   - Filter out ineligible routes/stops before scoring.
   - Respect bus capacity and route coverage.
   - Prioritize students with fewer eligible choices, then consider preference rank, proximity, and available capacity.
   - This is a heuristic; do not claim it always finds a globally optimal assignment.

5. **Bus disruption and reassignment**
   - Detect or record a bus becoming unavailable.
   - Generate a reassignment proposal where possible.
   - Require administrator approval before changing active assignments.
   - Mark impacted students as disrupted while the proposal is pending.
   - Never silently move students to a different bus or route.

### 2.2 Locked additions

6. **Multi-college platform**
   - A shared application supports multiple college workspaces.
   - Every tenant-owned record must be scoped to a college.
   - Platform operator reviews and approves new college applications and appoints the initial college administrator.

7. **Verified email domains**
   - College administrators can request domain registration.
   - Domain ownership must be proven through a DNS TXT record.
   - Platform operator approval is also required.
   - Match exact registered domains. Subdomains must be registered separately.
   - Email-domain verification proves control of the mailbox/domain, not student enrollment. Do not claim it independently proves a person is a student.

8. **Campus-specific configuration**
   - A college can have multiple campuses.
   - Each campus has its own maximum walking-distance setting.
   - There is no global fallback distance.
   - An active campus must have a valid setting before allocation can run.
   - The setting is read from the database; clients cannot override it per request.

9. **Map-based pickup matching**
   - Use Leaflet with OpenStreetMap tiles for the map UI.
   - For a map-selected point, find the nearest eligible existing stop in the selected campus.
   - Do not create stops automatically from student map clicks.
   - The stop must be covered by an eligible route and satisfy capacity/availability rules.
   - Haversine distance may be used for MVP proximity filtering, but label it as straight-line approximation, not actual walking distance.
   - If actual pedestrian distance is required, integrate a pedestrian routing provider separately.

10. **Batch allocation review**
    - All new batch allocations are proposals until a college administrator confirms them.
    - Confirmation must revalidate capacities, bus availability, and relevant route versions.
    - Commit confirmation atomically. If validation fails, do not partially apply the batch.
    - Existing active allocations must remain unchanged if a proposed batch cannot be safely committed.

11. **QR boarding confirmation**
    - An authorized driver starts an active trip.
    - A trip-specific, short-lived QR token is displayed on the driver's panel.
    - The authenticated student scans the QR to request boarding confirmation.
    - Backend derives student identity from the authenticated session; never trust a client-supplied student ID.
    - Validate active trip, token expiry, token association, student's confirmed allocation, and tenant scope.
    - Store only a hash of the QR secret/token where applicable; do not place personal information in the QR.
    - Prevent duplicate boarding records with a database uniqueness constraint.
    - A rotating/short-lived QR reduces sharing but does not guarantee proof of physical presence.
    - Do not implement student GPS tracking.

12. **Optional ML demand prediction**
    - Separate module predicts expected demand by campus, route, and time slot.
    - Use real historical data only if it is legitimately available; otherwise use clearly labelled synthetic data.
    - Start with a simple baseline; optionally compare a scikit-learn model such as RandomForestRegressor.
    - Report evaluation metrics such as MAE when a valid evaluation set exists.
    - Label synthetic-data predictions as demonstrations; do not claim real-world predictive accuracy.
    - ML forecasts must never override hard allocation constraints.
    - Core allocation must work if the ML service is unavailable.

### 2.3 Defer unless core is complete

- Advanced multi-vehicle route optimization.
- Turn-by-turn navigation.
- Live bus GPS tracking.
- Student location tracking/geofencing.
- Traffic prediction.
- Push/SMS notification infrastructure.
- Native mobile applications.
- Sophisticated ML models or claims of production-grade prediction accuracy.

---

## 3. User roles and permissions

### Platform operator
- Review and approve/reject college applications.
- Appoint the initial college administrator.
- Review and approve/reject college domain registrations after DNS verification.
- Access platform-level records only through explicitly authorized operator functionality.

### College administrator
- Manage their college's campuses, buses, routes, stops, and campus settings.
- Configure the maximum walking distance independently for each campus.
- Review and confirm allocation batches.
- Approve/reject reassignment proposals.
- View relevant operational dashboards and audit records.

### Student
- Authenticate through email OTP on an approved domain.
- Select an available campus.
- Submit and update ranked route/stop preferences.
- View allocation status and relevant route/stop information.
- Scan the driver's trip QR to request boarding confirmation.

### Driver
- Access only trips assigned to them.
- Start/end an authorized trip.
- Display or refresh a valid trip QR.
- View the trip passenger manifest and boarding statuses.

### ML service
- Read only the data necessary for demand forecasting.
- Return predictions and metadata.
- Must not allocate seats, change records, or bypass authorization.

---

## 4. Final technology stack

### Frontend
- Next.js with TypeScript and App Router.
- React.
- Material UI (MUI) for components and theming.
- MUI Icons.
- Leaflet and React Leaflet for maps.
- A QR scanning library compatible with the chosen browser/mobile-camera workflow.
- Use MUI consistently; do not add Tailwind CSS unless the project owner explicitly changes this decision.

### Core backend
- Python + FastAPI.
- Pydantic for request/response validation.
- SQLAlchemy for ORM/database access.
- Alembic for database migrations.
- Pytest + HTTPX for tests.

### Database and geospatial
- PostgreSQL.
- PostGIS if supported by the selected host and development environment.
- Haversine calculation can be used as a simple MVP approximation; do not label straight-line distance as walking distance.

### ML service
- Python.
- Pandas and NumPy.
- scikit-learn.
- Keep model code separate from the core allocation engine.

### Supporting tools
- Git and GitHub.
- Postman or equivalent API client.
- Figma for design handoff.
- SMTP or a transactional email provider for OTP.
- Vercel for the Next.js frontend.
- A Python-compatible host for FastAPI/ML.
- Managed PostgreSQL hosting with PostGIS support if geospatial SQL is used.

### Stack rule
Do not introduce Redis, Celery, Kafka, microservices, GraphQL, a second ORM, or another UI framework without explaining the concrete requirement and getting owner approval. Keep the 24-hour prototype simple.

---

## 5. Architecture and ownership boundaries

```text
Next.js + TypeScript + MUI
  ├── Student portal
  ├── College admin portal
  ├── Platform operator portal
  └── Driver portal
           |
           | HTTPS REST API
           v
FastAPI
  ├── Authentication and authorization
  ├── College/domain onboarding
  ├── Campus, bus, route and stop management
  ├── Preferences and stop matching
  ├── Rule-based allocation
  ├── Allocation review/confirmation
  ├── Reassignment proposals
  ├── Trips and QR boarding
  ├── Audit logging
  └── Optional demand-prediction API
           |
           v
PostgreSQL (+ PostGIS)
```

### Single source of truth
- Database records and backend business logic are authoritative.
- Frontend validation is for usability only; backend validation is mandatory.
- Do not duplicate allocation, authorization, capacity, tenant, or QR rules in the frontend.
- Keep API contracts stable and documented.
- ML must use an explicitly defined input/output contract.

---

## 6. Suggested repository layout

```text
college-bus-system/
├── README.md
├── AGENTS.md
├── docs/
│   ├── requirements/
│   │   ├── PROJECT_REQUIREMENTS.md
│   │   └── SCOPE_DECISIONS.md
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   └── DATA_MODEL.md
│   ├── api/
│   │   └── API_CONTRACT.md
│   ├── development/
│   │   ├── DEVELOPMENT_WORKFLOW.md
│   │   ├── SETUP_GUIDE.md
│   │   └── BRANCHING_AND_RELEASES.md
│   ├── testing/
│   │   ├── TEST_PLAN.md
│   │   └── ACCEPTANCE_CRITERIA.md
│   ├── security/
│   │   └── SECURITY_NOTES.md
│   ├── ml/
│   │   └── DEMAND_PREDICTION.md
│   ├── ui-ux/
│   │   ├── DESIGN_SYSTEM.md
│   │   └── COMPONENT_CONTRACTS.md
│   └── presentation/
│       └── SLIDE_CONTENT.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── theme/
│   ├── types/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── ml-service/
│   ├── app/
│   ├── tests/
│   ├── data/
│   ├── pyproject.toml
│   └── README.md
└── scripts/
```

The tree is a proposed layout, not a command to create all files at once. The coding agent must present the initial setup plan first and generate setup steps incrementally.

---

## 7. Git branching and collaboration

> **Superseded branch name:** The integration branch is now `main`. A separate `production` branch may be created later for deploy/release. See [BRANCHING_AND_RELEASES.md](development/BRANCHING_AND_RELEASES.md) and ADR `decisions/0003-rename-integration-branch-to-main.md`.

### Branch strategy

Use a protected integration branch named `main`. Create feature branches from `main`; teammates push only to their assigned branch and open pull requests back to `main`.

Recommended branches:

- `production` — integration-ready code; only merged reviewed work.
- `feat/core-api-db` — owner: backend/database foundation, if delegated; otherwise reserve for the project owner.
- `feat/ml-demand-forecast` — ML teammate.
- `feat/ui-design-system` — UI/UX teammate's coded MUI components, theme, and frontend handoff.
- `feat/demo-qa-docs` — demo data, tests, documentation, slide content and presentation support.
- `feat/<short-description>` — additional narrowly scoped work approved by the owner.
- `fix/<short-description>` — bug fixes.
- `docs/<short-description>` — documentation-only changes.

If the project owner is building the complete application, use `production` as the integration target and keep `feat/ml-demand-forecast`, `feat/ui-design-system`, and `feat/demo-qa-docs` isolated. The owner may create short-lived branches for risky work, but must merge only after review.

### Branch rules
1. No direct pushes to `production`.
2. Each teammate commits only to their assigned branch.
3. Use pull requests even for a small hackathon.
4. Merge only after checking the diff and running relevant tests/builds.
5. No force-pushing shared branches unless all collaborators explicitly agree.
6. Avoid changing the same files across branches. Agree on component/API contracts before parallel work.
7. Never commit `.env`, credentials, OTP secrets, tokens, database passwords, private keys, or real student data.
8. Keep commits small and descriptive, for example:
   - `feat: add campus settings schema`
   - `feat: add demand forecast endpoint`
   - `ui: add admin allocation review table`
   - `test: cover duplicate boarding scans`
   - `docs: add local setup guide`

### Pull request checklist
- [ ] Scope is limited and described.
- [ ] No secrets or personal data committed.
- [ ] Types/schemas/API contracts match the agreed definitions.
- [ ] Relevant tests pass.
- [ ] Frontend build or backend checks pass.
- [ ] No unrelated formatting or generated-file churn.
- [ ] Screenshots or a short recording are attached for UI changes.
- [ ] Any new environment variables are documented in `.env.example`.

---

## 8. API contract conventions

- Prefix API routes with `/api/v1`.
- Use JSON for ordinary request/response payloads.
- Use consistent `snake_case` field names in the API.
- Use ISO 8601 timestamps with timezone information.
- Use explicit status enums; do not use arbitrary free-text status strings.
- Validate request and response schemas with Pydantic.
- Return appropriate HTTP status codes and a consistent error shape.
- Document endpoints in FastAPI OpenAPI output.
- Never trust client-supplied `college_id`, role, student ID, driver ID, allocation status, or capacity values as authorization proof.
- Derive actor identity and role from the authenticated server-side session/token.
- Check tenant scope on every tenant-owned read and write.
- Do not return secret values, OTP hashes, QR token hashes, or internal credentials.
- Pagination/filtering should be consistent where lists can grow.
- Add idempotency or uniqueness protection for operations that must not create duplicates.

Suggested error shape:

```json
{
  "error": {
    "code": "ALLOCATION_CAPACITY_CHANGED",
    "message": "The allocation batch is no longer valid. Review the updated capacity and try again."
  }
}
```

This is an example contract; standardize it before implementation.

---

## 9. Data model requirements

Use UUIDs or another consistent non-guessable identifier strategy. Every tenant-owned table should carry `college_id` where appropriate. Use composite foreign keys or equivalent database constraints to prevent cross-college/campus references.

Suggested entities:

- `colleges`
- `college_domains`
- `users`
- `college_memberships`
- `otp_challenges`
- `college_applications`
- `campuses`
- `campus_settings`
- `buses`
- `routes`
- `stops`
- `route_stops`
- `student_preferences`
- `allocations`
- `allocation_runs`
- `allocation_run_items`
- `trips`
- `trip_qr_tokens`
- `boarding_records`
- `audit_logs`

### Important constraints
- Normalized email uniqueness.
- College slug uniqueness.
- Exact active domain uniqueness.
- Unique route stop sequence within a route.
- Bus registration uniqueness within the defined college/campus scope.
- One active allocation per student in the defined allocation scope.
- Unique `(college_id, campus_id)` campus setting.
- Campus must belong to the same college as its setting.
- A campus must have a valid walking-distance setting before allocation is enabled.
- Capacity must be enforced transactionally, not with a simple row-level `CHECK`.
- Allocation confirmation must lock/revalidate the relevant capacity and route versions.
- Unique `(trip_id, student_id)` boarding record.
- Enforce cross-tenant/campus relationships at the database layer where practical.

---

## 10. Allocation rules

1. Select the student's campus and active preferences.
2. Determine eligible existing stops in that campus.
3. Use the campus's database-configured maximum walking distance.
4. Filter by route coverage, bus availability, and remaining capacity.
5. Exclude invalid/inactive routes and stops.
6. Count each student's eligible options.
7. Prioritize students with fewer eligible options.
8. Within the ordering, consider preference rank, pickup proximity, and capacity using documented tie-breakers.
9. Produce a proposal with reasons for each assignment/unassigned result.
10. Require administrator review and confirmation.
11. On confirmation, revalidate capacity, bus status and route versions inside a transaction.
12. Apply the entire batch atomically; if validation fails, do not partially apply it.
13. Do not silently reassign existing students after a disruption.

Do not claim that this heuristic is a globally optimal solution. If tie-breaking is nondeterministic, fix it with a stable secondary key such as student ID.

---

## 11. Security and privacy rules

- Email OTP must have a short expiry, limited attempts, rate limits, one-time use and secure storage of the challenge/code hash where applicable.
- Never log OTP codes, session secrets or QR token secrets.
- Use secure, HTTP-only cookies if cookie-based sessions are chosen; configure SameSite and CSRF protections appropriately.
- Use HTTPS in deployed environments.
- Apply role-based authorization and tenant scoping on every protected operation.
- Verify college domain DNS ownership and require platform operator approval.
- Do not infer student enrollment solely from an email-domain match.
- QR tokens must be random, short-lived, trip-specific and revocable.
- Derive the student from the authenticated session; reject client-supplied identity claims.
- Prevent duplicate scans with a database uniqueness constraint and safe retry handling.
- Record administrative changes in audit logs without recording secrets.
- Do not implement student GPS tracking or collect continuous location.
- Use synthetic demo data. Do not commit real student records or personal information.

---

## 12. Frontend and MUI conventions

- Use TypeScript strict mode.
- Use MUI as the default component system.
- Put shared MUI theme configuration in `frontend/theme/`.
- Put reusable UI primitives in `frontend/components/`.
- Put domain-specific components in `frontend/features/<feature>/components/`.
- Keep pages thin; put reusable business-facing UI in components and API calls in a shared client layer.
- Keep API response/request types in one agreed location and align them with backend schemas.
- Do not invent response fields in UI mockups without marking them as placeholders.
- UI components must support loading, empty, error, and success states.
- Use accessible labels, keyboard-friendly controls and responsive layouts.
- Do not hardcode tenant IDs, campus IDs, users or allocation results.
- Use environment variables for the API base URL; provide `.env.example`.
- Map UI must clearly distinguish a selected point from an existing stop and show the matched stop/distance result.
- Never label straight-line distance as walking distance.
- QR scanning UI should show clear success, duplicate, expired-token and ineligible-student states.

### UI/UX handoff contract
The UI/UX teammate should provide:
1. Figma frame/link or screenshots.
2. MUI component names and props.
3. Expected props, callbacks and state.
4. Loading/empty/error/success states.
5. Responsive behavior.
6. Any required icons/assets and licenses.
7. A minimal usage example.
8. A list of files they intend to touch.

They must not create a second design system or introduce Tailwind.

---

## 13. ML interface contract

The ML teammate works independently in `ml-service/` and on `feat/ml-demand-forecast`.

Suggested endpoint:

`GET /api/v1/analytics/demand?campus_id=...&route_id=...&date=...&time_slot=...`

Suggested response:

```json
{
  "campus_id": "example-campus-id",
  "route_id": "example-route-id",
  "date": "2026-10-10",
  "time_slot": "08:00-09:00",
  "predicted_demand": 72,
  "available_capacity": 50,
  "estimated_shortage": 22,
  "data_source": "synthetic_demo",
  "model_version": "baseline-v1",
  "metric": {
    "name": "MAE",
    "value": null
  }
}
```

All numbers above are illustrative, not real forecasts. The service must state its data source. If no valid evaluation set exists, leave the metric unavailable rather than inventing it.

The core backend should call the ML module through a small client/service interface and handle timeout/unavailability gracefully. Do not make allocation dependent on ML.

---

## 14. Testing requirements

At minimum, test:

### Authentication and tenancy
- OTP expiry and reuse are rejected.
- Excessive OTP attempts are throttled.
- An unapproved domain cannot authenticate into a college.
- One college cannot access another college's records.
- A user cannot grant themselves a role.

### Campus and stop matching
- Missing campus walking-distance configuration blocks allocation.
- Campus A's distance setting does not affect Campus B.
- A stop from another campus is never returned as a match.
- Map-selected points do not create new stops.
- Distance boundaries and invalid coordinates are handled.

### Allocation
- No bus exceeds capacity.
- Ineligible routes are excluded.
- Preference rank affects ordering as specified.
- Scarcity-first ordering is deterministic.
- Admin confirmation revalidates capacity and bus status.
- A failed confirmation does not partially apply a batch.
- Unassigned students receive a reason.

### Disruption and boarding
- Bus failure creates a proposal rather than silent reassignment.
- Unauthorized drivers cannot start or modify another driver's trip.
- Expired, revoked, wrong-trip and invalid QR tokens are rejected.
- Students without confirmed allocation cannot board.
- Duplicate QR scans cannot create duplicate boarding records.
- A trip cannot accept new boarding after it ends.

### ML
- Missing ML service does not break core features.
- Synthetic-data output is labelled clearly.
- API response schema is validated.

---

## 15. Development stages — do not build everything at once

### Stage 0 — Planning and contracts
Deliver:
- Confirmed repository tree.
- Final dependency choices.
- API/data model draft.
- Team ownership and branch plan.
- A list of environment variables.
- Risks and assumptions.

Do not generate the whole application at this stage.

### Stage 1 — Manual repository and tool setup
The coding agent must provide commands and explain them. The human runs the commands and creates files manually. The agent must not execute commands or edit the workspace.

Deliver:
- Git initialization and branch creation commands.
- Frontend/backend project initialization commands.
- Dependency installation commands.
- `.gitignore` and `.env.example` contents.
- Initial README/AGENTS contents.
- Verification commands and expected results.

### Stage 2 — Skeleton only
Deliver minimal frontend and backend startup code, health endpoint, database connection configuration and a simple UI shell. Explain each file and how to test it.

### Stage 3 — Database and tenant foundation
Deliver migrations/models for colleges, domains, users, memberships, campuses and campus settings. Include constraints and tests.

### Stage 4 — Authentication and college onboarding
Implement OTP request/verification, domain validation workflow, operator approval and role checks.

### Stage 5 — Fleet and route setup
Implement campus, bus, route, stop and route-stop management, plus the MUI admin screens.

### Stage 6 — Preferences and stop matching
Implement ranked preferences, map selection and nearest eligible existing stop matching using campus-specific settings.

### Stage 7 — Allocation engine
Implement deterministic scarcity-first proposal generation, explanations, admin review and atomic confirmation. Add tests before UI polish.

### Stage 8 — Disruption workflow
Implement bus-unavailable flow, reassignment proposals and administrator approval.

### Stage 9 — Trips and QR boarding
Implement trip lifecycle, QR token generation/expiry, passenger manifest and duplicate-proof boarding records.

### Stage 10 — ML integration
Add the optional demand-prediction service and dashboard card. Ensure graceful fallback if the ML service is unavailable.

### Stage 11 — End-to-end verification
Run tests, build frontend, inspect tenant isolation, validate deployment configuration and test the demo workflow.

### Stage 12 — Freeze and presentation
Stop adding features. Fix critical defects, capture screenshots, rehearse the demo and prepare a backup recording.

At every stage, report what is complete, what remains, commands to run, expected output, and how the human can verify it.

---

## 16. Mandatory instructions for Cursor and all coding agents

Copy this section into the repository's `AGENTS.md`.

### Human-operated coding mode

**The agent must generate code and instructions, not apply changes.**

1. Do not create, edit, overwrite, move, rename or delete project files.
2. Do not run shell commands, package managers, migrations, formatters, tests, servers or Git commands.
3. Do not commit, push, merge, switch branches or modify Git state.
4. Do not use tools that mutate the workspace.
5. Provide exact file paths and complete proposed file contents in the response.
6. For each file, explain its purpose and where it belongs.
7. Provide setup commands separately, explain each command, and wait for the human to run them.
8. Never claim that a command, test, build, migration or deployment succeeded unless the human supplies the result.
9. Work in small stages. Do not dump an entire application in one response.
10. End each stage with a verification checklist and ask the human to share errors/output before continuing when needed.
11. When asked to implement a feature, first list the files that would change and why. Then provide code for only the agreed stage.
12. If a requested change affects an API contract, schema, shared component or dependency, call it out before writing code.
13. Do not silently change the agreed stack, scope, endpoint names, field names, enums, role names or branch strategy.
14. If requirements conflict or are missing, identify the conflict and ask one concise clarification rather than inventing behavior.
15. Do not include fake credentials, real secrets or actual personal data in examples.

### Cross-agent synchronization rules

1. `docs/requirements/PROJECT_REQUIREMENTS.md` is the authoritative product scope.
2. `docs/api/API_CONTRACT.md` is the authoritative API contract once agreed.
3. `docs/architecture/DATA_MODEL.md` is the authoritative schema/relationship contract once agreed.
4. Store supporting project documents under the appropriate `docs/` subfolder. Do not scatter project documentation across the repository root.
5. Before creating a new document, check whether a relevant document already exists; update it rather than creating duplicate or conflicting documents.
6. Use clear, descriptive filenames in `UPPER_SNAKE_CASE.md`. Keep documents focused and cross-link related documents with relative Markdown links.
7. Documents generated by an agent are proposals until reviewed by the project owner. Do not silently treat a newly generated document as an approved contract.
8. Shared enums, field names and response types must not be independently redefined by different agents.
9. UI agents may use mock data only when explicitly marked as mock data; they must match the agreed API types.
10. The ML agent must implement the agreed request/response contract and must not modify core allocation logic.
11. The UI/UX agent must use MUI and must not add Tailwind.
12. Any proposed contract change must include impact analysis and require project-owner approval before implementation.
13. Keep work on the assigned branch. Do not touch unrelated modules.
14. If a teammate's work depends on a missing interface, define a small interface/mock contract and document it instead of guessing.

### Required response format from coding agents

For every coding task, respond in this order:

1. **Stage and goal**
2. **Assumptions / unresolved questions**
3. **Files to create or change** (proposed only; put supporting documentation under the correct `docs/` subfolder)
4. **Code or document contents** (complete content, labelled with exact file path)
5. **Commands for the human to run** (explained; do not execute)
6. **Expected output**
7. **Manual verification checklist**
8. **Tests to add or run**
9. **Integration/branch notes**
10. **Known limitations and next stage**

If the response is too large, split it into numbered parts and wait for confirmation before continuing.

---

## 17. First Cursor task

Start by asking Cursor to **plan Stage 0 and Stage 1 only**. It must not write or apply changes to the workspace.

Expected first response:
1. Summarize the locked scope.
2. Propose the repository structure, including the `docs/` hierarchy and what belongs in each subfolder.
3. Give a sequential list of Git and project initialization commands.
4. Explain what each command does.
5. Provide the proposed `AGENTS.md`, `.gitignore`, `.env.example`, README content, and initial document stubs under the appropriate `docs/` subfolders.
6. Show how to create `production` and the three collaborator branches.
7. Explain how to verify the setup manually.
8. Stop and wait for the human to run the commands and share the results before proceeding to Stage 2.

### Suggested Git setup sequence

These are instructions for the human to review and run, not commands for the agent to execute:

```bash
git init
git branch -M production
git add .
git commit -m "chore: initialize project documentation"
git switch -c feat/ml-demand-forecast
git switch production
git switch -c feat/ui-design-system
git switch production
git switch -c feat/demo-qa-docs
git switch production
```

Important: create the initial documentation files and review them before the first commit. If the Git hosting provider creates a default `main` branch or initializes a README remotely, reconcile that state before running this sequence. Do not force-push or overwrite remote history without reviewing it.

The project owner should create the GitHub repository, push `production`, publish the collaborator branches, and configure branch protection manually. Agents must not perform these actions.

---

## 18. Definition of done for the hackathon demo

The core demo is complete when a presenter can:

1. Show a platform operator approving a college and its verified domain.
2. Show a college administrator configuring campuses and walking-distance settings.
3. Add a bus, route and ordered stops.
4. Sign in as a student and submit ranked preferences.
5. Select a pickup location and see a suitable existing stop matched.
6. Generate a batch allocation that respects capacity and explains its decisions.
7. Confirm the batch as an administrator.
8. Mark a bus unavailable and show a reassignment proposal awaiting approval.
9. Start a trip and display its QR.
10. Scan the QR as an eligible student and see boarding confirmed once.
11. Show optional demand predictions with their data source clearly labelled.
12. Demonstrate that one college cannot access another college's data.

If time runs short, prioritize a reliable end-to-end path over extra features. Never fake security, tenant isolation, allocation correctness or ML evaluation in the presentation.
