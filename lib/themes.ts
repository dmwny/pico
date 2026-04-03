"use client";

export type PathThemeId =
  | "default"
  | "cyberpunk"
  | "fantasy_rpg"
  | "retro_arcade"
  | "space_explorer"
  | "underwater"
  | "haunted"
  | "samurai";

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
  | "portal";

export type TrailEffectId =
  | "default_trail"
  | "fire"
  | "ice"
  | "lightning"
  | "cherry_blossom"
  | "stardust"
  | "rainbow"
  | "constellation"
  | "bubble"
  | "ghost";

export type NodeEffectId =
  | "default_nodes"
  | "fireflies"
  | "snowflakes"
  | "embers"
  | "sparkles"
  | "leaves"
  | "stardust_nodes";

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

export type ThemeNodeShape = "orb" | "diamond" | "quest" | "pixel" | "planet" | "coral" | "tombstone" | "brush";

export type PathThemeDefinition = {
  id: PathThemeId;
  name: string;
  description: string;
  shopDescription: string;
  accentColor: string;
  accentSoft: string;
  accentContrast: string;
  pageBackground: string;
  pageOverlay: string;
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
  chestSkin: ChestSkinId;
  trailEffect: TrailEffectId;
  particleEffect: NodeEffectId;
  featuredTitleBadgeId: TitleBadgeId;
};

export type ChestSkinDefinition = {
  id: ChestSkinId;
  name: string;
  description: string;
  family: "classic" | "tech" | "organic" | "mystic";
  primary: string;
  secondary: string;
  accent: string;
  metal: string;
  glow: string;
  line: string;
  motif:
    | "bands"
    | "vault"
    | "pixel"
    | "pod"
    | "clam"
    | "coffin"
    | "lacquer"
    | "egg"
    | "lantern"
    | "geode"
    | "pandora"
    | "portal";
  openingFeel: string;
};

export type TrailEffectDefinition = {
  id: TrailEffectId;
  name: string;
  description: string;
  gradient: string;
  glow: string;
  particleColor: string;
  motion: "steady" | "embers" | "frost" | "arc" | "petals" | "stardust" | "wave" | "constellation" | "bubbles" | "wisps";
};

export type NodeEffectDefinition = {
  id: NodeEffectId;
  name: string;
  description: string;
  accent: string;
  particleColor: string;
  motion: "none" | "float" | "fall" | "rise" | "twinkle";
};

export type ProfileBorderDefinition = {
  id: ProfileBorderId;
  name: string;
  description: string;
  gradient: string;
  glow: string;
  animation: "spin" | "pulse" | "shimmer";
};

export type TitleBadgeDefinition = {
  id: TitleBadgeId;
  name: string;
  description: string;
  tone: string;
  glow: string;
};

export const DEFAULT_PATH_THEME_ID: PathThemeId = "default";
export const DEFAULT_CHEST_SKIN_ID: ChestSkinId = "default_chest";
export const DEFAULT_TRAIL_EFFECT_ID: TrailEffectId = "default_trail";
export const DEFAULT_NODE_EFFECT_ID: NodeEffectId = "default_nodes";

export const PATH_THEME_IDS: PathThemeId[] = [
  "default",
  "cyberpunk",
  "fantasy_rpg",
  "retro_arcade",
  "space_explorer",
  "underwater",
  "haunted",
  "samurai",
];

export const CHEST_SKIN_IDS: ChestSkinId[] = [
  "default_chest",
  "vault_door",
  "classic_treasure",
  "pixel_chest",
  "alien_pod",
  "clam_chest",
  "coffin_chest",
  "lacquered_box",
  "dragon_egg",
  "magic_lantern",
  "geode",
  "pandoras_box",
  "portal",
];

export const TRAIL_EFFECT_IDS: TrailEffectId[] = [
  "default_trail",
  "fire",
  "ice",
  "lightning",
  "cherry_blossom",
  "stardust",
  "rainbow",
  "constellation",
  "bubble",
  "ghost",
];

export const NODE_EFFECT_IDS: NodeEffectId[] = [
  "default_nodes",
  "fireflies",
  "snowflakes",
  "embers",
  "sparkles",
  "leaves",
  "stardust_nodes",
];

export const PROFILE_BORDER_IDS: ProfileBorderId[] = [
  "aurora_border",
  "ember_border",
  "moonlit_border",
  "tidal_border",
  "pixel_border",
];

export const TITLE_BADGE_IDS: TitleBadgeId[] = [
  "streak_lord",
  "gem_hoarder",
  "perfect_run",
  "chest_hunter",
  "scholar",
  "night_owl",
  "speed_runner",
  "glitch_lord",
  "quest_master",
  "high_score",
  "star_walker",
  "deep_diver",
  "ghost_scholar",
  "code_ronin",
];

