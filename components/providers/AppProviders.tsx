"use client";

import { CosmeticsProvider } from "@/contexts/CosmeticsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import XpFloatingPopup from "@/components/leagues/XpFloatingPopup";
import StreakGlobalOverlays from "@/components/streak/StreakGlobalOverlays";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CosmeticsProvider>
      <ThemeProvider>
        <XpFloatingPopup>
          {children}
          <StreakGlobalOverlays />
        </XpFloatingPopup>
      </ThemeProvider>
    </CosmeticsProvider>
  );
}
