"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
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
        description="Set campus depot coordinates so every planned route starts and ends at campus."
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
                            placeholder="12.9345"
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
                            placeholder="77.6050"
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
    </PortalShell>
  );
}