export const PATH_THEMES: Record<PathThemeId, PathThemeDefinition> = {
  default: {
    id: "default",
    name: "Default",
    description: "Clean Pico classic with soft paper tones and friendly greens.",
    shopDescription: "Pico's original lesson path with bright greens, paper textures, and the classic treasure chest.",
    accentColor: "#22C55E",
    accentSoft: "#DCFCE7",
    accentContrast: "#14532D",
    pageBackground: "radial-gradient(circle at top left, rgba(34,197,94,0.14), transparent 28%), linear-gradient(180deg, #F8FAFC 0%, #F5F7FA 100%)",
    pageOverlay: "radial-gradient(circle at 20% 0%, rgba(34,197,94,0.12), transparent 32%)",
    heroBackground: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(14,165,233,0.08))",
    previewBackground: "linear-gradient(180deg, #F9FBFD 0%, #EFF6FF 100%)",
    previewLabel: "Pico Classic",
    previewUnitTitle: "Starter Grove",
    previewHighlight: "#16A34A",
    unitBannerBackground: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    unitBannerBorder: "#15803D",
    unitBannerText: "#FFFFFF",
    unitBannerSubtext: "rgba(255,255,255,0.84)",
    unitBadgeBackground: "rgba(255,255,255,0.92)",
    unitBadgeText: "#15803D",
    unitActionBackground: "#FFFFFF",
    unitActionText: "#15803D",
    nodeShape: "orb",
    nodeAvailableBackground: "#22C55E",
    nodeAvailableBorder: "#15803D",
    nodeAvailableText: "#FFFFFF",
    nodeCompletedBackground: "#16A34A",
    nodeCompletedBorder: "#166534",
    nodeCompletedText: "#FFFFFF",
    nodeCurrentRing: "rgba(255,255,255,0.92)",
    nodeLockedBackground: "#E5E7EB",
    nodeLockedBorder: "#CBD5E1",
    nodeLockedText: "#94A3B8",
    nodeGlow: "rgba(34,197,94,0.24)",
    nodeCompletedGlow: "rgba(34,197,94,0.18)",
    trailGradient: "linear-gradient(180deg, #BBF7D0 0%, #22C55E 100%)",
    trailGlow: "rgba(34,197,94,0.18)",
    bannerPattern: "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 44%)",
    chestSkin: "default_chest",
    trailEffect: "default_trail",
    particleEffect: "default_nodes",
    featuredTitleBadgeId: "scholar",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon city glow, circuit trails, and vault-tech rewards.",
    shopDescription: "A midnight neon route with hacked vault chests, lightning connectors, and ember sparks.",
    accentColor: "#22D3EE",
    accentSoft: "#083344",
    accentContrast: "#ECFEFF",
    pageBackground: "radial-gradient(circle at top, rgba(34,211,238,0.2), transparent 28%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.16), transparent 24%), linear-gradient(180deg, #09090F 0%, #111827 100%)",
    pageOverlay: "linear-gradient(90deg, rgba(34,211,238,0.08), transparent 34%, rgba(236,72,153,0.08) 100%)",
    heroBackground: "linear-gradient(135deg, rgba(8,145,178,0.28), rgba(236,72,153,0.18))",
    previewBackground: "linear-gradient(180deg, #070C18 0%, #101827 100%)",
    previewLabel: "Neon Run",
    previewUnitTitle: "Neon District",
    previewHighlight: "#22D3EE",
    unitBannerBackground: "linear-gradient(135deg, #111827 0%, #0F172A 45%, #092F3A 100%)",
    unitBannerBorder: "#22D3EE",
    unitBannerText: "#ECFEFF",
    unitBannerSubtext: "rgba(236,254,255,0.78)",
    unitBadgeBackground: "rgba(34,211,238,0.16)",
    unitBadgeText: "#67E8F9",
    unitActionBackground: "rgba(17,24,39,0.86)",
    unitActionText: "#67E8F9",
    nodeShape: "diamond",
    nodeAvailableBackground: "linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)",
    nodeAvailableBorder: "#164E63",
    nodeAvailableText: "#ECFEFF",
    nodeCompletedBackground: "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
    nodeCompletedBorder: "#164E63",
    nodeCompletedText: "#ECFEFF",
    nodeCurrentRing: "rgba(34,211,238,0.64)",
    nodeLockedBackground: "#1F2937",
    nodeLockedBorder: "#374151",
    nodeLockedText: "#64748B",
    nodeGlow: "rgba(34,211,238,0.3)",
    nodeCompletedGlow: "rgba(236,72,153,0.14)",
    trailGradient: "linear-gradient(180deg, #22D3EE 0%, #A855F7 100%)",
    trailGlow: "rgba(34,211,238,0.28)",
    bannerPattern: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.12) 50%, transparent 100%)",
    chestSkin: "vault_door",
    trailEffect: "lightning",
    particleEffect: "embers",
    featuredTitleBadgeId: "glitch_lord",
  },
  fantasy_rpg: {
    id: "fantasy_rpg",
    name: "Fantasy RPG",
    description: "Parchment quests, torchlit paths, and classic treasure.",
    shopDescription: "A warm quest-map theme with scroll banners, blossom trails, and the classic adventurer chest.",
    accentColor: "#B45309",
    accentSoft: "#FEF3C7",
    accentContrast: "#78350F",
    pageBackground: "radial-gradient(circle at top left, rgba(245,158,11,0.16), transparent 26%), linear-gradient(180deg, #F7F1E4 0%, #EFE2C0 100%)",
    pageOverlay: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(120,53,15,0.04))",
    heroBackground: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(120,53,15,0.14))",
    previewBackground: "linear-gradient(180deg, #FAF4E8 0%, #F2E5C7 100%)",
    previewLabel: "Quest Board",
    previewUnitTitle: "Dragonwood Trail",
    previewHighlight: "#B45309",
    unitBannerBackground: "linear-gradient(135deg, #F2C46B 0%, #D97706 100%)",
    unitBannerBorder: "#92400E",
    unitBannerText: "#FFF7ED",
    unitBannerSubtext: "rgba(255,247,237,0.82)",
    unitBadgeBackground: "rgba(255,247,237,0.92)",
    unitBadgeText: "#92400E",
    unitActionBackground: "rgba(255,247,237,0.94)",
    unitActionText: "#92400E",
    nodeShape: "quest",
    nodeAvailableBackground: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    nodeAvailableBorder: "#92400E",
    nodeAvailableText: "#FFF7ED",
    nodeCompletedBackground: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
    nodeCompletedBorder: "#78350F",
    nodeCompletedText: "#FFF7ED",
    nodeCurrentRing: "rgba(255,247,237,0.82)",
    nodeLockedBackground: "#E7D7B7",
    nodeLockedBorder: "#D6C2A0",
    nodeLockedText: "#9A8561",
    nodeGlow: "rgba(245,158,11,0.26)",
    nodeCompletedGlow: "rgba(217,119,6,0.18)",
    trailGradient: "linear-gradient(180deg, #D97706 0%, #F59E0B 100%)",
    trailGlow: "rgba(245,158,11,0.18)",
    bannerPattern: "radial-gradient(circle at top right, rgba(255,247,237,0.24), transparent 42%)",
    chestSkin: "classic_treasure",
    trailEffect: "cherry_blossom",
    particleEffect: "fireflies",
    featuredTitleBadgeId: "quest_master",
  },
  retro_arcade: {
    id: "retro_arcade",
    name: "Retro Arcade",
    description: "Pixel-perfect ladders, scanlines, and high-score energy.",
    shopDescription: "An 8-bit shop bundle with pixel nodes, arcade cabinets, and a chunky pixel chest.",
    accentColor: "#F97316",
    accentSoft: "#431407",
    accentContrast: "#FFF7ED",
    pageBackground: "radial-gradient(circle at top left, rgba(249,115,22,0.16), transparent 24%), linear-gradient(180deg, #111827 0%, #1F2937 100%)",
    pageOverlay: "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 6px)",
    heroBackground: "linear-gradient(135deg, rgba(249,115,22,0.28), rgba(250,204,21,0.18))",
    previewBackground: "linear-gradient(180deg, #101827 0%, #1E293B 100%)",
    previewLabel: "High Score",
    previewUnitTitle: "Pixel Circuit",
    previewHighlight: "#FACC15",
    unitBannerBackground: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
    unitBannerBorder: "#F97316",
    unitBannerText: "#FFF7ED",
    unitBannerSubtext: "rgba(255,247,237,0.76)",
    unitBadgeBackground: "rgba(249,115,22,0.18)",
    unitBadgeText: "#FDBA74",
    unitActionBackground: "rgba(17,24,39,0.94)",
    unitActionText: "#FDBA74",
    nodeShape: "pixel",
    nodeAvailableBackground: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
    nodeAvailableBorder: "#9A3412",
    nodeAvailableText: "#FFF7ED",
    nodeCompletedBackground: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
    nodeCompletedBorder: "#9A3412",
    nodeCompletedText: "#FFF7ED",
    nodeCurrentRing: "rgba(250,204,21,0.72)",
    nodeLockedBackground: "#374151",
    nodeLockedBorder: "#4B5563",
    nodeLockedText: "#94A3B8",
    nodeGlow: "rgba(249,115,22,0.28)",
    nodeCompletedGlow: "rgba(250,204,21,0.14)",
    trailGradient: "linear-gradient(180deg, #F97316 0%, #FACC15 100%)",
    trailGlow: "rgba(249,115,22,0.2)",
    bannerPattern: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 8px, transparent 8px, transparent 16px)",
    chestSkin: "pixel_chest",
    trailEffect: "stardust",
    particleEffect: "sparkles",
    featuredTitleBadgeId: "high_score",
  },
  space_explorer: {
    id: "space_explorer",
    name: "Space Explorer",
    description: "Nebula banners, orbital nodes, and constellation routes.",
    shopDescription: "A deep-space theme with planet nodes, nebula cards, and a dimensional portal chest.",
    accentColor: "#8B5CF6",
    accentSoft: "#EDE9FE",
    accentContrast: "#F5F3FF",
    pageBackground: "radial-gradient(circle at top, rgba(99,102,241,0.24), transparent 24%), radial-gradient(circle at 85% 15%, rgba(56,189,248,0.18), transparent 20%), linear-gradient(180deg, #050816 0%, #111827 100%)",
    pageOverlay: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), transparent 1.5%), radial-gradient(circle at 70% 10%, rgba(255,255,255,0.08), transparent 1.2%)",
    heroBackground: "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(56,189,248,0.16))",
    previewBackground: "linear-gradient(180deg, #050816 0%, #0F172A 100%)",
    previewLabel: "Nebula Route",
    previewUnitTitle: "Nebula Route",
    previewHighlight: "#93C5FD",
    unitBannerBackground: "linear-gradient(135deg, #1E1B4B 0%, #312E81 48%, #0F172A 100%)",
    unitBannerBorder: "#8B5CF6",
    unitBannerText: "#F5F3FF",
    unitBannerSubtext: "rgba(245,243,255,0.76)",
    unitBadgeBackground: "rgba(139,92,246,0.18)",
    unitBadgeText: "#C4B5FD",
    unitActionBackground: "rgba(15,23,42,0.94)",
    unitActionText: "#C4B5FD",
    nodeShape: "planet",
    nodeAvailableBackground: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    nodeAvailableBorder: "#312E81",
    nodeAvailableText: "#F5F3FF",
    nodeCompletedBackground: "linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)",
    nodeCompletedBorder: "#312E81",
    nodeCompletedText: "#F5F3FF",
    nodeCurrentRing: "rgba(196,181,253,0.72)",
    nodeLockedBackground: "#1F2937",
    nodeLockedBorder: "#334155",
    nodeLockedText: "#64748B",
    nodeGlow: "rgba(139,92,246,0.28)",
    nodeCompletedGlow: "rgba(56,189,248,0.18)",
    trailGradient: "linear-gradient(180deg, #8B5CF6 0%, #38BDF8 100%)",
    trailGlow: "rgba(56,189,248,0.2)",
    bannerPattern: "radial-gradient(circle at 16% 28%, rgba(255,255,255,0.08), transparent 2%), radial-gradient(circle at 82% 20%, rgba(255,255,255,0.08), transparent 1.4%)",
    chestSkin: "portal",
    trailEffect: "constellation",
    particleEffect: "stardust_nodes",
    featuredTitleBadgeId: "star_walker",
  },
  underwater: {
    id: "underwater",
    name: "Underwater",
    description: "Coral nodes, bubble trails, and giant clam rewards.",
    shopDescription: "A bright ocean route with kelp banners, drifting bubbles, and a glowing clam chest.",
    accentColor: "#06B6D4",
    accentSoft: "#E0F2FE",
    accentContrast: "#083344",
    pageBackground: "radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 24%), linear-gradient(180deg, #E0F7FA 0%, #CFFAFE 40%, #ECFEFF 100%)",
    pageOverlay: "radial-gradient(circle at 10% 15%, rgba(255,255,255,0.22), transparent 16%), radial-gradient(circle at 80% 12%, rgba(255,255,255,0.18), transparent 12%)",
    heroBackground: "linear-gradient(135deg, rgba(14,165,233,0.16), rgba(6,182,212,0.14))",
    previewBackground: "linear-gradient(180deg, #E0F7FA 0%, #CFFAFE 100%)",
    previewLabel: "Tide Route",
    previewUnitTitle: "Coral Current",
    previewHighlight: "#0891B2",
    unitBannerBackground: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
    unitBannerBorder: "#0F766E",
    unitBannerText: "#ECFEFF",
    unitBannerSubtext: "rgba(236,254,255,0.78)",
    unitBadgeBackground: "rgba(236,254,255,0.88)",
    unitBadgeText: "#0F766E",
    unitActionBackground: "rgba(236,254,255,0.92)",
    unitActionText: "#0F766E",
    nodeShape: "coral",
    nodeAvailableBackground: "linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%)",
    nodeAvailableBorder: "#0F766E",
    nodeAvailableText: "#ECFEFF",
    nodeCompletedBackground: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)",
    nodeCompletedBorder: "#0F766E",
    nodeCompletedText: "#ECFEFF",
    nodeCurrentRing: "rgba(236,254,255,0.82)",
    nodeLockedBackground: "#C7E9EF",
    nodeLockedBorder: "#A5D8E2",
    nodeLockedText: "#6B9DB0",
    nodeGlow: "rgba(6,182,212,0.26)",
    nodeCompletedGlow: "rgba(34,211,238,0.18)",
    trailGradient: "linear-gradient(180deg, #22D3EE 0%, #0EA5E9 100%)",
    trailGlow: "rgba(6,182,212,0.18)",
    bannerPattern: "radial-gradient(circle at 24% 22%, rgba(255,255,255,0.18), transparent 8%), radial-gradient(circle at 80% 18%, rgba(255,255,255,0.16), transparent 10%)",
    chestSkin: "clam_chest",
    trailEffect: "bubble",
    particleEffect: "fireflies",
    featuredTitleBadgeId: "deep_diver",
  },
  haunted: {
    id: "haunted",
    name: "Haunted",
    description: "Fog, flickering wisps, and coffin rewards in the dark.",
    shopDescription: "A moody gothic route with ghost trails, ember particles, and a haunted coffin chest.",
    accentColor: "#A78BFA",
    accentSoft: "#1E1B4B",
    accentContrast: "#F5F3FF",
    pageBackground: "radial-gradient(circle at top, rgba(167,139,250,0.18), transparent 24%), linear-gradient(180deg, #0B1020 0%, #15151F 100%)",
    pageOverlay: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(148,163,184,0.02))",
    heroBackground: "linear-gradient(135deg, rgba(76,29,149,0.34), rgba(148,163,184,0.12))",
    previewBackground: "linear-gradient(180deg, #0B1020 0%, #18181B 100%)",
    previewLabel: "Midnight Hollow",
    previewUnitTitle: "Dark Forest",
    previewHighlight: "#C4B5FD",
    unitBannerBackground: "linear-gradient(135deg, #27272A 0%, #18181B 100%)",
    unitBannerBorder: "#A78BFA",
    unitBannerText: "#F5F3FF",
    unitBannerSubtext: "rgba(245,243,255,0.74)",
    unitBadgeBackground: "rgba(167,139,250,0.16)",
    unitBadgeText: "#DDD6FE",
    unitActionBackground: "rgba(24,24,27,0.94)",
    unitActionText: "#DDD6FE",
    nodeShape: "tombstone",
    nodeAvailableBackground: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)",
    nodeAvailableBorder: "#2E1065",
    nodeAvailableText: "#F5F3FF",
    nodeCompletedBackground: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
    nodeCompletedBorder: "#2E1065",
    nodeCompletedText: "#F5F3FF",
    nodeCurrentRing: "rgba(221,214,254,0.64)",
    nodeLockedBackground: "#27272A",
    nodeLockedBorder: "#3F3F46",
    nodeLockedText: "#71717A",
    nodeGlow: "rgba(167,139,250,0.22)",
    nodeCompletedGlow: "rgba(251,191,36,0.08)",
    trailGradient: "linear-gradient(180deg, #7C3AED 0%, #64748B 100%)",
    trailGlow: "rgba(167,139,250,0.18)",
    bannerPattern: "radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 42%)",
    chestSkin: "coffin_chest",
    trailEffect: "ghost",
    particleEffect: "embers",
    featuredTitleBadgeId: "ghost_scholar",
  },
  samurai: {
    id: "samurai",
    name: "Samurai",
    description: "Ink-wash horizons, lantern trails, and lacquered rewards.",
    shopDescription: "A restrained calligraphy theme with brush nodes, ember lantern trails, and a lacquered keepsake chest.",
    accentColor: "#DC2626",
    accentSoft: "#FEE2E2",
    accentContrast: "#450A0A",
    pageBackground: "radial-gradient(circle at top left, rgba(220,38,38,0.12), transparent 26%), linear-gradient(180deg, #F8F3EA 0%, #F1ECE3 100%)",
    pageOverlay: "linear-gradient(135deg, rgba(0,0,0,0.03), transparent 42%)",
    heroBackground: "linear-gradient(135deg, rgba(220,38,38,0.14), rgba(120,53,15,0.12))",
    previewBackground: "linear-gradient(180deg, #FAF5EF 0%, #F0E7DA 100%)",
    previewLabel: "Brush Path",
    previewUnitTitle: "Crimson Dojo",
    previewHighlight: "#B91C1C",
    unitBannerBackground: "linear-gradient(135deg, #1F2937 0%, #7F1D1D 100%)",
    unitBannerBorder: "#B91C1C",
    unitBannerText: "#FEF2F2",
    unitBannerSubtext: "rgba(254,242,242,0.76)",
    unitBadgeBackground: "rgba(254,242,242,0.88)",
    unitBadgeText: "#7F1D1D",
    unitActionBackground: "rgba(254,242,242,0.92)",
    unitActionText: "#7F1D1D",
    nodeShape: "brush",
    nodeAvailableBackground: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)",
    nodeAvailableBorder: "#7F1D1D",
    nodeAvailableText: "#FEF2F2",
    nodeCompletedBackground: "linear-gradient(135deg, #991B1B 0%, #B91C1C 100%)",
    nodeCompletedBorder: "#7F1D1D",
    nodeCompletedText: "#FEF2F2",
    nodeCurrentRing: "rgba(254,242,242,0.82)",
    nodeLockedBackground: "#E7DFD2",
    nodeLockedBorder: "#D6C9B5",
    nodeLockedText: "#8B7D69",
    nodeGlow: "rgba(220,38,38,0.18)",
    nodeCompletedGlow: "rgba(120,53,15,0.12)",
    trailGradient: "linear-gradient(180deg, #F97316 0%, #DC2626 100%)",
    trailGlow: "rgba(249,115,22,0.16)",
    bannerPattern: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent 48%)",
    chestSkin: "lacquered_box",
    trailEffect: "fire",
    particleEffect: "leaves",
    featuredTitleBadgeId: "code_ronin",
  },
};

