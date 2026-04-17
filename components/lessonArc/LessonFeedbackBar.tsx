"use client";

import { useState } from "react";

type FeedbackMode = "idle" | "correct" | "wrong";

/**
 * Bottom feedback bar. Editorial cream/ink palette.
 * No emojis — uses geometric SVG marks for correct/wrong.
 */
export default function LessonFeedbackBar({
  mode,
  accentColor = "#e8761c",
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
  accentColor?: string;
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
      <div className="sticky bottom-0 z-30 border-t border-[#1a1815]/10 bg-[#faf5ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] justify-end px-6 py-5">
          <button
            type="button"
            disabled={disabled}
            onClick={onPrimaryAction}
            className="group relative inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#1a1815] px-7 font-mono text-[12px] uppercase tracking-[0.22em] text-[#faf5ec] transition-all hover:bg-[#e8761c] disabled:cursor-not-allowed disabled:bg-[#1a1815]/15 disabled:text-[#1a1815]/40"
          >
            {primaryLabel}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = mode === "correct";

  return (
    <div
      className="sticky bottom-0 z-30 border-t-2 border-[#1a1815] bg-[#faf5ec]"
      style={{ animation: "lessonFeedbackSlideUp 320ms cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`@keyframes lessonFeedbackSlideUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}`}</style>

      {/* accent rule */}
      <div
        className="h-1 w-full"
        style={{ background: isCorrect ? "#1a1815" : accentColor }}
      />

      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${
              isCorrect ? "border-[#1a1815] bg-[#1a1815] text-[#faf5ec]" : "text-[#faf5ec]"
            }`}
            style={
              isCorrect
                ? undefined
                : {
                    borderColor: accentColor,
                    background: accentColor,
                  }
            }
          >
            {isCorrect ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-serif text-2xl leading-tight text-[#1a1815]">{label}</h2>
              {isCorrect && typeof xpAwarded === "number" ? (
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  +{xpAwarded} xp
                </span>
              ) : null}
            </div>

            {!isCorrect && correctAnswer ? (
              <p className="mt-1 font-mono text-sm text-[#1a1815]/70">
                <span className="text-[#1a1815]/40">answer · </span>
                <span className="text-[#1a1815]">{correctAnswer}</span>
              </p>
            ) : null}

            {explanation ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowWhy((v) => !v)}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1a1815]/60 underline-offset-4 hover:text-[#1a1815] hover:underline"
                >
                  {showWhy ? "Hide explanation" : "Why?"}
                </button>
                {showWhy ? (
                  <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-[#1a1815]/85">{explanation}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimaryAction}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-7 font-mono text-[12px] uppercase tracking-[0.22em] transition-colors ${
            isCorrect
              ? "bg-[#1a1815] text-[#faf5ec] hover:bg-[#e8761c]"
              : "text-[#faf5ec]"
          }`}
          style={
            isCorrect
              ? undefined
              : {
                  background: accentColor,
                }
          }
        >
          {primaryLabel}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
