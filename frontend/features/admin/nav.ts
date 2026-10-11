export type AdminNavItem = {
  href: string;
  label: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: "Setup",
    items: [
      { href: "/admin", label: "Home" },
      { href: "/admin/import", label: "Upload students" },
      { href: "/admin/planning", label: "Plan routes" },
    ],
  },
  {
    label: "Daily ops",
    items: [
      { href: "/admin/buses", label: "Buses" },
      { href: "/admin/drivers", label: "Drivers" },
      { href: "/admin/trips", label: "Trip history" },
      { href: "/admin/analytics", label: "Who boarded" },
    ],
  },
  {
    label: "Exceptions",
    items: [
      { href: "/admin/disruptions", label: "Bus problems" },
      { href: "/admin/emergency", label: "Emergencies" },
    ],
  },
];

/** Flat list for callers that still expect `nav={ADMIN_NAV}`. */
export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap(
  (section) => section.items,
);

/** Ready-to-spread into PortalShell for every admin page. */
export function adminShellNav(): {
  nav: AdminNavItem[];
  navSections: AdminNavSection[];
} {
  return {
    nav: [...ADMIN_NAV],
    navSections: ADMIN_NAV_SECTIONS.map((s) => ({
      label: s.label,
      items: [...s.items],
    })),
  };
}
