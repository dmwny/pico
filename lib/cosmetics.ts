"use client";

import {
  CHEST_SKIN_IDS,
  CHEST_SKINS,
  ChestSkinId,
  DEFAULT_CHEST_SKIN_ID,
  DEFAULT_NODE_EFFECT_ID,
  DEFAULT_PATH_THEME_ID,
  DEFAULT_TRAIL_EFFECT_ID,
  getPathTheme,
  LEGACY_THEME_MIGRATIONS,
  mapLegacyThemeId,
  NODE_EFFECT_IDS,
  NODE_EFFECTS,
  NodeEffectId,
  PATH_THEME_IDS,
  PathThemeId,
  PATH_THEMES,
  PROFILE_BORDER_IDS,
  PROFILE_BORDERS,
  ProfileBorderId,
  THEME_TIER_ORDER,
  THEMES_BY_TIER,
  ThemeTier,
  TITLE_BADGE_IDS,
  TITLE_BADGES,
  TitleBadgeId,
  TRAIL_EFFECT_IDS,
  TRAIL_EFFECTS,
  TrailEffectId,
} from "@/lib/themes";

export const COSMETICS_STORAGE_VERSION = 3;
export const COSMETICS_STORAGE_PREFIX = "pico-cosmetics:";
export const COSMETICS_REMOTE_TABLE = "pico_cosmetics";
export const PICO_COSMETICS_EVENT = "pico:cosmetics-changed";
export const STREAK_FREEZE_CAP = 3;
export const PERFECT_RUN_TOKEN_CAP = 3;
export const HEART_REFILL_CAP = 5;
export const HINT_TOKEN_CAP = 10;
export const XP_BOOST_DURATION_MS = 60 * 60 * 1000;
export const UNLIMITED_HEARTS_DURATION_MS = 24 * 60 * 60 * 1000;
export const PERFECT_RUN_BONUS_XP = 25;
const DEFAULT_MUTATION_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export type PackId = "basic_pack" | "premium_pack" | "legendary_pack" | "mythic_pack";

export type FunctionalProductId =
  | "heart_refill"
  | "streak_freeze"
  | "streak_shield_pack"
  | "xp_boost"
  | "perfect_run_token"
  | "unlimited_hearts_pass"
  | "hint_token";

export type CosmeticItemKind =
  | "pathTheme"
  | "chestSkin"
  | "trailEffect"
  | "nodeEffect"
  | "profileBorder"
  | "titleBadge";

export type ShopTab = "packs" | "collection" | "functional";

export type PathThemeItemId = `pathTheme:${PathThemeId}`;
export type ChestSkinItemId = `chestSkin:${ChestSkinId}`;
export type TrailEffectItemId = `trailEffect:${TrailEffectId}`;
export type NodeEffectItemId = `nodeEffect:${NodeEffectId}`;
export type ProfileBorderItemId = `profileBorder:${ProfileBorderId}`;
export type TitleBadgeItemId = `titleBadge:${TitleBadgeId}`;
export type CosmeticItemId =
  | PathThemeItemId
  | ChestSkinItemId
  | TrailEffectItemId
  | NodeEffectItemId
  | ProfileBorderItemId
  | TitleBadgeItemId;

export type ShopEntryId = CosmeticItemId | FunctionalProductId;

export type CosmeticCatalogItem = {
  id: CosmeticItemId;
  kind: CosmeticItemKind;
  assetId: string;
  name: string;
  description: string;
  price: number;
  free?: boolean;
  accent: string;
  previewThemeId?: PathThemeId;
  packOnly?: boolean;
};

export type ThemePackOdds = Record<ThemeTier, number>;

export type ThemePackDefinition = {
  id: PackId;
  name: string;
  description: string;
  price: number;
  odds: ThemePackOdds;
  pityLabel: string;
  pityThreshold: number | null;
  guaranteeTier: ThemeTier | null;
  completionCompensation: number;
  exampleThemeIds: [PathThemeId, PathThemeId, PathThemeId];
  heroThemeId: PathThemeId;
};

export type FunctionalProductDefinition = {
  id: FunctionalProductId;
  name: string;
  description: string;
  price: number;
  accent: string;
  limitLabel: string;
};

export type OwnedCosmetics = {
  pathThemes: PathThemeId[];
  chestSkins: ChestSkinId[];
  trailEffects: TrailEffectId[];
  nodeEffects: NodeEffectId[];
  profileBorders: ProfileBorderId[];
  titleBadges: TitleBadgeId[];
};

export type EquippedCosmetics = {
  pathThemeId: PathThemeId;
  chestSkinId: ChestSkinId | null;
  trailEffectId: TrailEffectId | null;
  nodeEffectId: NodeEffectId | null;
  profileBorderId: ProfileBorderId | null;
  titleBadgeId: TitleBadgeId | null;
};

export type FunctionalInventory = {
  heartRefills: number;
  hintTokens: number;
  streakFreezes: number;
  perfectRunTokens: number;
  activeXpBoostStartedAt: string | null;
  activeXpBoostEndsAt: string | null;
  activeUnlimitedHeartsStartedAt: string | null;
  activeUnlimitedHeartsEndsAt: string | null;
};

export type ThemePackPityState = Record<
  PackId,
  {
    totalPulls: number;
    sinceLegendary: number;
    sinceMythic: number;
  }
>;

export type ProfileStats = {
  bestStreak: number;
  chestsOpened: number;
  gemsSpent: number;
};

export type CosmeticsState = {
  version: number;
  lastMutatedAt: string;
  owned: OwnedCosmetics;
  equipped: EquippedCosmetics;
  functional: FunctionalInventory;
  pity: ThemePackPityState;
  stats: ProfileStats;
};

export type ResolvedCosmeticAppearance = {
  pathThemeId: PathThemeId;
  chestSkinId: ChestSkinId;
  trailEffectId: TrailEffectId;
  nodeEffectId: NodeEffectId;
  profileBorderId: ProfileBorderId | null;
  titleBadgeId: TitleBadgeId | null;
};

export type CosmeticsChangeDetail = {
  userId: string;
  state: CosmeticsState;
};

export type PurchaseFailureReason =
  | "owned"
  | "insufficient_gems"
  | "cap_reached"
  | "already_active"
  | "bundle_waste"
  | "unknown_entry"
  | "pack_only";

export type PurchaseResult =
  | {
      ok: true;
      entryId: ShopEntryId;
      nextState: CosmeticsState;
      nextGems: number;
      spentGems: number;
      grantedLabel: string;
    }
  | {
      ok: false;
      reason: PurchaseFailureReason;
      entryId: ShopEntryId;
      message: string;
    };

export type ThemeRollResult = {
  themeId: PathThemeId | null;
  theme: ReturnType<typeof getPathTheme> | null;
  rarity: ThemeTier;
  wasGuaranteed: boolean;
  duplicateCompensationGems: number;
  newPityState: ThemePackPityState;
};

export type OpenThemePackResult =
  | {
      ok: true;
      pack: ThemePackDefinition;
      roll: ThemeRollResult;
      nextState: CosmeticsState;
      nextGems: number;
      spentGems: number;
    }
  | {
      ok: false;
      reason: "insufficient_gems" | "unknown_pack";
      packId: PackId;
      message: string;
    };

export type SuccessfulThemePackOpenResult = Extract<OpenThemePackResult, { ok: true }>;

