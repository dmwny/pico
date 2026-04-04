"use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import { withAlpha } from "@/lib/themes";

type StreakCelebrationFlameProps = {
  streak: number;
  size: number;
  allowEntranceMotion: boolean;
  allowIdleMotion: boolean;
  reducedMotion: boolean;
  emphasizeMilestone?: boolean;
};

type EmberSpec = {
  id: string;
  left: string;
  size: number;
  delayMs: number;
  durationMs: number;
  animationName: string;
  color: "outer" | "mid" | "core";
};

type BurstSpec = {
  id: string;
  tx: number;
  ty: number;
  size: number;
  delayMs: number;
  durationMs: number;
  color: "outer" | "mid" | "core";
};

type CelebrationPalette = {
  outer: string;
  mid: string;
  core: string;
  glow: string;
  bloom: string;
  orbit: string;
};

const EMBERS: EmberSpec[] = [
  { id: "ember-0", left: "12%", size: 4, delayMs: 0, durationMs: 1900, animationName: "streakCelebrationEmber0", color: "mid" },
  { id: "ember-1", left: "20%", size: 3, delayMs: 220, durationMs: 2400, animationName: "streakCelebrationEmber1", color: "outer" },
  { id: "ember-2", left: "28%", size: 5, delayMs: 480, durationMs: 2800, animationName: "streakCelebrationEmber2", color: "core" },
  { id: "ember-3", left: "36%", size: 2, delayMs: 760, durationMs: 2100, animationName: "streakCelebrationEmber3", color: "mid" },
  { id: "ember-4", left: "45%", size: 4, delayMs: 930, durationMs: 3200, animationName: "streakCelebrationEmber4", color: "outer" },
  { id: "ember-5", left: "54%", size: 3, delayMs: 1180, durationMs: 2300, animationName: "streakCelebrationEmber5", color: "core" },
  { id: "ember-6", left: "62%", size: 5, delayMs: 1350, durationMs: 3000, animationName: "streakCelebrationEmber6", color: "mid" },
  { id: "ember-7", left: "71%", size: 2, delayMs: 540, durationMs: 1800, animationName: "streakCelebrationEmber7", color: "outer" },
  { id: "ember-8", left: "80%", size: 4, delayMs: 1420, durationMs: 2600, animationName: "streakCelebrationEmber8", color: "core" },
  { id: "ember-9", left: "88%", size: 3, delayMs: 1080, durationMs: 2050, animationName: "streakCelebrationEmber9", color: "mid" },
];

const BURSTS: BurstSpec[] = [
  { id: "burst-0", tx: -118, ty: -42, size: 8, delayMs: 940, durationMs: 740, color: "core" },
  { id: "burst-1", tx: -98, ty: -98, size: 6, delayMs: 950, durationMs: 760, color: "mid" },
  { id: "burst-2", tx: -46, ty: -124, size: 7, delayMs: 920, durationMs: 700, color: "core" },
  { id: "burst-3", tx: 0, ty: -140, size: 6, delayMs: 930, durationMs: 760, color: "outer" },
  { id: "burst-4", tx: 48, ty: -124, size: 7, delayMs: 935, durationMs: 720, color: "core" },
  { id: "burst-5", tx: 96, ty: -92, size: 6, delayMs: 948, durationMs: 760, color: "mid" },
  { id: "burst-6", tx: 122, ty: -38, size: 8, delayMs: 952, durationMs: 740, color: "outer" },
  { id: "burst-7", tx: 98, ty: 12, size: 6, delayMs: 970, durationMs: 720, color: "core" },
  { id: "burst-8", tx: 44, ty: 32, size: 7, delayMs: 960, durationMs: 680, color: "mid" },
  { id: "burst-9", tx: -44, ty: 30, size: 7, delayMs: 968, durationMs: 680, color: "outer" },
  { id: "burst-10", tx: -100, ty: 8, size: 6, delayMs: 955, durationMs: 720, color: "core" },
  { id: "burst-11", tx: 0, ty: -92, size: 10, delayMs: 990, durationMs: 820, color: "core" },
];

