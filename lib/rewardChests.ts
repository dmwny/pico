import { normalizeLanguage } from "@/lib/courseContent";

export type ChestRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type RewardChestSource = "arc" | "challenge" | "unit" | "quest";
export type RewardChestState = "sealed" | "opened";
export type RewardChestRevealIntensity = "standard" | "legendary" | "mythic";

export type RewardChest = {
  id: string;
  title: string;
  source: RewardChestSource;
  sourceLabel: string;
  baseRarity: ChestRarity;
  currentRarity: ChestRarity;
  state: RewardChestState;
  awardedAt: string;
  openedAt: string | null;
  gemAmount: number | null;
  tapsUsed: number;
};

export type RewardChestOpenResult = {
  chestId: string;
  finalRarity: ChestRarity;
  gemsAwarded: number;
  tapsUsed: number;
};

export type RewardChestProgressResult = {
  chestId: string;
  currentRarity: ChestRarity;
  tapsUsed: number;
};

export type RewardChestUpgradeStep = {
  stepIndex: number;
  fromRarity: ChestRarity;
  toRarity: ChestRarity;
};

export type RewardChestPulseResult = {
  spinIndex: number;
  startingRarity: ChestRarity;
  settledRarity: ChestRarity;
  upgraded: boolean;
  finalSpin: boolean;
  nearMissRarity: ChestRarity | null;
  revealIntensity: RewardChestRevealIntensity;
  storedEnergyBefore: number;
  storedEnergyAfter: number;
  upgradeSteps: RewardChestUpgradeStep[];
};

export type RewardChestPulsePresentation = {
  chargeDurationMs: number;
  nearMissFlashMs: number;
  upgradeBurstDurationMs: number;
  settleDurationMs: number;
  chainPauseMs: number;
  confirmationDelayMs: number;
  revealStillPauseMs: number;
  finalLockPauseMs: number;
  finalImpactDurationMs: number;
  chargeEasing: string;
  impactEasing: string;
  settleEasing: string;
  sceneTempo: number;
  motionVariance: number;
};

export type RewardChestSessionSnapshot = {
  history: RewardChestPulseResult[];
  currentRarity: ChestRarity;
  storedEnergy: number;
};

const REWARD_CHEST_PREFIX = "pico-reward-chests:";

export const TOTAL_CHEST_SPINS = 4;
export const CHEST_RARITY_ORDER: ChestRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

const CHEST_PULSE_CONFIG = {
  hopeCurveByTap: [0.58, 0.44, 0.3, 0.18],
  qualityBonusByBaseRarity: {
    common: 0,
    rare: 0.06,
    epic: 0.12,
    legendary: 0.18,
    mythic: 0.24,
  } satisfies Record<ChestRarity, number>,
  sourceBonus: {
    arc: 0.03,
    challenge: 0.07,
    unit: 0.04,
    quest: 0.02,
  } satisfies Record<RewardChestSource, number>,
  rarityPenalty: {
    common: 0,
    rare: 0.09,
    epic: 0.18,
    legendary: 0.28,
    mythic: 1,
  } satisfies Record<ChestRarity, number>,
  storedEnergyBias: 0.28,
  storedEnergyGainByTap: [0.14, 0.16, 0.18, 0.2],
  storedEnergyCap: 0.5,
  storedEnergyRetentionOnUpgrade: 0.42,
  minimumUpgradeChance: 0.06,
  maximumUpgradeChance: 0.88,
  chainBaseChanceByRarity: {
    common: 0.18,
    rare: 0.14,
    epic: 0.11,
    legendary: 0.05,
    mythic: 0,
  } satisfies Record<ChestRarity, number>,
  chainTapBonusByTap: [0, 0.015, 0.03, 0.045],
  chainEnergyBias: 0.18,
  chainDepthPenalty: 0.08,
  maximumChainStepsPerTap: 3,
  minimumChainChance: 0.02,
  maximumChainChance: 0.34,
  nearMissChanceByTap: [0.48, 0.57, 0.66, 0.72],
  rewardRanges: {
    arc: {
      common: [18, 28],
      rare: [34, 52],
      epic: [72, 106],
      legendary: [146, 210],
      mythic: [280, 360],
    },
    challenge: {
      common: [0, 0],
      rare: [54, 78],
      epic: [112, 158],
      legendary: [210, 292],
      mythic: [360, 460],
    },
    unit: {
      common: [22, 34],
      rare: [42, 62],
      epic: [86, 128],
      legendary: [172, 242],
      mythic: [330, 430],
    },
    quest: {
      common: [16, 26],
      rare: [30, 48],
      epic: [62, 96],
      legendary: [120, 174],
      mythic: [228, 320],
    },
  } satisfies Record<RewardChestSource, Record<ChestRarity, readonly [number, number]>>,
  timing: {
    charge: { min: 300, max: 600 },
    nearMiss: { min: 116, max: 128 },
    upgradeBurst: { min: 200, max: 300 },
    settle: { min: 145, max: 165 },
    chainPause: { min: 92, max: 136 },
    confirmationDelay: { min: 140, max: 220 },
    finalReveal: {
      standard: {
        stillPauseMin: 0,
        stillPauseMax: 0,
        pauseMin: 300,
        pauseMax: 360,
        impactMin: 210,
        impactMax: 260,
        sceneTempo: 1,
      },
      legendary: {
        stillPauseMin: 400,
        stillPauseMax: 520,
        pauseMin: 400,
        pauseMax: 470,
        impactMin: 240,
        impactMax: 320,
        sceneTempo: 1.14,
      },
      mythic: {
        stillPauseMin: 460,
        stillPauseMax: 600,
        pauseMin: 500,
        pauseMax: 560,
        impactMin: 300,
        impactMax: 360,
        sceneTempo: 1.28,
      },
    } satisfies Record<
      RewardChestRevealIntensity,
      {
        stillPauseMin: number;
        stillPauseMax: number;
        pauseMin: number;
        pauseMax: number;
        impactMin: number;
        impactMax: number;
        sceneTempo: number;
      }
    >,
  },
} as const;

