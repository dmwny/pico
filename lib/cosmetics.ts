"use client";

import {
  ChestSkinId,
  DEFAULT_CHEST_SKIN_ID,
  DEFAULT_NODE_EFFECT_ID,
  DEFAULT_PATH_THEME_ID,
  DEFAULT_TRAIL_EFFECT_ID,
  NodeEffectId,
  PathThemeId,
  ProfileBorderId,
  TitleBadgeId,
  TrailEffectId,
  CHEST_SKIN_IDS,
  CHEST_SKINS,
  NODE_EFFECT_IDS,
  NODE_EFFECTS,
  PATH_THEME_IDS,
  PATH_THEMES,
  PROFILE_BORDER_IDS,
  PROFILE_BORDERS,
  TRAIL_EFFECT_IDS,
  TITLE_BADGE_IDS,
  TITLE_BADGES,
  getPathTheme,
  getTrailEffect,
} from "@/lib/themes";

export const COSMETICS_STORAGE_VERSION = 2;
export const COSMETICS_STORAGE_PREFIX = "pico-cosmetics:";
export const PICO_COSMETICS_EVENT = "pico:cosmetics-changed";
export const STREAK_FREEZE_CAP = 3;
export const PERFECT_RUN_TOKEN_CAP = 3;
export const XP_BOOST_DURATION_MS = 60 * 60 * 1000;
export const PERFECT_RUN_BONUS_XP = 25;

export type PackId =
  | "cyberpunk_pack"
  | "fantasy_rpg_pack"
  | "retro_arcade_pack"
  | "space_explorer_pack"
  | "underwater_pack"
  | "haunted_pack"
  | "samurai_pack";

export type FunctionalProductId =
  | "streak_freeze"
  | "streak_shield_pack"
  | "xp_boost"
  | "perfect_run_token";

export type CosmeticItemKind =
  | "pathTheme"
  | "chestSkin"
  | "trailEffect"
  | "nodeEffect"
  | "profileBorder"
  | "titleBadge";

export type ShopTab = "packs" | "items" | "functional";

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

export type ShopEntryId = PackId | CosmeticItemId | FunctionalProductId;

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

export type PackDefinition = {
  id: PackId;
  name: string;
  description: string;
  price: number;
  themeId: PathThemeId;
  chestSkinId: ChestSkinId;
  trailEffectId: TrailEffectId;
  nodeEffectId: NodeEffectId;
  titleBadgeId: TitleBadgeId;
  bestValueLabel: string;
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
  packs: PackId[];
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
  streakFreezes: number;
  perfectRunTokens: number;
  activeXpBoostStartedAt: string | null;
  activeXpBoostEndsAt: string | null;
};

export type ProfileStats = {
  bestStreak: number;
  chestsOpened: number;
  gemsSpent: number;
};