const THEME_PACKS: Record<PackId, ThemePackDefinition> = {
  basic_pack: {
    id: "basic_pack",
    name: "Basic Pack",
    description: "Cheap pulls with a huge Common lean and a slim Epic chance.",
    price: 75,
    odds: { common: 0.75, rare: 0.22, epic: 0.03, legendary: 0, mythic: 0 },
    pityLabel: "No pity protection",
    pityThreshold: null,
    guaranteeTier: null,
    completionCompensation: 75,
    exampleThemeIds: ["midnight", "paper_craft", "retro_arcade"],
    heroThemeId: "paper_craft",
  },
  premium_pack: {
    id: "premium_pack",
    name: "Premium Pack",
    description: "The balanced pull: strong Rare odds, real Epic density, and Legendary pity.",
    price: 250,
    odds: { common: 0.25, rare: 0.45, epic: 0.25, legendary: 0.045, mythic: 0.005 },
    pityLabel: "Guaranteed Legendary after 50 without one",
    pityThreshold: 50,
    guaranteeTier: "legendary",
    completionCompensation: 250,
    exampleThemeIds: ["synthwave", "cyberpunk_city", "enchanted_forest"],
    heroThemeId: "synthwave",
  },
  legendary_pack: {
    id: "legendary_pack",
    name: "Legendary Pack",
    description: "High-tier pulls only, with Mythic pity protecting long dry streaks.",
    price: 700,
    odds: { common: 0, rare: 0.15, epic: 0.45, legendary: 0.35, mythic: 0.05 },
    pityLabel: "Guaranteed Mythic after 25 without one",
    pityThreshold: 25,
    guaranteeTier: "mythic",
    completionCompensation: 700,
    exampleThemeIds: ["haunted_mansion", "crystal_cavern", "celestial"],
    heroThemeId: "crystal_cavern",
  },
  mythic_pack: {
    id: "mythic_pack",
    name: "Mythic Pack",
    description: "No low-tier filler, loaded with Legendary pulls and the best Mythic odds.",
    price: 1800,
    odds: { common: 0, rare: 0, epic: 0.25, legendary: 0.6, mythic: 0.15 },
    pityLabel: "Guaranteed Mythic after 15 without one",
    pityThreshold: 15,
    guaranteeTier: "mythic",
    completionCompensation: 1800,
    exampleThemeIds: ["the_dreamscape", "the_void", "celestial"],
    heroThemeId: "celestial",
  },
};

const FUNCTIONAL_PRODUCTS: Record<FunctionalProductId, FunctionalProductDefinition> = {
  heart_refill: {
    id: "heart_refill",
    name: "Heart Refill",
    description: "Restore a full set of 5 hearts during a failed lesson.",
    price: 200,
    accent: "#F87171",
    limitLabel: `Hold up to ${HEART_REFILL_CAP}`,
  },
  streak_freeze: {
    id: "streak_freeze",
    name: "Streak Freeze",
    description: "Protects your streak for exactly one missed day.",
    price: 150,
    accent: "#38BDF8",
    limitLabel: `Hold up to ${STREAK_FREEZE_CAP}`,
  },
  streak_shield_pack: {
    id: "streak_shield_pack",
    name: "Streak Shield Pack",
    description: "Grants 3 streak freezes at a discount.",
    price: 350,
    accent: "#22C55E",
    limitLabel: "Only available when you have 0 freezes",
  },
  xp_boost: {
    id: "xp_boost",
    name: "XP Boost",
    description: "2x XP for one hour, activated immediately.",
    price: 200,
    accent: "#A855F7",
    limitLabel: "Cannot stack while active",
  },
  perfect_run_token: {
    id: "perfect_run_token",
    name: "Perfect Run Token",
    description: "Turn a mistake-filled lesson into a perfect result and claim the bonus XP.",
    price: 100,
    accent: "#F59E0B",
    limitLabel: `Hold up to ${PERFECT_RUN_TOKEN_CAP}`,
  },
  unlimited_hearts_pass: {
    id: "unlimited_hearts_pass",
    name: "Unlimited Hearts Pass",
    description: "No heart loss for 24 hours. Can also be activated with 1 Perfect Run Token.",
    price: 500,
    accent: "#FB7185",
    limitLabel: "Cannot stack while active",
  },
  hint_token: {
    id: "hint_token",
    name: "Hint Token",
    description: "Covers one paid hint in a lesson without costing a heart.",
    price: 100,
    accent: "#FACC15",
    limitLabel: `Hold up to ${HINT_TOKEN_CAP}`,
  },
};

const LEGACY_PACK_GRANTS = {
  cyberpunk_pack: { themeId: LEGACY_THEME_MIGRATIONS.cyberpunk, chestSkinId: "vault_door", trailEffectId: "electric_current", nodeEffectId: "embers", titleBadgeId: "glitch_lord" },
  fantasy_rpg_pack: { themeId: LEGACY_THEME_MIGRATIONS.fantasy_rpg, chestSkinId: "classic_treasure", trailEffectId: "expedition_dots", nodeEffectId: "fireflies", titleBadgeId: "quest_master" },
  retro_arcade_pack: { themeId: LEGACY_THEME_MIGRATIONS.retro_arcade, chestSkinId: "arcade_prize_chest", trailEffectId: "pixel", nodeEffectId: "pixel_burst", titleBadgeId: "high_score" },
  space_explorer_pack: { themeId: LEGACY_THEME_MIGRATIONS.space_explorer, chestSkinId: "alien_pod", trailEffectId: "constellation", nodeEffectId: "supernova", titleBadgeId: "star_walker" },
  underwater_pack: { themeId: LEGACY_THEME_MIGRATIONS.underwater, chestSkinId: "clam_chest", trailEffectId: "bubble_stream", nodeEffectId: "bubbles", titleBadgeId: "deep_diver" },
  haunted_pack: { themeId: LEGACY_THEME_MIGRATIONS.haunted, chestSkinId: "coffin_chest", trailEffectId: "default_trail", nodeEffectId: "wisps", titleBadgeId: "ghost_scholar" },
  samurai_pack: { themeId: LEGACY_THEME_MIGRATIONS.samurai, chestSkinId: "lacquered_box", trailEffectId: "ink_stroke", nodeEffectId: "leaves", titleBadgeId: "code_ronin" },
} as const;

const DEFAULT_PITY_STATE: ThemePackPityState = {
  basic_pack: { totalPulls: 0, sinceLegendary: 0, sinceMythic: 0 },
  premium_pack: { totalPulls: 0, sinceLegendary: 0, sinceMythic: 0 },
  legendary_pack: { totalPulls: 0, sinceLegendary: 0, sinceMythic: 0 },
  mythic_pack: { totalPulls: 0, sinceLegendary: 0, sinceMythic: 0 },
};