export const CHEST_SKINS: Record<ChestSkinId, ChestSkinDefinition> = {
  default_chest: {
    id: "default_chest",
    name: "Default Chest",
    description: "Pico's classic warm treasure chest.",
    family: "classic",
    primary: "#F4C95D",
    secondary: "#D99034",
    accent: "#FFF1C2",
    metal: "#A6681D",
    glow: "rgba(245, 190, 82, 0.26)",
    line: "#8A591C",
    motif: "bands",
    openingFeel: "Classic gem burst with crisp lock pop.",
  },
  vault_door: {
    id: "vault_door",
    name: "Vault Door",
    description: "A reinforced neon vault with cyan edge lighting.",
    family: "tech",
    primary: "#1F2937",
    secondary: "#0F172A",
    accent: "#22D3EE",
    metal: "#94A3B8",
    glow: "rgba(34, 211, 238, 0.28)",
    line: "#164E63",
    motif: "vault",
    openingFeel: "Heavy lock disengage with electric arcs.",
  },
  classic_treasure: {
    id: "classic_treasure",
    name: "Wooden Treasure",
    description: "A classic adventurer chest with rich wood grain.",
    family: "classic",
    primary: "#C47B2B",
    secondary: "#8C4B16",
    accent: "#FDE68A",
    metal: "#7C3A10",
    glow: "rgba(245, 158, 11, 0.2)",
    line: "#6B3410",
    motif: "bands",
    openingFeel: "Wooden creak and warm treasure light.",
  },
  pixel_chest: {
    id: "pixel_chest",
    name: "Pixel Chest",
    description: "Chunky 8-bit panels with arcade orange trim.",
    family: "tech",
    primary: "#FB923C",
    secondary: "#C2410C",
    accent: "#FDE047",
    metal: "#7C2D12",
    glow: "rgba(249, 115, 22, 0.24)",
    line: "#7C2D12",
    motif: "pixel",
    openingFeel: "Retro snap with pixel sparkle burst.",
  },
  alien_pod: {
    id: "alien_pod",
    name: "Alien Pod",
    description: "A bio-tech capsule glowing with cosmic energy.",
    family: "organic",
    primary: "#6366F1",
    secondary: "#1D4ED8",
    accent: "#C4B5FD",
    metal: "#312E81",
    glow: "rgba(99, 102, 241, 0.26)",
    line: "#3730A3",
    motif: "pod",
    openingFeel: "Bioluminescent shell crack with nebula vapour.",
  },
  clam_chest: {
    id: "clam_chest",
    name: "Clam Chest",
    description: "A giant pearl clam with seafoam highlights.",
    family: "organic",
    primary: "#67E8F9",
    secondary: "#0EA5E9",
    accent: "#F8FAFC",
    metal: "#0F766E",
    glow: "rgba(34, 211, 238, 0.24)",
    line: "#0F766E",
    motif: "clam",
    openingFeel: "Shell bloom with pearly glow and bubbles.",
  },
  coffin_chest: {
    id: "coffin_chest",
    name: "Coffin Chest",
    description: "A gothic coffin with haunted violet seams.",
    family: "mystic",
    primary: "#52525B",
    secondary: "#27272A",
    accent: "#C4B5FD",
    metal: "#18181B",
    glow: "rgba(167, 139, 250, 0.22)",
    line: "#3F3F46",
    motif: "coffin",
    openingFeel: "Slow ominous reveal with ghostly embers.",
  },
  lacquered_box: {
    id: "lacquered_box",
    name: "Lacquered Box",
    description: "A polished crimson keepsake box with gold trim.",
    family: "classic",
    primary: "#B91C1C",
    secondary: "#7F1D1D",
    accent: "#FDE68A",
    metal: "#7C2D12",
    glow: "rgba(220, 38, 38, 0.18)",
    line: "#7F1D1D",
    motif: "lacquer",
    openingFeel: "Sharp lacquer snap with lantern sparks.",
  },
  dragon_egg: {
    id: "dragon_egg",
    name: "Dragon Egg",
    description: "Veined shell that cracks open with inner fire.",
    family: "organic",
    primary: "#7C3AED",
    secondary: "#4C1D95",
    accent: "#FBBF24",
    metal: "#4C1D95",
    glow: "rgba(168, 85, 247, 0.28)",
    line: "#5B21B6",
    motif: "egg",
    openingFeel: "Charged cracks and hatch-like reveal.",
  },
  magic_lantern: {
    id: "magic_lantern",
    name: "Magic Lantern",
    description: "An ornate lantern with warm amber smoke.",
    family: "mystic",
    primary: "#F59E0B",
    secondary: "#B45309",
    accent: "#FDE68A",
    metal: "#92400E",
    glow: "rgba(245, 158, 11, 0.26)",
    line: "#78350F",
    motif: "lantern",
    openingFeel: "Warm genie smoke and lantern flare.",
  },
  geode: {
    id: "geode",
    name: "Geode",
    description: "Stone shell that splits to reveal crystals.",
    family: "organic",
    primary: "#60A5FA",
    secondary: "#475569",
    accent: "#C4B5FD",
    metal: "#334155",
    glow: "rgba(96, 165, 250, 0.22)",
    line: "#334155",
    motif: "geode",
    openingFeel: "Mineral split with crystal shards and sparkle.",
  },
  pandoras_box: {
    id: "pandoras_box",
    name: "Pandora's Box",
    description: "An ornate dark reliquary with ominous violet light.",
    family: "mystic",
    primary: "#312E81",
    secondary: "#111827",
    accent: "#C084FC",
    metal: "#1E1B4B",
    glow: "rgba(192, 132, 252, 0.24)",
    line: "#1E1B4B",
    motif: "pandora",
    openingFeel: "Dramatic pause followed by a dark radiant burst.",
  },
  portal: {
    id: "portal",
    name: "Portal Chest",
    description: "A dimensional ring box with swirling energy.",
    family: "tech",
    primary: "#0F172A",
    secondary: "#1D4ED8",
    accent: "#A78BFA",
    metal: "#38BDF8",
    glow: "rgba(59, 130, 246, 0.28)",
    line: "#1D4ED8",
    motif: "portal",
    openingFeel: "Space folds open with ringed energy ripples.",
  },
};

