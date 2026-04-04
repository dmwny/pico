"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AmbientEffect } from "@/lib/themes";

const AMBIENT_EFFECTS_STORAGE_KEY = "pico-ambient-effects:enabled";

function capCount(kind: AmbientEffect["kind"], count: number) {
  if (kind === "fireflies") return Math.min(count, 12);
  if (kind === "rain") return Math.min(count, 30);
  if (kind === "stars") return Math.min(count, 100);
  return Math.min(count, 24);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function useAmbientEffectsPreference() {
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AMBIENT_EFFECTS_STORAGE_KEY);
      if (raw === "false") setEnabled(false);
    } finally {
      setHydrated(true);
    }
  }, []);

  const update = (nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    try {
      window.localStorage.setItem(AMBIENT_EFFECTS_STORAGE_KEY, String(nextEnabled));
    } catch {
      // noop
    }
  };

  return {
    enabled,
    setEnabled: update,
    hydrated,
  };
}

function StaticLayer({ effect }: { effect: AmbientEffect }) {
  switch (effect.kind) {
    case "scanlines":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.12,
            background:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 6px)",
          }}
        />
      );
    case "grid":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.12,
            backgroundImage: `linear-gradient(${effect.color ?? "rgba(255,255,255,0.12)"} 1px, transparent 1px), linear-gradient(90deg, ${effect.color ?? "rgba(255,255,255,0.12)"} 1px, transparent 1px)`,
            backgroundSize: "42px 42px",
          }}
        />
      );
    case "halftone":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.1,
            backgroundImage: `radial-gradient(circle, ${effect.color ?? "rgba(0,0,0,0.12)"} 1px, transparent 1.2px)`,
            backgroundSize: "16px 16px",
          }}
        />
      );
    case "paper-grain":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.08,
            background:
              "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.06), transparent 1.4%), radial-gradient(circle at 72% 36%, rgba(0,0,0,0.05), transparent 1.1%), radial-gradient(circle at 52% 68%, rgba(0,0,0,0.04), transparent 1.2%)",
          }}
        />
      );
    case "map-lines":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.12,
            background:
              `radial-gradient(circle at 18% 28%, ${effect.color ?? "rgba(120,53,15,0.12)"} 0 1px, transparent 1px), linear-gradient(135deg, transparent 0%, transparent 48%, ${effect.color ?? "rgba(120,53,15,0.12)"} 50%, transparent 52%, transparent 100%)`,
            backgroundSize: "32px 32px, 100% 100%",
          }}
        />
      );
    case "light-rays":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.12,
            background:
              `linear-gradient(180deg, ${effect.color ?? "rgba(255,255,255,0.18)"} 0%, transparent 42%), repeating-linear-gradient(112deg, ${effect.color ?? "rgba(255,255,255,0.08)"} 0px, ${effect.color ?? "rgba(255,255,255,0.08)"} 18px, transparent 18px, transparent 82px)`,
          }}
        />
      );
    case "caustics":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.14,
            background:
              "repeating-radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0 3px, transparent 3px 18px)",
            mixBlendMode: "screen",
          }}
        />
      );
    case "heat-haze":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.1,
            background: `linear-gradient(180deg, transparent 0%, ${effect.color ?? "rgba(251,146,60,0.18)"} 100%)`,
            filter: "blur(18px)",
          }}
        />
      );
    case "nebula":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.18,
            background: `radial-gradient(circle at 18% 24%, ${effect.color ?? "rgba(139,92,246,0.22)"}, transparent 24%), radial-gradient(circle at 82% 20%, ${effect.colorSecondary ?? "rgba(34,211,238,0.18)"}, transparent 26%)`,
            mixBlendMode: "screen",
          }}
        />
      );
    case "aurora":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.16,
            background: `linear-gradient(180deg, ${effect.color ?? "rgba(34,211,238,0.18)"} 0%, ${effect.colorSecondary ?? "rgba(52,211,153,0.16)"} 44%, transparent 74%)`,
            filter: "blur(34px)",
          }}
        />
      );
    case "waves":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.16,
            background:
              "repeating-radial-gradient(circle at 50% 110%, rgba(255,255,255,0.1) 0 10px, transparent 10px 28px)",
          }}
        />
      );
    case "constellation-lines":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.1,
            background:
              `linear-gradient(115deg, transparent 0%, transparent 40%, ${effect.color ?? "rgba(191,219,254,0.16)"} 44%, transparent 48%, transparent 100%)`,
          }}
        />
      );
    case "void-cracks":
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: effect.opacity ?? 0.12,
            background:
              "linear-gradient(122deg, transparent 0%, transparent 46%, rgba(255,255,255,0.14) 48%, transparent 50%), linear-gradient(62deg, transparent 0%, transparent 52%, rgba(255,255,255,0.12) 54%, transparent 56%)",
          }}
        />
      );
    default:
      return null;
  }
}