function unique<T extends string>(values: T[]) {
  return [...new Set(values)];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeMutationTimestamp(value: unknown) {
  if (typeof value !== "string") return DEFAULT_MUTATION_TIMESTAMP;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : DEFAULT_MUTATION_TIMESTAMP;
}

function addOwnedValue<T extends string>(values: T[], value: T) {
  return unique([...values, value]);
}

function safeThemeArray(value: unknown) {
  if (!Array.isArray(value)) return [] as PathThemeId[];

  return unique(
    value.flatMap((entry) => {
      if (typeof entry !== "string") return [];
      const mapped = mapLegacyThemeId(entry);
      return mapped ? [mapped] : [];
    }),
  );
}

function safeStringArray<T extends string>(value: unknown, validValues: readonly T[]) {
  if (!Array.isArray(value)) return [] as T[];
  const valid = new Set(validValues);
  return value.filter((entry): entry is T => typeof entry === "string" && valid.has(entry as T));
}

function sanitizePityState(value: unknown): ThemePackPityState {
  if (!value || typeof value !== "object") return DEFAULT_PITY_STATE;
  const raw = value as Partial<ThemePackPityState>;

  return {
    basic_pack: {
      totalPulls: Math.max(0, Number(raw.basic_pack?.totalPulls ?? 0)),
      sinceLegendary: 0,
      sinceMythic: 0,
    },
    premium_pack: {
      totalPulls: Math.max(0, Number(raw.premium_pack?.totalPulls ?? 0)),
      sinceLegendary: Math.max(0, Number(raw.premium_pack?.sinceLegendary ?? 0)),
      sinceMythic: 0,
    },
    legendary_pack: {
      totalPulls: Math.max(0, Number(raw.legendary_pack?.totalPulls ?? 0)),
      sinceLegendary: 0,
      sinceMythic: Math.max(0, Number(raw.legendary_pack?.sinceMythic ?? 0)),
    },
    mythic_pack: {
      totalPulls: Math.max(0, Number(raw.mythic_pack?.totalPulls ?? 0)),
      sinceLegendary: 0,
      sinceMythic: Math.max(0, Number(raw.mythic_pack?.sinceMythic ?? 0)),
    },
  };
}

export function getCosmeticsStorageKey(userId: string) {
  return `${COSMETICS_STORAGE_PREFIX}${userId}`;
}

export function createPathThemeItemId(themeId: PathThemeId): PathThemeItemId {
  return `pathTheme:${themeId}`;
}

export function createChestSkinItemId(skinId: ChestSkinId): ChestSkinItemId {
  return `chestSkin:${skinId}`;
}

export function createTrailEffectItemId(effectId: TrailEffectId): TrailEffectItemId {
  return `trailEffect:${effectId}`;
}

export function createNodeEffectItemId(effectId: NodeEffectId): NodeEffectItemId {
  return `nodeEffect:${effectId}`;
}

export function createProfileBorderItemId(borderId: ProfileBorderId): ProfileBorderItemId {
  return `profileBorder:${borderId}`;
}

export function createTitleBadgeItemId(badgeId: TitleBadgeId): TitleBadgeItemId {
  return `titleBadge:${badgeId}`;
}

function buildCatalogItems() {
  const items: CosmeticCatalogItem[] = [];

  PATH_THEME_IDS.forEach((themeId) => {
    const theme = PATH_THEMES[themeId];
    items.push({
      id: createPathThemeItemId(themeId),
      kind: "pathTheme",
      assetId: themeId,
      name: theme.name,
      description: theme.description,
      price: 0,
      free: themeId === DEFAULT_PATH_THEME_ID,
      accent: theme.previewColor,
      previewThemeId: themeId,
      packOnly: theme.packEligible,
    });
  });

  CHEST_SKIN_IDS.forEach((skinId) => {
    const skin = CHEST_SKINS[skinId];
    items.push({
      id: createChestSkinItemId(skinId),
      kind: "chestSkin",
      assetId: skinId,
      name: skin.name,
      description: skin.description,
      price: 240,
      free: skinId === DEFAULT_CHEST_SKIN_ID,
      accent: skin.accent,
      previewThemeId: DEFAULT_PATH_THEME_ID,
      packOnly: true,
    });
  });

  TRAIL_EFFECT_IDS.forEach((effectId) => {
    const effect = TRAIL_EFFECTS[effectId];
    items.push({
      id: createTrailEffectItemId(effectId),
      kind: "trailEffect",
      assetId: effectId,
      name: effect.name,
      description: effect.description,
      price: 180,
      free: effectId === DEFAULT_TRAIL_EFFECT_ID,
      accent: effect.particleColor,
      previewThemeId: DEFAULT_PATH_THEME_ID,
      packOnly: true,
    });
  });

  NODE_EFFECT_IDS.forEach((effectId) => {
    const effect = NODE_EFFECTS[effectId];
    items.push({
      id: createNodeEffectItemId(effectId),
      kind: "nodeEffect",
      assetId: effectId,
      name: effect.name,
      description: effect.description,
      price: 150,
      free: effectId === DEFAULT_NODE_EFFECT_ID,
      accent: effect.accent,
      previewThemeId: DEFAULT_PATH_THEME_ID,
      packOnly: true,
    });
  });

  PROFILE_BORDER_IDS.forEach((borderId) => {
    const border = PROFILE_BORDERS[borderId];
    items.push({
      id: createProfileBorderItemId(borderId),
      kind: "profileBorder",
      assetId: borderId,
      name: border.name,
      description: border.description,
      price: 220,
      accent: border.glow,
    });
  });

  TITLE_BADGE_IDS.forEach((badgeId) => {
    const badge = TITLE_BADGES[badgeId];
    items.push({
      id: createTitleBadgeItemId(badgeId),
      kind: "titleBadge",
      assetId: badgeId,
      name: badge.name,
      description: badge.description,
      price: badgeId === "scholar" ? 0 : 160,
      free: badgeId === "scholar",
      accent: badge.glow,
    });
  });

  return items;
}

export const SHOP_PACKS = Object.values(THEME_PACKS);
export const SHOP_FUNCTIONAL_PRODUCTS = Object.values(FUNCTIONAL_PRODUCTS);
export const SHOP_COSMETIC_ITEMS = buildCatalogItems();
export const SHOP_VISIBLE_ITEMS = SHOP_COSMETIC_ITEMS.filter((item) => !item.packOnly);

export function getPackById(packId: PackId | null | undefined) {
  return packId ? THEME_PACKS[packId] ?? null : null;
}

export function getFunctionalProductById(productId: FunctionalProductId | null | undefined) {
  return productId ? FUNCTIONAL_PRODUCTS[productId] ?? null : null;
}

export function getCosmeticItemById(itemId: CosmeticItemId | null | undefined) {
  return itemId ? SHOP_COSMETIC_ITEMS.find((item) => item.id === itemId) ?? null : null;
}

export function getDefaultCosmeticsState(): CosmeticsState {
  return {
    version: COSMETICS_STORAGE_VERSION,
    lastMutatedAt: DEFAULT_MUTATION_TIMESTAMP,
    owned: {
      pathThemes: [DEFAULT_PATH_THEME_ID],
      chestSkins: [DEFAULT_CHEST_SKIN_ID],
      trailEffects: [DEFAULT_TRAIL_EFFECT_ID],
      nodeEffects: [DEFAULT_NODE_EFFECT_ID],
      profileBorders: [],
      titleBadges: ["scholar"],
    },
    equipped: {
      pathThemeId: DEFAULT_PATH_THEME_ID,
      chestSkinId: null,
      trailEffectId: null,
      nodeEffectId: null,
      profileBorderId: null,
      titleBadgeId: "scholar",
    },
    functional: {
      heartRefills: 0,
      hintTokens: 0,
      streakFreezes: 0,
      perfectRunTokens: 0,
      activeXpBoostStartedAt: null,
      activeXpBoostEndsAt: null,
      activeUnlimitedHeartsStartedAt: null,
      activeUnlimitedHeartsEndsAt: null,
    },
    pity: DEFAULT_PITY_STATE,
    stats: {
      bestStreak: 0,
      chestsOpened: 0,
      gemsSpent: 0,
    },
  };
}

export function sanitizeCosmeticsState(value: unknown): CosmeticsState {
  const defaults = getDefaultCosmeticsState();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Partial<CosmeticsState> & {
    owned?: Partial<OwnedCosmetics> & { packs?: string[] };
    equipped?: Partial<EquippedCosmetics> & { pathThemeId?: string };
  };
  const owned = raw.owned ?? defaults.owned;
  const equipped = raw.equipped ?? defaults.equipped;
  const functional = raw.functional ?? defaults.functional;
  const stats = raw.stats ?? defaults.stats;
  const legacyPackIds = Array.isArray(raw.owned?.packs)
    ? raw.owned?.packs.filter((entry): entry is keyof typeof LEGACY_PACK_GRANTS => typeof entry === "string" && entry in LEGACY_PACK_GRANTS)
    : [];

  const legacyThemeGrants = legacyPackIds.map((packId) => LEGACY_PACK_GRANTS[packId].themeId);
  const legacyChestGrants = legacyPackIds.map((packId) => LEGACY_PACK_GRANTS[packId].chestSkinId);
  const legacyTrailGrants = legacyPackIds.map((packId) => LEGACY_PACK_GRANTS[packId].trailEffectId);
  const legacyNodeGrants = legacyPackIds.map((packId) => LEGACY_PACK_GRANTS[packId].nodeEffectId);
  const legacyBadgeGrants = legacyPackIds.map((packId) => LEGACY_PACK_GRANTS[packId].titleBadgeId);

  const sanitizedOwned: OwnedCosmetics = {
    pathThemes: unique([DEFAULT_PATH_THEME_ID, ...safeThemeArray(owned.pathThemes), ...legacyThemeGrants]),
    chestSkins: unique([DEFAULT_CHEST_SKIN_ID, ...safeStringArray(owned.chestSkins, CHEST_SKIN_IDS), ...legacyChestGrants]),
    trailEffects: unique([DEFAULT_TRAIL_EFFECT_ID, ...safeStringArray(owned.trailEffects, TRAIL_EFFECT_IDS), ...legacyTrailGrants]),
    nodeEffects: unique([DEFAULT_NODE_EFFECT_ID, ...safeStringArray(owned.nodeEffects, NODE_EFFECT_IDS), ...legacyNodeGrants]),
    profileBorders: safeStringArray(owned.profileBorders, PROFILE_BORDER_IDS),
    titleBadges: unique(["scholar", ...safeStringArray(owned.titleBadges, TITLE_BADGE_IDS), ...legacyBadgeGrants]),
  };

  const mappedEquippedTheme = mapLegacyThemeId(equipped.pathThemeId) ?? DEFAULT_PATH_THEME_ID;
  const pathThemeId = sanitizedOwned.pathThemes.includes(mappedEquippedTheme) ? mappedEquippedTheme : DEFAULT_PATH_THEME_ID;
  const chestSkinId = equipped.chestSkinId && sanitizedOwned.chestSkins.includes(equipped.chestSkinId)
    ? equipped.chestSkinId
    : null;
  const trailEffectId = equipped.trailEffectId && sanitizedOwned.trailEffects.includes(equipped.trailEffectId)
    ? equipped.trailEffectId
    : null;
  const nodeEffectId = equipped.nodeEffectId && sanitizedOwned.nodeEffects.includes(equipped.nodeEffectId)
    ? equipped.nodeEffectId
    : null;
  const profileBorderId = equipped.profileBorderId && sanitizedOwned.profileBorders.includes(equipped.profileBorderId)
    ? equipped.profileBorderId
    : null;
  const titleBadgeId = equipped.titleBadgeId && sanitizedOwned.titleBadges.includes(equipped.titleBadgeId)
    ? equipped.titleBadgeId
    : "scholar";

  return {
    version: COSMETICS_STORAGE_VERSION,
    lastMutatedAt: normalizeMutationTimestamp(raw.lastMutatedAt),
    owned: sanitizedOwned,
    equipped: {
      pathThemeId,
      chestSkinId,
      trailEffectId,
      nodeEffectId,
      profileBorderId,
      titleBadgeId,
    },
    functional: {
      heartRefills: clamp(Number(functional.heartRefills || 0), 0, HEART_REFILL_CAP),
      hintTokens: clamp(Number(functional.hintTokens || 0), 0, HINT_TOKEN_CAP),
      streakFreezes: clamp(Number(functional.streakFreezes || 0), 0, STREAK_FREEZE_CAP),
      perfectRunTokens: clamp(Number(functional.perfectRunTokens || 0), 0, PERFECT_RUN_TOKEN_CAP),
      activeXpBoostStartedAt: typeof functional.activeXpBoostStartedAt === "string" ? functional.activeXpBoostStartedAt : null,
      activeXpBoostEndsAt: typeof functional.activeXpBoostEndsAt === "string" ? functional.activeXpBoostEndsAt : null,
      activeUnlimitedHeartsStartedAt: typeof functional.activeUnlimitedHeartsStartedAt === "string"
        ? functional.activeUnlimitedHeartsStartedAt
        : null,
      activeUnlimitedHeartsEndsAt: typeof functional.activeUnlimitedHeartsEndsAt === "string"
        ? functional.activeUnlimitedHeartsEndsAt
        : null,
    },
    pity: sanitizePityState(raw.pity),
    stats: {
      bestStreak: Math.max(0, Number(stats.bestStreak || 0)),
      chestsOpened: Math.max(0, Number(stats.chestsOpened || 0)),
      gemsSpent: Math.max(0, Number(stats.gemsSpent || 0)),
    },
  };
}

export function touchCosmeticsState(state: CosmeticsState, timestamp = new Date().toISOString()) {
  return sanitizeCosmeticsState({
    ...state,
    lastMutatedAt: normalizeMutationTimestamp(timestamp),
  });
}

function getMutationTime(state: CosmeticsState) {
  return Date.parse(state.lastMutatedAt) || 0;
}

function getMergedXpBoostWindow(localFunctional: FunctionalInventory, remoteFunctional: FunctionalInventory) {
  const localEndsAt = localFunctional.activeXpBoostEndsAt ? Date.parse(localFunctional.activeXpBoostEndsAt) : 0;
  const remoteEndsAt = remoteFunctional.activeXpBoostEndsAt ? Date.parse(remoteFunctional.activeXpBoostEndsAt) : 0;
  const winner = localEndsAt >= remoteEndsAt ? localFunctional : remoteFunctional;

  return {
    activeXpBoostStartedAt: winner.activeXpBoostStartedAt,
    activeXpBoostEndsAt: winner.activeXpBoostEndsAt,
  };
}

function getMergedUnlimitedHeartsWindow(localFunctional: FunctionalInventory, remoteFunctional: FunctionalInventory) {
  const localEndsAt = localFunctional.activeUnlimitedHeartsEndsAt ? Date.parse(localFunctional.activeUnlimitedHeartsEndsAt) : 0;
  const remoteEndsAt = remoteFunctional.activeUnlimitedHeartsEndsAt ? Date.parse(remoteFunctional.activeUnlimitedHeartsEndsAt) : 0;
  const winner = localEndsAt >= remoteEndsAt ? localFunctional : remoteFunctional;

  return {
    activeUnlimitedHeartsStartedAt: winner.activeUnlimitedHeartsStartedAt,
    activeUnlimitedHeartsEndsAt: winner.activeUnlimitedHeartsEndsAt,
  };
}

export function mergeCosmeticsStates(localState: CosmeticsState, remoteState: CosmeticsState | null | undefined) {
  const local = sanitizeCosmeticsState(localState);
  const remote = sanitizeCosmeticsState(remoteState ?? getDefaultCosmeticsState());
  const localTime = getMutationTime(local);
  const remoteTime = getMutationTime(remote);
  const latestEquipped = localTime >= remoteTime ? local.equipped : remote.equipped;

  return sanitizeCosmeticsState({
    version: COSMETICS_STORAGE_VERSION,
    lastMutatedAt: localTime >= remoteTime ? local.lastMutatedAt : remote.lastMutatedAt,
    owned: {
      pathThemes: unique([...local.owned.pathThemes, ...remote.owned.pathThemes]),
      chestSkins: unique([...local.owned.chestSkins, ...remote.owned.chestSkins]),
      trailEffects: unique([...local.owned.trailEffects, ...remote.owned.trailEffects]),
      nodeEffects: unique([...local.owned.nodeEffects, ...remote.owned.nodeEffects]),
      profileBorders: unique([...local.owned.profileBorders, ...remote.owned.profileBorders]),
      titleBadges: unique([...local.owned.titleBadges, ...remote.owned.titleBadges]),
    },
    equipped: latestEquipped,
    functional: {
      heartRefills: Math.max(local.functional.heartRefills, remote.functional.heartRefills),
      hintTokens: Math.max(local.functional.hintTokens, remote.functional.hintTokens),
      streakFreezes: Math.max(local.functional.streakFreezes, remote.functional.streakFreezes),
      perfectRunTokens: Math.max(local.functional.perfectRunTokens, remote.functional.perfectRunTokens),
      ...getMergedXpBoostWindow(local.functional, remote.functional),
      ...getMergedUnlimitedHeartsWindow(local.functional, remote.functional),
    },
    pity: {
      basic_pack: {
        totalPulls: Math.max(local.pity.basic_pack.totalPulls, remote.pity.basic_pack.totalPulls),
        sinceLegendary: 0,
        sinceMythic: 0,
      },
      premium_pack: {
        totalPulls: Math.max(local.pity.premium_pack.totalPulls, remote.pity.premium_pack.totalPulls),
        sinceLegendary: Math.max(local.pity.premium_pack.sinceLegendary, remote.pity.premium_pack.sinceLegendary),
        sinceMythic: 0,
      },
      legendary_pack: {
        totalPulls: Math.max(local.pity.legendary_pack.totalPulls, remote.pity.legendary_pack.totalPulls),
        sinceLegendary: 0,
        sinceMythic: Math.max(local.pity.legendary_pack.sinceMythic, remote.pity.legendary_pack.sinceMythic),
      },
      mythic_pack: {
        totalPulls: Math.max(local.pity.mythic_pack.totalPulls, remote.pity.mythic_pack.totalPulls),
        sinceLegendary: 0,
        sinceMythic: Math.max(local.pity.mythic_pack.sinceMythic, remote.pity.mythic_pack.sinceMythic),
      },
    },
    stats: {
      bestStreak: Math.max(local.stats.bestStreak, remote.stats.bestStreak),
      chestsOpened: Math.max(local.stats.chestsOpened, remote.stats.chestsOpened),
      gemsSpent: Math.max(local.stats.gemsSpent, remote.stats.gemsSpent),
    },
  });
}

export function areCosmeticsStatesEqual(left: CosmeticsState | null | undefined, right: CosmeticsState | null | undefined) {
  return JSON.stringify(sanitizeCosmeticsState(left ?? getDefaultCosmeticsState()))
    === JSON.stringify(sanitizeCosmeticsState(right ?? getDefaultCosmeticsState()));
}

export function getStoredCosmeticsState(userId: string) {
  if (typeof window === "undefined") return getDefaultCosmeticsState();
  try {
    const raw = window.localStorage.getItem(getCosmeticsStorageKey(userId));
    if (!raw) return getDefaultCosmeticsState();
    return sanitizeCosmeticsState(JSON.parse(raw));
  } catch {
    return getDefaultCosmeticsState();
  }
}

export function setStoredCosmeticsState(userId: string, state: CosmeticsState) {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeCosmeticsState(state);
  window.localStorage.setItem(getCosmeticsStorageKey(userId), JSON.stringify(sanitized));
  window.dispatchEvent(
    new CustomEvent<CosmeticsChangeDetail>(PICO_COSMETICS_EVENT, {
      detail: { userId, state: sanitized },
    }),
  );
}

export function isCosmeticOwned(state: CosmeticsState, item: CosmeticCatalogItem) {
  switch (item.kind) {
    case "pathTheme":
      return state.owned.pathThemes.includes(item.assetId as PathThemeId);
    case "chestSkin":
      return state.owned.chestSkins.includes(item.assetId as ChestSkinId);
    case "trailEffect":
      return state.owned.trailEffects.includes(item.assetId as TrailEffectId);
    case "nodeEffect":
      return state.owned.nodeEffects.includes(item.assetId as NodeEffectId);
    case "profileBorder":
      return state.owned.profileBorders.includes(item.assetId as ProfileBorderId);
    case "titleBadge":
      return state.owned.titleBadges.includes(item.assetId as TitleBadgeId);
    default:
      return false;
  }
}

export function isCosmeticEquipped(state: CosmeticsState, item: CosmeticCatalogItem) {
  switch (item.kind) {
    case "pathTheme":
      return state.equipped.pathThemeId === item.assetId;
    case "chestSkin":
      return (state.equipped.chestSkinId ?? DEFAULT_CHEST_SKIN_ID) === item.assetId;
    case "trailEffect":
      return (state.equipped.trailEffectId ?? DEFAULT_TRAIL_EFFECT_ID) === item.assetId;
    case "nodeEffect":
      return (state.equipped.nodeEffectId ?? DEFAULT_NODE_EFFECT_ID) === item.assetId;
    case "profileBorder":
      return state.equipped.profileBorderId === item.assetId;
    case "titleBadge":
      return state.equipped.titleBadgeId === item.assetId;
    default:
      return false;
  }
}

export function resolveAppearance(state: CosmeticsState): ResolvedCosmeticAppearance {
  const pathTheme = getPathTheme(state.equipped.pathThemeId);
  return {
    pathThemeId: pathTheme.id,
    chestSkinId: state.equipped.chestSkinId ?? pathTheme.chestSkin,
    trailEffectId: state.equipped.trailEffectId ?? pathTheme.trailEffect,
    nodeEffectId: state.equipped.nodeEffectId ?? pathTheme.particleEffect,
    profileBorderId: state.equipped.profileBorderId,
    titleBadgeId: state.equipped.titleBadgeId,
  };
}

export function resolveAppearanceForTheme(themeId: PathThemeId): ResolvedCosmeticAppearance {
  const theme = getPathTheme(themeId);
  return {
    pathThemeId: theme.id,
    chestSkinId: theme.chestSkin,
    trailEffectId: theme.trailEffect,
    nodeEffectId: theme.particleEffect,
    profileBorderId: null,
    titleBadgeId: theme.featuredTitleBadgeId,
  };
}

export function getPreviewAppearanceForItem(item: CosmeticCatalogItem): ResolvedCosmeticAppearance {
  const themeId = item.previewThemeId ?? DEFAULT_PATH_THEME_ID;
  const theme = getPathTheme(themeId);

  if (item.kind === "pathTheme") {
    const targetTheme = getPathTheme(item.assetId as PathThemeId);
    return {
      pathThemeId: targetTheme.id,
      chestSkinId: targetTheme.chestSkin,
      trailEffectId: targetTheme.trailEffect,
      nodeEffectId: targetTheme.particleEffect,
      profileBorderId: null,
      titleBadgeId: targetTheme.featuredTitleBadgeId,
    };
  }

  return {
    pathThemeId: theme.id,
    chestSkinId: item.kind === "chestSkin" ? (item.assetId as ChestSkinId) : theme.chestSkin,
    trailEffectId: item.kind === "trailEffect" ? (item.assetId as TrailEffectId) : theme.trailEffect,
    nodeEffectId: item.kind === "nodeEffect" ? (item.assetId as NodeEffectId) : theme.particleEffect,
    profileBorderId: item.kind === "profileBorder" ? (item.assetId as ProfileBorderId) : null,
    titleBadgeId: item.kind === "titleBadge" ? (item.assetId as TitleBadgeId) : theme.featuredTitleBadgeId,
  };
}

export function isXpBoostActive(state: CosmeticsState, now = Date.now()) {
  const endsAt = state.functional.activeXpBoostEndsAt ? Date.parse(state.functional.activeXpBoostEndsAt) : null;
  return typeof endsAt === "number" && Number.isFinite(endsAt) && endsAt > now;
}

export function isUnlimitedHeartsActive(state: CosmeticsState, now = Date.now()) {
  const endsAt = state.functional.activeUnlimitedHeartsEndsAt ? Date.parse(state.functional.activeUnlimitedHeartsEndsAt) : null;
  const passActive = typeof endsAt === "number" && Number.isFinite(endsAt) && endsAt > now;
  return passActive || isXpBoostActive(state, now);
}

function withGemsSpent(state: CosmeticsState, spentGems: number) {
  if (spentGems <= 0) return state;
  return sanitizeCosmeticsState({
    ...state,
    stats: {
      ...state.stats,
      gemsSpent: state.stats.gemsSpent + spentGems,
    },
  });
}

export function getXpBoostRemainingMs(state: CosmeticsState, now = Date.now()) {
  const endsAt = state.functional.activeXpBoostEndsAt ? Date.parse(state.functional.activeXpBoostEndsAt) : null;
  if (!endsAt || !Number.isFinite(endsAt)) return 0;
  return Math.max(0, endsAt - now);
}

export function getUnlimitedHeartsRemainingMs(state: CosmeticsState, now = Date.now()) {
  const endsAt = state.functional.activeUnlimitedHeartsEndsAt ? Date.parse(state.functional.activeUnlimitedHeartsEndsAt) : null;
  if (!endsAt || !Number.isFinite(endsAt)) return 0;
  return Math.max(0, endsAt - now);
}

function rollWeightedTier(pack: ThemePackDefinition, rng: () => number) {
  const normalizedEntries = (Object.entries(pack.odds) as [ThemeTier, number][])
    .filter(([, weight]) => weight > 0);
  let threshold = rng();
  for (const [tier, weight] of normalizedEntries) {
    threshold -= weight;
    if (threshold <= 0) return tier;
  }
  return normalizedEntries[normalizedEntries.length - 1][0];
}

function pickThemeForTier(targetTier: ThemeTier, ownedThemes: PathThemeId[], rng: () => number) {
  const targetIndex = THEME_TIER_ORDER.indexOf(targetTier);
  const tiersToCheck = [
    ...THEME_TIER_ORDER.slice(targetIndex),
    ...[...THEME_TIER_ORDER.slice(0, targetIndex)].reverse(),
  ];

  for (const tier of tiersToCheck) {
    const available = THEMES_BY_TIER[tier]
      .map((theme) => theme.id)
      .filter((themeId) => !ownedThemes.includes(themeId));

    if (available.length > 0) {
      const index = Math.floor(rng() * available.length);
      return getPathTheme(available[index]);
    }
  }

  return null;
}

function updatePityState(packId: PackId, pityState: ThemePackPityState, rarity: ThemeTier, wasGuaranteed: boolean) {
  const next = sanitizePityState(pityState);
  next[packId].totalPulls += 1;

  if (packId === "premium_pack") {
    next.premium_pack.sinceLegendary = rarity === "legendary" || rarity === "mythic" || wasGuaranteed
      ? 0
      : next.premium_pack.sinceLegendary + 1;
  }

  if (packId === "legendary_pack") {
    next.legendary_pack.sinceMythic = rarity === "mythic" || wasGuaranteed
      ? 0
      : next.legendary_pack.sinceMythic + 1;
  }

  if (packId === "mythic_pack") {
    next.mythic_pack.sinceMythic = rarity === "mythic" || wasGuaranteed
      ? 0
      : next.mythic_pack.sinceMythic + 1;
  }

  return next;
}

function shouldTriggerPity(packId: PackId, pityState: ThemePackPityState) {
  const threshold = THEME_PACKS[packId].pityThreshold;
  if (!threshold) return false;
  if (packId === "premium_pack") return pityState.premium_pack.sinceLegendary >= threshold - 1;
  if (packId === "legendary_pack") return pityState.legendary_pack.sinceMythic >= threshold - 1;
  if (packId === "mythic_pack") return pityState.mythic_pack.sinceMythic >= threshold - 1;
  return false;
}

export function rollTheme(
  packType: PackId,
  ownedThemes: PathThemeId[],
  pityState: ThemePackPityState,
  rng: () => number = Math.random,
): ThemeRollResult {
  const pack = THEME_PACKS[packType];
  const guaranteed = shouldTriggerPity(packType, pityState);
  const rolledTier = guaranteed && pack.guaranteeTier ? pack.guaranteeTier : rollWeightedTier(pack, rng);
  const theme = pickThemeForTier(rolledTier, ownedThemes, rng);
  const nextPityState = updatePityState(packType, pityState, theme?.tier ?? rolledTier, guaranteed);

  if (!theme) {
    return {
      themeId: null,
      theme: null,
      rarity: rolledTier,
      wasGuaranteed: guaranteed,
      duplicateCompensationGems: pack.completionCompensation,
      newPityState: nextPityState,
    };
  }

  return {
    themeId: theme.id,
    theme,
    rarity: theme.tier,
    wasGuaranteed: guaranteed,
    duplicateCompensationGems: 0,
    newPityState: nextPityState,
  };
}

function grantTheme(state: CosmeticsState, themeId: PathThemeId) {
  const theme = getPathTheme(themeId);
  return sanitizeCosmeticsState({
    ...state,
    owned: {
      ...state.owned,
      pathThemes: addOwnedValue(state.owned.pathThemes, theme.id),
      chestSkins: addOwnedValue(state.owned.chestSkins, theme.chestSkin),
      trailEffects: addOwnedValue(state.owned.trailEffects, theme.trailEffect),
      nodeEffects: addOwnedValue(state.owned.nodeEffects, theme.particleEffect),
      titleBadges: theme.featuredTitleBadgeId ? addOwnedValue(state.owned.titleBadges, theme.featuredTitleBadgeId) : state.owned.titleBadges,
    },
  });
}

export function openThemePackPurchase(
  state: CosmeticsState,
  gemBalance: number,
  packId: PackId,
  now = new Date(),
  options: {
    bypassCost?: boolean;
    trackSpend?: boolean;
    rng?: () => number;
  } = {},
): OpenThemePackResult {
  const pack = THEME_PACKS[packId];
  if (!pack) {
    return { ok: false, packId, reason: "unknown_pack", message: "This pack no longer exists." };
  }

  const bypassCost = options.bypassCost === true;
  const trackSpend = options.trackSpend !== false;
  if (!bypassCost && gemBalance < pack.price) {
    return { ok: false, packId, reason: "insufficient_gems", message: "Not enough gems" };
  }

  const roll = rollTheme(pack.id, state.owned.pathThemes, state.pity, options.rng ?? Math.random);
  let nextState = sanitizeCosmeticsState({
    ...state,
    pity: roll.newPityState,
  });

  if (roll.themeId) {
    nextState = grantTheme(nextState, roll.themeId);
  }

  if (trackSpend && !bypassCost) {
    nextState = withGemsSpent(nextState, pack.price);
  }

  const compensation = roll.duplicateCompensationGems;
  const nextGems = bypassCost ? gemBalance + compensation : gemBalance - pack.price + compensation;
  void now;

  return {
    ok: true,
    pack,
    roll,
    nextState,
    nextGems,
    spentGems: bypassCost ? 0 : pack.price,
  };
}

export function purchaseShopEntry(
  state: CosmeticsState,
  gemBalance: number,
  entryId: ShopEntryId,
  now = new Date(),
  options: { bypassCost?: boolean; trackSpend?: boolean } = {},
): PurchaseResult {
  const entry = getFunctionalProductById(entryId as FunctionalProductId) ?? getCosmeticItemById(entryId as CosmeticItemId);
  if (!entry) {
    return { ok: false, entryId, reason: "unknown_entry", message: "This shop item no longer exists." };
  }

  const price = entry.price;
  const bypassCost = options.bypassCost === true;
  const trackSpend = options.trackSpend !== false;
  if (!bypassCost && gemBalance < price) {
    return { ok: false, entryId, reason: "insufficient_gems", message: "Not enough gems" };
  }

  if ("kind" in entry) {
    if (entry.kind === "pathTheme") {
      return {
        ok: false,
        entryId,
        reason: "pack_only",
        message: "Path themes are discovered through packs now.",
      };
    }

    if (isCosmeticOwned(state, entry)) {
      return { ok: false, entryId, reason: "owned", message: "Already owned" };
    }

    const rawState = grantLegacyCosmeticItem(state, entry);
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return {
      ok: true,
      entryId,
      nextState,
      nextGems: bypassCost ? gemBalance : gemBalance - price,
      spentGems: bypassCost ? 0 : price,
      grantedLabel: entry.name,
    };
  }

  if (entry.id === "streak_freeze") {
    if (state.functional.streakFreezes >= STREAK_FREEZE_CAP) {
      return { ok: false, entryId, reason: "cap_reached", message: `Freeze cap reached (${STREAK_FREEZE_CAP})` };
    }

    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, streakFreezes: clamp(state.functional.streakFreezes + 1, 0, STREAK_FREEZE_CAP) },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "heart_refill") {
    if (state.functional.heartRefills >= HEART_REFILL_CAP) {
      return { ok: false, entryId, reason: "cap_reached", message: `Heart refill cap reached (${HEART_REFILL_CAP})` };
    }
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, heartRefills: clamp(state.functional.heartRefills + 1, 0, HEART_REFILL_CAP) },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "streak_shield_pack") {
    if (state.functional.streakFreezes > 0) {
      return { ok: false, entryId, reason: "bundle_waste", message: "Use your current freezes first" };
    }

    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, streakFreezes: STREAK_FREEZE_CAP },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "xp_boost") {
    if (isXpBoostActive(state, now.getTime())) {
      return { ok: false, entryId, reason: "already_active", message: "Boost already active" };
    }
    const startedAt = now.toISOString();
    const endsAt = new Date(now.getTime() + XP_BOOST_DURATION_MS).toISOString();
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, activeXpBoostStartedAt: startedAt, activeXpBoostEndsAt: endsAt },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "perfect_run_token") {
    if (state.functional.perfectRunTokens >= PERFECT_RUN_TOKEN_CAP) {
      return { ok: false, entryId, reason: "cap_reached", message: `Token cap reached (${PERFECT_RUN_TOKEN_CAP})` };
    }
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, perfectRunTokens: clamp(state.functional.perfectRunTokens + 1, 0, PERFECT_RUN_TOKEN_CAP) },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "unlimited_hearts_pass") {
    if (isUnlimitedHeartsActive(state, now.getTime())) {
      return { ok: false, entryId, reason: "already_active", message: "Unlimited hearts already active" };
    }
    const startedAt = now.toISOString();
    const endsAt = new Date(now.getTime() + UNLIMITED_HEARTS_DURATION_MS).toISOString();
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        activeUnlimitedHeartsStartedAt: startedAt,
        activeUnlimitedHeartsEndsAt: endsAt,
      },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  if (entry.id === "hint_token") {
    if (state.functional.hintTokens >= HINT_TOKEN_CAP) {
      return { ok: false, entryId, reason: "cap_reached", message: `Hint token cap reached (${HINT_TOKEN_CAP})` };
    }
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, hintTokens: clamp(state.functional.hintTokens + 1, 0, HINT_TOKEN_CAP) },
    });
    const nextState = trackSpend ? withGemsSpent(rawState, price) : rawState;
    return { ok: true, entryId, nextState, nextGems: bypassCost ? gemBalance : gemBalance - price, spentGems: bypassCost ? 0 : price, grantedLabel: entry.name };
  }

  return { ok: false, entryId, reason: "unknown_entry", message: "This shop item no longer exists." };
}

