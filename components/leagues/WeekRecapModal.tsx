"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { WeekRecap } from "@/lib/types/leagues";

const COLORS = {
  cream: "#f5f0e8",
  card: "#fdfcf9",
  navy: "#1a2332",
  orange: "#e8820c",
  green: "#22c55e",
  red: "#e0115f",
} as const;

const DISPLAY_FONT = "\"Playfair Display\", serif";
const SANS_FONT = "\"Source Sans 3\", sans-serif";

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function useAnimatedCount(target: number, enabled: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let frame = 0;
    let startTime = 0;
    const kickoff = window.requestAnimationFrame(() => {
      setValue(0);
      frame = window.requestAnimationFrame(step);
    });

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      setValue(Math.round(target * easeOutCubic(progress)));

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    return () => {
      window.cancelAnimationFrame(kickoff);
      window.cancelAnimationFrame(frame);
    };
  }, [duration, enabled, target]);

  return value;
}

type WeekRecapModalProps = {
  recap: WeekRecap | null;
  open: boolean;
  chestAvailable?: boolean;
  onContinue: () => void;
};

export default function WeekRecapModal({
  recap,
  open,
  chestAvailable = false,
  onContinue,
}: WeekRecapModalProps) {
  const [stage, setStage] = useState(0);
  const count = useAnimatedCount(recap?.xpEarned ?? 0, open && stage >= 2);

  useEffect(() => {
    if (!open || !recap) return undefined;

    const kickoff = window.setTimeout(() => setStage(1), 0);
    const timers = [
      window.setTimeout(() => setStage(2), 220),
      window.setTimeout(() => setStage(3), 1500),
      window.setTimeout(() => setStage(4), 2350),
      window.setTimeout(() => setStage(5), 2920),
    ];

    return () => {
      window.clearTimeout(kickoff);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [open, recap]);

  const resultTheme = useMemo(() => {
    if (!recap) {
      return {
        background: "rgba(26,35,50,0.08)",
        color: COLORS.navy,
        label: "",
      };
    }

    if (recap.result === "promoted") {
      return {
        background: "rgba(34,197,94,0.14)",
        color: COLORS.green,
        label: `PROMOTED TO ${recap.leagueName.toUpperCase()}`,
      };
    }

    if (recap.result === "demoted") {
      return {
        background: "rgba(224,17,95,0.10)",
        color: COLORS.red,
        label: `MOVING TO ${recap.leagueName.toUpperCase()}`,
      };
    }

    return {
      background: "rgba(26,35,50,0.08)",
      color: COLORS.navy,
      label: `STAYING IN ${recap.leagueName.toUpperCase()}`,
    };
  }, [recap]);

  if (!open || !recap) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Week recap"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(26,35,50,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <style>{`
        @keyframes weekRecapFadeIn {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes weekRecapBannerIn {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes weekRecapParticle {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.6) rotate(0deg);
          }
          22% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate3d(var(--travel-x), var(--travel-y), 0) scale(1.1) rotate(240deg);
          }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          background: COLORS.card,
          borderRadius: 4,
          padding: "40px 36px",
          overflow: "hidden",
        }}
      >
        {recap.result === "promoted" && stage >= 4 ? (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            {Array.from({ length: 24 }).map((_, index) => {
              const angle = (index / 24) * Math.PI * 2;
              const distance = 76 + (index % 4) * 18;
              return (
                    <span
                        key={index}
                        style={{
                          position: "absolute",
                    left: "50%",
                    top: "54%",
                          width: 8,
                          height: 8,
                          background: index % 2 === 0 ? COLORS.green : COLORS.orange,
                          animation: "weekRecapParticle 900ms ease-out forwards",
                          "--travel-x": `${Math.cos(angle) * distance}px`,
                          "--travel-y": `${Math.sin(angle) * distance}px`,
                        } as CSSProperties}
                      />
                    );
                  })}
          </div>
        ) : null}

        {stage >= 1 ? (
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: COLORS.orange,
              animation: "weekRecapFadeIn 360ms cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            Week Complete
          </div>
        ) : null}

        {stage >= 2 ? (
          <div
            style={{
              marginTop: 20,
              animation: "weekRecapFadeIn 420ms cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 72,
                fontWeight: 900,
                lineHeight: 0.96,
                color: COLORS.navy,
              }}
            >
              {count}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: SANS_FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(26,35,50,0.45)",
              }}
            >
              XP Earned
            </div>
          </div>
        ) : null}

        {stage >= 3 ? (
          <div style={{ marginTop: 24 }}>
            {[
              `You passed ${recap.playersPassed} players`,
              `Peak rank: #${recap.peakRank ?? "--"}`,
              `Missions: ${recap.missionsCompleted} completed`,
            ].map((label, index) => (
              <div
                key={label}
                style={{
                  marginTop: index === 0 ? 0 : 12,
                  fontFamily: SANS_FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.navy,
                  opacity: 0,
                  animation: `weekRecapFadeIn 360ms cubic-bezier(0.22,1,0.36,1) ${index * 300}ms forwards`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        ) : null}

        {stage >= 4 ? (
          <div
            style={{
              width: "100%",
              marginTop: 28,
              padding: 20,
              background: resultTheme.background,
              color: resultTheme.color,
              fontFamily: DISPLAY_FONT,
              fontSize: recap.result === "demoted" ? 28 : 24,
              fontWeight: 900,
              lineHeight: 1.1,
              animation: "weekRecapBannerIn 420ms cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {resultTheme.label}
          </div>
        ) : null}

        {stage >= 5 ? (
          <button
            type="button"
            onClick={onContinue}
            style={{
              marginTop: 28,
              border: "none",
              borderRadius: 4,
              background: COLORS.orange,
              color: COLORS.cream,
              padding: "12px 18px",
              fontFamily: SANS_FONT,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              animation: "weekRecapFadeIn 360ms cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {chestAvailable ? "CLAIM REWARDS" : "CONTINUE"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
