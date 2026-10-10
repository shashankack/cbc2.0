# Frontend pages & components (UI handoff)

**Owner (pages/wiring):** project owner — `frontend/app/`, `frontend/features/`, `frontend/theme/`, `frontend/lib/`, `frontend/types/`  
**UI/UX teammate (components only):** `frontend/components/**` on branch `feat/ui-design-system`

Do **not** edit anything outside `frontend/components/`.  
Stack: **MUI only** (no Tailwind). Use mock props; mark mock data clearly.

Canonical feature list: [../requirements/FEATURES.md](../requirements/FEATURES.md)

---

## Pages required (owner implements routes)

### Shared / auth
| Page | Route (suggested) | Purpose |
|------|-------------------|---------|
| Landing | `/` | Product entry |
| Login (request OTP) | `/login` | Email entry |
| Verify OTP | `/login/verify` | OTP code |
| Role home redirect | `/app` | Send user to role portal |

### Platform operator
| Page | Route | Purpose |
|------|-------|---------|
| Operator dashboard | `/operator` | Overview |
| College applications | `/operator/colleges` | Approve/reject colleges |
| Domain approvals | `/operator/domains` | Approve/reject domains |

### College admin
| Page | Route | Purpose |
|------|-------|---------|
| Admin dashboard | `/admin` | Ops overview |
| Campuses & settings | `/admin/campuses` | Max walk, cluster params |
| Buses | `/admin/buses` | CRUD, mark unavailable |
| Student import | `/admin/students/import` | Excel upload + validation results |
| Planning / clusters map | `/admin/planning` | Clusters, centroids, routes, outliers |
| Plan review & confirm | `/admin/planning/[runId]` | Proposal details, confirm |
| Disruptions | `/admin/disruptions` | Unavailable-bus proposals |
| Distress / emergency | `/admin/distress` | Distress events + quick-confirm reallocations |
| Attendance analytics | `/admin/analytics/attendance` | Simple counts (not ML) |

### Student
| Page | Route | Purpose |
|------|-------|---------|
| My assignment | `/student` | Locked stop/route/bus (read-only) |
| Live bus map | `/student/trip` | Driver position while trip active |
| Scan QR | `/student/board` | Camera/scan boarding |

### Driver
| Page | Route | Purpose |
|------|-------|---------|
| My trips | `/driver` | Assigned trips |
| Active trip | `/driver/trip/[tripId]` | Ordered stops, QR, distress, end session |
| Manifest | `/driver/trip/[tripId]/manifest` | Passengers + boarding status |

---

## Components required (UI teammate builds under `frontend/components/`)

Suggested folders. Export from each folder’s `index.ts` when ready.

### `components/layout/`
- `AppShell` — top bar + nav slot + main content
- `PageHeader` — title, subtitle, actions slot
- `RoleNav` — nav items via props (no hardcoded tenant data)

### `components/feedback/`
- `LoadingState`
- `EmptyState`
- `ErrorState` — message + retry
- `SuccessBanner` / `StatusChip` — status enums via props

### `components/forms/`
- `TextField` wrappers only if needed beyond MUI
- `OtpInput`
- `FileUploadDropzone` — Excel/CSV
- `ConfirmDialog`
- `FormActions` — primary/secondary buttons

### `components/data/`
- `DataTable` — columns/rows via props; loading/empty
- `KeyValueList`
- `PassengerManifestTable`
- `AllocationSummaryCards` — counts via props

### `components/maps/`
- `MapCanvas` — Leaflet map container (center/zoom props)
- `StopMarkers` — ordered stops
- `ClusterLayer` — cluster points (props)
- `CentroidMarkers`
- `RoutePolyline`
- `LiveBusMarker` — driver position
- `DistressMarker`
- `MapLegend`

Label distances/times as **approximate** (never “live traffic”).

### `components/trips/`
- `OrderedStopList` — sequence checklist
- `TripSessionControls` — Start / End session buttons (callbacks only)
- `TripQrPanel` — QR image/url + refresh callback
- `DistressButton` — prominent, confirm-before-fire
- `BoardingScanPanel` — scanner viewport + success/duplicate/error states

### `components/planning/`
- `ImportResultSummary` — valid/invalid row counts
- `OutlierReviewCard` — snap vs needs_admin_review
- `PlanConfirmBar` — confirm/reject proposal
- `EmergencyReallocationCard` — boarded, remaining, suggested buses

---

## Component contract rules

For each component, include:
1. TypeScript props interface  
2. loading / empty / error / success where interactive  
3. No API calls inside components (callbacks + props only)  
4. No Tailwind; MUI + MUI Icons only  
5. No edits outside `frontend/components/`  
6. Short usage example in file-level comment or Story-less JSDoc  

Merge `origin/main` before every PR. Open small PRs (one folder or a few related components).
