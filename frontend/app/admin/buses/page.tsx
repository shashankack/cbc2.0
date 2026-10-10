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
import PortalShell from "@/features/shell/PortalShell";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusChip,
} from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Bus, Campus } from "@/types/api";

const nav = [
  { href: "/admin", label: "Campuses" },
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/emergency", label: "Emergency" },
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
      setError(null);
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
    <PortalShell title="College admin" description="Fleet capacity" nav={nav}>
      <PageHeader
        title="Buses"
        description="Assign a driver email to enable trip sessions."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard title="Fleet">
          {buses.length === 0 ? (
            <EmptyState
              title="No buses yet"
              description="Add a registration number, capacity, and optional driver email."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Registration</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Driver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {buses.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell>{b.registration_number}</TableCell>
                      <TableCell>{b.capacity}</TableCell>
                      <TableCell>
                        <StatusChip status={b.status} />
                      </TableCell>
                      <TableCell>
                        {b.driver_user_id ? (
                          <TypographyMono value={b.driver_user_id} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        <SectionCard title="Add bus">
          <Stack spacing={2}>
            <TextField
              label="Campus ID"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              helperText={campuses.map((c) => `${c.code}`).join(", ") || "Create a campus first"}
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Registration"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                fullWidth
              />
              <TextField
                label="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                fullWidth
              />
              <TextField
                label="Driver email"
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                fullWidth
              />
            </Stack>
            <Button
              variant="contained"
              onClick={() => void createBus()}
              sx={{ alignSelf: "flex-start" }}
            >
              Add bus
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </PortalShell>
  );
}

function TypographyMono({ value }: { value: string }) {
  return (
    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}>
      {value.slice(0, 8)}…
    </span>
  );
}
