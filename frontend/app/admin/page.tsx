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
import AdminDashboardHero from "@/features/admin/AdminDashboardHero";
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
          This email is not linked to a college yet. Ask the platform operator to
          approve your college application, then sign in again.
        </Alert>
      </PortalShell>
    );
  }

  const campusesWithDepot = campuses.filter(
    (c) => c.lat != null && c.lng != null,
  ).length;

  return (
    <PortalShell
      title="College admin"
      description="Campuses and student email domains"
      nav={nav}
    >
      <AdminDashboardHero
        collegeLabel={user.email}
        stats={[
          { label: "Campuses", value: campuses.length },
          { label: "Campus pin set", value: campusesWithDepot },
          {
            label: "Ready for routes",
            value: campusesWithDepot > 0 ? "Yes" : "No",
          },
        ]}
      />
      <PageHeader
        title="Campuses & student emails"
        description="Mark where each campus sits on the map. Every bus route will start and end there. You can search the map or use your phone’s location."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard
          title="Your campuses"
          description="Set a campus pin and route preferences before you upload students or plan buses."
        >
          {campuses.length === 0 ? (
            <EmptyState
              title="No campuses yet"
              description="Add a campus name and short code (for example Ring Road / RING), then place it on the map."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Short code</TableCell>
                    <TableCell>North–south (map)</TableCell>
                    <TableCell>East–west (map)</TableCell>
                    <TableCell>Status</TableCell>
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
                            placeholder="From map"
                            slotProps={{
                              htmlInput: {
                                "aria-label": `Map north-south for ${c.name}`,
                              },
                            }}
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
                            placeholder="From map"
                            slotProps={{
                              htmlInput: {
                                "aria-label": `Map east-west for ${c.name}`,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <StatusChip
                              status={depotOk ? "available" : "pending"}
                              label={depotOk ? "Campus pin set" : "Needs campus pin"}
                            />
                            <StatusChip
                              status={c.settings ? "active" : "pending"}
                              label={
                                c.settings
                                  ? "Route preferences saved"
                                  : "Needs route preferences"
                              }
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
                              Place on map
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void saveCoords(c.id)}
                            >
                              Save campus pin
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void saveSettings(c.id)}
                            >
                              {c.settings
                                ? "Update preferences"
                                : "Save preferences"}
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
            <Typography variant="subtitle2">
              How far students can walk & how pickups are grouped
            </Typography>
            <Typography variant="body2" color="text.secondary">
              These apply when you create routes for a campus. Defaults work for
              most colleges — change them only if needed.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Farthest walk to a stop (meters)"
                helperText="How far a student may walk from home to their pickup"
                value={maxWalk}
                onChange={(e) => setMaxWalk(e.target.value)}
                fullWidth
              />
              <TextField
                label="Group nearby homes within (meters)"
                helperText="Homes closer than this share one pickup stop"
                value={clusterEps}
                onChange={(e) => setClusterEps(e.target.value)}
                fullWidth
              />
              <TextField
                label="Minimum homes for a stop"
                helperText="Fewer than this stay as single pickups"
                value={minSamples}
                onChange={(e) => setMinSamples(e.target.value)}
                fullWidth
              />
              <TextField
                label="Minimum students on a bus"
                helperText="Smaller groups are merged when possible"
                value={minPerRoute}
                onChange={(e) => setMinPerRoute(e.target.value)}
                fullWidth
              />
            </Stack>
            <Typography variant="subtitle2">Add a campus</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Campus name"
                placeholder="e.g. Ring Road Campus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Short code"
                placeholder="e.g. RING"
                helperText="A short label used in lists"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
              />
              <TextField
                label="North–south (optional)"
                placeholder="Or use Place on map"
                value={createLat}
                onChange={(e) => setCreateLat(e.target.value)}
                fullWidth
              />
              <TextField
                label="East–west (optional)"
                placeholder="Or use Place on map"
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
                    title: "New campus pin",
                  })
                }
              >
                Place on map
              </Button>
              <Button variant="contained" onClick={() => void createCampus()}>
                Add campus
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Which emails belong to your college"
          description="Ask to approve your college email ending (like pes.edu). A platform operator must confirm it before students can sign in with those addresses."
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="College email ending"
              placeholder="e.g. pes.edu"
              helperText="The part after @ in student emails"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={() => void requestDomain()}>
              Request approval
            </Button>
          </Stack>
          {domainToken ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Send this reference to the platform operator so they can approve
                your email ending:
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
          Place campus on map — {depotTarget?.title ?? "Campus"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Search for your campus (for example PES University), use your
              current location, or tap the map. Saving sets where every bus route
              starts and ends.
            </Typography>
            {geoError ? <Alert severity="warning">{geoError}</Alert> : null}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                disabled={geoBusy}
                onClick={() => void useCurrentLocation()}
              >
                {geoBusy ? "Finding you…" : "Use my current location"}
              </Button>
              {pickerPoint ? (
                <Typography variant="body2" sx={{ alignSelf: "center" }}>
                  Pin selected
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ alignSelf: "center" }}
                >
                  No pin selected yet
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
            {geoBusy ? "Saving…" : "Save campus pin"}
          </Button>
        </DialogActions>
      </Dialog>
    </PortalShell>
  );
}
