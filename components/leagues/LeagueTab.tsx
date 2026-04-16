"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
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
  computeZone,
  easeOutCubic,
  formatXp,
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

type LeaderboardRowModel = {
  key: string;
  rank: number;
  player: Player | null;
  zone: RowZone;
};

type ToastTone = "danger" | "success";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

interface StatBlockProps {
  label: string;
  value: string;
  valueColor?: string;
}

interface StreakPillProps {
  multiplier: string;
  days: number;
}

interface ProgressBarProps {
  xp: number;
  totalXP: number;
  promotionCutoffXP: number;
  demotionCutoffXP: number;
  zone: "promotion" | "safe" | "demotion";
  distanceMessage: ReactNode;
  memoryMessage?: string | null;
  promotionPulseToken?: number;
}

interface RivalCardProps {
  rival: Player;
  myXP: number;
}

interface LeaderboardRowProps {
  rank: number;
  player: Player | null;
  isYou: boolean;
  isRival: boolean;
  zone: "promotion" | "safe" | "demotion";
  animateIn?: boolean;
  doubleXp?: boolean;
  shuffleFlash?: boolean;
}

interface ZoneDividerProps {
  zone: "promotion" | "safe" | "demotion";
  label: string;
}

interface EventBannerProps {
  type: "double_xp" | "shuffle" | "rival_surge" | "promotion_rush";
  expiresIn: string;
  onDismiss: () => void;
}

type LeagueBadgeProps = {
  leagueName: string;
  shimmerIntervalMs: number;
  pulse: boolean;
};

type ToastViewProps = {
  tone: ToastTone;
  message: string;
};

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

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getLeagueBadgeLabel(name: string) {
  return name.slice(0, 4).toUpperCase();
}

