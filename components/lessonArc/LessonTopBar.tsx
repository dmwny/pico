"use client";

import { useEffect, useState } from "react";

/**
 * Top bar — exit, progress, hearts, XP.
 * Cream/ink palette. No emojis. Hearts use inline SVG.
 */
export default function LessonTopBar({
  accentColor = "#e8761c",
  lessonIndex,
  totalLessons,
  onExit,
  onClose,
  questionNumber,
  currentQuestion,
  totalQuestions,
  hearts,
  maxHearts = 5,
  xpEarned = 0,
  unlimitedHearts,
  lossFlashKey,
}: {
  accentColor?: string;
  lessonIndex?: number;
  totalLessons?: number;
  onExit?: () => void;
  onClose?: () => void;
  questionNumber?: number;
  currentQuestion?: number;
  totalQuestions: number;
  hearts: number;
  maxHearts?: number;
  xpEarned?: number;
  unlimitedHearts?: boolean;
  lossFlashKey?: number;
}) {
  const [dismissedFlashKey, setDismissedFlashKey] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (lossFlashKey === undefined) return;
    const t = window.setTimeout(() => setDismissedFlashKey(lossFlashKey), 380);
    return () => window.clearTimeout(t);
  }, [lossFlashKey]);
  const flash = lossFlashKey !== undefined && lossFlashKey !== dismissedFlashKey;

  const resolvedOnExit = onExit ?? onClose ?? (() => {});
  const resolvedQuestionNumber = questionNumber ?? currentQuestion ?? 0;
  const pct = Math.max(0, Math.min(100, (resolvedQuestionNumber / Math.max(1, totalQuestions)) * 100));

  return (
    <div
      className="sticky top-0 z-40 backdrop-blur border-b"
      style={{
        background: "rgba(10, 16, 28, 0.94)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="mx-auto flex max-w-[1100px] items-center gap-6 px-6 py-4">
        <button
          type="button"
          onClick={resolvedOnExit}
          aria-label="Exit lesson"
          className="grid h-9 w-9 place-items-center rounded-full border transition-colors"
          style={{
            borderColor: "rgba(255,255,255,0.15)",
            color: "rgba(248,243,234,0.82)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>

        <div className="flex flex-1 items-center gap-4">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(248,243,234,0.12)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${pct}%`, background: accentColor }}
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums" style={{ color: "rgba(248,243,234,0.82)" }}>
              {String(resolvedQuestionNumber).padStart(2, "0")} / {String(totalQuestions).padStart(2, "0")}
            </span>
            {lessonIndex && totalLessons ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(248,243,234,0.56)" }}>
                Lesson {lessonIndex} / {totalLessons}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5" aria-label="Hearts">
          {unlimitedHearts ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                borderColor: accentColor,
                background: "rgba(232,118,28,0.16)",
                color: accentColor,
              }}
            >
              <Heart filled className="h-3 w-3" /> Unlimited
            </span>
          ) : (
            Array.from({ length: maxHearts }).map((_, i) => (
              <Heart
                key={i}
                filled={i < hearts}
                className={`h-4 w-4 transition-transform ${flash && i === hearts ? "animate-[pulse_0.4s_ease-out]" : ""}`}
              />
            ))
          )}
        </div>

        <div className="hidden items-baseline gap-1.5 sm:flex">
          <span className="font-serif text-xl tabular-nums" style={{ color: "#f8f3ea" }}>{xpEarned}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(248,243,234,0.82)" }}>xp</span>
        </div>
      </div>
    </div>
  );
}

function Heart({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "#e8761c" : "none"} stroke={filled ? "#e8761c" : "rgba(248,243,234,0.32)"} strokeWidth="2">
      <path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6.5 5 8.5 5 10.5 6 12 8c1.5-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12c-2.5 4.65-9.5 9-9.5 9z" />
    </svg>
  );
}
