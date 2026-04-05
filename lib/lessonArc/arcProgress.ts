import { normalizeLanguage, type LearningLanguage } from "@/lib/courseContent";
import { DEFAULT_HEARTS, type LessonArcNodeProgress, type LessonArcProgressMap } from "@/lib/lessonArc/types";
import { supabase } from "@/lib/supabase";

const ARC_PROGRESS_PREFIX = "arc_progress_";

export type ArcProgressRecord = {
  nodeId: string;
  concept: string;
  lessonIndex: 0 | 1 | 2 | 3 | 4;
  completedLessons: Array<0 | 1 | 2 | 3 | 4>;
  totalXpEarned: number;
  isComplete: boolean;
  lastUpdatedAt: string;
};

type RemoteArcProgressRow = {
  user_id: string;
  language: string;
  node_id: string;
  concept: string;
  lesson_index: number;
  completed_lessons: number[] | string | null;
  total_xp_earned: number;
  is_complete: boolean;
  last_updated_at: string;
};

let remoteArcProgressAvailable = true;

function clampLessonIndex(value: unknown): 0 | 1 | 2 | 3 | 4 {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (numeric === 1) return 1;
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return 4;
}

function uniqueLessonIndices(values: unknown): Array<0 | 1 | 2 | 3 | 4> {
  const list = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(values);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  return [...new Set(list.filter((value): value is number => typeof value === "number").map((value) => clampLessonIndex(value)))]
    .sort((left, right) => left - right);
}

function sanitizeArcProgressRecord(value: unknown): ArcProgressRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.nodeId !== "string") return null;

  const lessonIndex = clampLessonIndex(raw.lessonIndex);
  const completedLessons = uniqueLessonIndices(raw.completedLessons);
  const isComplete = raw.isComplete === true || completedLessons.length >= 5 || lessonIndex === 4;

  return {
    nodeId: raw.nodeId,
    concept: typeof raw.concept === "string" && raw.concept.trim().length > 0 ? raw.concept : raw.nodeId,
    lessonIndex: isComplete ? 4 : lessonIndex,
    completedLessons: isComplete ? [0, 1, 2, 3, 4] : completedLessons,
    totalXpEarned: Math.max(0, typeof raw.totalXpEarned === "number" ? raw.totalXpEarned : Number(raw.totalXpEarned) || 0),
    isComplete,
    lastUpdatedAt: typeof raw.lastUpdatedAt === "string" && raw.lastUpdatedAt.trim().length > 0
      ? raw.lastUpdatedAt
      : new Date(0).toISOString(),
  };
}

function mapRemoteRow(row: RemoteArcProgressRow): ArcProgressRecord {
  return sanitizeArcProgressRecord({
    nodeId: row.node_id,
    concept: row.concept,
    lessonIndex: row.lesson_index,
    completedLessons: row.completed_lessons,
    totalXpEarned: row.total_xp_earned,
    isComplete: row.is_complete,
    lastUpdatedAt: row.last_updated_at,
  }) ?? {
    nodeId: row.node_id,
    concept: row.concept,
    lessonIndex: 0,
    completedLessons: [],
    totalXpEarned: 0,
    isComplete: false,
    lastUpdatedAt: new Date(0).toISOString(),
  };
}

export function getArcProgressStorageKey(userId: string, language: string, nodeId: string) {
  return `${ARC_PROGRESS_PREFIX}${userId}_${normalizeLanguage(language)}_${nodeId}`;
}

function getArcProgressStoragePrefix(userId: string, language: string) {
  return `${ARC_PROGRESS_PREFIX}${userId}_${normalizeLanguage(language)}_`;
}

export function toArcProgressRecord(progress: LessonArcNodeProgress): ArcProgressRecord {
  const isComplete = progress.status === "completed" || progress.completedLessonIndices.length >= 5;
  return {
    nodeId: progress.nodeId,
    concept: progress.concept,
    lessonIndex: isComplete ? 4 : progress.lessonIndex,
    completedLessons: (isComplete ? [0, 1, 2, 3, 4] : progress.completedLessonIndices) as Array<0 | 1 | 2 | 3 | 4>,
    totalXpEarned: Math.max(progress.totalArcXpEarned, progress.xpEarned),
    isComplete,
    lastUpdatedAt: progress.updatedAt,
  };
}

