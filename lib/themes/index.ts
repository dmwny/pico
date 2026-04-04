"use client";

import { COMMON_THEME_IDS, COMMON_THEMES } from "@/lib/themes/common";
import { EPIC_THEME_IDS, EPIC_THEMES } from "@/lib/themes/epic";
import { LEGENDARY_THEME_IDS, LEGENDARY_THEMES } from "@/lib/themes/legendary";
import { MYTHIC_THEME_IDS, MYTHIC_THEMES } from "@/lib/themes/mythic";
import { RARE_THEME_IDS, RARE_THEMES } from "@/lib/themes/rare";
import {
  ChestSkinId,
  NodeEffectId,
  PathThemeDefinition,
  ProfileBorderId,
  ThemeTier,
  TitleBadgeId,
  TrailEffectId,
  defineCommonTheme,
} from "@/lib/themes/shared";

export * from "@/lib/themes/shared";

export type PathThemeId =
  | "default"
  | (typeof COMMON_THEME_IDS)[number]
  | (typeof RARE_THEME_IDS)[number]
  | (typeof EPIC_THEME_IDS)[number]
  | (typeof LEGENDARY_THEME_IDS)[number]
  | (typeof MYTHIC_THEME_IDS)[number];

export type LegacyPathThemeId =
  | "cyberpunk"
  | "fantasy_rpg"
  | "retro_arcade"
  | "space_explorer"
  | "underwater"
  | "haunted"
  | "samurai";

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
  motif: "bands" | "vault" | "pixel" | "pod" | "clam" | "coffin" | "lacquer" | "egg" | "lantern" | "geode" | "pandora" | "portal";
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

export const PATH_THEME_IDS = [
  "default",
  ...COMMON_THEME_IDS,
  ...RARE_THEME_IDS,
  ...EPIC_THEME_IDS,
  ...LEGENDARY_THEME_IDS,
  ...MYTHIC_THEME_IDS,
] as const satisfies readonly PathThemeId[];

export const THEME_TIER_ORDER: ThemeTier[] = ["common", "rare", "epic", "legendary", "mythic"];

export const LEGACY_THEME_MIGRATIONS: Record<LegacyPathThemeId, PathThemeId> = {
  cyberpunk: "cyberpunk_city",
  fantasy_rpg: "vintage_map",
  retro_arcade: "retro_arcade",
  space_explorer: "space_station",
  underwater: "deep_ocean",
  haunted: "haunted_mansion",
  samurai: "samurai_dojo",
};

const DEFAULT_THEME = defineCommonTheme({
  id: "default",
  name: "Default",
  description: "Pico's classic clean lesson path.",
  shopDescription: "The original Pico route with bright greens, friendly banners, and the classic treasure chest.",
  previewColor: "#22C55E",
  previewUnitTitle: "Starter Grove",
  previewLabel: "Pico Classic",
  accent: "#22C55E",
  surface: "#F8FAFC",
  text: "#14532D",
  node: "#22C55E",
  nodeDark: "#15803D",
  trail: "#16A34A",
  background: "linear-gradient(180deg,#F8FAFC 0%,#F1F5F9 100%)",
  chestSkin: "default_chest",
  trailEffect: "default_trail",
  particleEffect: "default_nodes",
  packEligible: false,
  featuredTitleBadgeId: "scholar",
});

export const PATH_THEMES: Record<PathThemeId, PathThemeDefinition<PathThemeId>> = {
  default: DEFAULT_THEME,
  ...(COMMON_THEMES as Record<(typeof COMMON_THEME_IDS)[number], PathThemeDefinition<PathThemeId>>),
  ...(RARE_THEMES as Record<(typeof RARE_THEME_IDS)[number], PathThemeDefinition<PathThemeId>>),
  ...(EPIC_THEMES as Record<(typeof EPIC_THEME_IDS)[number], PathThemeDefinition<PathThemeId>>),
  ...(LEGENDARY_THEMES as Record<(typeof LEGENDARY_THEME_IDS)[number], PathThemeDefinition<PathThemeId>>),
  ...(MYTHIC_THEMES as Record<(typeof MYTHIC_THEME_IDS)[number], PathThemeDefinition<PathThemeId>>),
};

