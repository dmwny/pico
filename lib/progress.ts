import { LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { supabase } from "@/lib/supabase";

const ACTIVE_LANGUAGE_PREFIX = "pico-active-language:";
const LANGUAGE_PROGRESS_PREFIX = "pico-language-progress:";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_HISTORY_LIMIT = 30;

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
  best_streak: number;
  gems: number;
  claimed_chests: string[];
  achievements: string[];
  today_xp: number;
  today_lessons: number;
  today_perfect: number;
  last_played: string | null;
  streak_last_activity_date: string | null;
  streak_timezone: string | null;
  streak_activity_dates: string[];
  streak_protected_dates: string[];
  streak_freeze_reserved_for_date: string | null;
  streak_freeze_last_consumed_date: string | null;
  streak_protected_pending: boolean;
  streak_protected_streak_value: number;
  streak_protected_pending_date: string | null;
  streak_protected_pending_count: number;
  streak_pending_milestone: number | null;
  streak_pending_daily_celebration: boolean;
  streak_pending_daily_celebration_date: string | null;
  streak_pending_daily_streak_value: number;
  streak_seen_milestones: string[];
  streak_lost_pending: boolean;
  streak_lost_value: number;
};

type RemoteProgressLike = {
  language?: string | null;
  completed_lessons?: unknown;
  xp?: number | null;
  streak?: number | null;
  best_streak?: number | null;
  gems?: number | null;
  claimed_chests?: unknown;
  achievements?: unknown;
  today_xp?: number | null;
  today_lessons?: number | null;
  today_perfect?: number | null;
  last_played?: string | null;
  streak_last_activity_date?: string | null;
  streak_timezone?: string | null;
  streak_activity_dates?: unknown;
  streak_protected_dates?: unknown;
  streak_freeze_reserved_for_date?: string | null;
  streak_freeze_last_consumed_date?: string | null;
  streak_protected_pending?: boolean | string | null;
  streak_protected_streak_value?: number | null;
  streak_protected_pending_date?: string | null;
  streak_protected_pending_count?: number | null;
  streak_pending_milestone?: number | null;
  streak_pending_daily_celebration?: boolean | string | null;
  streak_pending_daily_celebration_date?: string | null;
  streak_pending_daily_streak_value?: number | null;
  streak_seen_milestones?: unknown;
  streak_lost_pending?: boolean | string | null;
  streak_lost_value?: number | null;
};

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

function safeNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function safeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safeBoolean(value: unknown) {
  return value === true || value === "true";
}