function grantLegacyCosmeticItem(state: CosmeticsState, item: CosmeticCatalogItem) {
  switch (item.kind) {
    case "chestSkin":
      return sanitizeCosmeticsState({ ...state, owned: { ...state.owned, chestSkins: addOwnedValue(state.owned.chestSkins, item.assetId as ChestSkinId) } });
    case "trailEffect":
      return sanitizeCosmeticsState({ ...state, owned: { ...state.owned, trailEffects: addOwnedValue(state.owned.trailEffects, item.assetId as TrailEffectId) } });
    case "nodeEffect":
      return sanitizeCosmeticsState({ ...state, owned: { ...state.owned, nodeEffects: addOwnedValue(state.owned.nodeEffects, item.assetId as NodeEffectId) } });
    case "profileBorder":
      return sanitizeCosmeticsState({ ...state, owned: { ...state.owned, profileBorders: addOwnedValue(state.owned.profileBorders, item.assetId as ProfileBorderId) } });
    case "titleBadge":
      return sanitizeCosmeticsState({ ...state, owned: { ...state.owned, titleBadges: addOwnedValue(state.owned.titleBadges, item.assetId as TitleBadgeId) } });
    default:
      return state;
  }
}

export function equipTheme(state: CosmeticsState, themeId: PathThemeId) {
  if (!state.owned.pathThemes.includes(themeId)) return state;
  return sanitizeCosmeticsState({
    ...state,
    equipped: {
      ...state.equipped,
      pathThemeId: themeId,
      chestSkinId: null,
      trailEffectId: null,
      nodeEffectId: null,
    },
  });
}

