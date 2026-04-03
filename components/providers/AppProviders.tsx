"use client";

import { CosmeticsProvider } from "@/contexts/CosmeticsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CosmeticsProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </CosmeticsProvider>
  );
}
