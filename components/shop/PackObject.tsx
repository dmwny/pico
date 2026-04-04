"use client";

import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PackId } from "@/lib/cosmetics";
import { useMotionAllowed } from "@/lib/motion";

type PackObjectProps = {
  packId: PackId;
  className?: string;
  presentation?: "shop" | "opening";
  interactive?: boolean;
};

type PointerState = {
  x: number;
  y: number;
};

function usePointerState(enabled: boolean) {
  const [pointer, setPointer] = useState<PointerState>({ x: 0.5, y: 0.5 });

  const bind = enabled
    ? {
        onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setPointer({
            x: (event.clientX - bounds.left) / bounds.width,
            y: (event.clientY - bounds.top) / bounds.height,
          });
        },
        onPointerLeave: () => setPointer({ x: 0.5, y: 0.5 }),
      }
    : {};

  return { pointer, bind };
}

function Emblem({ packId }: { packId: PackId }) {
  if (packId === "basic_pack") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="rgba(255,255,255,0.14)" />
        <path d="M22 20H36C44 20 48 24 48 31C48 36 45 39 40 40L48 50H38L31 42H28V50H20V20H22Z" fill="white" opacity="0.88" />
        <path d="M28 27V35H35C38.3 35 40 33.6 40 31.1C40 28.5 38.2 27 35 27H28Z" fill="rgba(15,23,42,0.38)" />
      </svg>
    );
  }

  if (packId === "premium_pack") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
        <path d="M17 18H47L56 30L32 56L8 30L17 18Z" fill="rgba(255,255,255,0.16)" />
        <path d="M17 18H47L56 30L32 56L8 30L17 18Z" stroke="rgba(255,255,255,0.7)" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M22 20L32 33L42 20" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M11 30H53" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (packId === "legendary_pack") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
        <path d="M17 44L12 23L21 28L27 17L32 25L37 17L43 28L52 23L47 44H17Z" fill="rgba(255,255,255,0.16)" />
        <path d="M17 44L12 23L21 28L27 17L32 25L37 17L43 28L52 23L47 44H17Z" stroke="rgba(255,255,255,0.78)" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M22 44H42" stroke="rgba(255,255,255,0.84)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="18" fill="rgba(255,255,255,0.12)" />
      <circle cx="32" cy="32" r="23.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" />
      <path d="M18 32H46" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 18V46" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="6.5" fill="rgba(255,255,255,0.86)" />
    </svg>
  );
}