export function equipCosmeticItem(state: CosmeticsState, itemId: CosmeticItemId) {
  const item = getCosmeticItemById(itemId);
  if (!item || !isCosmeticOwned(state, item)) return state;

  switch (item.kind) {
    case "pathTheme":
      return equipTheme(state, item.assetId as PathThemeId);
    case "chestSkin":
      return sanitizeCosmeticsState({ ...state, equipped: { ...state.equipped, chestSkinId: item.assetId as ChestSkinId } });
    case "trailEffect":
      return sanitizeCosmeticsState({ ...state, equipped: { ...state.equipped, trailEffectId: item.assetId as TrailEffectId } });
    case "nodeEffect":
      return sanitizeCosmeticsState({ ...state, equipped: { ...state.equipped, nodeEffectId: item.assetId as NodeEffectId } });
    case "profileBorder":
      return sanitizeCosmeticsState({ ...state, equipped: { ...state.equipped, profileBorderId: item.assetId as ProfileBorderId } });
    case "titleBadge":
      return sanitizeCosmeticsState({ ...state, equipped: { ...state.equipped, titleBadgeId: item.assetId as TitleBadgeId } });
    default:
      return state;
  }
}

export function consumeStreakFreeze(state: CosmeticsState) {
  if (state.functional.streakFreezes <= 0) return { nextState: state, consumed: false };
  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, streakFreezes: state.functional.streakFreezes - 1 },
    }),
    consumed: true,
  };
}

