"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import AppTopNav from "@/components/AppTopNav";
import MobileDock from "@/components/MobileDock";
import { ProfileAvatar } from "@/components/ProfileFlair";
import AmbientEffectsLayer from "@/components/theme/AmbientEffectsLayer";
import MythicThemeLayer from "@/components/theme/MythicThemeLayer";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import {
  getDefaultAchievementDisplayState,
  getStoredAchievementDisplayState,
  markAchievementRevealPlayed,
  markAchievementRevealPlayedMany,
  reconcileAchievementDisplayState,
  setStoredAchievementDisplayState,
  type AchievementDisplayState,
} from "@/lib/achievementDisplay";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";
import { useMotionAllowed } from "@/lib/motion";
import { mixHex, withAlpha } from "@/lib/themes";

type AchievementFilter = "all" | "unlocked" | "locked" | "legendary" | "epic" | "rare";
type AchievementSort = "rarity" | "recent" | "name";
type CompletionBand = "journey" | "mark" | "contender" | "almost" | "complete";

type RarityVisual = {
  label: string;
  sectionIcon: string;
  accent: string;
  accentSoft: string;
  divider: string;
  headerGlow: string;
  badgeBackground: string;
  badgeText: string;
  unlockedBackground: string;
  unlockedBorder: string;
  unlockedShadow: string;
  lockedBackground: string;
  lockedBorder: string;
  lockedShadow: string;
  sealBackground: string;
  particleColor: string;
};

const FILTER_OPTIONS: Array<{ id: AchievementFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "locked", label: "Locked" },
  { id: "legendary", label: "Legendary" },
  { id: "epic", label: "Epic" },
  { id: "rare", label: "Rare" },
];

const SORT_OPTIONS: Array<{ id: AchievementSort; label: string }> = [
  { id: "rarity", label: "By Rarity" },
  { id: "recent", label: "By Recent" },
  { id: "name", label: "By Name" },
];

const RARITY_ORDER: Achievement["rarity"][] = ["legendary", "epic", "rare", "common"];
const ACHIEVEMENT_ORDER = new Map(ACHIEVEMENTS.map((achievement, index) => [achievement.id, index] as const));

const RARITY_VISUALS: Record<Achievement["rarity"], RarityVisual> = {
  legendary: {
    label: "Legendary",
    sectionIcon: "crown",
    accent: "#f59e0b",
    accentSoft: "#fde68a",
    divider: "linear-gradient(90deg, rgba(245,158,11,0), rgba(251,191,36,0.95), rgba(245,158,11,0))",
    headerGlow: "rgba(251,191,36,0.34)",
    badgeBackground: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 52%,#fde68a 100%)",
    badgeText: "#fff7ed",
    unlockedBackground: "linear-gradient(180deg, rgba(255,248,220,0.98) 0%, rgba(255,236,211,0.94) 100%)",
    unlockedBorder: "rgba(245,158,11,0.34)",
    unlockedShadow: "0 26px 60px rgba(245,158,11,0.18)",
    lockedBackground: "linear-gradient(180deg, rgba(36,25,15,0.95) 0%, rgba(18,12,10,0.98) 100%)",
    lockedBorder: "rgba(245,158,11,0.18)",
    lockedShadow: "0 18px 44px rgba(0,0,0,0.28)",
    sealBackground: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%)",
    particleColor: "#facc15",
  },
  epic: {
    label: "Epic",
    sectionIcon: "diamond",
    accent: "#8b5cf6",
    accentSoft: "#c4b5fd",
    divider: "linear-gradient(90deg, rgba(139,92,246,0), rgba(168,85,247,0.92), rgba(139,92,246,0))",
    headerGlow: "rgba(139,92,246,0.28)",
    badgeBackground: "linear-gradient(135deg,#7c3aed 0%,#8b5cf6 52%,#c4b5fd 100%)",
    badgeText: "#faf5ff",
    unlockedBackground: "linear-gradient(180deg, rgba(245,243,255,0.98) 0%, rgba(237,233,254,0.95) 100%)",
    unlockedBorder: "rgba(139,92,246,0.26)",
    unlockedShadow: "0 24px 56px rgba(139,92,246,0.16)",
    lockedBackground: "linear-gradient(180deg, rgba(29,18,47,0.95) 0%, rgba(16,10,28,0.98) 100%)",
    lockedBorder: "rgba(139,92,246,0.18)",
    lockedShadow: "0 18px 44px rgba(0,0,0,0.28)",
    sealBackground: "linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)",
    particleColor: "#c4b5fd",
  },
  rare: {
    label: "Rare",
    sectionIcon: "star",
    accent: "#3b82f6",
    accentSoft: "#93c5fd",
    divider: "linear-gradient(90deg, rgba(59,130,246,0), rgba(96,165,250,0.92), rgba(59,130,246,0))",
    headerGlow: "rgba(96,165,250,0.22)",
    badgeBackground: "linear-gradient(135deg,#2563eb 0%,#3b82f6 52%,#93c5fd 100%)",
    badgeText: "#eff6ff",
    unlockedBackground: "linear-gradient(180deg, rgba(239,246,255,0.98) 0%, rgba(219,234,254,0.95) 100%)",
    unlockedBorder: "rgba(59,130,246,0.24)",
    unlockedShadow: "0 24px 56px rgba(59,130,246,0.14)",
    lockedBackground: "linear-gradient(180deg, rgba(17,30,53,0.95) 0%, rgba(8,15,30,0.98) 100%)",
    lockedBorder: "rgba(59,130,246,0.18)",
    lockedShadow: "0 18px 44px rgba(0,0,0,0.28)",
    sealBackground: "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
    particleColor: "#93c5fd",
  },
  common: {
    label: "Common",
    sectionIcon: "plus",
    accent: "#94a3b8",
    accentSoft: "#cbd5e1",
    divider: "linear-gradient(90deg, rgba(148,163,184,0), rgba(148,163,184,0.6), rgba(148,163,184,0))",
    headerGlow: "rgba(148,163,184,0.12)",
    badgeBackground: "linear-gradient(135deg,#475569 0%,#64748b 100%)",
    badgeText: "#f8fafc",
    unlockedBackground: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
    unlockedBorder: "rgba(203,213,225,0.8)",
    unlockedShadow: "0 20px 48px rgba(15,23,42,0.08)",
    lockedBackground: "linear-gradient(180deg, rgba(24,28,35,0.95) 0%, rgba(14,17,23,0.98) 100%)",
    lockedBorder: "rgba(148,163,184,0.16)",
    lockedShadow: "0 18px 44px rgba(0,0,0,0.24)",
    sealBackground: "linear-gradient(135deg,#64748b 0%,#94a3b8 100%)",
    particleColor: "#cbd5e1",
  },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function resolveCompletionBand(completionPercent: number) {
  if (completionPercent >= 100) {
    return { key: "complete" as CompletionBand, line: "Completed. Respect." };
  }
  if (completionPercent >= 76) {
    return { key: "almost" as CompletionBand, line: "Almost legendary." };
  }
  if (completionPercent >= 51) {
    return { key: "contender" as CompletionBand, line: "A serious contender." };
  }
  if (completionPercent >= 26) {
    return { key: "mark" as CompletionBand, line: "You're making your mark." };
  }
  return { key: "journey" as CompletionBand, line: "Your journey begins." };
}

