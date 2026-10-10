# College Bus Route & Seat Allocation System
## Project Requirements, Repository Plan, and Cursor Agent Instructions

**Project type:** 24-hour hackathon prototype  
**Status:** Scope revised — Excel clustering routes + QR boarding; no heavy ML  
**Primary owner:** Core application development and integration  
**Frontend UI library:** Material UI (MUI), not Tailwind CSS

---

## 1. Project summary

Build a web-based platform that helps colleges plan dynamic bus routes from student home/PG locations, allocate buses by capacity, handle disruptions, and confirm boarding via driver QR sessions.

The platform supports multiple colleges. Admins import students from Excel (name, SRN, academic email, coordinates). The system clusters nearby locations into centroid pick/drop stops, assembles routes, and assigns buses with **rule-based** logic. After admin confirmation, student pick/drop is **locked**. Drivers start a trip session; students scan a QR to mark attendance. Heavy ML is out of scope; boarding history may support simple rule-based planning analytics later.

See [SCOPE_DECISIONS.md](./SCOPE_DECISIONS.md), [ADR 0005](../../decisions/0005-excel-clustering-routes-and-restore-qr.md), and [ROUTING_AND_CLUSTERING.md](../architecture/ROUTING_AND_CLUSTERING.md).

### One-line summary

Admin-imported student locations → clustered stops and routes → capacity-aware bus assignment → locked pickups → QR boarding attendance, without heavy ML.

### Scope note

The organizers' original problem statement must be copied verbatim from the official source into the presentation. The uploaded CBC 2.0 PPTX is a presentation template, not the original problem statement. Do not claim that every enhancement in this document was explicitly required by the organizers.

---

## 2. Locked feature scope

### 2.1 Core problem features

1. **Bus management**
   - Create and manage buses (registration, capacity, campus, status).
   - Mark a bus unavailable when required.

2. **Admin Excel student intake**
   - Admin uploads Excel/CSV: Name, SRN, academic email, home/PG coordinates (and agreed columns).
   - Validate rows; reject invalid coords / emails outside approved domains.
   - Students authenticate later via email OTP on approved academic domains.

3. **Cluster → centroid stops → dynamic routes**
   - Cluster nearby student coordinates (density clustering; DBSCAN recommended).
   - Create centroid pick/drop stops from clusters.
   - Assemble ordered routes from centroids for the planning batch / academic year.
   - Admin may merge/split clusters, reorder stops, and manually add stops.
   - After admin confirms the plan, student pick/drop is **locked** (no student self-change).

4. **Sparse / outlier student handling**
   - Never auto-create a route solely for 1–2 distant students.
   - If within campus max walk distance of a centroid → snap to nearest stop.
   - Else mark `needs_admin_review` (contact admin); admin may assign or create a stop manually.

5. **Rule-based bus allocation by headcount**
   - Assign bus(es) to a route from student count vs bus capacity using documented rules.
   - Heuristic only; do not claim global optimality.
   - No heavy ML models.

6. **Admin plan review and atomic confirmation**
   - Clustering/routing/bus assignment are proposals until admin confirms.
   - Confirm revalidates capacities and bus availability; apply atomically or not at all.

7. **Bus disruption and reassignment**
   - Record bus unavailable → reassignment proposal → admin approval.
   - Never silently move students for non-emergency admin actions.

7b. **Driver distress / emergency reallocation**
   - During an **active** trip, the driver can press a **Distress** button.
   - On distress, the system **immediately** records: trip/bus/route, timestamp, and the **driver phone GPS coordinates**.
   - System computes demand still needing service on that trip/route:
     - **Already boarded** (attendance/QR marked) on the distressed bus.
     - **Remaining pickups** — students assigned to this route/trip who have **not** boarded yet (and any policy for already-boarded passengers needing rescue).
   - System finds **available** buses (operational, not on conflicting active trip, with usable capacity) and **dynamically proposes/allocates** replacement capacity using rule-based logic (headcount vs capacity, proximity to distress coords when useful).
   - MVP outcome: create an **emergency reallocation plan** (one or more buses + which remaining students/stops they cover), notify college admin, and show status to driver/admin/students as appropriate.
   - Prefer **auto-generate + admin quick-confirm** for safety; if time-critical demo needs full auto-apply, document that emergency apply is allowed only for distress and is fully audited.
   - Distress does **not** use heavy ML; rules only.
   - Ending or resolving distress is an admin/driver-controlled follow-up (replacement trip sessions, etc.).

8. **QR boarding / attendance**
   - Assigned driver **manually starts** a trip session for their bus.
   - Short-lived trip QR shown on driver panel while the session is active.
   - Authenticated student scans QR → boarding/attendance marked once.
   - Driver **must manually end** the trip session (no auto-end assumed for MVP).
   - After the session ends: QR is invalidated; no further boarding scans accepted for that trip.
   - Identity from session only; store token hashes; uniqueness on `(trip_id, student_id)`.
   - Attendance data may feed simple rule-based planning analytics later (not ML models).