export type CosmeticsState = {
  version: number;
  owned: OwnedCosmetics;
  equipped: EquippedCosmetics;
  functional: FunctionalInventory;
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
  | "unknown_entry";

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

function unique<T extends string>(values: T[]) {
  return [...new Set(values)];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function addOwnedValue<T extends string>(values: T[], value: T) {
  return unique([...values, value]);
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

const PACKS: Record<PackId, PackDefinition> = {
  cyberpunk_pack: {
    id: "cyberpunk_pack",
    name: "Cyberpunk Pack",
    description: "Neon route, vault tech chest, lightning trail, embers, and the Glitch Lord title.",
    price: 800,
    themeId: "cyberpunk",
    chestSkinId: "vault_door",
    trailEffectId: "lightning",
    nodeEffectId: "embers",
    titleBadgeId: "glitch_lord",
    bestValueLabel: "Best Value",
  },
  fantasy_rpg_pack: {
    id: "fantasy_rpg_pack",
    name: "Fantasy RPG Pack",
    description: "Parchment quest path, dragon egg chest, blossom trail, fireflies, and Quest Master.",
    price: 800,
    themeId: "fantasy_rpg",
    chestSkinId: "dragon_egg",
    trailEffectId: "cherry_blossom",
    nodeEffectId: "fireflies",
    titleBadgeId: "quest_master",
    bestValueLabel: "Best Value",
  },
  retro_arcade_pack: {
    id: "retro_arcade_pack",
    name: "Retro Arcade Pack",
    description: "8-bit path, pixel chest, stardust trail, sparkle nodes, and High Score.",
    price: 800,
    themeId: "retro_arcade",
    chestSkinId: "pixel_chest",
    trailEffectId: "stardust",
    nodeEffectId: "sparkles",
    titleBadgeId: "high_score",
    bestValueLabel: "Best Value",
  },
  space_explorer_pack: {
    id: "space_explorer_pack",
    name: "Space Explorer Pack",
    description: "Nebula route, portal chest, constellation trail, stardust nodes, and Star Walker.",
    price: 800,
    themeId: "space_explorer",
    chestSkinId: "portal",
    trailEffectId: "constellation",
    nodeEffectId: "stardust_nodes",
    titleBadgeId: "star_walker",
    bestValueLabel: "Best Value",
  },
  underwater_pack: {
    id: "underwater_pack",
    name: "Underwater Pack",
    description: "Coral route, clam chest, bubble trail, glowing fireflies, and Deep Diver.",
    price: 800,
    themeId: "underwater",
    chestSkinId: "clam_chest",
    trailEffectId: "bubble",
    nodeEffectId: "fireflies",
    titleBadgeId: "deep_diver",
    bestValueLabel: "Best Value",
  },
  haunted_pack: {
    id: "haunted_pack",
    name: "Haunted Pack",
    description: "Fog route, coffin chest, spectral trail, ember wisps, and Ghost Scholar.",
    price: 800,
    themeId: "haunted",
    chestSkinId: "coffin_chest",
    trailEffectId: "ghost",
    nodeEffectId: "embers",
    titleBadgeId: "ghost_scholar",
    bestValueLabel: "Best Value",
  },
  samurai_pack: {
    id: "samurai_pack",
    name: "Samurai Pack",
    description: "Ink path, lacquered box, fire trail, falling leaves, and Code Ronin.",
    price: 800,
    themeId: "samurai",
    chestSkinId: "lacquered_box",
    trailEffectId: "fire",
    nodeEffectId: "leaves",
    titleBadgeId: "code_ronin",
    bestValueLabel: "Best Value",
  },
};

const FUNCTIONAL_PRODUCTS: Record<FunctionalProductId, FunctionalProductDefinition> = {
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
};

const PATH_THEME_PRICES: Record<PathThemeId, number> = {
  default: 0,
  cyberpunk: 500,
  fantasy_rpg: 500,
  retro_arcade: 500,
  space_explorer: 500,
  underwater: 500,
  haunted: 500,
  samurai: 500,
};

const CHEST_SKIN_PRICES: Partial<Record<ChestSkinId, number>> = {
  default_chest: 0,
  vault_door: 240,
  classic_treasure: 240,
  pixel_chest: 240,
  alien_pod: 260,
  clam_chest: 240,
  coffin_chest: 240,
  lacquered_box: 240,
  dragon_egg: 260,
  magic_lantern: 240,
  geode: 240,
  pandoras_box: 260,
  portal: 260,
};

const TRAIL_EFFECT_PRICES: Record<TrailEffectId, number> = {
  default_trail: 0,
  fire: 170,
  ice: 170,
  lightning: 180,
  cherry_blossom: 180,
  stardust: 180,
  rainbow: 190,
  constellation: 180,
  bubble: 170,
  ghost: 170,
};

const NODE_EFFECT_PRICES: Record<NodeEffectId, number> = {
  default_nodes: 0,
  fireflies: 140,
  snowflakes: 140,
  embers: 140,
  sparkles: 150,
  leaves: 140,
  stardust_nodes: 150,
};

const PROFILE_BORDER_PRICES: Record<ProfileBorderId, number> = {
  aurora_border: 220,
  ember_border: 220,
  moonlit_border: 220,
  tidal_border: 220,
  pixel_border: 220,
};

const TITLE_BADGE_PRICES: Partial<Record<TitleBadgeId, number>> = {
  streak_lord: 160,
  gem_hoarder: 160,
  perfect_run: 160,
  chest_hunter: 160,
  scholar: 0,
  night_owl: 160,
  speed_runner: 160,
};

const PACK_EXCLUSIVE_BADGES = new Set<TitleBadgeId>([
  "glitch_lord",
  "quest_master",
  "high_score",
  "star_walker",
  "deep_diver",
  "ghost_scholar",
  "code_ronin",
]);

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
      price: PATH_THEME_PRICES[themeId],
      free: themeId === DEFAULT_PATH_THEME_ID,
      accent: theme.accentColor,
      previewThemeId: themeId,
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
      price: CHEST_SKIN_PRICES[skinId] ?? 240,
      free: skinId === DEFAULT_CHEST_SKIN_ID,
      accent: skin.accent,
      previewThemeId:
        skinId === "vault_door"
          ? "cyberpunk"
          : skinId === "classic_treasure" || skinId === "dragon_egg" || skinId === "magic_lantern"
            ? "fantasy_rpg"
            : skinId === "pixel_chest"
              ? "retro_arcade"
              : skinId === "alien_pod" || skinId === "portal"
                ? "space_explorer"
                : skinId === "clam_chest"
                  ? "underwater"
                  : skinId === "coffin_chest" || skinId === "pandoras_box"
                    ? "haunted"
                    : skinId === "lacquered_box"
                      ? "samurai"
                      : "default",
    });
  });

  TRAIL_EFFECT_IDS.forEach((effectId) => {
    const effect = getTrailEffect(effectId);
    items.push({
      id: createTrailEffectItemId(effectId),
      kind: "trailEffect",
      assetId: effectId,
      name: effect.name,
      description: effect.description,
      price: TRAIL_EFFECT_PRICES[effectId],
      free: effectId === DEFAULT_TRAIL_EFFECT_ID,
      accent: effect.particleColor,
      previewThemeId:
        effectId === "lightning"
          ? "cyberpunk"
          : effectId === "cherry_blossom"
            ? "fantasy_rpg"
            : effectId === "stardust" || effectId === "constellation"
              ? "space_explorer"
              : effectId === "bubble"
                ? "underwater"
                : effectId === "ghost"
                  ? "haunted"
                  : effectId === "fire"
                    ? "samurai"
                    : "default",
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
      price: NODE_EFFECT_PRICES[effectId],
      free: effectId === DEFAULT_NODE_EFFECT_ID,
      accent: effect.accent,
      previewThemeId:
        effectId === "embers"
          ? "cyberpunk"
          : effectId === "fireflies"
            ? "fantasy_rpg"
            : effectId === "sparkles"
              ? "retro_arcade"
              : effectId === "stardust_nodes"
                ? "space_explorer"
                : effectId === "leaves"
                  ? "samurai"
                  : "default",
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
      price: PROFILE_BORDER_PRICES[borderId],
      accent: border.glow,
    });
  });

  TITLE_BADGE_IDS.forEach((badgeId) => {
    const badge = TITLE_BADGES[badgeId];
    const price = TITLE_BADGE_PRICES[badgeId];

    items.push({
      id: createTitleBadgeItemId(badgeId),
      kind: "titleBadge",
      assetId: badgeId,
      name: badge.name,
      description: badge.description,
      price: price ?? 0,
      free: badgeId === "scholar",
      accent: badge.glow,
      previewThemeId:
        badgeId === "glitch_lord"
          ? "cyberpunk"
          : badgeId === "quest_master"
            ? "fantasy_rpg"
            : badgeId === "high_score"
              ? "retro_arcade"
              : badgeId === "star_walker"
                ? "space_explorer"
                : badgeId === "deep_diver"
                  ? "underwater"
                  : badgeId === "ghost_scholar"
                    ? "haunted"
                    : badgeId === "code_ronin"
                      ? "samurai"
                      : "default",
      packOnly: PACK_EXCLUSIVE_BADGES.has(badgeId),
    });
  });

  return items;
}

