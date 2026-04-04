"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useMotionAllowed } from "@/lib/motion";

type MythicThemeId = "celestial" | "the_void";

type MythicThemeLayerProps = {
  themeId: MythicThemeId;
  preview?: boolean;
  className?: string;
  auroraBurstKey?: number;
  voidFlashKey?: number;
};

function buildField(count: number, seed: number) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${seed}-${index}`,
    left: ((index * 53 + seed * 7) % 100) + (index % 3) * 0.35,
    top: ((index * 31 + seed * 11) % 100) + (index % 4) * 0.24,
    size: 1 + ((index + seed) % 4),
    opacity: 0.22 + ((index + seed) % 5) * 0.14,
    delay: (index * 0.27) % 3.2,
    duration: 7 + ((index + seed) % 5) * 1.8,
  }));
}

function CelestialLayer({
  preview = false,
  auroraBurstKey = 0,
}: {
  preview?: boolean;
  auroraBurstKey?: number;
}) {
  const motionAllowed = useMotionAllowed();
  const [shootingStarToken, setShootingStarToken] = useState(0);
  const [auroraBurst, setAuroraBurst] = useState(false);

  const backStars = useMemo(() => buildField(preview ? 18 : 30, 1), [preview]);
  const midStars = useMemo(() => buildField(preview ? 14 : 24, 2), [preview]);
  const frontStars = useMemo(() => buildField(preview ? 10 : 18, 3), [preview]);

  useEffect(() => {
    if (!motionAllowed || preview) return undefined;

    let timeoutId = 0;
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        setShootingStarToken((value) => value + 1);
        schedule();
      }, 8_000 + Math.random() * 4_000);
    };

    schedule();
    return () => window.clearTimeout(timeoutId);
  }, [motionAllowed, preview]);

  useEffect(() => {
    if (!auroraBurstKey) return undefined;
    const startId = window.setTimeout(() => setAuroraBurst(true), 0);
    const timeoutId = window.setTimeout(() => setAuroraBurst(false), 2_000);
    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(timeoutId);
    };
  }, [auroraBurstKey]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes celestialStarDriftSlow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(8px, -14px, 0) scale(1.08); }
        }
        @keyframes celestialStarDriftMid {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(14px, -18px, 0); }
        }
        @keyframes celestialStarTwinkle {
          0%, 100% { opacity: 0.22; transform: scale(0.82); }
          45% { opacity: 0.9; transform: scale(1.08); }
          75% { opacity: 0.42; transform: scale(0.94); }
        }
        @keyframes celestialNebulaBreath {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.44; }
          50% { transform: translate3d(16px, -10px, 0) scale(1.12); opacity: 0.72; }
        }
        @keyframes celestialAuroraWave {
          0%, 100% { transform: translate3d(-4%, 0, 0) scaleX(1); }
          50% { transform: translate3d(4%, 0, 0) scaleX(1.08); }
        }
        @keyframes celestialPlanetDrift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(14px, -6px, 0); }
        }
        @keyframes celestialShootingStar {
          0% { transform: translate3d(-18vw, -8vh, 0) rotate(-18deg) scaleX(0.4); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate3d(112vw, 52vh, 0) rotate(-18deg) scaleX(1); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020617_0%,#040c1d_48%,#020617_100%)]" />

      {[
        "radial-gradient(circle at 18% 22%, rgba(139,92,246,0.36), transparent 30%)",
        "radial-gradient(circle at 78% 18%, rgba(34,211,238,0.28), transparent 28%)",
        "radial-gradient(circle at 64% 62%, rgba(99,102,241,0.26), transparent 34%)",
        "radial-gradient(circle at 34% 72%, rgba(45,212,191,0.22), transparent 30%)",
      ].map((background, index) => (
        <div
          key={background}
          className="absolute inset-0 blur-3xl"
          style={{
            background,
            opacity: preview ? 0.36 : 0.56,
            animation: motionAllowed ? `celestialNebulaBreath ${12 + index * 2.4}s ease-in-out ${index * 0.8}s infinite` : "none",
          }}
        />
      ))}

      {[0, 1, 2].map((index) => (
        <div
          key={`aurora-${index}`}
          className="absolute left-[-8%] right-[-8%] top-[6%] h-[28%] blur-3xl"
          style={{
            background:
              index === 0
                ? "linear-gradient(90deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.22) 24%, rgba(16,185,129,0.18) 56%, rgba(34,211,238,0) 100%)"
                : index === 1
                  ? "linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(168,85,247,0.18) 30%, rgba(45,212,191,0.14) 62%, rgba(168,85,247,0) 100%)"
                  : "linear-gradient(90deg, rgba(94,234,212,0) 0%, rgba(94,234,212,0.16) 26%, rgba(139,92,246,0.14) 70%, rgba(94,234,212,0) 100%)",
            opacity: auroraBurst ? 0.42 : preview ? 0.12 : 0.2,
            animation: motionAllowed ? `celestialAuroraWave ${10 + index * 1.8}s ease-in-out ${index * 0.9}s infinite` : "none",
          }}
        />
      ))}

      {[
        { left: "12%", top: "68%", size: preview ? 56 : 84, color: "rgba(30,64,175,0.2)" },
        { left: "76%", top: "58%", size: preview ? 44 : 68, color: "rgba(14,165,233,0.18)" },
        { left: "62%", top: "16%", size: preview ? 36 : 54, color: "rgba(168,85,247,0.16)" },
      ].map((planet, index) => (
        <span
          key={`planet-${index}`}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: planet.left,
            top: planet.top,
            width: planet.size,
            height: planet.size,
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.12), ${planet.color} 52%, transparent 70%)`,
            opacity: preview ? 0.34 : 0.46,
            animation: motionAllowed ? `celestialPlanetDrift ${24 + index * 5}s ease-in-out ${index * 1.4}s infinite` : "none",
          }}
        />
      ))}

      {[backStars, midStars, frontStars].map((field, layerIndex) => (
        <div key={`field-${layerIndex}`} className="absolute inset-0">
          {field.map((star, index) => (
            <span
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity * (layerIndex === 0 ? 0.66 : layerIndex === 1 ? 0.82 : 1),
                boxShadow: layerIndex === 2 ? "0 0 14px rgba(255,255,255,0.72)" : "0 0 8px rgba(255,255,255,0.45)",
                animation: motionAllowed
                  ? `${layerIndex === 0 ? "celestialStarDriftSlow" : "celestialStarDriftMid"} ${star.duration + layerIndex * 2.2}s linear ${star.delay}s infinite, celestialStarTwinkle ${2.8 + (index % 6) * 0.45}s ease-in-out ${star.delay}s infinite`
                  : "none",
              }}
            />
          ))}
        </div>
      ))}

      {!preview && shootingStarToken > 0 ? (
        <span
          key={`shooting-${shootingStarToken}`}
          className="absolute left-[-12vw] top-[18%] h-[2px] w-[20vw] rounded-full"
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 45%, rgba(255,255,255,0))",
            boxShadow: "0 0 18px rgba(255,255,255,0.72)",
            animation: motionAllowed ? "celestialShootingStar 1400ms ease-out forwards" : "none",
          }}
        />
      ) : null}
    </div>
  );
}

