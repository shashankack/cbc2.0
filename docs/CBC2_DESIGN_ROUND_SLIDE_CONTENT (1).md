# CBC 2.0 Design Round — Slide-by-Slide Content
## College Bus Route & Seat Allocation System

**Purpose:** Content handoff for the teammate creating the presentation.  
**Important:** Follow the uploaded CBC 2.0 design-round template's existing slide order, theme, logo, placeholders and footer rules. Do not redesign the template from scratch.

---

## Slide 1 — Title / Project

### Project name
**RouteWise** *(working name; confirm with the team before finalizing)*

### Tagline
**Smarter campus transport through fair seat allocation and demand-aware planning.**

### Fill in the template fields
- Team Name: `[TEAM NAME]`
- Team ID: `[TEAM ID]`
- Domain: `[DOMAIN AS PROVIDED BY ORGANIZERS]`
- College: `[COLLEGE NAME]`

### Visual direction
Use one simple visual: campus bus + route line + pickup markers. Keep the slide clean and high contrast. Do not add unsupported impact statistics.

---

## Slide 2 — Problem Statement (As Given)

### Critical instruction
Paste the **exact original problem statement from the hackathon organizers** into the designated placeholder. Preserve the original wording. Do not replace it with the team's paraphrase.

The uploaded CBC 2.0 template says to paste the statement provided by the organizers; the template itself does not provide the statement text.

### Supporting fields
- Problem ID: `[OFFICIAL PROBLEM ID]`
- Domain: `[SAME DOMAIN AS TITLE SLIDE]`
- Our Focus: **Reliable bus seat allocation, route/stop matching and disruption handling for campus transport.**

### Visual direction
Keep this slide text-first. Do not overcrowd the exact statement. If the original statement is long, reduce surrounding decoration rather than editing its wording.

---

## Slide 3 — Understanding the Problem

### Who is affected?
- Students who need an eligible pickup stop and an available seat.
- College transport administrators managing buses, routes, capacity and allocations.
- Drivers who need a clear trip passenger manifest.

### What is going wrong?
- Student demand and bus capacity can be difficult to reconcile manually.
- Preferences, pickup proximity and route eligibility may conflict.
- A bus becoming unavailable can disrupt existing assignments.
- Allocation decisions may be difficult to review or explain if handled manually.

### Why does it matter?
- Over-capacity assignments must be prevented.
- Students need clear allocation outcomes.
- Administrators need a controlled way to approve allocations and handle disruptions.
- Boarding needs a simple confirmation mechanism.

### Suggested scenario
A campus has more student requests than available seats on one route. The system must prioritize eligible preferences, avoid exceeding capacity, explain unassigned requests and let the administrator confirm a safe allocation batch.

### Visual direction
Use a three-column layout: **Stakeholders / Pain points / Consequences**. Avoid invented numerical claims.

---

## Slide 4 — Our Proposed Solution

### Idea in one line
A multi-college bus management platform that matches student preferences to eligible stops and available seats, then lets administrators review and confirm allocations.

### How it works
**1. Configure**
- College administrator configures campuses, walking-distance limits, buses, routes and stops.

**2. Match and allocate**
- Students authenticate by email OTP, choose a campus and submit ranked preferences.
- The system finds eligible existing stops and generates a capacity-aware allocation proposal.

**3. Review and board**
- Administrator reviews and confirms the batch.
- Driver starts a trip and displays a short-lived QR; eligible students scan to confirm boarding.

### Outcome
More controlled allocation, visible decision reasons and an auditable disruption/boarding workflow.

### Visual direction
Use a three-step flow: **Configure → Allocate → Confirm boarding**.

---

## Slide 5 — Key Features

Use the template's key-features slide. Separate core capabilities from innovation so judges can distinguish the base solution from enhancements.

### Core capabilities
- Bus, route and stop management.
- Student route/stop preferences.
- Capacity-aware seat allocation.
- Bus unavailability and reassignment proposal workflow.
- Administrator review and confirmation.

### Added capabilities
- Multi-college, multi-campus architecture with tenant isolation.
- Email OTP and verified college-domain onboarding.
- Campus-specific pickup walking-distance limits.
- Map-based pickup selection matched to an existing stop.
- Scarcity-first allocation with ranked preferences.
- QR-based boarding confirmation.
- Optional ML demand prediction.

### Visual direction
Use 5–7 concise feature tiles with simple icons. If space is tight, group related capabilities. Do not claim advanced live GPS tracking; it is out of scope.

---

## Slide 6 — Architecture & Tech Stack

### Architecture
**User layer**
- Student portal
- College admin portal
- Platform operator portal
- Driver interface

**Application layer**
- Next.js + TypeScript + MUI frontend
- FastAPI REST backend
- Rule-based allocation and QR validation

**Data and AI layer**
- PostgreSQL + PostGIS
- Optional separate scikit-learn demand-prediction service
- Leaflet + OpenStreetMap for map interaction