export const THEMES_BY_TIER: Record<ThemeTier, PathThemeDefinition<PathThemeId>[]> = {
  common: COMMON_THEME_IDS.map((id) => PATH_THEMES[id]),
  rare: RARE_THEME_IDS.map((id) => PATH_THEMES[id]),
  epic: EPIC_THEME_IDS.map((id) => PATH_THEMES[id]),
  legendary: LEGENDARY_THEME_IDS.map((id) => PATH_THEMES[id]),
  mythic: MYTHIC_THEME_IDS.map((id) => PATH_THEMES[id]),
};

export const PACK_ELIGIBLE_THEME_IDS = PATH_THEME_IDS.filter((id) => PATH_THEMES[id].packEligible);

export const CHEST_SKIN_IDS = [
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
  "sarcophagus_chest",
  "ice_block_chest",
  "stone_idol_chest",
  "volcanic_obsidian",
  "arcade_prize_chest",
  "vine_overgrown_chest",
  "clockwork_mechanism",
  "storm_glass_chest",
  "sunken_treasure_chest",
  "dream_box",
  "void_rift",
  "celestial_orrery",
] as const satisfies readonly ChestSkinId[];

export const TRAIL_EFFECT_IDS = [
  "default_trail",
  "steady_glow",
  "dashed_technical",
  "sketch",
  "chalk",
  "expedition_dots",
  "neon_pulse",
  "vine",
  "pixel",
  "rain",
  "origami",
  "aurora",
  "electric_current",
  "bubble_stream",
  "ink_stroke",
  "scarab_track",
  "ice_growth",
  "root_vine",
  "lava_flow",
  "constellation",
  "forest_path",
  "gear_track",
  "lightning_zigzag",
  "crystal_bridge",
  "wake",
  "dream_ribbon",
  "void_thread",
  "celestial_constellation",
] as const satisfies readonly TrailEffectId[];

