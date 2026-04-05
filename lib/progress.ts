import { LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import {
  arcRecordMapToNodeProgressMap,
  getStoredArcProgressMap,
  setStoredArcProgressMap,
} from "@/lib/lessonArc/arcProgress";
import { DEFAULT_HEARTS, type LessonArcNodeProgress, type LessonArcProgressMap, type LessonArcQuestion, type LessonArcSession } from "@/lib/lessonArc/types";
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
  arc_progress: LessonArcProgressMap;
  active_lesson_session: LessonArcSession | null;
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
  arc_progress?: unknown;
  active_lesson_session?: unknown;
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

function safeParseObject(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
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

function clampLessonIndex(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0 as const;
  if (numeric === 1) return 1 as const;
  if (numeric === 2) return 2 as const;
  if (numeric === 3) return 3 as const;
  return 4 as const;
}

function sanitizeQuestion(value: unknown): LessonArcQuestion | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.type !== "string" || typeof raw.prompt !== "string" || typeof raw.concept !== "string") {
    return null;
  }

  return {
    id: raw.id,
    type: raw.type as LessonArcQuestion["type"],
    concept: raw.concept,
    difficulty: Math.min(5, Math.max(1, safeNumber(raw.difficulty) || 1)) as LessonArcQuestion["difficulty"],
    prompt: raw.prompt,
    code: typeof raw.code === "string" ? raw.code : undefined,
    options: safeParseArray(raw.options),
    correctIndex: typeof raw.correctIndex === "number" ? raw.correctIndex : undefined,
    correctAnswer: typeof raw.correctAnswer === "string" ? raw.correctAnswer : undefined,
    pairs: Array.isArray(raw.pairs)
      ? raw.pairs.flatMap((pair) => {
          if (!pair || typeof pair !== "object") return [];
          const entry = pair as Record<string, unknown>;
          return typeof entry.left === "string" && typeof entry.right === "string"
            ? [{ left: entry.left, right: entry.right }]
            : [];
        })
      : undefined,
    tokens: safeParseArray(raw.tokens),
    correctTokens: safeParseArray(raw.correctTokens),
    lines: safeParseArray(raw.lines),
    correctOrder: Array.isArray(raw.correctOrder)
      ? raw.correctOrder.filter((entry): entry is number => typeof entry === "number")
      : undefined,
    bugLine: typeof raw.bugLine === "number" ? raw.bugLine : undefined,
    testCases: Array.isArray(raw.testCases)
      ? raw.testCases.flatMap((testCase) => {
          if (!testCase || typeof testCase !== "object") return [];
          const entry = testCase as Record<string, unknown>;
          return typeof entry.input === "string" && typeof entry.expected === "string"
            ? [{ input: entry.input, expected: entry.expected }]
            : [];
        })
      : undefined,
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
    hint: typeof raw.hint === "string" ? raw.hint : undefined,
    xpBonus: typeof raw.xpBonus === "number" ? raw.xpBonus : undefined,
  };
}

function compareIsoDate(left: string, right: string) {
  const leftValue = Date.parse(left);
  const rightValue = Date.parse(right);
  return (Number.isFinite(leftValue) ? leftValue : 0) - (Number.isFinite(rightValue) ? rightValue : 0);
}

function sanitizeArcProgressEntry(nodeId: string, value: unknown): LessonArcNodeProgress | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const unitId = Number(raw.unitId ?? Number(nodeId.split("-")[0] || 0));
  const lessonId = Number(raw.lessonId ?? Number(nodeId.split("-")[1] || 0));
  if (!Number.isFinite(unitId) || !Number.isFinite(lessonId)) return null;

  const completedLessonIndices = Array.isArray(raw.completedLessonIndices)
    ? raw.completedLessonIndices
      .filter((entry): entry is number => typeof entry === "number")
      .map((entry) => clampLessonIndex(entry))
    : [];

  const status = raw.status === "completed" || raw.status === "in_progress" ? raw.status : "not_started";
  const updatedAt = typeof raw.updatedAt === "string" && raw.updatedAt.trim().length > 0 ? raw.updatedAt : "1970-01-01T00:00:00.000Z";

  return {
    nodeId,
    unitId,
    lessonId,
    concept: typeof raw.concept === "string" && raw.concept.trim().length > 0 ? raw.concept : nodeId,
    lessonIndex: clampLessonIndex(raw.lessonIndex),
    questionIndex: Math.max(0, safeNumber(raw.questionIndex)),
    hearts: Math.max(0, safeNumber(raw.hearts ?? DEFAULT_HEARTS)),
    xpEarned: Math.max(0, safeNumber(raw.xpEarned)),
    totalArcXpEarned: Math.max(0, safeNumber(raw.totalArcXpEarned ?? raw.xpEarned)),
    completedLessonIndices: mergeUnique(completedLessonIndices.map(String)).map((entry) => clampLessonIndex(Number(entry))),
    status,
    updatedAt,
  };
}

