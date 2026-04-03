"use client";

import { useId } from "react";
import { ChestRarity, getChestTheme } from "@/lib/rewardChests";
import { ChestSkinId, DEFAULT_CHEST_SKIN_ID, getChestSkin } from "@/lib/themes";

export type ChestIllustrationTone = "base" | "tinted" | "spent";
export type ChestIllustrationState = "closed" | "open";

type ChestIllustrationProps = {
  state: ChestIllustrationState;
  rarity?: ChestRarity;
  tone?: ChestIllustrationTone;
  skin?: ChestSkinId;
  className?: string;
  glowMode?: "none" | "static" | "pulse";
  float?: boolean;
  shine?: boolean;
};

const CHEST_BODY_X = 24;
const CHEST_BODY_Y = 42;
const CHEST_BODY_WIDTH = 72;
const CHEST_BODY_HEIGHT = 34;
const CHEST_BODY_RADIUS = 10;
const CHEST_LID_PATH = "M24 46C24 33.8 33.4 24 45 24H75C86.6 24 96 33.8 96 46V50H24V46Z";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized.split("").map((character) => `${character}${character}`).join("")
      : normalized;
  const parsed = Number.parseInt(safeHex, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(primary: string, secondary: string, weight: number) {
  const amount = clamp(weight, 0, 1);
  const left = hexToRgb(primary);
  const right = hexToRgb(secondary);

  return rgbToHex(
    left.r + (right.r - left.r) * amount,
    left.g + (right.g - left.g) * amount,
    left.b + (right.b - left.b) * amount,
  );
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function getTintColor(rarity: ChestRarity) {
  const theme = getChestTheme(rarity);

  if (rarity === "mythic") {
    return {
      primary: "#F7A8DA",
      secondary: "#8B5CF6",
      tertiary: "#5EB0FF",
      quaternary: "#FFD569",
      aura: withAlpha("#F4B1E4", 0.56),
    };
  }

  return {
    primary:
      rarity === "rare"
        ? "#78BFFF"
        : rarity === "epic"
          ? "#C695FF"
          : rarity === "legendary"
            ? "#F4C95A"
            : "#F2C35A",
    secondary:
      rarity === "rare"
        ? mixHex("#4899FF", "#E0F2FE", 0.14)
        : rarity === "epic"
          ? mixHex("#8B5CF6", "#F5D0FE", 0.12)
          : rarity === "legendary"
            ? mixHex("#D99012", "#FFF1B0", 0.08)
            : "#C98729",
    tertiary: theme.sparkle,
    quaternary: theme.gem,
    aura: theme.aura,
  };
}

function getChestPalette(tone: ChestIllustrationTone, rarity: ChestRarity, skinId: ChestSkinId) {
  const tint = getTintColor(rarity);
  const skin = getChestSkin(skinId);
  const skinMix = tone === "spent" ? 0.38 : tone === "tinted" ? 0.46 : 0.58;

  const basePalette =
    tone === "spent"
      ? {
      glowOuter: withAlpha("#F0D79A", 0.16),
      glowInner: withAlpha("#FFF4D0", 0.24),
      lidPrimary: "#E8C985",
      lidSecondary: "#D8B168",
      bodyPrimary: "#DABA76",
      bodySecondary: "#C89B55",
      strap: "#FAE8BE",
      bodyHighlight: withAlpha("#FFF2CF", 0.22),
      stroke: "#B88C48",
      latch: "#F2DEB2",
      latchShadow: "#B88F4A",
      interiorGlow: withAlpha("#FFF2C4", 0.84),
      interiorGlowSoft: withAlpha("#FFF7E1", 0.62),
      sparkle: withAlpha("#FFF6DD", 0.78),
      shadow: "rgba(145, 110, 53, 0.18)",
      mythicGradient: null as null | string[],
      }
      : tone === "tinted" && rarity === "mythic"
        ? {
      glowOuter: withAlpha("#F2B4E7", 0.24),
      glowInner: withAlpha("#FFF2FF", 0.34),
      lidPrimary: "#F7C65B",
      lidSecondary: "#DEA03B",
      bodyPrimary: "#DEA03B",
      bodySecondary: "#B87B24",
      strap: "#FFF0C5",
      bodyHighlight: withAlpha("#FFF2D4", 0.28),
      stroke: "#A86A1F",
      latch: "#FFF1C8",
      latchShadow: "#A16A27",
      interiorGlow: withAlpha("#FFF5DA", 0.92),
      interiorGlowSoft: withAlpha("#FFF9ED", 0.72),
      sparkle: withAlpha("#FFF4FF", 0.92),
      shadow: "rgba(149, 94, 22, 0.22)",
      mythicGradient: ["#F7B6D9", "#C49BFF", "#7CB7FF", "#FFD66E"] as string[],
        }
        : tone === "tinted"
          ? {
      glowOuter: withAlpha(tint.primary, 0.22),
      glowInner: withAlpha(tint.quaternary, 0.34),
      lidPrimary: mixHex("#F7C65B", tint.primary, 0.42),
      lidSecondary: mixHex("#DEA03B", tint.secondary, 0.54),
      bodyPrimary: mixHex("#E1A13B", tint.primary, 0.48),
      bodySecondary: mixHex("#BF7B24", tint.secondary, 0.58),
      strap: mixHex("#FFF0C5", tint.quaternary, 0.18),
      bodyHighlight: withAlpha(mixHex("#FFF2D1", tint.tertiary, 0.16), 0.28),
      stroke: mixHex("#A86A1F", tint.secondary, 0.24),
      latch: "#FFF1C6",
      latchShadow: mixHex("#9C631C", tint.secondary, 0.16),
      interiorGlow: withAlpha(mixHex("#FFF2C4", tint.quaternary, 0.18), 0.88),
      interiorGlowSoft: withAlpha(mixHex("#FFF8E2", tint.tertiary, 0.12), 0.68),
      sparkle: withAlpha(mixHex("#FFF7DF", tint.quaternary, 0.28), 0.9),
      shadow: "rgba(149, 94, 22, 0.22)",
      mythicGradient: null as null | string[],
          }
          : {
    glowOuter: withAlpha("#FFD986", 0.34),
    glowInner: withAlpha("#FFF3C6", 0.58),
    lidPrimary: "#F7C65B",
    lidSecondary: "#DEA03B",
    bodyPrimary: "#E1A13B",
    bodySecondary: "#BF7B24",
    strap: "#FFF1C4",
    bodyHighlight: withAlpha("#FFF1BA", 0.3),
    stroke: "#A86A1F",
    latch: "#FFF1C6",
    latchShadow: "#9C631C",
    interiorGlow: withAlpha("#FFF2C4", 0.88),
    interiorGlowSoft: withAlpha("#FFF8DD", 0.66),
    sparkle: withAlpha("#FFF7DD", 0.84),
    shadow: "rgba(149, 94, 22, 0.24)",
    mythicGradient: null as null | string[],
          };

  return {
    ...basePalette,
    glowOuter: tone === "spent" ? withAlpha(skin.accent, 0.12) : withAlpha(skin.accent, tone === "tinted" ? 0.22 : 0.28),
    glowInner: tone === "spent" ? withAlpha(skin.accent, 0.18) : withAlpha(skin.accent, 0.22),
    lidPrimary: mixHex(basePalette.lidPrimary, skin.primary, skinMix),
    lidSecondary: mixHex(basePalette.lidSecondary, skin.secondary, skinMix),
    bodyPrimary: mixHex(basePalette.bodyPrimary, skin.primary, skinMix * 0.92),
    bodySecondary: mixHex(basePalette.bodySecondary, skin.secondary, skinMix * 0.92),
    strap: mixHex(basePalette.strap, skin.accent, tone === "spent" ? 0.18 : 0.34),
    stroke: mixHex(basePalette.stroke, skin.line, 0.64),
    latch: mixHex(basePalette.latch, skin.accent, tone === "spent" ? 0.14 : 0.22),
    latchShadow: mixHex(basePalette.latchShadow, skin.line, 0.46),
    bodyHighlight: withAlpha(skin.accent, tone === "spent" ? 0.1 : 0.18),
    interiorGlow: withAlpha(skin.accent, tone === "spent" ? 0.5 : 0.76),
    interiorGlowSoft: withAlpha(skin.accent, tone === "spent" ? 0.32 : 0.46),
    sparkle: withAlpha(skin.accent, tone === "spent" ? 0.42 : 0.72),
  };
}

function renderSkinDetails(
  motif: ReturnType<typeof getChestSkin>["motif"],
  state: ChestIllustrationState,
  colors: {
    accent: string;
    metal: string;
    line: string;
    glow: string;
  },
) {
  switch (motif) {
    case "vault":
      return (
        <>
          <circle cx="60" cy={state === "closed" ? "40" : "57"} r="12" fill="none" stroke={colors.accent} strokeWidth="3.4" opacity="0.86" />
          <path d="M60 31V49" stroke={colors.metal} strokeWidth="2.8" strokeLinecap="round" opacity="0.88" />
          <path d="M51 40H69" stroke={colors.metal} strokeWidth="2.8" strokeLinecap="round" opacity="0.88" />
        </>
      );
    case "pixel":
      return (
        <>
          <rect x="34" y={state === "closed" ? "33" : "49"} width="9" height="8" fill={colors.accent} opacity="0.62" />
          <rect x="78" y={state === "closed" ? "33" : "49"} width="8" height="8" fill={colors.accent} opacity="0.62" />
          <rect x="42" y={state === "closed" ? "58" : "62"} width="10" height="6" fill={colors.metal} opacity="0.72" />
        </>
      );
    case "pod":
      return (
        <>
          <ellipse cx="60" cy={state === "closed" ? "58" : "60"} rx="26" ry="18" fill="none" stroke={colors.accent} strokeWidth="2.6" opacity="0.56" />
          <path d="M30 58C34 51 37 48 42 46" stroke={colors.line} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <path d="M90 58C86 51 83 48 78 46" stroke={colors.line} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        </>
      );
    case "clam":
      return (
        <>
          <path d="M34 42C39 36 46 32 60 32C74 32 81 36 86 42" fill="none" stroke={colors.accent} strokeWidth="2.4" opacity="0.7" />
          <path d="M40 40C44 36 50 34 60 34C70 34 76 36 80 40" fill="none" stroke={colors.metal} strokeWidth="2" opacity="0.62" />
        </>
      );
    case "coffin":
      return (
        <>
          <path d="M60 30L75 38V64L60 72L45 64V38L60 30Z" fill="none" stroke={colors.accent} strokeWidth="2.6" opacity="0.68" />
          <path d="M60 38V64" stroke={colors.metal} strokeWidth="2" opacity="0.66" />
        </>
      );
    case "lacquer":
      return (
        <>
          <path d="M37 35H83" stroke={colors.accent} strokeWidth="2.3" strokeLinecap="round" opacity="0.76" />
          <path d="M40 66H80" stroke={colors.metal} strokeWidth="2" strokeLinecap="round" opacity="0.62" />
        </>
      );
    case "egg":
      return (
        <>
          <path d="M53 35L57 43L52 50L58 57L54 64" stroke={colors.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.76" />
          <path d="M66 38L62 46L68 53L64 61" stroke={colors.metal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </>
      );
    case "lantern":
      return (
        <>
          <path d="M45 28C45 22 49 19 60 19C71 19 75 22 75 28" fill="none" stroke={colors.accent} strokeWidth="2.4" opacity="0.72" />
          <path d="M45 40H75" stroke={colors.metal} strokeWidth="2.2" opacity="0.68" />
          <path d="M48 48H72" stroke={colors.metal} strokeWidth="2.2" opacity="0.68" />
        </>
      );
    case "geode":
      return (
        <>
          <path d="M38 45L48 34L60 42L72 34L82 45" fill="none" stroke={colors.accent} strokeWidth="2.4" strokeLinejoin="round" opacity="0.74" />
          <path d="M42 63L50 55L60 61L70 55L78 63" fill="none" stroke={colors.metal} strokeWidth="2" strokeLinejoin="round" opacity="0.66" />
        </>
      );
    case "pandora":
      return (
        <>
          <path d="M40 35H80" stroke={colors.accent} strokeWidth="2.2" opacity="0.78" />
          <path d="M60 29V69" stroke={colors.metal} strokeWidth="2.1" opacity="0.66" />
          <path d="M43 56H77" stroke={colors.metal} strokeWidth="2.1" opacity="0.66" />
        </>
      );
    case "portal":
      return (
        <>
          <circle cx="60" cy={state === "closed" ? "57" : "59"} r="14.5" fill="none" stroke={colors.accent} strokeWidth="2.8" opacity="0.78" />
          <circle cx="60" cy={state === "closed" ? "57" : "59"} r="9.5" fill="none" stroke={colors.metal} strokeWidth="2.2" opacity="0.7" />
        </>
      );
    default:
      return (
        <>
          <path d="M30 48H90" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M60 48V74" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        </>
      );
  }
}

export function ChestIllustration({
  state,
  rarity = "common",
  tone = "base",
  skin = DEFAULT_CHEST_SKIN_ID,
  className = "",
  glowMode = "none",
  float = false,
  shine = false,
}: ChestIllustrationProps) {
  const palette = getChestPalette(tone, rarity, skin);
  const skinDefinition = getChestSkin(skin);
  const glowFilterId = useId();
  const lidClipId = useId();
  const shineGradientId = useId();
  const lidGradientId = useId();
  const bodyGradientId = useId();

  const renderGlow = glowMode !== "none";
  const pulseGlow = glowMode === "pulse";

  return (
    <div className={`relative overflow-visible ${className}`} aria-hidden="true">
      <style>{`
        @keyframes chestIllustrationFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes chestIllustrationGlow {
          0%, 100% { opacity: 0.34; transform: scale(0.96); }
          50% { opacity: 0.62; transform: scale(1.06); }
        }
        @keyframes chestIllustrationGleam {
          0%, 72%, 100% { transform: rotate(20deg) translateX(-2px); opacity: 0; }
          78% { opacity: 0.08; }
          86% { transform: rotate(20deg) translateX(70px); opacity: 0.92; }
          92% { opacity: 0; }
        }
        .chest-illustration-shell {
          transform-origin: center bottom;
          transform-box: fill-box;
          animation: ${float ? "chestIllustrationFloat 3s ease-in-out infinite" : "none"};
        }
        .chest-illustration-glow {
          transform-origin: center;
          transform-box: fill-box;
          animation: ${pulseGlow ? "chestIllustrationGlow 2s ease-in-out infinite" : "none"};
        }
        .chest-illustration-gleam {
          transform-origin: center;
          transform-box: fill-box;
          animation: ${shine ? "chestIllustrationGleam 4.8s ease-in-out infinite" : "none"};
        }
      `}</style>

      <svg viewBox="0 0 120 96" className="block h-auto w-full overflow-visible">
        <defs>
          <filter id={glowFilterId} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={lidClipId}>
            <path d={CHEST_LID_PATH} />
          </clipPath>
          <linearGradient id={shineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lidGradientId} x1="20%" y1="10%" x2="84%" y2="96%">
            {palette.mythicGradient ? (
              <>
                <stop offset="0%" stopColor={palette.mythicGradient[0]} />
                <stop offset="36%" stopColor={palette.mythicGradient[1]} />
                <stop offset="68%" stopColor={palette.mythicGradient[2]} />
                <stop offset="100%" stopColor={palette.mythicGradient[3]} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={palette.lidPrimary} />
                <stop offset="100%" stopColor={palette.lidSecondary} />
              </>
            )}
          </linearGradient>
          <linearGradient id={bodyGradientId} x1="18%" y1="10%" x2="82%" y2="96%">
            {palette.mythicGradient ? (
              <>
                <stop offset="0%" stopColor={palette.mythicGradient[1]} />
                <stop offset="42%" stopColor={palette.mythicGradient[2]} />
                <stop offset="78%" stopColor={palette.mythicGradient[3]} />
                <stop offset="100%" stopColor={palette.mythicGradient[0]} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={palette.bodyPrimary} />
                <stop offset="100%" stopColor={palette.bodySecondary} />
              </>
            )}
          </linearGradient>
        </defs>

        {renderGlow ? (
          <>
            <ellipse
              className="chest-illustration-glow"
              cx="60"
              cy="50"
              rx="28"
              ry="20"
              fill={palette.glowOuter}
              filter={`url(#${glowFilterId})`}
            />
            <ellipse
              className="chest-illustration-glow"
              cx="60"
              cy="48"
              rx="19"
              ry="13"
              fill={palette.glowInner}
              filter={`url(#${glowFilterId})`}
            />
          </>
        ) : null}

        <ellipse cx="60" cy="84" rx="24" ry="6.25" fill={palette.shadow} />

        {state === "closed" ? (
          <g className="chest-illustration-shell">
            <rect
              x={CHEST_BODY_X}
              y={CHEST_BODY_Y}
              width={CHEST_BODY_WIDTH}
              height={CHEST_BODY_HEIGHT}
              rx={CHEST_BODY_RADIUS}
              fill={`url(#${bodyGradientId})`}
            />
            <path d={CHEST_LID_PATH} fill={`url(#${lidGradientId})`} />

            {renderSkinDetails(skinDefinition.motif, state, {
              accent: palette.strap,
              metal: palette.latch,
              line: palette.stroke,
              glow: palette.glowOuter,
            })}
            <rect x="30" y="53" width="60" height="8" rx="4" fill={palette.bodyHighlight} />
            <path d="M24 50H96" stroke={palette.stroke} strokeWidth="3.2" strokeLinecap="round" />

            <circle cx="60" cy="60" r="10" fill={palette.latch} stroke={palette.latchShadow} strokeWidth="2.8" />
            <path
              d="M60 55.2C62.8 55.2 64.8 57.2 64.8 59.7C64.8 61.6 63.7 62.8 62.3 63.7V67.1H57.7V63.7C56.3 62.8 55.2 61.6 55.2 59.7C55.2 57.2 57.2 55.2 60 55.2Z"
              fill={palette.latchShadow}
            />

            <path d={CHEST_LID_PATH} fill="none" stroke={palette.stroke} strokeWidth="3.2" strokeLinejoin="round" />
            <rect
              x={CHEST_BODY_X}
              y={CHEST_BODY_Y}
              width={CHEST_BODY_WIDTH}
              height={CHEST_BODY_HEIGHT}
              rx={CHEST_BODY_RADIUS}
              fill="none"
              stroke={palette.stroke}
              strokeWidth="3.2"
            />

            <g clipPath={`url(#${lidClipId})`}>
              {shine ? (
                <rect
                  className="chest-illustration-gleam"
                  x="-16"
                  y="10"
                  width="14"
                  height="56"
                  rx="7"
                  fill={`url(#${shineGradientId})`}
                />
              ) : null}
              <path d="M35 33H85" stroke={withAlpha("#FFFFFF", 0.72)} strokeWidth="4.2" strokeLinecap="round" />
            </g>
          </g>
        ) : (
          <>
            <path d="M49 43L44 26" stroke={palette.interiorGlowSoft} strokeWidth="4" strokeLinecap="round" opacity="0.82" />
            <path d="M60 42L60 21" stroke={palette.interiorGlow} strokeWidth="4.8" strokeLinecap="round" opacity="0.94" />
            <path d="M71 43L77 28" stroke={palette.interiorGlowSoft} strokeWidth="4" strokeLinecap="round" opacity="0.82" />
            <circle cx="47" cy="20" r="2.1" fill={palette.sparkle} />
            <circle cx="60" cy="14" r="1.9" fill={palette.sparkle} />
            <circle cx="73" cy="21" r="2.3" fill={palette.sparkle} />

            <g className="chest-illustration-shell">
              <rect
                x={CHEST_BODY_X}
                y={CHEST_BODY_Y}
                width={CHEST_BODY_WIDTH}
                height={CHEST_BODY_HEIGHT}
                rx={CHEST_BODY_RADIUS}
                fill={`url(#${bodyGradientId})`}
              />
              <rect x="29" y="44" width="62" height="11" rx="5.5" fill={palette.bodySecondary} opacity="0.58" />
              <path d="M31 48H89" stroke={palette.interiorGlowSoft} strokeWidth="4.4" strokeLinecap="round" opacity="0.66" />
              <path d="M30 49H90" stroke={palette.stroke} strokeWidth="3" strokeLinecap="round" opacity="0.62" />
              {renderSkinDetails(skinDefinition.motif, state, {
                accent: palette.strap,
                metal: palette.latch,
                line: palette.stroke,
                glow: palette.glowOuter,
              })}
              <rect x="30" y="55" width="60" height="7" rx="3.5" fill={palette.bodyHighlight} />
              <circle cx="60" cy="61" r="9.5" fill={palette.latch} stroke={palette.latchShadow} strokeWidth="2.4" opacity="0.95" />
              <path
                d="M60 56.9C62.6 56.9 64.4 58.8 64.4 61C64.4 62.6 63.4 63.8 62.1 64.6V67.6H57.9V64.6C56.6 63.8 55.6 62.6 55.6 61C55.6 58.8 57.4 56.9 60 56.9Z"
                fill={palette.latchShadow}
                opacity="0.9"
              />
              <rect
                x={CHEST_BODY_X}
                y={CHEST_BODY_Y}
                width={CHEST_BODY_WIDTH}
                height={CHEST_BODY_HEIGHT}
                rx={CHEST_BODY_RADIUS}
                fill="none"
                stroke={palette.stroke}
                strokeWidth="3"
              />
            </g>

            <g transform="rotate(-34 32 47)">
              <path d={CHEST_LID_PATH} fill={`url(#${lidGradientId})`} />
              <path d="M35 33H85" stroke={withAlpha("#FFFFFF", 0.72)} strokeWidth="4.2" strokeLinecap="round" />
              <path d={CHEST_LID_PATH} fill="none" stroke={palette.stroke} strokeWidth="3" strokeLinejoin="round" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
