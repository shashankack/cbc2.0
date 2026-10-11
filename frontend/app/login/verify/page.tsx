"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";
import { AuthShell } from "@/features/ui";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { verifyOtp } = useAuth();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const me = await verifyOtp(email.trim(), code.trim());
      const home = resolveHomePath(me);
      if (
        home === "/" &&
        !me.is_platform_operator &&
        me.memberships.length === 0
      ) {
        setError(
          "You’re signed in, but this email isn’t set up for a college yet. Ask your college admin to add you as a student, driver, or admin.",
        );
        return;
      }
      router.replace(home);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Enter your code"
      subtitle="Check your email for the sign-in code we just sent. (In local testing, the code also appears in the server log.)"
    >
      <Stack spacing={2.5} component="form" onSubmit={onSubmit}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          label="Your email"
          type="email"
          required
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Sign-in code"
          required
          fullWidth
          autoFocus
          placeholder="6-digit code"
          helperText="Usually a short number from the email"
          slotProps={{
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 },
          }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? "Checking…" : "Continue"}
        </Button>
        <Link href="/login" underline="hover" variant="body2" color="text.secondary">
          Use a different email
        </Link>
      </Stack>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Enter your code">
          <Typography color="text.secondary">Loading…</Typography>
        </AuthShell>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
