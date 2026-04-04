"use client";

import type { TitleBadgeId } from "@/lib/themes/shared";

const DAY_MS = 86_400_000;
const HISTORY_LIMIT = 30;
const BASE_MILESTONES = [3, 7, 14, 30, 50, 100] as const;

export const STREAK_WARNING_HOUR = 18;
export const STREAK_DANGER_HOUR = 21;

export type StreakProgressFields = {
  streak: number;
  best_streak: number;
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

export type StreakFlameTierId =
  | "unlit"
  | "ember"
  | "bright"
  | "furnace"
  | "crown"
  | "legend";

export type StreakFlameTier = {
  id: StreakFlameTierId;
  accent: string;
  glow: string;
  core: string;
  gradient: string;
};

export type StreakRiskState = {
  level: "warning" | "danger";
  currentStreak: number;
  hoursLeft: number;
  freezeCount: number;
  reserved: boolean;
};

export type StreakWeekDayState =
  | "completed"
  | "today_pending"
  | "missed"
  | "protected"
  | "reserved";

export type StreakWeekDay = {
  dateKey: string;
  label: string;
  isToday: boolean;
  state: StreakWeekDayState;
};

export type StreakMilestoneReward = {
  milestone: number;
  gems: number;
  titleBadgeId: TitleBadgeId | null;
  message: string;
  shareText: string;
};

export type StreakLoadEvaluation = {
  nextProgress: Partial<StreakProgressFields>;
  nextFreezeCount: number;
  didChange: boolean;
  didLoseStreak: boolean;
  lostStreakValue: number;
  protectedDatesConsumed: string[];
};

export type StreakActivityEvaluation = {
  nextProgress: Partial<StreakProgressFields>;
  nextFreezeCount: number;
  didChange: boolean;
  didIncrement: boolean;
  refundedReservedFreeze: boolean;
  milestoneReward: StreakMilestoneReward | null;
  queuedDailyCelebration: boolean;
};

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDateKey(value: unknown) {
  if (isDateKey(value)) return value;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return buildDateKeyFromDate(parsed);
}

function toUtcDateKeyMs(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function buildDateKeyFromUtcMs(timestamp: number) {
  const date = new Date(timestamp);
  return buildDateKeyFromDate(date);
}

function buildDateKeyFromDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function uniqueSortedDateKeys(values: string[]) {
  return [...new Set(values.filter(isDateKey))].sort();
}

function trimHistory(values: string[]) {
  const normalized = uniqueSortedDateKeys(values);
  return normalized.slice(Math.max(0, normalized.length - HISTORY_LIMIT));
}

function safeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeBoolean(value: unknown) {
  return value === true || value === "true";
}

function safeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSeenMilestones(values: unknown) {
  return [...new Set(
    safeStringArray(values)
      .map((entry) => entry.trim())
      .filter((entry) => /^[0-9]+$/.test(entry)),
  )];
}

function normalizeProgress(progress: Partial<StreakProgressFields> | null | undefined) {
  const lastActivityDate = normalizeDateKey(progress?.streak_last_activity_date)
    ?? normalizeDateKey(progress?.last_played)
    ?? null;
  const activityDates = trimHistory([
    ...safeStringArray(progress?.streak_activity_dates),
    ...(lastActivityDate ? [lastActivityDate] : []),
  ]);

  return {
    streak: Math.max(0, safeNumber(progress?.streak)),
    best_streak: Math.max(safeNumber(progress?.best_streak), safeNumber(progress?.streak)),
    last_played: normalizeDateKey(progress?.last_played),
    streak_last_activity_date: lastActivityDate,
    streak_timezone: typeof progress?.streak_timezone === "string" && progress.streak_timezone.trim().length > 0
      ? progress.streak_timezone
      : null,
    streak_activity_dates: activityDates,
    streak_protected_dates: trimHistory(safeStringArray(progress?.streak_protected_dates)),
    streak_freeze_reserved_for_date: normalizeDateKey(progress?.streak_freeze_reserved_for_date),
    streak_freeze_last_consumed_date: normalizeDateKey(progress?.streak_freeze_last_consumed_date),
    streak_protected_pending: safeBoolean(progress?.streak_protected_pending),
    streak_protected_streak_value: Math.max(0, safeNumber(progress?.streak_protected_streak_value)),
    streak_protected_pending_date: normalizeDateKey(progress?.streak_protected_pending_date),
    streak_protected_pending_count: Math.max(0, safeNumber(progress?.streak_protected_pending_count)),
    streak_pending_milestone: (() => {
      const value = safeNullableNumber(progress?.streak_pending_milestone);
      return value && value > 0 ? value : null;
    })(),
    streak_pending_daily_celebration: safeBoolean(progress?.streak_pending_daily_celebration),
    streak_pending_daily_celebration_date: normalizeDateKey(progress?.streak_pending_daily_celebration_date),
    streak_pending_daily_streak_value: Math.max(0, safeNumber(progress?.streak_pending_daily_streak_value)),
    streak_seen_milestones: getSeenMilestones(progress?.streak_seen_milestones),
    streak_lost_pending: safeBoolean(progress?.streak_lost_pending),
    streak_lost_value: Math.max(0, safeNumber(progress?.streak_lost_value)),
  };
}

function buildDateFormatter(
  timezone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    ...options,
  });
}

