"use client";

import Link from "next/link";
import {
  Fragment,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGroupLeaderboard, useHotStreak, useOvertakeEvents } from "@/lib/hooks/useLeague";
import {
  clamp,
  easeOutCubic,
  getAvatarColor,
  getInitials,
  getNextMultiplierThreshold,
  getRankColor,
  getWeekNumber,
  LEAGUE_EASE,
  LEAGUE_SANS_FONT,
  LEAGUE_SERIF_FONT,
  STORM_THEME,
  type LeagueZone,
  type Player,
  type RowZone,
} from "@/components/leagues/storm";
import type { LeaderboardEntry, League, LeagueMembership, LeagueWeek } from "@/lib/types/leagues";

type LeagueEventType = "double_xp" | "shuffle" | "rival_surge" | "promotion_rush";

type LeagueEvent = {
  type: LeagueEventType;
  expiresIn: string;
  expiresAt: string;
  key: string;
};

interface LeagueState {
  rank: number;
  xp: number;
  xpToPromotion: number;
  xpToDemotion: number;
  zone: LeagueZone;
  rivalGap: number;
  streak: number;
  multiplier: number;
  hoursRemaining: number;
  players: Array<Player | null>;
  eventActive: LeagueEvent | null;
}

type LeagueTabProps = {
  membership: LeagueMembership | null;
  league: League | null;
  week: LeagueWeek | null;
  loading: boolean;
  onZoneChange?: (zone: LeagueZone) => void;
};

type SimEntry = {
  id: string;
  name: string;
  xp: number;
  rank: number;
  avatarUrl: string | null;
  isYou: boolean;
  isRival: boolean;
  isGhost: boolean;
  rivalSurge: boolean;
  momentum: number;
  recentActivity: boolean[];
  seedOrder: number;
};

type LeagueRuntime = {
  entries: SimEntry[];
  state: LeagueState;
};

type ToastType = "passed_by" | "overtook" | "milestone" | "event";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  expiresAt: number;
};

type DistanceTone = "default" | "promotion" | "danger";

type RuntimeOptions = {
  totalPlayers: number;
  promotionCutoffRank: number;
  demotionCount: number;
  streak: number;
  multiplier: number;
  eventType: LeagueEventType | null;
  weekEnd: string | null;
  weekId: string | null;
  fallbackXp: number;
  fallbackRank: number;
  now: number;
};

type StatBlockProps = {
  label: string;
  value: string;
  valueColor?: string;
};

type StreakPillProps = {
  multiplier: string;
  days: number;
};

type ProgressBarProps = {
  state: LeagueState;
  totalXP: number;
  promotionCutoffXP: number;
  demotionCutoffXP: number;
  distanceMessage: ReactNode;
};

type RivalCardProps = {
  rival: SimEntry;
  myXP: number;
  hoursRemaining: number;
};

type LeaderboardRowProps = {
  rank: number;
  rowKey: string;
  player: Player | null;
  isYou: boolean;
  isRival: boolean;
  zone: RowZone;
  doubleXp?: boolean;
  shuffleFlash?: boolean;
  medalSweep?: boolean;
  dangerPulse?: boolean;
  onXpRef?: (node: HTMLDivElement | null) => void;
};

type ZoneDividerProps = {
  zone: RowZone;
  label: string;
  bright?: boolean;
};

type EventBannerProps = {
  type: LeagueEventType;
  expiresAt: string;
  onDismiss: () => void;
  finalHours: boolean;
};

type LeagueBadgeProps = {
  leagueName: string;
  shimmerIntervalMs: number;
  pulse: boolean;
};

const sectionLabelStyle = {
  color: STORM_THEME.textMuted,
  fontFamily: LEAGUE_SANS_FONT,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  lineHeight: 1,
  textTransform: "uppercase",
} as const;

const GHOST_NAMES = ["Alex", "Jordan", "Riley", "Morgan", "Quinn", "Avery", "Rowan", "Sage", "Parker", "Skyler"];
const GHOST_INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
const GHOST_AVATAR_STYLES = ["micah", "personas", "adventurer-neutral", "thumbs", "fun-emoji"] as const;

