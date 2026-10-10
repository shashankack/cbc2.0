"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";
import type { CollegeApplication } from "@/types/api";

export default function OperatorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<CollegeApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    await apiPost(`/operator/college-applications/${id}/approve`, {});
    await load();
  }

  async function reject(id: string) {
    await apiPost(`/operator/college-applications/${id}/reject`, {
      notes: "Rejected by operator",
    });
    await load();
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

  return (
    <PortalShell
      title="Operator"
      nav={[
        { href: "/operator", label: "Colleges" },
        { href: "/operator/domains", label: "Domains" },
      ]}
    >
      <Stack spacing={4}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          College applications
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={2} component="form" onSubmit={submitPublic}>
          <Typography variant="subtitle1">Submit application (demo)</Typography>
          <TextField
            label="College name"
            required
            value={form.college_name}
            onChange={(e) => setForm({ ...form, college_name: e.target.value })}
          />
          <TextField
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <TextField
            label="Applicant email"
            type="email"
            required
            value={form.applicant_email}
            onChange={(e) =>
              setForm({ ...form, applicant_email: e.target.value })
            }
          />
          <TextField
            label="Applicant name"
            value={form.applicant_full_name}
            onChange={(e) =>
              setForm({ ...form, applicant_full_name: e.target.value })
            }
          />
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </Stack>

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
              <TableRow key={row.id}>
                <TableCell>{row.college_name}</TableCell>
                <TableCell>{row.slug}</TableCell>
                <TableCell>{row.applicant_email}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="right">
                  {row.status === "pending" ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: "flex-end" }}
                    >
                      <Button size="small" onClick={() => void approve(row.id)}>
                        Approve
                      </Button>
                      <Button size="small" color="warning" onClick={() => void reject(row.id)}>
                        Reject
                      </Button>
                    </Stack>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </PortalShell>
  );
}