export const NODE_EFFECT_IDS = [
  "default_nodes",
  "glow_drift",
  "sparkles",
  "chalk_dust",
  "petals",
  "snowflakes",
  "bubbles",
  "fireflies",
  "wisps",
  "ink_splash",
  "gold_dust",
  "embers",
  "leaves",
  "pixel_burst",
  "storm_shock",
  "crystal_shards",
  "foam_burst",
  "dream_stars",
  "void_particles",
  "supernova",
] as const satisfies readonly NodeEffectId[];

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
    openingFeel: "Classic gem burst with a crisp lock pop.",
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
  sarcophagus_chest: {
    id: "sarcophagus_chest",
    name: "Sarcophagus Chest",
    description: "A carved golden reliquary inspired by ancient tombs.",
    family: "mystic",
    primary: "#D4A64A",
    secondary: "#8B5E1E",
    accent: "#FDE68A",
    metal: "#78350F",
    glow: "rgba(245, 158, 11, 0.22)",
    line: "#78350F",
    motif: "coffin",
    openingFeel: "Sealed stone unlock followed by a sand-gold flare.",
  },
  ice_block_chest: {
    id: "ice_block_chest",
    name: "Ice Block Chest",
    description: "A frozen relic trapped inside clear blue ice.",
    family: "organic",
    primary: "#BFDBFE",
    secondary: "#60A5FA",
    accent: "#FFFFFF",
    metal: "#1D4ED8",
    glow: "rgba(147, 197, 253, 0.26)",
    line: "#60A5FA",
    motif: "geode",
    openingFeel: "Frozen shell fractures with icy glitter.",
  },
  stone_idol_chest: {
    id: "stone_idol_chest",
    name: "Stone Idol Chest",
    description: "A vine-wrapped idol chest carved from temple stone.",
    family: "organic",
    primary: "#6B7280",
    secondary: "#374151",
    accent: "#86EFAC",
    metal: "#1F2937",
    glow: "rgba(134, 239, 172, 0.18)",
    line: "#14532D",
    motif: "bands",
    openingFeel: "Stone grinds apart while leaf glow spills out.",
  },
  volcanic_obsidian: {
    id: "volcanic_obsidian",
    name: "Volcanic Obsidian",
    description: "Dark obsidian with glowing lava seams.",
    family: "mystic",
    primary: "#292524",
    secondary: "#111827",
    accent: "#FB923C",
    metal: "#7C2D12",
    glow: "rgba(249, 115, 22, 0.24)",
    line: "#B91C1C",
    motif: "geode",
    openingFeel: "Heat shimmer then a molten fissure split.",
  },
  arcade_prize_chest: {
    id: "arcade_prize_chest",
    name: "Arcade Prize Chest",
    description: "An arcade prize box with bright ticket-machine color.",
    family: "tech",
    primary: "#F97316",
    secondary: "#C2410C",
    accent: "#FACC15",
    metal: "#7C2D12",
    glow: "rgba(250, 204, 21, 0.2)",
    line: "#7C2D12",
    motif: "pixel",
    openingFeel: "Ticket lights flicker before the prize pops.",
  },
  vine_overgrown_chest: {
    id: "vine_overgrown_chest",
    name: "Ancient Vine Chest",
    description: "A heavy wooden chest reclaimed by glowing forest vines.",
    family: "organic",
    primary: "#8C4B16",
    secondary: "#5B3713",
    accent: "#86EFAC",
    metal: "#14532D",
    glow: "rgba(134, 239, 172, 0.22)",
    line: "#166534",
    motif: "bands",
    openingFeel: "Roots peel back as the chest wakes up.",
  },
  clockwork_mechanism: {
    id: "clockwork_mechanism",
    name: "Clockwork Chest",
    description: "A brass mechanism chest with rivets and visible gearing.",
    family: "tech",
    primary: "#D4A64A",
    secondary: "#8B5E1E",
    accent: "#FDE68A",
    metal: "#7C2D12",
    glow: "rgba(245, 158, 11, 0.22)",
    line: "#78350F",
    motif: "vault",
    openingFeel: "Cogs align before the mechanism releases.",
  },
  storm_glass_chest: {
    id: "storm_glass_chest",
    name: "Storm Glass Chest",
    description: "A brass weather chest with charged glass inside.",
    family: "mystic",
    primary: "#334155",
    secondary: "#0F172A",
    accent: "#93C5FD",
    metal: "#CBD5E1",
    glow: "rgba(147, 197, 253, 0.24)",
    line: "#475569",
    motif: "lantern",
    openingFeel: "Storm pressure builds before a bright atmospheric flash.",
  },
  sunken_treasure_chest: {
    id: "sunken_treasure_chest",
    name: "Sunken Treasure Chest",
    description: "A sea-worn treasure chest rising from the ocean floor.",
    family: "classic",
    primary: "#0EA5E9",
    secondary: "#155E75",
    accent: "#FDE68A",
    metal: "#0F766E",
    glow: "rgba(34, 211, 238, 0.2)",
    line: "#0F766E",
    motif: "bands",
    openingFeel: "Barnacles drift off as the lid rises from the deep.",
  },
  dream_box: {
    id: "dream_box",
    name: "Dream Box",
    description: "A mirrored dream reliquary with pastel light on every edge.",
    family: "mystic",
    primary: "#C084FC",
    secondary: "#8B5CF6",
    accent: "#F9A8D4",
    metal: "#FFFFFF",
    glow: "rgba(244, 114, 182, 0.22)",
    line: "#A78BFA",
    motif: "pandora",
    openingFeel: "A soft mirrored bloom spills out like a dream opening.",
  },
  void_rift: {
    id: "void_rift",
    name: "Void Rift",
    description: "A tear in reality that opens instead of a physical chest.",
    family: "mystic",
    primary: "#020617",
    secondary: "#000000",
    accent: "#FFFFFF",
    metal: "#475569",
    glow: "rgba(255, 255, 255, 0.16)",
    line: "#FFFFFF",
    motif: "portal",
    openingFeel: "Reality tears open and swallows the scene before the reveal.",
  },
  celestial_orrery: {
    id: "celestial_orrery",
    name: "Celestial Orrery",
    description: "A mechanical solar model that blooms open into the stars.",
    family: "tech",
    primary: "#1D4ED8",
    secondary: "#312E81",
    accent: "#FDE68A",
    metal: "#E0F2FE",
    glow: "rgba(196, 181, 253, 0.24)",
    line: "#93C5FD",
    motif: "portal",
    openingFeel: "Orbit rings expand as the pack detonates into a supernova.",
  },
};