export const SHOP_PACKS = Object.values(PACKS);
export const SHOP_FUNCTIONAL_PRODUCTS = Object.values(FUNCTIONAL_PRODUCTS);
export const SHOP_COSMETIC_ITEMS = buildCatalogItems();
export const SHOP_VISIBLE_ITEMS = SHOP_COSMETIC_ITEMS.filter((item) => !item.packOnly);
export const SHOP_ENTRY_BY_ID = new Map<ShopEntryId, PackDefinition | CosmeticCatalogItem | FunctionalProductDefinition>([
  ...SHOP_PACKS.map((pack) => [pack.id, pack] as const),
  ...SHOP_FUNCTIONAL_PRODUCTS.map((product) => [product.id, product] as const),
  ...SHOP_COSMETIC_ITEMS.map((item) => [item.id, item] as const),
]);

export function getPackById(packId: PackId | null | undefined) {
  return packId ? PACKS[packId] ?? null : null;
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
    owned: {
      packs: [],
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
      streakFreezes: 0,
      perfectRunTokens: 0,
      activeXpBoostStartedAt: null,
      activeXpBoostEndsAt: null,
    },
    stats: {
      bestStreak: 0,
      chestsOpened: 0,
      gemsSpent: 0,
    },
  };
}

function safeStringArray<T extends string>(value: unknown, validValues: readonly T[]) {
  if (!Array.isArray(value)) return [];
  const valid = new Set(validValues);
  return value.filter((entry): entry is T => typeof entry === "string" && valid.has(entry as T));
}