### Tech stack
- Frontend: Next.js, TypeScript, React, Material UI (MUI)
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL, PostGIS where available
- Maps: Leaflet, OpenStreetMap; routing service only if road distance/time is needed
- ML: Pandas, NumPy, scikit-learn
- Testing: Pytest, HTTPX
- Deployment: Vercel for frontend; Python-compatible backend hosting; managed PostgreSQL

### Visual direction
Show a simple architecture diagram. Make clear that the ML service is optional and separate. Do not use Tailwind in the stack slide.

---

## Slide 7 — Innovation & Differentiation

Use a comparison table with these rows.

| Aspect | Basic/manual approach | Our solution |
|---|---|---|
| Allocation | Manual assignment or simple first-come assignment | Capacity-aware batch proposal with ranked preferences |
| Scarcity | May overlook students with fewer alternatives | Prioritizes students with fewer eligible choices |
| Pickup selection | Fixed stops only or informal requests | Map-selected point matched to a suitable existing stop |
| Governance | Changes may be applied directly | Admin confirmation and approved reassignment workflow |
| Boarding | Manual roll call | Trip-specific QR boarding confirmation |
| Planning | Reactive capacity decisions | Optional demand forecast for possible shortages |
| Scale | Separate, manual processes | Shared platform with isolated college workspaces |

### Unique edge
**Explainable, admin-confirmed allocation that combines campus-specific pickup rules, capacity constraints and optional demand forecasting.**

### Important wording
Do not claim the system always finds the mathematically optimal allocation. Describe it as a deterministic heuristic. Do not claim the ML model is accurate on real transport demand if only synthetic data is used.

---

## Slide 8 — Impact, Feasibility & Risks

### Impact
- Helps administrators see capacity conflicts before confirming a batch.
- Gives students a clear allocation status and pickup-stop outcome.
- Provides a controlled workflow for bus disruptions.
- Simplifies boarding confirmation and passenger-manifest updates.

Do not include numeric savings or percentages unless the team has measured them.

### Feasibility
- Built with established web, database and geospatial tools.
- Core allocation uses deterministic rules and does not require training data.
- Optional ML module can be demonstrated with labelled synthetic data.
- Scope is modular so the core workflow can be demonstrated independently.

### Risks and mitigations
- **Unverified college membership:** DNS verification plus platform approval; note that domain ownership alone does not prove student enrollment.
- **Over-capacity allocation:** transactional capacity revalidation at confirmation.
- **Cross-college data exposure:** server-side tenant checks and database constraints.
- **Stale/shared QR:** short-lived trip-specific tokens, validation and duplicate prevention.
- **Unreliable ML data:** label synthetic data and do not make unsupported accuracy claims.
- **Time constraint:** prioritize the end-to-end core workflow; ML and advanced routing remain optional.

### Visual direction
Use three clear blocks: Impact / Feasibility / Risks & mitigation.

---

## Slide 9 — Rules to Follow (Template instructions)

This slide is a template instruction slide, not a project-content slide. **Follow the template owner's instruction for whether this slide should remain in the submitted deck.** If it is required to remain, preserve its instructions. If the organizers expect a project-only deck and allow removing instruction slides, confirm that before removal.

The uploaded template lists these rules:
1. Use the template as given; keep the theme, logo and slide order.
2. Paste the original problem statement exactly as supplied by organizers.
3. Use one message per slide and text no smaller than 14 pt.
4. Use original work and cite sources for every statistic or image.
5. Keep content inside placeholders without overflow or overlap.
6. Keep Team ID and Domain identical on every slide; configure the footer/Slide Master consistently.
7. Submit as PPTX and PDF using the naming format `TeamID_Domain`.

---

## Presentation-wide consistency checklist

- [ ] Project name and tagline are consistent.
- [ ] Team name, Team ID, domain and college are correct.
- [ ] Problem ID is copied from the official statement.
- [ ] Slide 2 uses the original problem statement verbatim.
- [ ] Every statistic is sourced or omitted.
- [ ] Every external image/icon follows the event's attribution rules.
- [ ] The stack says **MUI**, not Tailwind.
- [ ] ML is described as optional demand prediction, not as the allocation engine.
- [ ] No student GPS tracking or live bus tracking is claimed.
- [ ] No claim of guaranteed optimal allocation or production-grade ML accuracy.
- [ ] The template's theme, logo, order, footer and minimum font-size requirements are followed.
- [ ] Check text overflow at presentation size.
- [ ] Export both PPTX and PDF with the required filename.

## Facts to confirm before final submission

1. Official problem statement text and problem ID.
2. Team name, Team ID, domain and college.
3. Whether the template's instruction slide (Slide 9) must remain in the final submission.
4. Final project name: `RouteWise` is only a working suggestion.
5. Whether any organizer-specific feature requirements differ from the scope agreed by the team.
