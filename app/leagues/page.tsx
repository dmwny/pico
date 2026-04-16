"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalLeaderboardTab from "@/components/leagues/GlobalLeaderboardTab";
import LeagueHistoryTab from "@/components/leagues/LeagueHistoryTab";
import LeagueTab from "@/components/leagues/LeagueTab";
import LeagueTransitionOverlay from "@/components/leagues/LeagueTransitionOverlay";
import WeekRecapModal from "@/components/leagues/WeekRecapModal";
import { getLeagueBackground, LEAGUE_SANS_FONT, LEAGUE_SERIF_FONT, STORM_THEME, type LeagueZone } from "@/components/leagues/storm";
import { useMyLeague, useRewardChest, useWeekRecap } from "@/lib/hooks/useLeague";
import { supabase } from "@/lib/supabase";

type TabKey = "league" | "global" | "history";

type TabButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function TabButton({ active, label, onClick }: TabButtonProps) {
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
        padding: "16px 16px 14px",
        fontFamily: LEAGUE_SANS_FONT,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        lineHeight: 1,
        textTransform: "uppercase",
        transition: "color 160ms ease, border-color 160ms ease",
      }}
    >
      {label}
    </button>
  );
}

function LoadingShell() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[88, 200, 360].map((height) => (
        <div
          key={height}
          style={{
            height,
            borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${STORM_THEME.borderSubtle}`,
            animation: "leagueShellPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  const router = useRouter();

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
          width: 52,
          height: 52,
          borderRadius: "50%",
          margin: "0 auto",
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
          textTransform: "uppercase",
        }}
      >
        Pico
      </div>
      <h1
        style={{
          margin: "24px 0 0",
          color: STORM_THEME.textPrimary,
          fontFamily: LEAGUE_SERIF_FONT,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        You&apos;re not in a league yet
      </h1>
      <p
        style={{
          margin: "16px 0 0",
          color: STORM_THEME.textSecondary,
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        Complete your first lesson to enter this week&apos;s competition.
      </p>
      <button
        type="button"
        onClick={() => router.push("/learn")}
        style={{
          appearance: "none",
          border: "none",
          borderRadius: 4,
          background: STORM_THEME.accentOrange,
          color: STORM_THEME.badgeTextDark,
          cursor: "pointer",
          marginTop: 24,
          padding: "12px 16px",
          fontFamily: LEAGUE_SANS_FONT,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        Start a lesson
      </button>
    </section>
  );
}

export default function LeaguesPage() {
  const { membership, league, week, loading } = useMyLeague();
  const { recap, hasUnseenRecap, markSeen } = useWeekRecap();
  const { chest } = useRewardChest();
  const [activeTab, setActiveTab] = useState<TabKey>("league");
  const [viewerId, setViewerId] = useState("");
  const [leagueZone, setLeagueZone] = useState<LeagueZone>("safe");

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

  const background = useMemo(() => {
    if (activeTab !== "league") {
      return STORM_THEME.background;
    }
    return getLeagueBackground(leagueZone);
  }, [activeTab, leagueZone]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background,
        color: STORM_THEME.textPrimary,
        transition: "background-color 280ms ease",
      }}
    >
      <style>{`
        @keyframes leagueShellPulse {
          0%, 100% { opacity: 0.42; }
          50% { opacity: 0.72; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "24px 28px 32px",
        }}
      >
        <LeagueTransitionOverlay league={league} />
        <WeekRecapModal
          recap={recap}
          open={hasUnseenRecap}
          chestAvailable={Boolean(chest)}
          onContinue={markSeen}
        />

        <section
          style={{
            borderBottom: `1px solid ${STORM_THEME.borderSubtle}`,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TabButton active={activeTab === "league"} label="My League" onClick={() => setActiveTab("league")} />
            <TabButton active={activeTab === "global"} label="Global" onClick={() => setActiveTab("global")} />
            <TabButton active={activeTab === "history"} label="History" onClick={() => setActiveTab("history")} />
          </div>
        </section>

        {loading ? <LoadingShell /> : null}

        {!loading && !membership && activeTab === "league" ? <EmptyState /> : null}

        {!loading && membership && league && week && activeTab === "league" ? (
          <LeagueTab
            membership={membership}
            league={league}
            week={week}
            loading={false}
            onZoneChange={setLeagueZone}
          />
        ) : null}

        {!loading && activeTab === "global" ? <GlobalLeaderboardTab /> : null}
        {!loading && activeTab === "history" ? <LeagueHistoryTab userId={viewerId || membership?.userId || ""} /> : null}
      </div>
    </main>
  );
}
