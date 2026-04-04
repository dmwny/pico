"use client";

import { StreakFlame } from "@/components/streak/StreakFlame";
import { withAlpha } from "@/lib/themes";
import type { StreakRiskState } from "@/lib/streaks";

export default function StreakRiskBanner({
  risk,
  onStartLesson,
  onUseFreeze,
  canUseFreeze,
  reserved,
  dismissed,
  onDismiss,
}: {
  risk: StreakRiskState;
  onStartLesson: () => void;
  onUseFreeze: () => void;
  canUseFreeze: boolean;
  reserved: boolean;
  dismissed: boolean;
  onDismiss: () => void;
}) {
  if (dismissed) return null;

  const urgent = risk.level === "danger";
  const title = urgent
    ? "Your streak needs attention now"
    : `Your ${risk.currentStreak} day streak is at risk`;
  const body = urgent
    ? `Less than ${risk.hoursLeft} hour${risk.hoursLeft === 1 ? "" : "s"} left before midnight.`
    : "Complete a lesson before midnight to keep it.";

  return (
    <div
      className="relative overflow-hidden rounded-[1.8rem] border px-5 py-4 shadow-[0_24px_54px_rgba(15,23,42,0.18)]"
      style={{
        borderColor: urgent ? "rgba(248,113,113,0.34)" : "rgba(251,191,36,0.34)",
        background: urgent
          ? "linear-gradient(135deg,rgba(127,29,29,0.92) 0%,rgba(69,10,10,0.94) 100%)"
          : "linear-gradient(135deg,rgba(120,53,15,0.92) 0%,rgba(120,53,15,0.84) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: urgent
            ? "radial-gradient(circle at 85% 18%, rgba(248,113,113,0.34), transparent 32%)"
            : "radial-gradient(circle at 85% 18%, rgba(251,191,36,0.32), transparent 34%)",
        }}
      />

      <div className="relative flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/20 bg-white/10">
          <StreakFlame streak={risk.currentStreak} freezeCount={risk.freezeCount} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/58">
                {urgent ? "Danger" : "Warning"}
              </p>
              <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/10"
              style={{ borderColor: withAlpha("#ffffff", 0.16) }}
            >
              X
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/82">{body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.18em] text-white/72">
              {risk.freezeCount} freeze{risk.freezeCount === 1 ? "" : "s"}
            </span>
            {reserved ? (
              <span className="rounded-full border border-sky-200/26 bg-sky-200/12 px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.18em] text-sky-100">
                Freeze Armed
              </span>
            ) : null}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStartLesson}
            className="rounded-full bg-white px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_34px_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5"
          >
            Start Lesson
          </button>
          {(urgent || risk.level === "warning") && risk.freezeCount > 0 ? (
            <button
              type="button"
              onClick={onUseFreeze}
              disabled={!canUseFreeze || reserved}
              className="rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.18em] transition"
              style={canUseFreeze && !reserved
                ? {
                    background: "rgba(224,242,254,0.18)",
                    border: "1px solid rgba(186,230,253,0.28)",
                    color: "#e0f2fe",
                  }
                : {
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "not-allowed",
                  }}
            >
              {reserved ? "Freeze Armed" : "Use Freeze"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