export function sanitizeCosmeticsState(value: unknown): CosmeticsState {
  const defaults = getDefaultCosmeticsState();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Partial<CosmeticsState>;
  const owned = raw.owned ?? defaults.owned;
  const equipped = raw.equipped ?? defaults.equipped;
  const functional = raw.functional ?? defaults.functional;
  const stats = raw.stats ?? defaults.stats;

  const sanitizedOwned: OwnedCosmetics = {
    packs: safeStringArray(owned.packs, Object.keys(PACKS) as PackId[]),
    pathThemes: unique([DEFAULT_PATH_THEME_ID, ...safeStringArray(owned.pathThemes, PATH_THEME_IDS)]),
    chestSkins: unique([DEFAULT_CHEST_SKIN_ID, ...safeStringArray(owned.chestSkins, CHEST_SKIN_IDS)]),
    trailEffects: unique([DEFAULT_TRAIL_EFFECT_ID, ...safeStringArray(owned.trailEffects, TRAIL_EFFECT_IDS)]),
    nodeEffects: unique([DEFAULT_NODE_EFFECT_ID, ...safeStringArray(owned.nodeEffects, NODE_EFFECT_IDS)]),
    profileBorders: safeStringArray(owned.profileBorders, PROFILE_BORDER_IDS),
    titleBadges: unique(["scholar", ...safeStringArray(owned.titleBadges, TITLE_BADGE_IDS)]),
  };

  const pathThemeId = sanitizedOwned.pathThemes.includes(equipped.pathThemeId ?? DEFAULT_PATH_THEME_ID)
    ? (equipped.pathThemeId ?? DEFAULT_PATH_THEME_ID)
    : DEFAULT_PATH_THEME_ID;
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
      streakFreezes: clamp(Number(functional.streakFreezes || 0), 0, STREAK_FREEZE_CAP),
      perfectRunTokens: clamp(Number(functional.perfectRunTokens || 0), 0, PERFECT_RUN_TOKEN_CAP),
      activeXpBoostStartedAt:
        typeof functional.activeXpBoostStartedAt === "string" ? functional.activeXpBoostStartedAt : null,
      activeXpBoostEndsAt:
        typeof functional.activeXpBoostEndsAt === "string" ? functional.activeXpBoostEndsAt : null,
    },
    stats: {
      bestStreak: Math.max(0, Number(stats.bestStreak || 0)),
      chestsOpened: Math.max(0, Number(stats.chestsOpened || 0)),
      gemsSpent: Math.max(0, Number(stats.gemsSpent || 0)),
    },
  };
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
      detail: {
        userId,
        state: sanitized,
      },
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

export function isPackOwned(state: CosmeticsState, packId: PackId) {
  return state.owned.packs.includes(packId);
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

export function resolveAppearanceForPack(packId: PackId): ResolvedCosmeticAppearance {
  const pack = PACKS[packId];
  return {
    pathThemeId: pack.themeId,
    chestSkinId: pack.chestSkinId,
    trailEffectId: pack.trailEffectId,
    nodeEffectId: pack.nodeEffectId,
    profileBorderId: null,
    titleBadgeId: pack.titleBadgeId,
  };
}

function grantPack(state: CosmeticsState, pack: PackDefinition) {
  return sanitizeCosmeticsState({
    ...state,
    owned: {
      packs: addOwnedValue(state.owned.packs, pack.id),
      pathThemes: addOwnedValue(state.owned.pathThemes, pack.themeId),
      chestSkins: addOwnedValue(state.owned.chestSkins, pack.chestSkinId),
      trailEffects: addOwnedValue(state.owned.trailEffects, pack.trailEffectId),
      nodeEffects: addOwnedValue(state.owned.nodeEffects, pack.nodeEffectId),
      profileBorders: state.owned.profileBorders,
      titleBadges: addOwnedValue(state.owned.titleBadges, pack.titleBadgeId),
    },
  });
}

function grantCosmeticItem(state: CosmeticsState, item: CosmeticCatalogItem) {
  switch (item.kind) {
    case "pathTheme":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          pathThemes: addOwnedValue(state.owned.pathThemes, item.assetId as PathThemeId),
        },
      });
    case "chestSkin":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          chestSkins: addOwnedValue(state.owned.chestSkins, item.assetId as ChestSkinId),
        },
      });
    case "trailEffect":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          trailEffects: addOwnedValue(state.owned.trailEffects, item.assetId as TrailEffectId),
        },
      });
    case "nodeEffect":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          nodeEffects: addOwnedValue(state.owned.nodeEffects, item.assetId as NodeEffectId),
        },
      });
    case "profileBorder":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          profileBorders: addOwnedValue(state.owned.profileBorders, item.assetId as ProfileBorderId),
        },
      });
    case "titleBadge":
      return sanitizeCosmeticsState({
        ...state,
        owned: {
          ...state.owned,
          titleBadges: addOwnedValue(state.owned.titleBadges, item.assetId as TitleBadgeId),
        },
      });
    default:
      return state;
  }
}

