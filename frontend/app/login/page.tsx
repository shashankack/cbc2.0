"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/features/ui";

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestOtp(email.trim());
      const q = new URLSearchParams({ email: email.trim() });
      router.push(`/login/verify?${q.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a sign-in code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Students, drivers, college admins, and operators all sign in with their email. We’ll send a one-time code — no password."
    >
      <Stack spacing={2.5} component="form" onSubmit={onSubmit}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          label="Your email"
          type="email"
          required
          fullWidth
          autoComplete="email"
          placeholder="you@college.edu"
          helperText="Use the email your college registered for you"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? "Sending…" : "Email me a sign-in code"}
        </Button>
        <Link href="/" underline="hover" variant="body2" color="text.secondary">
          Back to home
        </Link>
      </Stack>
    </AuthShell>
  );
}
