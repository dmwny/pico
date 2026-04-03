"use client";

import { createContext, useContext, useMemo } from "react";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import {
  ChestSkinDefinition,
  getChestSkin,
  getNodeEffect,
  getPathTheme,
  getProfileBorder,
  getTitleBadge,
  getTrailEffect,
  NodeEffectDefinition,
  PathThemeDefinition,
  ProfileBorderDefinition,
  TitleBadgeDefinition,
  TrailEffectDefinition,
} from "@/lib/themes";

export type ActiveThemeBundle = {
  pathTheme: PathThemeDefinition;
  chestSkin: ChestSkinDefinition;
  trailEffect: TrailEffectDefinition;
  nodeEffect: NodeEffectDefinition;
  profileBorder: ProfileBorderDefinition | null;
  titleBadge: TitleBadgeDefinition | null;
};

const ThemeContext = createContext<ActiveThemeBundle | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { appearance } = useCosmetics();

  const value = useMemo<ActiveThemeBundle>(
    () => ({
      pathTheme: getPathTheme(appearance.pathThemeId),
      chestSkin: getChestSkin(appearance.chestSkinId),
      trailEffect: getTrailEffect(appearance.trailEffectId),
      nodeEffect: getNodeEffect(appearance.nodeEffectId),
      profileBorder: appearance.profileBorderId ? getProfileBorder(appearance.profileBorderId) : null,
      titleBadge: appearance.titleBadgeId ? getTitleBadge(appearance.titleBadgeId) : null,
    }),
    [appearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return value;
}