function getDistanceMessage(state: LeagueState, secondPlaceXp: number | null, override: string | null) {
  if (override) {
    return <span>{override}</span>;
  }

  if (state.rank === 1) {
    return <span>You&apos;re leading the league — don&apos;t stop now</span>;
  }

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

function animateXP(el: HTMLElement, from: number, to: number, color: string) {
  const start = performance.now();
  const diff = to - from;

  function tick(now: number) {
    const progress = Math.min((now - start) / 800, 1);
    const ease = easeOutCubic(progress);
    el.textContent = `${Math.round(from + diff * ease).toLocaleString("en-US")} XP`;
    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    el.style.transition = "color 200ms ease";
    el.style.color = STORM_THEME.accentGold;
    window.setTimeout(() => {
      el.style.color = color;
    }, 200);
    window.setTimeout(() => {
      el.style.transition = "";
    }, 400);
  }

  window.requestAnimationFrame(tick);
}

function animateNumberLine(el: HTMLElement, value: number, behindColor: string, aheadColor: string) {
  const absolute = Math.abs(Math.round(value));
  const ahead = value <= 0;
  el.textContent = `${absolute.toLocaleString("en-US")} XP ${ahead ? "ahead" : "behind"}`;
  el.style.color = ahead ? aheadColor : behindColor;
}

function getVisibleSafeRanks(myRank: number, totalPlayers: number) {
  const safeRanks = Array.from({ length: Math.max(totalPlayers - 15, 0) }, (_, index) => index + 11);
  if (safeRanks.length <= 8) return safeRanks;

  const focus = safeRanks.filter((rank) => Math.abs(rank - myRank) <= 2);
  const selected = new Set<number>([
    safeRanks[0] ?? 11,
    safeRanks[1] ?? 12,
    safeRanks[safeRanks.length - 2] ?? totalPlayers - 6,
    safeRanks[safeRanks.length - 1] ?? totalPlayers - 5,
    ...focus,
  ]);

  return safeRanks.filter((rank) => selected.has(rank));
}

const sectionLabelStyle = {
  color: STORM_THEME.textMuted,
  fontFamily: LEAGUE_SANS_FONT,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  lineHeight: 1,
  textTransform: "uppercase",
} as const;

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

function ProgressBar({
  xp,
  totalXP,
  promotionCutoffXP,
  demotionCutoffXP,
  zone,
  distanceMessage,
  memoryMessage,
  promotionPulseToken = 0,
}: ProgressBarProps) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const promotionSegmentRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const percent = totalXP > 0 ? clamp((xp / totalXP) * 100, 0, 100) : 0;
  const promotionPercent = totalXP > 0 ? clamp((promotionCutoffXP / totalXP) * 100, 0, 100) : 0;
  const demotionPercent = totalXP > 0 ? clamp((demotionCutoffXP / totalXP) * 100, 0, 100) : 0;
  const dotShadow =
    zone === "promotion"
      ? "0 0 0 3px rgba(232,130,12,0.25)"
      : zone === "demotion"
        ? "0 0 0 3px rgba(239,68,68,0.3)"
        : "none";

  useEffect(() => {
    const dot = dotRef.current;
    const fill = fillRef.current;
    if (!dot || !fill) return;
    const dotNode = dot;
    const fillNode = fill;

    dotNode.style.boxShadow = dotShadow;

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const start = performance.now();
      const from = 0;
      const to = percent;

      function tick(now: number) {
        const progress = Math.min((now - start) / 900, 1);
        const eased = easeOutCubic(progress);
        const value = from + (to - from) * eased;
        dotNode.style.left = `${value}%`;
        fillNode.style.width = `${value}%`;
        if (progress < 1) {
          window.requestAnimationFrame(tick);
          return;
        }
      }

      window.requestAnimationFrame(tick);
      return;
    }

    dotNode.style.transition = "left 600ms ease-out, box-shadow 220ms ease";
    fillNode.style.transition = "width 600ms ease-out";
    dotNode.style.left = `${percent}%`;
    fillNode.style.width = `${percent}%`;
  }, [dotShadow, percent]);

  useEffect(() => {
    if (!promotionPulseToken) return;
    const segment = promotionSegmentRef.current;
    if (!segment) return;

    segment.style.transition = "opacity 200ms ease";
    segment.style.opacity = "1";

    const first = window.setTimeout(() => {
      if (!promotionSegmentRef.current) return;
      promotionSegmentRef.current.style.opacity = "0.6";
    }, 300);
    const second = window.setTimeout(() => {
      if (!promotionSegmentRef.current) return;
      promotionSegmentRef.current.style.opacity = "1";
    }, 600);
    const third = window.setTimeout(() => {
      if (!promotionSegmentRef.current) return;
      promotionSegmentRef.current.style.opacity = "0.6";
    }, 900);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
      window.clearTimeout(third);
    };
  }, [promotionPulseToken]);

  const tickMarks = useMemo(() => {
    const count = Math.floor(totalXP / 100);
    return Array.from({ length: count }, (_, index) => {
      const value = (index + 1) * 100;
      return totalXP > 0 ? clamp((value / totalXP) * 100, 0, 100) : 0;
    });
  }, [totalXP]);

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
            opacity: 0.5,
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
          ref={promotionSegmentRef}
          style={{
            position: "absolute",
            left: `${promotionPercent}%`,
            top: 0,
            bottom: 0,
            width: `${Math.max(100 - promotionPercent, 0)}%`,
            background: STORM_THEME.accentGreen,
            borderRadius: 3,
            opacity: 0.6,
          }}
        />
        {tickMarks.map((mark) => (
          <div
            key={mark}
            style={{
              position: "absolute",
              top: -2,
              left: `${mark}%`,
              width: 1,
              height: 9,
              background: "rgba(255,255,255,0.08)",
              transform: "translateX(-50%)",
            }}
          />
        ))}
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
          style={{
            position: "absolute",
            left: `${promotionPercent}%`,
            top: -18,
            transform: "translateX(-50%)",
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Promotion
        </div>
        <div
          ref={dotRef}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: STORM_THEME.accentOrange,
            border: `2px solid ${STORM_THEME.background}`,
            transform: "translate(-50%, -50%)",
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
          color: STORM_THEME.textSecondary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.5,
          marginTop: 8,
        }}
      >
        {distanceMessage}
      </div>

      {memoryMessage ? (
        <div
          style={{
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.4,
            marginTop: 8,
          }}
        >
          {memoryMessage}
        </div>
      ) : null}
    </div>
  );
}

