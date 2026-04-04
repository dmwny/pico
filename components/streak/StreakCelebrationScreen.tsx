"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";
import { usePageHidden, usePrefersReducedMotion } from "@/lib/motion";
import { getStreakFlameTier, type StreakMilestoneReward } from "@/lib/streaks";
import { mixHex, withAlpha } from "@/lib/themes";
import StreakCelebrationFlame from "@/components/streak/StreakCelebrationFlame";

type StreakCelebrationScreenProps = {
  streak: number;
  message: string;
  onContinue: () => void;
  reward?: StreakMilestoneReward;
};

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z" fill="currentColor" opacity="0.18" />
      <path d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4.8L12 10.2L15 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.8 10.2H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function getCountDuration(target: number) {
  if (target <= 7) return 760;
  if (target <= 30) return 900;
  if (target <= 100) return 1050;
  return 1180;
}

function useAnimatedCount(target: number, enabled: boolean, delayMs: number, durationMs: number) {
  const [value, setValue] = useState(() => (enabled ? 0 : target));

  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    let startTime: number | null = null;
    const timeout = window.setTimeout(() => {
      setValue(0);
      const step = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / durationMs);
        const eased = 1 - (1 - progress) ** 3;
        setValue(Math.round(target * eased));
        if (progress < 1) {
          frame = window.requestAnimationFrame(step);
        }
      };
      frame = window.requestAnimationFrame(step);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delayMs, durationMs, enabled, target]);

  return enabled ? value : target;
}

function getNumberSize(streak: number) {
  if (streak >= 100) return "clamp(6.5rem, 18vw, 8rem)";
  if (streak >= 30) return "clamp(5.75rem, 16vw, 7rem)";
  return "clamp(5rem, 14vw, 6.25rem)";
}

