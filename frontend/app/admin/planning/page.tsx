"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PlanConfirmBar } from "@/components/planning";
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { centerFromPoints, routesToPolylines } from "@/features/maps";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus, ImportBatch, PlanningRun } from "@/types/api";

const PlanningProposalMap = dynamic(
  () => import("@/features/maps/PlanningProposalMap"),
  {
    ssr: false,
    loading: () => (
      <Stack sx={{ height: 420, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} aria-label="Loading map" />
      </Stack>
    ),
  },
);

const nav = [...ADMIN_NAV];

type RunSummary = Omit<PlanningRun, "stops" | "routes" | "items"> & {
  stops?: PlanningRun["stops"];
  routes?: PlanningRun["routes"];
  items?: PlanningRun["items"];
};

function AdminPlanningPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [campusId, setCampusId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [run, setRun] = useState<PlanningRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "college_admin") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
      return;
    }
    if (!collegeId) return;

    const qCampus = searchParams.get("campusId") ?? "";
    const qBatch = searchParams.get("batchId") ?? "";

    void Promise.all([
      apiGet<Campus[]>(`/colleges/${collegeId}/campuses`),
      apiGet<ImportBatch[]>(`/colleges/${collegeId}/imports/students`),
      apiGet<RunSummary[]>(`/colleges/${collegeId}/planning-runs`),
    ])
      .then(async ([campusRows, batchRows, runRows]) => {
        setCampuses(campusRows);
        setBatches(batchRows);
        setRuns(runRows);
        const nextCampus =
          qCampus ||
          batchRows[0]?.campus_id ||
          campusRows[0]?.id ||
          "";
        setCampusId(nextCampus);
        setBatchId(qBatch || "");
        const latest = runRows[0];
        if (latest) {
          const detail = await apiGet<PlanningRun>(
            `/colleges/${collegeId}/planning-runs/${latest.id}`,
          );
          setRun(detail);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router, searchParams]);

  const campusBatches = useMemo(
    () => batches.filter((b) => !campusId || b.campus_id === campusId),
    [batches, campusId],
  );

  async function runPlanning() {
    if (!collegeId || !campusId) return;
    setRunning(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs`,
        {
          campus_id: campusId,
          import_batch_id: batchId || null,
        },
      );
      setRun(result);
      setRuns((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Planning failed.");
    } finally {
      setRunning(false);
    }
  }

  async function openRun(id: string) {
    if (!collegeId) return;
    try {
      const detail = await apiGet<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${id}`,
      );
      setRun(detail);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Load run failed.");
    }
  }

  async function confirm() {
    if (!collegeId || !run) return;
    setConfirming(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/confirm`,
      );
      setRun(result);
      setRuns((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, ...result } : r)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Confirm failed.");
    } finally {
      setConfirming(false);
    }
  }

  const mapLayers = useMemo(() => {
    if (!run) return null;
    const depotStop =
      run.stops.find((s) => s.source === "campus") ??
      run.routes
        .flatMap((r) => r.route_stops)
        .sort((a, b) => a.sequence - b.sequence)
        .find((s) => s.lat != null && s.lng != null) ??
      null;
    const depot =
      depotStop && depotStop.lat != null && depotStop.lng != null
        ? {
            lat: depotStop.lat,
            lng: depotStop.lng,
            label:
              "name" in depotStop && depotStop.name
                ? depotStop.name
                : "Campus depot",
          }
        : null;
    // Pickup centroids only — campus depot is rendered separately.
    const centroids = run.stops
      .filter((s) => s.source !== "campus")
      .map((s) => ({
        id: s.id,
        label: s.name,
        lat: s.lat,
        lng: s.lng,
      }));
    const polylines = routesToPolylines(run.routes);
    const stopMarkers = run.routes.flatMap((route) => {
      const ordered = [...route.route_stops].sort(
        (a, b) => a.sequence - b.sequence,
      );
      return ordered
        .filter(
          (
            s,
          ): s is {
            sequence: number;
            stop_id: string;
            name: string | null;
            lat: number;
            lng: number;
          } => s.lat != null && s.lng != null,
        )
        // Skip campus bookends — DepotMarker + dashed return show the loop.
        .filter((s) => {
          if (!depot) return true;
          return (
            Math.abs(s.lat - depot.lat) > 1e-5 ||
            Math.abs(s.lng - depot.lng) > 1e-5
          );
        })
        .map((s) => ({
          id: `${route.id}-${s.stop_id}-${s.sequence}`,
          sequence: s.sequence,
          label: s.name ?? s.stop_id.slice(0, 8),
          lat: s.lat,
          lng: s.lng,
        }));
    });
    const points = [
      ...centroids.map((c) => ({ lat: c.lat, lng: c.lng })),
      ...polylines.flatMap((r) => r.positions),
      ...(depot ? [{ lat: depot.lat, lng: depot.lng }] : []),
    ];
    return {
      centroids,
      polylines,
      stopMarkers,
      depot,
      center: centerFromPoints(points),
    };
  }, [run]);

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  const proposed = run?.items.filter((i) =>
    ["proposed", "snapped"].includes(i.status),
  ).length;
  const review = run?.items.filter((i) => i.status === "needs_admin_review")
    .length;
  const campusCode =
    campuses.find((c) => c.id === (run?.campus_id ?? campusId))?.code ?? "";

  return (
    <PortalShell title="College admin" description="Cluster and confirm" nav={nav}>
      <PageHeader
        title="Planning"
        description="Pick the campus that has imported students and available buses, run a proposal, then confirm to lock routes."
        actions={
          <Button href="/admin/import" variant="outlined">
            Import students
          </Button>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Stack spacing={3}>
        <SectionCard title="Run proposal">
          <Stack spacing={2}>
            <TextField
              select
              label="Campus"
              value={campusId}
              onChange={(e) => {
                setCampusId(e.target.value);
                setBatchId("");
              }}
              helperText="Planning uses students and available buses on this campus only."
              fullWidth
            >
              {campuses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Import batch"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              helperText="Optional — leave empty to use all imported students on the campus."
              fullWidth
            >
              <MenuItem value="">All imported students on campus</MenuItem>
              {campusBatches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.filename} · {b.active_student_count ?? b.valid_count} active
                  {" / "}
                  {b.locked_student_count ?? 0} locked
                  {b.is_active ? " · active" : ""}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => void runPlanning()}
              disabled={!campusId || running}
              sx={{ alignSelf: "flex-start" }}
            >
              {running ? "Running…" : "Run clustering / assignment"}
            </Button>
          </Stack>
        </SectionCard>

        {runs.length > 0 ? (
          <SectionCard title="Previous runs">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Created</TableCell>
                    <TableCell>Campus</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id} hover selected={run?.id === r.id}>
                      <TableCell>
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {campuses.find((c) => c.id === r.campus_id)?.code ??
                          r.campus_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={r.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => void openRun(r.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : null}

        {run ? (
          <SectionCard
            title="Proposal result"
            actions={<StatusChip status={run.status} />}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {campusCode ? `${campusCode} · ` : ""}
              Run {run.id.slice(0, 8)} · routes {run.routes.length} · items{" "}
              {run.items.length}
              {typeof review === "number" ? ` · review ${review}` : ""}
              {run.status === "confirmed"
                ? " · pickups locked for students"
                : ""}
              {mapLayers?.depot
                ? " · solid path = outbound, dashed = return to campus"
                : ""}
            </Typography>
            {campusCode === "MAIN" &&
            campuses.some((c) => c.code === "RING") ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                This run is on campus MAIN. For PES Ring Road depot returns, view or
                re-run planning on campus RING.
              </Alert>
            ) : null}
            <PlanningProposalMap
              center={mapLayers?.center ?? null}
              centroids={mapLayers?.centroids ?? []}
              polylines={mapLayers?.polylines ?? []}
              stopMarkers={mapLayers?.stopMarkers ?? []}
              depot={mapLayers?.depot ?? null}
            />
            {run.routes.length > 0 ? (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Routes</Typography>
                {run.routes.map((route) => (
                  <Stack key={route.id} spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 600 }}>{route.name}</Typography>
                      <StatusChip status={route.status} />
                    </Stack>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width={72}>Seq</TableCell>
                            <TableCell>Stop</TableCell>
                            <TableCell>Lat</TableCell>
                            <TableCell>Lng</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...route.route_stops]
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((s) => (
                              <TableRow key={`${route.id}-${s.stop_id}-${s.sequence}`}>
                                <TableCell>{s.sequence}</TableCell>
                                <TableCell>
                                  {s.name ?? s.stop_id.slice(0, 8)}
                                </TableCell>
                                <TableCell>
                                  {s.lat != null ? s.lat.toFixed(5) : "—"}
                                </TableCell>
                                <TableCell>
                                  {s.lng != null ? s.lng.toFixed(5) : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                ))}
              </Stack>
            ) : null}
            {run.status === "proposed" ? (
              <Stack sx={{ mt: 2 }}>
                <PlanConfirmBar
                  routeCount={run.routes.length}
                  studentCount={proposed ?? 0}
                  stopCount={review ?? 0}
                  busCount={
                    new Set(
                      run.items.map((i) => i.bus_id).filter(Boolean),
                    ).size
                  }
                  loading={confirming}
                  onConfirm={() => void confirm()}
                  onReject={() => setRun(null)}
                />
              </Stack>
            ) : null}
          </SectionCard>
        ) : null}
      </Stack>
    </PortalShell>
  );
}

export default function AdminPlanningPage() {
  return (
    <Suspense
      fallback={
        <PortalShell title="College admin" nav={nav}>
          <Stack sx={{ py: 4, alignItems: "center" }}>
            <CircularProgress size={28} aria-label="Loading planning" />
          </Stack>
        </PortalShell>
      }
    >
      <AdminPlanningPageInner />
    </Suspense>
  );
}