8b. **Driver stop itinerary (ordered stops)**
   - After the route plan is **admin-finalized/confirmed**, the assigned driver can see the route’s stops in **visit order**.
   - When the driver starts the trip session, the driver panel shows the **ordered stop list** (name/label, sequence number, map position) for that route.
   - MVP: clear sequential checklist / list + map markers; turn-by-turn navigation is out of scope.
   - Stop order comes from the confirmed `route_stops` sequence; driver cannot reorder the official route in MVP (admin changes require a new confirmed plan).

8c. **Driver live location (for students)**
   - While a trip session is **active**, the driver app periodically shares the **driver phone** GPS position with the backend.
   - Assigned students (and admin, as needed) can view the bus’s current position on a map in near real time.
   - Tracking **starts** when the driver manually starts the session and **stops** when the driver manually ends it (no tracking outside an active session).
   - **Do not** track student phones or collect continuous student location.

### 2.2 Platform additions

9. **Multi-college platform** — tenant isolation; operator approves colleges and appoints first admin.
10. **Verified email domains** — DNS TXT + operator approval; exact domain match; domain ≠ enrollment proof.
11. **Campus-specific settings** — max walk-to-stop distance, clustering parameters as configured; no client override.
12. **Map UI (admin planning)** — Leaflet + OSM to visualize clusters, centroids, routes; label distance approximations.

### 2.3 Explicitly out of scope

- Heavy ML / neural demand models (rule-based analytics OK).
- Student self-serve ranked preferences or changing pick/drop after lock.
- Student-driven map click to create stops.
- Live traffic (any traffic-aware ETAs, congestion, or time-of-day traffic).
- Google Maps Platform as a hard dependency for MVP.
- MVP routing/planning uses **distance + approximate time only**.
- Student GPS tracking / continuous student location (driver-phone tracking during active trips is in scope).
- Turn-by-turn navigation; native apps; push/SMS (defer).

### 2.4 Defer unless core is complete

- Advanced multi-vehicle route optimization / true TSP solvers.
- Live traffic integration.
- OSRM/road-network snap of every centroid (nice-to-have after Haversine MVP).
- Push/SMS; native mobile apps.

---

## 3. User roles and permissions

### Platform operator
- Review and approve/reject college applications.
- Appoint the initial college administrator.
- Review and approve/reject college domain registrations after DNS verification.
- Access platform-level records only through explicitly authorized operator functionality.

### College administrator
- Import students via Excel/CSV and run clustering / route proposals.
- Manage campuses, buses, routes, stops, and campus settings (incl. max walk / cluster params).
- Manually add or assign stops for outlier students.
- Review and confirm planning batches; approve/reject reassignment proposals.
- Receive and quick-confirm **distress / emergency reallocation** plans; view distress location on map.
- View operational dashboards, attendance summaries, and audit records.

### Student
- Authenticate through email OTP on an approved domain.
- View locked pick/drop stop, route, and bus assignment (read-only after confirm).
- While their bus trip is active, view the **driver/bus live position** on a map (read-only).
- Scan the driver's trip QR to mark boarding/attendance.
- Must not be asked for continuous GPS tracking of their own device.

### Driver
- Access only trips assigned to them.
- View the **ordered stop itinerary** for the finalized route (before and during the trip).
- Manually start an authorized trip session (enables QR + location sharing + active itinerary view).
- While the session is active, share device GPS to the backend on a reasonable interval.
- Display or refresh a valid trip QR while the session is active.
- Press **Distress** during an active trip (captures coords; triggers emergency reallocation workflow).
- **Manually end** the trip session (required; ends QR validity and stops location sharing) when the trip concludes normally or after handoff.
- View passenger manifest and boarding/attendance statuses.

---

## 4. Final technology stack

### Frontend
- Next.js with TypeScript and App Router.
- React.
- Material UI (MUI) for components and theming.
- MUI Icons.
- Leaflet and React Leaflet for maps.
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

### Supporting tools
- Git and GitHub.
- Postman or equivalent API client.
- Figma for design handoff.
- SMTP or a transactional email provider for OTP.
- Vercel for the Next.js frontend.
- A Python-compatible host for FastAPI.
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
  ├── Excel student import + clustering + route proposals
  ├── Rule-based bus assignment + admin confirm
  ├── Disruption + distress emergency reallocation
  ├── Trips, QR, boarding/attendance
  ├── Driver location pings (active trip)
  └── Audit + simple attendance analytics
           |
           v