function RivalCard({ rival, myXP }: RivalCardProps) {
  const gapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const previousGapRef = useRef<number | null>(null);
  const gap = rival.xp - myXP;

  useEffect(() => {
    if (!gapRef.current) return;
    if (previousGapRef.current === null) {
      previousGapRef.current = gap;
      animateNumberLine(gapRef.current, gap, STORM_THEME.accentRed, STORM_THEME.accentGreen);
      return;
    }

    const from = previousGapRef.current;
    const to = gap;
    previousGapRef.current = gap;
    const start = performance.now();

    function tick(now: number) {
      if (!gapRef.current) return;
      const progress = Math.min((now - start) / 600, 1);
      const eased = easeOutCubic(progress);
      const current = from + (to - from) * eased;
      animateNumberLine(gapRef.current, current, STORM_THEME.accentRed, STORM_THEME.accentGreen);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }, [gap]);

  useEffect(() => {
    if (!rival.rivalSurge) return;
    const cardNode = cardRef.current;
    const nameNode = nameRef.current;
    if (cardNode) {
      cardNode.style.boxShadow = "0 0 0 1px rgba(232,130,12,0.4)";
    }
    if (nameNode) {
      nameNode.style.animation = "leagueRivalNamePulse 2s ease-in-out infinite";
    }

    return () => {
      if (cardNode) {
        cardNode.style.boxShadow = "";
      }
      if (nameNode) {
        nameNode.style.animation = "";
      }
    };
  }, [rival.rivalSurge]);

  return (
    <div
      ref={cardRef}
      style={{
        alignItems: "center",
        background: STORM_THEME.surfaceRaised,
        border: `1px solid ${rival.rivalSurge ? "rgba(232,130,12,0.4)" : "rgba(112,144,204,0.20)"}`,
        borderRadius: 4,
        display: "flex",
        gap: 12,
        margin: "0 0 16px 0",
        padding: "14px 16px",
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
            color: "rgba(120,150,220,0.7)",
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
        <div
          ref={nameRef}
          style={{
            color: STORM_THEME.textPrimary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {rival.name}
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
          {formatXp(rival.xp)}
        </div>
      </div>
    </div>
  );
}

const LeaderboardRow = forwardRef<HTMLDivElement, LeaderboardRowProps>(function LeaderboardRow(
  { rank, player, isYou, isRival, zone, animateIn = false, doubleXp = false, shuffleFlash = false },
  ref,
) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const baseBackground = player === null
    ? "transparent"
    : isYou
      ? "rgba(232,130,12,0.09)"
      : isRival
        ? "rgba(112,144,204,0.07)"
        : "transparent";

  return (
    <div
      ref={(node) => {
        rowRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = baseBackground;
      }}
      style={{
        alignItems: "center",
        animation: isYou ? "leagueYouBreathe 3s ease-in-out infinite" : undefined,
        background: baseBackground,
        border: isYou ? "1px solid rgba(232,130,12,0.18)" : "1px solid transparent",
        borderLeft: zone === "promotion" ? `2px solid ${STORM_THEME.accentGreen}` : zone === "demotion" ? `2px solid ${STORM_THEME.accentRed}` : "2px solid transparent",
        borderRadius: isYou ? 4 : 0,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "20px 12px 30px 12px 1fr 80px",
        height: 50,
        opacity: animateIn ? 0 : 1,
        overflow: "hidden",
        padding: "10px 14px",
        position: "relative",
        transition: "background 120ms ease",
      }}
    >
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
      <div />

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
            <img src={player.avatarUrl} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials(player.name)
          )}
        </div>
      )}

      <div />

      <div style={{ minWidth: 0 }}>
        {player === null ? (
          <div
            style={{
              width: 80,
              height: 12,
              borderRadius: 3,
              background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
              backgroundSize: "200% 100%",
              animation: "leagueGhostShimmer 1.5s linear infinite",
            }}
          />
        ) : (
          <>
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
            </div>
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
          </>
        )}
      </div>

      <div
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
        }}
      >
        {player === null ? "—" : player.xp.toLocaleString("en-US")}
      </div>
    </div>
  );
});

function ZoneDivider({ zone, label }: ZoneDividerProps) {
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
          background: "rgba(255,255,255,0.06)",
        }}
      />
    </div>
  );
}

