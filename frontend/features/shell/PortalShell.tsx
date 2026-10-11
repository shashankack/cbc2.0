"use client";

import { useMemo, useState, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CrisisAlertOutlinedIcon from "@mui/icons-material/CrisisAlertOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "@/lib/auth";

export type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

type PortalShellProps = {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  /** Optional grouped nav; when set, used instead of flat `nav` for the drawer. */
  navSections?: NavSection[];
  /** Kept for API compat; AppBar no longer shows this (PageHeader owns page context). */
  description?: string;
};

const DRAWER_WIDTH = 248;
const DRAWER_WIDTH_COLLAPSED = 72;

const ROUTE_ICONS: Record<string, ReactNode> = {
  "/admin": <HomeOutlinedIcon fontSize="small" />,
  "/admin/import": <UploadFileOutlinedIcon fontSize="small" />,
  "/admin/planning": <MapOutlinedIcon fontSize="small" />,
  "/admin/buses": <DirectionsBusIcon fontSize="small" />,
  "/admin/drivers": <PeopleOutlinedIcon fontSize="small" />,
  "/admin/trips": <HistoryOutlinedIcon fontSize="small" />,
  "/admin/analytics": <QrCodeScannerIcon fontSize="small" />,
  "/admin/disruptions": <WarningAmberOutlinedIcon fontSize="small" />,
  "/admin/emergency": <CrisisAlertOutlinedIcon fontSize="small" />,
  "/student": <HomeOutlinedIcon fontSize="small" />,
  "/student/board": <QrCodeScannerIcon fontSize="small" />,
  "/student/trip": <MapOutlinedIcon fontSize="small" />,
  "/driver": <DirectionsBusIcon fontSize="small" />,
  "/operator": <HomeOutlinedIcon fontSize="small" />,
  "/operator/domains": <PeopleOutlinedIcon fontSize="small" />,
};

function isSelected(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin" || href === "/student" || href === "/operator") {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export default function PortalShell({
  title,
  nav,
  navSections,
  children,
}: PortalShellProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed && !isMobile ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const showLabels = !collapsed || isMobile;

  const sections = useMemo<NavSection[]>(() => {
    if (navSections?.length) return navSections;
    return [{ label: "", items: nav }];
  }, [nav, navSections]);

  function renderItem(item: NavItem) {
    const selected = isSelected(pathname, item.href);
    const icon = item.icon ?? ROUTE_ICONS[item.href] ?? (
      <DirectionsBusIcon fontSize="small" />
    );
    const button = (
      <ListItemButton
        key={item.href}
        component={NextLink}
        href={item.href}
        selected={selected}
        onClick={() => setMobileOpen(false)}
        sx={{
          borderRadius: 1.25,
          mb: 0.25,
          justifyContent: showLabels ? "flex-start" : "center",
          px: showLabels ? 1.5 : 1,
          minHeight: 40,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: showLabels ? 36 : 0,
            color: selected ? "primary.main" : "text.secondary",
            justifyContent: "center",
          }}
        >
          {icon}
        </ListItemIcon>
        {showLabels ? (
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                noWrap: true,
                sx: {
                  fontWeight: selected ? 700 : 500,
                  fontSize: "0.9rem",
                  color: selected ? "primary.main" : "text.primary",
                },
              },
            }}
          />
        ) : null}
      </ListItemButton>
    );
    if (showLabels) return button;
    return (
      <Tooltip key={item.href} title={item.label} placement="right">
        {button}
      </Tooltip>
    );
  }

  const navList = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ gap: 1.25, px: 2, minHeight: 64 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            flexShrink: 0,
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
        {showLabels && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
              Uni
              <Box component="span" sx={{ color: "primary.main" }}>
                Transit
              </Box>
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ px: 1, py: 1, flexGrow: 1, overflowY: "auto" }}>
        {sections.map((section, idx) => (
          <Box key={section.label || `nav-${idx}`} sx={{ mb: section.label ? 1.25 : 0 }}>
            {section.label && showLabels ? (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.5,
                  pt: idx === 0 ? 0.5 : 1,
                  pb: 0.5,
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontSize: "0.68rem",
                }}
              >
                {section.label}
              </Typography>
            ) : null}
            <List disablePadding>{section.items.map(renderItem)}</List>
          </Box>
        ))}
      </Box>
      {!isMobile && (
        <>
          <Divider />
          <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
            <Tooltip title={collapsed ? "Expand menu" : "Collapse menu"}>
              <IconButton
                size="small"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand menu" : "Collapse menu"}
              >
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 60 } }}>
          {isMobile ? (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 650, minWidth: 0 }}
            noWrap
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
            noWrap
          >
            {user?.email}
          </Typography>
          <Button
            size="small"
            variant="outlined"
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

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="Portal navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {navList}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.shorter,
              }),
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
              overflowX: "hidden",
            },
          }}
        >
          {navList}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 60 } }} />
        <Box
          sx={{
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 2, sm: 2.5 },
            maxWidth: 1280,
            mx: "auto",
            "@keyframes utFadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            animation: "utFadeIn 160ms ease",
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