export const TRAIL_EFFECTS: Record<TrailEffectId, TrailEffectDefinition> = {
  default_trail: {
    id: "default_trail",
    name: "Default",
    description: "Pico's clean glowing connector.",
    gradient: "linear-gradient(180deg, #BBF7D0 0%, #22C55E 100%)",
    glow: "rgba(34, 197, 94, 0.18)",
    particleColor: "#86EFAC",
    motion: "steady",
  },
  fire: {
    id: "fire",
    name: "Fire",
    description: "Warm ember-lit connector with rising heat.",
    gradient: "linear-gradient(180deg, #F97316 0%, #DC2626 100%)",
    glow: "rgba(249, 115, 22, 0.22)",
    particleColor: "#FDBA74",
    motion: "embers",
  },
  ice: {
    id: "ice",
    name: "Ice",
    description: "Frosty connector with crystalline shimmer.",
    gradient: "linear-gradient(180deg, #E0F2FE 0%, #60A5FA 100%)",
    glow: "rgba(96, 165, 250, 0.2)",
    particleColor: "#E0F2FE",
    motion: "frost",
  },
  lightning: {
    id: "lightning",
    name: "Lightning",
    description: "Electric arcs run down the route.",
    gradient: "linear-gradient(180deg, #22D3EE 0%, #8B5CF6 100%)",
    glow: "rgba(34, 211, 238, 0.24)",
    particleColor: "#67E8F9",
    motion: "arc",
  },
  cherry_blossom: {
    id: "cherry_blossom",
    name: "Cherry Blossom",
    description: "Soft petals drift across the path.",
    gradient: "linear-gradient(180deg, #F9A8D4 0%, #FDBA74 100%)",
    glow: "rgba(244, 114, 182, 0.16)",
    particleColor: "#F9A8D4",
    motion: "petals",
  },
  stardust: {
    id: "stardust",
    name: "Stardust",
    description: "Cosmic sparkles dust the trail.",
    gradient: "linear-gradient(180deg, #8B5CF6 0%, #38BDF8 100%)",
    glow: "rgba(139, 92, 246, 0.2)",
    particleColor: "#E9D5FF",
    motion: "stardust",
  },
  rainbow: {
    id: "rainbow",
    name: "Rainbow",
    description: "A shifting chroma ribbon between nodes.",
    gradient: "linear-gradient(180deg, #EC4899 0%, #8B5CF6 24%, #3B82F6 52%, #22C55E 74%, #F59E0B 100%)",
    glow: "rgba(236, 72, 153, 0.16)",
    particleColor: "#FDE68A",
    motion: "wave",
  },
  constellation: {
    id: "constellation",
    name: "Constellation",
    description: "A star-linked route with orbital glints.",
    gradient: "linear-gradient(180deg, #C4B5FD 0%, #38BDF8 100%)",
    glow: "rgba(59, 130, 246, 0.18)",
    particleColor: "#F8FAFC",
    motion: "constellation",
  },
  bubble: {
    id: "bubble",
    name: "Bubble",
    description: "Little bubble pops rise along the line.",
    gradient: "linear-gradient(180deg, #67E8F9 0%, #0EA5E9 100%)",
    glow: "rgba(34, 211, 238, 0.16)",
    particleColor: "#E0F2FE",
    motion: "bubbles",
  },
  ghost: {
    id: "ghost",
    name: "Ghost",
    description: "Faint spectral wisps drift behind progress.",
    gradient: "linear-gradient(180deg, #A78BFA 0%, #64748B 100%)",
    glow: "rgba(167, 139, 250, 0.16)",
    particleColor: "#DDD6FE",
    motion: "wisps",
  },
};

