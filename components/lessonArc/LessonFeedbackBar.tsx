"use client";

import { useState } from "react";

type FeedbackMode = "idle" | "correct" | "wrong";

export default function LessonFeedbackBar({
  mode,
  accentColor,
  disabled,
  correctAnswer,
  xpAwarded,
  label,
  explanation,
  alwaysShowExplanation,
  primaryLabel,
  onPrimaryAction,
}: {
  mode: FeedbackMode;
  accentColor: string;
  disabled: boolean;
  correctAnswer?: string;
  xpAwarded?: number;
  label: string;
  explanation?: string;
  alwaysShowExplanation?: boolean;
  primaryLabel: string;
  onPrimaryAction: () => void;
}) {
  const [showWhy, setShowWhy] = useState(alwaysShowExplanation ?? false);

  if (mode === "idle") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d1522] px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 shadow-[0_-20px_40px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={disabled}
            className={`flex h-14 w-full items-center justify-center rounded-[1.25rem] text-base font-black uppercase tracking-[0.16em] transition active:scale-[0.985] ${
              disabled
                ? "cursor-not-allowed bg-white/8 text-white/45"
                : "text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
            }`}
            style={!disabled ? { background: accentColor } : undefined}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = mode === "correct";
  const barColor = isCorrect ? "#58CC02" : "#EA2B2B";
  const buttonColor = isCorrect ? "#4CAF02" : "#C52323";

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 animate-[lessonFeedbackSlideUp_250ms_ease-out] px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4"
    >
      <style>{`
        @keyframes lessonFeedbackSlideUp {
          0% {
            opacity: 0;
            transform: translateY(32px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        className="mx-auto max-w-4xl rounded-[1.75rem] border border-white/10 px-5 py-5 text-white shadow-[0_-24px_48px_rgba(0,0,0,0.28)]"
        style={{ background: barColor, minHeight: "132px" }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            {isCorrect ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-black leading-tight">{label}</p>
                {!isCorrect && correctAnswer ? (
                  <p className="mt-1 text-sm font-semibold text-white/92">
                    Correct answer: <code className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[0.92em]">{correctAnswer}</code>
                  </p>
                ) : null}
              </div>
              {isCorrect && typeof xpAwarded === "number" ? (
                <p className="shrink-0 text-sm font-black uppercase tracking-[0.18em] text-white/88">+{xpAwarded} XP</p>
              ) : null}
            </div>

            {explanation ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowWhy((current) => !current)}
                  className="text-sm font-black uppercase tracking-[0.16em] text-white/90"
                >
                  Why?
                </button>
                <div className={`grid transition-all duration-250 ease-out ${showWhy ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">{explanation}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="mt-4 flex h-14 w-full items-center justify-center rounded-[1.25rem] bg-white text-base font-black uppercase tracking-[0.16em] text-white transition active:scale-[0.985]"
          style={{ background: buttonColor }}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
