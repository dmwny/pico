"use client";

import Link from "next/link";
import { withAlpha } from "@/lib/themes";
import { SnowflakeIcon } from "@/components/streak/StreakFlame";

export default function StreakProtectedBanner({
  streak,
  remainingFreezes,
  count,
  onDismiss,
}: {
  streak: number;
  remainingFreezes: number;
  count: number;
  onDismiss: () => void;
}) {
  const body = count > 1
    ? `You missed ${count} days, but streak freezes kept your ${streak} day streak alive.`
    : `You missed yesterday, but a streak freeze kept your ${streak} day streak alive.`;

  return (
    <div
      className="relative overflow-hidden rounded-[1.8rem] border px-5 py-4 shadow-[0_20px_50px_rgba(8,47,73,0.18)]"
      style={{
        borderColor: "rgba(125,211,252,0.36)",
        background: "linear-gradient(135deg,rgba(240,249,255,0.96) 0%,rgba(224,242,254,0.94) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-40"
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(125,211,252,0.34), transparent 68%)",
        }}
      />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-sky-500 text-white shadow-[0_16px_34px_rgba(14,165,233,0.28)]">
          <SnowflakeIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-sky-700/72">Streak Freeze</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">Your streak was protected</h2>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:bg-white/60"
              style={{ borderColor: withAlpha("#0f172a", 0.08) }}
            >
              X
            </button>
          </div>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.74rem] font-black uppercase tracking-[0.18em]">
            <span className="rounded-full bg-white/72 px-3 py-1.5 text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              {remainingFreezes} freeze{remainingFreezes === 1 ? "" : "s"} left
            </span>
            <Link href="/shop" className="text-sky-700 transition hover:text-sky-800">
              Get more freezes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
