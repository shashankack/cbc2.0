"use client";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import ColorModeToggle from "@/theme/ColorModeToggle";

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
        py: 4,
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ColorModeToggle />
      </Box>
      <Container maxWidth="sm">
        <Stack spacing={2} sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <DirectionsBusIcon color="secondary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              UniTransit
            </Typography>
          </Stack>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography color="text.secondary">{subtitle}</Typography>
          ) : null}
        </Stack>
        <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>{children}</Paper>
      </Container>
    </Box>
  );
}