function buildHeroTreatment(completionPercent: number, accentColor: string, highlightColor: string) {
  const band = resolveCompletionBand(completionPercent);
  const ratio = clamp(completionPercent / 100, 0, 1);
  const coolStart = mixHex(accentColor, "#020617", 0.76 - ratio * 0.24);
  const coolEnd = mixHex(highlightColor, "#0f172a", 0.82 - ratio * 0.28);

  if (band.key === "complete") {
    const start = mixHex(coolStart, "#a16207", 0.38);
    const end = mixHex(coolEnd, "#fbbf24", 0.64);

    return {
      band,
      background: `linear-gradient(135deg, ${start} 0%, ${mixHex(start, end, 0.38)} 48%, ${end} 100%)`,
      overlay: `radial-gradient(circle at 18% 24%, ${withAlpha("#fef3c7", 0.26)}, transparent 32%), radial-gradient(circle at 82% 18%, ${withAlpha("#f59e0b", 0.28)}, transparent 36%)`,
      glow: withAlpha("#fbbf24", 0.24),
      shimmer: true,
    };
  }

  if (band.key === "almost") {
    const start = mixHex(coolStart, "#581c87", 0.18);
    const end = mixHex(coolEnd, "#f59e0b", 0.26);

    return {
      band,
      background: `linear-gradient(135deg, ${start} 0%, ${mixHex(start, end, 0.4)} 48%, ${end} 100%)`,
      overlay: `radial-gradient(circle at 16% 22%, ${withAlpha("#a855f7", 0.18)}, transparent 30%), radial-gradient(circle at 84% 18%, ${withAlpha("#f59e0b", 0.18)}, transparent 34%)`,
      glow: withAlpha(mixHex("#a855f7", "#f59e0b", 0.28), 0.22),
      shimmer: false,
    };
  }

  if (band.key === "contender") {
    const start = mixHex(coolStart, "#312e81", 0.18);
    const end = mixHex(coolEnd, "#8b5cf6", 0.28);

    return {
      band,
      background: `linear-gradient(135deg, ${start} 0%, ${mixHex(start, end, 0.44)} 48%, ${end} 100%)`,
      overlay: `radial-gradient(circle at 20% 24%, ${withAlpha("#818cf8", 0.18)}, transparent 28%), radial-gradient(circle at 78% 20%, ${withAlpha("#8b5cf6", 0.16)}, transparent 30%)`,
      glow: withAlpha("#8b5cf6", 0.18),
      shimmer: false,
    };
  }

  if (band.key === "mark") {
    const start = mixHex(coolStart, "#334155", 0.16);
    const end = mixHex(coolEnd, "#fb923c", 0.14);

    return {
      band,
      background: `linear-gradient(135deg, ${start} 0%, ${mixHex(start, end, 0.42)} 48%, ${end} 100%)`,
      overlay: `radial-gradient(circle at 18% 22%, ${withAlpha("#38bdf8", 0.12)}, transparent 26%), radial-gradient(circle at 82% 18%, ${withAlpha("#fb923c", 0.12)}, transparent 28%)`,
      glow: withAlpha("#60a5fa", 0.14),
      shimmer: false,
    };
  }

  return {
    band,
    background: `linear-gradient(135deg, ${coolStart} 0%, ${mixHex(coolStart, coolEnd, 0.42)} 48%, ${coolEnd} 100%)`,
    overlay: `radial-gradient(circle at 20% 26%, ${withAlpha("#38bdf8", 0.08)}, transparent 28%), radial-gradient(circle at 84% 18%, ${withAlpha("#1e293b", 0.18)}, transparent 30%)`,
    glow: withAlpha("#0f172a", 0.16),
    shimmer: false,
  };
}