export function restoreStreakFreeze(state: CosmeticsState) {
  if (state.functional.streakFreezes >= STREAK_FREEZE_CAP) return state;
  return sanitizeCosmeticsState({
    ...state,
    functional: {
      ...state.functional,
      streakFreezes: state.functional.streakFreezes + 1,
    },
  });
}

export function setStreakFreezeCount(state: CosmeticsState, count: number) {
  return sanitizeCosmeticsState({
    ...state,
    functional: {
      ...state.functional,
      streakFreezes: clamp(count, 0, STREAK_FREEZE_CAP),
    },
  });
}

export function consumeHeartRefill(state: CosmeticsState) {
  if (state.functional.heartRefills <= 0) return { nextState: state, consumed: false };
  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, heartRefills: state.functional.heartRefills - 1 },
    }),
    consumed: true,
  };
}

export function consumeHintToken(state: CosmeticsState) {
  if (state.functional.hintTokens <= 0) return { nextState: state, consumed: false };
  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, hintTokens: state.functional.hintTokens - 1 },
    }),
    consumed: true,
  };
}

export function consumePerfectRunToken(state: CosmeticsState) {
  if (state.functional.perfectRunTokens <= 0) return { nextState: state, consumed: false };
  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: { ...state.functional, perfectRunTokens: state.functional.perfectRunTokens - 1 },
    }),
    consumed: true,
  };
}