function EventBanner({ type, expiresIn, onDismiss }: EventBannerProps) {
  const copy =
    type === "double_xp"
      ? "Double XP Hour is active in your league"
      : type === "shuffle"
        ? "Leaderboard Shuffle Weekend — small XP boost for all players"
        : type === "rival_surge"
          ? "Rival Surge event — everyone near you is boosted"
          : "Promotion Rush — top 15 promoted this week instead of 10";

  return (
    <div
      style={{
        background: "rgba(232,130,12,0.12)",
        border: "1px solid rgba(232,130,12,0.25)",
        borderLeft: `3px solid ${STORM_THEME.accentOrange}`,
        borderRadius: 4,
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        marginBottom: 16,
        padding: "12px 16px",
      }}
    >
      <div>
        <div
          style={{
            color: STORM_THEME.textPrimary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
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
          Expires in {expiresIn}
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
        Complete one lesson for +15 bonus XP and climb out of the demotion zone
      </div>
      <Link
        href="/learn"
        style={{
          color: STORM_THEME.accentRed,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Start a lesson →
      </Link>
    </div>
  );
}

function ToastView({ tone, message }: ToastViewProps) {
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const toast = toastRef.current;
    if (!toast) return;
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";

    window.requestAnimationFrame(() => {
      if (!toastRef.current) return;
      toastRef.current.style.transition = "transform 300ms ease, opacity 300ms ease";
      toastRef.current.style.transform = "translateX(0)";
      toastRef.current.style.opacity = "1";
    });

    const exitTimer = window.setTimeout(() => {
      if (!toastRef.current) return;
      toastRef.current.style.transform = "translateX(100%)";
      toastRef.current.style.opacity = "0";
    }, 3000);

    return () => {
      window.clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      ref={toastRef}
      style={{
        background: tone === "danger" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.12)",
        border: tone === "danger" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.25)",
        borderRadius: 4,
        color: STORM_THEME.textPrimary,
        maxWidth: 260,
        overflow: "hidden",
        padding: "10px 14px",
        position: "relative",
      }}
    >
      {tone === "success"
        ? Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              style={{
                position: "absolute",
                left: 16 + index * 10,
                top: 22,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: index % 2 === 0 ? STORM_THEME.accentGreen : STORM_THEME.accentGold,
                animation: `leagueToastParticle 700ms ease-out ${index * 30}ms 1`,
              }}
            />
          ))
        : null}
      <div
        style={{
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
          position: "relative",
          zIndex: 1,
        }}
      >
        {message}
      </div>
    </div>
  );
}

