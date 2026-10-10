"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Bus, Campus } from "@/types/api";

const nav = [
  { href: "/admin", label: "Campuses" },
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/planning", label: "Planning" },
];

export default function AdminBusesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [driverEmail, setDriverEmail] = useState("");
  const [campusId, setCampusId] = useState("");

  async function load(cid: string) {
    const [b, c] = await Promise.all([
      apiGet<Bus[]>(`/colleges/${cid}/buses`),
      apiGet<Campus[]>(`/colleges/${cid}/campuses`),
    ]);
    setBuses(b);
    setCampuses(c);
    if (!campusId && c[0]) setCampusId(c[0].id);
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
    if (collegeId) {
      void load(collegeId).catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
    }
  }, [loading, user, collegeId, router]);

  async function createBus() {
    if (!collegeId || !campusId) return;
    try {
      await apiPost(`/colleges/${collegeId}/buses`, {
        campus_id: campusId,
        registration_number: registration,
        capacity: Number(capacity),
        driver_email: driverEmail || null,
      });
      await load(collegeId);
      setRegistration("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed.");
    }
  }

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="College admin" nav={nav}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Buses
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Campus ID"
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            helperText={campuses.map((c) => `${c.code}=${c.id}`).join(" · ")}
            fullWidth
          />
          <TextField
            label="Registration"
            value={registration}
            onChange={(e) => setRegistration(e.target.value)}
          />
          <TextField
            label="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <TextField
            label="Driver email"
            value={driverEmail}
            onChange={(e) => setDriverEmail(e.target.value)}
          />
          <Button variant="contained" onClick={() => void createBus()}>
            Add bus
          </Button>
        </Stack>
        <Stack spacing={1}>
          {buses.map((b) => (
            <Typography key={b.id}>
              {b.registration_number} · cap {b.capacity} · {b.status}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </PortalShell>
  );
}