function sanitizeArcProgress(value: unknown, completedLessons: string[]) {
  const raw = safeParseObject(value) ?? {};
  const next: LessonArcProgressMap = {};

  Object.entries(raw).forEach(([nodeId, entry]) => {
    const sanitized = sanitizeArcProgressEntry(nodeId, entry);
    if (sanitized) next[nodeId] = sanitized;
  });

  completedLessons.forEach((nodeId) => {
    const existing = next[nodeId];
    const [unitPart, lessonPart] = nodeId.split("-");
    const unitId = Number(unitPart || 0);
    const lessonId = Number(lessonPart || 0);
    if (!Number.isFinite(unitId) || !Number.isFinite(lessonId)) return;

    next[nodeId] = {
      nodeId,
      unitId,
      lessonId,
      concept: existing?.concept ?? nodeId,
      lessonIndex: 4,
      questionIndex: 0,
      hearts: DEFAULT_HEARTS,
      xpEarned: Math.max(existing?.xpEarned ?? 0, existing?.totalArcXpEarned ?? 0),
      totalArcXpEarned: Math.max(existing?.totalArcXpEarned ?? 0, existing?.xpEarned ?? 0),
      completedLessonIndices: [0, 1, 2, 3, 4],
      status: "completed",
      updatedAt: existing?.updatedAt ?? "1970-01-01T00:00:00.000Z",
    };
  });

  return next;
}

function sanitizeArcSession(value: unknown): LessonArcSession | null {
  const raw = safeParseObject(value);
  if (!raw) return null;
  if (typeof raw.nodeId !== "string" || typeof raw.language !== "string" || !Array.isArray(raw.questions)) {
    return null;
  }

  const questions = raw.questions
    .map((question) => sanitizeQuestion(question))
    .filter((question): question is LessonArcQuestion => Boolean(question));

  if (questions.length === 0) return null;

  return {
    nodeId: raw.nodeId,
    unitId: safeNumber(raw.unitId),
    lessonId: safeNumber(raw.lessonId),
    language: normalizeLanguage(raw.language),
    concept: typeof raw.concept === "string" ? raw.concept : raw.nodeId,
    mode: raw.mode === "review" ? "review" : "progress",
    lessonIndex: clampLessonIndex(raw.lessonIndex),
    questionIndex: Math.max(0, safeNumber(raw.questionIndex)),
    hearts: Math.max(0, safeNumber(raw.hearts ?? DEFAULT_HEARTS)),
    xpEarned: Math.max(0, safeNumber(raw.xpEarned)),
    correctCount: Math.max(0, safeNumber(raw.correctCount)),
    wrongCount: Math.max(0, safeNumber(raw.wrongCount)),
    perfectLesson: safeBoolean(raw.perfectLesson),
    questions,
    questionOrder: safeParseArray(raw.questionOrder),
    completedQuestionIds: safeParseArray(raw.completedQuestionIds),
    usedHintQuestionIds: safeParseArray(raw.usedHintQuestionIds),
    freeHintUsed: safeBoolean(raw.freeHintUsed),
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : "1970-01-01T00:00:00.000Z",
    questionStartedAt: typeof raw.questionStartedAt === "string" ? raw.questionStartedAt : "1970-01-01T00:00:00.000Z",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "1970-01-01T00:00:00.000Z",
  };
}