function MovingParticles({
  effect,
  paused,
  preview,
}: {
  effect: AmbientEffect;
  paused: boolean;
  preview: boolean;
}) {
  const baseCount = effect.count ?? 8;
  const count = capCount(effect.kind, preview ? Math.max(4, Math.round(baseCount * 0.45)) : baseCount);
  const size = effect.size ?? 8;
  const duration = effect.durationMs ?? 9000;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes ambientFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate3d(0, -14px, 0) scale(1.08); opacity: 0.78; }
        }
        @keyframes ambientRise {
          0% { transform: translate3d(0, 14px, 0) scale(0.75); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translate3d(0, -38px, 0) scale(1.08); opacity: 0; }
        }
        @keyframes ambientFall {
          0% { transform: translate3d(0, -22px, 0) scale(0.72); opacity: 0; }
          20% { opacity: 0.7; }
          100% { transform: translate3d(0, 30px, 0) scale(1); opacity: 0; }
        }
        @keyframes ambientDrift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(10px, -8px, 0); }
        }
        @keyframes ambientSweep {
          0% { transform: translate3d(-14px, 0, 0); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translate3d(24px, 0, 0); opacity: 0; }
        }
        @keyframes ambientRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ambientCross {
          0% { transform: translate3d(-12%, 0, 0); opacity: 0; }
          10%, 90% { opacity: 0.5; }
          100% { transform: translate3d(118%, 0, 0); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, index) => {
        const color = effect.color ?? "rgba(255,255,255,0.6)";
        const secondary = effect.colorSecondary ?? effect.color ?? "rgba(255,255,255,0.35)";
        const animationName =
          effect.kind === "bubbles" || effect.kind === "embers" || effect.kind === "dust"
            ? "ambientRise"
            : effect.kind === "snow" || effect.kind === "petals" || effect.kind === "rain" || effect.kind === "leaves"
              ? "ambientFall"
              : effect.kind === "glints"
                ? "ambientSweep"
                : effect.kind === "gears" || effect.kind === "orbit-rings"
                  ? "ambientRotate"
                  : effect.kind === "pixel-walker" || effect.kind === "fish" || effect.kind === "bats" || effect.kind === "comet" || effect.kind === "shooting-stars" || effect.kind === "planets"
                    ? "ambientCross"
                    : effect.kind === "fog" || effect.kind === "mist" || effect.kind === "wisps"
                      ? "ambientDrift"
                      : "ambientFloat";

        const width =
          effect.kind === "rain"
            ? 2
            : effect.kind === "gears" || effect.kind === "orbit-rings"
              ? size * 2.8
              : effect.kind === "comet" || effect.kind === "shooting-stars"
                ? size * 3.2
                : size + (index % 3) * 2;
        const height =
          effect.kind === "rain"
            ? size * 2.4
            : effect.kind === "gears" || effect.kind === "orbit-rings"
              ? size * 2.8
              : effect.kind === "comet" || effect.kind === "shooting-stars"
                ? size * 0.8
                : size + (index % 2) * 2;

        const borderRadius =
          effect.kind === "pixel-walker" ? "0.25rem"
          : effect.kind === "rain" ? "999px"
          : effect.kind === "gears" || effect.kind === "orbit-rings" ? "999px"
          : "999px";

        const animationDuration = `${duration + index * 260}ms`;
        const animationDelay = `${index * 160 * (preview ? 0.6 : 1)}ms`;

        return (
          <span
            key={`${effect.kind}-${index}`}
            className="absolute"
            style={{
              left: `${(index * 91) % 100}%`,
              top:
                effect.kind === "planets" || effect.kind === "bats" || effect.kind === "fish" || effect.kind === "pixel-walker"
                  ? `${18 + (index % 5) * 14}%`
                  : `${(index * 37) % 100}%`,
              width,
              height,
              borderRadius,
              background:
                effect.kind === "gears"
                  ? `radial-gradient(circle, transparent 38%, ${color} 40%, ${color} 52%, transparent 54%)`
                  : effect.kind === "orbit-rings"
                    ? "transparent"
                    : effect.kind === "comet" || effect.kind === "shooting-stars"
                      ? `linear-gradient(90deg, ${color}, transparent)`
                      : effect.kind === "fog" || effect.kind === "mist"
                        ? `radial-gradient(circle, ${color}, transparent 72%)`
                        : index % 2 === 0
                          ? color
                          : secondary,
              opacity: effect.opacity ?? 0.16,
              border: effect.kind === "orbit-rings" ? `1px solid ${color}` : undefined,
              boxShadow:
                effect.kind === "fireflies" || effect.kind === "glints" || effect.kind === "stars"
                  ? `0 0 14px ${color}`
                  : undefined,
              animation: `${animationName} ${animationDuration} linear ${animationDelay} infinite`,
              animationPlayState: paused ? "paused" : "running",
              transformOrigin: "center center",
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

export default function AmbientEffectsLayer({
  effects,
  enabled = true,
  preview = false,
  className = "",
}: {
  effects: AmbientEffect[];
  enabled?: boolean;
  preview?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.visibilityState === "hidden");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const staticEffects = useMemo(
    () =>
      effects.filter((effect) =>
        ["scanlines", "grid", "halftone", "paper-grain", "map-lines", "light-rays", "caustics", "heat-haze", "nebula", "aurora", "waves", "constellation-lines", "void-cracks"].includes(effect.kind),
      ),
    [effects],
  );

  const animatedEffects = useMemo(
    () => effects.filter((effect) => !staticEffects.includes(effect)),
    [effects, staticEffects],
  );

  if (!enabled || effects.length === 0) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {staticEffects.map((effect, index) => (
        <StaticLayer key={`${effect.kind}-${index}`} effect={effect} />
      ))}
      {!reducedMotion && animatedEffects.map((effect, index) => (
        <MovingParticles
          key={`${effect.kind}-${index}`}
          effect={effect}
          paused={hidden}
          preview={preview}
        />
      ))}
    </div>
  );
}
