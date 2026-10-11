"use client";

import { useCallback, useEffect, useState } from "react";
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
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";

const NAV = [
  { href: "/operator", label: "Colleges" },
  { href: "/operator/domains", label: "Email endings" },
];

type DomainRow = {
  id: string;
  college_id: string;
  college_name: string | null;
  domain: string;
  status: string;
  dns_txt_token: string;
  dns_verified_at: string | null;
  created_at: string;
};

export default function OperatorDomainsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const data = await apiGet<DomainRow[]>(`/operator/domains${q}`);
    setRows(data);
  }, [filter]);

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
    void load().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Load failed.");
    });
  }, [loading, user, router, load]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await apiPost(`/operator/domains/${id}/approve`);
      setMessage("Domain approved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await apiPost(`/operator/domains/${id}/reject`, { notes: "Rejected by operator" });
      setMessage("Domain rejected.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !user?.is_platform_operator) {
    return null;
  }

  return (
    <PortalShell
      title="Operator"
      description="Approve college email endings"
      nav={NAV}
    >
      <PageHeader
        title="College email approvals"
        description="College admins request which email endings (like pes.edu) belong to them. Approve after they’ve proven ownership (in production that means their DNS check is done)."
        actions={
          <TextField
            select
            size="small"
            label="Status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="">All</MenuItem>
          </TextField>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      ) : null}
      <SectionCard title="Requests">
        {rows.length === 0 ? (
          <Alert severity="info">No domains for this filter.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Requested</TableCell>
                  <TableCell>College</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>TXT token</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{r.college_name ?? r.college_id.slice(0, 8)}</TableCell>
                    <TableCell>{r.domain}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                      {r.dns_txt_token}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                    <TableCell align="right">
                      {r.status === "pending" ? (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={busyId === r.id}
                            onClick={() => void approve(r.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            disabled={busyId === r.id}
                            onClick={() => void reject(r.id)}
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
    </PortalShell>
  );
}
