"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { adminShellNav } from "@/features/admin/nav";
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
import type { Bus, Campus, Driver } from "@/types/api";

const { nav, navSections } = adminShellNav();

/** Admin-settable fleet statuses (in_service is trip-managed). */
const ADMIN_BUS_STATUSES = [
  { value: "available", label: "Ready to use" },
  { value: "unavailable", label: "Out of service (maintenance)" },
] as const;

function statusLabel(status: string): string {
  if (status === "unavailable") return "Out of service (maintenance)";
  if (status === "in_service") return "On a trip";
  if (status === "available") return "Ready to use";
  return status.replaceAll("_", " ");
}

export default function AdminBusesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [registration, setRegistration] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [driverEmail, setDriverEmail] = useState("");
  const [campusId, setCampusId] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, { status: string; capacity: string; driver_email: string }>
  >({});

  async function load(cid: string) {
    const [b, c, d] = await Promise.all([
      apiGet<Bus[]>(`/colleges/${cid}/buses`),
      apiGet<Campus[]>(`/colleges/${cid}/campuses`),
      apiGet<Driver[]>(`/colleges/${cid}/drivers`),
    ]);
    setBuses(b);
    setCampuses(c);
    setDrivers(d);
    if (!campusId && c[0]) setCampusId(c[0].id);
    const next: typeof drafts = {};
    for (const bus of b) {
      next[bus.id] = {
        status: bus.status === "in_service" ? "in_service" : bus.status,
        capacity: String(bus.capacity),
        driver_email: bus.driver_email ?? "",
      };
    }
    setDrafts(next);
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
      setDriverEmail("");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed.");
    }
  }

  async function setBusStatus(bus: Bus, status: "available" | "unavailable") {
    if (!collegeId) return;
    setBusyId(bus.id);
    try {
      await apiPatch(`/colleges/${collegeId}/buses/${bus.id}`, { status });
      setError(null);
      await load(collegeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function proposeDisruption(bus: Bus) {
    if (!collegeId) return;
    setBusyId(bus.id);
    try {
      const result = await apiPost<{
        affected_count: number;
        emergency_reallocation_id: string | null;
        note?: string | null;
      }>(`/colleges/${collegeId}/buses/${bus.id}/disruption-proposal`);
      setError(null);
      await load(collegeId);
      if (result.emergency_reallocation_id) {
        window.alert(
          `Disruption proposal created for ${result.affected_count} students. Open Admin → Disruptions to confirm reassignment.`,
        );
      } else {
        window.alert(result.note ?? "Bus marked unavailable.");
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Disruption proposal failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveBus(bus: Bus) {
    if (!collegeId) return;
    const draft = drafts[bus.id];
    if (!draft) return;
    setBusyId(bus.id);
    try {
      const body: {
        status?: string;
        capacity: number;
        driver_email?: string | null;
        clear_driver?: boolean;
      } = {
        capacity: Number(draft.capacity),
      };
      if (draft.status === "available" || draft.status === "unavailable") {
        body.status = draft.status;
      }
      if (!draft.driver_email.trim()) {
        body.clear_driver = true;
      } else {
        body.driver_email = draft.driver_email.trim();
      }
      await apiPatch(`/colleges/${collegeId}/buses/${bus.id}`, body);
      setError(null);
      await load(collegeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav} navSections={navSections}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  const unavailableCount = buses.filter((b) => b.status === "unavailable").length;
  const availableCount = buses.filter((b) => b.status === "available").length;
  const inServiceCount = buses.filter((b) => b.status === "in_service").length;

  return (
    <PortalShell title="College admin" nav={nav} navSections={navSections}>
      <PageHeader
        title="Buses"
        description="Seats, drivers, and availability — one driver per bus."
        actions={
          <Button href="/admin/drivers" variant="outlined">
            Drivers
          </Button>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={2.5}>
        <SectionCard title="Your buses">
          {buses.length === 0 ? (
            <EmptyState
              title="No buses yet"
              description="Add a number plate, seat count, and optionally a driver."
            />
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {availableCount} ready · {unavailableCount} out of service ·{" "}
                {inServiceCount} on a trip
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Number plate</TableCell>
                      <TableCell>Campus</TableCell>
                      <TableCell>Seats</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buses.map((b) => {
                      const draft = drafts[b.id] ?? {
                        status: b.status,
                        capacity: String(b.capacity),
                        driver_email: b.driver_email ?? "",
                      };
                      const selectValue =
                        draft.status === "in_service"
                          ? "in_service"
                          : draft.status === "unavailable"
                            ? "unavailable"
                            : "available";
                      const rowBusy = busyId === b.id;
                      return (
                        <TableRow key={b.id} hover>
                          <TableCell>{b.registration_number}</TableCell>
                          <TableCell>
                            {b.campus_code ?? b.campus_id.slice(0, 8)}
                          </TableCell>
                          <TableCell sx={{ minWidth: 96 }}>
                            <TextField
                              size="small"
                              value={draft.capacity}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...draft, capacity: e.target.value },
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack spacing={1}>
                              <TextField
                                select
                                size="small"
                                label="Availability"
                                value={selectValue}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [b.id]: {
                                      ...draft,
                                      status: e.target.value,
                                    },
                                  }))
                                }
                                fullWidth
                                helperText={
                                  b.status === "in_service"
                                    ? "On a trip — can still mark out of service"
                                    : undefined
                                }
                              >
                                {b.status === "in_service" ? (
                                  <MenuItem value="in_service" disabled>
                                    <StatusChip
                                      status="in_service"
                                      label={statusLabel("in_service")}
                                    />
                                  </MenuItem>
                                ) : null}
                                {ADMIN_BUS_STATUSES.map((s) => (
                                  <MenuItem key={s.value} value={s.value}>
                                    <StatusChip
                                      status={s.value}
                                      label={s.label}
                                    />
                                  </MenuItem>
                                ))}
                              </TextField>
                              <ButtonGroup size="small" variant="outlined">
                                <Button
                                  disabled={rowBusy}
                                  onClick={() => void proposeDisruption(b)}
                                >
                                  Bus problem → reassign
                                </Button>
                                <Button
                                  disabled={
                                    rowBusy || b.status === "unavailable"
                                  }
                                  onClick={() =>
                                    void setBusStatus(b, "unavailable")
                                  }
                                >
                                  Mark out of service
                                </Button>
                                <Button
                                  disabled={
                                    rowBusy || b.status === "available"
                                  }
                                  onClick={() =>
                                    void setBusStatus(b, "available")
                                  }
                                >
                                  Mark ready
                                </Button>
                              </ButtonGroup>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <TextField
                              select
                              size="small"
                              value={draft.driver_email}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: {
                                    ...draft,
                                    driver_email: e.target.value,
                                  },
                                }))
                              }
                              fullWidth
                            >
                              <MenuItem value="">Unassigned</MenuItem>
                              {drivers.map((d) => (
                                <MenuItem key={d.user_id} value={d.email}>
                                  {d.email}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              disabled={rowBusy}
                              onClick={() => void saveBus(b)}
                            >
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </SectionCard>

        <Accordion
          defaultExpanded={buses.length === 0}
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Add a bus</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Campus"
                size="small"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                helperText={
                  campuses.length ? undefined : "Add a campus on Home first"
                }
                fullWidth
              >
                {campuses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  label="Number plate"
                  size="small"
                  placeholder="e.g. KA01PE1001"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Seats"
                  size="small"
                  placeholder="e.g. 55"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  fullWidth
                />
                <TextField
                  select
                  label="Driver"
                  size="small"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">None yet</MenuItem>
                  {drivers.map((d) => (
                    <MenuItem key={d.user_id} value={d.email}>
                      {d.email}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Button
                variant="contained"
                onClick={() => void createBus()}
                sx={{ alignSelf: "flex-start" }}
              >
                Add bus
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </PortalShell>
  );
}