function getCelebrationPalette(streak: number): CelebrationPalette {
  if (streak >= 100) {
    return {
      outer: "#FF5F6D",
      mid: "#FFD166",
      core: "#FFFACD",
      glow: withAlpha("#f59e0b", 0.72),
      bloom: "conic-gradient(from 0deg, rgba(255,95,109,0.86), rgba(255,209,102,0.86), rgba(56,189,248,0.82), rgba(192,132,252,0.84), rgba(255,95,109,0.86))",
      orbit: "conic-gradient(from 0deg, #fb7185, #f59e0b, #fde047, #34d399, #60a5fa, #c084fc, #fb7185)",
    };
  }

  if (streak >= 50) {
    return {
      outer: "#DAA520",
      mid: "#FFD700",
      core: "#FFFACD",
      glow: withAlpha("#facc15", 0.62),
      bloom: `radial-gradient(circle, ${withAlpha("#FFD700", 0.74)} 0%, ${withAlpha("#DAA520", 0.5)} 42%, transparent 74%)`,
      orbit: "conic-gradient(from 0deg, #facc15, #f59e0b, #fcd34d, #facc15)",
    };
  }

  if (streak >= 30) {
    return {
      outer: "#CC0000",
      mid: "#FF4500",
      core: "#FF8C00",
      glow: withAlpha("#ef4444", 0.6),
      bloom: `radial-gradient(circle, ${withAlpha("#FF8C00", 0.72)} 0%, ${withAlpha("#CC0000", 0.46)} 44%, transparent 74%)`,
      orbit: "conic-gradient(from 0deg, #f97316, #ef4444, #f59e0b, #f97316)",
    };
  }

  if (streak >= 14) {
    return {
      outer: "#FF4500",
      mid: "#FF6B00",
      core: "#FFA500",
      glow: withAlpha("#f97316", 0.58),
      bloom: `radial-gradient(circle, ${withAlpha("#FFA500", 0.68)} 0%, ${withAlpha("#FF4500", 0.42)} 44%, transparent 72%)`,
      orbit: "conic-gradient(from 0deg, #ff6b00, #ffa500, #fb923c, #ff6b00)",
    };
  }

  if (streak >= 7) {
    return {
      outer: "#FF6B00",
      mid: "#FF8C00",
      core: "#FFD700",
      glow: withAlpha("#fb923c", 0.56),
      bloom: `radial-gradient(circle, ${withAlpha("#FFD700", 0.6)} 0%, ${withAlpha("#FF6B00", 0.38)} 42%, transparent 72%)`,
      orbit: "conic-gradient(from 0deg, #ff8c00, #ffd700, #fb923c, #ff8c00)",
    };
  }

  if (streak <= 0) {
    return {
      outer: "#64748b",
      mid: "#94a3b8",
      core: "#cbd5e1",
      glow: withAlpha("#94a3b8", 0.36),
      bloom: `radial-gradient(circle, ${withAlpha("#cbd5e1", 0.34)} 0%, ${withAlpha("#64748b", 0.2)} 40%, transparent 72%)`,
      orbit: "conic-gradient(from 0deg, #94a3b8, #64748b, #cbd5e1, #94a3b8)",
    };
  }

  return {
    outer: "#FF8C00",
    mid: "#FFA500",
    core: "#FFD700",
    glow: withAlpha("#fb923c", 0.54),
    bloom: `radial-gradient(circle, ${withAlpha("#FFD700", 0.58)} 0%, ${withAlpha("#FF8C00", 0.36)} 42%, transparent 72%)`,
    orbit: "conic-gradient(from 0deg, #ffa500, #ffd700, #ff8c00, #ffa500)",
  };
}

function getParticleColor(palette: CelebrationPalette, color: BurstSpec["color"] | EmberSpec["color"]) {
  if (color === "core") return palette.core;
  if (color === "mid") return palette.mid;
  return palette.outer;
}

