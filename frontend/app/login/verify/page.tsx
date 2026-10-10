"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ApiError } from "@/lib/api";
import { resolveHomePath, useAuth } from "@/lib/auth";

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
      router.replace(resolveHomePath(me));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={onSubmit}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
        Enter OTP
      </Typography>
      <Typography color="text.secondary">
        In development, the code is printed in the API server log.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="One-time code"
        required
        fullWidth
        slotProps={{
          htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 12 },
        }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button type="submit" variant="contained" size="large" disabled={loading}>
        {loading ? "Verifying…" : "Verify and continue"}
      </Button>
    </Stack>
  );
}

export default function VerifyOtpPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Suspense fallback={<Typography>Loading…</Typography>}>
          <VerifyForm />
        </Suspense>
      </Container>
    </Box>
  );
}
