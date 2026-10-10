"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { resolveHomePath, useAuth } from "@/lib/auth";

export default function AppRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }
    const dest = resolveHomePath(user);
    if (dest !== pathname) {
      router.replace(dest);
    }
  }, [loading, user, router, pathname]);

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