export const CHEST_THEMES: Record<
  ChestRarity,
  {
    label: string;
    cardClass: string;
    chipClass: string;
    textClass: string;
    glowClass: string;
    trackerClass: string;
    aura: string;
    woodLight: string;
    woodDark: string;
    metal: string;
    metalDark: string;
    gem: string;
    sparkle: string;
  }
> = {
  common: {
    label: "Common",
    cardClass: "border-[#D7DEE8] bg-[linear-gradient(180deg,#FBFCFE_0%,#F1F4F8_100%)]",
    chipClass: "border-[#CBD5E1] bg-[#F8FAFC] text-[#607085]",
    textClass: "text-[#66778B]",
    glowClass: "shadow-[0_18px_36px_rgba(148,163,184,0.16)]",
    trackerClass: "bg-[#94A3B8]",
    aura: "rgba(148, 163, 184, 0.24)",
    woodLight: "#D5D9E0",
    woodDark: "#8F97A3",
    metal: "#F8FAFC",
    metalDark: "#C4CBD5",
    gem: "#FFFFFF",
    sparkle: "#DDE4EE",
  },
  rare: {
    label: "Rare",
    cardClass: "border-[#B9DAF8] bg-[linear-gradient(180deg,#F3FAFF_0%,#E5F4FF_100%)]",
    chipClass: "border-[#9DCBF3] bg-[#E7F5FF] text-[#1D6EA6]",
    textClass: "text-[#2377B2]",
    glowClass: "shadow-[0_18px_36px_rgba(34,142,227,0.2)]",
    trackerClass: "bg-[#3B82F6]",
    aura: "rgba(68, 173, 255, 0.24)",
    woodLight: "#9DD3F7",
    woodDark: "#2E7EB9",
    metal: "#D9F0FF",
    metalDark: "#5BA3D8",
    gem: "#F7FDFF",
    sparkle: "#A6E6FF",
  },
  epic: {
    label: "Epic",
    cardClass: "border-[#D6C3FF] bg-[linear-gradient(180deg,#FAF6FF_0%,#F1E7FF_100%)]",
    chipClass: "border-[#C8AEFF] bg-[#F3EBFF] text-[#7A42C9]",
    textClass: "text-[#7B3FD0]",
    glowClass: "shadow-[0_18px_36px_rgba(140,93,255,0.22)]",
    trackerClass: "bg-[#8B5CF6]",
    aura: "rgba(161, 100, 255, 0.24)",
    woodLight: "#BA8AFF",
    woodDark: "#6D3BC7",
    metal: "#F3E7FF",
    metalDark: "#9666E4",
    gem: "#FFFFFF",
    sparkle: "#E2C6FF",
  },
  legendary: {
    label: "Legendary",
    cardClass: "border-[#F6D690] bg-[linear-gradient(180deg,#FFF9E7_0%,#FFF0C9_100%)]",
    chipClass: "border-[#F3C969] bg-[#FFF4C7] text-[#AC6B00]",
    textClass: "text-[#B66B00]",
    glowClass: "shadow-[0_18px_36px_rgba(244,181,74,0.3)]",
    trackerClass: "bg-[#F59E0B]",
    aura: "rgba(255, 196, 76, 0.28)",
    woodLight: "#F2C46B",
    woodDark: "#BA7A1B",
    metal: "#FFF4C8",
    metalDark: "#E4A72E",
    gem: "#FFFBE8",
    sparkle: "#FFE07A",
  },
  mythic: {
    label: "Mythic",
    cardClass: "border-[#F2C5FF] bg-[linear-gradient(135deg,#FFF0F7_0%,#F6F0FF_28%,#EAF7FF_54%,#FFF9E9_78%,#FFEAF6_100%)]",
    chipClass: "border-[#E6B8FF] bg-[linear-gradient(135deg,#FFF1FA_0%,#F0EBFF_50%,#EEF9FF_100%)] text-[#9A2FD4]",
    textClass: "text-[#9D2FD8]",
    glowClass: "shadow-[0_20px_46px_rgba(180,89,255,0.28)]",
    trackerClass: "bg-[linear-gradient(90deg,#EC4899_0%,#8B5CF6_28%,#3B82F6_55%,#F59E0B_78%,#EC4899_100%)]",
    aura: "rgba(255, 163, 232, 0.28)",
    woodLight: "#FFB6DD",
    woodDark: "#8B53FF",
    metal: "#FFF5FF",
    metalDark: "#DA83FF",
    gem: "#FFFFFF",
    sparkle: "#FFD9F6",
  },
};

