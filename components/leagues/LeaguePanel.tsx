"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMyLeague } from "@/lib/hooks/useLeague";
import GlobalLeaderboardTab from "@/components/leagues/GlobalLeaderboardTab";
import LeagueHistoryTab from "@/components/leagues/LeagueHistoryTab";
import LeagueTab from "@/components/leagues/LeagueTab";

const COLORS = {
  cream: "#f5f0e8",
  card: "#1e293b",
  navy: "#f8fafc",
  orange: "#e8820c",
  border: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.38)",
} as const;

const SANS_FONT = "\"Source Sans 3\", sans-serif";

type DiamondTournamentRow = {
  id: string;
  name: string;
  stage: "quarterfinal" | "semifinal" | "final";
  started_at: string;
  ends_at: string;
  is_active: boolean;
};

function formatTimeRemaining(target: string, now: number) {
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "Closing soon";

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function LeaguePanel() {
  const { membership, league, week, loading, error } = useMyLeague();
  const [activeTab, setActiveTab] = useState<"league" | "global" | "history">("league");
  const [now, setNow] = useState(() => Date.now());
  const [viewerId, setViewerId] = useState("");
  const [tournament, setTournament] = useState<DiamondTournamentRow | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    const loadViewer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setViewerId(user?.id ?? "");
    };

    void loadViewer();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setViewerId(session?.user?.id ?? "");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadTournament = async () => {
      const { data, error: queryError } = await supabase
        .from("diamond_tournaments")
        .select("id, name, stage, started_at, ends_at, is_active")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true })
        .limit(1);

      if (queryError || !active) return;
      setTournament(((data ?? []) as DiamondTournamentRow[])[0] ?? null);
    };

    void loadTournament();

    return () => {
      active = false;
    };
  }, []);

  const tournamentLabel = useMemo(() => {
    if (!tournament) return "";
    return `DIAMOND TOURNAMENT | ${tournament.stage.toUpperCase()} | ${formatTimeRemaining(tournament.ends_at, now)}`;
  }, [now, tournament]);

  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes leaguePanelBannerIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ padding: 16 }}>
        {tournament ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
              border: "1px solid rgba(125,211,252,0.4)",
              borderRadius: 3,
              padding: "10px 16px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: COLORS.navy,
              }}
            >
              {tournamentLabel}
            </div>

            <button
              type="button"
              style={{
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.navy,
                borderRadius: 3,
                padding: "8px 12px",
                fontFamily: SANS_FONT,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              View Bracket
            </button>
          </div>
        ) : null}

        {week?.modifierLabel ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              background: "rgba(232,130,12,0.08)",
              border: "1px solid rgba(232,130,12,0.20)",
              borderRadius: 3,
              padding: "8px 14px",
              marginBottom: 12,
              animation: "leaguePanelBannerIn 300ms cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 12,
                fontWeight: 800,
                color: COLORS.navy,
              }}
            >
              THIS WEEK: {week.modifierLabel}
            </div>
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 11,
                color: "rgba(26,35,50,0.55)",
              }}
            >
              {week.modifierDescription}
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 16px",
        }}
      >
        {[
          ["league", "My League"],
          ["global", "Global"],
          ["history", "History"],
        ].map(([value, label]) => {
          const active = activeTab === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as "league" | "global" | "history")}
              style={{
                border: "none",
                borderBottom: active ? `2px solid ${COLORS.orange}` : "2px solid transparent",
                background: "transparent",
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: SANS_FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? COLORS.navy : COLORS.muted,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 16 }}>
        {error && activeTab === "league" ? (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 3,
              background: "rgba(224,17,95,0.08)",
              border: "1px solid rgba(224,17,95,0.16)",
              color: "#e0115f",
              fontFamily: SANS_FONT,
              fontSize: 12,
            }}
          >
            {error}
          </div>
        ) : null}

        {activeTab === "league" ? (
          <LeagueTab
            membership={membership}
            league={league}
            week={week}
            loading={loading}
          />
        ) : null}

        {activeTab === "global" ? <GlobalLeaderboardTab /> : null}
        {activeTab === "history" ? <LeagueHistoryTab userId={viewerId || membership?.userId || ""} /> : null}
      </div>
    </div>
  );
}
