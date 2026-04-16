"use client";

export type LeagueZone = "promotion" | "safe" | "demotion" | "near_promotion" | "near_demotion";
export type RowZone = "promotion" | "safe" | "demotion";

export type Player = {
  id: string;
  name: string;
  xp: number;
  rank: number;
  avatarUrl: string | null;
  isYou?: boolean;
  isRival?: boolean;
  isGhost?: boolean;
  rivalSurge?: boolean;
};

export const STORM_THEME = {
  background: "#0d1117",
  backgroundPromotion: "#0f1520",
  backgroundDemotion: "#100d0d",
  surface: "#111820",
  surfaceRaised: "#161f2e",
  border: "rgba(255,255,255,0.07)",
  borderSubtle: "rgba(255,255,255,0.04)",
  textPrimary: "#e8e4dc",
  textSecondary: "rgba(232,228,220,0.55)",
  textMuted: "rgba(232,228,220,0.30)",
  accentOrange: "#e8820c",
  accentGreen: "#22c55e",
  accentRed: "#ef4444",
  accentGold: "#c8a84b",
  accentBlue: "#7090cc",
  medalSilver: "#9ca3af",
  medalBronze: "#b87333",
  badgeText: "#1a1200",
  badgeTextDark: "#1a0800",
} as const;

export const LEAGUE_SANS_FONT = "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
export const LEAGUE_SERIF_FONT = "Georgia, serif";
export const LEAGUE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function computeZone(rank: number, total: number): LeagueZone {
  const safeTotal = Math.max(total, 1);
  if (rank <= 10) return "promotion";
  if (rank <= 12) return "near_promotion";
  if (rank >= safeTotal - 4) return "demotion";
  if (rank >= safeTotal - 7) return "near_demotion";
  return "safe";
}

export function getRowZone(rank: number, total: number, promotionCutoff = 10, demotionCount = 5): RowZone {
  if (rank <= promotionCutoff) return "promotion";
  if (rank > total - demotionCount) return "demotion";
  return "safe";
}

export function getRankColor(rank: number) {
  if (rank === 1) return STORM_THEME.accentGold;
  if (rank === 2) return STORM_THEME.medalSilver;
  if (rank === 3) return STORM_THEME.medalBronze;
  return STORM_THEME.textMuted;
}

export function getAvatarColor(seed: string) {
  const palette = [
    "rgba(112,144,204,0.22)",
    "rgba(232,130,12,0.18)",
    "rgba(200,168,75,0.18)",
    "rgba(255,255,255,0.08)",
  ];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length] ?? palette[0];
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PI";
}

export function formatXp(value: number) {
  return `${Math.max(0, Math.round(value)).toLocaleString("en-US")} XP`;
}

export function formatCompactHours(totalHours: number) {
  const safeHours = Math.max(0, Math.floor(totalHours));
  const days = Math.floor(safeHours / 24);
  const hours = safeHours % 24;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return `${hours}h`;
}

export function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function getWeekNumber(date: string) {
  const current = new Date(date);
  const firstDay = new Date(current.getFullYear(), 0, 1);
  const days = Math.floor((current.getTime() - firstDay.getTime()) / 86400000);
  return Math.ceil((days + firstDay.getDay() + 1) / 7);
}

export function getNextMultiplierThreshold(streak: number) {
  if (streak < 3) return { days: 3, multiplier: 1.2 };
  if (streak < 7) return { days: 7, multiplier: 1.5 };
  if (streak < 14) return { days: 14, multiplier: 2.0 };
  return null;
}

export function getLeagueBackground(zone: LeagueZone) {
  if (zone === "promotion") return STORM_THEME.backgroundPromotion;
  if (zone === "demotion") return STORM_THEME.backgroundDemotion;
  return STORM_THEME.background;
}
