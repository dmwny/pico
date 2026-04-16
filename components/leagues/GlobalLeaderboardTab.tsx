"use client";

import { useMemo, useState } from "react";
import { useGlobalLeaderboard } from "@/lib/hooks/useLeague";
import { getAvatarColor, getInitials, getRankColor, LEAGUE_SANS_FONT, LEAGUE_SERIF_FONT, STORM_THEME } from "@/components/leagues/storm";

type GlobalPeriod = "daily" | "weekly" | "alltime";

type PeriodButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

type GlobalRowProps = {
  rank: number;
  name: string;
  avatarUrl: string | null;
  score: number;
  isYou: boolean;
  playStyleTag: string | null;
  userId: string;
};

function PeriodButton({ active, label, onClick }: PeriodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none",
        border: "none",
        borderBottom: active ? `2px solid ${STORM_THEME.accentOrange}` : "2px solid transparent",
        background: "transparent",
        color: active ? STORM_THEME.textPrimary : STORM_THEME.textSecondary,
        cursor: "pointer",
        fontFamily: LEAGUE_SANS_FONT,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        lineHeight: 1,
        padding: "0 0 12px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

function GlobalRow({ rank, name, avatarUrl, score, isYou, playStyleTag, userId }: GlobalRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "20px 12px 30px 12px 1fr 80px",
        alignItems: "center",
        minHeight: 50,
        padding: "10px 14px",
        background: isYou ? "rgba(232,130,12,0.09)" : "transparent",
        border: isYou ? "1px solid rgba(232,130,12,0.18)" : "1px solid transparent",
        borderRadius: isYou ? 4 : 0,
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
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          overflow: "hidden",
          background: avatarUrl ? "transparent" : getAvatarColor(userId),
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
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          getInitials(name)
        )}
      </div>
      <div />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
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
            {name}
          </div>
          {isYou ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 3,
                background: STORM_THEME.accentOrange,
                color: STORM_THEME.badgeTextDark,
                padding: "1px 5px",
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: 1.3,
                textTransform: "uppercase",
              }}
            >
              You
            </span>
          ) : null}
        </div>
        <div
          style={{
            color: STORM_THEME.textMuted,
            fontFamily: LEAGUE_SANS_FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {playStyleTag || "Global leaderboard"}
        </div>
      </div>
      <div
        style={{
          color: STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          textAlign: "right",
        }}
      >
        {score.toLocaleString("en-US")}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          style={{
            height: 50,
            borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${STORM_THEME.borderSubtle}`,
            animation: "globalLeaderboardPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

function getScore(period: GlobalPeriod, entry: { dailyXp: number; weeklyXp: number; totalXp: number }) {
  if (period === "daily") return entry.dailyXp;
  if (period === "weekly") return entry.weeklyXp;
  return entry.totalXp;
}

export default function GlobalLeaderboardTab() {
  const [period, setPeriod] = useState<GlobalPeriod>("weekly");
  const { entries, myEntry, loading } = useGlobalLeaderboard(period);
  const topEntries = useMemo(() => entries.slice(0, 20), [entries]);

  return (
    <>
      <style>{`
        @keyframes globalLeaderboardPulse {
          0%, 100% { opacity: 0.42; }
          50% { opacity: 0.72; }
        }
      `}</style>

      <section
        style={{
          background: STORM_THEME.surface,
          border: `1px solid ${STORM_THEME.border}`,
          borderRadius: 4,
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
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
              Global Standings
            </div>
            <h1
              style={{
                margin: "8px 0 0",
                color: STORM_THEME.textPrimary,
                fontFamily: LEAGUE_SERIF_FONT,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              See where you stack up
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PeriodButton active={period === "daily"} label="Daily" onClick={() => setPeriod("daily")} />
            <PeriodButton active={period === "weekly"} label="Weekly" onClick={() => setPeriod("weekly")} />
            <PeriodButton active={period === "alltime"} label="All Time" onClick={() => setPeriod("alltime")} />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loading ? <LoadingState /> : null}

          {!loading && topEntries.length === 0 ? (
            <div
              style={{
                color: STORM_THEME.textSecondary,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              No global rankings yet.
            </div>
          ) : null}

          {!loading && topEntries.length > 0 ? (
            <div
              style={{
                background: STORM_THEME.surfaceRaised,
                border: `1px solid ${STORM_THEME.borderSubtle}`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {topEntries.map((entry) => (
                <GlobalRow
                  key={entry.userId}
                  rank={entry.rank}
                  name={entry.username}
                  avatarUrl={entry.avatarUrl}
                  score={getScore(period, entry)}
                  isYou={entry.isMe}
                  playStyleTag={entry.playStyleTag}
                  userId={entry.userId}
                />
              ))}
            </div>
          ) : null}
        </div>

        {!loading && myEntry && myEntry.rank > 20 ? (
          <div
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: `1px solid ${STORM_THEME.borderSubtle}`,
            }}
          >
            <div
              style={{
                color: STORM_THEME.textMuted,
                fontFamily: LEAGUE_SANS_FONT,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                lineHeight: 1,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              Your Position
            </div>
            <div
              style={{
                background: STORM_THEME.surfaceRaised,
                border: `1px solid rgba(232,130,12,0.18)`,
                borderRadius: 4,
              }}
            >
              <GlobalRow
                rank={myEntry.rank}
                name={myEntry.username}
                avatarUrl={myEntry.avatarUrl}
                score={getScore(period, myEntry)}
                isYou={true}
                playStyleTag={myEntry.playStyleTag}
                userId={myEntry.userId}
              />
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
