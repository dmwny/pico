"use client";

export type ThemeTier = "common" | "rare" | "epic" | "legendary" | "mythic";

export type ThemeNodeShape =
  | "rounded"
  | "circle"
  | "hex"
  | "diamond"
  | "marker"
  | "fold"
  | "pixel"
  | "arch"
  | "orbital"
  | "crystal"
  | "star";

export type AmbientEffectKind =
  | "scanlines"
  | "grid"
  | "dots"
  | "halftone"
  | "paper-grain"
  | "chalk-dust"
  | "map-lines"
  | "fog"
  | "wisps"
  | "bubbles"
  | "snow"
  | "petals"
  | "fireflies"
  | "embers"
  | "rain"
  | "gears"
  | "stars"
  | "shooting-stars"
  | "nebula"
  | "planets"
  | "aurora"
  | "waves"
  | "mist"
  | "leaves"
  | "void-cracks"
  | "dust"
  | "heat-haze"
  | "caustics"
  | "light-rays"
  | "glints"
  | "pixel-walker"
  | "comet"
  | "fish"
  | "bats"
  | "orbit-rings"
  | "constellation-lines";

export type ChestSkinId =
  | "default_chest"
  | "vault_door"
  | "classic_treasure"
  | "pixel_chest"
  | "alien_pod"
  | "clam_chest"
  | "coffin_chest"
  | "lacquered_box"
  | "dragon_egg"
  | "magic_lantern"
  | "geode"
  | "pandoras_box"
  | "portal"
  | "sarcophagus_chest"
  | "ice_block_chest"
  | "stone_idol_chest"
  | "volcanic_obsidian"
  | "arcade_prize_chest"
  | "vine_overgrown_chest"
  | "clockwork_mechanism"
  | "storm_glass_chest"
  | "sunken_treasure_chest"
  | "dream_box"
  | "void_rift"
  | "celestial_orrery";

export type TrailEffectId =
  | "default_trail"
  | "steady_glow"
  | "dashed_technical"
  | "sketch"
  | "chalk"
  | "expedition_dots"
  | "neon_pulse"
  | "vine"
  | "pixel"
  | "rain"
  | "origami"
  | "aurora"
  | "electric_current"
  | "bubble_stream"
  | "ink_stroke"
  | "scarab_track"
  | "ice_growth"
  | "root_vine"
  | "lava_flow"
  | "constellation"
  | "forest_path"
  | "gear_track"
  | "lightning_zigzag"
  | "crystal_bridge"
  | "wake"
  | "dream_ribbon"
  | "void_thread"
  | "celestial_constellation";

export type NodeEffectId =
  | "default_nodes"
  | "glow_drift"
  | "sparkles"
  | "chalk_dust"
  | "petals"
  | "snowflakes"
  | "bubbles"
  | "fireflies"
  | "wisps"
  | "ink_splash"
  | "gold_dust"
  | "embers"
  | "leaves"
  | "pixel_burst"
  | "storm_shock"
  | "crystal_shards"
  | "foam_burst"
  | "dream_stars"
  | "void_particles"
  | "supernova";

export type ProfileBorderId =
  | "aurora_border"
  | "ember_border"
  | "moonlit_border"
  | "tidal_border"
  | "pixel_border";

export type TitleBadgeId =
  | "streak_lord"
  | "gem_hoarder"
  | "perfect_run"
  | "chest_hunter"
  | "scholar"
  | "night_owl"
  | "speed_runner"
  | "glitch_lord"
  | "quest_master"
  | "high_score"
  | "star_walker"
  | "deep_diver"
  | "ghost_scholar"
  | "code_ronin";

export type AmbientEffect = {
  kind: AmbientEffectKind;
  color?: string;
  colorSecondary?: string;
  opacity?: number;
  count?: number;
  durationMs?: number;
  size?: number;
  density?: "low" | "medium" | "high";
};

export type ThemeVisualTokens = {
  accentColor: string;
  accentSoft: string;
  accentContrast: string;
  pageBackground: string;
  pageOverlay: string;
  surfaceBackground: string;
  surfaceDark: string;
  surfaceCard: string;
  surfaceText: string;
  heroBackground: string;
  previewBackground: string;
  previewLabel: string;
  previewUnitTitle: string;
  previewHighlight: string;
  unitBannerBackground: string;
  unitBannerBorder: string;
  unitBannerText: string;
  unitBannerSubtext: string;
  unitBadgeBackground: string;
  unitBadgeText: string;
  unitActionBackground: string;
  unitActionText: string;
  nodeShape: ThemeNodeShape;
  nodeAvailableBackground: string;
  nodeAvailableBorder: string;
  nodeAvailableText: string;
  nodeCompletedBackground: string;
  nodeCompletedBorder: string;
  nodeCompletedText: string;
  nodeCurrentRing: string;
  nodeLockedBackground: string;
  nodeLockedBorder: string;
  nodeLockedText: string;
  nodeGlow: string;
  nodeCompletedGlow: string;
  trailGradient: string;
  trailGlow: string;
  bannerPattern: string;
};

