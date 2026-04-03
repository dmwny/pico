import { LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { supabase } from "@/lib/supabase";

const ACTIVE_LANGUAGE_PREFIX = "pico-active-language:";
const LANGUAGE_PROGRESS_PREFIX = "pico-language-progress:";
export const PICO_ACTIVE_LANGUAGE_EVENT = "pico:active-language-changed";
export const PICO_LANGUAGE_PROGRESS_EVENT = "pico:language-progress-changed";

export type ActiveLanguageChangeDetail = {
  userId: string;
  language: LearningLanguage;
};

export type LanguageProgressChangeDetail = {
  userId: string;
  language: LearningLanguage;
  progress: StoredLanguageProgress;
};

export type StoredLanguageProgress = {
  language: LearningLanguage;
  completed_lessons: string[];
  xp: number;
  streak: number;
  gems: number;
  claimed_chests: string[];
  achievements: string[];
  today_xp: number;
  today_lessons: number;
  today_perfect: number;
  last_played: string | null;
};

export function getActiveLanguageStorageKey(userId: string) {
  return `${ACTIVE_LANGUAGE_PREFIX}${userId}`;
}

export function getLanguageProgressStorageKey(userId: string, language: string) {
  return `${LANGUAGE_PROGRESS_PREFIX}${userId}:${normalizeLanguage(language)}`;
}

function safeParseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mergeUnique(values: string[] = []) {
  return [...new Set(values)];
}

export function getStoredActiveLanguage(userId: string): LearningLanguage | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(getActiveLanguageStorageKey(userId));
  return value ? normalizeLanguage(value) : null;
}

export function setStoredActiveLanguage(userId: string, language: string) {
  if (typeof window === "undefined") return;
  const normalizedLanguage = normalizeLanguage(language);
  window.localStorage.setItem(getActiveLanguageStorageKey(userId), normalizedLanguage);
  window.dispatchEvent(
    new CustomEvent<ActiveLanguageChangeDetail>(PICO_ACTIVE_LANGUAGE_EVENT, {
      detail: {
        userId,
        language: normalizedLanguage,
      },
    }),
  );
}

export function getStoredLanguageProgress(userId: string, language: string): StoredLanguageProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getLanguageProgressStorageKey(userId, language));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      language: normalizeLanguage(parsed?.language ?? language),
      completed_lessons: safeParseArray(parsed?.completed_lessons),
      xp: Number(parsed?.xp || 0),
      streak: Number(parsed?.streak || 0),
      gems: Number(parsed?.gems || 0),
      claimed_chests: safeParseArray(parsed?.claimed_chests),
      achievements: safeParseArray(parsed?.achievements),
      today_xp: Number(parsed?.today_xp || 0),
      today_lessons: Number(parsed?.today_lessons || 0),
      today_perfect: Number(parsed?.today_perfect || 0),
      last_played: typeof parsed?.last_played === "string" ? parsed.last_played : null,
    };
  } catch {
    return null;
  }
}

export function setStoredLanguageProgress(userId: string, language: string, progress: Partial<StoredLanguageProgress>) {
  if (typeof window === "undefined") return;

  const existing = getStoredLanguageProgress(userId, language);
  const next: StoredLanguageProgress = {
    language: normalizeLanguage(language),
    completed_lessons: mergeUnique(progress.completed_lessons ?? existing?.completed_lessons ?? []),
    xp: progress.xp ?? existing?.xp ?? 0,
    streak: progress.streak ?? existing?.streak ?? 0,
    gems: progress.gems ?? existing?.gems ?? 0,
    claimed_chests: mergeUnique(progress.claimed_chests ?? existing?.claimed_chests ?? []),
    achievements: mergeUnique(progress.achievements ?? existing?.achievements ?? []),
    today_xp: progress.today_xp ?? existing?.today_xp ?? 0,
    today_lessons: progress.today_lessons ?? existing?.today_lessons ?? 0,
    today_perfect: progress.today_perfect ?? existing?.today_perfect ?? 0,
    last_played: progress.last_played ?? existing?.last_played ?? null,
  };

  window.localStorage.setItem(getLanguageProgressStorageKey(userId, language), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent<LanguageProgressChangeDetail>(PICO_LANGUAGE_PROGRESS_EVENT, {
      detail: {
        userId,
        language: next.language,
        progress: next,
      },
    }),
  );
}

export function mergeProgressSources(
  language: string,
  remote: {
    completed_lessons?: unknown;
    xp?: number | null;
    streak?: number | null;
    gems?: number | null;
    claimed_chests?: unknown;
    achievements?: unknown;
    today_xp?: number | null;
    today_lessons?: number | null;
    today_perfect?: number | null;
    last_played?: string | null;
  } | null | undefined,
  local: StoredLanguageProgress | null
): StoredLanguageProgress {
  const remoteCompleted = safeParseArray(remote?.completed_lessons);
  const remoteClaimedChests = safeParseArray(remote?.claimed_chests);
  const remoteAchievements = safeParseArray(remote?.achievements);

  return {
    language: normalizeLanguage(language),
    completed_lessons: mergeUnique([...remoteCompleted, ...(local?.completed_lessons ?? [])]),
    xp: Math.max(Number(remote?.xp || 0), local?.xp || 0),
    streak: Math.max(Number(remote?.streak || 0), local?.streak || 0),
    gems: Math.max(Number(remote?.gems || 0), local?.gems || 0),
    claimed_chests: mergeUnique([...remoteClaimedChests, ...(local?.claimed_chests ?? [])]),
    achievements: mergeUnique([...remoteAchievements, ...(local?.achievements ?? [])]),
    today_xp: Math.max(Number(remote?.today_xp || 0), local?.today_xp || 0),
    today_lessons: Math.max(Number(remote?.today_lessons || 0), local?.today_lessons || 0),
    today_perfect: Math.max(Number(remote?.today_perfect || 0), local?.today_perfect || 0),
    last_played: local?.last_played || remote?.last_played || null,
  };
}

export async function resolveActiveLanguage(userId: string): Promise<LearningLanguage> {
  const stored = getStoredActiveLanguage(userId);
  if (stored) return stored;

  const { data } = await supabase
    .from("pico_progress")
    .select("language,last_played,xp")
    .eq("user_id", userId)
    .order("last_played", { ascending: false, nullsFirst: false })
    .order("xp", { ascending: false });

  const language = normalizeLanguage(data?.[0]?.language);
  setStoredActiveLanguage(userId, language);
  return language;
}
