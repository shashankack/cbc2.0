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
import {
  formatApproxDistance,
  formatApproxMinutes,
} from "@/components/maps/approxLabels";
import {
  PlanConfirmBar,
  PlanStopEditor,
  type PlanEditMode,
} from "@/components/planning";
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import {
  approxMinutesFromMeters,
  centerFromPoints,
  haversineMeters,
  roundCoord,
  routesToPolylines,
  stopsToMarkers,
} from "@/features/maps";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus, ImportBatch, PlanningRun, Student } from "@/types/api";

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
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [assignStopByItem, setAssignStopByItem] = useState<Record<string, string>>(
    {},
  );
  const [assignBusy, setAssignBusy] = useState<string | null>(null);

  const [editMode, setEditMode] = useState<PlanEditMode>(null);
  const [draftPoint, setDraftPoint] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [stopName, setStopName] = useState("");
  const [routeIdForNew, setRouteIdForNew] = useState("");
  const [absorbStopId, setAbsorbStopId] = useState("");
  const [intoStopId, setIntoStopId] = useState("");
  const [splitStopId, setSplitStopId] = useState("");
  const [splitStudentIds, setSplitStudentIds] = useState<string[]>([]);
  const [editBusy, setEditBusy] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

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
      apiGet<Student[]>(`/colleges/${collegeId}/students`),
    ])
      .then(async ([campusRows, batchRows, runRows, studentRows]) => {
        setCampuses(campusRows);
        setBatches(batchRows);
        setRuns(runRows);
        setStudents(studentRows);
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
          if (detail.routes[0]) setRouteIdForNew(detail.routes[0].id);
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

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const editorStops = useMemo(() => {
    if (!run) return [];
    return run.stops
      .filter((s) => s.source !== "campus")
      .map((s) => ({
        id: s.id,
        name: s.name,
        studentCount: run.items.filter((i) => i.stop_id === s.id).length,
      }));
  }, [run]);

  const studentsOnSplitStop = useMemo(() => {
    if (!run || !splitStopId) return [];
    return run.items
      .filter((i) => i.stop_id === splitStopId)
      .map((i) => {
        const st = studentById.get(i.student_id);
        return {
          id: i.student_id,
          label: st
            ? `${st.full_name} (${st.srn})`
            : `Student ${i.student_id.slice(0, 8)}…`,
        };
      });
  }, [run, splitStopId, studentById]);

  const draftLabel = draftPoint
    ? `${draftPoint.lat.toFixed(5)}, ${draftPoint.lng.toFixed(5)}`
    : null;

  function resetEditDraft() {
    setDraftPoint(null);
    setStopName("");
    setAbsorbStopId("");
    setIntoStopId("");
    setSplitStopId("");
    setSplitStudentIds([]);
  }

  function changeEditMode(mode: PlanEditMode) {
    setEditMode(mode);
    resetEditDraft();
    if (mode === "place" && run?.routes[0] && !routeIdForNew) {
      setRouteIdForNew(run.routes[0].id);
    }
  }

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
      setRouteIdForNew(result.routes[0]?.id ?? "");
      changeEditMode(null);
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
      setRouteIdForNew(detail.routes[0]?.id ?? "");
      changeEditMode(null);
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
      changeEditMode(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Confirm failed.");
    } finally {
      setConfirming(false);
    }
  }

  async function createManualStop() {
    if (!collegeId || !run || !draftPoint || !routeIdForNew) return;
    setEditBusy(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/stops`,
        {
          name: stopName.trim(),
          lat: draftPoint.lat,
          lng: draftPoint.lng,
          route_id: routeIdForNew,
        },
      );
      setRun(result);
      resetEditDraft();
      setEditMode(null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create stop failed.");
    } finally {
      setEditBusy(false);
    }
  }

  async function combineStops() {
    if (!collegeId || !run || !absorbStopId || !intoStopId) return;
    setEditBusy(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/stops/merge`,
        { keep_stop_id: intoStopId, merge_stop_id: absorbStopId },
      );
      setRun(result);
      resetEditDraft();
      setEditMode(null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Combine failed.");
    } finally {
      setEditBusy(false);
    }
  }

  function onSplitStopPicked(stopId: string) {
    setSplitStopId(stopId);
    setSplitStudentIds([]);
    const stop = run?.stops.find((s) => s.id === stopId);
    if (!stop) return;
    setStopName(`${stop.name} B`);
    setDraftPoint(null);
  }

  async function splitStop() {
    if (!collegeId || !run || !splitStopId || !stopName.trim()) return;
    if (!splitStudentIds.length) {
      setError("Select at least one student to move.");
      return;
    }
    const source = run.stops.find((s) => s.id === splitStopId);
    if (!source) return;
    const lat = draftPoint?.lat ?? roundCoord(source.lat + 0.0004);
    const lng = draftPoint?.lng ?? roundCoord(source.lng + 0.0004);
    setEditBusy(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/stops/split`,
        {
          stop_id: splitStopId,
          name: stopName.trim(),
          lat,
          lng,
          student_ids: splitStudentIds,
        },
      );
      setRun(result);
      resetEditDraft();
      setEditMode(null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Split failed.");
    } finally {
      setEditBusy(false);
    }
  }

  async function movePickup(routeId: string, stopId: string, dir: -1 | 1) {
    if (!collegeId || !run) return;
    const route = run.routes.find((r) => r.id === routeId);
    if (!route) return;
    const pickups = [...route.route_stops]
      .sort((a, b) => a.sequence - b.sequence)
      .filter((s) => {
        const stop = run.stops.find((st) => st.id === s.stop_id);
        return stop?.source !== "campus";
      })
      .map((s) => s.stop_id);
    const idx = pickups.indexOf(stopId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= pickups.length) return;
    const next = [...pickups];
    const tmp = next[idx]!;
    next[idx] = next[swap]!;
    next[swap] = tmp;
    setEditBusy(true);
    try {
      const result = await apiPut<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/routes/${routeId}/stops`,
        { stop_ids: next },
      );
      setRun(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reorder failed.");
    } finally {
      setEditBusy(false);
    }
  }

  async function assignReviewItem(itemId: string) {
    if (!collegeId || !run) return;
    const stopId = assignStopByItem[itemId];
    if (!stopId) {
      setError("Pick a stop for this student first.");
      return;
    }
    const routeWithStop = run.routes.find((r) =>
      r.route_stops.some((s) => s.stop_id === stopId),
    );
    setAssignBusy(itemId);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/items/${itemId}/assign-stop`,
        {
          stop_id: stopId,
          route_id: routeWithStop?.id ?? null,
          bus_id:
            run.items.find(
              (i) => i.route_id === routeWithStop?.id && i.bus_id,
            )?.bus_id ?? null,
        },
      );
      setRun(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed.");
    } finally {
      setAssignBusy(null);
    }
  }

  const mapLayers = useMemo(() => {
    if (!run) return null;
    const depotStop = run.stops.find((s) => s.source === "campus");
    const depot =
      depotStop != null
        ? {
            lat: depotStop.lat,
            lng: depotStop.lng,
            label:
              "name" in depotStop && depotStop.name
                ? depotStop.name
                : "Campus pin",
          }
        : null;
    const centroids = run.stops
      .filter((s) => s.source !== "campus")
      .map((s) => ({
        id: s.id,
        label: `${s.name} (${run.items.filter((i) => i.stop_id === s.id).length})`,
        lat: s.lat,
        lng: s.lng,
      }));
    const polylines = routesToPolylines(run.routes);
    const stopMarkers = run.routes.flatMap((route) => {
      const ordered = [...route.route_stops]
        .sort((a, b) => a.sequence - b.sequence)
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
        );
      return stopsToMarkers(
        ordered.map((s) => ({
          stop_id: `${route.id}-${s.stop_id}`,
          sequence: s.sequence,
          name: s.name ?? s.stop_id.slice(0, 8),
          lat: s.lat,
          lng: s.lng,
        })),
      ).filter((s) => {
        if (!depot) return true;
        return (
          Math.abs(s.lat - depot.lat) > 1e-5 ||
          Math.abs(s.lng - depot.lng) > 1e-5
        );
      });
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
    <PortalShell title="College admin" description="Build and lock bus routes" nav={nav}>
      <PageHeader
        title="Plan bus routes"
        description="Choose a campus that already has uploaded students and ready buses. Create a draft plan, adjust stops if needed, then confirm to lock pickups for students."
        actions={
          <Button href="/admin/import" variant="outlined">
            Upload students
          </Button>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Stack spacing={3}>
        <SectionCard title="Create a draft plan">
          <Stack spacing={2}>
            <TextField
              select
              label="Campus"
              value={campusId}
              onChange={(e) => {
                setCampusId(e.target.value);
                setBatchId("");
              }}
              fullWidth
              helperText="Only students and buses for this campus are used."
            >
              {campuses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Which student list?"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              fullWidth
              helperText="Optional — leave as “All students” to include everyone uploaded for this campus."
            >
              <MenuItem value="">All students on this campus</MenuItem>
              {campusBatches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {new Date(b.created_at).toLocaleString()}
                  {b.valid_count != null ? ` · ${b.valid_count} students` : ""}
                  {b.is_active ? " · ready to plan" : ""}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => void runPlanning()}
              disabled={!campusId || running}
              sx={{ alignSelf: "flex-start" }}
            >
              {running ? "Building plan…" : "Build draft routes"}
            </Button>
          </Stack>
        </SectionCard>

        {runs.length > 0 ? (
          <SectionCard title="Earlier plans">
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
            title="Draft plan"
            actions={<StatusChip status={run.status} />}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {campusCode ? `${campusCode} · ` : ""}
              {run.routes.length} bus routes · {run.items.length} students
              {typeof review === "number" && review > 0
                ? ` · ${review} need your review`
                : ""}
              {run.status === "confirmed"
                ? " · pickups are locked for students"
                : ""}
            </Typography>
            {campusCode === "MAIN" &&
            campuses.some((c) => c.code === "RING") ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                This plan is for campus MAIN. For Ring Road campus routes, open or
                rebuild a plan on campus RING.
              </Alert>
            ) : null}

            {run.status === "proposed" ? (
              <Stack sx={{ mb: 2 }}>
                <PlanStopEditor
                  mode={editMode}
                  onModeChange={changeEditMode}
                  stops={editorStops}
                  routes={run.routes.map((r) => ({ id: r.id, name: r.name }))}
                  studentsOnSplitStop={studentsOnSplitStop}
                  draftLabel={draftLabel}
                  busy={editBusy}
                  stopName={stopName}
                  onStopNameChange={setStopName}
                  routeId={routeIdForNew}
                  onRouteIdChange={setRouteIdForNew}
                  onCreateStop={() => void createManualStop()}
                  absorbStopId={absorbStopId}
                  intoStopId={intoStopId}
                  onAbsorbStopIdChange={setAbsorbStopId}
                  onIntoStopIdChange={setIntoStopId}
                  onCombine={() => void combineStops()}
                  splitStopId={splitStopId}
                  onSplitStopIdChange={onSplitStopPicked}
                  splitStudentIds={splitStudentIds}
                  onSplitStudentIdsChange={setSplitStudentIds}
                  onSplit={() => void splitStop()}
                />
              </Stack>
            ) : null}

            {mapReady ? (
              <PlanningProposalMap
                center={mapLayers?.center ?? null}
                centroids={mapLayers?.centroids ?? []}
                polylines={mapLayers?.polylines ?? []}
                stopMarkers={mapLayers?.stopMarkers ?? []}
                depot={mapLayers?.depot ?? null}
                pickMode={editMode === "place" || editMode === "split"}
                draftPoint={draftPoint}
                onMapPick={(p) =>
                  setDraftPoint({
                    lat: roundCoord(p.lat),
                    lng: roundCoord(p.lng),
                  })
                }
              />
            ) : (
              <Stack
                sx={{
                  height: 420,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={28} aria-label="Loading map" />
              </Stack>
            )}

            {run.routes.length > 0 ? (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Stop order on each bus</Typography>
                <Typography variant="body2" color="text.secondary">
                  Use ↑ ↓ to move a pickup earlier or later. The campus start and
                  end stay fixed.
                </Typography>
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
                            <TableCell width={56}>#</TableCell>
                            <TableCell>Stop</TableCell>
                            <TableCell>Students</TableCell>
                            <TableCell>From prev</TableCell>
                            {run.status === "proposed" ? (
                              <TableCell align="right">Order</TableCell>
                            ) : null}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...route.route_stops]
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((s, idx, ordered) => {
                              const stopMeta = run.stops.find(
                                (st) => st.id === s.stop_id,
                              );
                              const isCampus = stopMeta?.source === "campus";
                              const studentCount = isCampus
                                ? 0
                                : run.items.filter((i) => i.stop_id === s.stop_id)
                                    .length;
                              const prev = idx > 0 ? ordered[idx - 1] : null;
                              const distM =
                                prev != null &&
                                prev.lat != null &&
                                prev.lng != null &&
                                s.lat != null &&
                                s.lng != null
                                  ? Math.round(
                                      haversineMeters(
                                        { lat: prev.lat, lng: prev.lng },
                                        { lat: s.lat, lng: s.lng },
                                      ),
                                    )
                                  : null;
                              return (
                                <TableRow
                                  key={`${route.id}-${s.stop_id}-${s.sequence}`}
                                >
                                  <TableCell>{s.sequence}</TableCell>
                                  <TableCell>
                                    {s.name ?? s.stop_id.slice(0, 8)}
                                    {isCampus ? " (campus)" : ""}
                                  </TableCell>
                                  <TableCell>
                                    {isCampus ? "—" : studentCount}
                                  </TableCell>
                                  <TableCell>
                                    {distM != null
                                      ? `${formatApproxDistance(distM)} · ${formatApproxMinutes(approxMinutesFromMeters(distM))}`
                                      : "—"}
                                  </TableCell>
                                  {run.status === "proposed" ? (
                                    <TableCell align="right">
                                      {isCampus ? (
                                        "—"
                                      ) : (
                                        <Stack
                                          direction="row"
                                          spacing={0.5}
                                          sx={{ justifyContent: "flex-end" }}
                                        >
                                          <Button
                                            size="small"
                                            disabled={editBusy}
                                            onClick={() =>
                                              void movePickup(
                                                route.id,
                                                s.stop_id,
                                                -1,
                                              )
                                            }
                                          >
                                            ↑
                                          </Button>
                                          <Button
                                            size="small"
                                            disabled={editBusy}
                                            onClick={() =>
                                              void movePickup(
                                                route.id,
                                                s.stop_id,
                                                1,
                                              )
                                            }
                                          >
                                            ↓
                                          </Button>
                                        </Stack>
                                      )}
                                    </TableCell>
                                  ) : null}
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                ))}
              </Stack>
            ) : null}

            {run.status === "proposed" &&
            run.items.some((i) => i.status === "needs_admin_review") ? (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Needs admin review</Typography>
                <Typography variant="body2" color="text.secondary">
                  These students were not packed onto a stop. Assign each to a
                  pickup before confirm.
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Assign stop</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {run.items
                        .filter((i) => i.status === "needs_admin_review")
                        .map((item) => {
                          const st = studentById.get(item.student_id);
                          return (
                            <TableRow key={item.id} hover>
                              <TableCell>
                                {st
                                  ? `${st.full_name} (${st.srn})`
                                  : `${item.student_id.slice(0, 8)}…`}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  select
                                  size="small"
                                  label="Stop"
                                  value={assignStopByItem[item.id] ?? ""}
                                  onChange={(e) =>
                                    setAssignStopByItem((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  fullWidth
                                >
                                  {run.stops
                                    .filter((s) => s.source !== "campus")
                                    .map((s) => (
                                      <MenuItem key={s.id} value={s.id}>
                                        {s.name}
                                      </MenuItem>
                                    ))}
                                </TextField>
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={assignBusy === item.id}
                                  onClick={() => void assignReviewItem(item.id)}
                                >
                                  {assignBusy === item.id ? "Saving…" : "Assign"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
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