export default function StreakCelebrationScreen({
  streak,
  message,
  onContinue,
  reward,
}: StreakCelebrationScreenProps) {
  const { pathTheme } = useThemeContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const pageHidden = usePageHidden();
  const allowEntranceMotion = !prefersReducedMotion && !pageHidden;
  const allowIdleMotion = !pageHidden;
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tier = getStreakFlameTier(streak);
  const isMilestone = Boolean(reward);
  const isLegendary = streak >= 100;
  const streakCount = useAnimatedCount(
    streak,
    allowEntranceMotion,
    1320,
    getCountDuration(streak),
  );
  const gemCount = useAnimatedCount(
    reward?.gems ?? 0,
    allowEntranceMotion && Boolean(reward),
    1780,
    760,
  );

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleShare = async () => {
    if (!reward?.shareText) return;
    try {
      await navigator.clipboard.writeText(reward.shareText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const backgroundTint = useMemo(
    () => mixHex(pathTheme.surfaceDark, "#06070b", isLegendary ? 0.5 : 0.62),
    [isLegendary, pathTheme.surfaceDark],
  );

  const flameSize = isLegendary ? 320 : isMilestone ? 286 : 252;
  const contentDelayStyles = {
    number: allowEntranceMotion ? "streakCelebrationNumber 0.68s cubic-bezier(0.22, 1, 0.36, 1) 1.24s both" : undefined,
    label: allowEntranceMotion ? "streakCelebrationLabel 0.42s ease-out 1.42s both" : undefined,
    message: allowEntranceMotion ? "streakCelebrationMessage 0.54s cubic-bezier(0.22, 1, 0.36, 1) 1.58s both" : undefined,
    reward: allowEntranceMotion ? "streakCelebrationReward 0.5s cubic-bezier(0.22, 1, 0.36, 1) 1.76s both" : undefined,
    button: allowEntranceMotion ? "streakCelebrationButton 0.56s cubic-bezier(0.22, 1, 0.36, 1) 1.92s both" : undefined,
    share: allowEntranceMotion ? "streakCelebrationButton 0.52s cubic-bezier(0.22, 1, 0.36, 1) 1.82s both" : undefined,
  } as const;

  return (
    <div
      className="fixed inset-0 z-[140] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${streak} day streak`}
    >
      <style>{`
        @keyframes streakCelebrationIgnite {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.68); }
          72% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
          100% { opacity: 0.96; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes streakCelebrationFlash {
          0% { opacity: 0; }
          22% { opacity: 0.22; }
          100% { opacity: 0; }
        }
        @keyframes streakCelebrationNumber {
          0% { transform: translateY(-52px) scale(0.9); opacity: 0; }
          72% { transform: translateY(8px) scale(1.04); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes streakCelebrationLabel {
          0% { opacity: 0; letter-spacing: 0.44em; }
          100% { opacity: 1; letter-spacing: 0.24em; }
        }
        @keyframes streakCelebrationMessage {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes streakCelebrationReward {
          0% { opacity: 0; transform: translateY(18px) scale(0.92); }
          70% { opacity: 1; transform: translateY(-3px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes streakCelebrationButton {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="absolute inset-0" style={{ background: "#05060a" }} />
      <div className="absolute inset-0" style={{ background: backgroundTint }} />
      <div className="absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 1 }} />
      <div
        className="absolute left-1/2 top-[38%] rounded-full blur-[140px]"
        style={{
          width: isLegendary ? 760 : isMilestone ? 680 : 600,
          height: isLegendary ? 760 : isMilestone ? 680 : 600,
          background: `radial-gradient(circle, ${withAlpha(tier.core, isLegendary ? 0.38 : 0.3)} 0%, ${withAlpha(tier.accent, isLegendary ? 0.26 : 0.18)} 36%, transparent 72%)`,
          transform: "translate(-50%, -50%)",
          opacity: allowEntranceMotion ? 0 : 1,
          animation: allowEntranceMotion ? "streakCelebrationIgnite 0.78s cubic-bezier(0.22, 1, 0.36, 1) 0.9s both" : undefined,
        }}
      />
      {isMilestone ? (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 38%, ${withAlpha("#fff7d6", isLegendary ? 0.28 : 0.18)} 0%, ${withAlpha(tier.accent, 0.12)} 22%, transparent 54%)`,
            opacity: 0,
            animation: allowEntranceMotion ? "streakCelebrationFlash 0.44s ease-out 0.94s both" : undefined,
          }}
        />
      ) : null}

      <div className="relative flex min-h-screen flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:px-10">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <StreakCelebrationFlame
            streak={streak}
            size={flameSize}
            allowEntranceMotion={allowEntranceMotion}
            allowIdleMotion={allowIdleMotion}
            reducedMotion={prefersReducedMotion}
            emphasizeMilestone={isMilestone}
          />

          <div className="mt-4 flex flex-col items-center">
            <div
              className="font-black leading-none text-white drop-shadow-[0_18px_40px_rgba(0,0,0,0.46)]"
              style={{
                fontSize: getNumberSize(streak),
                animation: contentDelayStyles.number,
              }}
            >
              {streakCount.toLocaleString()}
            </div>
            <div
              className="mt-1 text-[1rem] font-black uppercase text-white/84 sm:text-[1.12rem]"
              style={{
                letterSpacing: "0.24em",
                animation: contentDelayStyles.label,
              }}
            >
              DAY STREAK
            </div>
            <p
              className="mt-5 max-w-2xl text-balance text-lg font-semibold leading-8 text-white/72 sm:text-xl"
              style={{ animation: contentDelayStyles.message }}
            >
              {message}
            </p>

            {reward ? (
              <div className="mt-7 flex flex-col items-center gap-3" style={{ animation: contentDelayStyles.reward }}>
                <div
                  className="inline-flex items-center gap-3 rounded-full px-5 py-3 text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
                  style={{
                    background: `linear-gradient(135deg, ${withAlpha(tier.accent, 0.24)} 0%, ${withAlpha(pathTheme.surfaceCard, 0.9)} 100%)`,
                    border: `1px solid ${withAlpha(tier.accent, 0.24)}`,
                  }}
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      background: withAlpha(tier.accent, 0.16),
                      color: tier.core,
                      boxShadow: `0 0 0 1px ${withAlpha(tier.accent, 0.18)} inset`,
                    }}
                  >
                    <GemIcon />
                  </span>
                  <span className="text-2xl font-black text-white">
                    +{gemCount.toLocaleString()} gems
                  </span>
                </div>
                {reward.titleBadgeId ? (
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/64">
                    Streak Lord title unlocked
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-3 pt-6">
          {reward?.shareText ? (
            <button
              type="button"
              onClick={() => void handleShare()}
              className="w-full rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.2em] transition hover:bg-white/8"
              style={{
                borderColor: withAlpha("#ffffff", 0.12),
                color: copied ? tier.core : withAlpha("#ffffff", 0.82),
                animation: contentDelayStyles.share,
              }}
            >
              {copied ? "Copied" : "Share My Streak"}
            </button>
          ) : null}
          <button
            ref={buttonRef}
            type="button"
            onClick={onContinue}
            className="w-full rounded-full px-6 py-4 text-base font-black uppercase tracking-[0.24em] text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-4"
            style={{
              background: tier.gradient,
              boxShadow: `0 24px 60px ${withAlpha(tier.accent, 0.36)}`,
              animation: contentDelayStyles.button,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