export function toLessonArcNodeProgress(record: ArcProgressRecord, existing?: LessonArcNodeProgress | null): LessonArcNodeProgress {
  const [unitPart, lessonPart] = record.nodeId.split("-");
  const unitId = Number(unitPart || existing?.unitId || 0);
  const lessonId = Number(lessonPart || existing?.lessonId || 0);
  const isComplete = record.isComplete || record.completedLessons.length >= 5;

  return {
    nodeId: record.nodeId,
    unitId: Number.isFinite(unitId) ? unitId : existing?.unitId ?? 0,
    lessonId: Number.isFinite(lessonId) ? lessonId : existing?.lessonId ?? 0,
    concept: record.concept || existing?.concept || record.nodeId,
    lessonIndex: isComplete ? 4 : record.lessonIndex,
    questionIndex: isComplete ? 0 : existing?.questionIndex ?? 0,
    hearts: existing?.hearts ?? DEFAULT_HEARTS,
    xpEarned: Math.max(record.totalXpEarned, existing?.xpEarned ?? 0),
    totalArcXpEarned: Math.max(record.totalXpEarned, existing?.totalArcXpEarned ?? 0),
    completedLessonIndices: (isComplete ? [0, 1, 2, 3, 4] : record.completedLessons) as Array<0 | 1 | 2 | 3 | 4>,
    status: isComplete ? "completed" : record.completedLessons.length > 0 ? "in_progress" : "not_started",
    updatedAt: record.lastUpdatedAt,
  };
}

export function getStoredArcProgress(userId: string, language: string, nodeId: string): ArcProgressRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getArcProgressStorageKey(userId, language, nodeId));
    return raw ? sanitizeArcProgressRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function getStoredArcProgressMap(userId: string, language: string): Record<string, ArcProgressRecord> {
  if (typeof window === "undefined") return {};

  const prefix = getArcProgressStoragePrefix(userId, language);
  const next: Record<string, ArcProgressRecord> = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix)) continue;
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const record = sanitizeArcProgressRecord(JSON.parse(raw));
      if (record) {
        next[record.nodeId] = record;
      }
    } catch {
      continue;
    }
  }

  return next;
}

export function setStoredArcProgress(userId: string, language: string, progress: LessonArcNodeProgress | ArcProgressRecord) {
  if (typeof window === "undefined") return;
  const record = "completedLessonIndices" in progress ? toArcProgressRecord(progress) : sanitizeArcProgressRecord(progress);
  if (!record) return;
  window.localStorage.setItem(
    getArcProgressStorageKey(userId, language, record.nodeId),
    JSON.stringify(record),
  );
}

export function setStoredArcProgressMap(userId: string, language: string, progressMap: LessonArcProgressMap) {
  if (typeof window === "undefined") return;

  const prefix = getArcProgressStoragePrefix(userId, language);
  const keepKeys = new Set<string>();

  Object.values(progressMap).forEach((progress) => {
    const record = toArcProgressRecord(progress);
    const storageKey = getArcProgressStorageKey(userId, language, record.nodeId);
    keepKeys.add(storageKey);
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  });

  const removals: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(prefix) || keepKeys.has(key)) continue;
    removals.push(key);
  }

  removals.forEach((key) => window.localStorage.removeItem(key));
}

function preferredArcRecord(left: ArcProgressRecord | null, right: ArcProgressRecord | null) {
  if (!left) return right;
  if (!right) return left;
  if (left.isComplete !== right.isComplete) return left.isComplete ? left : right;
  if (left.completedLessons.length !== right.completedLessons.length) {
    return left.completedLessons.length > right.completedLessons.length ? left : right;
  }
  if (left.lessonIndex !== right.lessonIndex) {
    return left.lessonIndex > right.lessonIndex ? left : right;
  }
  if (left.totalXpEarned !== right.totalXpEarned) {
    return left.totalXpEarned > right.totalXpEarned ? left : right;
  }
  return Date.parse(left.lastUpdatedAt) >= Date.parse(right.lastUpdatedAt) ? left : right;
}

