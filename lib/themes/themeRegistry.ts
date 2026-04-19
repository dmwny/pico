export type ThemeGroup = "all" | "rank-reward";

export type ThemeId =
  | "default"
  | "liquid-glass"
  | "liquid-mercury"
  | "deep-space"
  | "ink-spread"
  | "sunset-cycle"
  | "grow-complexity"
  | "glitch-drift"
  | "jelly-ui"
  | "crystal-refract"
  | "circuit-board"
  | "magnetic-field"
  | "neon-noir"
  | "ember"
  | "chrome-metal"
  | "gilded"
  | "arctic"
  | "prismatic"
  | "void-crack"
  | "champions-mantle";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  group: ThemeGroup;
  price?: number;
  unlockRank?: string;
  hasJsEffects: boolean;
  swatches: string[];
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "default",
    name: "Default",
    description: "Pico’s base editorial palette.",
    group: "all",
    hasJsEffects: false,
    swatches: ["#F0EBE1", "#E8622A", "#1A1A2E"],
  },
  {
    id: "liquid-glass",
    name: "Liquid Glass",
    description: "Dark glass layers with refractive distortion.",
    group: "all",
    price: 220,
    hasJsEffects: true,
    swatches: ["#070B14", "#7EB8F7", "#E8EAF6"],
  },
  {
    id: "liquid-mercury",
    name: "Liquid Mercury",
    description: "Metallic motion with floating cards.",
    group: "all",
    price: 220,
    hasJsEffects: true,
    swatches: ["#0C0C0C", "#D4D4D4", "#EBEBEB"],
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Nebula glow and parallax drift.",
    group: "all",
    price: 260,
    hasJsEffects: true,
    swatches: ["#03010A", "#A855F7", "#DDD4F8"],
  },
  {
    id: "ink-spread",
    name: "Ink Spread",
    description: "Paper textures with ink bloom clicks.",
    group: "all",
    price: 180,
    hasJsEffects: true,
    swatches: ["#FAFAF5", "#111111", "#505050"],
  },
  {
    id: "sunset-cycle",
    name: "Sunset Cycle",
    description: "A slow day-to-night palette loop.",
    group: "all",
    price: 260,
    hasJsEffects: true,
    swatches: ["#FFF4E0", "#E8622A", "#4A1A6E"],
  },
  {
    id: "grow-complexity",
    name: "Grow Complexity",
    description: "The interface intensifies the longer you stay in flow.",
    group: "all",
    price: 240,
    hasJsEffects: true,
    swatches: ["#080808", "#00FF88", "#E0FFE8"],
  },
  {
    id: "glitch-drift",
    name: "Glitch Drift",
    description: "Courier text, RGB glitches, and drift artifacts.",
    group: "all",
    price: 220,
    hasJsEffects: true,
    swatches: ["#080808", "#FF003C", "#F0F0F0"],
  },
  {
    id: "jelly-ui",
    name: "Jelly UI",
    description: "Squishy motion and playful surfaces.",
    group: "all",
    price: 170,
    hasJsEffects: true,
    swatches: ["#FFF5EE", "#FF6B6B", "#2A1200"],
  },
  {
    id: "crystal-refract",
    name: "Crystal Refract",
    description: "Iridescent gradients and refracted highlights.",
    group: "all",
    price: 250,
    hasJsEffects: true,
    swatches: ["#EEF2FF", "#4F46E5", "#1E1B4B"],
  },
  {
    id: "circuit-board",
    name: "Circuit Board",
    description: "Terminal green over a PCB grid.",
    group: "all",
    price: 230,
    hasJsEffects: true,
    swatches: ["#0D1117", "#00FF41", "#58FF60"],
  },
  {
    id: "magnetic-field",
    name: "Magnetic Field",
    description: "UI elements lean into your cursor.",
    group: "all",
    price: 220,
    hasJsEffects: true,
    swatches: ["#1A1A30", "#818CF8", "#E0E0FF"],
  },
  {
    id: "neon-noir",
    name: "Neon Noir",
    description: "Hot neon edges on a pitch-dark frame.",
    group: "all",
    price: 240,
    hasJsEffects: true,
    swatches: ["#08080E", "#FF007A", "#E0D0F8"],
  },
  {
    id: "ember",
    name: "Ember",
    description: "Bronze-burnished embers and low firelight.",
    group: "rank-reward",
    unlockRank: "Bronze",
    hasJsEffects: false,
    swatches: ["#1C0900", "#CD7F32", "#FFD4A8"],
  },
  {
    id: "chrome-metal",
    name: "Chrome Metal",
    description: "Cold polished alloy with reflective text.",
    group: "rank-reward",
    unlockRank: "Silver",
    hasJsEffects: false,
    swatches: ["#0E0E0E", "#C8C8C8", "#F0F0F0"],
  },
  {
    id: "gilded",
    name: "Gilded",
    description: "Heavy gold trim with animated foil headings.",
    group: "rank-reward",
    unlockRank: "Gold",
    hasJsEffects: false,
    swatches: ["#080600", "#FFD700", "#FFE580"],
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Cold air, ice glass, and drifting snow.",
    group: "rank-reward",
    unlockRank: "Platinum",
    hasJsEffects: true,
    swatches: ["#EAF5FF", "#1D7FCC", "#0A2040"],
  },
  {
    id: "prismatic",
    name: "Prismatic",
    description: "A rotating rainbow spectrum for champion climbs.",
    group: "rank-reward",
    unlockRank: "Diamond",
    hasJsEffects: true,
    swatches: ["#0A0A18", "#A855F7", "#F0E8FF"],
  },
  {
    id: "void-crack",
    name: "Void Crack",
    description: "Cracked darkness with violet seams.",
    group: "rank-reward",
    unlockRank: "Obsidian",
    hasJsEffects: true,
    swatches: ["#000000", "#7C3AED", "#DCC8FF"],
  },
  {
    id: "champions-mantle",
    name: "Champion's Mantle",
    description: "Gold confetti and a winner’s glow.",
    group: "rank-reward",
    unlockRank: "Champion",
    hasJsEffects: true,
    swatches: ["#080600", "#FFD700", "#FFEC80"],
  },
];