function pickPreferredArcProgress(
  remote: LessonArcNodeProgress | undefined,
  local: LessonArcNodeProgress | undefined,
) {
  if (!remote) return local ?? null;
  if (!local) return remote;
  if (remote.status === "completed" && local.status !== "completed") return remote;
  if (local.status === "completed" && remote.status !== "completed") return local;
  if (remote.completedLessonIndices.length !== local.completedLessonIndices.length) {
    return remote.completedLessonIndices.length > local.completedLessonIndices.length ? remote : local;
  }
  if (remote.lessonIndex !== local.lessonIndex) return remote.lessonIndex > local.lessonIndex ? remote : local;
  if (remote.questionIndex !== local.questionIndex) return remote.questionIndex > local.questionIndex ? remote : local;
  if (remote.totalArcXpEarned !== local.totalArcXpEarned) {
    return remote.totalArcXpEarned > local.totalArcXpEarned ? remote : local;
  }
  return compareIsoDate(remote.updatedAt, local.updatedAt) >= 0 ? remote : local;
}

function mergeArcProgressMaps(
  remote: LessonArcProgressMap,
  local: LessonArcProgressMap,
  completedLessons: string[],
) {
  const keys = new Set([...Object.keys(remote), ...Object.keys(local), ...completedLessons]);
  const next: LessonArcProgressMap = {};

  keys.forEach((nodeId) => {
    const preferred = pickPreferredArcProgress(remote[nodeId], local[nodeId]);
    if (preferred) next[nodeId] = preferred;
  });

  completedLessons.forEach((nodeId) => {
    const existing = next[nodeId];
    if (!existing) return;
    next[nodeId] = {
      ...existing,
      lessonIndex: 4,
      completedLessonIndices: [0, 1, 2, 3, 4],
      status: "completed",
    };
  });

  return next;
}

function mergeArcSessions(remote: LessonArcSession | null, local: LessonArcSession | null) {
  if (!remote) return local;
  if (!local) return remote;
  return compareIsoDate(remote.updatedAt, local.updatedAt) >= 0 ? remote : local;
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
    arc_progress: sanitizeArcProgress(raw?.arc_progress, safeParseArray(raw?.completed_lessons)),
    active_lesson_session: sanitizeArcSession(raw?.active_lesson_session),
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
  if (updates.arc_progress) values.arc_progress = JSON.stringify(updates.arc_progress);
  if (updates.active_lesson_session || updates.active_lesson_session === null) {
    values.active_lesson_session = updates.active_lesson_session ? JSON.stringify(updates.active_lesson_session) : null;
  }
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
    const base = raw ? normalizeProgressShape(language, JSON.parse(raw)) : null;
    const arcCache = getStoredArcProgressMap(userId, language);
    if (!base && Object.keys(arcCache).length === 0) return null;
    if (Object.keys(arcCache).length === 0) return base;

    const cachedArcProgress = arcRecordMapToNodeProgressMap(arcCache, base?.arc_progress ?? {});
    return normalizeProgressShape(language, {
      ...(base ?? normalizeProgressShape(language, null)),
      arc_progress: mergeArcProgressMaps(
        cachedArcProgress,
        base?.arc_progress ?? {},
        base?.completed_lessons ?? [],
      ),
    });
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
    arc_progress: mergeArcProgressMaps(
      progress.arc_progress ?? {},
      existing?.arc_progress ?? {},
      mergeUnique(progress.completed_lessons ?? existing?.completed_lessons ?? []),
    ),
    active_lesson_session: progress.active_lesson_session === undefined
      ? existing?.active_lesson_session ?? null
      : progress.active_lesson_session,
    claimed_chests: mergeUnique(progress.claimed_chests ?? existing?.claimed_chests ?? []),
    achievements: mergeUnique(progress.achievements ?? existing?.achievements ?? []),
    streak_activity_dates: mergeRecentDateHistory(progress.streak_activity_dates ?? [], existing?.streak_activity_dates ?? []),
    streak_protected_dates: mergeRecentDateHistory(progress.streak_protected_dates ?? [], existing?.streak_protected_dates ?? []),
    streak_seen_milestones: mergeUnique(progress.streak_seen_milestones ?? existing?.streak_seen_milestones ?? []),
  });

  window.localStorage.setItem(getLanguageProgressStorageKey(userId, language), JSON.stringify(next));
  setStoredArcProgressMap(userId, next.language, next.arc_progress);
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
    arc_progress: mergeArcProgressMaps(
      normalizedRemote.arc_progress,
      normalizedLocal?.arc_progress ?? {},
      mergeUnique([
        ...normalizedRemote.completed_lessons,
        ...(normalizedLocal?.completed_lessons ?? []),
      ]),
    ),
    active_lesson_session: mergeArcSessions(
      normalizedRemote.active_lesson_session,
      normalizedLocal?.active_lesson_session ?? null,
    ),
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

