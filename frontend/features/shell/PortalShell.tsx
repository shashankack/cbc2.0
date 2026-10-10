"use client";

import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
};

type PortalShellProps = {
  title: string;
  nav: NavItem[];
  children: ReactNode;
};

export default function PortalShell({ title, nav, children }: PortalShellProps) {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: "wrap" }}>
            {nav.map((item) => (
              <Button key={item.href} component={NextLink} href={item.href} color="inherit" size="small">
                {item.label}
              </Button>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              void logout().then(() => {
                window.location.href = "/login";
              });
            }}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