function getZonedParts(date: Date, timezone: string) {
  const formatter = buildDateFormatter(timezone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function addDays(dateKey: string, days: number) {
  return buildDateKeyFromUtcMs(toUtcDateKeyMs(dateKey) + days * DAY_MS);
}

function getMissedDates(lastActivityDate: string | null, todayDate: string) {
  if (!lastActivityDate) return [] as string[];
  const diff = getDateKeyDifference(lastActivityDate, todayDate);
  if (diff <= 1) return [] as string[];

  const dates: string[] = [];
  for (let index = 1; index < diff; index += 1) {
    dates.push(addDays(lastActivityDate, index));
  }
  return dates;
}

export function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getLocalDateKey(date = new Date(), timezone = getLocalTimezone()) {
  const parts = getZonedParts(date, timezone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function getDateKeyDifference(previousDate: string, nextDate: string) {
  return Math.round((toUtcDateKeyMs(nextDate) - toUtcDateKeyMs(previousDate)) / DAY_MS);
}

export function getStreakFlameTier(streak: number): StreakFlameTier {
  if (streak <= 0) {
    return {
      id: "unlit",
      accent: "#94a3b8",
      glow: "rgba(148,163,184,0.24)",
      core: "#cbd5e1",
      gradient: "linear-gradient(180deg,#94a3b8 0%,#64748b 100%)",
    };
  }

  if (streak >= 100) {
    return {
      id: "legend",
      accent: "#f472b6",
      glow: "rgba(244,114,182,0.34)",
      core: "#fde68a",
      gradient: "linear-gradient(135deg,#fb7185 0%,#f59e0b 22%,#fde047 42%,#34d399 62%,#60a5fa 82%,#c084fc 100%)",
    };
  }

  if (streak >= 50) {
    return {
      id: "crown",
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.32)",
      core: "#fde68a",
      gradient: "linear-gradient(180deg,#fcd34d 0%,#f59e0b 58%,#d97706 100%)",
    };
  }

  if (streak >= 30) {
    return {
      id: "furnace",
      accent: "#ef4444",
      glow: "rgba(239,68,68,0.3)",
      core: "#fbbf24",
      gradient: "linear-gradient(180deg,#f97316 0%,#ef4444 58%,#991b1b 100%)",
    };
  }

  if (streak >= 14) {
    return {
      id: "bright",
      accent: "#f97316",
      glow: "rgba(249,115,22,0.28)",
      core: "#fdba74",
      gradient: "linear-gradient(180deg,#fb923c 0%,#f97316 58%,#dc2626 100%)",
    };
  }

  return {
    id: "ember",
    accent: "#fb923c",
    glow: "rgba(251,146,60,0.26)",
    core: "#fdba74",
    gradient: "linear-gradient(180deg,#fdba74 0%,#fb923c 58%,#ea580c 100%)",
  };
}

export function getMilestoneMessage(streak: number) {
  if (streak === 3) return "You're just getting started. Keep it up.";
  if (streak === 7) return "One week strong. You're building a habit.";
  if (streak === 14) return "Two weeks. This is becoming who you are.";
  if (streak === 30) return "30 days. Most people quit before here.";
  if (streak === 50) return "50 days. You're in rare company.";
  if (streak === 100) return "100 days. Legendary.";
  if (streak >= 200) return `${streak} days. There are no words.`;
  return `${streak} days. Keep going.`;
}

export function getNextStreakMilestone(streak: number) {
  const explicit = BASE_MILESTONES.find((milestone) => milestone > streak);
  if (explicit) return explicit;
  const nextHundred = Math.floor(streak / 100 + 1) * 100;
  return Math.max(200, nextHundred);
}

export function getMilestoneReward(streak: number): StreakMilestoneReward | null {
  if (streak === 3) {
    return {
      milestone: 3,
      gems: 25,
      titleBadgeId: null,
      message: getMilestoneMessage(3),
      shareText: "I'm on a 3 day streak in Pico.",
    };
  }
  if (streak === 7) {
    return {
      milestone: 7,
      gems: 50,
      titleBadgeId: null,
      message: getMilestoneMessage(7),
      shareText: "I'm on a 7 day streak in Pico.",
    };
  }
  if (streak === 14) {
    return {
      milestone: 14,
      gems: 100,
      titleBadgeId: null,
      message: getMilestoneMessage(14),
      shareText: "I'm on a 14 day streak in Pico.",
    };
  }
  if (streak === 30) {
    return {
      milestone: 30,
      gems: 200,
      titleBadgeId: null,
      message: getMilestoneMessage(30),
      shareText: "I'm on a 30 day streak in Pico.",
    };
  }
  if (streak === 50) {
    return {
      milestone: 50,
      gems: 350,
      titleBadgeId: null,
      message: getMilestoneMessage(50),
      shareText: "I'm on a 50 day streak in Pico.",
    };
  }
  if (streak === 100) {
    return {
      milestone: 100,
      gems: 500,
      titleBadgeId: "streak_lord",
      message: getMilestoneMessage(100),
      shareText: "I'm on a 100 day streak in Pico.",
    };
  }
  if (streak >= 200 && streak % 100 === 0) {
    return {
      milestone: streak,
      gems: 1000,
      titleBadgeId: null,
      message: getMilestoneMessage(streak),
      shareText: `I'm on a ${streak} day streak in Pico.`,
    };
  }
  return null;
}

export function evaluateStreakOnLoad(
  progress: Partial<StreakProgressFields> | null | undefined,
  freezeCount: number,
  now = new Date(),
  timezone = getLocalTimezone(),
): StreakLoadEvaluation {
  const state = normalizeProgress(progress);
  const todayDate = getLocalDateKey(now, timezone);
  const protectedDates = new Set(state.streak_protected_dates);
  let reservedDate = state.streak_freeze_reserved_for_date;
  let remainingFreezes = Math.max(0, freezeCount);
  let currentStreak = state.streak;
  const bestStreak = Math.max(state.best_streak, currentStreak);
  const protectedDatesConsumed: string[] = [];
  let lostStreakValue = 0;

  const missedDates = getMissedDates(state.streak_last_activity_date, todayDate);

  for (const missedDate of missedDates) {
    if (protectedDates.has(missedDate)) continue;

    if (reservedDate === missedDate) {
      protectedDates.add(missedDate);
      protectedDatesConsumed.push(missedDate);
      reservedDate = null;
      continue;
    }

    if (remainingFreezes > 0) {
      remainingFreezes -= 1;
      protectedDates.add(missedDate);
      protectedDatesConsumed.push(missedDate);
      continue;
    }

    if (currentStreak > 0) {
      lostStreakValue = currentStreak;
      currentStreak = 0;
    }
    break;
  }

  if (reservedDate && getDateKeyDifference(reservedDate, todayDate) > 1) {
    reservedDate = null;
  }

  const nextProgress: Partial<StreakProgressFields> = {
    streak: currentStreak,
    best_streak: bestStreak,
    streak_timezone: timezone,
    streak_protected_dates: trimHistory([...protectedDates]),
    streak_freeze_reserved_for_date: reservedDate,
    streak_freeze_last_consumed_date: protectedDatesConsumed.at(-1) ?? state.streak_freeze_last_consumed_date,
  };

  if (protectedDatesConsumed.length > 0 && lostStreakValue === 0) {
    nextProgress.streak_protected_pending = true;
    nextProgress.streak_protected_streak_value = currentStreak;
    nextProgress.streak_protected_pending_date = protectedDatesConsumed.at(-1) ?? null;
    nextProgress.streak_protected_pending_count = protectedDatesConsumed.length;
  }

  if (lostStreakValue > 0) {
    nextProgress.streak_lost_pending = lostStreakValue >= 3;
    nextProgress.streak_lost_value = lostStreakValue;
    nextProgress.streak_protected_pending = false;
    nextProgress.streak_protected_streak_value = 0;
    nextProgress.streak_protected_pending_date = null;
    nextProgress.streak_protected_pending_count = 0;
  }

  const didChange =
    currentStreak !== state.streak
    || remainingFreezes !== Math.max(0, freezeCount)
    || protectedDatesConsumed.length > 0
    || reservedDate !== state.streak_freeze_reserved_for_date;

  return {
    nextProgress,
    nextFreezeCount: remainingFreezes,
    didChange,
    didLoseStreak: lostStreakValue > 0,
    lostStreakValue,
    protectedDatesConsumed,
  };
}

export function applyQualifiedActivity(
  progress: Partial<StreakProgressFields> | null | undefined,
  freezeCount: number,
  now = new Date(),
  timezone = getLocalTimezone(),
): StreakActivityEvaluation {
  const loadEvaluation = evaluateStreakOnLoad(progress, freezeCount, now, timezone);
  const workingState = normalizeProgress({
    ...progress,
    ...loadEvaluation.nextProgress,
  });
  const todayDate = getLocalDateKey(now, timezone);
  const activityDates = new Set(workingState.streak_activity_dates);
  let remainingFreezes = loadEvaluation.nextFreezeCount;
  let reservedDate = workingState.streak_freeze_reserved_for_date;
  let refundedReservedFreeze = false;
  let streak = workingState.streak;
  let bestStreak = workingState.best_streak;
  let didIncrement = false;

  if (reservedDate === todayDate) {
    reservedDate = null;
    remainingFreezes += 1;
    refundedReservedFreeze = true;
  }

  if (!activityDates.has(todayDate)) {
    streak = streak > 0 ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    activityDates.add(todayDate);
    didIncrement = true;
  }

  const milestoneReward = didIncrement
    ? getMilestoneReward(streak)
    : null;
  const seenMilestones = new Set(workingState.streak_seen_milestones);
  const shouldQueueMilestone = milestoneReward && !seenMilestones.has(String(milestoneReward.milestone));
  const shouldQueueDailyCelebration =
    didIncrement
    && !shouldQueueMilestone
    && streak > 0;

  return {
    nextProgress: {
      ...loadEvaluation.nextProgress,
      streak,
      best_streak: bestStreak,
      last_played: todayDate,
      streak_last_activity_date: todayDate,
      streak_timezone: timezone,
      streak_activity_dates: trimHistory([...activityDates]),
      streak_freeze_reserved_for_date: reservedDate,
      streak_pending_milestone: shouldQueueMilestone ? milestoneReward.milestone : workingState.streak_pending_milestone,
      streak_pending_daily_celebration: shouldQueueDailyCelebration,
      streak_pending_daily_celebration_date: shouldQueueDailyCelebration ? todayDate : workingState.streak_pending_daily_celebration_date,
      streak_pending_daily_streak_value: shouldQueueDailyCelebration ? streak : workingState.streak_pending_daily_streak_value,
    },
    nextFreezeCount: remainingFreezes,
    didChange: loadEvaluation.didChange || refundedReservedFreeze || didIncrement || Boolean(shouldQueueMilestone) || shouldQueueDailyCelebration,
    didIncrement,
    refundedReservedFreeze,
    milestoneReward: shouldQueueMilestone ? milestoneReward : null,
    queuedDailyCelebration: shouldQueueDailyCelebration,
  };
}

export function reserveStreakFreezeForToday(
  progress: Partial<StreakProgressFields> | null | undefined,
  now = new Date(),
  timezone = getLocalTimezone(),
) {
  const state = normalizeProgress(progress);
  const todayDate = getLocalDateKey(now, timezone);
  const alreadyCompletedToday = state.streak_activity_dates.includes(todayDate);

  if (alreadyCompletedToday || state.streak_freeze_reserved_for_date === todayDate) {
    return {
      didChange: false,
      nextProgress: {} as Partial<StreakProgressFields>,
    };
  }

  return {
    didChange: true,
    nextProgress: {
      streak_timezone: timezone,
      streak_freeze_reserved_for_date: todayDate,
    } satisfies Partial<StreakProgressFields>,
  };
}

export function getStreakRiskState(
  progress: Partial<StreakProgressFields> | null | undefined,
  freezeCount: number,
  now = new Date(),
  timezone = getLocalTimezone(),
): StreakRiskState | null {
  const state = normalizeProgress(progress);
  if (state.streak <= 0) return null;

  const todayDate = getLocalDateKey(now, timezone);
  if (state.streak_activity_dates.includes(todayDate)) return null;

  const { hour, minute, second } = getZonedParts(now, timezone);
  const hourValue = hour + minute / 60 + second / 3600;
  if (hourValue < STREAK_WARNING_HOUR) return null;

  const hoursLeft = Math.max(1, Math.ceil(24 - hourValue));

  return {
    level: hourValue >= STREAK_DANGER_HOUR ? "danger" : "warning",
    currentStreak: state.streak,
    hoursLeft,
    freezeCount: Math.max(0, freezeCount),
    reserved: state.streak_freeze_reserved_for_date === todayDate,
  };
}

export function getWeeklyStreakDays(
  progress: Partial<StreakProgressFields> | null | undefined,
  now = new Date(),
  timezone = getLocalTimezone(),
): StreakWeekDay[] {
  const state = normalizeProgress(progress);
  const todayDate = getLocalDateKey(now, timezone);
  const activityDates = new Set(state.streak_activity_dates);
  const protectedDates = new Set(state.streak_protected_dates);

  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(todayDate, index - 6);
    const date = new Date(`${dateKey}T12:00:00.000Z`);
    const label = buildDateFormatter(timezone, { weekday: "short" }).format(date);
    const isToday = dateKey === todayDate;

    let stateValue: StreakWeekDayState = "missed";

    if (activityDates.has(dateKey)) {
      stateValue = "completed";
    } else if (protectedDates.has(dateKey)) {
      stateValue = "protected";
    } else if (isToday && state.streak_freeze_reserved_for_date === todayDate) {
      stateValue = "reserved";
    } else if (isToday) {
      stateValue = "today_pending";
    }

    return {
      dateKey,
      label,
      isToday,
      state: stateValue,
    };
  });
}

export function clearProtectedPending(progress: Partial<StreakProgressFields> | null | undefined) {
  const state = normalizeProgress(progress);
  if (!state.streak_protected_pending && state.streak_protected_pending_count === 0 && !state.streak_protected_pending_date) {
    return { didChange: false, nextProgress: {} as Partial<StreakProgressFields> };
  }

  return {
    didChange: true,
    nextProgress: {
      streak_protected_pending: false,
      streak_protected_streak_value: 0,
      streak_protected_pending_date: null,
      streak_protected_pending_count: 0,
    } satisfies Partial<StreakProgressFields>,
  };
}

export function clearLostPending(progress: Partial<StreakProgressFields> | null | undefined) {
  const state = normalizeProgress(progress);
  if (!state.streak_lost_pending && state.streak_lost_value === 0) {
    return { didChange: false, nextProgress: {} as Partial<StreakProgressFields> };
  }

  return {
    didChange: true,
    nextProgress: {
      streak_lost_pending: false,
      streak_lost_value: 0,
    } satisfies Partial<StreakProgressFields>,
  };
}

export function clearPendingMilestone(progress: Partial<StreakProgressFields> | null | undefined) {
  const state = normalizeProgress(progress);
  if (!state.streak_pending_milestone) {
    return { didChange: false, nextProgress: {} as Partial<StreakProgressFields> };
  }

  return {
    didChange: true,
    nextProgress: {
      streak_pending_milestone: null,
      streak_seen_milestones: [...new Set([...state.streak_seen_milestones, String(state.streak_pending_milestone)])],
    } satisfies Partial<StreakProgressFields>,
  };
}

export function clearPendingDailyCelebration(progress: Partial<StreakProgressFields> | null | undefined) {
  const state = normalizeProgress(progress);
  if (!state.streak_pending_daily_celebration && !state.streak_pending_daily_celebration_date && state.streak_pending_daily_streak_value === 0) {
    return { didChange: false, nextProgress: {} as Partial<StreakProgressFields> };
  }

  return {
    didChange: true,
    nextProgress: {
      streak_pending_daily_celebration: false,
      streak_pending_daily_celebration_date: null,
      streak_pending_daily_streak_value: 0,
    } satisfies Partial<StreakProgressFields>,
  };
}
