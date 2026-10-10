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
};

export default function SectionCard({
  title,
  description,
  children,
  actions,
}: SectionCardProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: 2.5,
        bgcolor: "background.paper",
        transition: "border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          borderColor: "rgba(13, 148, 136, 0.28)",
        },
      }}
    >
      {(title || actions) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: title || description ? 2 : 0,
          }}
        >
          <Box>
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
