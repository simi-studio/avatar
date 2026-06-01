"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Client wrapper around next-themes. Uses the `class` strategy so the existing
 * `.dark` CSS variables in globals.css apply, defaults to the system
 * preference, and avoids transition flashes on theme change.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