export const TRAIL_EFFECTS: Record<TrailEffectId, TrailEffectDefinition> = {
  default_trail: { id: "default_trail", name: "Default", description: "Pico's classic route line.", gradient: "linear-gradient(180deg,#BBF7D0 0%,#22C55E 100%)", glow: "rgba(34,197,94,0.18)", particleColor: "#86EFAC", motion: "steady" },
  steady_glow: { id: "steady_glow", name: "Steady Glow", description: "A clean pulsing route line.", gradient: "linear-gradient(180deg,#E2E8F0 0%,#CBD5E1 100%)", glow: "rgba(148,163,184,0.18)", particleColor: "#F8FAFC", motion: "steady" },
  dashed_technical: { id: "dashed_technical", name: "Dashed Technical", description: "Measured drafting marks.", gradient: "linear-gradient(180deg,#BFDBFE 0%,#60A5FA 100%)", glow: "rgba(96,165,250,0.18)", particleColor: "#BFDBFE", motion: "stardust" },
  sketch: { id: "sketch", name: "Sketch", description: "Hand-drawn pencil energy.", gradient: "linear-gradient(180deg,#A16207 0%,#78350F 100%)", glow: "rgba(161,98,7,0.14)", particleColor: "#D6B88C", motion: "wisps" },
  chalk: { id: "chalk", name: "Chalk", description: "Smudged chalk dust line.", gradient: "linear-gradient(180deg,#F8FAFC 0%,#CBD5E1 100%)", glow: "rgba(248,250,252,0.16)", particleColor: "#F8FAFC", motion: "stardust" },
  expedition_dots: { id: "expedition_dots", name: "Expedition Dots", description: "A dotted route made for explorers.", gradient: "linear-gradient(180deg,#D97706 0%,#B45309 100%)", glow: "rgba(217,119,6,0.16)", particleColor: "#FDE68A", motion: "stardust" },
  neon_pulse: { id: "neon_pulse", name: "Neon Pulse", description: "A neon route with an alternating glow.", gradient: "linear-gradient(180deg,#22D3EE 0%,#EC4899 100%)", glow: "rgba(34,211,238,0.22)", particleColor: "#67E8F9", motion: "arc" },
  vine: { id: "vine", name: "Vine", description: "A rooted green connector.", gradient: "linear-gradient(180deg,#65A30D 0%,#16A34A 100%)", glow: "rgba(132,204,22,0.18)", particleColor: "#86EFAC", motion: "petals" },
  pixel: { id: "pixel", name: "Pixel", description: "Chunky 8-bit path light.", gradient: "linear-gradient(180deg,#F97316 0%,#FACC15 100%)", glow: "rgba(249,115,22,0.18)", particleColor: "#FDE68A", motion: "stardust" },
  rain: { id: "rain", name: "Rain", description: "A sharp monochrome line under rainfall.", gradient: "linear-gradient(180deg,#E5E7EB 0%,#94A3B8 100%)", glow: "rgba(229,231,235,0.12)", particleColor: "#E5E7EB", motion: "wisps" },
  origami: { id: "origami", name: "Origami", description: "Angular folded route segments.", gradient: "linear-gradient(180deg,#CBD5E1 0%,#94A3B8 100%)", glow: "rgba(148,163,184,0.14)", particleColor: "#E2E8F0", motion: "wave" },
  aurora: { id: "aurora", name: "Aurora", description: "A soft shifting aurora line.", gradient: "linear-gradient(180deg,#34D399 0%,#60A5FA 100%)", glow: "rgba(52,211,153,0.16)", particleColor: "#A7F3D0", motion: "wave" },
  electric_current: { id: "electric_current", name: "Electric Current", description: "Charged current runs down the route.", gradient: "linear-gradient(180deg,#22D3EE 0%,#8B5CF6 100%)", glow: "rgba(34,211,238,0.22)", particleColor: "#67E8F9", motion: "arc" },
  bubble_stream: { id: "bubble_stream", name: "Bubble Stream", description: "Bubble clusters rise along the route.", gradient: "linear-gradient(180deg,#67E8F9 0%,#0EA5E9 100%)", glow: "rgba(34,211,238,0.16)", particleColor: "#E0F2FE", motion: "bubbles" },
  ink_stroke: { id: "ink_stroke", name: "Ink Stroke", description: "A brush-painted connector.", gradient: "linear-gradient(180deg,#DC2626 0%,#991B1B 100%)", glow: "rgba(220,38,38,0.14)", particleColor: "#FCA5A5", motion: "wisps" },
  scarab_track: { id: "scarab_track", name: "Scarab Track", description: "A dotted gold procession line.", gradient: "linear-gradient(180deg,#EAB308 0%,#F59E0B 100%)", glow: "rgba(234,179,8,0.18)", particleColor: "#FDE68A", motion: "stardust" },
  ice_growth: { id: "ice_growth", name: "Ice Growth", description: "A frosted line that grows outward.", gradient: "linear-gradient(180deg,#E0F2FE 0%,#60A5FA 100%)", glow: "rgba(96,165,250,0.2)", particleColor: "#F8FAFC", motion: "frost" },
  root_vine: { id: "root_vine", name: "Root Vine", description: "A rooted jungle connector.", gradient: "linear-gradient(180deg,#84CC16 0%,#166534 100%)", glow: "rgba(132,204,22,0.18)", particleColor: "#BEF264", motion: "petals" },
  lava_flow: { id: "lava_flow", name: "Lava Flow", description: "A molten connector with ember drift.", gradient: "linear-gradient(180deg,#F97316 0%,#B91C1C 100%)", glow: "rgba(249,115,22,0.22)", particleColor: "#FDBA74", motion: "embers" },
  constellation: { id: "constellation", name: "Constellation", description: "A star-linked route line.", gradient: "linear-gradient(180deg,#C4B5FD 0%,#38BDF8 100%)", glow: "rgba(59,130,246,0.18)", particleColor: "#F8FAFC", motion: "constellation" },
  forest_path: { id: "forest_path", name: "Forest Path", description: "A mossy living trail.", gradient: "linear-gradient(180deg,#65A30D 0%,#22C55E 100%)", glow: "rgba(34,197,94,0.18)", particleColor: "#BEF264", motion: "petals" },
  gear_track: { id: "gear_track", name: "Gear Track", description: "A mechanical connector with ticking energy.", gradient: "linear-gradient(180deg,#F59E0B 0%,#B45309 100%)", glow: "rgba(245,158,11,0.2)", particleColor: "#FDE68A", motion: "stardust" },
  lightning_zigzag: { id: "lightning_zigzag", name: "Lightning Zigzag", description: "A jagged storm connector.", gradient: "linear-gradient(180deg,#E2E8F0 0%,#38BDF8 100%)", glow: "rgba(56,189,248,0.2)", particleColor: "#E0F2FE", motion: "arc" },
  crystal_bridge: { id: "crystal_bridge", name: "Crystal Bridge", description: "Refraction shimmers through the route.", gradient: "linear-gradient(180deg,#C4B5FD 0%,#60A5FA 100%)", glow: "rgba(196,181,253,0.18)", particleColor: "#E9D5FF", motion: "constellation" },
  wake: { id: "wake", name: "Wake", description: "A watery wake trail.", gradient: "linear-gradient(180deg,#E0F2FE 0%,#22D3EE 100%)", glow: "rgba(224,242,254,0.18)", particleColor: "#E0F2FE", motion: "bubbles" },
  dream_ribbon: { id: "dream_ribbon", name: "Dream Ribbon", description: "A rainbow bridge through the air.", gradient: "linear-gradient(180deg,#F9A8D4 0%,#C084FC 48%,#93C5FD 100%)", glow: "rgba(244,114,182,0.18)", particleColor: "#FDE68A", motion: "wave" },
  void_thread: { id: "void_thread", name: "Void Thread", description: "A thin thread of light through darkness.", gradient: "linear-gradient(180deg,#FFFFFF 0%,#CBD5E1 100%)", glow: "rgba(255,255,255,0.18)", particleColor: "#F8FAFC", motion: "wisps" },
  celestial_constellation: { id: "celestial_constellation", name: "Celestial Constellation", description: "A living constellation line.", gradient: "linear-gradient(180deg,#E0F2FE 0%,#C4B5FD 40%,#22D3EE 100%)", glow: "rgba(196,181,253,0.22)", particleColor: "#F8FAFC", motion: "constellation" },
};

