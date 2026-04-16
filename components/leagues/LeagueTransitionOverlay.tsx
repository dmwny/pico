"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { League } from "@/lib/types/leagues";
import LeagueMark from "@/components/leagues/LeagueMark";

const COLORS = {
  cream: "#f5f0e8",
  navy: "#1a2332",
  orange: "#e8820c",
  card: "#fdfcf9",
  green: "#22c55e",
} as const;

const DISPLAY_FONT = "\"Playfair Display\", serif";
const SANS_FONT = "\"Source Sans 3\", sans-serif";
const CIRCUMFERENCE = 2 * Math.PI * 42;

const LEAGUE_META_BY_ID: Record<number, Pick<League, "id" | "name" | "colorHex" | "perkDescription">> = {
  1: { id: 1, name: "Bronze", colorHex: "#cd7f32", perkDescription: null },
  2: { id: 2, name: "Silver", colorHex: "#a8a9ad", perkDescription: null },
  3: { id: 3, name: "Gold", colorHex: "#ffd700", perkDescription: "Custom profile themes unlocked" },
  4: { id: 4, name: "Sapphire", colorHex: "#0f52ba", perkDescription: null },
  5: { id: 5, name: "Ruby", colorHex: "#e0115f", perkDescription: null },
  6: { id: 6, name: "Emerald", colorHex: "#50c878", perkDescription: "Hard mode lessons unlocked (+50% XP)" },
  7: { id: 7, name: "Amethyst", colorHex: "#9b59b6", perkDescription: null },
  8: { id: 8, name: "Pearl", colorHex: "#b8a99a", perkDescription: null },
  9: { id: 9, name: "Obsidian", colorHex: "#4b5563", perkDescription: null },
  10: { id: 10, name: "Diamond", colorHex: "#7dd3fc", perkDescription: "Animated profile border + exclusive badge" },
};

type OverlayMode = "hidden" | "unlock" | "promotion" | "demotion";

type LeagueTransitionOverlayProps = {
  league: League | null;
  groupSize?: number;
};