function ghostPersona(seedValue: string) {
  let hash = 0;
  for (let index = 0; index < seedValue.length; index += 1) {
    hash = ((hash << 5) - hash) + seedValue.charCodeAt(index);
    hash |= 0;
  }
  const safeHash = Math.abs(hash);
  const first = GHOST_NAMES[safeHash % GHOST_NAMES.length] ?? "Pico";
  const last = GHOST_INITIALS[(safeHash >> 3) % GHOST_INITIALS.length] ?? "L";
  const style = GHOST_AVATAR_STYLES[(safeHash >> 5) % GHOST_AVATAR_STYLES.length] ?? "micah";

  return {
    name: `${first} ${last}.`,
    avatarUrl: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(`${first}-${last}-${safeHash}`)}`,
  };
}

function sanitizeName(name: string | null | undefined, isGhost: boolean) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return isGhost ? "Ghost learner" : "Pico learner";
}

function normalizeEventType(modifierType: string | null | undefined, modifierLabel: string | null | undefined): LeagueEventType | null {
  const raw = `${modifierType ?? ""} ${modifierLabel ?? ""}`.trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("double") && raw.includes("xp")) return "double_xp";
  if (raw.includes("shuffle")) return "shuffle";
  if (raw.includes("rival") && raw.includes("surge")) return "rival_surge";
  if (raw.includes("promotion") && raw.includes("rush")) return "promotion_rush";
  return null;
}

function formatEventExpiry(endAt: string, now: number) {
  const diff = Math.max(0, new Date(endAt).getTime() - now);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function computeHoursRemaining(weekEnd: string | null, now: number) {
  if (!weekEnd) return 0;
  return Math.max(0, Math.ceil((new Date(weekEnd).getTime() - now) / 3600000));
}

function getLeagueBadgeLabel(name: string) {
  return name.slice(0, 4).toUpperCase();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function initialMomentum(rank: number, totalPlayers: number, promotionCutoffRank: number, demotionCount: number, isRival: boolean) {
  if (isRival) return 0.6;
  const firstDemotionRank = Math.max(totalPlayers - demotionCount + 1, 1);
  if (rank >= promotionCutoffRank - 2 && rank <= promotionCutoffRank + 3) {
    return 0.5 + Math.random() * 0.3;
  }
  if (rank >= firstDemotionRank) {
    return 0.1 + Math.random() * 0.2;
  }
  return 0.2 + Math.random() * 0.5;
}

function sortEntries(entries: SimEntry[]) {
  return [...entries]
    .sort((left, right) => {
      if (right.xp !== left.xp) return right.xp - left.xp;
      return left.seedOrder - right.seedOrder;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function mapEntryToPlayer(entry: SimEntry): Player | null {
  return {
    id: entry.id,
    name: entry.name,
    xp: entry.xp,
    rank: entry.rank,
    avatarUrl: entry.avatarUrl,
    isYou: entry.isYou,
    isRival: entry.isRival,
    isGhost: entry.isGhost,
    rivalSurge: entry.rivalSurge,
  };
}

function computeLeagueZone(
  rank: number,
  totalPlayers: number,
  xpToPromotion: number,
  xpToDemotion: number,
  promotionCutoffRank: number,
  demotionCount: number,
): LeagueZone {
  const firstDemotionRank = Math.max(totalPlayers - demotionCount + 1, 1);
  const lastSafeRank = Math.max(firstDemotionRank - 1, 1);

  if (rank <= promotionCutoffRank) return "promotion";
  if (xpToPromotion > 0 && xpToPromotion <= 50) return "near_promotion";
  if (rank >= firstDemotionRank) return "demotion";
  if (xpToDemotion <= 50 || rank >= lastSafeRank - 2) return "near_demotion";
  return "safe";
}

function buildSeedEntries(
  entries: LeaderboardEntry[],
  totalPlayers: number,
  promotionCutoffRank: number,
  demotionCount: number,
  eventType: LeagueEventType | null,
) {
  const seeded = Array.from({ length: totalPlayers }, (_, index) => {
    const entry = entries[index] ?? null;
    const rank = index + 1;
    const isGhost = entry?.isGhost ?? true;
    const ghost = ghostPersona(entry?.userId ?? `ghost-${rank}`);

    return {
      id: entry?.userId ?? `ghost-${rank}`,
      name: isGhost ? (entry?.username ?? ghost.name) : sanitizeName(entry?.username, false),
      xp: entry?.xpThisWeek ?? 0,
      rank,
      avatarUrl: entry?.avatarUrl ?? (isGhost ? ghost.avatarUrl : null),
      isYou: Boolean(entry?.isMe),
      isRival: Boolean(entry?.isRival),
      isGhost,
      rivalSurge: eventType === "rival_surge" && Boolean(entry?.isRival),
      momentum: initialMomentum(rank, totalPlayers, promotionCutoffRank, demotionCount, Boolean(entry?.isRival)),
      recentActivity: [false, false, false, false, false],
      seedOrder: rank,
    } satisfies SimEntry;
  });

  return sortEntries(seeded);
}

function mergeDynamicEntryFields(nextEntries: SimEntry[], previousEntries: SimEntry[] | null) {
  if (!previousEntries) return nextEntries;
  const previousMap = new Map(previousEntries.map((entry) => [entry.id, entry]));
  return nextEntries.map((entry) => {
    const previous = previousMap.get(entry.id);
    if (!previous) return entry;
    return {
      ...entry,
      momentum: entry.isRival ? 0.6 : previous.momentum,
      recentActivity: previous.recentActivity,
      seedOrder: previous.seedOrder,
    };
  });
}

function createLeagueRuntime(entries: SimEntry[], options: RuntimeOptions): LeagueRuntime {
  const orderedEntries = sortEntries(entries);
  const youEntry = orderedEntries.find((entry) => entry.isYou) ?? null;
  const rivalEntry = orderedEntries.find((entry) => entry.isRival) ?? null;
  const promotionTarget = orderedEntries[Math.max(options.promotionCutoffRank - 1, 0)]?.xp ?? (youEntry?.xp ?? options.fallbackXp);
  const firstDemotionRank = Math.max(options.totalPlayers - options.demotionCount + 1, 1);
  const firstDemotionEntry = orderedEntries[Math.max(firstDemotionRank - 1, 0)] ?? null;
  const lastSafeEntry = orderedEntries[Math.max(firstDemotionRank - 2, 0)] ?? firstDemotionEntry;
  const rank = youEntry?.rank ?? options.fallbackRank;
  const xp = youEntry?.xp ?? options.fallbackXp;
  const xpToPromotion = rank <= options.promotionCutoffRank ? 0 : Math.max(0, promotionTarget - xp + 1);
  const xpToDemotion = rank >= firstDemotionRank
    ? Math.max(0, (lastSafeEntry?.xp ?? xp) - xp + 1)
    : Math.max(0, xp - (firstDemotionEntry?.xp ?? xp));
  const zone = computeLeagueZone(
    rank,
    options.totalPlayers,
    xpToPromotion,
    xpToDemotion,
    options.promotionCutoffRank,
    options.demotionCount,
  );
  const hoursRemaining = computeHoursRemaining(options.weekEnd, options.now);

  return {
    entries: orderedEntries,
    state: {
      rank,
      xp,
      xpToPromotion,
      xpToDemotion,
      zone,
      rivalGap: rivalEntry ? rivalEntry.xp - xp : 0,
      streak: options.streak,
      multiplier: options.multiplier,
      hoursRemaining,
      players: orderedEntries.map(mapEntryToPlayer),
      eventActive: options.eventType && options.weekEnd
        ? {
            type: options.eventType,
            expiresAt: options.weekEnd,
            expiresIn: formatEventExpiry(options.weekEnd, options.now),
            key: `${options.eventType}-${options.weekId ?? options.weekEnd}`,
          }
        : null,
    },
  };
}

function markRecentActivity(entries: SimEntry[], activeId: string | null) {
  return entries.map((entry) => {
    if (entry.isGhost || entry.isYou) return entry;
    return {
      ...entry,
      recentActivity: [...entry.recentActivity.slice(-4), activeId === entry.id],
    };
  });
}

function getVisibleSafeRanks(myRank: number, totalPlayers: number, promotionCutoffRank: number, demotionCount: number) {
  const safeStart = promotionCutoffRank + 1;
  const safeEnd = Math.max(totalPlayers - demotionCount, safeStart);
  const safeRanks = Array.from({ length: Math.max(safeEnd - safeStart + 1, 0) }, (_, index) => safeStart + index);
  if (safeRanks.length <= 8) return safeRanks;

  const focus = safeRanks.filter((rank) => Math.abs(rank - myRank) <= 2);
  const selected = new Set<number>([
    safeRanks[0] ?? safeStart,
    safeRanks[1] ?? safeStart + 1,
    safeRanks[safeRanks.length - 2] ?? safeEnd - 1,
    safeRanks[safeRanks.length - 1] ?? safeEnd,
    ...focus,
  ]);

  return safeRanks.filter((rank) => selected.has(rank));
}

function buildDistanceMessage(state: LeagueState, secondPlaceXp: number | null, override: string | null) {
  if (override) return <span>{override}</span>;
  if (state.rank === 1) return <span>You&apos;re leading the league — don&apos;t stop now</span>;
  if (secondPlaceXp !== null && state.xp > secondPlaceXp + 500) {
    return <span>You&apos;re well clear of promotion — keep your streak going</span>;
  }
  if (state.zone === "promotion") {
    return <span>You&apos;re in the promotion zone — hold your position</span>;
  }
  if (state.zone === "near_promotion") {
    return (
      <span>
        You are <strong>{state.xpToPromotion} XP</strong> from promotion — one lesson gets you there
      </span>
    );
  }
  if (state.zone === "safe") {
    return (
      <span>
        You are safe this week · <strong>{state.xpToPromotion} XP</strong> from promotion
      </span>
    );
  }
  if (state.zone === "near_demotion") {
    return (
      <span>
        Warning: you are <strong>{state.xpToDemotion} XP</strong> from the demotion zone
      </span>
    );
  }
  return (
    <span>
      Do one lesson now to avoid demotion — <strong>{state.xpToDemotion} XP</strong> needed
    </span>
  );
}

function animateXPCountUp(el: HTMLElement, from: number, to: number, duration = 800, suffix = " XP") {
  const start = performance.now();
  const diff = to - from;

  function tick(nowValue: number) {
    const progress = Math.min((nowValue - start) / duration, 1);
    const eased = easeOutCubic(progress);
    el.textContent = `${Math.round(from + diff * eased).toLocaleString("en-US")}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  }

  window.requestAnimationFrame(tick);
}

function animateGapLabel(el: HTMLElement, value: number) {
  const absolute = Math.abs(Math.round(value));
  const ahead = value <= 0;
  el.textContent = `${absolute.toLocaleString("en-US")} XP ${ahead ? "ahead" : "behind"}`;
  el.style.color = ahead ? STORM_THEME.accentGreen : STORM_THEME.accentRed;
}

function rollRankNumber(el: HTMLElement, oldRank: number, newRank: number) {
  const direction = newRank < oldRank ? 1 : -1;
  el.style.transition = "transform 180ms ease-in, opacity 180ms ease-in";
  el.style.transform = `translateY(${direction * -100}%)`;
  el.style.opacity = "0";

  window.setTimeout(() => {
    el.textContent = `#${newRank}`;
    el.style.transition = "none";
    el.style.transform = `translateY(${direction * 100}%)`;
    el.style.opacity = "0";

    window.requestAnimationFrame(() => {
      el.style.transition = "transform 200ms ease-out, opacity 200ms ease-out";
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    });
  }, 190);
}

function startYouRowBreathing(el: HTMLElement) {
  let start: number | null = null;
  let paused = false;
  let rafId = 0;

  function tick(time: number) {
    if (!paused) {
      if (start === null) start = time;
      const t = (time - start) / 3000;
      const scale = 1 + Math.sin(t * Math.PI * 2) * 0.0015;
      const opacity = 1 - Math.sin(t * Math.PI * 2) * 0.04;
      el.style.transform = `scaleX(${scale})`;
      el.style.opacity = String(opacity);
    }
    rafId = window.requestAnimationFrame(tick);
  }

  rafId = window.requestAnimationFrame(tick);

  return {
    pause: () => {
      paused = true;
      el.style.transform = "";
      el.style.opacity = "1";
    },
    resume: () => {
      paused = false;
      start = null;
    },
    stop: () => {
      window.cancelAnimationFrame(rafId);
      el.style.transform = "";
      el.style.opacity = "1";
    },
  };
}

function startPromotionPulse(el: HTMLElement) {
  let phase = 0;
  let rafId = 0;

  function tick() {
    phase += 0.025;
    const glow = 0.15 + Math.sin(phase) * 0.1;
    el.style.boxShadow = `0 0 0 2px rgba(34,197,94,${glow})`;
    rafId = window.requestAnimationFrame(tick);
  }

  rafId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(rafId);
    el.style.boxShadow = "";
  };
}