export const NODE_EFFECTS: Record<NodeEffectId, NodeEffectDefinition> = {
  default_nodes: { id: "default_nodes", name: "Default", description: "A subtle completion sparkle.", accent: "#86EFAC", particleColor: "#DCFCE7", motion: "none" },
  glow_drift: { id: "glow_drift", name: "Glow Drift", description: "Floating neon motes.", accent: "#67E8F9", particleColor: "#A5F3FC", motion: "float" },
  sparkles: { id: "sparkles", name: "Sparkles", description: "Sharp clean glints.", accent: "#FDE68A", particleColor: "#FEF3C7", motion: "twinkle" },
  chalk_dust: { id: "chalk_dust", name: "Chalk Dust", description: "Soft classroom chalk puffs.", accent: "#F8FAFC", particleColor: "#E2E8F0", motion: "fall" },
  petals: { id: "petals", name: "Petals", description: "Soft drifting petals.", accent: "#F9A8D4", particleColor: "#FBCFE8", motion: "fall" },
  snowflakes: { id: "snowflakes", name: "Snowflakes", description: "Tiny falling flakes.", accent: "#E0F2FE", particleColor: "#F8FAFC", motion: "fall" },
  bubbles: { id: "bubbles", name: "Bubbles", description: "Water bubbles rise upward.", accent: "#E0F2FE", particleColor: "#BAE6FD", motion: "rise" },
  fireflies: { id: "fireflies", name: "Fireflies", description: "Warm floating points of light.", accent: "#FDE68A", particleColor: "#FEF08A", motion: "float" },
  wisps: { id: "wisps", name: "Wisps", description: "Soft spectral traces.", accent: "#DDD6FE", particleColor: "#E9D5FF", motion: "float" },
  ink_splash: { id: "ink_splash", name: "Ink Splash", description: "Expressive brush splashes.", accent: "#F87171", particleColor: "#FCA5A5", motion: "rise" },
  gold_dust: { id: "gold_dust", name: "Gold Dust", description: "Bright granular gold.", accent: "#FDE68A", particleColor: "#FDE68A", motion: "twinkle" },
  embers: { id: "embers", name: "Embers", description: "Rising ember sparks.", accent: "#FDBA74", particleColor: "#FED7AA", motion: "rise" },
  leaves: { id: "leaves", name: "Leaves", description: "Soft falling leaves.", accent: "#86EFAC", particleColor: "#BBF7D0", motion: "fall" },
  pixel_burst: { id: "pixel_burst", name: "Pixel Burst", description: "Chunky sprite particles.", accent: "#FACC15", particleColor: "#FDE68A", motion: "twinkle" },
  storm_shock: { id: "storm_shock", name: "Storm Shock", description: "Charged storm flashes.", accent: "#93C5FD", particleColor: "#E0F2FE", motion: "twinkle" },
  crystal_shards: { id: "crystal_shards", name: "Crystal Shards", description: "Shard-like glints fly outward.", accent: "#C4B5FD", particleColor: "#DDD6FE", motion: "rise" },
  foam_burst: { id: "foam_burst", name: "Foam Burst", description: "Watery foam spray.", accent: "#E0F2FE", particleColor: "#FFFFFF", motion: "rise" },
  dream_stars: { id: "dream_stars", name: "Dream Stars", description: "Soft starry bubbles.", accent: "#F9A8D4", particleColor: "#E9D5FF", motion: "float" },
  void_particles: { id: "void_particles", name: "Void Particles", description: "White dust disappearing into black.", accent: "#F8FAFC", particleColor: "#F8FAFC", motion: "twinkle" },
  supernova: { id: "supernova", name: "Supernova", description: "A bright space burst.", accent: "#93C5FD", particleColor: "#FFFFFF", motion: "twinkle" },
};