function ToastPortal({ toasts }: { toasts: ToastItem[] }) {
  if (typeof document === "undefined" || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "fixed",
        right: 24,
        top: 24,
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastView key={toast.id} tone={toast.tone} message={toast.message} />
      ))}
    </div>,
    document.body,
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [promotionPulseToken, setPromotionPulseToken] = useState(0);
  const [distanceOverride, setDistanceOverride] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowTopRef = useRef<Map<string, number>>(new Map());
  const seenToastIdsRef = useRef<Set<string>>(new Set());
  const previousZoneRef = useRef<LeagueZone | null>(null);
  const previousXpRef = useRef<number | null>(null);
  const previousRivalGapRef = useRef<number | null>(null);
  const xpValueRef = useRef<HTMLDivElement | null>(null);
  const rankValueRef = useRef<HTMLDivElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const totalPlayers = Math.max(entries.length, 30);
  const promotionCutoffRank = league?.promotionCutoff ?? 10;
  const demotionCount = league?.demotionCutoff ?? 5;
  const weekNumber = week ? getWeekNumber(week.weekStart) : 0;
  const msRemaining = week ? Math.max(0, new Date(week.weekEnd).getTime() - now) : 0;
  const hoursRemaining = Math.max(0, Math.ceil(msRemaining / 3600000));
  const daysRemaining = Math.floor(hoursRemaining / 24);
  const eventType = normalizeEventType(week?.modifierType, week?.modifierLabel);

  const promotionRushCutoffRank = eventType === "promotion_rush" ? Math.min(15, totalPlayers) : promotionCutoffRank;

  const leagueState = useMemo<LeagueState>(() => {
    const rankMap = new Map<number, LeaderboardEntry>();
    entries.forEach((entry) => {
      rankMap.set(entry.rank, entry);
    });

    const players = Array.from({ length: totalPlayers }, (_, index) => {
      const rank = index + 1;
      const entry = rankMap.get(rank);
      if (!entry || entry.isGhost) return null;

      return {
        id: entry.userId,
        name: entry.username,
        xp: entry.xpThisWeek,
        rank,
        avatarUrl: entry.avatarUrl,
        isYou: entry.isMe,
        isRival: entry.isRival,
        isGhost: false,
        rivalSurge: eventType === "rival_surge" && entry.isRival,
      } satisfies Player;
    });

    const effectiveRank = myRank ?? membership?.peakRankThisWeek ?? totalPlayers;
    const effectiveXp = myEntry?.xpThisWeek ?? membership?.xpEarnedThisWeek ?? 0;
    const promotionTarget = rankMap.get(promotionCutoffRank)?.xpThisWeek ?? effectiveXp;
    const demotionEntry = rankMap.get(totalPlayers - demotionCount + 1)?.xpThisWeek ?? effectiveXp;
    const safeEntry = rankMap.get(totalPlayers - demotionCount)?.xpThisWeek ?? effectiveXp;
    const zone = computeZone(effectiveRank, totalPlayers);
    const rivalEntry = entries.find((entry) => entry.isRival) ?? null;

    return {
      rank: effectiveRank,
      xp: effectiveXp,
      xpToPromotion: effectiveRank <= promotionCutoffRank ? 0 : Math.max(0, promotionTarget - effectiveXp + 1),
      xpToDemotion: zone === "demotion"
        ? Math.max(0, safeEntry - effectiveXp + 1)
        : Math.max(0, effectiveXp - demotionEntry),
      zone,
      rivalGap: rivalEntry ? rivalEntry.xpThisWeek - effectiveXp : 0,
      streak,
      multiplier,
      hoursRemaining,
      players,
      eventActive: eventType && week
        ? {
            type: eventType,
            expiresIn: formatEventExpiry(week.weekEnd, now),
            key: `${eventType}-${week.id}`,
          }
        : null,
    };
  }, [
    demotionCount,
    entries,
    eventType,
    hoursRemaining,
    membership?.peakRankThisWeek,
    membership?.xpEarnedThisWeek,
    multiplier,
    myEntry?.xpThisWeek,
    myRank,
    now,
    promotionCutoffRank,
    streak,
    totalPlayers,
    week,
  ]);

  const secondPlaceXp = entries[1]?.xpThisWeek ?? null;
  const firstPlaceXp = entries[0]?.xpThisWeek ?? Math.max(leagueState.xp, 1);
  const promotionCutoffXp = entries[Math.max(promotionRushCutoffRank - 1, 0)]?.xpThisWeek ?? leagueState.xp;
  const demotionCutoffXp = entries[Math.min(totalPlayers - demotionCount, entries.length - 1)]?.xpThisWeek ?? leagueState.xp;
  const rival = leagueState.players.find((player) => player?.isRival) ?? null;
  const subtitleEndingSoon = leagueState.hoursRemaining <= 24;
  const distanceMessage = getDistanceMessage(leagueState, secondPlaceXp, distanceOverride);
  const normalizedProgressZone: "promotion" | "safe" | "demotion" =
    leagueState.zone === "promotion" ? "promotion" : leagueState.zone === "demotion" ? "demotion" : "safe";
  const shuffleFlash = leagueState.eventActive?.type === "shuffle";

  const youRowKey = useMemo(() => {
    for (const player of leagueState.players) {
      if (player?.isYou) {
        return player.id;
      }
    }
    return null;
  }, [leagueState.players]);

  const promotionRows = useMemo<LeaderboardRowModel[]>(
    () =>
      Array.from({ length: Math.min(10, totalPlayers) }, (_, index) => {
        const rank = index + 1;
        const player = leagueState.players[rank - 1] ?? null;
        const key = player ? player.id : `ghost-${rank}`;
        return {
          key,
          rank,
          player,
          zone: "promotion",
        };
      }),
    [leagueState.players, totalPlayers],
  );

  const safeRowRanks = useMemo(() => getVisibleSafeRanks(leagueState.rank, totalPlayers), [leagueState.rank, totalPlayers]);
  const safeRows = useMemo<LeaderboardRowModel[]>(
    () =>
      safeRowRanks.map((rank) => {
        const player = leagueState.players[rank - 1] ?? null;
        const key = player ? player.id : `ghost-${rank}`;
        return {
          key,
          rank,
          player,
          zone: "safe",
        };
      }),
    [leagueState.players, safeRowRanks],
  );

  const demotionRows = useMemo<LeaderboardRowModel[]>(
    () =>
      Array.from({ length: demotionCount }, (_, index) => {
        const rank = totalPlayers - demotionCount + index + 1;
        const player = leagueState.players[rank - 1] ?? null;
        const key = player ? player.id : `ghost-${rank}`;
        return {
          key,
          rank,
          player,
          zone: "demotion",
        };
      }),
    [demotionCount, leagueState.players, totalPlayers],
  );

  useEffect(() => {
    onZoneChange?.(leagueState.zone);
    return () => {
      onZoneChange?.("safe");
    };
  }, [leagueState.zone, onZoneChange]);

  useEffect(() => {
    if (!xpValueRef.current) return;
    if (previousXpRef.current === null) {
      previousXpRef.current = leagueState.xp;
      xpValueRef.current.textContent = `${leagueState.xp.toLocaleString("en-US")} XP`;
      return;
    }

    animateXP(xpValueRef.current, previousXpRef.current, leagueState.xp, STORM_THEME.textPrimary);
    if (leagueState.xp - previousXpRef.current >= 100) {
      const id = `surge-${leagueState.xp}`;
      window.requestAnimationFrame(() => {
        setToasts((current) => [...current, { id, tone: "success", message: "Surge bonus — you gained 100 XP in one session" }]);
      });
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 3400);
    }
    previousXpRef.current = leagueState.xp;
  }, [leagueState.xp]);

  useEffect(() => {
    if (!rankValueRef.current) return;
    const node = rankValueRef.current;
    const previousValue = node.getAttribute("data-rank");
    const nextValue = `#${leagueState.rank}`;

    if (!previousValue) {
      node.textContent = nextValue;
      node.setAttribute("data-rank", nextValue);
      return;
    }

    if (previousValue === nextValue) {
      node.textContent = nextValue;
      return;
    }

    const currentSpan = document.createElement("span");
    const nextSpan = document.createElement("span");
    currentSpan.textContent = previousValue;
    nextSpan.textContent = nextValue;

    const spanStyle = `
      position:absolute;
      left:0;
      top:0;
      transition:transform 200ms ease, opacity 200ms ease;
    `;

    currentSpan.style.cssText = `${spanStyle}transform: translateY(0); opacity: 1;`;
    nextSpan.style.cssText = `${spanStyle}transform: translateY(100%); opacity: 0;`;

    node.innerHTML = "";
    node.style.height = "20px";
    node.style.overflow = "hidden";
    node.style.position = "relative";
    node.appendChild(currentSpan);
    node.appendChild(nextSpan);

    window.requestAnimationFrame(() => {
      currentSpan.style.transform = "translateY(-100%)";
      currentSpan.style.opacity = "0";
      nextSpan.style.transform = "translateY(0)";
      nextSpan.style.opacity = "1";
    });

    const resetTimer = window.setTimeout(() => {
      node.innerHTML = nextValue;
      node.setAttribute("data-rank", nextValue);
    }, 400);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [leagueState.rank]);

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

        const toast =
          event.overtakerUserId === currentUserId
            ? {
                id: event.id,
                message: `You passed ${event.overtakenUsername ?? "Pico learner"}`,
                tone: "success" as const,
              }
            : event.overtakenUserId === currentUserId
              ? {
                  id: event.id,
                  message: `${event.overtakerUsername} passed you`,
                  tone: "danger" as const,
                }
              : null;

        if (!toast) return;
        window.requestAnimationFrame(() => {
          setToasts((current) => [...current, toast]);
        });
        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== toast.id));
        }, 3400);
      });
  }, [events, membership?.userId, myEntry?.userId]);

  useEffect(() => {
    if (previousRivalGapRef.current !== null && previousRivalGapRef.current > 0 && leagueState.rivalGap <= 0 && rival) {
      const id = `rival-pass-${leagueState.xp}`;
      window.requestAnimationFrame(() => {
        setToasts((current) => [...current, { id, tone: "success", message: "You passed your rival — bonus XP incoming" }]);
      });
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 3400);
    }
    previousRivalGapRef.current = leagueState.rivalGap;
  }, [leagueState.rivalGap, leagueState.xp, rival]);

  useEffect(() => {
    const previousZone = previousZoneRef.current;
    previousZoneRef.current = leagueState.zone;

    if (previousZone === null || previousZone === "promotion" || leagueState.zone !== "promotion") {
      return;
    }

    window.requestAnimationFrame(() => {
      setPromotionPulseToken((current) => current + 1);
      setDistanceOverride("You reached the promotion zone");
    });

    const toastId = `promotion-${leagueState.rank}-${leagueState.xp}`;
    window.requestAnimationFrame(() => {
      setToasts((current) => [...current, { id: toastId, tone: "success", message: "First time in the promotion zone this week" }]);
    });
    const toastTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toastId));
    }, 3400);
    const messageTimer = window.setTimeout(() => {
      setDistanceOverride(null);
    }, 2000);

    const youKey = youRowKey;
    if (youKey) {
      const node = rowRefs.current.get(youKey);
      if (node) {
        node.style.transition = "box-shadow 1200ms ease";
        node.style.boxShadow = "0 0 0 2px rgba(34,197,94,0.4)";
        window.setTimeout(() => {
          const currentNode = rowRefs.current.get(youKey);
          if (!currentNode) return;
          currentNode.style.boxShadow = "none";
        }, 60);
      }
    }

    const canvas = confettiCanvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        const context2d = context;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        context2d.scale(window.devicePixelRatio, window.devicePixelRatio);

        const particles = Array.from({ length: 12 }, () => ({
          x: rect.width * 0.5 + (Math.random() - 0.5) * 50,
          y: rect.height * 0.7,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -2 - Math.random() * 2.4,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.5 ? STORM_THEME.accentGreen : STORM_THEME.accentGold,
        }));

        const start = performance.now();

        function draw(nowValue: number) {
          const elapsed = nowValue - start;
          context2d.clearRect(0, 0, rect.width, rect.height);

          particles.forEach((particle) => {
            const progress = elapsed / 900;
            const x = particle.x + particle.vx * elapsed * 0.05;
            const y = particle.y + particle.vy * elapsed * 0.05 + progress * progress * 80;
            context2d.globalAlpha = Math.max(0, 1 - progress);
            context2d.fillStyle = particle.color;
            context2d.fillRect(x, y, particle.size, particle.size);
          });

          if (elapsed < 900) {
            window.requestAnimationFrame(draw);
            return;
          }

          context2d.clearRect(0, 0, rect.width, rect.height);
        }

        window.requestAnimationFrame(draw);
      }
    }

    return () => {
      window.clearTimeout(toastTimer);
      window.clearTimeout(messageTimer);
    };
  }, [leagueState.rank, leagueState.xp, leagueState.zone, youRowKey]);

  useLayoutEffect(() => {
    const nextPositions = new Map<string, number>();
    const movingKeys: string[] = [];

    rowRefs.current.forEach((node, key) => {
      const top = node.getBoundingClientRect().top;
      nextPositions.set(key, top);

      const previousTop = rowTopRef.current.get(key);
      if (previousTop === undefined) return;

      const delta = previousTop - top;
      if (delta === 0) return;

      movingKeys.push(key);
      node.style.transition = "none";
      node.style.transform = `translateY(${delta}px)`;
      node.style.willChange = "transform";
    });

    if (movingKeys.length > 0) {
      const youKey = youRowKey;
      if (youKey) {
        const youNode = rowRefs.current.get(youKey);
        if (youNode) {
          youNode.style.animationPlayState = "paused";
        }
      }

      window.requestAnimationFrame(() => {
        movingKeys.forEach((key) => {
          const node = rowRefs.current.get(key);
          if (!node) return;
          node.style.transition = `transform 500ms ${LEAGUE_EASE}`;
          node.style.transform = "translateY(0)";
        });
      });

      const settleTimer = window.setTimeout(() => {
        movingKeys.forEach((key) => {
          const node = rowRefs.current.get(key);
          if (!node) return;
          node.style.transition = "";
          node.style.willChange = "";
        });

        const youKey = youRowKey;
        if (youKey) {
          const youNode = rowRefs.current.get(youKey);
          if (youNode) {
            youNode.style.animationPlayState = "running";
            youNode.style.transition = "background-color 400ms ease";
            youNode.style.backgroundColor = "rgba(232,130,12,0.2)";
            window.requestAnimationFrame(() => {
              window.setTimeout(() => {
                const latestNode = rowRefs.current.get(youKey);
                if (!latestNode) return;
                latestNode.style.backgroundColor = "rgba(232,130,12,0.09)";
              }, 40);
            });
          }
        }
      }, 540);

      return () => {
        window.clearTimeout(settleTimer);
      };
    }

    rowTopRef.current = nextPositions;
    return;
  }, [demotionRows, promotionRows, safeRows, youRowKey]);

  useLayoutEffect(() => {
    const positions = new Map<string, number>();
    rowRefs.current.forEach((node, key) => {
      positions.set(key, node.getBoundingClientRect().top);
    });
    rowTopRef.current = positions;
  });

  if (loading || leaderboardLoading) {
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

  const subtitle = subtitleEndingSoon
    ? (
        <>
          <span>Ending soon</span>
          <span> · </span>
          <span
            style={{
              color: STORM_THEME.accentRed,
              animation: "leagueTimerPulse 1.5s ease-in-out infinite",
            }}
          >
            {leagueState.hoursRemaining}h left
          </span>
          <span> · </span>
          <span>{leagueState.players.length} competitors</span>
        </>
      )
    : (
        <>
          <span>Week {weekNumber}</span>
          <span> · </span>
          <span>{leagueState.players.length} competitors</span>
          <span> · </span>
          <span>Resets in {daysRemaining}d {leagueState.hoursRemaining % 24}h</span>
        </>
      );

  const promotionDividerLabel = leagueState.eventActive?.type === "promotion_rush" ? "Promotion zone (top 15 this week)" : "Promotion zone";
  const ellipsisCount = Math.max(totalPlayers - 15 - safeRows.length, 0);

  return (
    <>
      <style>{`
        @keyframes leagueYouBreathe {
          0%, 100% { transform: scaleX(1); opacity: 1; }
          50% { transform: scaleX(1.002); opacity: 0.92; }
        }
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
        @keyframes leagueRivalNamePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        @keyframes leagueToastParticle {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-18px); }
        }
        @keyframes leagueShuffleFlash {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
      `}</style>

      <ToastPortal toasts={toasts} />

      <div style={{ position: "relative" }}>
        <canvas
          ref={confettiCanvasRef}
          style={{
            inset: 0,
            pointerEvents: "none",
            position: "absolute",
            width: "100%",
            height: 220,
            zIndex: 2,
          }}
        />

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
            shimmerIntervalMs={leagueState.zone === "promotion" ? 2000 : 4000}
            pulse={leagueState.zone === "near_promotion"}
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
                background: subtitleEndingSoon ? "rgba(239,68,68,0.06)" : "transparent",
                borderRadius: 4,
                color: STORM_THEME.textSecondary,
                display: "inline-flex",
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.5,
                marginTop: 8,
                padding: subtitleEndingSoon ? "4px 8px" : 0,
              }}
            >
              {subtitle}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 14 }}>
              <StatBlock ref={xpValueRef} label="This week" value={`${leagueState.xp.toLocaleString("en-US")} XP`} />
              <StatBlock ref={rankValueRef} label="Your rank" value={`#${leagueState.rank}`} />
              <div style={{ alignSelf: "flex-end", animation: leagueState.zone === "near_promotion" ? "leagueNearPromotionPulse 2s ease-in-out infinite" : undefined }}>
                <StreakPill multiplier={`${leagueState.multiplier.toFixed(1)}×`} days={leagueState.streak} />
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
          <StatBlock label="Rank" value={`#${leagueState.rank}`} />
          <StatBlock
            label={leagueState.rank === 1 ? "Promotion" : "XP to promotion"}
            value={leagueState.rank === 1 ? "Holding #1" : `${leagueState.xpToPromotion.toLocaleString("en-US")} XP`}
            valueColor={leagueState.rank === 1 ? STORM_THEME.accentGreen : undefined}
          />
          <StatBlock
            label="XP to demotion"
            value={`${leagueState.xpToDemotion.toLocaleString("en-US")} XP`}
            valueColor={leagueState.zone === "demotion" || leagueState.zone === "near_demotion" ? STORM_THEME.accentRed : undefined}
          />
        </section>

        <section
          style={{
            background: STORM_THEME.surface,
            border: `1px solid ${STORM_THEME.border}`,
            borderRadius: 4,
            marginTop: 16,
            padding: "16px",
          }}
        >
          {leagueState.xp === 0 ? (
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
              xp={leagueState.xp}
              totalXP={firstPlaceXp}
              promotionCutoffXP={promotionCutoffXp}
              demotionCutoffXP={demotionCutoffXp}
              zone={normalizedProgressZone}
              distanceMessage={distanceMessage}
              promotionPulseToken={promotionPulseToken}
            />
          )}
        </section>

        {leagueState.eventActive && dismissedEventKey !== leagueState.eventActive.key ? (
          <EventBanner
            type={leagueState.eventActive.type}
            expiresIn={leagueState.eventActive.expiresIn}
            onDismiss={() => setDismissedEventKey(leagueState.eventActive?.key ?? null)}
          />
        ) : null}

        {leagueState.zone === "demotion" || leagueState.zone === "near_demotion" ? <ComebackBanner /> : null}

        {leagueState.xp > 0 && rival ? <RivalCard rival={rival} myXP={leagueState.xp} /> : null}

        <section
          style={{
            background: STORM_THEME.surface,
            border: `1px solid ${STORM_THEME.border}`,
            borderRadius: 4,
            padding: "0 16px 16px",
          }}
        >
          <ZoneDivider zone="promotion" label={promotionDividerLabel} />
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
              rank={row.rank}
              player={row.player}
              isYou={Boolean(row.player?.isYou)}
              isRival={Boolean(row.player?.isRival)}
              zone={row.zone}
              doubleXp={leagueState.eventActive?.type === "double_xp"}
              shuffleFlash={shuffleFlash}
            />
          ))}

          <ZoneDivider zone="safe" label="Safe zone" />
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
                rank={row.rank}
                player={row.player}
                isYou={Boolean(row.player?.isYou)}
                isRival={Boolean(row.player?.isRival)}
                zone={row.zone}
                doubleXp={leagueState.eventActive?.type === "double_xp"}
                shuffleFlash={shuffleFlash}
              />
            </Fragment>
          ))}

          <ZoneDivider zone="demotion" label="Demotion zone" />
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
              rank={row.rank}
              player={row.player}
              isYou={Boolean(row.player?.isYou)}
              isRival={Boolean(row.player?.isRival)}
              zone={row.zone}
              doubleXp={leagueState.eventActive?.type === "double_xp"}
              shuffleFlash={shuffleFlash}
            />
          ))}
        </section>
      </div>
    </>
  );
}