function showRankUpTrail(el: HTMLElement) {
  const trail = document.createElement("div");
  trail.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(to bottom, transparent, ${STORM_THEME.accentOrange}, transparent);
    border-radius: 2px;
    pointer-events: none;
    animation: leagueTrailFade 600ms ease-out forwards;
  `;
  el.style.position = "relative";
  el.appendChild(trail);
  window.setTimeout(() => {
    trail.remove();
  }, 620);
}

function spawnParticles(anchor: HTMLElement, count: number, colors: string[], upward = true) {
  const rect = anchor.getBoundingClientRect();
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)] ?? colors[0];
    const size = 3 + Math.random() * 4;
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + Math.random() * rect.width}px;
      top: ${rect.top + rect.height * 0.5}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      background: ${color};
      pointer-events: none;
      z-index: 9999;
      transition: transform ${800 + Math.random() * 600}ms ease-out, opacity ${800 + Math.random() * 600}ms ease-out;
    `;
    document.body.appendChild(particle);
    window.requestAnimationFrame(() => {
      const x = (Math.random() - 0.5) * 40;
      const y = upward ? -40 - Math.random() * 30 : 20 + Math.random() * 20;
      particle.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg)`;
      particle.style.opacity = "0";
    });
    window.setTimeout(() => {
      particle.remove();
    }, 1500);
  }
}

function spawnOvertakeParticles(anchor: HTMLElement) {
  spawnParticles(anchor, 8, [STORM_THEME.accentOrange]);
}

function spawnConfetti(anchor: HTMLElement) {
  spawnParticles(anchor, 15, [STORM_THEME.accentGreen, STORM_THEME.accentGold, STORM_THEME.accentOrange]);
}

function showBonusFloater(anchor: HTMLElement, text: string, color: string) {
  const floater = document.createElement("div");
  floater.textContent = text;
  floater.style.cssText = `
    position: absolute;
    right: 16px;
    top: 12px;
    color: ${color};
    font-family: ${LEAGUE_SANS_FONT};
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
    z-index: 3;
    transition: transform 800ms ease-out, opacity 800ms ease-out;
  `;
  anchor.style.position = "relative";
  anchor.appendChild(floater);
  window.requestAnimationFrame(() => {
    floater.style.transform = "translateY(-20px)";
    floater.style.opacity = "0";
  });
  window.setTimeout(() => {
    floater.remove();
  }, 850);
}

const StatBlock = forwardRef<HTMLDivElement, StatBlockProps>(function StatBlock({ label, value, valueColor }, ref) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={sectionLabelStyle}>{label}</div>
      <div
        ref={ref}
        style={{
          color: valueColor ?? STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.1,
          marginTop: 4,
          minHeight: 20,
          position: "relative",
        }}
      >
        {value}
      </div>
    </div>
  );
});

function StreakPill({ multiplier, days }: StreakPillProps) {
  const nextThreshold = getNextMultiplierThreshold(days);
  const tooltip = nextThreshold
    ? `${Math.max(nextThreshold.days - days, 0)} more days to reach ${nextThreshold.multiplier.toFixed(1)}×`
    : "Maximum streak multiplier reached";

  return (
    <div
      title={tooltip}
      style={{
        alignItems: "center",
        background: "rgba(232,130,12,0.15)",
        border: "1px solid rgba(232,130,12,0.30)",
        borderRadius: 4,
        display: "inline-flex",
        gap: 6,
        padding: "3px 10px",
      }}
    >
      <span
        style={{
          color: STORM_THEME.accentOrange,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {multiplier}
      </span>
      <span
        style={{
          color: "rgba(232,130,12,0.6)",
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {days} days
      </span>
    </div>
  );
}

function LeagueBadge({ leagueName, shimmerIntervalMs, pulse }: LeagueBadgeProps) {
  const shimmerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let resetTimer = 0;

    const runShimmer = () => {
      const shimmer = shimmerRef.current;
      if (!shimmer) return;
      shimmer.style.transition = "none";
      shimmer.style.transform = "translateX(-150%)";

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!shimmerRef.current) return;
          shimmerRef.current.style.transition = "transform 600ms ease";
          shimmerRef.current.style.transform = "translateX(180%)";
        });
      });

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        if (!shimmerRef.current) return;
        shimmerRef.current.style.transition = "none";
        shimmerRef.current.style.transform = "translateX(-150%)";
      }, 620);
    };

    runShimmer();
    const interval = window.setInterval(runShimmer, shimmerIntervalMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(resetTimer);
    };
  }, [shimmerIntervalMs]);

  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: STORM_THEME.accentGold,
        border: "2px solid rgba(200,168,75,0.3)",
        color: STORM_THEME.badgeText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: LEAGUE_SANS_FONT,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        overflow: "hidden",
        position: "relative",
        textTransform: "uppercase",
        animation: pulse ? "leagueNearPromotionPulse 2s ease-in-out infinite" : undefined,
      }}
    >
      <div
        ref={shimmerRef}
        style={{
          position: "absolute",
          inset: "-40%",
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))",
          transform: "translateX(-150%)",
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{getLeagueBadgeLabel(leagueName)}</span>
    </div>
  );
}

function ProgressBar({ state, totalXP, promotionCutoffXP, demotionCutoffXP, distanceMessage }: ProgressBarProps) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const percent = totalXP > 0 ? clamp((state.xp / totalXP) * 100, 0, 100) : 0;
  const promotionPercent = state.eventActive?.type === "promotion_rush"
    ? 50
    : totalXP > 0
      ? clamp((promotionCutoffXP / totalXP) * 100, 0, 100)
      : 0;
  const demotionPercent = totalXP > 0 ? clamp((demotionCutoffXP / totalXP) * 100, 0, 100) : 0;
  const dotColor = state.zone === "promotion"
    ? STORM_THEME.accentGreen
    : state.zone === "demotion" || state.zone === "near_demotion"
      ? STORM_THEME.accentRed
      : STORM_THEME.accentOrange;

  useEffect(() => {
    const dot = dotRef.current;
    const fill = fillRef.current;
    if (!dot || !fill) return;
    const dotNode = dot;
    const fillNode = fill;

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const start = performance.now();

      function tick(nowValue: number) {
        const progress = Math.min((nowValue - start) / 900, 1);
        const eased = easeOutCubic(progress);
        const current = percent * eased;
        fillNode.style.width = `${current}%`;
        dotNode.style.left = `calc(${current}% - 6px)`;
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      }

      window.requestAnimationFrame(tick);
      return;
    }

    fillNode.style.transition = "width 600ms ease-out";
    dotNode.style.transition = "left 600ms ease-out, background 180ms ease";
    fillNode.style.width = `${percent}%`;
    dotNode.style.left = `calc(${percent}% - 6px)`;
  }, [percent]);

  return (
    <div>
      <div
        style={{
          height: 5,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 3,
          overflow: "visible",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${demotionPercent}%`,
            background: STORM_THEME.accentRed,
            borderRadius: 3,
            opacity: state.zone === "demotion" || state.zone === "near_demotion" ? 0.7 : 0.45,
            animation: state.zone === "demotion" || state.zone === "near_demotion" ? "leagueRedSegmentPulse 1.2s ease-in-out infinite" : undefined,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${demotionPercent}%`,
            top: 0,
            bottom: 0,
            width: `${Math.max(promotionPercent - demotionPercent, 0)}%`,
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${promotionPercent}%`,
            top: 0,
            bottom: 0,
            width: `${Math.max(100 - promotionPercent, 0)}%`,
            background: STORM_THEME.accentGreen,
            borderRadius: 3,
            opacity: 0.58,
            overflow: "hidden",
          }}
        >
          {state.zone === "promotion" ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))",
                animation: "leaguePromotionShimmer 3s linear infinite",
              }}
            />
          ) : null}
        </div>

        <div
          ref={fillRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "0%",
            background: "rgba(232,130,12,0.72)",
            borderRadius: 3,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `${promotionPercent}%`,
            top: "50%",
            width: 13,
            height: 13,
            borderRadius: "50%",
            border: `2px solid ${STORM_THEME.background}`,
            background: "rgba(255,255,255,0.18)",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div
          ref={dotRef}
          style={{
            position: "absolute",
            left: "calc(0% - 6px)",
            top: "50%",
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: dotColor,
            border: `2px solid ${STORM_THEME.background}`,
            transform: "translateY(-50%)",
            boxShadow: state.zone === "promotion"
              ? "0 0 0 3px rgba(34,197,94,0.28)"
              : state.zone === "demotion" || state.zone === "near_demotion"
                ? "0 0 0 4px rgba(239,68,68,0.32)"
                : state.zone === "near_promotion"
                  ? "0 0 0 4px rgba(232,130,12,0.3)"
                  : "none",
            animation: state.zone === "near_promotion"
              ? "leagueDotRingPulse 1.5s ease-in-out infinite"
              : undefined,
          }}
        />
      </div>

      <div
        style={{
          alignItems: "center",
          color: STORM_THEME.textMuted,
          display: "flex",
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 11,
          fontWeight: 600,
          justifyContent: "space-between",
          letterSpacing: "0.02em",
          lineHeight: 1,
          marginTop: 16,
        }}
      >
        <span style={{ color: STORM_THEME.accentRed }}>Demotion</span>
        <span>Safe zone</span>
        <span style={{ color: STORM_THEME.accentGreen }}>Promotion</span>
      </div>

      <div
        style={{
          color: state.zone === "demotion" || state.zone === "near_demotion"
            ? STORM_THEME.accentRed
            : STORM_THEME.textSecondary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 12,
          fontWeight: state.zone === "demotion" || state.zone === "near_demotion" ? 600 : 400,
          lineHeight: 1.5,
          marginTop: 8,
          textShadow: state.zone === "near_promotion" ? "0 0 10px rgba(232,130,12,0.14)" : undefined,
        }}
      >
        {distanceMessage}
      </div>
    </div>
  );
}

