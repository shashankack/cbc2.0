"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { resolveHomePath, useAuth } from "@/lib/auth";
import type { CollegeApplication } from "@/types/api";

const NAV = [
  { href: "/operator", label: "Colleges" },
  { href: "/operator/domains", label: "Domains" },
];

export default function OperatorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<CollegeApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    college_name: "",
    slug: "",
    applicant_email: "",
    applicant_full_name: "",
  });

  async function load() {
    try {
      const data = await apiGet<CollegeApplication[]>(
        "/operator/college-applications",
      );
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load.");
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.is_platform_operator) {
      router.replace(resolveHomePath(user));
      return;
    }
    void load();
  }, [loading, user, router]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await apiPost(`/operator/college-applications/${id}/approve`, {});
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await apiPost(`/operator/college-applications/${id}/reject`, {
        notes: "Rejected by operator",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitPublic(event: FormEvent) {
    event.preventDefault();
    try {
      await apiPost("/operator/college-applications", {
        ...form,
        applicant_full_name: form.applicant_full_name || null,
      });
      setForm({
        college_name: "",
        slug: "",
        applicant_email: "",
        applicant_full_name: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submit failed.");
    }
  }

  if (loading || !user?.is_platform_operator) {
    return null;
  }

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <PortalShell
      title="Operator"
      description="Review college onboarding"
      nav={NAV}
    >
      <PageHeader
        title="College applications"
        description={
          pending > 0
            ? `${pending} pending review`
            : "Approve colleges and appoint the first admin"
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard
          title="Applications queue"
          description="Approve creates the college and college_admin membership for the applicant."
        >
          {rows.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Submit a demo application below, or wait for colleges to apply."
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>College</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.college_name}</TableCell>
                      <TableCell>{row.slug}</TableCell>
                      <TableCell>{row.applicant_email}</TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell align="right">
                        {row.status === "pending" ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "flex-end" }}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              disabled={busyId === row.id}
                              onClick={() => void approve(row.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              disabled={busyId === row.id}
                              onClick={() => void reject(row.id)}
                            >
                              Reject
                            </Button>
                          </Stack>
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

        <SectionCard
          title="Submit application"
          description="Demo helper — same public endpoint colleges use."
        >
          <Stack spacing={2} component="form" onSubmit={submitPublic}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="College name"
                required
                fullWidth
                value={form.college_name}
                onChange={(e) =>
                  setForm({ ...form, college_name: e.target.value })
                }
              />
              <TextField
                label="Slug"
                required
                fullWidth
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Applicant email"
                type="email"
                required
                fullWidth
                value={form.applicant_email}
                onChange={(e) =>
                  setForm({ ...form, applicant_email: e.target.value })
                }
              />
              <TextField
                label="Applicant name"
                fullWidth
                value={form.applicant_full_name}
                onChange={(e) =>
                  setForm({ ...form, applicant_full_name: e.target.value })
                }
              />
            </Stack>
            <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
              Submit application
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </PortalShell>
  );
}