export function applyProgressPatch(
  current: StoredLanguageProgress | null,
  language: LearningLanguage,
  updates: Partial<StoredLanguageProgress>,
): StoredLanguageProgress {
  return {
    language,
    completed_lessons: updates.completed_lessons ?? current?.completed_lessons ?? [],
    arc_progress: updates.arc_progress ?? current?.arc_progress ?? {},
    active_lesson_session: updates.active_lesson_session === undefined
      ? current?.active_lesson_session ?? null
      : updates.active_lesson_session,
    xp: updates.xp ?? current?.xp ?? 0,
    streak: updates.streak ?? current?.streak ?? 0,
    best_streak: updates.best_streak ?? current?.best_streak ?? 0,
    gems: updates.gems ?? current?.gems ?? 0,
    claimed_chests: updates.claimed_chests ?? current?.claimed_chests ?? [],
    achievements: updates.achievements ?? current?.achievements ?? [],
    today_xp: updates.today_xp ?? current?.today_xp ?? 0,
    today_lessons: updates.today_lessons ?? current?.today_lessons ?? 0,
    today_perfect: updates.today_perfect ?? current?.today_perfect ?? 0,
    last_played: updates.last_played ?? current?.last_played ?? null,
    streak_last_activity_date: updates.streak_last_activity_date ?? current?.streak_last_activity_date ?? null,
    streak_timezone: updates.streak_timezone ?? current?.streak_timezone ?? null,
    streak_activity_dates: updates.streak_activity_dates ?? current?.streak_activity_dates ?? [],
    streak_protected_dates: updates.streak_protected_dates ?? current?.streak_protected_dates ?? [],
    streak_freeze_reserved_for_date: updates.streak_freeze_reserved_for_date ?? current?.streak_freeze_reserved_for_date ?? null,
    streak_freeze_last_consumed_date: updates.streak_freeze_last_consumed_date ?? current?.streak_freeze_last_consumed_date ?? null,
    streak_protected_pending: updates.streak_protected_pending ?? current?.streak_protected_pending ?? false,
    streak_protected_streak_value: updates.streak_protected_streak_value ?? current?.streak_protected_streak_value ?? 0,
    streak_protected_pending_date: updates.streak_protected_pending_date ?? current?.streak_protected_pending_date ?? null,
    streak_protected_pending_count: updates.streak_protected_pending_count ?? current?.streak_protected_pending_count ?? 0,
    streak_pending_milestone: updates.streak_pending_milestone ?? current?.streak_pending_milestone ?? null,
    streak_pending_daily_celebration: updates.streak_pending_daily_celebration ?? current?.streak_pending_daily_celebration ?? false,
    streak_pending_daily_celebration_date: updates.streak_pending_daily_celebration_date ?? current?.streak_pending_daily_celebration_date ?? null,
    streak_pending_daily_streak_value: updates.streak_pending_daily_streak_value ?? current?.streak_pending_daily_streak_value ?? 0,
    streak_seen_milestones: updates.streak_seen_milestones ?? current?.streak_seen_milestones ?? [],
    streak_lost_pending: updates.streak_lost_pending ?? current?.streak_lost_pending ?? false,
    streak_lost_value: updates.streak_lost_value ?? current?.streak_lost_value ?? 0,
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
