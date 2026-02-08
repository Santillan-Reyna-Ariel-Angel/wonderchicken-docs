"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "@/theme/theme";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
        {/* ThemeProvider applies your MUI theme  */}
      <CssBaseline />
      {/*  CssBaseline does a reset of styles, normalize, box-sizing, etc */}
      {children}
    </ThemeProvider>
  );
}
