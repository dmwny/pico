"use client";

import { ChestRarity } from "@/lib/rewardChests";
import { ChestIllustration } from "@/components/rewards/ChestIllustration";
import { useThemeContext } from "@/contexts/ThemeContext";

type PathChestNodeProps = {
  rarity: ChestRarity;
  className?: string;
};

export function ClosedChestNode({ rarity, className = "" }: PathChestNodeProps) {
  const { chestSkin } = useThemeContext();
  return (
    <ChestIllustration
      state="closed"
      rarity={rarity}
      tone="base"
      skin={chestSkin.id}
      glowMode="pulse"
      float
      shine
      className={className}
    />
  );
}

export function OpenChestNode({ rarity, className = "" }: PathChestNodeProps) {
  const { chestSkin } = useThemeContext();
  return (
    <ChestIllustration
      state="open"
      rarity={rarity}
      tone="spent"
      skin={chestSkin.id}
      glowMode="none"
      className={className}
    />
  );
}