export function isXpBoostActive(state: CosmeticsState, now = Date.now()) {
  const endsAt = state.functional.activeXpBoostEndsAt ? Date.parse(state.functional.activeXpBoostEndsAt) : null;
  return typeof endsAt === "number" && Number.isFinite(endsAt) && endsAt > now;
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

export function purchaseShopEntry(
  state: CosmeticsState,
  gemBalance: number,
  entryId: ShopEntryId,
  now = new Date(),
  options: {
    bypassCost?: boolean;
    trackSpend?: boolean;
  } = {},
): PurchaseResult {
  const entry = SHOP_ENTRY_BY_ID.get(entryId);
  if (!entry) {
    return {
      ok: false,
      entryId,
      reason: "unknown_entry",
      message: "This shop item no longer exists.",
    };
  }

  const price = "price" in entry ? entry.price : 0;
  const bypassCost = options.bypassCost === true;
  const trackSpend = options.trackSpend !== false;
  if (!bypassCost && gemBalance < price) {
    return {
      ok: false,
      entryId,
      reason: "insufficient_gems",
      message: "Not enough gems",
    };
  }

  if ("themeId" in entry) {
    if (isPackOwned(state, entry.id)) {
      return {
        ok: false,
        entryId,
        reason: "owned",
        message: "Already owned",
      };
    }

    const nextState = trackSpend ? withGemsSpent(grantPack(state, entry), price) : grantPack(state, entry);
    return {
      ok: true,
      entryId,
      nextState,
      nextGems: bypassCost ? gemBalance : gemBalance - price,
      spentGems: bypassCost ? 0 : price,
      grantedLabel: entry.name,
    };
  }

  if ("kind" in entry) {
    if (isCosmeticOwned(state, entry)) {
      return {
        ok: false,
        entryId,
        reason: "owned",
        message: "Already owned",
      };
    }

    const nextState = trackSpend ? withGemsSpent(grantCosmeticItem(state, entry), price) : grantCosmeticItem(state, entry);
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
      return {
        ok: false,
        entryId,
        reason: "cap_reached",
        message: `Freeze cap reached (${STREAK_FREEZE_CAP})`,
      };
    }

    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        streakFreezes: clamp(state.functional.streakFreezes + 1, 0, STREAK_FREEZE_CAP),
      },
    });
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

  if (entry.id === "streak_shield_pack") {
    if (state.functional.streakFreezes > 0) {
      return {
        ok: false,
        entryId,
        reason: "bundle_waste",
        message: "Use your current freezes first",
      };
    }

    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        streakFreezes: STREAK_FREEZE_CAP,
      },
    });
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

  if (entry.id === "xp_boost") {
    if (isXpBoostActive(state, now.getTime())) {
      return {
        ok: false,
        entryId,
        reason: "already_active",
        message: "Boost already active",
      };
    }

    const startedAt = now.toISOString();
    const endsAt = new Date(now.getTime() + XP_BOOST_DURATION_MS).toISOString();
    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        activeXpBoostStartedAt: startedAt,
        activeXpBoostEndsAt: endsAt,
      },
    });
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

  if (entry.id === "perfect_run_token") {
    if (state.functional.perfectRunTokens >= PERFECT_RUN_TOKEN_CAP) {
      return {
        ok: false,
        entryId,
        reason: "cap_reached",
        message: `Token cap reached (${PERFECT_RUN_TOKEN_CAP})`,
      };
    }

    const rawState = sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        perfectRunTokens: clamp(state.functional.perfectRunTokens + 1, 0, PERFECT_RUN_TOKEN_CAP),
      },
    });
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

  return {
    ok: false,
    entryId,
    reason: "unknown_entry",
    message: "This shop item no longer exists.",
  };
}

