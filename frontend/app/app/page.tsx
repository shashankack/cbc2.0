"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { resolveHomePath, useAuth } from "@/lib/auth";

export default function AppRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(resolveHomePath(user));
  }, [loading, user, router]);

  return (
    <Stack
      sx={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}
      spacing={2}
    >
      <CircularProgress />
      <Typography color="text.secondary">Opening your portal…</Typography>
    </Stack>
  );
}
