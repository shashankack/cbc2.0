"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard } from "@/features/ui";
import { apiPost, ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";

const NAV = [
  { href: "/operator", label: "Colleges" },
  { href: "/operator/domains", label: "Domains" },
];

export default function OperatorDomainsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [domainId, setDomainId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      await apiPost(`/operator/domains/${domainId.trim()}/approve`);
      setMessage("Domain approved and marked active.");
      setDomainId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user?.is_platform_operator) {
    return null;
  }

  return (
    <PortalShell
      title="Operator"
      description="Verify college email domains"
      nav={NAV}
    >
      <PageHeader
        title="Domain approvals"
        description="Paste a pending domain request ID from the college admin portal."
      />
      <SectionCard title="Approve domain request">
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {message ? <Alert severity="success">{message}</Alert> : null}
          <TextField
            label="Domain request ID"
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            fullWidth
            helperText="College admins see this ID after requesting a domain."
          />
          <Button
            variant="contained"
            onClick={() => void approve()}
            disabled={!domainId.trim() || busy}
            sx={{ alignSelf: "flex-start" }}
          >
            {busy ? "Approving…" : "Approve domain"}
          </Button>
        </Stack>
      </SectionCard>
    </PortalShell>
  );
}
