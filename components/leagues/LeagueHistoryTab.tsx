"use client";

import { useMemo } from "react";
import { useLeagueHistory } from "@/lib/hooks/useLeague";
import { formatDateRange, LEAGUE_SANS_FONT, LEAGUE_SERIF_FONT, STORM_THEME } from "@/components/leagues/storm";

type LeagueHistoryTabProps = {
  userId: string;
};

type RewardBadgeProps = {
  label: string;
  tone: "gold" | "green" | "orange";
};

type HistoryCardProps = {
  weekRange: string;
  leagueName: string;
  xpEarned: number;
  finalRank: number | null;
  result: "promoted" | "demoted" | "stayed" | "pending";
  missionsCompleted: number;
};

function RewardBadge({ label, tone }: RewardBadgeProps) {
  const toneStyles =
    tone === "gold"
      ? {
          background: "rgba(200,168,75,0.16)",
          border: "rgba(200,168,75,0.24)",
          color: STORM_THEME.accentGold,
        }
      : tone === "green"
        ? {
            background: "rgba(34,197,94,0.12)",
            border: "rgba(34,197,94,0.20)",
            color: STORM_THEME.accentGreen,
          }
        : {
            background: "rgba(232,130,12,0.14)",
            border: "rgba(232,130,12,0.24)",
            color: STORM_THEME.accentOrange,
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 4,
        background: toneStyles.background,
        border: `1px solid ${toneStyles.border}`,
        color: toneStyles.color,
        padding: "4px 8px",
        fontFamily: LEAGUE_SANS_FONT,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        lineHeight: 1,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function HistoryCard({
  weekRange,
  leagueName,
  xpEarned,
  finalRank,
  result,
  missionsCompleted,
}: HistoryCardProps) {
  const rewardBadges = useMemo(() => {
    if (!finalRank) return [];

    const badges: Array<{ label: string; tone: RewardBadgeProps["tone"] }> = [];
    if (finalRank <= 10) {
      badges.push({ label: "Promotion Badge", tone: "green" });
    }
    if (finalRank <= 3) {
      badges.push({ label: "Bonus XP Next Week", tone: "orange" });
    }
    if (finalRank === 1) {
      badges.push({ label: "League Winner", tone: "gold" });
    }
    return badges;
  }, [finalRank]);

  const resultTone =
    result === "promoted"
      ? { color: STORM_THEME.accentGreen, label: "Promoted" }
      : result === "demoted"
        ? { color: STORM_THEME.accentRed, label: "Demoted" }
        : result === "pending"
          ? { color: STORM_THEME.textSecondary, label: "In progress" }
          : { color: STORM_THEME.accentOrange, label: "Stayed" };

  return (
    <article
      style={{
        background: STORM_THEME.surface,
        border: `1px solid ${STORM_THEME.border}`,
        borderRadius: 4,
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              color: STORM_THEME.textMuted,
              fontFamily: LEAGUE_SANS_FONT,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            League Week
          </div>
          <h2
            style={{
              margin: "8px 0 0",
              color: STORM_THEME.textPrimary,
              fontFamily: LEAGUE_SERIF_FONT,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {leagueName}
          </h2>
        </div>
        <div
          style={{
            color: STORM_THEME.textSecondary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.4,
            textAlign: "right",
          }}
        >
          {weekRange}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {[
          { label: "Week XP", value: `${xpEarned.toLocaleString("en-US")} XP` },
          { label: "Finish", value: finalRank ? `#${finalRank}` : "Pending" },
          { label: "Missions", value: `${missionsCompleted}` },
        ].map((item) => (
          <div key={item.label}>
            <div
              style={{
                color: STORM_THEME.textMuted,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                marginTop: 4,
                color: STORM_THEME.textPrimary,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 24,
        }}
      >
        <span
          style={{
            color: resultTone.color,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {resultTone.label}
        </span>
        {rewardBadges.map((badge) => (
          <RewardBadge key={badge.label} label={badge.label} tone={badge.tone} />
        ))}
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          style={{
            height: 168,
            borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${STORM_THEME.borderSubtle}`,
            animation: "leagueHistoryPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

export default function LeagueHistoryTab({ userId }: LeagueHistoryTabProps) {
  const { history, loading } = useLeagueHistory(userId);

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes leagueHistoryPulse {
            0%, 100% { opacity: 0.42; }
            50% { opacity: 0.72; }
          }
        `}</style>
        <LoadingState />
      </>
    );
  }

  if (history.length === 0) {
    return (
      <section
        style={{
          background: STORM_THEME.surface,
          border: `1px solid ${STORM_THEME.border}`,
          borderRadius: 4,
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: STORM_THEME.textSecondary,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          No league history yet.
        </div>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {history.map((item) => (
        <HistoryCard
          key={`${item.weekStart}-${item.leagueName}`}
          weekRange={formatDateRange(item.weekStart, item.weekEnd)}
          leagueName={item.leagueName}
          xpEarned={item.xpEarned}
          finalRank={item.finalRank}
          result={item.result}
          missionsCompleted={item.missionsCompleted ?? 0}
        />
      ))}
    </div>
  );
}
