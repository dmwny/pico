"use client";

import AmbientEffectsLayer, { useAmbientEffectsPreference } from "@/components/theme/AmbientEffectsLayer";
import { ChestIllustration } from "@/components/rewards/ChestIllustration";
import { ResolvedCosmeticAppearance } from "@/lib/cosmetics";
import { getNodeEffect, getPathTheme, getTrailEffect } from "@/lib/themes";

type PreviewHighlight = {
  label: string;
  accent?: string;
};

type PreviewPathNodeStatus = "completed" | "current" | "available";

type PreviewPathItem =
  | {
      kind: "node";
      status: PreviewPathNodeStatus;
      offset: number;
    }
  | {
      kind: "chest";
      offset: number;
    };

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
      return { className: "rounded-[1rem]", style: { clipPath: "polygon(8% 0%, 100% 0%, 100% 84%, 84% 100%, 0% 100%, 0% 12%)" } };
    case "pixel":
      return { className: "rounded-none", style: { clipPath: "polygon(12% 0%, 88% 0%, 88% 12%, 100% 12%, 100% 88%, 88% 88%, 88% 100%, 12% 100%, 12% 88%, 0% 88%, 0% 12%, 12% 12%)" } };
    case "arch":
      return { className: "rounded-t-[1.4rem] rounded-b-[0.9rem]", style: undefined };
    case "orbital":
      return { className: "rounded-full", style: { boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)" } };
    case "crystal":
      return { className: "", style: { clipPath: "polygon(50% 0%, 86% 26%, 72% 100%, 28% 100%, 14% 26%)" } };
    case "star":
      return { className: "", style: { clipPath: "polygon(50% 0%, 61% 34%, 98% 36%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 2% 36%, 39% 34%)" } };
    default:
      return { className: "rounded-[1.15rem]", style: undefined };
  }
}