export function equipPackBundle(state: CosmeticsState, packId: PackId) {
  const pack = PACKS[packId];
  if (!pack || !state.owned.packs.includes(packId)) return state;

  return sanitizeCosmeticsState({
    ...state,
    equipped: {
      ...state.equipped,
      pathThemeId: pack.themeId,
      chestSkinId: pack.chestSkinId,
      trailEffectId: pack.trailEffectId,
      nodeEffectId: pack.nodeEffectId,
      titleBadgeId: pack.titleBadgeId,
    },
  });
}

export function equipCosmeticItem(state: CosmeticsState, itemId: CosmeticItemId) {
  const item = getCosmeticItemById(itemId);
  if (!item || !isCosmeticOwned(state, item)) return state;

  switch (item.kind) {
    case "pathTheme":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          pathThemeId: item.assetId as PathThemeId,
        },
      });
    case "chestSkin":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          chestSkinId: item.assetId as ChestSkinId,
        },
      });
    case "trailEffect":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          trailEffectId: item.assetId as TrailEffectId,
        },
      });
    case "nodeEffect":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          nodeEffectId: item.assetId as NodeEffectId,
        },
      });
    case "profileBorder":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          profileBorderId: item.assetId as ProfileBorderId,
        },
      });
    case "titleBadge":
      return sanitizeCosmeticsState({
        ...state,
        equipped: {
          ...state.equipped,
          titleBadgeId: item.assetId as TitleBadgeId,
        },
      });
    default:
      return state;
  }
}

export function consumeStreakFreeze(state: CosmeticsState) {
  if (state.functional.streakFreezes <= 0) {
    return {
      nextState: state,
      consumed: false,
    };
  }

  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        streakFreezes: state.functional.streakFreezes - 1,
      },
    }),
    consumed: true,
  };
}

export function consumePerfectRunToken(state: CosmeticsState) {
  if (state.functional.perfectRunTokens <= 0) {
    return {
      nextState: state,
      consumed: false,
    };
  }

  return {
    nextState: sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        perfectRunTokens: state.functional.perfectRunTokens - 1,
      },
    }),
    consumed: true,
  };
}

export function syncBestStreak(state: CosmeticsState, streak: number) {
  if (streak <= state.stats.bestStreak) return state;

  return sanitizeCosmeticsState({
    ...state,
    stats: {
      ...state.stats,
      bestStreak: streak,
    },
  });
}

export function recordChestOpened(state: CosmeticsState, count = 1) {
  if (count <= 0) return state;

  return sanitizeCosmeticsState({
    ...state,
    stats: {
      ...state.stats,
      chestsOpened: state.stats.chestsOpened + count,
    },
  });
}

export function syncOpenedChestFloor(state: CosmeticsState, totalOpened: number) {
  if (totalOpened <= state.stats.chestsOpened) return state;

  return sanitizeCosmeticsState({
    ...state,
    stats: {
      ...state.stats,
      chestsOpened: totalOpened,
    },
  });
}

export function clearExpiredXpBoost(state: CosmeticsState, now = Date.now()) {
  if (!isXpBoostActive(state, now) && (state.functional.activeXpBoostEndsAt || state.functional.activeXpBoostStartedAt)) {
    return sanitizeCosmeticsState({
      ...state,
      functional: {
        ...state.functional,
        activeXpBoostStartedAt: null,
        activeXpBoostEndsAt: null,
      },
    });
  }

  return state;
}

export function formatBoostCountdown(remainingMs: number) {
  const safe = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getPreviewAppearanceForItem(item: CosmeticCatalogItem): ResolvedCosmeticAppearance {
  const themeId = item.previewThemeId ?? DEFAULT_PATH_THEME_ID;
  const theme = getPathTheme(themeId);

  if (item.kind === "pathTheme") {
    return {
      pathThemeId: item.assetId as PathThemeId,
      chestSkinId: getPathTheme(item.assetId as PathThemeId).chestSkin,
      trailEffectId: getPathTheme(item.assetId as PathThemeId).trailEffect,
      nodeEffectId: getPathTheme(item.assetId as PathThemeId).particleEffect,
      profileBorderId: null,
      titleBadgeId: null,
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

export function getFeaturedPackForDate(date = new Date()) {
  const index = date.getDate() % SHOP_PACKS.length;
  return SHOP_PACKS[index];
}