export const NODE_EFFECTS: Record<NodeEffectId, NodeEffectDefinition> = {
  default_nodes: {
    id: "default_nodes",
    name: "Default",
    description: "Clean, subtle completion sparkle.",
    accent: "#86EFAC",
    particleColor: "#DCFCE7",
    motion: "none",
  },
  fireflies: {
    id: "fireflies",
    name: "Fireflies",
    description: "Soft floating lights hover near completed nodes.",
    accent: "#FDE68A",
    particleColor: "#FEF08A",
    motion: "float",
  },
  snowflakes: {
    id: "snowflakes",
    name: "Snowflakes",
    description: "Tiny falling flakes for a cool finish.",
    accent: "#E0F2FE",
    particleColor: "#F8FAFC",
    motion: "fall",
  },
  embers: {
    id: "embers",
    name: "Embers",
    description: "Warm ember specks rise from completed nodes.",
    accent: "#FDBA74",
    particleColor: "#FED7AA",
    motion: "rise",
  },
  sparkles: {
    id: "sparkles",
    name: "Sparkles",
    description: "Classic sharp glints around each completed lesson.",
    accent: "#FDE68A",
    particleColor: "#FEF3C7",
    motion: "twinkle",
  },
  leaves: {
    id: "leaves",
    name: "Leaves",
    description: "Autumn leaves drift around completed nodes.",
    accent: "#FB923C",
    particleColor: "#FED7AA",
    motion: "fall",
  },
  stardust_nodes: {
    id: "stardust_nodes",
    name: "Stardust",
    description: "Space dust floats around completed nodes.",
    accent: "#A78BFA",
    particleColor: "#E9D5FF",
    motion: "twinkle",
  },
};