export default function PackObject({
  packId,
  className = "",
  presentation = "shop",
  interactive = true,
}: PackObjectProps) {
  const motionAllowed = useMotionAllowed();
  const { pointer, bind } = usePointerState(interactive && (packId === "premium_pack" || packId === "mythic_pack"));
  const [mythicSurge, setMythicSurge] = useState(false);

  useEffect(() => {
    if (packId !== "mythic_pack" || !motionAllowed) return undefined;

    let active = true;
    let timeoutId = 0;

    const schedule = () => {
      const nextDelay = 6_000 + Math.random() * 3_000;
      timeoutId = window.setTimeout(() => {
        if (!active) return;
        setMythicSurge(true);
        window.setTimeout(() => {
          if (!active) return;
          setMythicSurge(false);
        }, 460);
        schedule();
      }, nextDelay);
    };

    schedule();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [motionAllowed, packId]);

  const shimmerX = `${pointer.x * 100}%`;
  const shimmerY = `${pointer.y * 100}%`;
  const showFloat = presentation === "opening";

  const idleAnimation =
    packId === "basic_pack"
      ? showFloat && motionAllowed
        ? "shopPackFloat 4.4s ease-in-out infinite"
        : "none"
      : packId === "premium_pack"
        ? motionAllowed
          ? `${showFloat ? "shopPackFloat 4.6s ease-in-out infinite, " : ""}shopPremiumRoll 7.2s ease-in-out infinite`
          : "none"
        : packId === "legendary_pack"
          ? motionAllowed
            ? `${showFloat ? "shopPackFloat 5.2s ease-in-out infinite, " : ""}shopLegendarySway 4.8s ease-in-out infinite`
            : "none"
          : motionAllowed
            ? `${showFloat ? "shopPackFloat 5.8s ease-in-out infinite, " : ""}shopMythicDrift 10s ease-in-out infinite`
            : "none";

  const shadow =
    packId === "basic_pack"
      ? "0 36px 60px rgba(15,23,42,0.18)"
      : packId === "premium_pack"
        ? "0 42px 70px rgba(76, 29, 149, 0.24)"
        : packId === "legendary_pack"
          ? "0 42px 74px rgba(180, 83, 9, 0.24)"
          : "0 42px 74px rgba(59, 10, 92, 0.32)";

  return (
    <div
      className={`relative aspect-[3/4] w-full max-w-[12rem] select-none ${className}`}
      {...bind}
    >
      <style>{`
        @keyframes shopPackFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shopPremiumRoll {
          0%, 100% { transform: perspective(900px) rotateX(1deg) rotateY(-3deg); }
          50% { transform: perspective(900px) rotateX(-2deg) rotateY(4deg); }
        }
        @keyframes shopLegendarySway {
          0%, 100% { transform: rotate(-1.6deg) translateY(0); }
          50% { transform: rotate(1.6deg) translateY(2px); }
        }
        @keyframes shopLegendaryGlow {
          0%, 100% { opacity: 0.34; transform: scale(1); }
          50% { opacity: 0.56; transform: scale(1.05); }
        }
        @keyframes shopMythicDrift {
          0% { transform: perspective(900px) rotateX(1deg) rotateY(-4deg) rotateZ(-0.5deg); }
          34% { transform: perspective(900px) rotateX(-1deg) rotateY(3deg) rotateZ(0.4deg); }
          72% { transform: perspective(900px) rotateX(1.5deg) rotateY(-2deg) rotateZ(-0.2deg); }
          100% { transform: perspective(900px) rotateX(1deg) rotateY(-4deg) rotateZ(-0.5deg); }
        }
        @keyframes shopGoldDust {
          0% { transform: translate3d(0, -10px, 0) scale(0.8); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: translate3d(0, 16px, 0) scale(1); opacity: 0; }
        }
        @keyframes shopMythicEdge {
          0%, 100% { opacity: 0.28; filter: blur(10px); }
          50% { opacity: 0.48; filter: blur(14px); }
        }
      `}</style>

      <div className="absolute inset-x-[12%] bottom-2 h-6 rounded-full bg-black/45 blur-2xl" />

      {packId === "legendary_pack" ? (
        <div className="pointer-events-none absolute inset-[-12%]">
          <span
            className="absolute inset-[18%] rounded-[2rem] blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 68%)", animation: motionAllowed ? "shopLegendaryGlow 3.8s ease-in-out infinite" : "none" }}
          />
          {motionAllowed ? Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-amber-200"
              style={{
                left: `${18 + index * 11}%`,
                top: `${16 + (index % 3) * 10}%`,
                boxShadow: "0 0 12px rgba(253,230,138,0.9)",
                animation: `shopGoldDust ${2.8 + index * 0.35}s linear ${index * 0.3}s infinite`,
              }}
            />
          )) : null}
        </div>
      ) : null}

      {packId === "mythic_pack" ? (
        <div className="pointer-events-none absolute inset-[-8%]">
          <span
            className="absolute inset-0 rounded-[2rem]"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.18), transparent 56%)",
              animation: motionAllowed ? "shopMythicEdge 4.6s ease-in-out infinite" : "none",
            }}
          />
        </div>
      ) : null}

      <div
        className="relative h-full w-full"
        style={{
          animation: idleAnimation,
          transformStyle: "preserve-3d",
          willChange: motionAllowed && packId !== "basic_pack" ? "transform" : undefined,
        }}
      >
        <svg viewBox="0 0 180 240" className="h-full w-full overflow-visible" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`pack-base-${packId}`} x1="18" y1="20" x2="160" y2="220" gradientUnits="userSpaceOnUse">
              {packId === "basic_pack" ? (
                <>
                  <stop offset="0%" stopColor="#E2E8F0" />
                  <stop offset="45%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </>
              ) : packId === "premium_pack" ? (
                <>
                  <stop offset="0%" stopColor="#312E81" />
                  <stop offset="50%" stopColor="#1D4ED8" />
                  <stop offset="100%" stopColor="#1E1B4B" />
                </>
              ) : packId === "legendary_pack" ? (
                <>
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="32%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1E0B2F" />
                  <stop offset="42%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#05030F" />
                </>
              )}
            </linearGradient>
            <linearGradient id={`pack-sheen-${packId}`} x1="0" y1="0" x2="180" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="28%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
          </defs>

          <path
            d="M34 14H146C154 14 160 20 161 28L170 74L155 221C154 230 147 236 138 236H42C33 236 26 230 25 221L10 74L19 28C20 20 26 14 34 14Z"
            fill={`url(#pack-base-${packId})`}
            stroke={packId === "basic_pack" ? "#F8FAFC" : packId === "premium_pack" ? "#C4B5FD" : packId === "legendary_pack" ? "#FDE68A" : "#E879F9"}
            strokeWidth="3"
          />
          <path d="M26 40H154" stroke="rgba(255,255,255,0.26)" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 198H158" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 32L34 18L44 32L54 18L64 32L74 18L84 32L94 18L104 32L114 18L124 32L134 18L144 32L154 18" stroke="rgba(255,255,255,0.2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 214L32 228L44 214L56 228L68 214L80 228L92 214L104 228L116 214L128 228L140 214L152 228L164 214" stroke="rgba(255,255,255,0.16)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {packId === "basic_pack" ? (
            <>
              <path d="M34 78C48 72 52 88 64 82C76 76 84 92 98 84C112 76 122 92 138 84" stroke="rgba(255,255,255,0.16)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M32 154C48 146 56 162 72 156C88 150 100 166 118 160C132 154 138 164 144 160" stroke="rgba(255,255,255,0.14)" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : null}

          {packId === "legendary_pack" ? (
            <>
              {Array.from({ length: 10 }).map((_, index) => (
                <circle
                  key={index}
                  cx={34 + (index % 5) * 28}
                  cy={58 + Math.floor(index / 5) * 94}
                  r={12 + (index % 2) * 3}
                  fill="rgba(255,255,255,0.05)"
                />
              ))}
            </>
          ) : null}

          {packId === "mythic_pack" ? (
            <>
              {[
                "M42 58C56 76 54 102 66 118",
                "M118 46C104 72 108 108 96 136",
                "M72 144C88 158 92 184 108 196",
              ].map((path) => (
                <path
                  key={path}
                  d={path}
                  stroke="rgba(255,255,255,0.78)"
                  strokeWidth={mythicSurge ? 4.2 : 2.6}
                  strokeLinecap="round"
                  filter={mythicSurge ? "drop-shadow(0 0 14px rgba(255,255,255,0.88))" : "drop-shadow(0 0 8px rgba(255,255,255,0.32))"}
                  opacity={mythicSurge ? 0.95 : 0.56}
                />
              ))}
            </>
          ) : null}
        </svg>

        <div
          className="absolute inset-[10%] rounded-[1.5rem] border border-white/10"
          style={{
            boxShadow: shadow,
            background:
              packId === "premium_pack"
                ? `radial-gradient(circle at ${shimmerX} ${shimmerY}, rgba(255,255,255,0.28), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.06), transparent 58%)`
                : packId === "mythic_pack"
                  ? `radial-gradient(circle at ${shimmerX} ${shimmerY}, rgba(255,255,255,0.16), transparent 34%), radial-gradient(circle at 30% 24%, rgba(236,72,153,0.12), transparent 30%), radial-gradient(circle at 74% 70%, rgba(34,211,238,0.12), transparent 28%)`
                  : "transparent",
          }}
        >
          <div className="absolute inset-x-0 top-[18%] flex justify-center">
            <Emblem packId={packId} />
          </div>
          <div className="absolute inset-x-0 bottom-[20%] text-center">
            <p
              className="text-[0.66rem] font-black uppercase tracking-[0.34em] text-white/70"
              style={{
                textShadow: packId === "legendary_pack" ? "0 0 14px rgba(254,240,138,0.45)" : packId === "mythic_pack" ? "0 0 16px rgba(236,72,153,0.3)" : undefined,
              }}
            >
              {packId === "basic_pack" ? "Basic Pack" : packId === "premium_pack" ? "Premium Pack" : packId === "legendary_pack" ? "Legendary Pack" : "Mythic Pack"}
            </p>
            <p className="mt-2 text-[0.78rem] font-black uppercase tracking-[0.3em] text-white/34">Pico</p>
          </div>
        </div>
      </div>
    </div>
  );
}