export default function LeagueTransitionOverlay({
  league,
  groupSize = 30,
}: LeagueTransitionOverlayProps) {
  const [mode, setMode] = useState<OverlayMode>("hidden");
  const [countdown, setCountdown] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [previousLeagueId, setPreviousLeagueId] = useState<number | null>(null);

  useEffect(() => {
    if (!league || typeof window === "undefined") return undefined;

    const timeout = window.setTimeout(() => {
      const storedValue = window.localStorage.getItem("pico_last_league_id");
      if (!storedValue) {
        setMode("unlock");
        setCountdown(3);
        setRevealed(false);
        setPreviousLeagueId(null);
        return;
      }

      const parsed = Number(storedValue);
      if (!Number.isFinite(parsed) || parsed === league.id) {
        setMode("hidden");
        return;
      }

      setPreviousLeagueId(parsed);
      setRevealed(true);
      setMode(parsed < league.id ? "promotion" : "demotion");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [league]);

  useEffect(() => {
    if (mode !== "unlock") return undefined;

    const interval = window.setInterval(() => {
      setCountdown((current) => (current > 1 ? current - 1 : 1));
    }, 1000);
    const timeout = window.setTimeout(() => {
      setRevealed(true);
    }, 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [mode]);

  const previousLeague = previousLeagueId ? LEAGUE_META_BY_ID[previousLeagueId] : null;
  const showParticles = mode === "unlock" || mode === "promotion";
  const title =
    mode === "unlock"
      ? "YOUR LEAGUE AWAITS"
      : mode === "promotion"
        ? `PROMOTED TO ${league?.name.toUpperCase()}!`
        : `MOVED TO ${league?.name.toUpperCase()}`;

  const subtitle =
    mode === "unlock"
      ? `You're competing with ${Math.max(0, groupSize - 1)} other learners this week.`
      : mode === "demotion"
        ? "Earn more XP to climb back up. You've got this."
        : "";

  const dismissLabel = mode === "demotion" ? "GOT IT" : "LETS GO";

  const handleDismiss = () => {
    if (!league || typeof window === "undefined") return;
    window.localStorage.setItem("pico_last_league_id", String(league.id));
    setMode("hidden");
  };

  const ringProgressStyle = useMemo(() => {
    if (mode !== "unlock" || revealed) {
      return {
        strokeDashoffset: CIRCUMFERENCE,
      };
    }

    return {
      strokeDasharray: CIRCUMFERENCE,
      strokeDashoffset: 0,
      animation: "leagueUnlockRing 3000ms linear forwards",
    };
  }, [mode, revealed]);

  if (!league || mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="League transition"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 290,
        background: "rgba(26,35,50,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <style>{`
        @keyframes leagueUnlockRing {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: ${CIRCUMFERENCE}; }
        }
        @keyframes leagueOverlayFade {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes leagueOverlayBadgeReveal {
          0% {
            opacity: 0;
            filter: blur(20px) brightness(0.3);
            transform: scale(0.6);
          }
          70% {
            opacity: 1;
            filter: blur(0px) brightness(1);
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            filter: blur(0px) brightness(1);
            transform: scale(1);
          }
        }
        @keyframes leagueOverlayOldDown {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(60px); }
        }
        @keyframes leagueOverlayOldOff {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(80px); }
        }
        @keyframes leagueOverlayNewDrop {
          0% { opacity: 0; transform: translateY(-80px) scale(0.8); }
          72% { opacity: 1; transform: translateY(4px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes leagueOverlayNewRise {
          0% { opacity: 0; transform: translateY(80px) scale(0.88); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes leagueOverlayParticle {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.5);
          }
          18% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate3d(var(--travel-x), var(--travel-y), 0) scale(1.05);
          }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          textAlign: "center",
          color: COLORS.cream,
        }}
      >
        {mode === "unlock" && !revealed ? (
          <>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLORS.cream,
                animation: "leagueOverlayFade 360ms cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              Your League Awaits
            </div>

            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 110, height: 110 }}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke="rgba(245,240,232,0.12)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke={league.colorHex}
                    strokeWidth="8"
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                    style={ringProgressStyle}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: DISPLAY_FONT,
                    fontSize: 36,
                    fontWeight: 900,
                    color: league.colorHex,
                  }}
                >
                  {countdown}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                minHeight: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showParticles ? (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  {Array.from({ length: 24 }).map((_, index) => {
                    const angle = (index / 24) * Math.PI * 2;
                    const distance = 90 + (index % 4) * 18;
                    return (
                      <span
                        key={index}
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: 9,
                          height: 9,
                          background: league.colorHex,
                          animation: "leagueOverlayParticle 1000ms ease-out forwards",
                          "--travel-x": `${Math.cos(angle) * distance}px`,
                          "--travel-y": `${Math.sin(angle) * distance}px`,
                        } as CSSProperties}
                      />
                    );
                  })}
                </div>
              ) : null}

              {previousLeague ? (
                <div
                  style={{
                    position: "absolute",
                    opacity: mode === "promotion" || mode === "demotion" ? 1 : 0,
                    animation: mode === "promotion" ? "leagueOverlayOldDown 400ms ease forwards" : "leagueOverlayOldOff 420ms ease forwards",
                  }}
                >
                  <LeagueMark color={previousLeague.colorHex} size={74} bordered={false} />
                </div>
              ) : null}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.92), ${league.colorHex}22)`,
                  boxShadow: `0 28px 64px ${league.colorHex}22`,
                  animation:
                    mode === "demotion"
                      ? "leagueOverlayNewRise 600ms cubic-bezier(0.22,1,0.36,1) both"
                      : "leagueOverlayBadgeReveal 600ms cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <LeagueMark color={league.colorHex} size={84} bordered={false} />
              </div>
            </div>

            <div
              style={{
                marginTop: 6,
                fontFamily: DISPLAY_FONT,
                fontSize: mode === "demotion" ? 28 : 36,
                fontWeight: 900,
                color: mode === "demotion" ? COLORS.cream : league.colorHex,
                animation: "leagueOverlayFade 420ms cubic-bezier(0.22,1,0.36,1) 220ms both",
              }}
            >
              {title}
            </div>

            {mode === "promotion" && league.perkDescription ? (
              <div
                style={{
                  marginTop: 18,
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 3,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.26)",
                  color: COLORS.green,
                  fontFamily: SANS_FONT,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                NEW PERK UNLOCKED: {league.perkDescription}
              </div>
            ) : null}

            {subtitle ? (
              <div
                style={{
                  marginTop: 16,
                  fontFamily: SANS_FONT,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "rgba(245,240,232,0.66)",
                  animation: "leagueOverlayFade 420ms cubic-bezier(0.22,1,0.36,1) 320ms both",
                }}
              >
                {subtitle}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                marginTop: 26,
                border: mode === "demotion" ? "1px solid rgba(245,240,232,0.18)" : "none",
                background: mode === "demotion" ? "transparent" : COLORS.orange,
                color: mode === "demotion" ? COLORS.cream : COLORS.card,
                borderRadius: 4,
                padding: "12px 18px",
                fontFamily: SANS_FONT,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                animation: "leagueOverlayFade 420ms cubic-bezier(0.22,1,0.36,1) 420ms both",
              }}
            >
              {dismissLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