PostgreSQL
```

### Single source of truth
- Database records and backend business logic are authoritative.
- Frontend validation is for usability only; backend validation is mandatory.
- Do not duplicate allocation, authorization, capacity, or tenant rules in the frontend.
- Keep API contracts stable and documented.
- **No ML service.** QR boarding, driver itinerary, driver live location, and distress are in scope.

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
└── scripts/
```

Note: Do **not** add an `ml-service/`. Any leftover ML folder/branch is deleted/retired.

The tree is a proposed layout, not a command to create all files at once. The coding agent must present the initial setup plan first and generate setup steps incrementally.

---

## 7. Git branching and collaboration

> **Superseded branch name:** The integration branch is now `main`. A separate `production` branch may be created later for deploy/release. See [BRANCHING_AND_RELEASES.md](../development/BRANCHING_AND_RELEASES.md) and ADR `decisions/0003-rename-integration-branch-to-main.md`.

### Branch strategy

Use a protected integration branch named `main`. Create feature branches from `main`; teammates push only to their assigned branch and open pull requests back to `main`.

Recommended branches:

- `main` — integration-ready code; only merged reviewed work.
- `feat/ui-design-system` — UI/UX teammate; **`frontend/components/` only**.
- `feat/demo-qa-docs` — demo data, tests, documentation, slide content.
- `feat/<short-description>` — additional narrowly scoped work approved by the owner.
- `fix/<short-description>` — bug fixes.
- `docs/<short-description>` — documentation-only changes.

There is **no** ML feature branch.

### Branch rules
1. No direct pushes to `main`.
2. Each teammate commits only to their assigned branch.
3. Use pull requests even for a small hackathon.
4. Merge only after checking the diff and running relevant tests/builds.
5. No force-pushing shared branches unless all collaborators explicitly agree.
6. Avoid changing the same files across branches. Agree on component/API contracts before parallel work.
7. Never commit `.env`, credentials, OTP secrets, tokens, database passwords, private keys, or real student data.
8. Keep commits small and descriptive, for example:
   - `feat: add campus settings schema`
   - `ui: add admin allocation review table`
   - `test: cover allocation capacity limits`
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
- Do not return secret values, OTP hashes, or internal credentials.
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
- Never log OTP codes or session secrets.
- Use secure, HTTP-only cookies if cookie-based sessions are chosen; configure SameSite and CSRF protections appropriately.
- Use HTTPS in deployed environments.
- Apply role-based authorization and tenant scoping on every protected operation.
- Verify college domain DNS ownership and require platform operator approval.
- Do not infer student enrollment solely from an email-domain match.
- Derive the student from the authenticated session; reject client-supplied identity claims.
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

**Deleted from product.** No ML service, branch, endpoints, or dashboards. See [FEATURES.md](./FEATURES.md).

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

### Disruption
- Bus failure creates a proposal rather than silent reassignment.
- Admin must approve before active assignments change.
- Impacted students are marked disrupted while a proposal is pending.

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

### Stage 5 — Fleet + Excel import + clustering routes
Buses, Excel student intake, cluster→centroid→route proposals, outlier handling, admin map review.

### Stage 6 — Rule-based bus assignment + atomic confirm
Headcount vs capacity; lock student pick/drop on confirm.

### Stage 7 — Disruption + distress
Non-emergency unavailable bus proposals; distress button with GPS, boarded vs remaining, emergency bus plan.

### Stage 8 — Trips, QR, itinerary, live driver location
Driver start/end session, ordered stops, QR attendance, driver GPS for students.

### Stage 9 — End-to-end verification
Tests, frontend build, tenant isolation, demo workflow.

### Stage 10 — Freeze and presentation
Stop features; fix critical defects; screenshots; rehearse demo.

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
10. There is no ML agent or ML service. Do not implement ML features.
11. The UI/UX agent must use MUI, must not add Tailwind, and may edit **only** `frontend/components/`.
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

See [BRANCHING_AND_RELEASES.md](../development/BRANCHING_AND_RELEASES.md). Integration branch is `main`. Collaborator branches: `feat/ui-design-system`, `feat/demo-qa-docs` only.

---

## 18. Definition of done for the hackathon demo

See [../testing/ACCEPTANCE_CRITERIA.md](../testing/ACCEPTANCE_CRITERIA.md). Summary:

1. Operator approves college + domain.
2. Admin campus settings + Excel import + cluster/route proposal on map.
3. Outlier snap or admin review; rule-based bus assignment; atomic confirm; pickups locked.
4. Disruption proposal; distress → coords + emergency bus plan + admin quick-confirm.
5. Driver ordered stops; start trip; QR scan attendance; student sees live bus; driver ends session.
6. Tenant isolation demo.

If time runs short, prioritize a reliable end-to-end path. Never fake security, tenant isolation, or allocation correctness.