const RivalCard = forwardRef<HTMLDivElement, RivalCardProps>(function RivalCard({ rival, myXP, hoursRemaining }, ref) {
  const gapRef = useRef<HTMLDivElement | null>(null);
  const previousGapRef = useRef<number | null>(null);
  const gap = rival.xp - myXP;
  const urgent = gap > 0;
  const finalHours = hoursRemaining <= 6;

  useEffect(() => {
    if (!gapRef.current) return;
    if (previousGapRef.current === null) {
      previousGapRef.current = gap;
      animateGapLabel(gapRef.current, gap);
      return;
    }

    const from = previousGapRef.current;
    const to = gap;
    previousGapRef.current = gap;
    const start = performance.now();

    function tick(nowValue: number) {
      if (!gapRef.current) return;
      const progress = Math.min((nowValue - start) / 500, 1);
      const current = from + (to - from) * easeOutCubic(progress);
      animateGapLabel(gapRef.current, current);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }, [gap]);

  return (
    <div
      ref={ref}
      style={{
        alignItems: "center",
        background: STORM_THEME.surfaceRaised,
        border: "1px solid rgba(112,144,204,0.20)",
        borderRadius: 4,
        display: "flex",
        gap: 12,
        margin: "0 0 16px 0",
        padding: "14px 16px",
        position: "relative",
        animation: urgent
          ? finalHours
            ? "leagueRivalUrgencyHigh 2s ease-in-out infinite"
            : "leagueRivalUrgency 2s ease-in-out infinite"
          : undefined,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          overflow: "hidden",
          background: "rgba(112,144,204,0.20)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {rival.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rival.avatarUrl} alt={rival.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          getInitials(rival.name)
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "#8aabdd",
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Rival
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 10, marginTop: 4, minWidth: 0 }}>
          <div
            style={{
              color: STORM_THEME.textPrimary,
              fontFamily: LEAGUE_SANS_FONT,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.4,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {rival.name}
          </div>
          <div style={{ alignItems: "center", display: "flex", gap: 3 }}>
            {rival.recentActivity.map((active, index) => (
              <span
                key={`${rival.id}-activity-${index}`}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: active ? STORM_THEME.accentOrange : "rgba(255,255,255,0.12)",
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          Beat your rival this week for bonus XP
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div
          ref={gapRef}
          style={{
            color: gap <= 0 ? STORM_THEME.accentGreen : STORM_THEME.accentRed,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        />
        <div
          style={{
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          {rival.xp.toLocaleString("en-US")} XP
        </div>
      </div>
    </div>
  );
});

const LeaderboardRow = forwardRef<HTMLDivElement, LeaderboardRowProps>(function LeaderboardRow(
  { rank, rowKey, player, isYou, isRival, zone, doubleXp = false, shuffleFlash = false, medalSweep = false, dangerPulse = false, onXpRef },
  ref,
) {
  const baseBackground = player === null
    ? "transparent"
    : isYou
      ? "rgba(232,130,12,0.11)"
      : isRival
        ? "rgba(112,144,204,0.07)"
        : "transparent";

  return (
    <div
      id={isYou ? "row-you" : undefined}
      data-row-key={rowKey}
      data-base-bg={baseBackground}
      ref={ref}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "rgba(255,255,255,0.025)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = baseBackground;
      }}
      style={{
        alignItems: "center",
        background: baseBackground,
        backfaceVisibility: "hidden",
        border: isYou ? "1px solid rgba(232,130,12,0.25)" : "1px solid transparent",
        borderLeft: isYou
          ? `3px solid ${STORM_THEME.accentOrange}`
          : zone === "promotion"
            ? `2px solid ${STORM_THEME.accentGreen}`
            : zone === "demotion"
              ? `2px solid ${STORM_THEME.accentRed}`
              : "2px solid transparent",
        borderRadius: isYou ? 4 : 0,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "24px 30px 1fr 80px",
        gap: 12,
        height: 50,
        minHeight: 50,
        maxHeight: 50,
        overflow: "hidden",
        padding: "10px 14px",
        position: "relative",
        transform: "translateZ(0)",
        transition: "background 120ms ease",
        animation: dangerPulse ? "leagueDangerRowPulse 2s ease-in-out infinite" : undefined,
      }}
    >
      {medalSweep ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 12,
            background: "linear-gradient(180deg, rgba(200,168,75,0), rgba(200,168,75,0.4), rgba(200,168,75,0))",
            opacity: 0,
            animation: "leagueMedalSweep 6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          color: getRankColor(rank),
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: rank <= 3 ? 600 : 500,
          lineHeight: 1,
        }}
      >
        {rank}
      </div>

      {player === null ? (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
            backgroundSize: "200% 100%",
            animation: "leagueGhostShimmer 1.5s linear infinite",
          }}
        />
      ) : (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            overflow: "hidden",
            background: player.avatarUrl ? "transparent" : getAvatarColor(player.id),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: STORM_THEME.textPrimary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {player.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.avatarUrl} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials(player.name)
          )}
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        {player === null ? (
          <div
            style={{
              width: 86,
              height: 12,
              borderRadius: 3,
              background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
              backgroundSize: "200% 100%",
              animation: "leagueGhostShimmer 1.5s linear infinite",
            }}
          />
        ) : (
          <div style={{ alignItems: "center", display: "flex", gap: 8, minWidth: 0 }}>
            <div
              style={{
                color: STORM_THEME.textPrimary,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {player.name}
            </div>
            {isYou ? (
              <span
                style={{
                  background: STORM_THEME.accentOrange,
                  borderRadius: 3,
                  color: STORM_THEME.badgeTextDark,
                  fontFamily: LEAGUE_SANS_FONT,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  lineHeight: 1.2,
                  padding: "1px 5px",
                  textTransform: "uppercase",
                }}
              >
                You
              </span>
            ) : null}
            {isRival ? (
              <span
                style={{
                  background: "rgba(112,144,204,0.20)",
                  borderRadius: 3,
                  color: "#8aabdd",
                  fontFamily: LEAGUE_SANS_FONT,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  lineHeight: 1.2,
                  padding: "1px 5px",
                  textTransform: "uppercase",
                }}
              >
                Rival
              </span>
            ) : null}
            {player?.isGhost ? (
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  color: STORM_THEME.textMuted,
                  fontFamily: LEAGUE_SANS_FONT,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  lineHeight: 1.2,
                  padding: "1px 5px",
                  textTransform: "uppercase",
                }}
              >
                Ghost
              </span>
            ) : null}
            {shuffleFlash ? (
              <div
                style={{
                  inset: 0,
                  position: "absolute",
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.06), rgba(255,255,255,0))",
                  animation: "leagueShuffleFlash 900ms ease-out 1",
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      <div
        ref={onXpRef}
        style={{
          color: player === null
            ? STORM_THEME.textMuted
            : doubleXp
              ? STORM_THEME.accentGold
              : STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          textAlign: "right",
          width: 80,
          justifySelf: "end",
          position: "relative",
        }}
      >
        {player === null ? "—" : player.xp.toLocaleString("en-US")}
      </div>
    </div>
  );
});

function ZoneDivider({ zone, label, bright = false }: ZoneDividerProps) {
  const color = zone === "promotion" ? STORM_THEME.accentGreen : zone === "demotion" ? STORM_THEME.accentRed : STORM_THEME.accentOrange;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 10,
        paddingBottom: 8,
        paddingTop: 20,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <div style={{ ...sectionLabelStyle, color }}>{label}</div>
      <div
        style={{
          flex: 1,
          height: 1,
          background: bright ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
        }}
      />
    </div>
  );
}

function EventBanner({ type, expiresAt, onDismiss, finalHours }: EventBannerProps) {
  const [countdown, setCountdown] = useState(() => formatEventExpiry(expiresAt, Date.now()));
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function update() {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("Expired");
        return;
      }
      setCountdown(formatEventExpiry(expiresAt, Date.now()));
    }

    update();
    const interval = window.setInterval(update, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt]);

  useEffect(() => {
    if (type !== "double_xp" || !bannerRef.current) return;
    const container = bannerRef.current;
    const interval = window.setInterval(() => {
      const particle = document.createElement("div");
      const left = 24 + Math.random() * Math.max(container.clientWidth - 48, 24);
      particle.style.cssText = `
        position: absolute;
        left: ${left}px;
        bottom: 18px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${STORM_THEME.accentGold};
        opacity: 0.8;
        pointer-events: none;
        transition: transform 1400ms ease-out, opacity 1400ms ease-out;
      `;
      container.appendChild(particle);
      window.requestAnimationFrame(() => {
        particle.style.transform = "translateY(-40px)";
        particle.style.opacity = "0";
      });
      window.setTimeout(() => {
        particle.remove();
      }, 1450);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [type]);

  const copy = type === "double_xp"
    ? "Double XP Hour is active in your league"
    : type === "shuffle"
      ? "Leaderboard Shuffle Weekend — small XP boost for all players"
      : type === "rival_surge"
        ? "Rival Surge event — everyone near you is boosted"
        : "Promotion Rush — top 15 promoted this week instead of 10";

  return (
    <div
      ref={bannerRef}
      style={{
        background: "rgba(232,130,12,0.12)",
        border: "1px solid rgba(232,130,12,0.25)",
        borderLeft: `3px solid ${STORM_THEME.accentOrange}`,
        borderRadius: 4,
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        marginTop: 16,
        marginBottom: 16,
        overflow: "hidden",
        padding: "12px 16px",
        position: "relative",
      }}
    >
      {type === "double_xp" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(200,168,75,0.22), rgba(255,255,255,0))",
            animation: "leagueBannerShimmer 4s linear infinite",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: STORM_THEME.textPrimary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {finalHours ? "Final hours · " : ""}
          {copy}
        </div>
        <div
          style={{
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          {countdown === "Expired" ? "Expired" : `${countdown} remaining`}
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: STORM_THEME.textSecondary,
          cursor: "pointer",
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          padding: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function ComebackBanner() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(239,68,68,0.10)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderLeft: `3px solid ${STORM_THEME.accentRed}`,
        borderRadius: 4,
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        marginBottom: 16,
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          color: STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        You&apos;re in the demotion zone — one lesson gives you +15 bonus XP
      </div>
      <Link
        href="/learn"
        style={{
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 4,
          color: STORM_THEME.accentRed,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          padding: "8px 10px",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Start a lesson →
      </Link>
    </div>
  );
}

function ToastView({ toast }: { toast: ToastItem }) {
  const background = toast.type === "passed_by"
    ? "rgba(239,68,68,0.14)"
    : toast.type === "overtook"
      ? "rgba(34,197,94,0.12)"
      : "rgba(232,130,12,0.12)";
  const border = toast.type === "passed_by"
    ? "1px solid rgba(239,68,68,0.28)"
    : toast.type === "overtook"
      ? "1px solid rgba(34,197,94,0.25)"
      : "1px solid rgba(232,130,12,0.25)";

  return (
    <div
      style={{
        animation: "leagueToastIn 280ms ease-out, leagueToastOut 280ms ease-in 3220ms forwards",
        background,
        border,
        borderRadius: 4,
        color: STORM_THEME.textPrimary,
        fontFamily: LEAGUE_SANS_FONT,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.4,
        maxWidth: 260,
        overflow: "hidden",
        padding: "10px 14px",
      }}
    >
      {toast.message}
    </div>
  );
}

function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 20,
      }}
    >
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          style={{
            height: item === 0 ? 132 : item === 1 ? 72 : 280,
            borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${STORM_THEME.borderSubtle}`,
            animation: "leagueLoadingPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

export default function LeagueTab({ membership, league, week, loading, onZoneChange }: LeagueTabProps) {
  const { entries, myRank, myEntry, loading: leaderboardLoading } = useGroupLeaderboard(membership?.leagueGroupId ?? null);
  const { streak, multiplier } = useHotStreak();
  const { events } = useOvertakeEvents(membership?.leagueGroupId ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [dismissedEventKey, setDismissedEventKey] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<LeagueRuntime | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [distanceOverride, setDistanceOverride] = useState<string | null>(null);
  const [distanceTone, setDistanceTone] = useState<DistanceTone>("default");

  const runtimeRef = useRef<LeagueRuntime | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowXpRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowTopRef = useRef<Map<string, number>>(new Map());
  const seenToastIdsRef = useRef<Set<string>>(new Set());
  const activeWeekIdRef = useRef<string | null>(null);
  const promotionSequencePlayedRef = useRef(false);
  const youBreathingRef = useRef<ReturnType<typeof startYouRowBreathing> | null>(null);
  const promotionPulseStopRef = useRef<(() => void) | null>(null);
  const xpValueRef = useRef<HTMLDivElement | null>(null);
  const rankValueRef = useRef<HTMLDivElement | null>(null);
  const rivalCardRef = useRef<HTMLDivElement | null>(null);
  const promotionSectionRef = useRef<HTMLDivElement | null>(null);
  const previousZoneRef = useRef<LeagueZone | null>(null);
  const previousRivalGapRef = useRef<number | null>(null);
  const previousDisplayedXpRef = useRef<number | null>(null);
  const previousDisplayedRankRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const totalPlayers = Math.max(entries.length, 30);
  const eventType = normalizeEventType(week?.modifierType, week?.modifierLabel);
  const basePromotionCutoffRank = league?.promotionCutoff ?? 10;
  const promotionCutoffRank = eventType === "promotion_rush" ? Math.min(15, totalPlayers) : basePromotionCutoffRank;
  const demotionCount = league?.demotionCutoff ?? 5;
  const fallbackXp = myEntry?.xpThisWeek ?? membership?.xpEarnedThisWeek ?? 0;
  const fallbackRank = myRank ?? membership?.peakRankThisWeek ?? totalPlayers;
  const hoursRemaining = computeHoursRemaining(week?.weekEnd ?? null, now);
  const under24Hours = hoursRemaining <= 24;
  const under6Hours = hoursRemaining <= 6;
  const lastHour = hoursRemaining <= 1;

  const runtimeOptions = useMemo<RuntimeOptions>(() => ({
    totalPlayers,
    promotionCutoffRank,
    demotionCount,
    streak,
    multiplier,
    eventType,
    weekEnd: week?.weekEnd ?? null,
    weekId: week?.id ?? null,
    fallbackXp,
    fallbackRank,
    now,
  }), [demotionCount, eventType, fallbackRank, fallbackXp, multiplier, now, promotionCutoffRank, streak, totalPlayers, week?.id, week?.weekEnd]);
  const youEntryId = runtime?.entries.find((entry) => entry.isYou)?.id ?? null;
  const runtimeOrderSignature = runtime ? runtime.entries.map((entry) => `${entry.id}:${entry.rank}:${entry.xp}`).join("|") : "runtime-empty";
  const simulationKey = runtime ? `${week?.id ?? "week"}:${runtime.entries.length}:${runtime.state.eventActive?.key ?? "none"}` : "simulation-empty";

  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    const nextToast = { id, type, message, expiresAt: Date.now() + 3500 };
    setToasts((current) => [...current, nextToast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const composeRuntime = (nextEntries: SimEntry[], currentNow: number) => createLeagueRuntime(nextEntries, {
    ...runtimeOptions,
    now: currentNow,
  });

  const triggerPassedByAnimation = (player: SimEntry | null) => {
    const youRow = document.getElementById("row-you");
    if (!youRow) return;
    youRow.style.background = "rgba(239,68,68,0.18)";
    youRow.style.animation = "leagueRowShake 400ms ease-out";
    window.setTimeout(() => {
      youRow.style.background = youRow.getAttribute("data-base-bg") ?? "";
      youRow.style.animation = "";
    }, 500);
    if (player) {
      showToast("passed_by", `${player.name} just passed you`);
    }
  };

  const triggerOvertakeAnimation = () => {
    const youRow = document.getElementById("row-you");
    if (!youRow) return;
    showRankUpTrail(youRow);
    youRow.style.background = "rgba(34,197,94,0.15)";
    spawnOvertakeParticles(youRow);
    window.setTimeout(() => {
      youRow.style.background = youRow.getAttribute("data-base-bg") ?? "";
    }, 600);
  };

  const animateSimPlayerXP = (playerId: string, from: number, to: number, gain: number) => {
    const xpEl = rowXpRefs.current.get(playerId);
    if (xpEl) {
      const xpNode = xpEl;
      const start = performance.now();
      const duration = 200;

      function tick(nowValue: number) {
        const progress = Math.min((nowValue - start) / duration, 1);
        const value = Math.round(from + (to - from) * (1 - Math.pow(1 - progress, 2)));
        xpNode.textContent = value.toLocaleString("en-US");
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      }

      window.requestAnimationFrame(tick);

      const floater = document.createElement("div");
      floater.textContent = `+${gain}`;
      floater.style.cssText = `
        position: absolute;
        right: 0;
        top: -4px;
        font-size: 11px;
        font-weight: 600;
        color: ${runtimeRef.current?.state.eventActive?.type === "double_xp" ? STORM_THEME.accentGold : STORM_THEME.accentGreen};
        pointer-events: none;
        z-index: 10;
        transition: transform 800ms ease-out, opacity 800ms ease-out;
      `;
      xpNode.style.position = "relative";
      xpNode.appendChild(floater);
      window.requestAnimationFrame(() => {
        floater.style.transform = "translateY(-20px)";
        floater.style.opacity = "0";
      });
      window.setTimeout(() => {
        floater.remove();
      }, 850);
    }

    const row = rowRefs.current.get(playerId);
    if (row) {
      row.style.background = "rgba(34,197,94,0.08)";
      window.setTimeout(() => {
        row.style.background = row.getAttribute("data-base-bg") ?? "";
      }, 400);
    }
  };

  const flashRivalSuccess = () => {
    const card = rivalCardRef.current;
    if (!card) return;
    card.style.boxShadow = "0 0 0 1px rgba(34,197,94,0.5)";
    window.setTimeout(() => {
      card.style.boxShadow = "";
    }, 600);
    showBonusFloater(card, "+50 bonus XP", STORM_THEME.accentGold);
  };

  const triggerPromotionEntrySequence = async () => {
    if (promotionSequencePlayedRef.current) return;
    const youRow = document.getElementById("row-you");
    if (!youRow || !promotionSectionRef.current) return;

    promotionSequencePlayedRef.current = true;
    await wait(400);

    promotionSectionRef.current.style.transition = "background 600ms";
    promotionSectionRef.current.style.background = "rgba(34,197,94,0.08)";
    await wait(600);
    promotionSectionRef.current.style.background = "linear-gradient(180deg, rgba(34,197,94,0), rgba(34,197,94,0.03) 4px, rgba(34,197,94,0.03) calc(100% - 4px), rgba(34,197,94,0))";

    youRow.style.transition = "box-shadow 400ms ease-out";
    youRow.style.boxShadow = "0 0 0 2px rgba(34,197,94,0.5)";
    setDistanceOverride("You reached the promotion zone");
    setDistanceTone("promotion");
    spawnConfetti(youRow);
    showToast("milestone", "You entered the promotion zone");
    await wait(2000);
    youRow.style.boxShadow = "";
    setDistanceOverride(null);
    setDistanceTone("default");
  };

  const addXP = (amount: number, baseEntries?: SimEntry[]) => {
    if (amount === 0) return;
    const current = runtimeRef.current;
    if (!current || !xpValueRef.current) return;
    const sourceEntries = (baseEntries ?? current.entries).map((entry) => ({ ...entry, recentActivity: [...entry.recentActivity] }));
    const previousYou = sourceEntries.find((entry) => entry.isYou) ?? null;
    if (!previousYou) return;
    const oldRank = previousYou.rank;
    const oldXP = previousYou.xp;
    const updatedEntries = sourceEntries.map((entry) => entry.isYou ? { ...entry, xp: entry.xp + amount } : entry);
    const nextRuntime = composeRuntime(updatedEntries, Date.now());
    const overtaken = sourceEntries.filter((entry) => !entry.isYou && !entry.isGhost && entry.rank < oldRank)
      .filter((entry) => {
        const nextEntry = nextRuntime.entries.find((candidate) => candidate.id === entry.id);
        return Boolean(nextEntry && nextEntry.rank > nextRuntime.state.rank);
      });
    setRuntime(nextRuntime);

    animateXPCountUp(xpValueRef.current, oldXP, nextRuntime.state.xp, 800);
    window.setTimeout(() => {
      if (!xpValueRef.current) return;
      xpValueRef.current.style.transition = "color 200ms";
      xpValueRef.current.style.color = STORM_THEME.accentGold;
      window.setTimeout(() => {
        if (xpValueRef.current) {
          xpValueRef.current.style.color = STORM_THEME.textPrimary;
        }
      }, 400);
    }, 400);

    if (xpValueRef.current) {
      spawnOvertakeParticles(xpValueRef.current);
    }

    if (nextRuntime.state.rank < oldRank) {
      triggerOvertakeAnimation();
      if (overtaken[0]) {
        showToast("overtook", `You passed ${overtaken[0].name}`);
      }
    }

    if (oldRank > promotionCutoffRank && nextRuntime.state.rank <= promotionCutoffRank) {
      void wait(300).then(() => triggerPromotionEntrySequence());
    }
  };

  const applySimulatedGain = (playerId: string, gain: number) => {
    const current = runtimeRef.current;
    if (!current) return;
    const previousYouXp = current.state.xp;
    const updatedEntries = markRecentActivity(
      current.entries.map((entry) => {
        if (entry.id !== playerId) return { ...entry, recentActivity: [...entry.recentActivity] };
        return {
          ...entry,
          xp: entry.xp + gain,
          recentActivity: [...entry.recentActivity],
        };
      }),
      playerId,
    );
    const targetBefore = current.entries.find((entry) => entry.id === playerId) ?? null;
    const nextRuntime = composeRuntime(updatedEntries, Date.now());
    const targetAfter = nextRuntime.entries.find((entry) => entry.id === playerId) ?? null;
    setRuntime(nextRuntime);

    if (!targetAfter) return;
    animateSimPlayerXP(targetAfter.id, targetBefore?.xp ?? 0, targetAfter.xp, gain);
    if (
      targetAfter.isRival
      || (targetAfter.isGhost && Math.abs(targetAfter.rank - nextRuntime.state.rank) <= 3 && Math.random() > 0.55)
    ) {
      showToast("event", `${targetAfter.name} gained ${gain} XP`);
    }
    if (targetBefore && targetBefore.xp < previousYouXp && targetAfter.xp >= previousYouXp) {
      triggerPassedByAnimation(targetAfter);
    }
  };

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    if (!membership || !league || !week) return;
    const seedEntries = mergeDynamicEntryFields(
      buildSeedEntries(entries, totalPlayers, promotionCutoffRank, demotionCount, eventType),
      runtimeRef.current?.entries ?? null,
    );
    const nextRuntime = composeRuntime(seedEntries, Date.now());

    if (activeWeekIdRef.current !== week.id) {
      activeWeekIdRef.current = week.id;
      promotionSequencePlayedRef.current = nextRuntime.state.rank <= promotionCutoffRank;
      previousDisplayedXpRef.current = null;
      previousDisplayedRankRef.current = null;
      const rafId = window.requestAnimationFrame(() => {
        setRuntime(nextRuntime);
      });
      return () => {
        window.cancelAnimationFrame(rafId);
      };
      return;
    }

    const currentRuntime = runtimeRef.current;
    if (!currentRuntime) {
      const rafId = window.requestAnimationFrame(() => {
        setRuntime(nextRuntime);
      });
      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }

    if (nextRuntime.state.xp > currentRuntime.state.xp) {
      const baseEntries = nextRuntime.entries.map((entry) => entry.isYou ? { ...entry, xp: currentRuntime.state.xp } : entry);
      addXP(nextRuntime.state.xp - currentRuntime.state.xp, baseEntries);
      return;
    }

    if (nextRuntime.state.xp < currentRuntime.state.xp) {
      promotionSequencePlayedRef.current = nextRuntime.state.rank <= promotionCutoffRank;
      previousDisplayedXpRef.current = null;
      previousDisplayedRankRef.current = null;
    }

    const rafId = window.requestAnimationFrame(() => {
      setRuntime(nextRuntime);
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [demotionCount, entries, eventType, league, membership, promotionCutoffRank, totalPlayers, week]);

  useEffect(() => {
    if (!runtimeRef.current) return;
    const rafId = window.requestAnimationFrame(() => {
      setRuntime((current) => {
        if (!current) return current;
        return composeRuntime(current.entries, now);
      });
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [now]);

  useEffect(() => {
    if (!runtime) return;
    onZoneChange?.(runtime.state.zone);
    return () => {
      onZoneChange?.("safe");
    };
  }, [onZoneChange, runtime]);

  useEffect(() => {
    if (!runtime) return;
    if (!youEntryId) return;
    const youRow = rowRefs.current.get(youEntryId);
    if (!youRow) return;

    youBreathingRef.current?.stop();
    youBreathingRef.current = startYouRowBreathing(youRow);

    return () => {
      youBreathingRef.current?.stop();
      youBreathingRef.current = null;
    };
  }, [runtime, youEntryId]);

  useEffect(() => {
    promotionPulseStopRef.current?.();
    promotionPulseStopRef.current = null;
    if (!runtime) return;
    if (runtime.state.zone !== "near_promotion" || runtime.state.xpToPromotion > 50) return;
    const youEntry = runtime.entries.find((entry) => entry.isYou) ?? null;
    if (!youEntry) return;
    const youRow = rowRefs.current.get(youEntry.id);
    if (!youRow) return;
    promotionPulseStopRef.current = startPromotionPulse(youRow);
    return () => {
      promotionPulseStopRef.current?.();
      promotionPulseStopRef.current = null;
    };
  }, [runtime, runtime?.state.zone, runtime?.state.xpToPromotion]);

  useEffect(() => {
    if (!runtime || !xpValueRef.current) return;
    if (previousDisplayedXpRef.current === null) {
      previousDisplayedXpRef.current = runtime.state.xp;
      xpValueRef.current.textContent = `${runtime.state.xp.toLocaleString("en-US")} XP`;
      return;
    }

    if (previousDisplayedXpRef.current > runtime.state.xp) {
      xpValueRef.current.textContent = `${runtime.state.xp.toLocaleString("en-US")} XP`;
    }

    previousDisplayedXpRef.current = runtime.state.xp;
  }, [runtime?.state.xp]);

  useEffect(() => {
    if (!runtime || !rankValueRef.current) return;
    if (previousDisplayedRankRef.current === null) {
      previousDisplayedRankRef.current = runtime.state.rank;
      rankValueRef.current.textContent = `#${runtime.state.rank}`;
      return;
    }

    if (previousDisplayedRankRef.current !== runtime.state.rank) {
      rollRankNumber(rankValueRef.current, previousDisplayedRankRef.current, runtime.state.rank);
    }
    previousDisplayedRankRef.current = runtime.state.rank;
  }, [runtime?.state.rank]);

  useEffect(() => {
    if (!events.length) return;
    const currentUserId = myEntry?.userId ?? membership?.userId ?? "";
    if (!currentUserId) return;

    events
      .slice()
      .reverse()
      .forEach((event) => {
        if (seenToastIdsRef.current.has(event.id)) return;
        seenToastIdsRef.current.add(event.id);

        if (event.overtakerUserId === currentUserId) {
          triggerOvertakeAnimation();
          showToast("overtook", `You passed ${event.overtakenUsername ?? "Pico learner"}`);
          return;
        }

        if (event.overtakenUserId === currentUserId) {
          triggerPassedByAnimation(null);
          showToast("passed_by", `${event.overtakerUsername} just passed you`);
        }
      });
  }, [events, membership?.userId, myEntry?.userId]);

  useEffect(() => {
    if (!runtime) return;
    if (previousRivalGapRef.current !== null && previousRivalGapRef.current > 0 && runtime.state.rivalGap <= 0) {
      const timeoutId = window.setTimeout(() => {
        showToast("milestone", "You passed your rival — bonus XP incoming");
      }, 0);
      flashRivalSuccess();
      triggerOvertakeAnimation();
      return () => {
        window.clearTimeout(timeoutId);
      };
    }
    previousRivalGapRef.current = runtime.state.rivalGap;
  }, [runtime?.state.rivalGap]);

  useEffect(() => {
    if (!runtime) return;
    const previousZone = previousZoneRef.current;
    previousZoneRef.current = runtime.state.zone;
    if (previousZone && previousZone !== "promotion" && runtime.state.zone === "promotion" && runtime.state.rank <= promotionCutoffRank) {
      const timeoutId = window.setTimeout(() => {
        void triggerPromotionEntrySequence();
      }, 0);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [promotionCutoffRank, runtime?.state.rank, runtime?.state.zone]);

  useEffect(() => {
    if (!runtime) return;
    let active = true;
    let timeoutId = 0;

    function getDelayRange() {
      const state = runtimeRef.current?.state;
      if (!state) return [2500, 5000] as const;
      if (state.hoursRemaining <= 6) return state.zone === "demotion" || state.zone === "near_demotion" ? [1000, 2000] as const : [1200, 2200] as const;
      if (state.hoursRemaining <= 24) return state.zone === "demotion" || state.zone === "near_demotion" ? [1200, 2500] as const : [1500, 3000] as const;
      if (state.zone === "demotion" || state.zone === "near_demotion") return [2000, 4200] as const;
      return [2500, 5000] as const;
    }

    function scheduleNext() {
      if (!active) return;
      const [minDelay, maxDelay] = getDelayRange();
      timeoutId = window.setTimeout(() => {
        if (!active || !runtimeRef.current) return;
        const candidates = runtimeRef.current.entries.filter((entry) => !entry.isYou);
        if (candidates.length === 0) {
          scheduleNext();
          return;
        }

        const weights = candidates.map((entry) => 0.2 + entry.momentum * 0.8);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let pick = Math.random() * totalWeight;
        let chosen = candidates[0];
        for (let index = 0; index < candidates.length; index += 1) {
          pick -= weights[index] ?? 0;
          if (pick <= 0) {
            chosen = candidates[index] ?? candidates[0];
            break;
          }
        }

        const gain = chosen.isGhost
          ? Math.floor(6 + Math.random() * 22)
          : Math.floor(3 + Math.random() * 15);
        applySimulatedGain(chosen.id, gain);
        scheduleNext();
      }, minDelay + Math.random() * (maxDelay - minDelay));
    }

    const driftInterval = window.setInterval(() => {
      setRuntime((current) => {
        if (!current) return current;
        const drifted = current.entries.map((entry) => {
          if (entry.isYou || entry.isGhost) return entry;
          return {
            ...entry,
            momentum: clamp(entry.momentum + (Math.random() - 0.5) * 0.2, 0, 1),
          };
        });
        return composeRuntime(drifted, Date.now());
      });
    }, 8000);

    scheduleNext();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      window.clearInterval(driftInterval);
    };
  }, [simulationKey]);

  useLayoutEffect(() => {
    if (!runtime) return;
    const nextPositions = new Map<string, number>();
    const movers: HTMLDivElement[] = [];

    rowRefs.current.forEach((node, key) => {
      const top = node.offsetTop;
      nextPositions.set(key, top);
      const previousTop = rowTopRef.current.get(key);
      if (previousTop === undefined) return;
      const deltaY = previousTop - top;
      if (Math.abs(deltaY) < 1) return;
      node.style.transition = "none";
      node.style.transform = `translateY(${deltaY}px)`;
      movers.push(node);
    });

    rowTopRef.current = nextPositions;

    if (movers.length === 0) return;

    youBreathingRef.current?.pause();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        movers.forEach((node) => {
          node.style.transition = `transform 500ms ${LEAGUE_EASE}`;
          node.style.transform = "translateY(0)";
        });
      });
    });

    const timer = window.setTimeout(() => {
      movers.forEach((node) => {
        node.style.transition = "";
        node.style.transform = "";
      });
      youBreathingRef.current?.resume();
    }, 520);

    return () => {
      window.clearTimeout(timer);
    };
  }, [runtime, runtimeOrderSignature]);

  if (loading || leaderboardLoading || !runtime) {
    return (
      <>
        <style>{`
          @keyframes leagueLoadingPulse {
            0%, 100% { opacity: 0.42; }
            50% { opacity: 0.72; }
          }
        `}</style>
        <LoadingState />
      </>
    );
  }

  if (!membership || !league || !week) {
    return null;
  }

  const secondPlaceXp = runtime.entries[1]?.xp ?? null;
  const firstPlaceXp = runtime.entries[0]?.xp ?? Math.max(runtime.state.xp, 1);
  const promotionCutoffXp = runtime.entries[Math.max(promotionCutoffRank - 1, 0)]?.xp ?? runtime.state.xp;
  const firstDemotionIndex = Math.max(totalPlayers - demotionCount, 0);
  const demotionCutoffXp = runtime.entries[firstDemotionIndex]?.xp ?? runtime.state.xp;
  const rival = runtime.entries.find((entry) => entry.isRival) ?? null;

  const baseDistanceMessage = buildDistanceMessage(runtime.state, secondPlaceXp, distanceOverride);
  const distanceMessage = (
    <>
      <span style={{ color: distanceTone === "promotion" ? STORM_THEME.accentGreen : distanceTone === "danger" ? STORM_THEME.accentRed : undefined }}>
        {baseDistanceMessage}
      </span>
      {under24Hours ? (
        <span style={{ color: STORM_THEME.accentRed }}> · Ending soon</span>
      ) : null}
    </>
  );

  const promotionRows = runtime.entries
    .slice(0, promotionCutoffRank)
    .map((entry) => ({
      key: entry.id,
      rank: entry.rank,
      player: runtime.state.players[entry.rank - 1] ?? null,
      entry,
      zone: "promotion" as const,
    }));

  const safeRowRanks = getVisibleSafeRanks(runtime.state.rank, totalPlayers, promotionCutoffRank, demotionCount);
  const safeRows = safeRowRanks.map((rank) => {
    const entry = runtime.entries[rank - 1];
    return {
      key: entry?.id ?? `ghost-${rank}`,
      rank,
      player: runtime.state.players[rank - 1] ?? null,
      entry: entry ?? {
        id: `ghost-${rank}`,
        name: "Ghost learner",
        xp: 0,
        rank,
        avatarUrl: null,
        isYou: false,
        isRival: false,
        isGhost: true,
        rivalSurge: false,
        momentum: 0,
        recentActivity: [false, false, false, false, false],
        seedOrder: rank,
      },
      zone: "safe" as const,
    };
  });

  const demotionRows = runtime.entries
    .slice(totalPlayers - demotionCount)
    .map((entry) => ({
      key: entry.id,
      rank: entry.rank,
      player: runtime.state.players[entry.rank - 1] ?? null,
      entry,
      zone: "demotion" as const,
    }));

  const ellipsisCount = Math.max(totalPlayers - promotionCutoffRank - demotionCount - safeRows.length, 0);
  const promotionDividerLabel = runtime.state.eventActive?.type === "promotion_rush" ? "Promotion zone — top 15 this week" : "Promotion zone";
  const subtitle = under24Hours
    ? (
        <>
          <span>Ending soon</span>
          <span> · </span>
          <span
            style={{
              color: STORM_THEME.accentRed,
              fontWeight: lastHour ? 700 : 500,
              animation: "leagueTimerPulse 1.5s ease-in-out infinite",
            }}
          >
            {runtime.state.hoursRemaining}h left
          </span>
          <span> · </span>
          <span>{runtime.state.players.length} competitors</span>
        </>
      )
    : (
        <>
          <span>Week {getWeekNumber(week.weekStart)}</span>
          <span> · </span>
          <span>{runtime.state.players.length} competitors</span>
          <span> · </span>
          <span>Resets in {Math.floor(runtime.state.hoursRemaining / 24)}d {runtime.state.hoursRemaining % 24}h</span>
        </>
      );

  return (
    <>
      <style>{`
        @keyframes leagueGhostShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes leagueTimerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes leagueNearPromotionPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes leagueShuffleFlash {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes leagueToastIn {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes leagueToastOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(110%); opacity: 0; }
        }
        @keyframes leagueTrailFade {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes leagueRowShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        @keyframes leaguePromotionShimmer {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @keyframes leagueRedSegmentPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes leagueDotRingPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(232,130,12,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(232,130,12,0.18); }
        }
        @keyframes leagueBannerShimmer {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @keyframes leagueRivalUrgency {
          0%, 100% { border-color: rgba(112,144,204,0.20); }
          50% { border-color: rgba(112,144,204,0.45); }
        }
        @keyframes leagueRivalUrgencyHigh {
          0%, 100% { border-color: rgba(112,144,204,0.28); box-shadow: 0 0 0 0 rgba(112,144,204,0.18); }
          50% { border-color: rgba(112,144,204,0.55); box-shadow: 0 0 0 3px rgba(112,144,204,0.14); }
        }
        @keyframes leagueDangerRowPulse {
          0%, 100% { background: rgba(239,68,68,0.04); }
          50% { background: rgba(239,68,68,0.10); }
        }
        @keyframes leagueMedalSweep {
          0%, 93%, 100% { opacity: 0; transform: translateX(0); }
          95% { opacity: 0.4; transform: translateX(0); }
          99% { opacity: 0; transform: translateX(10px); }
        }
        .league-leaderboard-surface {
          contain: layout style;
          height: calc(100vh - 320px);
          max-height: calc(100vh - 320px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overflow-x: hidden;
          scrollbar-gutter: stable;
          transform: translateZ(0);
          will-change: transform;
        }
        .league-leaderboard-surface * {
          backface-visibility: hidden;
        }
      `}</style>

      <div
        style={{
          background: lastHour ? "#0f0e0d" : "transparent",
          borderRadius: 8,
          padding: lastHour ? 4 : 0,
          position: "relative",
        }}
      >
        <ToastStack toasts={toasts} />

        <section
          style={{
            alignItems: "center",
            background: STORM_THEME.surface,
            border: `1px solid ${STORM_THEME.border}`,
            borderRadius: 4,
            display: "flex",
            gap: 20,
            padding: "24px 28px 20px",
          }}
        >
          <LeagueBadge
            leagueName={league.name}
            shimmerIntervalMs={runtime.state.zone === "promotion" ? 2000 : 4000}
            pulse={runtime.state.zone === "near_promotion"}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                color: STORM_THEME.textPrimary,
                fontFamily: LEAGUE_SERIF_FONT,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {league.name} League
            </h1>
            <div
              style={{
                background: under24Hours ? "rgba(239,68,68,0.05)" : "transparent",
                borderRadius: 3,
                color: STORM_THEME.textSecondary,
                display: "inline-flex",
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.5,
                marginTop: 8,
                padding: under24Hours ? "4px 8px" : 0,
              }}
            >
              {subtitle}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 14 }}>
              <StatBlock ref={xpValueRef} label="This week" value={`${runtime.state.xp.toLocaleString("en-US")} XP`} />
              <StatBlock ref={rankValueRef} label="Your rank" value={`#${runtime.state.rank}`} />
              <div style={{ alignSelf: "flex-end" }}>
                <StreakPill multiplier={`${runtime.state.multiplier.toFixed(1)}×`} days={runtime.state.streak} />
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: STORM_THEME.surfaceRaised,
            border: `1px solid ${STORM_THEME.borderSubtle}`,
            borderRadius: 4,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            marginTop: 16,
            padding: "16px",
          }}
        >
          <StatBlock label="Rank" value={`#${runtime.state.rank}`} />
          <StatBlock
            label={runtime.state.rank === 1 ? "Promotion" : "XP to promotion"}
            value={runtime.state.rank === 1 ? "Holding #1" : `${runtime.state.xpToPromotion.toLocaleString("en-US")} XP`}
            valueColor={runtime.state.rank === 1 ? STORM_THEME.accentGreen : under6Hours && runtime.state.rank > promotionCutoffRank ? STORM_THEME.accentOrange : undefined}
          />
          <StatBlock
            label="XP to demotion"
            value={`${runtime.state.xpToDemotion.toLocaleString("en-US")} XP`}
            valueColor={runtime.state.zone === "demotion" || runtime.state.zone === "near_demotion" ? STORM_THEME.accentRed : undefined}
          />
        </section>

        <section
          className="league-leaderboard-surface"
          style={{
            background: STORM_THEME.surface,
            border: `1px solid ${STORM_THEME.border}`,
            borderRadius: 4,
            marginTop: 16,
            padding: "16px",
          }}
        >
          {runtime.state.xp === 0 ? (
            <div
              style={{
                color: STORM_THEME.textSecondary,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              Complete your first lesson to enter the league
            </div>
          ) : (
            <ProgressBar
              state={runtime.state}
              totalXP={firstPlaceXp}
              promotionCutoffXP={promotionCutoffXp}
              demotionCutoffXP={demotionCutoffXp}
              distanceMessage={distanceMessage}
            />
          )}
        </section>

        {runtime.state.eventActive && dismissedEventKey !== runtime.state.eventActive.key ? (
          <EventBanner
            type={runtime.state.eventActive.type}
            expiresAt={runtime.state.eventActive.expiresAt}
            finalHours={under6Hours}
            onDismiss={() => setDismissedEventKey(runtime.state.eventActive?.key ?? null)}
          />
        ) : null}

        {runtime.state.zone === "demotion" || runtime.state.zone === "near_demotion" ? <ComebackBanner /> : null}

        {runtime.state.xp > 0 && rival ? <RivalCard ref={rivalCardRef} rival={rival} myXP={runtime.state.xp} hoursRemaining={runtime.state.hoursRemaining} /> : null}

        <section
          style={{
            background: STORM_THEME.surface,
            border: `1px solid ${STORM_THEME.border}`,
            borderRadius: 4,
            padding: "0 16px 16px",
          }}
        >
          <div
            ref={promotionSectionRef}
            style={{
              background: "linear-gradient(180deg, rgba(34,197,94,0), rgba(34,197,94,0.03) 4px, rgba(34,197,94,0.03) calc(100% - 4px), rgba(34,197,94,0))",
              borderRadius: 4,
            }}
          >
            <ZoneDivider zone="promotion" label={promotionDividerLabel} bright={lastHour} />
            {promotionRows.map((row) => (
              <LeaderboardRow
                key={row.key}
                ref={(node) => {
                  if (node) {
                    rowRefs.current.set(row.key, node);
                  } else {
                    rowRefs.current.delete(row.key);
                  }
                }}
                onXpRef={(node) => {
                  if (node) {
                    rowXpRefs.current.set(row.key, node);
                  } else {
                    rowXpRefs.current.delete(row.key);
                  }
                }}
                rank={row.rank}
                rowKey={row.key}
                player={row.player}
                isYou={Boolean(row.player?.isYou)}
                isRival={Boolean(row.player?.isRival)}
                zone={row.zone}
                doubleXp={runtime.state.eventActive?.type === "double_xp"}
                shuffleFlash={runtime.state.eventActive?.type === "shuffle"}
                medalSweep={row.rank <= 3}
              />
            ))}
          </div>

          <ZoneDivider zone="safe" label="Safe zone" bright={lastHour} />
          {safeRows.map((row, index) => (
            <Fragment key={row.key}>
              {index === 2 && ellipsisCount > 0 ? (
                <div
                  style={{
                    color: STORM_THEME.textMuted,
                    fontFamily: LEAGUE_SANS_FONT,
                    fontSize: 12,
                    fontWeight: 400,
                    letterSpacing: "0.05em",
                    lineHeight: 1.4,
                    padding: "8px 0",
                    textAlign: "center",
                  }}
                >
                  · · · {ellipsisCount} more players · · ·
                </div>
              ) : null}
              <LeaderboardRow
                ref={(node) => {
                  if (node) {
                    rowRefs.current.set(row.key, node);
                  } else {
                    rowRefs.current.delete(row.key);
                  }
                }}
                onXpRef={(node) => {
                  if (node) {
                    rowXpRefs.current.set(row.key, node);
                  } else {
                    rowXpRefs.current.delete(row.key);
                  }
                }}
                rank={row.rank}
                rowKey={row.key}
                player={row.player}
                isYou={Boolean(row.player?.isYou)}
                isRival={Boolean(row.player?.isRival)}
                zone={row.zone}
                doubleXp={runtime.state.eventActive?.type === "double_xp"}
                shuffleFlash={runtime.state.eventActive?.type === "shuffle"}
              />
            </Fragment>
          ))}

          <div
            style={{
              background: runtime.state.zone === "demotion" || runtime.state.zone === "near_demotion"
                ? "linear-gradient(180deg, rgba(239,68,68,0), rgba(239,68,68,0.07) 4px, rgba(239,68,68,0.07) calc(100% - 4px), rgba(239,68,68,0))"
                : "linear-gradient(180deg, rgba(239,68,68,0), rgba(239,68,68,0.04) 4px, rgba(239,68,68,0.04) calc(100% - 4px), rgba(239,68,68,0))",
              borderRadius: 4,
            }}
          >
            <ZoneDivider zone="demotion" label="Demotion zone" bright={lastHour} />
            {demotionRows.map((row) => (
              <LeaderboardRow
                key={row.key}
                ref={(node) => {
                  if (node) {
                    rowRefs.current.set(row.key, node);
                  } else {
                    rowRefs.current.delete(row.key);
                  }
                }}
                onXpRef={(node) => {
                  if (node) {
                    rowXpRefs.current.set(row.key, node);
                  } else {
                    rowXpRefs.current.delete(row.key);
                  }
                }}
                rank={row.rank}
                rowKey={row.key}
                player={row.player}
                isYou={Boolean(row.player?.isYou)}
                isRival={Boolean(row.player?.isRival)}
                zone={row.zone}
                doubleXp={runtime.state.eventActive?.type === "double_xp"}
                shuffleFlash={runtime.state.eventActive?.type === "shuffle"}
                dangerPulse={row.rank === totalPlayers}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