function safeParseChests(value: unknown): RewardChest[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const chest = item as Partial<RewardChest>;
    const rawBaseRarity = chest.baseRarity as ChestRarity | undefined;
    const rawCurrentRarity = chest.currentRarity as ChestRarity | undefined;
    const baseRarity = rawBaseRarity && CHEST_RARITY_ORDER.includes(rawBaseRarity)
      ? rawBaseRarity
      : rawCurrentRarity && CHEST_RARITY_ORDER.includes(rawCurrentRarity)
        ? rawCurrentRarity
        : null;
    const currentRarity = rawCurrentRarity && CHEST_RARITY_ORDER.includes(rawCurrentRarity)
      ? rawCurrentRarity
      : baseRarity;

    if (
      typeof chest.id !== "string" ||
      typeof chest.title !== "string" ||
      (chest.source !== "arc" && chest.source !== "challenge" && chest.source !== "unit" && chest.source !== "quest") ||
      typeof chest.sourceLabel !== "string" ||
      !baseRarity ||
      !currentRarity ||
      (chest.state !== "sealed" && chest.state !== "opened")
    ) {
      return [];
    }

    return [{
      id: chest.id,
      title: chest.title,
      source: chest.source,
      sourceLabel: chest.sourceLabel,
      baseRarity,
      currentRarity,
      state: chest.state,
      awardedAt: typeof chest.awardedAt === "string" ? chest.awardedAt : new Date().toISOString(),
      openedAt: typeof chest.openedAt === "string" ? chest.openedAt : null,
      gemAmount: typeof chest.gemAmount === "number" ? chest.gemAmount : null,
      tapsUsed:
        typeof chest.tapsUsed === "number"
          ? clamp(Math.round(chest.tapsUsed), 0, TOTAL_CHEST_SPINS)
          : 0,
    }];
  });
}

