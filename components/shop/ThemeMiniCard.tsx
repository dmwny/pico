"use client";

import type { CSSProperties } from "react";
import AmbientEffectsLayer from "@/components/theme/AmbientEffectsLayer";
import MythicThemeLayer from "@/components/theme/MythicThemeLayer";
import { resolveAppearanceForTheme } from "@/lib/cosmetics";
import { getNodeEffect, getPathTheme } from "@/lib/themes";

type ThemeMiniCardSize = "strip" | "thumbnail" | "reveal";

function getShapePresentation(shape: ReturnType<typeof getPathTheme>["nodeShape"]) {
  switch (shape) {
    case "circle":
      return { className: "rounded-full", style: undefined };
    case "hex":
      return { className: "", style: { clipPath: "polygon(25% 8%, 75% 8%, 100% 50%, 75% 92%, 25% 92%, 0% 50%)" } };
    case "diamond":
      return { className: "", style: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" } };
    case "marker":
      return { className: "", style: { clipPath: "polygon(50% 0%, 100% 40%, 100% 78%, 50% 100%, 0% 78%, 0% 40%)" } };
    case "fold":
      return { className: "rounded-[0.75rem]", style: { clipPath: "polygon(8% 0%, 100% 0%, 100% 84%, 84% 100%, 0% 100%, 0% 12%)" } };
    case "pixel":
      return { className: "rounded-none", style: { clipPath: "polygon(12% 0%, 88% 0%, 88% 12%, 100% 12%, 100% 88%, 88% 88%, 88% 100%, 12% 100%, 12% 88%, 0% 88%, 0% 12%, 12% 12%)" } };
    case "arch":
      return { className: "rounded-t-[1rem] rounded-b-[0.7rem]", style: undefined };
    case "orbital":
      return { className: "rounded-full", style: undefined };
    case "crystal":
      return { className: "", style: { clipPath: "polygon(50% 0%, 86% 26%, 72% 100%, 28% 100%, 14% 26%)" } };
    case "star":
      return { className: "", style: { clipPath: "polygon(50% 0%, 61% 34%, 98% 36%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 2% 36%, 39% 34%)" } };
    default:
      return { className: "rounded-[0.8rem]", style: undefined };
  }
}

function getSizing(size: ThemeMiniCardSize) {
  if (size === "reveal") {
    return {
      shell: "h-[21rem] w-[15rem] rounded-[1.8rem] p-3",
      scene: "rounded-[1.3rem]",
      footer: "px-4 pb-4 pt-3",
      title: "text-lg",
      rarity: "text-[11px]",
      node: "h-11 w-11 text-sm",
      lineWidth: 3,
    };
  }

  if (size === "strip") {
    return {
      shell: "h-[9.4rem] w-[6.8rem] rounded-[1.25rem] p-2",
      scene: "rounded-[0.95rem]",
      footer: "px-2.5 pb-2.5 pt-2",
      title: "text-xs",
      rarity: "text-[9px]",
      node: "h-7 w-7 text-[10px]",
      lineWidth: 2,
    };
  }

  return {
    shell: "h-[11.6rem] w-[8.4rem] rounded-[1.45rem] p-2.5",
    scene: "rounded-[1.05rem]",
    footer: "px-3 pb-3 pt-2.5",
    title: "text-sm",
    rarity: "text-[10px]",
    node: "h-8 w-8 text-[11px]",
    lineWidth: 2,
  };
}

function getRarityStyle(rarity: ReturnType<typeof getPathTheme>["tier"]) {
  if (rarity === "mythic") {
    return {
      background: "linear-gradient(90deg,#F9A8D4 0%,#E9D5FF 24%,#93C5FD 48%,#FDE68A 74%,#F9A8D4 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  }
  if (rarity === "legendary") return { color: "#F6D36A" };
  if (rarity === "epic") return { color: "#D8B4FE" };
  if (rarity === "rare") return { color: "#93C5FD" };
  return { color: "#CBD5E1" };
}

type Point = { x: number; y: number; state: "completed" | "current" | "available" };

function MiniNode({
  themeId,
  point,
  size,
}: {
  themeId: ReturnType<typeof getPathTheme>["id"];
  point: Point;
  size: ThemeMiniCardSize;
}) {
  const theme = getPathTheme(themeId);
  const sizing = getSizing(size);
  const shape = getShapePresentation(theme.nodeShape);
  const completed = point.state === "completed";
  const current = point.state === "current";
  const background = completed ? theme.nodeCompletedBackground : theme.nodeAvailableBackground;
  const border = completed ? theme.nodeCompletedBorder : theme.nodeAvailableBorder;
  const textColor = completed ? theme.nodeCompletedText : theme.nodeAvailableText;
  const specialCelestial = theme.id === "celestial";
  const specialVoid = theme.id === "the_void";

  if (specialVoid) {
    return (
      <div
        className={`absolute flex items-center justify-center ${sizing.node}`}
        style={{
          left: `calc(${point.x}% - 0.875rem)`,
          top: `calc(${point.y}% - 0.875rem)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(91,33,182,0.72) 28%, rgba(7,3,19,0.2) 62%, transparent 78%)",
            opacity: completed ? 0.95 : point.state === "current" ? 0.74 : 0.32,
            filter: completed ? "drop-shadow(0 0 10px rgba(255,255,255,0.28))" : "none",
          }}
        />
        <div
          className="absolute inset-[-4px] rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            opacity: point.state === "available" ? 0.2 : 0.36,
          }}
        />
      </div>
    );
  }

  if (specialCelestial) {
    return (
      <div
        className={`absolute flex items-center justify-center ${sizing.node}`}
        style={{
          left: `calc(${point.x}% - 0.875rem)`,
          top: `calc(${point.y}% - 0.875rem)`,
        }}
      >
        <style>{`
          @keyframes themeMiniSupernova {
            0% { transform: scale(0.6); opacity: 0.68; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes themeMiniOrbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes themeMiniStarPulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.08); opacity: 1; }
          }
        `}</style>
        {completed ? (
          <span
            className="absolute inset-[-4px] rounded-full border border-sky-200/70"
            style={{ animation: "themeMiniSupernova 2.6s ease-out infinite" }}
          />
        ) : null}
        <span
          className="absolute inset-[-5px] rounded-full border border-sky-100/40"
          style={{ animation: "themeMiniOrbit 8s linear infinite" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(147,197,253,0.82) 34%, rgba(59,130,246,0.14) 72%, transparent 78%)",
            boxShadow: "0 0 18px rgba(191,219,254,0.75)",
            animation: point.state === "available" ? "themeMiniStarPulse 3.6s ease-in-out infinite" : "none",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute flex items-center justify-center border-b-4 font-black shadow-lg ${sizing.node} ${shape.className}`}
      style={{
        left: `calc(${point.x}% - 0.875rem)`,
        top: `calc(${point.y}% - 0.875rem)`,
        background,
        borderColor: border,
        color: textColor,
        boxShadow: current ? `0 0 0 4px ${theme.nodeCurrentRing}, 0 12px 24px ${theme.nodeGlow}` : `0 10px 18px ${completed ? theme.nodeCompletedGlow : theme.nodeGlow}`,
        ...shape.style,
      }}
    />
  );
}

function MiniTrail({
  themeId,
  from,
  to,
  size,
}: {
  themeId: ReturnType<typeof getPathTheme>["id"];
  from: Point;
  to: Point;
  size: ThemeMiniCardSize;
}) {
  const theme = getPathTheme(themeId);
  const sizing = getSizing(size);
  const thickness = sizing.lineWidth;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  if (theme.id === "the_void") {
    return (
      <div
        className="absolute"
        style={{
          left: `calc(${midX}% - ${length / 2}%)`,
          top: `calc(${midY}% - 1px)`,
          width: `${length}%`,
          height: 2,
          transform: `rotate(${angle}deg)`,
        }}
      >
        <span className="absolute inset-0 rounded-full bg-white" />
        <span className="absolute inset-0 rounded-full bg-fuchsia-500/20 blur-[1px] translate-x-[1px]" />
        <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-[1px] -translate-x-[1px]" />
      </div>
    );
  }

  if (theme.id === "celestial") {
    return (
      <div
        className="absolute"
        style={{
          left: `calc(${midX}% - ${length / 2}%)`,
          top: `calc(${midY}% - 1px)`,
          width: `${length}%`,
          height: 2,
          transform: `rotate(${angle}deg)`,
        }}
      >
        <style>{`
          @keyframes themeMiniTrailLight {
            0% { transform: translateX(-14%); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateX(114%); opacity: 0; }
          }
        `}</style>
        <span className="absolute inset-0 rounded-full bg-sky-100/80" />
        <span className="absolute inset-0 rounded-full bg-sky-200/30 blur-[2px]" />
        <span className="absolute left-[18%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <span className="absolute left-[68%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <span
          className="absolute top-1/2 h-1 w-[20%] -translate-y-1/2 rounded-full bg-white"
          style={{ animation: "themeMiniTrailLight 2.4s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute rounded-full"
      style={{
        left: `calc(${midX}% - ${length / 2}%)`,
        top: `calc(${midY}% - ${thickness / 2}px)`,
        width: `${length}%`,
        height: thickness,
        transform: `rotate(${angle}deg)`,
        background: theme.trailGradient,
        boxShadow: `0 0 12px ${theme.trailGlow}`,
      }}
    />
  );
}

export default function ThemeMiniCard({
  themeId,
  size = "thumbnail",
  showLabel = true,
  animated = true,
  className = "",
}: {
  themeId: ReturnType<typeof getPathTheme>["id"];
  size?: ThemeMiniCardSize;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const theme = getPathTheme(themeId);
  const appearance = resolveAppearanceForTheme(themeId);
  const nodeEffect = getNodeEffect(appearance.nodeEffectId);
  const sizing = getSizing(size);

  const points: Point[] = [
    { x: 24, y: 28, state: "completed" },
    { x: 52, y: 46, state: "completed" },
    { x: 76, y: 67, state: "current" },
  ];

  return (
    <article
      className={`relative overflow-hidden border border-white/10 bg-slate-950/90 shadow-[0_18px_40px_rgba(2,6,23,0.35)] ${sizing.shell} ${className}`}
      style={{ borderColor: theme.id === "the_void" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)" }}
    >
      <div className={`relative h-[70%] overflow-hidden ${sizing.scene}`} style={{ background: theme.previewBackground }}>
        {theme.id === "celestial" || theme.id === "the_void" ? (
          <MythicThemeLayer themeId={theme.id} preview />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: theme.pageOverlay, opacity: 0.9 }} />
            {animated ? <AmbientEffectsLayer effects={theme.ambientEffects} enabled preview className="opacity-70" /> : null}
          </>
        )}
        {points.slice(0, 2).map((point, index) => (
          <MiniTrail key={`trail-${index}`} themeId={theme.id} from={point} to={points[index + 1]} size={size} />
        ))}
        {points.map((point) => (
          <MiniNode key={`${point.x}-${point.y}`} themeId={theme.id} point={point} size={size} />
        ))}

        {theme.id !== "celestial" && theme.id !== "the_void" && nodeEffect.motion !== "none" ? (
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                className="absolute rounded-full"
                style={{
                  left: `${18 + index * 16}%`,
                  top: `${28 + index * 10}%`,
                  width: size === "reveal" ? 5 + (index % 2) * 2 : 3 + (index % 2),
                  height: size === "reveal" ? 5 + (index % 2) * 2 : 3 + (index % 2),
                  background: nodeEffect.particleColor,
                  opacity: 0.48,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {showLabel ? (
        <div className={`${sizing.footer}`}>
          <p className={`font-black text-white ${sizing.title}`}>{theme.name}</p>
          <p className={`mt-1 font-black uppercase tracking-[0.22em] ${sizing.rarity}`} style={getRarityStyle(theme.tier) as CSSProperties}>
            {theme.tier}
          </p>
        </div>
      ) : null}
    </article>
  );
}
