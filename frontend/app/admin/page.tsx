"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ADMIN_NAV } from "@/features/admin/nav";
import { roundCoord } from "@/features/maps/geo";
import PortalShell from "@/features/shell/PortalShell";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusChip,
} from "@/features/ui";
import { apiGet, apiPatch, apiPost, apiPut, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus } from "@/types/api";

const nav = [...ADMIN_NAV];

const DepotLocationPicker = dynamic(
  () => import("@/features/maps/DepotLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <Stack sx={{ height: 360, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} aria-label="Loading map" />
      </Stack>
    ),
  },
);

type DepotTarget =
  | { kind: "campus"; campusId: string; title: string }
  | { kind: "create"; title: string };

function readBrowserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: roundCoord(pos.coords.latitude),
          lng: roundCoord(pos.coords.longitude),
        }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied."
              : "Could not read current location.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function AdminCampusesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Main");
  const [code, setCode] = useState("MAIN");
  const [createLat, setCreateLat] = useState("");
  const [createLng, setCreateLng] = useState("");
  const [domain, setDomain] = useState("");
  const [domainToken, setDomainToken] = useState<string | null>(null);
  const [maxWalk, setMaxWalk] = useState("800");
  const [clusterEps, setClusterEps] = useState("500");
  const [minSamples, setMinSamples] = useState("2");
  const [minPerRoute, setMinPerRoute] = useState("2");
  const [coordDrafts, setCoordDrafts] = useState<
    Record<string, { lat: string; lng: string }>
  >({});
  const [depotTarget, setDepotTarget] = useState<DepotTarget | null>(null);
  const [pickerPoint, setPickerPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const collegeId = user ? primaryCollegeId(user) : null;

  async function load(cid: string) {
    try {
      const rows = await apiGet<Campus[]>(`/colleges/${cid}/campuses`);
      setCampuses(rows);
      const next: Record<string, { lat: string; lng: string }> = {};
      for (const c of rows) {
        next[c.id] = {
          lat: c.lat != null ? String(c.lat) : "",
          lng: c.lng != null ? String(c.lng) : "",
        };
      }
      setCoordDrafts(next);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Load failed.");
    }
  }

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
    if (collegeId) void load(collegeId);
  }, [loading, user, collegeId, router]);

  function openDepotPicker(target: DepotTarget) {
    setGeoError(null);
    if (target.kind === "campus") {
      const draft = coordDrafts[target.campusId];
      const lat = draft?.lat ? Number(draft.lat) : NaN;
      const lng = draft?.lng ? Number(draft.lng) : NaN;
      setPickerPoint(
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      );
    } else {
      const lat = createLat ? Number(createLat) : NaN;
      const lng = createLng ? Number(createLng) : NaN;
      setPickerPoint(
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      );
    }
    setDepotTarget(target);
  }

  async function applyPicker() {
    if (!depotTarget || !pickerPoint) {
      setGeoError("Click the map or use current location first.");
      return;
    }
    const lat = String(pickerPoint.lat);
    const lng = String(pickerPoint.lng);
    if (depotTarget.kind === "campus") {
      const campusId = depotTarget.campusId;
      setCoordDrafts((prev) => ({
        ...prev,
        [campusId]: { lat, lng },
      }));
      // Persist immediately — planning reads DB coords, not the draft fields.
      if (!collegeId) return;
      setGeoBusy(true);
      try {
        await apiPatch(`/colleges/${collegeId}/campuses/${campusId}`, {
          lat: pickerPoint.lat,
          lng: pickerPoint.lng,
        });
        await load(collegeId);
        setDepotTarget(null);
        setGeoError(null);
        setError(null);
      } catch (err) {
        setGeoError(
          err instanceof ApiError
            ? err.message
            : "Could not save depot. Coordinates are in the form — click Save.",
        );
      } finally {
        setGeoBusy(false);
      }
      return;
    }
    setCreateLat(lat);
    setCreateLng(lng);
    setDepotTarget(null);
    setGeoError(null);
  }

  async function useCurrentLocation() {
    setGeoBusy(true);
    setGeoError(null);
    try {
      const point = await readBrowserLocation();
      setPickerPoint(point);
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "Location failed.");
    } finally {
      setGeoBusy(false);
    }
  }

  async function createCampus() {
    if (!collegeId) return;
    try {
      const body: {
        name: string;
        code: string;
        lat?: number;
        lng?: number;
      } = { name, code };
      if (createLat.trim() && createLng.trim()) {
        body.lat = Number(createLat);
        body.lng = Number(createLng);
      }
      await apiPost(`/colleges/${collegeId}/campuses`, body);
      await load(collegeId);
      setCreateLat("");
      setCreateLng("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed.");
    }
  }

  async function saveCoords(campusId: string) {
    if (!collegeId) return;
    const draft = coordDrafts[campusId];
    if (!draft?.lat.trim() || !draft?.lng.trim()) {
      setError("Campus lat and lng are both required for the depot.");
      return;
    }
    try {
      await apiPatch(`/colleges/${collegeId}/campuses/${campusId}`, {
        lat: Number(draft.lat),
        lng: Number(draft.lng),
      });
      await load(collegeId);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Coords update failed.");
    }
  }

  async function saveSettings(campusId: string) {
    if (!collegeId) return;
    try {
      await apiPut(`/colleges/${collegeId}/campuses/${campusId}/settings`, {
        max_walk_to_stop_m: Number(maxWalk),
        cluster_eps_m: Number(clusterEps),
        cluster_min_samples: Number(minSamples),
        min_students_per_route: Number(minPerRoute),
      });
      await load(collegeId);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Settings failed.");
    }
  }

  async function requestDomain() {
    if (!collegeId) return;
    try {
      const row = await apiPost<{ id: string; dns_txt_token: string }>(
        `/colleges/${collegeId}/domains`,
        { domain },
      );
      setDomainToken(`${row.id} · ${row.dns_txt_token}`);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Domain request failed.");
    }
  }

  if (loading || !user) {
    return null;
  }

  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav}>
        <Alert severity="warning">
          No college membership is linked to this account yet. Approve a college
          application with this email as admin, then sign in again.
        </Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="College admin"
      description="Campuses, settings, and domains"
      nav={nav}
    >
      <PageHeader
        title="Campuses & domain"
        description="Set campus depot coordinates so every planned route starts and ends at campus. Use the map or your current location."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard
          title="Campuses"
          description="Depot lat/lng and planning settings are required before import and planning."
        >
          {campuses.length === 0 ? (
            <EmptyState
              title="No campuses yet"
              description="Create a campus code (for example MAIN) with depot coordinates."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Depot lat</TableCell>
                    <TableCell>Depot lng</TableCell>
                    <TableCell>Settings</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campuses.map((c) => {
                    const draft = coordDrafts[c.id] ?? { lat: "", lng: "" };
                    const depotOk = c.lat != null && c.lng != null;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.code}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            size="small"
                            value={draft.lat}
                            onChange={(e) =>
                              setCoordDrafts((prev) => ({
                                ...prev,
                                [c.id]: { ...draft, lat: e.target.value },
                              }))
                            }
                            placeholder="12.93424"
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            size="small"
                            value={draft.lng}
                            onChange={(e) =>
                              setCoordDrafts((prev) => ({
                                ...prev,
                                [c.id]: { ...draft, lng: e.target.value },
                              }))
                            }
                            placeholder="77.53432"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <StatusChip
                              status={depotOk ? "available" : "pending"}
                              label={depotOk ? "depot set" : "depot missing"}
                            />
                            <StatusChip
                              status={c.settings ? "active" : "pending"}
                              label={c.settings ? "settings ok" : "settings missing"}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                openDepotPicker({
                                  kind: "campus",
                                  campusId: c.id,
                                  title: `${c.name} (${c.code})`,
                                })
                              }
                            >
                              Map / locate
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void saveCoords(c.id)}
                            >
                              Save depot
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void saveSettings(c.id)}
                            >
                              {c.settings ? "Update settings" : "Save settings"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Planning settings (applied per campus)</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Max walk to stop (m)"
                value={maxWalk}
                onChange={(e) => setMaxWalk(e.target.value)}
                fullWidth
              />
              <TextField
                label="Cluster eps (m)"
                value={clusterEps}
                onChange={(e) => setClusterEps(e.target.value)}
                fullWidth
              />
              <TextField
                label="Min samples"
                value={minSamples}
                onChange={(e) => setMinSamples(e.target.value)}
                fullWidth
              />
              <TextField
                label="Min students / route"
                value={minPerRoute}
                onChange={(e) => setMinPerRoute(e.target.value)}
                fullWidth
              />
            </Stack>
            <Typography variant="subtitle2">Create campus</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Campus name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
              />
              <TextField
                label="Depot lat"
                value={createLat}
                onChange={(e) => setCreateLat(e.target.value)}
                fullWidth
              />
              <TextField
                label="Depot lng"
                value={createLng}
                onChange={(e) => setCreateLng(e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={() =>
                  openDepotPicker({
                    kind: "create",
                    title: "New campus depot",
                  })
                }
              >
                Map / locate depot
              </Button>
              <Button variant="contained" onClick={() => void createCampus()}>
                Create campus
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Email domain"
          description="Request a domain, then ask the platform operator to approve it."
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Email domain"
              placeholder="college.edu"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={() => void requestDomain()}>
              Request domain
            </Button>
          </Stack>
          {domainToken ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Give the operator this domain id + TXT token:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 0.5 }}>
                {domainToken}
              </Typography>
            </Alert>
          ) : null}
        </SectionCard>
      </Stack>

      <Dialog
        open={depotTarget != null}
        onClose={() => setDepotTarget(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Set depot — {depotTarget?.title ?? "Campus"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Search for a place (e.g. PES University), use your current location,
              or click the map. Apply saves the depot to this campus immediately
              so planning uses the same pin.
            </Typography>
            {geoError ? <Alert severity="warning">{geoError}</Alert> : null}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                disabled={geoBusy}
                onClick={() => void useCurrentLocation()}
              >
                {geoBusy ? "Locating…" : "Use current location"}
              </Button>
              {pickerPoint ? (
                <Typography variant="body2" sx={{ alignSelf: "center" }}>
                  {pickerPoint.lat.toFixed(6)}, {pickerPoint.lng.toFixed(6)}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ alignSelf: "center" }}
                >
                  No point selected yet
                </Typography>
              )}
            </Stack>
            {depotTarget ? (
              <DepotLocationPicker
                value={pickerPoint}
                onChange={setPickerPoint}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepotTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={geoBusy || !pickerPoint}
            onClick={() => void applyPicker()}
          >
            {geoBusy ? "Saving…" : "Apply & save depot"}
          </Button>
        </DialogActions>
      </Dialog>
    </PortalShell>
  );
}
