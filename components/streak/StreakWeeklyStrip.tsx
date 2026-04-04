"use client";

import { withAlpha } from "@/lib/themes";
import { type StreakWeekDay } from "@/lib/streaks";
import { SnowflakeIcon, StreakFlame } from "@/components/streak/StreakFlame";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6.5 12.5L10.2 16.2L17.5 8.9" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M8 8L16 16" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export default function StreakWeeklyStrip({
  days,
  streak,
  accentColor,
  textColor,
}: {
  days: StreakWeekDay[];
  streak: number;
  accentColor: string;
  textColor: string;
}) {
  return (
    <div className="rounded-[1.65rem] border px-3 py-3" style={{ borderColor: withAlpha(accentColor, 0.14), background: withAlpha("#ffffff", 0.04) }}>
      <style>{`
        @keyframes streakRingPulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.08); opacity: 0.86; }
        }
        @keyframes streakTokenFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes streakShieldShimmer {
          0%, 100% { opacity: 0.58; transform: scale(0.96); }
          50% { opacity: 0.92; transform: scale(1.04); }
        }
      `}</style>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(textColor, 0.48) }}>
          Last 7 Days
        </p>
        <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(textColor, 0.48) }}>
          Streak Proof
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isHot = day.state === "completed";
          const isProtected = day.state === "protected" || day.state === "reserved";
          const isPending = day.state === "today_pending";
          const shellStyle = isHot
            ? {
                background: `linear-gradient(180deg, ${withAlpha("#fbbf24", 0.98)} 0%, ${accentColor} 100%)`,
                color: "#ffffff",
                boxShadow: `0 14px 28px ${withAlpha(accentColor, 0.24)}`,
              }
            : isProtected
              ? {
                  background: "linear-gradient(180deg,#dbeafe 0%,#bfdbfe 100%)",
                  color: "#0f766e",
                  boxShadow: "0 14px 28px rgba(56,189,248,0.18)",
                }
              : isPending
                ? {
                    background: withAlpha("#ffffff", 0.06),
                    color: withAlpha(textColor, 0.62),
                    borderStyle: "dashed" as const,
                    borderColor: withAlpha(accentColor, 0.4),
                  }
                : {
                    background: withAlpha("#0f172a", 0.08),
                    color: withAlpha(textColor, 0.32),
                  };

          return (
            <div key={day.dateKey} className="flex flex-col items-center gap-2 text-center">
              <span
                className="text-[0.72rem] font-black"
                style={{ color: day.isToday ? accentColor : withAlpha(textColor, 0.46) }}
              >
                {day.label.slice(0, 2)}
              </span>
              <div className="relative">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border"
                  style={{
                    borderColor: isHot
                      ? withAlpha("#ffffff", 0.48)
                      : isProtected
                        ? "rgba(255,255,255,0.52)"
                        : isPending
                          ? withAlpha(accentColor, 0.46)
                          : withAlpha("#ffffff", 0.18),
                    ...shellStyle,
                    animation: isHot ? "streakTokenFloat 3.4s ease-in-out infinite" : undefined,
                  }}
                >
                  {day.state === "completed" ? (
                    streak >= 3 ? (
                      <StreakFlame streak={Math.max(streak, 1)} size={20} animate className="scale-[0.95]" showFreezeIndicator={false} />
                    ) : (
                      <CheckIcon className="h-5 w-5" />
                    )
                  ) : null}
                  {day.state === "protected" ? <SnowflakeIcon className="h-5 w-5" /> : null}
                  {day.state === "reserved" ? <SnowflakeIcon className="h-5 w-5" /> : null}
                  {day.state === "missed" ? <MissIcon className="h-[1.125rem] w-[1.125rem]" /> : null}
                  {day.state === "today_pending" ? (
                    <span
                      className="h-3.5 w-3.5 rounded-full border-2"
                      style={{
                        borderColor: accentColor,
                        animation: "streakRingPulse 1.8s ease-in-out infinite",
                      }}
                    />
                  ) : null}
                </span>
                {day.state === "protected" || day.state === "reserved" ? (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full border border-sky-200/80"
                    style={{ animation: "streakShieldShimmer 2.4s ease-in-out infinite" }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