export function activateUnlimitedHeartsPassWithToken(state: CosmeticsState, now = new Date()) {
  if (isUnlimitedHeartsActive(state, now.getTime())) {
    return { nextState: state, consumed: false, reason: "already_active" as const };
  }
  if (state.functional.perfectRunTokens <= 0) {
    return { nextState: state, consumed: false, reason: "missing_token" as const };
  }

  const consumedToken = consumePerfectRunToken(state);
  if (!consumedToken.consumed) {
    return { nextState: state, consumed: false, reason: "missing_token" as const };
  }

  return {
    nextState: sanitizeCosmeticsState({
      ...consumedToken.nextState,
      functional: {
        ...consumedToken.nextState.functional,
        activeUnlimitedHeartsStartedAt: now.toISOString(),
        activeUnlimitedHeartsEndsAt: new Date(now.getTime() + UNLIMITED_HEARTS_DURATION_MS).toISOString(),
      },
    }),
    consumed: true,
    reason: "activated" as const,
  };
}

export function syncBestStreak(state: CosmeticsState, streak: number) {
  if (streak <= state.stats.bestStreak) return state;
  return sanitizeCosmeticsState({ ...state, stats: { ...state.stats, bestStreak: streak } });
}

export function grantTitleBadge(state: CosmeticsState, badgeId: TitleBadgeId) {
  if (state.owned.titleBadges.includes(badgeId)) return state;
  return sanitizeCosmeticsState({
    ...state,
    owned: {
      ...state.owned,
      titleBadges: addOwnedValue(state.owned.titleBadges, badgeId),
    },
  });
}

