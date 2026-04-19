"use client";

import { useEffect, useMemo, useState } from "react";
import { useDistanceToPromotion } from "@/lib/hooks/useLeague";
import type { LeaderboardEntry, League, LeagueMembership, LeagueWeek } from "@/lib/types/leagues";
import { useUserStore } from "@/store/userStore";
import LeagueMark from "@/components/leagues/LeagueMark";

const COLORS = {
  cream: "#f8fafc",
  card: "#1e293b",
  navy: "#f8fafc",
  orange: "#e8820c",
  green: "#22c55e",
  red: "#e0115f",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  muted: "rgba(255,255,255,0.58)",
  mutedSoft: "rgba(255,255,255,0.08)",
} as const;

const DISPLAY_FONT = "\"Playfair Display\", serif";
const SANS_FONT = "\"Source Sans 3\", sans-serif";

type LeaguePreviewCardProps = {
  league: League | null;
  membership: LeagueMembership | null;
  week: LeagueWeek | null;
  entries?: LeaderboardEntry[];
  hotStreakDays?: number;
  hotStreakMultiplier?: number;
  onOpen?: () => void;
};

function formatTimeRemaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Closing soon";

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days <= 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${days} day${days === 1 ? "" : "s"} ${hours} hour${hours === 1 ? "" : "s"}`;
}

export default function LeaguePreviewCard({
  league,
  membership,
  week,
  entries = [],
  hotStreakDays = 0,
  hotStreakMultiplier = 1,
  onOpen,
}: LeaguePreviewCardProps) {
  const [hovered, setHovered] = useState(false);
  const [animateFill, setAnimateFill] = useState(false);
  const totalXp = useUserStore((state) => state.xp);
  const weeklyXp = useUserStore((state) => state.weeklyXP);
  const groupSize = entries.length || 30;
  const myRank = entries.find((entry) => entry.isMe)?.rank ?? membership?.peakRankThisWeek ?? groupSize;
  const myXp = [entries.find((entry) => entry.isMe)?.xpThisWeek, membership?.xpEarnedThisWeek, weeklyXp, totalXp]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    .reduce((lowest, value) => Math.min(lowest, value), Number.POSITIVE_INFINITY);
  const displayXp = Number.isFinite(myXp) ? myXp : 0;
  const promotionCutoff = league?.promotionCutoff ?? 10;
  const demotionCutoff = league?.demotionCutoff ?? 5;
  const { xpToPromotion } = useDistanceToPromotion(myRank, displayXp, entries);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnimateFill(true), 80);
    return () => window.clearTimeout(timeout);
  }, []);

  const rankProgress = useMemo(() => {
    if (!groupSize) return 0;
    return Math.max(0, Math.min(100, ((groupSize - myRank + 1) / groupSize) * 100));
  }, [groupSize, myRank]);

  if (!league || !membership || !week) {
    return (
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 4,
          padding: "16px 18px",
        }}
      >
        <style>{`
          @keyframes leaguePreviewShimmerPulse {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 1; }
          }
        `}</style>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            style={{
              height: item === 0 ? 18 : item === 1 ? 10 : 42,
              marginTop: item === 0 ? 0 : 12,
              borderRadius: 4,
              background: "rgba(26,35,50,0.06)",
              animation: "leaguePreviewShimmerPulse 1.4s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        textAlign: "left",
        background: COLORS.card,
        border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: 4,
        padding: "16px 18px",
        cursor: onOpen ? "pointer" : "default",
        boxShadow: hovered ? "0 4px 16px rgba(26,35,50,0.08)" : "none",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LeagueMark color={league.colorHex} size={14} />
          <div>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 18,
                fontWeight: 900,
                color: league.colorHex,
              }}
            >
              {league.name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 9px",
              borderRadius: 999,
              background: "rgba(232,130,12,0.14)",
              color: COLORS.navy,
              fontFamily: SANS_FONT,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Rank #{myRank}
          </span>
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: 11,
              color: COLORS.muted,
            }}
          >
            of {groupSize}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontFamily: SANS_FONT,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          Time Left
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: SANS_FONT,
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.navy,
          }}
        >
          {formatTimeRemaining(week.weekEnd)}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.navy,
          }}
        >
          <span>{displayXp} XP</span>
          <span style={{ color: COLORS.muted }}>
            TOP {promotionCutoff} {xpToPromotion > 0 ? `| ${xpToPromotion} XP TO GO` : "| IN RANGE"}
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            position: "relative",
            height: 5,
            borderRadius: 3,
            overflow: "hidden",
            background: COLORS.mutedSoft,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: animateFill ? `${rankProgress}%` : "0%",
              borderRadius: 3,
              background: league.colorHex,
              transition: "width 700ms ease-out",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: -2,
              left: `${(promotionCutoff / groupSize) * 100}%`,
              width: 1,
              height: 10,
              background: COLORS.green,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: -2,
              left: `${((groupSize - demotionCutoff) / groupSize) * 100}%`,
              width: 1,
              height: 10,
              background: COLORS.red,
            }}
          />
        </div>
      </div>

      {hotStreakMultiplier > 1 ? (
        <div
          style={{
            marginTop: 14,
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.orange,
          }}
        >
          HOT STREAK | {hotStreakDays}-DAY STREAK | {hotStreakMultiplier.toFixed(1)}X XP
        </div>
      ) : null}
    </button>
  );
}