function normalizeDateKey(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  if (DATE_KEY_PATTERN.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}

function mergeUnique(values: string[] = []) {
  return [...new Set(values)];
}

function mergeRecentDateHistory(...collections: string[][]) {
  const normalized = mergeUnique(
    collections
      .flat()
      .map((entry) => normalizeDateKey(entry))
      .filter((entry): entry is string => typeof entry === "string"),
  ).sort();

  return normalized.slice(Math.max(0, normalized.length - DATE_HISTORY_LIMIT));
}

function normalizeProgressShape(language: string, raw: RemoteProgressLike | null | undefined): StoredLanguageProgress {
  const lastPlayed = normalizeDateKey(raw?.last_played);
  const lastActivityDate = normalizeDateKey(raw?.streak_last_activity_date) ?? lastPlayed;
  const streakActivityDates = mergeRecentDateHistory(
    safeParseArray(raw?.streak_activity_dates),
    lastActivityDate ? [lastActivityDate] : [],
  );

  return {
    language: normalizeLanguage(raw?.language ?? language),
    completed_lessons: safeParseArray(raw?.completed_lessons),
    xp: safeNumber(raw?.xp),
    streak: Math.max(0, safeNumber(raw?.streak)),
    best_streak: Math.max(safeNumber(raw?.best_streak), safeNumber(raw?.streak)),
    gems: safeNumber(raw?.gems),
    claimed_chests: safeParseArray(raw?.claimed_chests),
    achievements: safeParseArray(raw?.achievements),
    today_xp: safeNumber(raw?.today_xp),
    today_lessons: safeNumber(raw?.today_lessons),
    today_perfect: safeNumber(raw?.today_perfect),
    last_played: lastPlayed,
    streak_last_activity_date: lastActivityDate,
    streak_timezone: typeof raw?.streak_timezone === "string" && raw.streak_timezone.trim().length > 0
      ? raw.streak_timezone
      : null,
    streak_activity_dates: streakActivityDates,
    streak_protected_dates: mergeRecentDateHistory(safeParseArray(raw?.streak_protected_dates)),
    streak_freeze_reserved_for_date: normalizeDateKey(raw?.streak_freeze_reserved_for_date),
    streak_freeze_last_consumed_date: normalizeDateKey(raw?.streak_freeze_last_consumed_date),
    streak_protected_pending: safeBoolean(raw?.streak_protected_pending),
    streak_protected_streak_value: Math.max(0, safeNumber(raw?.streak_protected_streak_value)),
    streak_protected_pending_date: normalizeDateKey(raw?.streak_protected_pending_date),
    streak_protected_pending_count: Math.max(0, safeNumber(raw?.streak_protected_pending_count)),
    streak_pending_milestone: (() => {
      const value = safeNullableNumber(raw?.streak_pending_milestone);
      return value && value > 0 ? value : null;
    })(),
    streak_pending_daily_celebration: safeBoolean(raw?.streak_pending_daily_celebration),
    streak_pending_daily_celebration_date: normalizeDateKey(raw?.streak_pending_daily_celebration_date),
    streak_pending_daily_streak_value: Math.max(0, safeNumber(raw?.streak_pending_daily_streak_value)),
    streak_seen_milestones: mergeUnique(
      safeParseArray(raw?.streak_seen_milestones).filter((entry) => /^[0-9]+$/.test(entry)),
    ),
    streak_lost_pending: safeBoolean(raw?.streak_lost_pending),
    streak_lost_value: Math.max(0, safeNumber(raw?.streak_lost_value)),
  };
}

export function serializeProgressForRemote(updates: Partial<StoredLanguageProgress>) {
  const values: Record<string, unknown> = {};

  if (updates.completed_lessons) values.completed_lessons = JSON.stringify(updates.completed_lessons);
  if (typeof updates.xp === "number") values.xp = updates.xp;
  if (typeof updates.streak === "number") values.streak = updates.streak;
  if (typeof updates.best_streak === "number") values.best_streak = updates.best_streak;
  if (typeof updates.gems === "number") values.gems = updates.gems;
  if (updates.claimed_chests) values.claimed_chests = JSON.stringify(updates.claimed_chests);
  if (updates.achievements) values.achievements = JSON.stringify(updates.achievements);
  if (typeof updates.today_xp === "number") values.today_xp = updates.today_xp;
  if (typeof updates.today_lessons === "number") values.today_lessons = updates.today_lessons;
  if (typeof updates.today_perfect === "number") values.today_perfect = updates.today_perfect;
  if (typeof updates.last_played === "string" || updates.last_played === null) values.last_played = updates.last_played;
  if (typeof updates.streak_last_activity_date === "string" || updates.streak_last_activity_date === null) {
    values.streak_last_activity_date = updates.streak_last_activity_date;
  }
  if (typeof updates.streak_timezone === "string" || updates.streak_timezone === null) values.streak_timezone = updates.streak_timezone;
  if (updates.streak_activity_dates) values.streak_activity_dates = JSON.stringify(updates.streak_activity_dates);
  if (updates.streak_protected_dates) values.streak_protected_dates = JSON.stringify(updates.streak_protected_dates);
  if (typeof updates.streak_freeze_reserved_for_date === "string" || updates.streak_freeze_reserved_for_date === null) {
    values.streak_freeze_reserved_for_date = updates.streak_freeze_reserved_for_date;
  }
  if (typeof updates.streak_freeze_last_consumed_date === "string" || updates.streak_freeze_last_consumed_date === null) {
    values.streak_freeze_last_consumed_date = updates.streak_freeze_last_consumed_date;
  }
  if (typeof updates.streak_protected_pending === "boolean") values.streak_protected_pending = updates.streak_protected_pending;
  if (typeof updates.streak_protected_streak_value === "number") values.streak_protected_streak_value = updates.streak_protected_streak_value;
  if (typeof updates.streak_protected_pending_date === "string" || updates.streak_protected_pending_date === null) {
    values.streak_protected_pending_date = updates.streak_protected_pending_date;
  }
  if (typeof updates.streak_protected_pending_count === "number") values.streak_protected_pending_count = updates.streak_protected_pending_count;
  if (typeof updates.streak_pending_milestone === "number" || updates.streak_pending_milestone === null) {
    values.streak_pending_milestone = updates.streak_pending_milestone;
  }
  if (typeof updates.streak_pending_daily_celebration === "boolean") {
    values.streak_pending_daily_celebration = updates.streak_pending_daily_celebration;
  }
  if (typeof updates.streak_pending_daily_celebration_date === "string" || updates.streak_pending_daily_celebration_date === null) {
    values.streak_pending_daily_celebration_date = updates.streak_pending_daily_celebration_date;
  }
  if (typeof updates.streak_pending_daily_streak_value === "number") {
    values.streak_pending_daily_streak_value = updates.streak_pending_daily_streak_value;
  }
  if (updates.streak_seen_milestones) values.streak_seen_milestones = JSON.stringify(updates.streak_seen_milestones);
  if (typeof updates.streak_lost_pending === "boolean") values.streak_lost_pending = updates.streak_lost_pending;
  if (typeof updates.streak_lost_value === "number") values.streak_lost_value = updates.streak_lost_value;

  return values;
}

export function getActiveLanguageStorageKey(userId: string) {
  return `${ACTIVE_LANGUAGE_PREFIX}${userId}`;
}

export function getLanguageProgressStorageKey(userId: string, language: string) {
  return `${LANGUAGE_PROGRESS_PREFIX}${userId}:${normalizeLanguage(language)}`;
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
    return normalizeProgressShape(language, JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setStoredLanguageProgress(userId: string, language: string, progress: Partial<StoredLanguageProgress>) {
  if (typeof window === "undefined") return;

  const existing = getStoredLanguageProgress(userId, language);
  const next = normalizeProgressShape(language, {
    ...(existing ?? normalizeProgressShape(language, null)),
    ...progress,
    completed_lessons: mergeUnique(progress.completed_lessons ?? existing?.completed_lessons ?? []),
    claimed_chests: mergeUnique(progress.claimed_chests ?? existing?.claimed_chests ?? []),
    achievements: mergeUnique(progress.achievements ?? existing?.achievements ?? []),
    streak_activity_dates: mergeRecentDateHistory(progress.streak_activity_dates ?? [], existing?.streak_activity_dates ?? []),
    streak_protected_dates: mergeRecentDateHistory(progress.streak_protected_dates ?? [], existing?.streak_protected_dates ?? []),
    streak_seen_milestones: mergeUnique(progress.streak_seen_milestones ?? existing?.streak_seen_milestones ?? []),
  });

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
  remote: RemoteProgressLike | null | undefined,
  local: StoredLanguageProgress | null,
): StoredLanguageProgress {
  const normalizedRemote = normalizeProgressShape(language, remote);
  const normalizedLocal = local ? normalizeProgressShape(language, local) : null;
  const preferredLastPlayed = normalizedLocal?.last_played ?? normalizedRemote.last_played;
  const preferredLastActivity = normalizedLocal?.streak_last_activity_date ?? normalizedRemote.streak_last_activity_date;

  return normalizeProgressShape(language, {
    ...normalizedRemote,
    ...normalizedLocal,
    language: normalizeLanguage(language),
    completed_lessons: mergeUnique([
      ...normalizedRemote.completed_lessons,
      ...(normalizedLocal?.completed_lessons ?? []),
    ]),
    xp: Math.max(normalizedRemote.xp, normalizedLocal?.xp ?? 0),
    streak: Math.max(normalizedRemote.streak, normalizedLocal?.streak ?? 0),
    best_streak: Math.max(normalizedRemote.best_streak, normalizedLocal?.best_streak ?? 0, normalizedRemote.streak, normalizedLocal?.streak ?? 0),
    gems: Math.max(normalizedRemote.gems, normalizedLocal?.gems ?? 0),
    claimed_chests: mergeUnique([
      ...normalizedRemote.claimed_chests,
      ...(normalizedLocal?.claimed_chests ?? []),
    ]),
    achievements: mergeUnique([
      ...normalizedRemote.achievements,
      ...(normalizedLocal?.achievements ?? []),
    ]),
    today_xp: Math.max(normalizedRemote.today_xp, normalizedLocal?.today_xp ?? 0),
    today_lessons: Math.max(normalizedRemote.today_lessons, normalizedLocal?.today_lessons ?? 0),
    today_perfect: Math.max(normalizedRemote.today_perfect, normalizedLocal?.today_perfect ?? 0),
    last_played: preferredLastPlayed,
    streak_last_activity_date: preferredLastActivity,
    streak_timezone: normalizedLocal?.streak_timezone ?? normalizedRemote.streak_timezone ?? null,
    streak_activity_dates: mergeRecentDateHistory(
      normalizedRemote.streak_activity_dates,
      normalizedLocal?.streak_activity_dates ?? [],
      preferredLastActivity ? [preferredLastActivity] : [],
    ),
    streak_protected_dates: mergeRecentDateHistory(
      normalizedRemote.streak_protected_dates,
      normalizedLocal?.streak_protected_dates ?? [],
    ),
    streak_freeze_reserved_for_date:
      normalizedLocal?.streak_freeze_reserved_for_date
      ?? normalizedRemote.streak_freeze_reserved_for_date
      ?? null,
    streak_freeze_last_consumed_date:
      normalizedLocal?.streak_freeze_last_consumed_date
      ?? normalizedRemote.streak_freeze_last_consumed_date
      ?? null,
    streak_protected_pending:
      normalizedLocal?.streak_protected_pending
      ?? normalizedRemote.streak_protected_pending,
    streak_protected_streak_value: normalizedLocal?.streak_protected_pending
      ? normalizedLocal.streak_protected_streak_value
      : normalizedRemote.streak_protected_pending
        ? normalizedRemote.streak_protected_streak_value
        : 0,
    streak_protected_pending_date: normalizedLocal?.streak_protected_pending
      ? normalizedLocal.streak_protected_pending_date
      : normalizedRemote.streak_protected_pending
        ? normalizedRemote.streak_protected_pending_date
        : null,
    streak_protected_pending_count: normalizedLocal?.streak_protected_pending
      ? normalizedLocal.streak_protected_pending_count
      : normalizedRemote.streak_protected_pending
        ? normalizedRemote.streak_protected_pending_count
        : 0,
    streak_pending_milestone:
      normalizedLocal?.streak_pending_milestone
      ?? normalizedRemote.streak_pending_milestone
      ?? null,
    streak_pending_daily_celebration:
      normalizedLocal?.streak_pending_daily_celebration
      ?? normalizedRemote.streak_pending_daily_celebration,
    streak_pending_daily_celebration_date:
      normalizedLocal?.streak_pending_daily_celebration_date
      ?? normalizedRemote.streak_pending_daily_celebration_date
      ?? null,
    streak_pending_daily_streak_value:
      Math.max(normalizedRemote.streak_pending_daily_streak_value, normalizedLocal?.streak_pending_daily_streak_value ?? 0),
    streak_seen_milestones: mergeUnique([
      ...normalizedRemote.streak_seen_milestones,
      ...(normalizedLocal?.streak_seen_milestones ?? []),
    ]),
    streak_lost_pending: normalizedLocal?.streak_lost_pending ?? normalizedRemote.streak_lost_pending,
    streak_lost_value: normalizedLocal?.streak_lost_pending
      ? normalizedLocal.streak_lost_value
      : normalizedRemote.streak_lost_pending
        ? normalizedRemote.streak_lost_value
        : 0,
  });
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