export const PROFILE_BORDERS: Record<ProfileBorderId, ProfileBorderDefinition> = {
  aurora_border: {
    id: "aurora_border",
    name: "Aurora Loop",
    description: "A soft shifting aurora ring.",
    gradient: "linear-gradient(135deg, #22D3EE 0%, #8B5CF6 50%, #EC4899 100%)",
    glow: "rgba(34, 211, 238, 0.24)",
    animation: "spin",
  },
  ember_border: {
    id: "ember_border",
    name: "Ember Crown",
    description: "Warm ember ring with a deep orange core.",
    gradient: "linear-gradient(135deg, #F97316 0%, #DC2626 100%)",
    glow: "rgba(249, 115, 22, 0.24)",
    animation: "pulse",
  },
  moonlit_border: {
    id: "moonlit_border",
    name: "Moonlit Halo",
    description: "Silver-violet lunar border.",
    gradient: "linear-gradient(135deg, #CBD5E1 0%, #A78BFA 100%)",
    glow: "rgba(167, 139, 250, 0.18)",
    animation: "shimmer",
  },
  tidal_border: {
    id: "tidal_border",
    name: "Tidal Ring",
    description: "Blue-green current with ocean sheen.",
    gradient: "linear-gradient(135deg, #22D3EE 0%, #0EA5E9 100%)",
    glow: "rgba(34, 211, 238, 0.22)",
    animation: "spin",
  },
  pixel_border: {
    id: "pixel_border",
    name: "Pixel Frame",
    description: "Blocky arcade border with hard corners.",
    gradient: "linear-gradient(135deg, #F97316 0%, #FACC15 100%)",
    glow: "rgba(250, 204, 21, 0.18)",
    animation: "pulse",
  },
};

