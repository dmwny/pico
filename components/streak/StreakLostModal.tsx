"use client";

import { useRouter } from "next/navigation";
import { TrophyIcon } from "@/components/streak/StreakFlame";
import { withAlpha } from "@/lib/themes";

function BrokenFlameIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40 text-slate-300" fill="none" aria-hidden="true">
      <path
        d="M59.8 14C63.2 28.4 76.3 34.4 83.2 44.7C90.2 55.1 91 70.8 83.9 83.7C76.2 97.6 63.5 107.8 48.6 107.8C30.6 107.8 15.5 93 15.5 74.7C15.5 61.5 22.8 51.4 31.2 43.5C39.8 35.2 50.5 28.3 59.8 14Z"
        fill="currentColor"
        opacity="0.16"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M66 36L48 60L60 70L42 96" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M56 52L74 70" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M49 72L68 90" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StreakLostModal({
  lostStreak,
  bestStreak,
  nextMilestone,
  onClose,
}: {
  lostStreak: number;
  bestStreak: number;
  nextMilestone: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const gap = Math.max(1, nextMilestone - lostStreak);

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center overflow-hidden px-4 py-6">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#111827_0%,#020617_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(148,163,184,0.12),transparent_28%)]" />

      <div className="relative w-full max-w-2xl rounded-[2.4rem] border border-white/8 bg-[rgba(15,23,42,0.92)] px-6 py-8 text-center shadow-[0_40px_120px_rgba(2,6,23,0.56)] sm:px-10">
        <p className="text-[0.76rem] font-black uppercase tracking-[0.34em] text-slate-500">Streak Ended</p>
        <div className="mt-6 flex justify-center">
          <BrokenFlameIcon />
        </div>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Your {lostStreak} day streak ended.</h1>
        <p className="mt-4 text-lg font-semibold leading-8 text-slate-300">Don&apos;t let it happen again.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-5 py-4 text-left">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-slate-500">What You Lost</p>
            <p className="mt-3 text-2xl font-black text-white">{lostStreak} days</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
              You were {gap} day{gap === 1 ? "" : "s"} away from the next milestone at {nextMilestone}.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-5 py-4 text-left">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-slate-500">What You Can Do</p>
            <div className="mt-3 flex items-center gap-3 text-amber-200">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/16 bg-amber-200/10">
                <TrophyIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-black text-white">Best: {bestStreak}</p>
                <p className="text-sm font-semibold text-slate-400">You have already proven you can do this.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/learn");
            }}
            className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:-translate-y-0.5"
          >
            Start A New Streak
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/shop");
            }}
            className="rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/8"
            style={{ borderColor: withAlpha("#ffffff", 0.12) }}
          >
            Get Streak Freezes
          </button>
        </div>
      </div>
    </div>
  );
}
