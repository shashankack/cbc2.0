"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
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
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusChip,
} from "@/features/ui";
import { apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Bus, Driver } from "@/types/api";

export default function AdminDriversPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [assignBusId, setAssignBusId] = useState<Record<string, string>>({});

  async function load(cid: string) {
    const [d, b] = await Promise.all([
      apiGet<Driver[]>(`/colleges/${cid}/drivers`),
      apiGet<Bus[]>(`/colleges/${cid}/buses`),
    ]);
    setDrivers(d);
    setBuses(b);
    const next: Record<string, string> = {};
    for (const driver of d) {
      next[driver.user_id] = driver.assigned_bus_id ?? "";
    }
    setAssignBusId(next);
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

  async function addDriver() {
    if (!collegeId || !email.trim()) return;
    try {
      await apiPost(`/colleges/${collegeId}/drivers`, {
        email: email.trim(),
        full_name: fullName.trim() || null,
      });
      setEmail("");
      setFullName("");
      setError(null);
      await load(collegeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add driver.");
    }
  }

  async function assignDriver(driver: Driver, busId: string) {
    if (!collegeId) return;
    try {
      if (!busId) {
        if (driver.assigned_bus_id) {
          await apiPatch(
            `/colleges/${collegeId}/buses/${driver.assigned_bus_id}`,
            { clear_driver: true },
          );
        }
      } else {
        await apiPatch(`/colleges/${collegeId}/buses/${busId}`, {
          driver_email: driver.email,
        });
      }
      setError(null);
      await load(collegeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed.");
    }
  }

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={[...ADMIN_NAV]}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="College admin" description="Driver roster" nav={[...ADMIN_NAV]}>
      <PageHeader
        title="Drivers"
        description="Add driver emails, then assign each driver to one bus for trip sessions."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard title="Roster">
          {drivers.length === 0 ? (
            <EmptyState
              title="No drivers yet"
              description="Add a driver email below. They sign in with OTP using that address."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Assigned bus</TableCell>
                    <TableCell align="right">Assign</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drivers.map((d) => (
                    <TableRow key={d.user_id} hover>
                      <TableCell>{d.full_name || "—"}</TableCell>
                      <TableCell>{d.email}</TableCell>
                      <TableCell>
                        {d.assigned_bus_registration ? (
                          <StatusChip
                            status="assigned"
                            label={d.assigned_bus_registration}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end", alignItems: "center" }}
                        >
                          <TextField
                            select
                            size="small"
                            label="Bus"
                            value={assignBusId[d.user_id] ?? ""}
                            onChange={(e) =>
                              setAssignBusId((prev) => ({
                                ...prev,
                                [d.user_id]: e.target.value,
                              }))
                            }
                            sx={{ minWidth: 180 }}
                          >
                            <MenuItem value="">Unassigned</MenuItem>
                            {buses.map((b) => (
                              <MenuItem key={b.id} value={b.id}>
                                {b.registration_number}
                                {b.driver_email && b.driver_email !== d.email
                                  ? ` (${b.driver_email})`
                                  : ""}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              void assignDriver(d, assignBusId[d.user_id] ?? "")
                            }
                          >
                            Save
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        <SectionCard title="Add driver">
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField
              label="Driver email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Full name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => void addDriver()}
              sx={{ alignSelf: "flex-start" }}
            >
              Add driver
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </PortalShell>
  );
}
