"use client";

import { useId } from "react";
import { useMotionAllowed } from "@/lib/motion";
import { getStreakFlameTier } from "@/lib/streaks";

export function SnowflakeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 2.75V21.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 5.5L12 8.25L16 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18.5L12 15.75L16 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10L8.25 12L5.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 10L15.75 12L18.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M8 4.5H16V8.5C16 10.9853 13.9853 13 11.5 13H12.5C10.0147 13 8 10.9853 8 8.5V4.5Z" fill="currentColor" opacity="0.18" />
      <path d="M8 4.5H16V8.5C16 10.9853 13.9853 13 11.5 13H12.5C10.0147 13 8 10.9853 8 8.5V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 6.5H5.5C5.22386 6.5 5 6.72386 5 7V7.5C5 9.98528 7.01472 12 9.5 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 6.5H18.5C18.7761 6.5 19 6.72386 19 7V7.5C19 9.98528 16.9853 12 14.5 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StreakFlame({
  streak,
  freezeCount = 0,
  size = 20,
  className = "",
  animate = true,
  showFreezeIndicator = true,
}: {
  streak: number;
  freezeCount?: number;
  size?: number;
  className?: string;
  animate?: boolean;
  showFreezeIndicator?: boolean;
}) {
  const gradientId = useId();
  const motionAllowed = useMotionAllowed();
  const tier = getStreakFlameTier(streak);
  const shouldAnimate = animate && motionAllowed;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes streakFlameFlicker {
          0%, 100% { transform: translateY(0) scale(1); filter: saturate(1); }
          30% { transform: translateY(-1px) scale(1.04, 0.98); filter: saturate(1.08); }
          60% { transform: translateY(0.5px) scale(0.98, 1.02); filter: saturate(0.94); }
        }
        @keyframes streakFlameGlow {
          0%, 100% { opacity: 0.46; transform: scale(0.92); }
          50% { opacity: 0.78; transform: scale(1.04); }
        }
      `}</style>

      <span
        className="absolute inset-[6%] rounded-full blur-md"
        style={{
          background: tier.gradient,
          opacity: streak > 0 ? 0.46 : 0.22,
          animation: shouldAnimate ? "streakFlameGlow 2.2s ease-in-out infinite" : undefined,
        }}
      />
      <svg
        viewBox="0 0 24 24"
        className="relative z-[1]"
        style={{
          width: size,
          height: size,
          color: tier.accent,
          filter: `drop-shadow(0 0 10px ${tier.glow})`,
          animation: shouldAnimate ? "streakFlameFlicker 1.8s ease-in-out infinite" : undefined,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor={tier.core} />
            <stop offset="0.58" stopColor={tier.accent} />
            <stop offset="1" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
        <path
          d="M11.772 2.8C12.375 5.315 14.682 6.36 15.894 8.146C17.137 9.977 17.278 12.737 16.03 15.004C14.698 17.422 12.515 19.2 9.942 19.2C6.82 19.2 4.2 16.627 4.2 13.448C4.2 11.151 5.475 9.378 6.938 7.981C8.446 6.542 10.322 5.338 11.772 2.8Z"
          fill={`url(#${gradientId})`}
          stroke={streak > 0 ? tier.core : "#cbd5e1"}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M12.145 9.2C12.496 10.537 13.51 11.188 14.026 12.11C14.561 13.066 14.543 14.392 13.94 15.37C13.241 16.502 12.11 17.2 10.89 17.2C9.297 17.2 8.05 15.932 8.05 14.43C8.05 13.375 8.612 12.523 9.272 11.886C10.008 11.176 10.993 10.56 12.145 9.2Z"
          fill="rgba(255,255,255,0.24)"
        />
      </svg>

      {showFreezeIndicator && freezeCount > 0 ? (
        <span className="absolute -bottom-1 -right-1 rounded-full border border-white/70 bg-sky-50 p-[2px] text-sky-500 shadow-[0_6px_18px_rgba(56,189,248,0.32)]">
          <SnowflakeIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </span>
  );
}
