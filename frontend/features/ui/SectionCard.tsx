"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  dense?: boolean;
};

export default function SectionCard({
  title,
  description,
  children,
  actions,
  dense = false,
}: SectionCardProps) {
  return (
    <Paper
      sx={{
        p: dense ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 2.25 },
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      {(title || actions) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: title || description ? 1.5 : 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title ? (
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {actions}
        </Box>
      )}
      {children}
    </Paper>
  );
}