function VoidLayer({
  preview = false,
  voidFlashKey = 0,
}: {
  preview?: boolean;
  voidFlashKey?: number;
}) {
  const motionAllowed = useMotionAllowed();
  const [flashActive, setFlashActive] = useState(false);
  const cracks = useMemo(() => buildField(preview ? 4 : 8, 7), [preview]);
  const dust = useMemo(() => buildField(preview ? 10 : 18, 9), [preview]);

  useEffect(() => {
    if (!voidFlashKey) return undefined;
    const startId = window.setTimeout(() => setFlashActive(true), 0);
    const timeoutId = window.setTimeout(() => setFlashActive(false), 80);
    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(timeoutId);
    };
  }, [voidFlashKey]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes voidPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.18; }
        }
        @keyframes voidHeartbeat {
          0%, 44%, 100% { opacity: 0.04; }
          48% { opacity: 0.14; }
          52% { opacity: 0.06; }
          56% { opacity: 0.12; }
        }
        @keyframes voidCrackDrift {
          0% { transform: translate3d(-10px, 4px, 0) rotate(var(--void-rotation)); opacity: 0; }
          20% { opacity: 0.32; }
          100% { transform: translate3d(16px, -8px, 0) rotate(var(--void-rotation)); opacity: 0; }
        }
        @keyframes voidDustFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.02; }
          50% { transform: translate3d(10px, -12px, 0); opacity: 0.08; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: preview ? 0.04 : 0.08,
          animation: motionAllowed ? "voidHeartbeat 4s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(102,16,242,0.08), transparent 34%)",
          opacity: preview ? 0.18 : 0.26,
          animation: motionAllowed ? "voidPulse 4s ease-in-out infinite" : "none",
        }}
      />

      {cracks.map((crack, index) => (
        <span
          key={crack.id}
          className="absolute"
          style={{
            left: `${crack.left}%`,
            top: `${crack.top}%`,
            width: preview ? 64 : 110,
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.72) 48%, transparent 100%)",
            opacity: preview ? 0.16 : 0.26,
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.22))",
            "--void-rotation": `${-36 + index * 14}deg`,
            animation: motionAllowed ? `voidCrackDrift ${7 + (index % 3) * 1.6}s linear ${index * 0.5}s infinite` : "none",
          } as CSSProperties}
        />
      ))}

      {dust.map((particle, index) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: preview ? 1 : 2,
            height: preview ? 1 : 2,
            opacity: preview ? 0.03 : 0.05,
            animation: motionAllowed ? `voidDustFloat ${8 + (index % 4) * 1.8}s ease-in-out ${index * 0.25}s infinite` : "none",
          }}
        />
      ))}

      {flashActive ? (
        <div className="absolute inset-0 bg-white" style={{ opacity: preview ? 0.08 : 0.14 }} />
      ) : null}
    </div>
  );
}

export default function MythicThemeLayer({
  themeId,
  preview = false,
  className = "",
  auroraBurstKey = 0,
  voidFlashKey = 0,
}: MythicThemeLayerProps) {
  if (themeId === "celestial") {
    return <div className={`pointer-events-none absolute inset-0 ${className}`}><CelestialLayer preview={preview} auroraBurstKey={auroraBurstKey} /></div>;
  }

  return <div className={`pointer-events-none absolute inset-0 ${className}`}><VoidLayer preview={preview} voidFlashKey={voidFlashKey} /></div>;
}