function hashString(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function seededValue(seed: string) {
  return (hashString(seed) % 10_000) / 10_000;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function rollWeightedChoice<T extends string>(seed: string, entries: Record<T, number>) {
  const normalizedEntries = (Object.entries(entries) as [T, number][])
    .filter(([, weight]) => weight > 0);

  if (normalizedEntries.length === 0) {
    throw new Error("rollWeightedChoice requires at least one positive weight");
  }

  const totalWeight = normalizedEntries.reduce((sum, [, weight]) => sum + weight, 0);
  let threshold = seededValue(seed) * totalWeight;

  for (const [label, weight] of normalizedEntries) {
    threshold -= weight;
    if (threshold <= 0) {
      return label;
    }
  }

  return normalizedEntries[normalizedEntries.length - 1][0];
}

function buildPulseSeed(chest: RewardChest, spinIndex: number, tag: string) {
  return `${chest.id}:${chest.awardedAt}:${chest.baseRarity}:${chest.source}:${spinIndex}:${tag}`;
}

function getTapCadenceInfluence(tapCadenceMs: number | null | undefined) {
  if (!tapCadenceMs || tapCadenceMs <= 0) return 0.5;
  return clamp(tapCadenceMs / 1400, 0, 1);
}

function getChestUpgradeChance(
  chest: RewardChest,
  rarity: ChestRarity,
  spinIndex: number,
  storedEnergy: number,
) {
  if (rarity === "mythic") return 0;

  const hopeWeight = CHEST_PULSE_CONFIG.hopeCurveByTap[Math.min(spinIndex, CHEST_PULSE_CONFIG.hopeCurveByTap.length - 1)];
  const qualityBonus = CHEST_PULSE_CONFIG.qualityBonusByBaseRarity[chest.baseRarity];
  const sourceBonus = CHEST_PULSE_CONFIG.sourceBonus[chest.source];
  const rarityPenalty = CHEST_PULSE_CONFIG.rarityPenalty[rarity];
  const energyBias = storedEnergy * CHEST_PULSE_CONFIG.storedEnergyBias;

  return clamp(
    hopeWeight + qualityBonus + sourceBonus + energyBias - rarityPenalty,
    CHEST_PULSE_CONFIG.minimumUpgradeChance,
    CHEST_PULSE_CONFIG.maximumUpgradeChance,
  );
}

function getChainUpgradeChance(
  chest: RewardChest,
  rarity: ChestRarity,
  spinIndex: number,
  storedEnergy: number,
  chainDepth: number,
) {
  if (rarity === "mythic") return 0;

  const baseChance = CHEST_PULSE_CONFIG.chainBaseChanceByRarity[rarity];
  const tapBonus = CHEST_PULSE_CONFIG.chainTapBonusByTap[Math.min(spinIndex, CHEST_PULSE_CONFIG.chainTapBonusByTap.length - 1)];
  const energyBonus = storedEnergy * CHEST_PULSE_CONFIG.chainEnergyBias;
  const rarityDrag = CHEST_PULSE_CONFIG.rarityPenalty[rarity] * 0.24;
  const sourceBonus = CHEST_PULSE_CONFIG.sourceBonus[chest.source] * 0.5;

  return clamp(
    baseChance + tapBonus + energyBonus + sourceBonus - rarityDrag - chainDepth * CHEST_PULSE_CONFIG.chainDepthPenalty,
    CHEST_PULSE_CONFIG.minimumChainChance,
    CHEST_PULSE_CONFIG.maximumChainChance,
  );
}

function getStoredEnergyAfterFailure(storedEnergy: number, spinIndex: number) {
  const gain = CHEST_PULSE_CONFIG.storedEnergyGainByTap[Math.min(spinIndex, CHEST_PULSE_CONFIG.storedEnergyGainByTap.length - 1)];
  return clamp(storedEnergy + gain, 0, CHEST_PULSE_CONFIG.storedEnergyCap);
}

function getStoredEnergyAfterUpgrade(storedEnergy: number, chainCount: number) {
  return clamp(
    storedEnergy * CHEST_PULSE_CONFIG.storedEnergyRetentionOnUpgrade + Math.max(0, chainCount - 1) * 0.03,
    0,
    CHEST_PULSE_CONFIG.storedEnergyCap,
  );
}

function shouldShowNearMiss(chest: RewardChest, spinIndex: number, settledRarity: ChestRarity) {
  if (settledRarity === "mythic") return false;

  const chance = CHEST_PULSE_CONFIG.nearMissChanceByTap[Math.min(spinIndex, CHEST_PULSE_CONFIG.nearMissChanceByTap.length - 1)];
  return rollWeightedChoice(buildPulseSeed(chest, spinIndex, `near-miss:${settledRarity}`), {
    show: chance,
    hide: 1 - chance,
  }) === "show";
}

function getChestRevealIntensity(rarity: ChestRarity): RewardChestRevealIntensity {
  if (rarity === "mythic") return "mythic";
  if (rarity === "legendary") return "legendary";
  return "standard";
}

function pickDuration(seed: string, min: number, max: number) {
  return min + Math.round((max - min) * seededValue(seed));
}

export function getRewardChestStorageKey(userId: string, language: string) {
  return `${REWARD_CHEST_PREFIX}${userId}:${normalizeLanguage(language)}`;
}

export function getNextChestRarity(rarity: ChestRarity) {
  const index = CHEST_RARITY_ORDER.indexOf(rarity);
  return CHEST_RARITY_ORDER[Math.min(CHEST_RARITY_ORDER.length - 1, index + 1)];
}

export function getChestTheme(rarity: ChestRarity) {
  return CHEST_THEMES[rarity];
}

export function getChestOpeningRarity(chest: RewardChest) {
  return chest.currentRarity;
}

export function getUnitChestDefinition(unitNumber: number) {
  if (unitNumber >= 10) {
    return {
      id: `unit-${unitNumber}-legendary-chest`,
      title: "Legendary Chest",
      rarity: "legendary" as const,
      sourceLabel: `Unit ${unitNumber} reward`,
    };
  }

  if (unitNumber >= 7) {
    return {
      id: `unit-${unitNumber}-epic-chest`,
      title: "Epic Chest",
      rarity: "epic" as const,
      sourceLabel: `Unit ${unitNumber} reward`,
    };
  }

  if (unitNumber >= 4) {
    return {
      id: `unit-${unitNumber}-rare-chest`,
      title: "Rare Chest",
      rarity: "rare" as const,
      sourceLabel: `Unit ${unitNumber} reward`,
    };
  }

  return {
    id: `unit-${unitNumber}-common-chest`,
    title: "Common Chest",
    rarity: "common" as const,
    sourceLabel: `Unit ${unitNumber} reward`,
  };
}

export function getArcChestDefinition(unitNumber: number, nodeId: string, nodeTitle: string) {
  const rarity: ChestRarity = unitNumber >= 10
    ? "legendary"
    : unitNumber >= 7
      ? "epic"
      : unitNumber >= 4
        ? "rare"
        : "common";

  return {
    id: `arc-${nodeId}-${rarity}-chest`,
    title: `${CHEST_THEMES[rarity].label} Chest`,
    rarity,
    sourceLabel: `${nodeTitle} arc reward`,
  };
}

export function getChallengeChestDefinition(unitNumber: number) {
  const rarity: ChestRarity = unitNumber >= 10
    ? "legendary"
    : unitNumber >= 5
      ? "epic"
      : "rare";

  return {
    id: `challenge-${unitNumber}-${rarity}-chest`,
    title: `${CHEST_THEMES[rarity].label} Challenge Chest`,
    rarity,
    sourceLabel: `Unit ${unitNumber} challenge reward`,
  };
}

export function getUnitChestInsertionProgress(unitNumber: number, lessonCount: number) {
  const safeLessonCount = Math.max(1, Math.floor(lessonCount));
  const seed = hashString(`unit:${unitNumber}:path-chest-slot`);

  if (safeLessonCount >= 4) {
    const candidates = [2, 3, 4] as const;
    return candidates[seed % candidates.length];
  }

  if (safeLessonCount === 3) {
    const candidates = [2, 3] as const;
    return candidates[seed % candidates.length];
  }

  return safeLessonCount;
}

export function isUnitChestAvailable(unitNumber: number, lessonCount: number, completedCount: number) {
  return completedCount >= getUnitChestInsertionProgress(unitNumber, lessonCount);
}

export function getQuestChestId(dateKey: string, questId: string) {
  return `quest-${dateKey}-${questId}-chest`;
}

export function createRewardChest(input: {
  id: string;
  title: string;
  source: RewardChestSource;
  sourceLabel: string;
  rarity: ChestRarity;
  awardedAt?: string;
}): RewardChest {
  const awardedAt = input.awardedAt ?? new Date().toISOString();

  return {
    id: input.id,
    title: input.title,
    source: input.source,
    sourceLabel: input.sourceLabel,
    baseRarity: input.rarity,
    currentRarity: input.rarity,
    state: "sealed",
    awardedAt,
    openedAt: null,
    gemAmount: null,
    tapsUsed: 0,
  };
}

export function createUnitRewardChest(unitNumber: number, awardedAt?: string) {
  const chest = getUnitChestDefinition(unitNumber);
  return createRewardChest({
    id: chest.id,
    title: chest.title,
    source: "unit",
    sourceLabel: chest.sourceLabel,
    rarity: chest.rarity,
    awardedAt,
  });
}

export function createArcRewardChest(
  unitNumber: number,
  nodeId: string,
  nodeTitle: string,
  awardedAt?: string,
) {
  const chest = getArcChestDefinition(unitNumber, nodeId, nodeTitle);
  return createRewardChest({
    id: chest.id,
    title: chest.title,
    source: "arc",
    sourceLabel: chest.sourceLabel,
    rarity: chest.rarity,
    awardedAt,
  });
}

export function createChallengeRewardChest(unitNumber: number, awardedAt?: string) {
  const chest = getChallengeChestDefinition(unitNumber);
  return createRewardChest({
    id: chest.id,
    title: chest.title,
    source: "challenge",
    sourceLabel: chest.sourceLabel,
    rarity: chest.rarity,
    awardedAt,
  });
}

export function createQuestRewardChest(
  dateKey: string,
  questId: string,
  questLabel: string,
  rewardTier: number,
  awardedAt?: string,
) {
  const rarity: ChestRarity = rewardTier >= 3 ? "legendary" : rewardTier >= 2 ? "epic" : rewardTier >= 1 ? "rare" : "common";

  return createRewardChest({
    id: getQuestChestId(dateKey, questId),
    title: `${CHEST_THEMES[rarity].label} Quest Chest`,
    source: "quest",
    sourceLabel: questLabel,
    rarity,
    awardedAt,
  });
}

export function inflateChestFromId(chestId: string): RewardChest | null {
  const unitMatch = chestId.match(/^unit-(\d+)-(common|rare|epic|legendary|mythic)-chest$/);
  if (unitMatch) {
    return {
      ...createUnitRewardChest(Number(unitMatch[1]), new Date(0).toISOString()),
      baseRarity: unitMatch[2] as ChestRarity,
      currentRarity: unitMatch[2] as ChestRarity,
      state: "opened",
      openedAt: new Date(0).toISOString(),
      gemAmount: getChestGemReward(chestId, unitMatch[2] as ChestRarity, "unit"),
      tapsUsed: TOTAL_CHEST_SPINS,
    };
  }

  const arcMatch = chestId.match(/^arc-([0-9]+-[0-9]+)-(common|rare|epic|legendary|mythic)-chest$/);
  if (arcMatch) {
    const nodeId = arcMatch[1];
    const unitNumber = Number(nodeId.split("-")[0] || 0);
    const reward = createArcRewardChest(unitNumber, nodeId, "Arc", new Date(0).toISOString());
    return {
      ...reward,
      baseRarity: arcMatch[2] as ChestRarity,
      currentRarity: arcMatch[2] as ChestRarity,
      state: "opened",
      openedAt: new Date(0).toISOString(),
      gemAmount: getChestGemReward(chestId, arcMatch[2] as ChestRarity, "arc"),
      tapsUsed: TOTAL_CHEST_SPINS,
    };
  }

  const challengeMatch = chestId.match(/^challenge-(\d+)-(rare|epic|legendary|mythic)-chest$/);
  if (challengeMatch) {
    const unitNumber = Number(challengeMatch[1]);
    const reward = createChallengeRewardChest(unitNumber, new Date(0).toISOString());
    return {
      ...reward,
      baseRarity: challengeMatch[2] as ChestRarity,
      currentRarity: challengeMatch[2] as ChestRarity,
      state: "opened",
      openedAt: new Date(0).toISOString(),
      gemAmount: getChestGemReward(chestId, challengeMatch[2] as ChestRarity, "challenge"),
      tapsUsed: TOTAL_CHEST_SPINS,
    };
  }

  const questMatch = chestId.match(/^quest-(\d{4}-\d{2}-\d{2})-(.+)-chest$/);
  if (questMatch) {
    const reward = createRewardChest({
      id: chestId,
      title: "Quest Chest",
      source: "quest",
      sourceLabel: "Daily quest",
      rarity: "common",
      awardedAt: `${questMatch[1]}T00:00:00.000Z`,
    });

    return {
      ...reward,
      state: "opened",
      openedAt: `${questMatch[1]}T00:00:00.000Z`,
      gemAmount: getChestGemReward(chestId, reward.baseRarity, reward.source),
      tapsUsed: TOTAL_CHEST_SPINS,
    };
  }

  return null;
}

export function sortRewardChests(chests: RewardChest[]) {
  return [...chests].sort((left, right) => new Date(right.awardedAt).getTime() - new Date(left.awardedAt).getTime());
}

export function upsertRewardChest(chests: RewardChest[], chest: RewardChest) {
  const existing = chests.find((entry) => entry.id === chest.id);
  if (!existing) return sortRewardChests([chest, ...chests]);

  const next = chests.map((entry) => {
    if (entry.id !== chest.id) return entry;

    if (entry.state === "opened" && chest.state === "sealed") {
      return entry;
    }

    return {
      ...entry,
      ...chest,
      currentRarity:
        CHEST_RARITY_ORDER.indexOf(entry.currentRarity) > CHEST_RARITY_ORDER.indexOf(chest.currentRarity)
          ? entry.currentRarity
          : chest.currentRarity,
      tapsUsed: Math.max(entry.tapsUsed, chest.tapsUsed),
    };
  });

  return sortRewardChests(next);
}

export function getStoredRewardChests(userId: string, language: string) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getRewardChestStorageKey(userId, language));
    if (!raw) return [];
    return sortRewardChests(safeParseChests(JSON.parse(raw)));
  } catch {
    return [];
  }
}