export function getThemeDefinition(id: ThemeId) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}

const LEAGUE_TIER_ORDER = [
  "bronze",
  "silver",
  "gold",
  "sapphire",
  "ruby",
  "emerald",
  "amethyst",
  "pearl",
  "obsidian",
  "diamond",
] as const;

const THEME_UNLOCK_RANK_ALIASES: Record<string, typeof LEAGUE_TIER_ORDER[number]> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  platinum: "sapphire",
  sapphire: "sapphire",
  ruby: "ruby",
  emerald: "emerald",
  amethyst: "amethyst",
  pearl: "pearl",
  obsidian: "obsidian",
  diamond: "diamond",
  champion: "diamond",
};

export function normalizeLeagueTierName(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return THEME_UNLOCK_RANK_ALIASES[normalized] ?? "bronze";
}

export function getThemeUnlockRequirementLabel(theme: ThemeDefinition) {
  if (theme.group !== "rank-reward" || !theme.unlockRank) return null;
  const normalized = normalizeLeagueTierName(theme.unlockRank);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function isThemeUnlockedByLeague(theme: ThemeDefinition, leagueTier?: string | null, highestLeagueTier?: string | null) {
  if (theme.group !== "rank-reward" || !theme.unlockRank) return false;
  const required = LEAGUE_TIER_ORDER.indexOf(normalizeLeagueTierName(theme.unlockRank));
  const current = LEAGUE_TIER_ORDER.indexOf(normalizeLeagueTierName(leagueTier));
  const highest = LEAGUE_TIER_ORDER.indexOf(normalizeLeagueTierName(highestLeagueTier));
  return Math.max(current, highest) >= required;
}