export const PROFILE_BORDERS: Record<ProfileBorderId, ProfileBorderDefinition> = {
  aurora_border: { id: "aurora_border", name: "Aurora Loop", description: "A soft shifting aurora ring.", gradient: "linear-gradient(135deg,#22D3EE 0%,#8B5CF6 50%,#EC4899 100%)", glow: "rgba(34,211,238,0.24)", animation: "spin" },
  ember_border: { id: "ember_border", name: "Ember Crown", description: "Warm ember ring with a deep orange core.", gradient: "linear-gradient(135deg,#F97316 0%,#DC2626 100%)", glow: "rgba(249,115,22,0.24)", animation: "pulse" },
  moonlit_border: { id: "moonlit_border", name: "Moonlit Halo", description: "Silver-violet lunar border.", gradient: "linear-gradient(135deg,#CBD5E1 0%,#A78BFA 100%)", glow: "rgba(167,139,250,0.18)", animation: "shimmer" },
  tidal_border: { id: "tidal_border", name: "Tidal Ring", description: "Blue-green current with ocean sheen.", gradient: "linear-gradient(135deg,#22D3EE 0%,#0EA5E9 100%)", glow: "rgba(34,211,238,0.22)", animation: "spin" },
  pixel_border: { id: "pixel_border", name: "Pixel Frame", description: "Blocky arcade border with hard corners.", gradient: "linear-gradient(135deg,#F97316 0%,#FACC15 100%)", glow: "rgba(250,204,21,0.18)", animation: "pulse" },
};