export function setStoredRewardChests(userId: string, language: string, chests: RewardChest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getRewardChestStorageKey(userId, language), JSON.stringify(sortRewardChests(chests)));
}

export function mergeRewardChestsFromClaims(chests: RewardChest[], claimedChestIds: string[]) {
  return sortRewardChests(
    claimedChestIds.reduce((next, chestId) => {
      if (next.some((entry) => entry.id === chestId)) return next;
      const inflated = inflateChestFromId(chestId);
      return inflated ? [...next, inflated] : next;
    }, [...chests]),
  );
}

export function getChestGemReward(chestId: string, rarity: ChestRarity, source: RewardChestSource) {
  const [minimum, maximum] = CHEST_PULSE_CONFIG.rewardRanges[source][rarity];
  const span = maximum - minimum;
  return minimum + (hashString(`${chestId}:${rarity}:gems`) % (span + 1));
}

export function resolveRewardChestPulse(
  chest: RewardChest,
  currentRarity: ChestRarity,
  spinIndex: number,
  storedEnergyBefore: number,
): RewardChestPulseResult {
  const finalSpin = spinIndex + 1 >= TOTAL_CHEST_SPINS;
  const upgradeSteps: RewardChestUpgradeStep[] = [];
  let cursorRarity = currentRarity;

  if (cursorRarity !== "mythic") {
    const firstUpgradeChance = getChestUpgradeChance(chest, cursorRarity, spinIndex, storedEnergyBefore);
    const firstOutcome = rollWeightedChoice(buildPulseSeed(chest, spinIndex, `upgrade:0:${cursorRarity}:${storedEnergyBefore.toFixed(4)}`), {
      stay: 1 - firstUpgradeChance,
      upgrade: firstUpgradeChance,
    });

    if (firstOutcome === "upgrade") {
      let chainDepth = 0;

      while (chainDepth < CHEST_PULSE_CONFIG.maximumChainStepsPerTap) {
        const nextRarity = getNextChestRarity(cursorRarity);
        upgradeSteps.push({
          stepIndex: chainDepth,
          fromRarity: cursorRarity,
          toRarity: nextRarity,
        });
        cursorRarity = nextRarity;
        chainDepth += 1;

        if (
          cursorRarity === "mythic" ||
          chainDepth >= CHEST_PULSE_CONFIG.maximumChainStepsPerTap
        ) {
          break;
        }

        const chainChance = getChainUpgradeChance(chest, cursorRarity, spinIndex, storedEnergyBefore, chainDepth);
        const chainOutcome = rollWeightedChoice(buildPulseSeed(chest, spinIndex, `upgrade:${chainDepth}:${cursorRarity}:${storedEnergyBefore.toFixed(4)}`), {
          stay: 1 - chainChance,
          upgrade: chainChance,
        });

        if (chainOutcome !== "upgrade") {
          break;
        }
      }
    }
  }

  const settledRarity = cursorRarity;
  const upgraded = upgradeSteps.length > 0;
  const nearMissRarity = shouldShowNearMiss(chest, spinIndex, settledRarity)
    ? getNextChestRarity(settledRarity)
    : null;
  const storedEnergyAfter = upgraded
    ? getStoredEnergyAfterUpgrade(storedEnergyBefore, upgradeSteps.length)
    : getStoredEnergyAfterFailure(storedEnergyBefore, spinIndex);

  return {
    spinIndex,
    startingRarity: currentRarity,
    settledRarity,
    upgraded,
    finalSpin,
    nearMissRarity,
    revealIntensity: finalSpin ? getChestRevealIntensity(settledRarity) : "standard",
    storedEnergyBefore,
    storedEnergyAfter,
    upgradeSteps,
  };
}

