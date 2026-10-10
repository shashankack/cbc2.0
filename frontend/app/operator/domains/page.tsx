"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { apiPost, ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";

export default function OperatorDomainsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [domainId, setDomainId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.is_platform_operator) {
      router.replace(resolveHomePath(user));
    }
  }, [loading, user, router]);

  async function approve() {
    setError(null);
    setMessage(null);
    try {
      await apiPost(`/operator/domains/${domainId.trim()}/approve`);
      setMessage("Domain approved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed.");
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
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Approve domain
        </Typography>
        <Typography color="text.secondary">
          Paste a pending domain request ID from the college admin flow.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}
        <TextField
          label="Domain request ID"
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={() => void approve()} disabled={!domainId.trim()}>
          Approve domain
        </Button>
      </Stack>
    </PortalShell>
  );
}