function NodeParticles({
  color,
  motion,
}: {
  color: string;
  motion: ReturnType<typeof getNodeEffect>["motion"];
}) {
  if (motion === "none") return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full"
          style={{
            width: 4 + index,
            height: 4 + index,
            left: `${18 + index * 26}%`,
            top: motion === "rise" ? `${60 - index * 8}%` : `${16 + index * 14}%`,
            background: color,
            opacity: 0.72,
            animation:
              motion === "float"
                ? `themePreviewFloat ${3.2 + index * 0.5}s ease-in-out ${index * 0.2}s infinite`
                : motion === "fall"
                  ? `themePreviewFall ${2.8 + index * 0.3}s linear ${index * 0.2}s infinite`
                  : motion === "rise"
                    ? `themePreviewRise ${2.6 + index * 0.3}s ease-in ${index * 0.16}s infinite`
                    : `themePreviewTwinkle ${1.8 + index * 0.2}s ease-in-out ${index * 0.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PreviewNode({
  appearance,
  status,
  hero,
}: {
  appearance: ResolvedCosmeticAppearance;
  status: PreviewPathNodeStatus;
  hero?: boolean;
}) {
  const theme = getPathTheme(appearance.pathThemeId);
  const nodeEffect = getNodeEffect(appearance.nodeEffectId);
  const shapePresentation = getShapePresentation(theme.nodeShape);
  const complete = status === "completed";
  const current = status === "current";
  const background = complete ? theme.nodeCompletedBackground : theme.nodeAvailableBackground;
  const border = complete ? theme.nodeCompletedBorder : theme.nodeAvailableBorder;
  const textColor = complete ? theme.nodeCompletedText : theme.nodeAvailableText;
  const sizeClass = hero ? "h-16 w-16 text-base" : "h-14 w-14 text-sm";
  const iconClass = hero ? "h-7 w-7" : "h-6 w-6";

  return (
    <div
      className={`relative flex items-center justify-center border-b-4 font-black shadow-lg ${sizeClass} ${shapePresentation.className}`}
      style={{
        background,
        borderColor: border,
        color: textColor,
        ...shapePresentation.style,
        boxShadow: current
          ? `0 0 0 7px ${theme.nodeCurrentRing}, 0 18px 36px ${theme.nodeGlow}`
          : `0 18px 30px ${complete ? theme.nodeCompletedGlow : theme.nodeGlow}`,
      }}
    >
      {complete ? (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2.8">
          <path d="M10 8l6 4-6 4V8Z" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      {complete && <NodeParticles color={nodeEffect.particleColor} motion={nodeEffect.motion} />}
    </div>
  );
}

function PreviewChestNode({
  appearance,
  hero,
}: {
  appearance: ResolvedCosmeticAppearance;
  hero?: boolean;
}) {
  const theme = getPathTheme(appearance.pathThemeId);

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`absolute rounded-full blur-2xl ${hero ? "inset-[-18px]" : "inset-[-14px]"}`}
        style={{ background: theme.accentColor, opacity: hero ? 0.22 : 0.18 }}
      />
      <ChestIllustration
        state="closed"
        rarity="rare"
        skin={appearance.chestSkinId}
        className={hero ? "w-[5.7rem]" : "w-[4.7rem]"}
        glowMode="pulse"
        float
        shine
      />
    </div>
  );
}

function TrailSegment({
  appearance,
  hero,
}: {
  appearance: ResolvedCosmeticAppearance;
  hero?: boolean;
}) {
  const theme = getPathTheme(appearance.pathThemeId);
  const trail = getTrailEffect(appearance.trailEffectId);
  const heightClass = hero ? "h-11" : "h-9";

  return (
    <div className={`relative flex w-12 items-center justify-center ${heightClass}`}>
      <span
        className="absolute h-full w-[6px] rounded-full"
        style={{
          background: theme.trailGradient,
          boxShadow: `0 0 18px ${theme.trailGlow}`,
        }}
      />
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full"
          style={{
            width: 4 + index,
            height: 4 + index,
            background: trail.particleColor,
            left: `${40 + index * 10}%`,
            top: `${index * 22}%`,
            opacity: 0.76,
            animation:
              trail.motion === "arc"
                ? `themePreviewArc ${1.6 + index * 0.2}s ease-in-out ${index * 0.15}s infinite`
                : trail.motion === "petals"
                  ? `themePreviewFall ${2.8 + index * 0.3}s linear ${index * 0.1}s infinite`
                  : trail.motion === "bubbles"
                    ? `themePreviewRise ${2.4 + index * 0.2}s ease-in ${index * 0.14}s infinite`
                    : trail.motion === "wisps"
                      ? `themePreviewFloat ${3.4 + index * 0.2}s ease-in-out ${index * 0.16}s infinite`
                      : `themePreviewTwinkle ${1.8 + index * 0.16}s ease-in-out ${index * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PreviewPath({
  appearance,
  hero,
}: {
  appearance: ResolvedCosmeticAppearance;
  hero?: boolean;
}) {
  const items: PreviewPathItem[] = hero
    ? [
        { kind: "node", status: "completed", offset: -24 },
        { kind: "node", status: "completed", offset: 28 },
        { kind: "chest", offset: -6 },
        { kind: "node", status: "completed", offset: -30 },
        { kind: "node", status: "current", offset: 22 },
        { kind: "node", status: "available", offset: -14 },
      ]
    : [
        { kind: "node", status: "completed", offset: -12 },
        { kind: "node", status: "completed", offset: 14 },
        { kind: "chest", offset: 0 },
        { kind: "node", status: "current", offset: 10 },
      ];

  return (
    <div className={`mx-auto flex flex-col items-center ${hero ? "max-w-[18rem]" : "max-w-[8rem]"}`}>
      {items.map((item, index) => {
        const next = items[index + 1];
        const connectorOffset = next ? Math.round((item.offset + next.offset) / 2) : 0;

        return (
          <div key={`${item.kind}-${index}`} className="flex flex-col items-center">
            <div
              className="flex justify-center"
              style={{ transform: `translateX(${item.offset}px)` }}
            >
              {item.kind === "chest" ? (
                <PreviewChestNode appearance={appearance} hero={hero} />
              ) : (
                <PreviewNode appearance={appearance} status={item.status} hero={hero} />
              )}
            </div>

            {next ? (
              <div
                className="flex justify-center"
                style={{ transform: `translateX(${connectorOffset}px)` }}
              >
                <TrailSegment appearance={appearance} hero={hero} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function HighlightList({
  items,
  themeAccent,
}: {
  items: PreviewHighlight[];
  themeAccent: string;
}) {
  if (!items.length) return null;

  return (
    <div className="rounded-[1.5rem] border border-white/14 bg-[rgba(15,23,42,0.18)] p-4 backdrop-blur-sm">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-white/50">Included In Pack</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.14)",
                color: item.accent ?? themeAccent,
              }}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M10 2.5L11.86 7L16.5 8.86L11.86 10.72L10 15.3L8.14 10.72L3.5 8.86L8.14 7L10 2.5Z" />
              </svg>
            </span>
            <span className="text-sm font-black text-white/88">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ThemePreview({
  appearance,
  hero = false,
  previewMode = false,
  heading,
  includedHighlights = [],
}: {
  appearance: ResolvedCosmeticAppearance;
  hero?: boolean;
  previewMode?: boolean;
  heading?: string;
  includedHighlights?: PreviewHighlight[];
}) {
  const theme = getPathTheme(appearance.pathThemeId);
  const { enabled: ambientEffectsEnabled } = useAmbientEffectsPreference();

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/14 ${hero ? "min-h-[28rem] p-6 sm:p-8" : "min-h-[13rem] p-4"}`}
      style={{
        background: theme.previewBackground,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 48px rgba(15,23,42,0.16)",
      }}
    >
      <style>{`
        @keyframes themePreviewFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.68; }
          50% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes themePreviewRise {
          0% { transform: translateY(4px); opacity: 0; }
          30% { opacity: 0.82; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
        @keyframes themePreviewFall {
          0% { transform: translateY(-6px); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translateY(18px); opacity: 0; }
        }
        @keyframes themePreviewTwinkle {
          0%, 100% { transform: scale(0.7); opacity: 0.36; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes themePreviewArc {
          0%, 100% { transform: translate3d(-2px, 0px, 0); opacity: 0.3; }
          50% { transform: translate3d(6px, -8px, 0); opacity: 1; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: theme.pageOverlay }} />
      <AmbientEffectsLayer effects={theme.ambientEffects} enabled={ambientEffectsEnabled} preview className="opacity-80" />
      <div
        className="pointer-events-none absolute inset-y-0 left-[-12%] w-[42%] rotate-[12deg] blur-3xl"
        style={{ background: theme.heroBackground, opacity: hero ? 0.44 : 0.28 }}
      />
      <div
        className="pointer-events-none absolute right-[-12%] top-[-8%] h-36 w-36 rounded-full blur-3xl"
        style={{ background: theme.accentColor, opacity: hero ? 0.22 : 0.16 }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-white/65">
              {previewMode ? "Preview Mode" : "Live Theme"}
            </p>
            <h3 className={`mt-2 font-black text-white ${hero ? "text-3xl" : "text-xl"}`}>{heading ?? theme.name}</h3>
            <p className={`mt-2 max-w-md font-semibold text-white/70 ${hero ? "text-sm leading-6" : "text-xs leading-5"}`}>
              {theme.previewLabel}
            </p>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: "rgba(15,23,42,0.34)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            {theme.name}
          </span>
        </div>

        {hero ? (
          <div className="mt-6 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-[rgba(15,23,42,0.1)] px-4 py-4 sm:px-5">
              <div
                className="absolute inset-x-4 top-4 rounded-[1.25rem] border px-4 py-3"
                style={{
                  background: theme.unitBannerBackground,
                  borderColor: theme.unitBannerBorder,
                  color: theme.unitBannerText,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: theme.unitBannerSubtext }}>
                      {theme.name} Unit
                    </p>
                    <p className="mt-1 text-2xl font-black">{theme.previewUnitTitle}</p>
                  </div>
                  <span
                    className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{
                      background: theme.unitBadgeBackground,
                      borderColor: "rgba(255,255,255,0.16)",
                      color: theme.unitBadgeText,
                    }}
                  >
                    {theme.previewLabel}
                  </span>
                </div>
              </div>

              <div
                className="pointer-events-none absolute left-[-6%] top-[26%] h-40 w-40 rounded-full blur-3xl"
                style={{ background: theme.accentColor, opacity: 0.14 }}
              />
              <div
                className="pointer-events-none absolute bottom-[-12%] right-[-8%] h-48 w-48 rounded-full blur-3xl"
                style={{ background: theme.previewHighlight, opacity: 0.12 }}
              />

              <div className="relative px-2 pb-3 pt-28">
                <PreviewPath appearance={appearance} hero />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <HighlightList items={includedHighlights} themeAccent={theme.previewHighlight} />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.6rem] border border-white/12 bg-[rgba(15,23,42,0.1)] px-4 py-4">
            <div
              className="rounded-[1.15rem] border px-4 py-3"
              style={{
                background: theme.unitBannerBackground,
                borderColor: theme.unitBannerBorder,
                color: theme.unitBannerText,
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: theme.unitBannerSubtext }}>
                {theme.name} Unit
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-lg font-black">{theme.previewUnitTitle}</p>
                <span
                  className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]"
                  style={{
                    background: theme.unitBadgeBackground,
                    borderColor: "rgba(255,255,255,0.16)",
                    color: theme.unitBadgeText,
                  }}
                >
                  {theme.previewLabel}
                </span>
              </div>
            </div>

            <div className="relative mt-5">
              <PreviewPath appearance={appearance} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