export function buildRewardChestPulsePresentation(
  chest: RewardChest,
  pulseResult: RewardChestPulseResult,
  tapCadenceMs: number | null | undefined,
): RewardChestPulsePresentation {
  const cadenceInfluence = getTapCadenceInfluence(tapCadenceMs);
  const tapPressure = pulseResult.spinIndex / Math.max(1, TOTAL_CHEST_SPINS - 1);
  const energyPressure = pulseResult.storedEnergyBefore;
  const seedBase = buildPulseSeed(chest, pulseResult.spinIndex, "presentation");
  const revealTiming = CHEST_PULSE_CONFIG.timing.finalReveal[pulseResult.revealIntensity];

  const chargeBase = pickDuration(
    `${seedBase}:charge`,
    CHEST_PULSE_CONFIG.timing.charge.min,
    CHEST_PULSE_CONFIG.timing.charge.max,
  );
  const chargeDurationMs = clamp(
    Math.round(chargeBase - tapPressure * 90 - cadenceInfluence * 70 - energyPressure * 80),
    CHEST_PULSE_CONFIG.timing.charge.min,
    CHEST_PULSE_CONFIG.timing.charge.max,
  );
  const upgradeBurstDurationMs = pickDuration(
    `${seedBase}:upgrade-burst`,
    CHEST_PULSE_CONFIG.timing.upgradeBurst.min,
    CHEST_PULSE_CONFIG.timing.upgradeBurst.max,
  );
  const nearMissFlashMs = pulseResult.nearMissRarity
    ? pickDuration(`${seedBase}:near-miss`, CHEST_PULSE_CONFIG.timing.nearMiss.min, CHEST_PULSE_CONFIG.timing.nearMiss.max)
    : 0;
  const settleDurationMs = pickDuration(
    `${seedBase}:settle`,
    CHEST_PULSE_CONFIG.timing.settle.min,
    CHEST_PULSE_CONFIG.timing.settle.max,
  );
  const chainPauseMs = pickDuration(
    `${seedBase}:chain-pause`,
    CHEST_PULSE_CONFIG.timing.chainPause.min,
    CHEST_PULSE_CONFIG.timing.chainPause.max,
  );
  const confirmationDelayMs = pickDuration(
    `${seedBase}:confirm`,
    CHEST_PULSE_CONFIG.timing.confirmationDelay.min,
    CHEST_PULSE_CONFIG.timing.confirmationDelay.max,
  );

  return {
    chargeDurationMs,
    nearMissFlashMs,
    upgradeBurstDurationMs,
    settleDurationMs,
    chainPauseMs,
    confirmationDelayMs,
    revealStillPauseMs: pickDuration(`${seedBase}:reveal-still`, revealTiming.stillPauseMin, revealTiming.stillPauseMax),
    finalLockPauseMs: pickDuration(`${seedBase}:final-pause`, revealTiming.pauseMin, revealTiming.pauseMax),
    finalImpactDurationMs: pickDuration(`${seedBase}:final-impact`, revealTiming.impactMin, revealTiming.impactMax),
    chargeEasing: "cubic-bezier(0.12, 0.9, 0.24, 1)",
    impactEasing: "cubic-bezier(0.72, 0.02, 0.22, 1)",
    settleEasing: "cubic-bezier(0.16, 0.82, 0.18, 1)",
    sceneTempo: revealTiming.sceneTempo,
    motionVariance: seededValue(`${seedBase}:motion`),
  };
}