export const TITLE_BADGES: Record<TitleBadgeId, TitleBadgeDefinition> = {
  streak_lord: {
    id: "streak_lord",
    name: "Streak Lord",
    description: "For relentless consistency.",
    tone: "linear-gradient(135deg, #F97316 0%, #FACC15 100%)",
    glow: "rgba(249, 115, 22, 0.2)",
  },
  gem_hoarder: {
    id: "gem_hoarder",
    name: "Gem Hoarder",
    description: "A title for players who never miss the loot.",
    tone: "linear-gradient(135deg, #06B6D4 0%, #38BDF8 100%)",
    glow: "rgba(6, 182, 212, 0.2)",
  },
  perfect_run: {
    id: "perfect_run",
    name: "Perfect Run",
    description: "Reserved for precise lesson streaks.",
    tone: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
    glow: "rgba(168, 85, 247, 0.2)",
  },
  chest_hunter: {
    id: "chest_hunter",
    name: "Chest Hunter",
    description: "For players who open every reward in sight.",
    tone: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
    glow: "rgba(245, 158, 11, 0.2)",
  },
  scholar: {
    id: "scholar",
    name: "Scholar",
    description: "A calm default title for steady learners.",
    tone: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    glow: "rgba(34, 197, 94, 0.18)",
  },
  night_owl: {
    id: "night_owl",
    name: "Night Owl",
    description: "For late-night coders.",
    tone: "linear-gradient(135deg, #312E81 0%, #8B5CF6 100%)",
    glow: "rgba(139, 92, 246, 0.18)",
  },
  speed_runner: {
    id: "speed_runner",
    name: "Speed Runner",
    description: "For players who finish fast.",
    tone: "linear-gradient(135deg, #FB7185 0%, #F97316 100%)",
    glow: "rgba(251, 113, 133, 0.18)",
  },
  glitch_lord: {
    id: "glitch_lord",
    name: "Glitch Lord",
    description: "Exclusive to the Cyberpunk pack.",
    tone: "linear-gradient(135deg, #22D3EE 0%, #EC4899 100%)",
    glow: "rgba(34, 211, 238, 0.2)",
  },
  quest_master: {
    id: "quest_master",
    name: "Quest Master",
    description: "Exclusive to the Fantasy RPG pack.",
    tone: "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
    glow: "rgba(245, 158, 11, 0.18)",
  },
  high_score: {
    id: "high_score",
    name: "High Score",
    description: "Exclusive to the Retro Arcade pack.",
    tone: "linear-gradient(135deg, #F97316 0%, #FACC15 100%)",
    glow: "rgba(249, 115, 22, 0.18)",
  },
  star_walker: {
    id: "star_walker",
    name: "Star Walker",
    description: "Exclusive to the Space Explorer pack.",
    tone: "linear-gradient(135deg, #8B5CF6 0%, #38BDF8 100%)",
    glow: "rgba(56, 189, 248, 0.18)",
  },
  deep_diver: {
    id: "deep_diver",
    name: "Deep Diver",
    description: "Exclusive to the Underwater pack.",
    tone: "linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)",
    glow: "rgba(34, 211, 238, 0.16)",
  },
  ghost_scholar: {
    id: "ghost_scholar",
    name: "Ghost Scholar",
    description: "Exclusive to the Haunted pack.",
    tone: "linear-gradient(135deg, #A78BFA 0%, #64748B 100%)",
    glow: "rgba(167, 139, 250, 0.16)",
  },
  code_ronin: {
    id: "code_ronin",
    name: "Code Ronin",
    description: "Exclusive to the Samurai pack.",
    tone: "linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%)",
    glow: "rgba(220, 38, 38, 0.16)",
  },
};

