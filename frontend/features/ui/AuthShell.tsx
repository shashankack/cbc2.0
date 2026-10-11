"use client";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
        py: 4,
      }}
    >
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          top: "20%",
          right: "12%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          bgcolor: "rgba(13, 148, 136, 0.08)",
          filter: "blur(90px)",
        }}
      />
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "rgba(20, 184, 166, 0.14)",
                border: "1px solid rgba(20, 184, 166, 0.32)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DirectionsBusIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>
              Uni
              <Box component="span" sx={{ color: "primary.main" }}>
                Transit
              </Box>
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: "primary.main", fontWeight: 650, letterSpacing: "0.02em" }}
          >
            One sign-in for everyone
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 750 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography color="text.secondary">{subtitle}</Typography>
          ) : null}
        </Stack>
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