function getFallbackTitleBadge(accentColor: string) {
  return {
    name: "Scholar",
    tone: `linear-gradient(135deg, ${accentColor} 0%, ${mixHex(accentColor, "#ffffff", 0.22)} 100%)`,
    glow: withAlpha(accentColor, 0.24),
  };
}

function sortAchievementsForSection({
  achievements,
  earnedSet,
  sortMode,
  firstSeenAtById,
}: {
  achievements: Achievement[];
  earnedSet: Set<string>;
  sortMode: AchievementSort;
  firstSeenAtById: Record<string, number>;
}) {
  return [...achievements].sort((left, right) => {
    const leftEarned = earnedSet.has(left.id) ? 0 : 1;
    const rightEarned = earnedSet.has(right.id) ? 0 : 1;

    if (leftEarned !== rightEarned) return leftEarned - rightEarned;

    if (sortMode === "name") {
      return left.title.localeCompare(right.title);
    }

    if (sortMode === "recent" && leftEarned === 0 && rightEarned === 0) {
      const leftSeenAt = firstSeenAtById[left.id];
      const rightSeenAt = firstSeenAtById[right.id];
      const leftHasSeenAt = typeof leftSeenAt === "number";
      const rightHasSeenAt = typeof rightSeenAt === "number";

      if (leftHasSeenAt && rightHasSeenAt && leftSeenAt !== rightSeenAt) {
        return rightSeenAt - leftSeenAt;
      }
      if (leftHasSeenAt !== rightHasSeenAt) {
        return leftHasSeenAt ? -1 : 1;
      }
      return left.title.localeCompare(right.title);
    }

    return (ACHIEVEMENT_ORDER.get(left.id) ?? 0) - (ACHIEVEMENT_ORDER.get(right.id) ?? 0);
  });
}

function AchievementIcon({ name, className = "" }: { name: string; className?: string }) {
  const props = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "footprints":
      return <svg {...props}><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5 10 7.9 8 10 8 12h3c0-2 2-4 2-6.5 0-1.7-.63-3.5-2.5-3.5-3 0-4.47 3.28-4.5 6-.03 2.5 1 3.5 1 5.62V16" /><path d="M14 16v-1.83C14 12 16 10 16 7.5 16 5.8 15.37 4 13.5 4 10.5 4 9.03 7.28 9 10c-.03 2.5 1 3.5 1 5.62V18" /><path d="M4 22h4m6-6h4" /></svg>;
    case "flame":
      return <svg {...props}><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>;
    case "zap":
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "star":
      return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case "bolt":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "gem":
      return <svg {...props}><path d="M6 3h12l4 6-10 13L2 9z" /><path d="M11 3l1 10L2 9" /><path d="M13 3l-1 10 10-4" /><path d="M2 9h20" /></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>;
    case "moon":
      return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case "trophy":
      return <svg {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 22V14.5a2 2 0 0 0-2-2H6V4h12v8.5h-2a2 2 0 0 0-2 2V22" /></svg>;
    case "crown":
      return <svg {...props}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 16h14v4H5z" /></svg>;
    case "bullseye":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case "mountain":
      return <svg {...props}><path d="m8 3 4 8 5-5 5 15H2L8 3z" /><path d="m4.14 15.08 2.86-2.86" /></svg>;
    case "scroll":
      return <svg {...props}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" /><path d="M19 17V5a2 2 0 0 0-2-2H4" /></svg>;
    case "diamond":
      return <svg {...props}><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 8v8m-4-4h8" /></svg>;
  }
}