export default function StreakCelebrationFlame({
  streak,
  size,
  allowEntranceMotion,
  allowIdleMotion,
  reducedMotion,
  emphasizeMilestone = false,
}: StreakCelebrationFlameProps) {
  const gradientId = useId();
  const palette = getCelebrationPalette(streak);
  const stageHeight = Math.round(size * 1.08);
  const flameWidth = Math.round(size * (streak >= 100 ? 0.82 : emphasizeMilestone ? 0.78 : 0.72));
  const flameHeight = Math.round(size * (streak >= 100 ? 1.02 : 0.96));
  const shockwaveSize = Math.round(flameWidth * (emphasizeMilestone ? 2.2 : 2.02));
  const showOrbit = streak >= 100;
  const showEmbers = allowIdleMotion && !reducedMotion;
  const showBurst = emphasizeMilestone && allowEntranceMotion;

  const outerGradientId = `${gradientId}-outer`;
  const midGradientId = `${gradientId}-mid`;
  const coreGradientId = `${gradientId}-core`;

  return (
    <div
      className="relative"
      style={{ width: size, height: stageHeight }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes streakCelebrationDrop {
          0% { transform: translate3d(0, -118vh, 0) scale(0.82); }
          58% { transform: translate3d(0, 26px, 0) scale(1.04); }
          78% { transform: translate3d(0, -12px, 0) scale(0.98); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes streakCelebrationGlow {
          0%, 100% { opacity: 0.42; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 0.72; transform: translate(-50%, -50%) scale(1.06); }
        }
        @keyframes streakCelebrationOuterSway {
          0% { transform: rotate(-3deg) scaleY(1.01); }
          100% { transform: rotate(3deg) scaleY(0.98); }
        }
        @keyframes streakCelebrationOuterSwayReduced {
          0% { transform: rotate(-1.2deg); }
          100% { transform: rotate(1.2deg); }
        }
        @keyframes streakCelebrationMidSway {
          0% { transform: rotate(2.5deg) scale(0.97, 1.01); }
          100% { transform: rotate(-2.8deg) scale(1.03, 0.98); }
        }
        @keyframes streakCelebrationCorePulse {
          0%, 100% { transform: scale(0.96); opacity: 0.76; }
          35% { transform: scale(1.04); opacity: 1; }
          65% { transform: scale(0.98); opacity: 0.82; }
        }
        @keyframes streakCelebrationShockwave {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.8; }
          65% { transform: translate(-50%, -50%) scale(1.04); opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes streakCelebrationOrbit {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes streakCelebrationBurst {
          0% { transform: translate3d(0, 0, 0) scale(0.25); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translate3d(var(--burst-x), var(--burst-y), 0) scale(1.08); opacity: 0; }
        }
        @keyframes streakCelebrationEmber0 {
          0% { transform: translate3d(0, 0, 0) scale(0.5); opacity: 0; }
          14% { opacity: 0.8; }
          52% { transform: translate3d(-8px, -44px, 0) scale(1); opacity: 0.72; }
          100% { transform: translate3d(5px, -104px, 0) scale(0.35); opacity: 0; }
        }
        @keyframes streakCelebrationEmber1 {
          0% { transform: translate3d(0, 0, 0) scale(0.48); opacity: 0; }
          16% { opacity: 0.72; }
          56% { transform: translate3d(10px, -60px, 0) scale(0.92); opacity: 0.64; }
          100% { transform: translate3d(-4px, -126px, 0) scale(0.28); opacity: 0; }
        }
        @keyframes streakCelebrationEmber2 {
          0% { transform: translate3d(0, 0, 0) scale(0.46); opacity: 0; }
          12% { opacity: 0.86; }
          48% { transform: translate3d(-11px, -54px, 0) scale(1.08); opacity: 0.82; }
          100% { transform: translate3d(6px, -138px, 0) scale(0.42); opacity: 0; }
        }
        @keyframes streakCelebrationEmber3 {
          0% { transform: translate3d(0, 0, 0) scale(0.42); opacity: 0; }
          18% { opacity: 0.7; }
          50% { transform: translate3d(7px, -42px, 0) scale(0.88); opacity: 0.56; }
          100% { transform: translate3d(-5px, -102px, 0) scale(0.24); opacity: 0; }
        }
        @keyframes streakCelebrationEmber4 {
          0% { transform: translate3d(0, 0, 0) scale(0.44); opacity: 0; }
          12% { opacity: 0.84; }
          54% { transform: translate3d(-9px, -74px, 0) scale(1.02); opacity: 0.78; }
          100% { transform: translate3d(8px, -156px, 0) scale(0.34); opacity: 0; }
        }
        @keyframes streakCelebrationEmber5 {
          0% { transform: translate3d(0, 0, 0) scale(0.45); opacity: 0; }
          16% { opacity: 0.74; }
          58% { transform: translate3d(9px, -54px, 0) scale(0.94); opacity: 0.64; }
          100% { transform: translate3d(-7px, -116px, 0) scale(0.3); opacity: 0; }
        }
        @keyframes streakCelebrationEmber6 {
          0% { transform: translate3d(0, 0, 0) scale(0.48); opacity: 0; }
          12% { opacity: 0.88; }
          46% { transform: translate3d(-10px, -72px, 0) scale(1.04); opacity: 0.84; }
          100% { transform: translate3d(7px, -150px, 0) scale(0.36); opacity: 0; }
        }
        @keyframes streakCelebrationEmber7 {
          0% { transform: translate3d(0, 0, 0) scale(0.42); opacity: 0; }
          18% { opacity: 0.68; }
          52% { transform: translate3d(8px, -38px, 0) scale(0.78); opacity: 0.52; }
          100% { transform: translate3d(-3px, -92px, 0) scale(0.2); opacity: 0; }
        }
        @keyframes streakCelebrationEmber8 {
          0% { transform: translate3d(0, 0, 0) scale(0.5); opacity: 0; }
          16% { opacity: 0.76; }
          50% { transform: translate3d(-7px, -56px, 0) scale(0.92); opacity: 0.68; }
          100% { transform: translate3d(4px, -128px, 0) scale(0.28); opacity: 0; }
        }
        @keyframes streakCelebrationEmber9 {
          0% { transform: translate3d(0, 0, 0) scale(0.44); opacity: 0; }
          15% { opacity: 0.72; }
          60% { transform: translate3d(11px, -48px, 0) scale(0.9); opacity: 0.6; }
          100% { transform: translate3d(-6px, -108px, 0) scale(0.26); opacity: 0; }
        }
      `}</style>

      <div
        className="absolute left-1/2 top-[46%] rounded-full blur-[72px]"
        style={{
          width: size * (showOrbit ? 1.22 : 1.04),
          height: size * (showOrbit ? 1.22 : 1.04),
          background: palette.bloom,
          transform: "translate(-50%, -50%)",
          opacity: reducedMotion ? 0.62 : 0.78,
          animation: allowIdleMotion && !reducedMotion ? "streakCelebrationGlow 3s ease-in-out infinite" : undefined,
        }}
      />

      {showOrbit ? (
        <div
          className="absolute left-1/2 top-[43%] rounded-full"
          style={{
            width: size * 0.92,
            height: size * 0.92,
            transform: "translate(-50%, -50%)",
            border: `1.5px solid ${withAlpha("#ffffff", 0.08)}`,
            boxShadow: `0 0 0 1px ${withAlpha("#ffffff", 0.04)} inset`,
          }}
        >
          <div
            className="absolute inset-[-8px] rounded-full"
            style={{
              background: palette.orbit,
              maskImage: "radial-gradient(circle, transparent 64%, black 67%, black 72%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 64%, black 67%, black 72%, transparent 75%)",
              opacity: 0.78,
              transform: "translate(-50%, -50%)",
              left: "50%",
              top: "50%",
              animation: allowIdleMotion ? "streakCelebrationOrbit 16s linear infinite" : undefined,
            }}
          />
        </div>
      ) : null}

      <div
        className="absolute left-1/2 top-[78%] rounded-full"
        style={{
          width: shockwaveSize,
          height: shockwaveSize,
          border: `2px solid ${withAlpha(palette.outer, 0.92)}`,
          transform: "translate(-50%, -50%) scale(0.2)",
          opacity: 0,
          animation: allowEntranceMotion
            ? "streakCelebrationShockwave 0.3s cubic-bezier(0.18, 0.88, 0.32, 1.16) 0.92s both"
            : undefined,
        }}
      />

      {showBurst ? (
        <div className="pointer-events-none absolute inset-0">
          {BURSTS.map((particle) => (
            <span
              key={particle.id}
              className="absolute left-1/2 top-[54%] rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                background: getParticleColor(palette, particle.color),
                boxShadow: `0 0 16px ${withAlpha(getParticleColor(palette, particle.color), 0.5)}`,
                "--burst-x": `${particle.tx}px`,
                "--burst-y": `${particle.ty}px`,
                animation: `streakCelebrationBurst ${particle.durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${particle.delayMs}ms both`,
              } as CSSProperties}
            />
          ))}
        </div>
      ) : null}

      <div
        className="absolute left-1/2 top-[16%]"
        style={{
          width: flameWidth,
          height: flameHeight,
          marginLeft: -flameWidth / 2,
          animation: allowEntranceMotion
            ? "streakCelebrationDrop 0.72s cubic-bezier(0.22, 1.24, 0.34, 1) 0.2s both"
            : undefined,
        }}
      >
        {showEmbers ? (
          <div className="pointer-events-none absolute inset-x-[8%] bottom-[10%] h-[48%]">
            {EMBERS.map((ember) => {
              const color = getParticleColor(palette, ember.color);
              return (
                <span
                  key={ember.id}
                  className="absolute bottom-0 rounded-full"
                  style={{
                    left: ember.left,
                    width: ember.size,
                    height: ember.size,
                    opacity: 0,
                    background: color,
                    boxShadow: `0 0 12px ${withAlpha(color, 0.42)}`,
                    animation: `${ember.animationName} ${ember.durationMs}ms ease-out ${ember.delayMs}ms infinite`,
                  }}
                />
              );
            })}
          </div>
        ) : null}

        <svg
          viewBox="0 0 220 260"
          className="absolute inset-0 h-full w-full overflow-visible"
          fill="none"
          style={{ filter: `drop-shadow(0 18px 42px ${palette.glow})` }}
        >
          <defs>
            <linearGradient id={outerGradientId} x1="110" y1="18" x2="110" y2="246" gradientUnits="userSpaceOnUse">
              <stop stopColor={showOrbit ? "#ffffff" : palette.core} />
              <stop offset="0.3" stopColor={palette.mid} />
              <stop offset="1" stopColor={palette.outer} />
            </linearGradient>
            <linearGradient id={midGradientId} x1="110" y1="56" x2="110" y2="228" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.core} />
              <stop offset="0.5" stopColor={palette.mid} />
              <stop offset="1" stopColor={palette.outer} />
            </linearGradient>
            <radialGradient id={coreGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(110 158) rotate(90) scale(86 62)">
              <stop stopColor="#fff7d6" />
              <stop offset="0.58" stopColor={palette.core} />
              <stop offset="1" stopColor={withAlpha(palette.mid, 0.9)} />
            </radialGradient>
          </defs>

          <g
            style={{
              transformOrigin: "110px 245px",
              animation: allowIdleMotion
                ? reducedMotion
                  ? "streakCelebrationOuterSwayReduced 4.2s ease-in-out infinite alternate"
                  : "streakCelebrationOuterSway 3s ease-in-out infinite alternate"
                : undefined,
            }}
          >
            <path
              d="M109 18C120 52 160 74 171 122C177 149 173 184 156 213C142 236 121 246 98 246C61 246 36 218 36 182C36 151 50 126 69 106C87 86 100 59 109 18Z"
              fill={`url(#${outerGradientId})`}
            />
          </g>

          <g
            style={{
              transformOrigin: "110px 245px",
              animation: allowIdleMotion && !reducedMotion
                ? "streakCelebrationMidSway 1.2s ease-in-out infinite alternate"
                : undefined,
            }}
          >
            <path
              d="M110 65C121 94 144 111 149 144C154 171 146 195 127 214C115 226 101 231 87 231C58 231 43 207 43 182C43 157 56 138 73 123C90 108 101 95 110 65Z"
              fill={`url(#${midGradientId})`}
            />
          </g>

          <g
            style={{
              transformOrigin: "110px 228px",
              animation: allowIdleMotion && !reducedMotion
                ? "streakCelebrationCorePulse 0.6s ease-in-out infinite"
                : undefined,
            }}
          >
            <path
              d="M110 112C121 131 131 146 131 169C131 188 121 204 105 212C96 216 87 219 79 219C62 219 51 205 51 188C51 169 61 156 75 144C88 133 98 124 110 112Z"
              fill={`url(#${coreGradientId})`}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
