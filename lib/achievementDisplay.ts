import type { LearningLanguage } from "@/lib/courseContent";

export type AchievementDisplayState = {
  initialized: boolean;
  seenEarnedIds: string[];
  firstSeenAtById: Record<string, number>;
  revealedIds: string[];
};

const ACHIEVEMENT_DISPLAY_STORAGE_PREFIX = "pico-achievement-display";

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0)));
}

export function getDefaultAchievementDisplayState(): AchievementDisplayState {
  return {
    initialized: false,
    seenEarnedIds: [],
    firstSeenAtById: {},
    revealedIds: [],
  };
}

export function getAchievementDisplayStorageKey(userId: string, language: LearningLanguage | string) {
  return `${ACHIEVEMENT_DISPLAY_STORAGE_PREFIX}:${userId}:${language}`;
}

function sanitizeAchievementDisplayState(value: unknown): AchievementDisplayState {
  if (!value || typeof value !== "object") {
    return getDefaultAchievementDisplayState();
  }

  const candidate = value as Partial<AchievementDisplayState>;
  const firstSeenAtById =
    candidate.firstSeenAtById && typeof candidate.firstSeenAtById === "object"
      ? Object.fromEntries(
          Object.entries(candidate.firstSeenAtById).filter(
            (entry): entry is [string, number] => typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isFinite(entry[1]),
          ),
        )
      : {};

  return {
    initialized: candidate.initialized === true,
    seenEarnedIds: uniqueStrings(Array.isArray(candidate.seenEarnedIds) ? candidate.seenEarnedIds : []),
    firstSeenAtById,
    revealedIds: uniqueStrings(Array.isArray(candidate.revealedIds) ? candidate.revealedIds : []),
  };
}

export function getStoredAchievementDisplayState(userId: string | null | undefined, language: LearningLanguage | null | undefined) {
  if (typeof window === "undefined" || !userId || !language) {
    return getDefaultAchievementDisplayState();
  }

  try {
    const raw = window.localStorage.getItem(getAchievementDisplayStorageKey(userId, language));
    if (!raw) return getDefaultAchievementDisplayState();
    return sanitizeAchievementDisplayState(JSON.parse(raw));
  } catch {
    return getDefaultAchievementDisplayState();
  }
}

export function setStoredAchievementDisplayState(
  userId: string,
  language: LearningLanguage,
  state: AchievementDisplayState,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getAchievementDisplayStorageKey(userId, language),
      JSON.stringify({
        initialized: state.initialized,
        seenEarnedIds: uniqueStrings(state.seenEarnedIds),
        firstSeenAtById: state.firstSeenAtById,
        revealedIds: uniqueStrings(state.revealedIds),
      }),
    );
  } catch {
    // noop
  }
}

export function reconcileAchievementDisplayState({
  currentEarnedIds,
  previousState,
  now,
}: {
  currentEarnedIds: string[];
  previousState: AchievementDisplayState;
  now: number;
}) {
  const normalizedEarnedIds = uniqueStrings(currentEarnedIds);
  const seenEarnedIds = new Set(previousState.seenEarnedIds);
  const revealedIds = new Set(previousState.revealedIds);
  const firstSeenAtById = { ...previousState.firstSeenAtById };

  if (!previousState.initialized) {
    normalizedEarnedIds.forEach((achievementId) => {
      seenEarnedIds.add(achievementId);
    });

    return {
      newlyUnlockedIds: [] as string[],
      nextState: {
        initialized: true,
        seenEarnedIds: Array.from(seenEarnedIds),
        firstSeenAtById,
        revealedIds: Array.from(revealedIds),
      },
    };
  }

  const newlyUnlockedIds: string[] = [];

  normalizedEarnedIds.forEach((achievementId, index) => {
    if (seenEarnedIds.has(achievementId)) return;
    seenEarnedIds.add(achievementId);
    newlyUnlockedIds.push(achievementId);
    firstSeenAtById[achievementId] = now + index;
  });

  return {
    newlyUnlockedIds,
    nextState: {
      initialized: true,
      seenEarnedIds: Array.from(seenEarnedIds),
      firstSeenAtById,
      revealedIds: Array.from(revealedIds),
    },
  };
}

export function markAchievementRevealPlayed(state: AchievementDisplayState, achievementId: string) {
  if (state.revealedIds.includes(achievementId)) return state;

  return {
    ...state,
    revealedIds: [...state.revealedIds, achievementId],
  };
}

export function markAchievementRevealPlayedMany(state: AchievementDisplayState, achievementIds: string[]) {
  const nextIds = uniqueStrings([...state.revealedIds, ...achievementIds]);
  if (nextIds.length === state.revealedIds.length) return state;

  return {
    ...state,
    revealedIds: nextIds,
  };
}
