"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus } from "@/types/api";

const nav = [
  { href: "/admin", label: "Campuses" },
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/planning", label: "Planning" },
];

export default function AdminCampusesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Main");
  const [code, setCode] = useState("MAIN");
  const [domain, setDomain] = useState("");
  const [domainToken, setDomainToken] = useState<string | null>(null);

  const collegeId = user ? primaryCollegeId(user) : null;

  async function load(cid: string) {
    try {
      const rows = await apiGet<Campus[]>(`/colleges/${cid}/campuses`);
      setCampuses(rows);
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
      await apiPost(`/colleges/${collegeId}/campuses`, { name, code });
      await load(collegeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed.");
    }
  }

  async function saveSettings(campusId: string) {
    if (!collegeId) return;
    try {
      await apiPut(`/colleges/${collegeId}/campuses/${campusId}/settings`, {
        max_walk_to_stop_m: 500,
        cluster_eps_m: 400,
        cluster_min_samples: 3,
        min_students_per_route: 5,
      });
      await load(collegeId);
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
    <PortalShell title="College admin" nav={nav}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Campuses & domain
        </Typography>
        <Typography color="text.secondary">College ID: {collegeId}</Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField label="Campus name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button variant="contained" onClick={() => void createCampus()}>
            Create campus
          </Button>
        </Stack>

        <Stack spacing={1}>
          {campuses.map((c) => (
            <Stack
              key={c.id}
              direction="row"
              spacing={2}
              sx={{ alignItems: "center" }}
            >
              <Typography>
                {c.name} ({c.code}) — settings{" "}
                {c.settings ? "configured" : "missing"}
              </Typography>
              {!c.settings ? (
                <Button size="small" onClick={() => void saveSettings(c.id)}>
                  Apply default settings
                </Button>
              ) : null}
            </Stack>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Email domain"
            placeholder="college.edu"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <Button variant="outlined" onClick={() => void requestDomain()}>
            Request domain
          </Button>
        </Stack>
        {domainToken ? (
          <Alert severity="info">
            Give operator this domain id + TXT token: {domainToken}
          </Alert>
        ) : null}
      </Stack>
    </PortalShell>
  );
}