export function recordChestOpened(state: CosmeticsState, count = 1) {
  if (count <= 0) return state;
  return sanitizeCosmeticsState({ ...state, stats: { ...state.stats, chestsOpened: state.stats.chestsOpened + count } });
}

export function syncOpenedChestFloor(state: CosmeticsState, totalOpened: number) {
  if (totalOpened <= state.stats.chestsOpened) return state;
  return sanitizeCosmeticsState({ ...state, stats: { ...state.stats, chestsOpened: totalOpened } });
}

export function clearExpiredXpBoost(state: CosmeticsState, now = Date.now()) {
  const boostExpired = !isXpBoostActive(state, now) && (state.functional.activeXpBoostEndsAt || state.functional.activeXpBoostStartedAt);
  const heartsExpired = getUnlimitedHeartsRemainingMs(state, now) <= 0
    && (state.functional.activeUnlimitedHeartsEndsAt || state.functional.activeUnlimitedHeartsStartedAt);
  if (!boostExpired && !heartsExpired) return state;

  return sanitizeCosmeticsState({
    ...state,
    functional: {
      ...state.functional,
      activeXpBoostStartedAt: boostExpired ? null : state.functional.activeXpBoostStartedAt,
      activeXpBoostEndsAt: boostExpired ? null : state.functional.activeXpBoostEndsAt,
      activeUnlimitedHeartsStartedAt: heartsExpired ? null : state.functional.activeUnlimitedHeartsStartedAt,
      activeUnlimitedHeartsEndsAt: heartsExpired ? null : state.functional.activeUnlimitedHeartsEndsAt,
    },
  });
}

export function formatBoostCountdown(remainingMs: number) {
  const safe = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getThemePackExamples(packId: PackId) {
  return THEME_PACKS[packId].exampleThemeIds.map((themeId) => getPathTheme(themeId));
}

export function getFeaturedPackForDate(date = new Date()) {
  const index = date.getDate() % SHOP_PACKS.length;
  return SHOP_PACKS[index];
}

export function getPityProgress(packId: PackId, pityState: ThemePackPityState) {
  const pack = THEME_PACKS[packId];
  if (!pack.pityThreshold || !pack.guaranteeTier) {
    return {
      current: pityState[packId].totalPulls,
      threshold: null,
      remaining: null,
      label: pack.pityLabel,
    };
  }

  const counter = packId === "premium_pack"
    ? pityState.premium_pack.sinceLegendary
    : packId === "legendary_pack"
      ? pityState.legendary_pack.sinceMythic
      : pityState.mythic_pack.sinceMythic;

  return {
    current: counter,
    threshold: pack.pityThreshold,
    remaining: Math.max(0, pack.pityThreshold - counter),
    label: pack.pityLabel,
  };
}