function AchievementParticles({
  active,
  color,
  accentSoft,
}: {
  active: boolean;
  color: string;
  accentSoft: string;
}) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={`achievement-particle-${index}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 5 + (index % 3) * 2,
            height: 5 + (index % 3) * 2,
            background: index % 2 === 0 ? color : accentSoft,
            boxShadow: `0 0 16px ${index % 2 === 0 ? color : accentSoft}`,
            "--achievement-burst-x": `${Math.cos((index / 16) * Math.PI * 2) * (72 + (index % 4) * 8)}px`,
            "--achievement-burst-y": `${Math.sin((index / 16) * Math.PI * 2) * (54 + (index % 3) * 12)}px`,
            animation: `achievementBurst 900ms cubic-bezier(0.22,1,0.36,1) ${index * 16}ms forwards`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function LegendaryFlashOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDone, 1100);
    return () => window.clearTimeout(timeoutId);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{
        background:
          "radial-gradient(circle at 50% 32%, rgba(255,251,235,0.82), rgba(251,191,36,0.28) 28%, rgba(251,191,36,0.08) 56%, transparent 74%)",
        animation: "legendaryFlash 1100ms ease-out forwards",
      }}
    />
  );
}

function AchievementSectionHeader({
  rarity,
  unlockedCount,
  totalCount,
}: {
  rarity: Achievement["rarity"];
  unlockedCount: number;
  totalCount: number;
}) {
  const visual = RARITY_VISUALS[rarity];
  const showShimmer = rarity === "legendary";

  return (
    <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border px-5 py-4" style={{ borderColor: withAlpha(visual.accent, 0.18), background: withAlpha("#000000", 0.14) }}>
      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: visual.divider }} />
      {showShimmer ? (
        <>
          <span
            className="pointer-events-none absolute left-[18%] top-1/2 h-10 w-10 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: withAlpha(visual.accentSoft, 0.34) }}
          />
          <span
            className="pointer-events-none absolute left-[26%] top-[28%] h-1.5 w-1.5 rounded-full"
            style={{ background: visual.accentSoft, animation: "achievementLegendarySpark 4.8s ease-in-out infinite" }}
          />
          <span
            className="pointer-events-none absolute left-[34%] top-[56%] h-1 w-1 rounded-full"
            style={{ background: visual.accentSoft, animation: "achievementLegendarySpark 5.6s ease-in-out 420ms infinite" }}
          />
        </>
      ) : null}

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full border"
            style={{
              borderColor: withAlpha(visual.accent, 0.24),
              background: withAlpha(visual.accent, rarity === "common" ? 0.08 : 0.14),
              boxShadow: rarity === "common" ? "none" : `0 0 28px ${visual.headerGlow}`,
            }}
          >
            <AchievementIcon name={visual.sectionIcon} className="h-5 w-5" />
          </div>
          <div>
            <p
              className="text-[0.68rem] font-black uppercase tracking-[0.32em]"
              style={{ color: rarity === "common" ? "rgba(226,232,240,0.7)" : visual.accentSoft }}
            >
              {visual.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-white/78">
              {unlockedCount} unlocked of {totalCount}
            </p>
          </div>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em]"
          style={{
            borderColor: withAlpha(visual.accent, 0.24),
            color: rarity === "common" ? "rgba(226,232,240,0.82)" : visual.accentSoft,
            background: withAlpha(visual.accent, rarity === "common" ? 0.06 : 0.12),
          }}
        >
          Trophy Wing
        </span>
      </div>
    </div>
  );
}

function AchievementTrophyCard({
  achievement,
  earned,
  recentlyUnlocked,
  motionAllowed,
  firstSeenAt,
  onRevealComplete,
  onLegendaryReveal,
}: {
  achievement: Achievement;
  earned: boolean;
  recentlyUnlocked: boolean;
  motionAllowed: boolean;
  firstSeenAt?: number;
  onRevealComplete: (achievementId: string) => void;
  onLegendaryReveal: () => void;
}) {
  const visual = RARITY_VISUALS[achievement.rarity];
  const [phase, setPhase] = useState<"idle" | "shake" | "burst" | "revealed">(recentlyUnlocked ? "idle" : "revealed");
  const legendaryGradientId = `legendaryHaloStroke-${achievement.id}`;

  useEffect(() => {
    if (!recentlyUnlocked) return undefined;

    if (!motionAllowed) {
      onRevealComplete(achievement.id);
      return undefined;
    }

    const shakeTimer = window.setTimeout(() => setPhase("shake"), 500);
    const burstTimer = window.setTimeout(() => {
      setPhase("burst");
      if (achievement.rarity === "legendary") {
        onLegendaryReveal();
      }
    }, 980);
    const revealTimer = window.setTimeout(() => setPhase("revealed"), achievement.rarity === "legendary" ? 1700 : 1450);
    const completeTimer = window.setTimeout(
      () => onRevealComplete(achievement.id),
      achievement.rarity === "legendary" ? 2800 : 2300,
    );

    return () => {
      window.clearTimeout(shakeTimer);
      window.clearTimeout(burstTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, [achievement.id, achievement.rarity, motionAllowed, onLegendaryReveal, onRevealComplete, recentlyUnlocked]);

  const showUnlocked = earned && (!recentlyUnlocked || !motionAllowed || phase === "revealed");
  const showParticles = motionAllowed && recentlyUnlocked && (phase === "burst" || phase === "revealed");
  const showNewIndicator = motionAllowed && recentlyUnlocked && phase !== "revealed";
  const titleScaleIn = motionAllowed && recentlyUnlocked && phase === "revealed" ? "achievement-title-crash" : "";
  const revealFlip = motionAllowed && recentlyUnlocked && phase === "revealed" ? "achievement-card-reveal" : "";
  const shakeClass = motionAllowed && recentlyUnlocked && phase === "shake" ? "achievement-card-shake" : "";

  const iconTone = showUnlocked
    ? {
        background: `linear-gradient(135deg, ${mixHex(visual.accent, "#ffffff", 0.08)} 0%, ${visual.accent} 100%)`,
        color: "#ffffff",
        boxShadow: `0 0 0 1px ${withAlpha("#ffffff", 0.24)}, 0 16px 34px ${withAlpha(visual.accent, 0.24)}`,
      }
    : {
        background: "linear-gradient(180deg, rgba(51,65,85,0.82) 0%, rgba(30,41,59,0.96) 100%)",
        color: "rgba(226,232,240,0.34)",
        boxShadow: "0 14px 28px rgba(2,6,23,0.36)",
      };

  const cardStyle = showUnlocked
    ? {
        background: visual.unlockedBackground,
        borderColor: visual.unlockedBorder,
        boxShadow: visual.unlockedShadow,
      }
    : {
        background: visual.lockedBackground,
        borderColor: visual.lockedBorder,
        boxShadow: visual.lockedShadow,
      };

  const rarityBadgeStyle = showUnlocked
    ? {
        background: visual.badgeBackground,
        color: visual.badgeText,
        boxShadow: `0 12px 28px ${withAlpha(visual.accent, 0.22)}`,
      }
    : {
        background: withAlpha("#ffffff", 0.06),
        color: withAlpha("#ffffff", 0.56),
      };

  return (
    <article
      className={`group relative overflow-hidden rounded-[2rem] border p-5 transition duration-300 hover:-translate-y-0.5 ${shakeClass} ${revealFlip}`}
      style={{
        ...cardStyle,
        transformStyle: "preserve-3d",
      }}
    >
      {showUnlocked ? (
        <span
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            animation: "achievementCardShine 7.5s ease-in-out infinite",
          }}
        />
      ) : (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `inset 0 0 0 1px ${withAlpha(visual.accent, 0.12)}`,
            animation: earned ? "none" : "achievementLockedPulse 4.8s ease-in-out infinite",
          }}
        />
      )}

      {achievement.rarity === "rare" && !showUnlocked ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-[2rem]"
          style={{ boxShadow: `0 0 0 1px ${withAlpha(visual.accent, 0.12)}, 0 0 32px ${withAlpha(visual.accent, 0.08)}` }}
        />
      ) : null}

      <AchievementParticles active={showParticles} color={visual.particleColor} accentSoft={visual.accentSoft} />

      <div className="relative flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div
            className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.7rem] border"
            style={{
              ...iconTone,
              borderColor: showUnlocked ? withAlpha("#ffffff", 0.28) : withAlpha(visual.accent, 0.14),
            }}
          >
            {showUnlocked && achievement.rarity === "legendary" ? (
              <svg
                viewBox="0 0 120 120"
                className="pointer-events-none absolute inset-[-22%] h-[144%] w-[144%]"
                style={{ animation: "achievementLegendaryHalo 20s linear infinite" }}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={legendaryGradientId} x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="52%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fff7ed" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke={`url(#${legendaryGradientId})`}
                  strokeWidth="6"
                  strokeDasharray="18 10"
                  opacity="0.92"
                  strokeLinecap="round"
                />
              </svg>
            ) : null}

            {showUnlocked && achievement.rarity === "epic" ? (
              <span
                className="pointer-events-none absolute inset-[-16%] rounded-[2rem] border"
                style={{
                  borderColor: withAlpha(visual.accentSoft, 0.42),
                  boxShadow: `0 0 0 1px ${withAlpha(visual.accent, 0.18)}, 0 0 28px ${withAlpha(visual.accent, 0.22)}`,
                }}
              />
            ) : null}

            <AchievementIcon
              name={achievement.icon}
              className={`relative z-10 ${showUnlocked ? "h-9 w-9" : "h-8 w-8 opacity-60"}`}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={`text-lg font-black leading-tight ${titleScaleIn}`}
                style={{ color: showUnlocked ? "#0f172a" : "rgba(226,232,240,0.84)" }}
              >
                {achievement.title}
              </h3>
              <p
                className="mt-2 text-sm font-semibold leading-6"
                style={{ color: showUnlocked ? "rgba(51,65,85,0.84)" : "rgba(203,213,225,0.66)" }}
              >
                {achievement.description}
              </p>
            </div>

            {showUnlocked ? (
              <div
                className="achievement-seal flex h-11 w-11 items-center justify-center rounded-full text-white"
                style={{ background: visual.sealBackground }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <span
                className="rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em]"
                style={{
                  borderColor: withAlpha(visual.accent, 0.16),
                  color: withAlpha("#ffffff", 0.5),
                  background: withAlpha("#ffffff", 0.04),
                }}
              >
                ???
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.24em]"
              style={rarityBadgeStyle}
            >
              {visual.label}
            </span>
            {typeof firstSeenAt === "number" && showUnlocked ? (
              <span
                className="rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.2em]"
                style={{
                  borderColor: withAlpha(visual.accent, 0.16),
                  color: "rgba(30,41,59,0.68)",
                  background: "rgba(255,255,255,0.46)",
                }}
              >
                Recent
              </span>
            ) : null}
            {showNewIndicator ? (
              <span
                className="rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.24em] text-white"
                style={{
                  background: visual.sealBackground,
                  boxShadow: `0 12px 24px ${withAlpha(visual.accent, 0.22)}`,
                }}
              >
                New
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function AchievementHero({
  viewerName,
  titleBadgeName,
  titleBadgeTone,
  titleBadgeGlow,
  earnedCount,
  totalCount,
  completionPercent,
  motivationLine,
  heroTreatment,
  accentColor,
  surfaceText,
}: {
  viewerName: string;
  titleBadgeName: string;
  titleBadgeTone: string;
  titleBadgeGlow: string;
  earnedCount: number;
  totalCount: number;
  completionPercent: number;
  motivationLine: string;
  heroTreatment: ReturnType<typeof buildHeroTreatment>;
  accentColor: string;
  surfaceText: string;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[2.8rem] border px-6 py-7 shadow-[0_34px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8"
      style={{
        borderColor: withAlpha(accentColor, 0.18),
        background: heroTreatment.background,
        boxShadow: `0 34px 90px ${heroTreatment.glow}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: heroTreatment.overlay }} />
      <div
        className="pointer-events-none absolute inset-y-0 right-[-10%] w-[42%] blur-3xl"
        style={{ background: withAlpha(accentColor, completionPercent >= 100 ? 0.28 : 0.16) }}
      />
      {heroTreatment.shimmer ? (
        <span
          className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.46), transparent)",
            animation: "achievementHeroSweep 9s ease-in-out infinite",
          }}
        />
      ) : null}

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.34em] text-white/48">
            Trophy Room
          </p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
            Achievements Worth Showing Off
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/74">
            Every unlocked badge lives here as a trophy, not a checklist item. Earn more, return often, and let the room change as your collection grows.
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/46">
                Unlocked
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black text-white sm:text-6xl">{earnedCount}</span>
                <span className="pb-2 text-lg font-black text-white/56">/ {totalCount}</span>
              </div>
            </div>
            <div className="min-w-[14rem] flex-1">
              <div className="flex items-center justify-between gap-4 text-[0.68rem] font-black uppercase tracking-[0.24em] text-white/54">
                <span>Collection Progress</span>
                <span>{Math.round(completionPercent)}%</span>
              </div>
              <div className="mt-3 h-5 overflow-hidden rounded-full border border-white/12 bg-black/18 p-[3px]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#94A3B8_0%,#60A5FA_34%,#8B5CF6_68%,#F59E0B_100%)] transition-all duration-700" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="mt-3 text-base font-black text-white">
                {motivationLine}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-black text-white/84">
              Locked trophies stay visible so you always know what to chase.
            </span>
            <Link
              href="/learn"
              className="rounded-full px-4 py-2 text-sm font-black text-white transition hover:brightness-110"
              style={{ background: withAlpha(accentColor, 0.28), boxShadow: `0 16px 34px ${withAlpha(accentColor, 0.18)}` }}
            >
              Earn more in Learn
            </Link>
          </div>
        </div>

        <div className="relative rounded-[2.3rem] border border-white/12 bg-white/10 p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div
            className="pointer-events-none absolute inset-x-10 top-6 h-28 rounded-full blur-3xl"
            style={{ background: withAlpha(accentColor, completionPercent >= 100 ? 0.28 : 0.18) }}
          />
          <div className="relative">
            <ProfileAvatar name={viewerName} size="hero" ambient />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-white/46">
              Current Title
            </p>
            <span
              className="mt-3 inline-flex max-w-full rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white"
              style={{
                background: titleBadgeTone,
                borderColor: "rgba(255,255,255,0.34)",
                boxShadow: `0 14px 32px ${titleBadgeGlow}`,
              }}
            >
              {titleBadgeName}
            </span>
            <p className="mt-4 text-2xl font-black" style={{ color: surfaceText }}>
              {viewerName}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/72">
              Your equipped flair anchors the room while each earned badge turns the collection into a personal trophy wall.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AchievementsPage() {
  const motionAllowed = useMotionAllowed();
  const { pathTheme, titleBadge } = useThemeContext();
  const { viewerId, viewerName, activeLanguage, progress, loading, isHydrating } = useCosmetics();
  const [activeFilter, setActiveFilter] = useState<AchievementFilter>("all");
  const [activeSort, setActiveSort] = useState<AchievementSort>("rarity");
  const [displayState, setDisplayState] = useState<AchievementDisplayState>(getDefaultAchievementDisplayState());
  const [recentlyUnlockedIds, setRecentlyUnlockedIds] = useState<string[]>([]);
  const [legendaryFlashActive, setLegendaryFlashActive] = useState(false);
  const [legendaryFlashToken, setLegendaryFlashToken] = useState(0);

  const earnedIds = useMemo(() => (
    Array.from(
      new Set(
        (Array.isArray(progress?.achievements) ? progress.achievements : []).filter(
          (entry): entry is string => typeof entry === "string",
        ),
      ),
    )
  ), [progress]);
  const earnedIdsKey = earnedIds.slice().sort().join("|");
  const earnedSet = useMemo(() => new Set(earnedIds), [earnedIds]);
  const earnedCount = earnedIds.length;
  const completionPercent = ACHIEVEMENTS.length === 0 ? 0 : (earnedCount / ACHIEVEMENTS.length) * 100;
  const heroTreatment = useMemo(
    () => buildHeroTreatment(completionPercent, pathTheme.accentColor, pathTheme.previewHighlight),
    [completionPercent, pathTheme.accentColor, pathTheme.previewHighlight],
  );
  const titleBadgeVisual = titleBadge ?? getFallbackTitleBadge(pathTheme.accentColor);

  useEffect(() => {
    if (isHydrating) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      if (!viewerId || !activeLanguage) {
        startTransition(() => {
          setDisplayState(getDefaultAchievementDisplayState());
          setRecentlyUnlockedIds([]);
        });
        return;
      }

      const previousState = getStoredAchievementDisplayState(viewerId, activeLanguage);
      const { nextState, newlyUnlockedIds } = reconcileAchievementDisplayState({
        currentEarnedIds: earnedIds,
        previousState,
        now: Date.now(),
      });

      const persistedState = motionAllowed || newlyUnlockedIds.length === 0
        ? nextState
        : markAchievementRevealPlayedMany(nextState, newlyUnlockedIds);

      startTransition(() => {
        setDisplayState(persistedState);
        setRecentlyUnlockedIds(motionAllowed ? newlyUnlockedIds : []);
      });
      setStoredAchievementDisplayState(viewerId, activeLanguage, persistedState);
    });

    return () => {
      cancelled = true;
    };
  }, [activeLanguage, earnedIds, earnedIdsKey, isHydrating, motionAllowed, viewerId]);

  const triggerLegendaryFlash = useCallback(() => {
    setLegendaryFlashToken((value) => value + 1);
    setLegendaryFlashActive(true);
  }, []);

  const handleRevealComplete = useCallback((achievementId: string) => {
    if (!viewerId || !activeLanguage) {
      setRecentlyUnlockedIds((current) => current.filter((entry) => entry !== achievementId));
      return;
    }

    setDisplayState((current) => {
      const nextState = markAchievementRevealPlayed(current, achievementId);
      if (nextState !== current) {
        setStoredAchievementDisplayState(viewerId, activeLanguage, nextState);
      }
      return nextState;
    });
    setRecentlyUnlockedIds((current) => current.filter((entry) => entry !== achievementId));
  }, [activeLanguage, viewerId]);

  const groupedAchievements = useMemo(() => {
    return RARITY_ORDER.map((rarity) => {
      const inFilter = ACHIEVEMENTS.filter((achievement) => {
        const earned = earnedSet.has(achievement.id);
        if (activeFilter === "unlocked") return earned;
        if (activeFilter === "locked") return !earned;
        if (activeFilter === "legendary" || activeFilter === "epic" || activeFilter === "rare") {
          return achievement.rarity === activeFilter;
        }
        return true;
      }).filter((achievement) => achievement.rarity === rarity);

      return {
        rarity,
        achievements: sortAchievementsForSection({
          achievements: inFilter,
          earnedSet,
          sortMode: activeSort,
          firstSeenAtById: displayState.firstSeenAtById,
        }),
      };
    }).filter((group) => group.achievements.length > 0);
  }, [activeFilter, activeSort, displayState.firstSeenAtById, earnedSet]);

  const visibleAchievementCount = groupedAchievements.reduce((count, group) => count + group.achievements.length, 0);

  return (
    <main className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
      <style>{`
        @keyframes achievementCardShine {
          0% { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
          12%, 100% { opacity: 0; }
          30% { opacity: 1; }
          46% { transform: translateX(420%) skewX(-18deg); opacity: 0; }
        }
        @keyframes achievementLegendaryHalo {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes achievementLockedPulse {
          0%, 100% { opacity: 0.28; }
          50% { opacity: 0.6; }
        }
        @keyframes achievementCardShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes achievementCardReveal {
          0% { transform: perspective(1400px) rotateY(-90deg) scale(0.95); opacity: 0.32; }
          55% { opacity: 1; }
          100% { transform: perspective(1400px) rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes achievementTitleCrash {
          0% { transform: scale(0.72); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes achievementBurst {
          0% { transform: translate3d(0, 0, 0) scale(0.4); opacity: 0; }
          16% { opacity: 1; }
          100% { transform: translate3d(var(--achievement-burst-x), var(--achievement-burst-y), 0) scale(1.14); opacity: 0; }
        }
        @keyframes legendaryFlash {
          0% { opacity: 0; }
          16% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes achievementLegendarySpark {
          0%, 100% { transform: scale(0.8); opacity: 0.24; }
          50% { transform: scale(1.14); opacity: 1; }
        }
        @keyframes achievementHeroSweep {
          0% { transform: translateX(-180%) skewX(-16deg); opacity: 0; }
          14%, 100% { opacity: 0; }
          34% { opacity: 1; }
          52% { transform: translateX(400%) skewX(-16deg); opacity: 0; }
        }
        .achievement-card-shake { animation: achievementCardShake 360ms ease-in-out 2; }
        .achievement-card-reveal { animation: achievementCardReveal 720ms cubic-bezier(0.22,1,0.36,1); }
        .achievement-title-crash { animation: achievementTitleCrash 620ms cubic-bezier(0.22,1,0.36,1); transform-origin: left center; }
        .achievement-seal { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.22), 0 12px 28px rgba(15,23,42,0.18); }
      `}</style>

      {legendaryFlashActive ? (
        <LegendaryFlashOverlay
          key={legendaryFlashToken}
          onDone={() => setLegendaryFlashActive(false)}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.94 }} />
      {pathTheme.id === "celestial" || pathTheme.id === "the_void" ? (
        <MythicThemeLayer themeId={pathTheme.id} className="opacity-70" />
      ) : (
        <AmbientEffectsLayer effects={pathTheme.ambientEffects} enabled className="opacity-55" />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 14% 16%, ${withAlpha(pathTheme.accentColor, 0.16)}, transparent 24%), radial-gradient(circle at 82% 18%, ${withAlpha(pathTheme.previewHighlight, 0.16)}, transparent 28%)`,
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppTopNav />

        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AchievementHero
            viewerName={viewerName}
            titleBadgeName={titleBadgeVisual.name}
            titleBadgeTone={titleBadgeVisual.tone}
            titleBadgeGlow={titleBadgeVisual.glow}
            earnedCount={earnedCount}
            totalCount={ACHIEVEMENTS.length}
            completionPercent={completionPercent}
            motivationLine={heroTreatment.band.line}
            heroTreatment={heroTreatment}
            accentColor={pathTheme.accentColor}
            surfaceText={pathTheme.surfaceText}
          />

          <section
            className="mt-6 rounded-[2rem] border p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-5"
            style={{
              borderColor: withAlpha(pathTheme.accentColor, 0.16),
              background: pathTheme.surfaceCard,
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.48) }}>
                  Filter Trophies
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((option) => {
                    const active = activeFilter === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveFilter(option.id)}
                        className="rounded-full px-4 py-2 text-sm font-black transition hover:brightness-110"
                        style={active
                          ? {
                              background: `linear-gradient(135deg, ${pathTheme.accentColor} 0%, ${mixHex(pathTheme.accentColor, pathTheme.previewHighlight, 0.34)} 100%)`,
                              color: "#ffffff",
                              boxShadow: `0 14px 30px ${withAlpha(pathTheme.accentColor, 0.18)}`,
                            }
                          : {
                              background: withAlpha("#000000", 0.06),
                              color: withAlpha(pathTheme.surfaceText, 0.7),
                            }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.48) }}>
                  Sort
                </p>
                <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                  {SORT_OPTIONS.map((option) => {
                    const active = activeSort === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveSort(option.id)}
                        className="rounded-full border px-4 py-2 text-sm font-black transition hover:brightness-110"
                        style={active
                          ? {
                              borderColor: withAlpha(pathTheme.accentColor, 0.24),
                              background: withAlpha(pathTheme.accentColor, 0.12),
                              color: pathTheme.accentColor,
                            }
                          : {
                              borderColor: withAlpha(pathTheme.accentColor, 0.12),
                              background: withAlpha("#ffffff", 0.42),
                              color: withAlpha(pathTheme.surfaceText, 0.68),
                            }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {loading || isHydrating ? (
            <section className="mt-6 space-y-6">
              {RARITY_ORDER.map((rarity) => (
                <div key={rarity} className="rounded-[2rem] border p-5" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: pathTheme.surfaceCard }}>
                  <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200/80" />
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={`${rarity}-${index}`} className="rounded-[2rem] border p-5" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: withAlpha("#ffffff", 0.44) }}>
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-20 animate-pulse rounded-[1.7rem] bg-slate-200" />
                          <div className="min-w-0 flex-1">
                            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-4 h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : visibleAchievementCount === 0 ? (
            <section
              className="mt-6 rounded-[2.3rem] border p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
              style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: pathTheme.surfaceCard }}
            >
              <p className="text-[0.7rem] font-black uppercase tracking-[0.3em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>
                No Matches
              </p>
              <h2 className="mt-3 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>
                This wing is empty right now.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>
                Try a different filter or keep learning to bring more trophies into the room.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="rounded-full px-4 py-2 text-sm font-black text-white transition hover:brightness-110"
                  style={{ background: pathTheme.accentColor }}
                >
                  View All
                </button>
                <Link
                  href="/learn"
                  className="rounded-full border px-4 py-2 text-sm font-black transition hover:brightness-110"
                  style={{
                    borderColor: withAlpha(pathTheme.accentColor, 0.18),
                    color: pathTheme.accentColor,
                    background: withAlpha(pathTheme.accentColor, 0.08),
                  }}
                >
                  Open Learn
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-6 space-y-7">
              {groupedAchievements.map(({ rarity, achievements }) => {
                const unlockedCount = achievements.filter((achievement) => earnedSet.has(achievement.id)).length;

                return (
                  <div key={rarity}>
                    <AchievementSectionHeader
                      rarity={rarity}
                      unlockedCount={unlockedCount}
                      totalCount={achievements.length}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      {achievements.map((achievement) => (
                        <AchievementTrophyCard
                          key={`${achievement.id}:${recentlyUnlockedIds.includes(achievement.id) ? "new" : "stable"}`}
                          achievement={achievement}
                          earned={earnedSet.has(achievement.id)}
                          recentlyUnlocked={recentlyUnlockedIds.includes(achievement.id)}
                          motionAllowed={motionAllowed}
                          firstSeenAt={displayState.firstSeenAtById[achievement.id]}
                          onRevealComplete={handleRevealComplete}
                          onLegendaryReveal={triggerLegendaryFlash}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>

      <MobileDock />
    </main>
  );
}
