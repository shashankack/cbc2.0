"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ImportResultSummary } from "@/components/planning";
import PortalShell from "@/features/shell/PortalShell";
import { apiGet, apiRequest, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus, ImportBatch } from "@/types/api";

const nav = [
  { href: "/admin", label: "Campuses" },
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/planning", label: "Planning" },
];

export default function AdminImportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [campusId, setCampusId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

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
    if (!collegeId) return;
    void apiGet<Campus[]>(`/colleges/${collegeId}/campuses`)
      .then((rows) => {
        setCampuses(rows);
        if (rows[0]) setCampusId(rows[0].id);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router]);

  async function upload() {
    if (!collegeId || !campusId || !file) return;
    const form = new FormData();
    form.append("campus_id", campusId);
    form.append("file", file);
    try {
      const result = await apiRequest<ImportBatch>(
        `/colleges/${collegeId}/imports/students`,
        { method: "POST", formData: form },
      );
      setBatch(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed.");
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
          Student import
        </Typography>
        <Typography color="text.secondary">
          CSV/XLSX columns: name, srn, email, lat, lng
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          label="Campus ID"
          value={campusId}
          onChange={(e) => setCampusId(e.target.value)}
          helperText={campuses.map((c) => `${c.code}`).join(", ")}
        />
        <Button variant="outlined" component="label">
          Choose file
          <input
            hidden
            type="file"
            accept=".csv,.xlsx,.xlsm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Button>
        <Typography variant="body2">{file?.name ?? "No file selected"}</Typography>
        <Button variant="contained" onClick={() => void upload()} disabled={!file}>
          Upload
        </Button>
        {batch ? (
          <ImportResultSummary
            validCount={batch.valid_count}
            invalidCount={batch.error_count}
            totalCount={batch.row_count}
          />
        ) : null}
      </Stack>
    </PortalShell>
  );
}