export const TITLE_BADGES: Record<TitleBadgeId, TitleBadgeDefinition> = {
  streak_lord: { id: "streak_lord", name: "Streak Lord", description: "For relentless consistency.", tone: "linear-gradient(135deg,#F97316 0%,#FACC15 100%)", glow: "rgba(249,115,22,0.2)" },
  gem_hoarder: { id: "gem_hoarder", name: "Gem Hoarder", description: "A title for players who never miss the loot.", tone: "linear-gradient(135deg,#06B6D4 0%,#38BDF8 100%)", glow: "rgba(6,182,212,0.2)" },
  perfect_run: { id: "perfect_run", name: "Perfect Run", description: "Reserved for precise lesson streaks.", tone: "linear-gradient(135deg,#A855F7 0%,#EC4899 100%)", glow: "rgba(168,85,247,0.2)" },
  chest_hunter: { id: "chest_hunter", name: "Chest Hunter", description: "For players who open every reward in sight.", tone: "linear-gradient(135deg,#F59E0B 0%,#F97316 100%)", glow: "rgba(245,158,11,0.2)" },
  scholar: { id: "scholar", name: "Scholar", description: "A calm default title for steady learners.", tone: "linear-gradient(135deg,#22C55E 0%,#16A34A 100%)", glow: "rgba(34,197,94,0.18)" },
  night_owl: { id: "night_owl", name: "Night Owl", description: "For late-night coders.", tone: "linear-gradient(135deg,#312E81 0%,#8B5CF6 100%)", glow: "rgba(139,92,246,0.18)" },
  speed_runner: { id: "speed_runner", name: "Speed Runner", description: "For players who finish fast.", tone: "linear-gradient(135deg,#FB7185 0%,#F97316 100%)", glow: "rgba(251,113,133,0.18)" },
  glitch_lord: { id: "glitch_lord", name: "Glitch Lord", description: "Legacy title from the original Cyberpunk pack.", tone: "linear-gradient(135deg,#22D3EE 0%,#EC4899 100%)", glow: "rgba(34,211,238,0.2)" },
  quest_master: { id: "quest_master", name: "Quest Master", description: "Legacy title from the original Fantasy RPG pack.", tone: "linear-gradient(135deg,#F59E0B 0%,#B45309 100%)", glow: "rgba(245,158,11,0.18)" },
  high_score: { id: "high_score", name: "High Score", description: "Legacy title from the original Retro Arcade pack.", tone: "linear-gradient(135deg,#F97316 0%,#FACC15 100%)", glow: "rgba(249,115,22,0.18)" },
  star_walker: { id: "star_walker", name: "Star Walker", description: "Legacy title from the original Space Explorer pack.", tone: "linear-gradient(135deg,#8B5CF6 0%,#38BDF8 100%)", glow: "rgba(56,189,248,0.18)" },
  deep_diver: { id: "deep_diver", name: "Deep Diver", description: "Legacy title from the original Underwater pack.", tone: "linear-gradient(135deg,#06B6D4 0%,#22D3EE 100%)", glow: "rgba(34,211,238,0.16)" },
  ghost_scholar: { id: "ghost_scholar", name: "Ghost Scholar", description: "Legacy title from the original Haunted pack.", tone: "linear-gradient(135deg,#A78BFA 0%,#64748B 100%)", glow: "rgba(167,139,250,0.16)" },
  code_ronin: { id: "code_ronin", name: "Code Ronin", description: "Legacy title from the original Samurai pack.", tone: "linear-gradient(135deg,#DC2626 0%,#7F1D1D 100%)", glow: "rgba(220,38,38,0.16)" },
};

export function mapLegacyThemeId(themeId: string | null | undefined): PathThemeId | null {
  if (!themeId) return null;
  if (themeId in PATH_THEMES) return themeId as PathThemeId;
  return LEGACY_THEME_MIGRATIONS[themeId as LegacyPathThemeId] ?? null;
}

export function getPathTheme(themeId: PathThemeId | string | null | undefined) {
  const resolved = mapLegacyThemeId(themeId);
  return PATH_THEMES[resolved ?? DEFAULT_PATH_THEME_ID] ?? PATH_THEMES[DEFAULT_PATH_THEME_ID];
}

export function getThemesForTier(tier: ThemeTier) {
  return THEMES_BY_TIER[tier];
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