export function reconstructRewardChestSession(
  chest: RewardChest,
  tapsUsed = chest.tapsUsed,
): RewardChestSessionSnapshot {
  const history: RewardChestPulseResult[] = [];
  const safeTapCount = clamp(tapsUsed, 0, TOTAL_CHEST_SPINS);
  let currentRarity = chest.baseRarity;
  let storedEnergy = 0;

  for (let spinIndex = 0; spinIndex < safeTapCount; spinIndex += 1) {
    const pulse = resolveRewardChestPulse(chest, currentRarity, spinIndex, storedEnergy);
    history.push(pulse);
    currentRarity = pulse.settledRarity;
    storedEnergy = pulse.storedEnergyAfter;
  }

  return {
    history,
    currentRarity: safeTapCount > 0 ? currentRarity : chest.currentRarity,
    storedEnergy,
  };
}

export function progressRewardChest(chests: RewardChest[], result: RewardChestProgressResult) {
  const next = chests.map((entry) => {
    if (entry.id !== result.chestId) return entry;
    if (entry.state === "opened") return entry;

    return {
      ...entry,
      currentRarity:
        CHEST_RARITY_ORDER.indexOf(result.currentRarity) > CHEST_RARITY_ORDER.indexOf(entry.currentRarity)
          ? result.currentRarity
          : entry.currentRarity,
      tapsUsed: Math.max(entry.tapsUsed, result.tapsUsed),
    };
  });

  return {
    chests: sortRewardChests(next),
    chest: next.find((entry) => entry.id === result.chestId) ?? null,
  };
}

export function openRewardChest(chests: RewardChest[], result: RewardChestOpenResult) {
  const next = chests.map((entry) => {
    if (entry.id !== result.chestId) return entry;

    return {
      ...entry,
      currentRarity: result.finalRarity,
      state: "opened" as const,
      openedAt: new Date().toISOString(),
      gemAmount: result.gemsAwarded,
      tapsUsed: Math.max(entry.tapsUsed, result.tapsUsed),
    };
  });

  return {
    chests: sortRewardChests(next),
    chest: next.find((entry) => entry.id === result.chestId) ?? null,
  };
}
