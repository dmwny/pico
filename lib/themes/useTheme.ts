"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/themes/applyTheme";
import { useUserStore } from "@/store/userStore";

export function useTheme() {
  const equippedTheme = useUserStore((state) => state.equippedTheme);
  const isHydrated = useUserStore((state) => state.isHydrated);

  useEffect(() => {
    void applyTheme((isHydrated ? equippedTheme : getStoredTheme()) as Parameters<typeof applyTheme>[0]);
  }, [equippedTheme, isHydrated]);
}
