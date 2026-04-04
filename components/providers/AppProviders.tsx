"use client";

import { CosmeticsProvider } from "@/contexts/CosmeticsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import StreakGlobalOverlays from "@/components/streak/StreakGlobalOverlays";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CosmeticsProvider>
      <ThemeProvider>
        {children}
        <StreakGlobalOverlays />
      </ThemeProvider>
    </CosmeticsProvider>
  );
}