export function mergeArcProgressRecordMaps(
  ...maps: Array<Record<string, ArcProgressRecord> | null | undefined>
): Record<string, ArcProgressRecord> {
  const keys = new Set(maps.flatMap((map) => map ? Object.keys(map) : []));
  const next: Record<string, ArcProgressRecord> = {};

  keys.forEach((key) => {
    const merged = maps.reduce<ArcProgressRecord | null>(
      (current, map) => preferredArcRecord(current, map?.[key] ?? null),
      null,
    );
    if (merged) {
      next[key] = merged;
    }
  });

  return next;
}

export function arcRecordMapToNodeProgressMap(
  records: Record<string, ArcProgressRecord>,
  existing: LessonArcProgressMap = {},
): LessonArcProgressMap {
  return Object.fromEntries(
    Object.entries(records).map(([nodeId, record]) => [
      nodeId,
      toLessonArcNodeProgress(record, existing[nodeId]),
    ]),
  );
}

export async function fetchRemoteArcProgressMap(userId: string, language: LearningLanguage): Promise<Record<string, ArcProgressRecord> | null> {
  if (!remoteArcProgressAvailable) return null;

  const { data, error } = await supabase
    .from("arc_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("language", normalizeLanguage(language));

  if (error) {
    if (error.code === "42P01") {
      remoteArcProgressAvailable = false;
    }
    console.warn("[arc-progress] remote fetch failed", { language, error: error.message });
    return null;
  }

  return (data as RemoteArcProgressRow[]).reduce<Record<string, ArcProgressRecord>>((acc, row) => {
    const record = mapRemoteRow(row);
    acc[record.nodeId] = record;
    return acc;
  }, {});
}

export async function fetchRemoteArcProgressRecord(
  userId: string,
  language: LearningLanguage,
  nodeId: string,
): Promise<ArcProgressRecord | null> {
  if (!remoteArcProgressAvailable) return null;

  const { data, error } = await supabase
    .from("arc_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("language", normalizeLanguage(language))
    .eq("node_id", nodeId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      remoteArcProgressAvailable = false;
    }
    console.warn("[arc-progress] remote node fetch failed", { language, nodeId, error: error.message });
    return null;
  }

  return data ? mapRemoteRow(data as RemoteArcProgressRow) : null;
}

export async function upsertRemoteArcProgressRecords(
  userId: string,
  language: LearningLanguage,
  records: ArcProgressRecord[],
) {
  if (!remoteArcProgressAvailable || records.length === 0) return false;

  const { error } = await supabase
    .from("arc_progress")
    .upsert(
      records.map((record) => ({
        user_id: userId,
        language: normalizeLanguage(language),
        node_id: record.nodeId,
        concept: record.concept,
        lesson_index: record.lessonIndex,
        completed_lessons: record.completedLessons,
        total_xp_earned: record.totalXpEarned,
        is_complete: record.isComplete,
        last_updated_at: record.lastUpdatedAt,
      })),
      {
        onConflict: "user_id,language,node_id",
      },
    );

  if (error) {
    if (error.code === "42P01") {
      remoteArcProgressAvailable = false;
    }
    console.warn("[arc-progress] remote upsert failed", {
      language,
      nodeIds: records.map((record) => record.nodeId),
      error: error.message,
    });
    return false;
  }

  return true;
}

export async function upsertRemoteArcProgress(
  userId: string,
  language: LearningLanguage,
  progress: LessonArcNodeProgress | ArcProgressRecord,
) {
  const record = "completedLessonIndices" in progress ? toArcProgressRecord(progress) : sanitizeArcProgressRecord(progress);
  if (!record) return false;
  return upsertRemoteArcProgressRecords(userId, language, [record]);
}