export function getPathTheme(themeId: PathThemeId | null | undefined) {
  return PATH_THEMES[themeId ?? DEFAULT_PATH_THEME_ID] ?? PATH_THEMES[DEFAULT_PATH_THEME_ID];
}

export function getChestSkin(skinId: ChestSkinId | null | undefined) {
  return CHEST_SKINS[skinId ?? DEFAULT_CHEST_SKIN_ID] ?? CHEST_SKINS[DEFAULT_CHEST_SKIN_ID];
}

export function getTrailEffect(effectId: TrailEffectId | null | undefined) {
  return TRAIL_EFFECTS[effectId ?? DEFAULT_TRAIL_EFFECT_ID] ?? TRAIL_EFFECTS[DEFAULT_TRAIL_EFFECT_ID];
}

export function getNodeEffect(effectId: NodeEffectId | null | undefined) {
  return NODE_EFFECTS[effectId ?? DEFAULT_NODE_EFFECT_ID] ?? NODE_EFFECTS[DEFAULT_NODE_EFFECT_ID];
}

export function getProfileBorder(borderId: ProfileBorderId | null | undefined) {
  return PROFILE_BORDERS[borderId ?? PROFILE_BORDER_IDS[0]] ?? PROFILE_BORDERS[PROFILE_BORDER_IDS[0]];
}

export function getTitleBadge(badgeId: TitleBadgeId | null | undefined) {
  return badgeId ? TITLE_BADGES[badgeId] ?? null : null;
}