export type PathThemeDefinition<Id extends string = string> = ThemeVisualTokens & {
  id: Id;
  name: string;
  tier: ThemeTier;
  description: string;
  shopDescription: string;
  previewColor: string;
  chestSkin: ChestSkinId;
  trailEffect: TrailEffectId;
  particleEffect: NodeEffectId;
  ambientEffects: AmbientEffect[];
  packEligible: boolean;
  featuredTitleBadgeId: TitleBadgeId | null;
  tokens: ThemeVisualTokens;
};

type ThemeSeed<Id extends string> = {
  id: Id;
  name: string;
  tier: ThemeTier;
  description: string;
  shopDescription: string;
  previewColor: string;
  previewUnitTitle: string;
  previewLabel?: string;
  accent: string;
  surface: string;
  text: string;
  node: string;
  nodeDark: string;
  trail: string;
  background: string;
  overlay?: string;
  heroBackground?: string;
  previewBackground?: string;
  highlight?: string;
  bannerPattern?: string;
  chestSkin: ChestSkinId;
  trailEffect: TrailEffectId;
  particleEffect: NodeEffectId;
  ambientEffects?: AmbientEffect[];
  packEligible?: boolean;
  nodeShape?: ThemeNodeShape;
  featuredTitleBadgeId?: TitleBadgeId | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const normalize = (channel: number) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };

  const red = normalize(r);
  const green = normalize(g);
  const blue = normalize(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex = normalized.length === 3
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

export function mixHex(primary: string, secondary: string, weight: number) {
  const amount = clamp(weight, 0, 1);
  const left = hexToRgb(primary);
  const right = hexToRgb(secondary);

  return rgbToHex(
    left.r + (right.r - left.r) * amount,
    left.g + (right.g - left.g) * amount,
    left.b + (right.b - left.b) * amount,
  );
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function defaultNodeShapeForTier(tier: ThemeTier): ThemeNodeShape {
  switch (tier) {
    case "common":
      return "rounded";
    case "rare":
      return "circle";
    case "epic":
      return "hex";
    case "legendary":
      return "orbital";
    case "mythic":
      return "star";
    default:
      return "rounded";
  }
}

export function createThemeDefinition<Id extends string>(seed: ThemeSeed<Id>): PathThemeDefinition<Id> {
  const accentSoft = mixHex(seed.surface, "#FFFFFF", 0.38);
  const accentContrast = seed.text;
  const darkSurface = relativeLuminance(seed.surface) < 0.36;
  const surfaceText = darkSurface ? mixHex(seed.text, "#FFFFFF", 0.08) : mixHex(seed.text, "#0F172A", 0.12);
  const surfaceBackground = `linear-gradient(180deg, ${mixHex(seed.surface, darkSurface ? "#020617" : "#FFFFFF", darkSurface ? 0.14 : 0.34)} 0%, ${mixHex(seed.surface, seed.accent, darkSurface ? 0.18 : 0.1)} 100%)`;
  const surfaceDark = `linear-gradient(180deg, ${mixHex(seed.surface, "#020617", darkSurface ? 0.52 : 0.7)} 0%, ${mixHex(seed.nodeDark, "#020617", darkSurface ? 0.36 : 0.56)} 100%)`;
  const surfaceCard = darkSurface
    ? `linear-gradient(180deg, ${withAlpha(mixHex(seed.surface, "#0F172A", 0.36), 0.92)} 0%, ${withAlpha(mixHex(seed.nodeDark, "#020617", 0.22), 0.96)} 100%)`
    : `linear-gradient(180deg, ${withAlpha(mixHex(seed.surface, "#FFFFFF", 0.72), 0.94)} 0%, ${withAlpha(mixHex(seed.surface, "#E2E8F0", 0.2), 0.98)} 100%)`;
  const tokens: ThemeVisualTokens = {
    accentColor: seed.accent,
    accentSoft,
    accentContrast,
    pageBackground: seed.background,
    pageOverlay: seed.overlay ?? `radial-gradient(circle at top, ${withAlpha(seed.accent, 0.16)}, transparent 28%)`,
    surfaceBackground,
    surfaceDark,
    surfaceCard,
    surfaceText,
    heroBackground: seed.heroBackground ?? `linear-gradient(135deg, ${withAlpha(seed.accent, 0.24)} 0%, ${withAlpha(seed.trail, 0.16)} 100%)`,
    previewBackground: seed.previewBackground ?? seed.background,
    previewLabel: seed.previewLabel ?? seed.name,
    previewUnitTitle: seed.previewUnitTitle,
    previewHighlight: seed.highlight ?? seed.trail,
    unitBannerBackground: `linear-gradient(135deg, ${mixHex(seed.nodeDark, seed.surface, 0.22)} 0%, ${mixHex(seed.nodeDark, seed.accent, 0.32)} 100%)`,
    unitBannerBorder: mixHex(seed.nodeDark, seed.accent, 0.18),
    unitBannerText: seed.text,
    unitBannerSubtext: withAlpha(seed.text, 0.78),
    unitBadgeBackground: withAlpha("#FFFFFF", seed.tier === "common" ? 0.88 : 0.16),
    unitBadgeText: seed.tier === "common" ? mixHex(seed.nodeDark, seed.accent, 0.18) : mixHex(seed.text, "#FFFFFF", 0.08),
    unitActionBackground: seed.tier === "common" ? withAlpha("#FFFFFF", 0.92) : withAlpha(seed.surface, 0.88),
    unitActionText: seed.tier === "common" ? mixHex(seed.nodeDark, seed.accent, 0.22) : seed.text,
    nodeShape: seed.nodeShape ?? defaultNodeShapeForTier(seed.tier),
    nodeAvailableBackground: `linear-gradient(135deg, ${seed.node} 0%, ${mixHex(seed.node, seed.accent, 0.24)} 100%)`,
    nodeAvailableBorder: mixHex(seed.nodeDark, seed.surface, 0.12),
    nodeAvailableText: seed.text,
    nodeCompletedBackground: `linear-gradient(135deg, ${seed.nodeDark} 0%, ${mixHex(seed.nodeDark, seed.accent, 0.24)} 100%)`,
    nodeCompletedBorder: mixHex(seed.nodeDark, "#101827", 0.22),
    nodeCompletedText: seed.text,
    nodeCurrentRing: withAlpha(seed.text, seed.tier === "common" ? 0.82 : 0.68),
    nodeLockedBackground: seed.tier === "common" ? mixHex(seed.surface, "#E5E7EB", 0.42) : withAlpha(seed.surface, 0.88),
    nodeLockedBorder: seed.tier === "common" ? mixHex(seed.surface, "#CBD5E1", 0.52) : withAlpha(seed.text, 0.12),
    nodeLockedText: seed.tier === "common" ? mixHex(seed.surface, "#64748B", 0.42) : withAlpha(seed.text, 0.42),
    nodeGlow: withAlpha(seed.accent, seed.tier === "legendary" || seed.tier === "mythic" ? 0.28 : 0.22),
    nodeCompletedGlow: withAlpha(seed.trail, seed.tier === "legendary" || seed.tier === "mythic" ? 0.24 : 0.18),
    trailGradient: `linear-gradient(180deg, ${mixHex(seed.trail, "#FFFFFF", 0.08)} 0%, ${seed.trail} 100%)`,
    trailGlow: withAlpha(seed.trail, seed.tier === "mythic" ? 0.26 : 0.2),
    bannerPattern: seed.bannerPattern ?? `radial-gradient(circle at top right, ${withAlpha(seed.text, 0.12)}, transparent 42%)`,
  };

  return {
    id: seed.id,
    name: seed.name,
    tier: seed.tier,
    description: seed.description,
    shopDescription: seed.shopDescription,
    previewColor: seed.previewColor,
    chestSkin: seed.chestSkin,
    trailEffect: seed.trailEffect,
    particleEffect: seed.particleEffect,
    ambientEffects: seed.ambientEffects ?? [],
    packEligible: seed.packEligible ?? true,
    featuredTitleBadgeId: seed.featuredTitleBadgeId ?? null,
    tokens,
    ...tokens,
  };
}

type ThemeFactoryInput<Id extends string> = Omit<ThemeSeed<Id>, "tier">;

export function defineCommonTheme<Id extends string>(seed: ThemeFactoryInput<Id>) {
  return createThemeDefinition({ ...seed, tier: "common" });
}

export function defineRareTheme<Id extends string>(seed: ThemeFactoryInput<Id>) {
  return createThemeDefinition({ ...seed, tier: "rare" });
}

export function defineEpicTheme<Id extends string>(seed: ThemeFactoryInput<Id>) {
  return createThemeDefinition({ ...seed, tier: "epic" });
}

export function defineLegendaryTheme<Id extends string>(seed: ThemeFactoryInput<Id>) {
  return createThemeDefinition({ ...seed, tier: "legendary" });
}

export function defineMythicTheme<Id extends string>(seed: ThemeFactoryInput<Id>) {
  return createThemeDefinition({ ...seed, tier: "mythic" });
}
