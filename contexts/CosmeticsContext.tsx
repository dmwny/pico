"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { LearningLanguage } from "@/lib/courseContent";
import {
  arcRecordMapToNodeProgressMap,
  fetchRemoteArcProgressMap,
  getStoredArcProgressMap,
  mergeArcProgressRecordMaps,
  toArcProgressRecord,
  upsertRemoteArcProgressRecords,
} from "@/lib/lessonArc/arcProgress";
import {
  DevCheatState,
  getDefaultDevCheatState,
  getDevCheatsStorageKey,
  mergeDevCheatSources,
  getStoredDevCheats,
  PICO_DEV_CHEATS_EVENT,
  setStoredDevCheats,
} from "@/lib/devCheats";
import {
  activateUnlimitedHeartsPassWithToken,
  areCosmeticsStatesEqual,
  COSMETICS_REMOTE_TABLE,
  clearExpiredXpBoost,
  consumeHeartRefill,
  consumeHintToken,
  consumePerfectRunToken,
  consumeStreakFreeze,
  CosmeticsState,
  CosmeticItemId,
  equipCosmeticItem,
  equipTheme as equipThemeState,
  formatBoostCountdown,
  getDefaultCosmeticsState,
  getCosmeticsStorageKey,
  getStoredCosmeticsState,
  getUnlimitedHeartsRemainingMs,
  getXpBoostRemainingMs,
  grantTitleBadge,
  isXpBoostActive as getIsXpBoostActive,
  isUnlimitedHeartsActive,
  OpenThemePackResult,
  openThemePackPurchase,
  PICO_COSMETICS_EVENT,
  PackId,
  ProfileStats,
  purchaseShopEntry,
  recordChestOpened,
  resolveAppearance,
  ResolvedCosmeticAppearance,
  mergeCosmeticsStates,
  sanitizeCosmeticsState,
  setStreakFreezeCount,
  setStoredCosmeticsState,
  ShopEntryId,
  syncBestStreak,
  syncOpenedChestFloor,
  touchCosmeticsState,
} from "@/lib/cosmetics";
import type { PathThemeId } from "@/lib/themes";
import {
  getStoredLanguageProgress,
  mergeProgressSources,
  PICO_ACTIVE_LANGUAGE_EVENT,
  PICO_LANGUAGE_PROGRESS_EVENT,
  resolveActiveLanguage,
  serializeProgressForRemote,
  setStoredLanguageProgress,
  type ActiveLanguageChangeDetail,
  type LanguageProgressChangeDetail,
  type StoredLanguageProgress,
} from "@/lib/progress";
import {
  applyQualifiedActivity,
  clearLostPending,
  clearPendingDailyCelebration,
  clearPendingMilestone,
  clearProtectedPending,
  evaluateStreakOnLoad,
  getLocalTimezone,
  getMilestoneReward,
  getNextStreakMilestone,
  getStreakRiskState,
  getWeeklyStreakDays,
  reserveStreakFreezeForToday as reserveStreakFreezeProgress,
  type StreakMilestoneReward,
  type StreakRiskState,
  type StreakWeekDay,
} from "@/lib/streaks";
import { useUserStore } from "@/store/userStore";

type ToastTone = "info" | "success";

type AppToast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ProgressUpdateOptions = {
  syncRemote?: boolean;
  language?: LearningLanguage;
};

type PendingStreakProtection = {
  streak: number;
  date: string | null;
  count: number;
  remainingFreezes: number;
};

type PendingStreakLoss = {
  streak: number;
  bestStreak: number;
  nextMilestone: number;
};

type PendingDailyStreakCelebration = {
  streak: number;
  date: string | null;
};

type QualifiedStreakActivityResult = {
  progress: StoredLanguageProgress;
  milestoneReward: StreakMilestoneReward | null;
  refundedReservedFreeze: boolean;
};

type CosmeticsContextValue = {
  viewerId: string | null;
  viewerName: string;
  activeLanguage: LearningLanguage | null;
  loading: boolean;
  isHydrating: boolean;
  cosmetics: CosmeticsState;
  appearance: ResolvedCosmeticAppearance;
  progress: StoredLanguageProgress | null;
  profileStats: ProfileStats;
  gemBalance: number;
  infiniteGemsEnabled: boolean;
  xp: number;
  streak: number;
  bestStreak: number;
  streakFreezeCount: number;
  heartRefillCount: number;
  hintTokenCount: number;
  streakRisk: StreakRiskState | null;
  weeklyStreak: StreakWeekDay[];
  streakReservedDate: string | null;
  pendingStreakMilestone: StreakMilestoneReward | null;
  pendingDailyStreakCelebration: PendingDailyStreakCelebration | null;
  pendingStreakProtection: PendingStreakProtection | null;
  pendingStreakLoss: PendingStreakLoss | null;
  perfectRunTokenCount: number;
  xpBoostActive: boolean;
  xpBoostRemainingMs: number;
  xpBoostCountdown: string | null;
  unlimitedHeartsActive: boolean;
  unlimitedHeartsRemainingMs: number;
  unlimitedHeartsCountdown: string | null;
  toast: AppToast | null;
  dismissToast: () => void;
  openThemePack: (packId: PackId) => Promise<OpenThemePackResult>;
  purchaseEntry: (entryId: ShopEntryId) => Promise<ReturnType<typeof purchaseShopEntry>>;
  equipTheme: (themeId: PathThemeId) => void;
  equipItem: (itemId: CosmeticItemId) => void;
  updateProgress: (updates: Partial<StoredLanguageProgress>, options?: ProgressUpdateOptions) => Promise<StoredLanguageProgress | null>;
  saveProgressSnapshot: (snapshot: StoredLanguageProgress, options?: ProgressUpdateOptions) => Promise<StoredLanguageProgress | null>;
  applyQualifiedStreakActivity: (params: {
    language: LearningLanguage;
    baseProgress: StoredLanguageProgress;
  }) => Promise<QualifiedStreakActivityResult | null>;
  dismissStreakMilestone: () => Promise<void>;
  dismissDailyStreakCelebration: () => Promise<void>;
  dismissStreakProtectedNotice: () => Promise<void>;
  dismissStreakLoss: () => Promise<void>;
  reserveStreakFreezeForToday: () => Promise<boolean>;
  consumeStreakFreezeCharge: (message?: string) => boolean;
  consumeHeartRefillCharge: (message?: string) => boolean;
  consumeHintTokenCharge: (message?: string) => boolean;
  spendPerfectRunToken: () => boolean;
  activateUnlimitedHeartsWithToken: () => boolean;
  recordOpenedChest: (count?: number) => void;
  isXpBoostActiveAt: (timestamp: number) => boolean;
};

const CosmeticsContext = createContext<CosmeticsContextValue | null>(null);

type ViewerUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function mergeProgressSnapshot(
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

function parseRemoteStringArray(value: unknown) {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function parseRemoteJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function includesAllEntries(source: string[], target: string[]) {
  const sourceSet = new Set(source);
  return target.every((entry) => sourceSet.has(entry));
}

function getViewerDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.username,
    metadata.user_name,
    metadata.preferred_username,
    user.email ? user.email.split("@")[0] : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "Player";
}

export function CosmeticsProvider({ children }: { children: React.ReactNode }) {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("Player");
  const [activeLanguage, setActiveLanguage] = useState<LearningLanguage | null>(null);
  const [progress, setProgress] = useState<StoredLanguageProgress | null>(null);
  const [storedCosmetics, setStoredCosmetics] = useState<CosmeticsState>(getDefaultCosmeticsState());
  const [devCheats, setDevCheats] = useState<DevCheatState>(getDefaultDevCheatState());
  const [loading, setLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(true);
  const [toast, setToast] = useState<AppToast | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const toastTimeoutRef = useRef<number | null>(null);
  const remoteCosmeticsAvailableRef = useRef(true);
  const remoteCosmeticsWarnedRef = useRef(false);
  const hydrationRunRef = useRef(0);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2600);

    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [toast]);

  const loadForLanguage = useCallback(async (userId: string, language: LearningLanguage) => {
    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("language", language)
      .maybeSingle();

    const localProgress = getStoredLanguageProgress(userId, language);
    const merged = mergeProgressSources(language, data, localProgress);
    const cachedArcRecords = getStoredArcProgressMap(userId, language);
    const remoteArcRecords = await fetchRemoteArcProgressMap(userId, language);
    const compatArcRecords = Object.fromEntries(
      Object.values(merged.arc_progress).map((entry) => [entry.nodeId, toArcProgressRecord(entry)]),
    );
    const mergedArcRecords = mergeArcProgressRecordMaps(
      remoteArcRecords ?? {},
      cachedArcRecords,
      compatArcRecords,
    );
    const mergedWithArcTable = {
      ...merged,
      arc_progress: Object.keys(mergedArcRecords).length > 0
        ? arcRecordMapToNodeProgressMap(mergedArcRecords, merged.arc_progress)
        : merged.arc_progress,
    };
    setStoredLanguageProgress(userId, language, mergedWithArcTable);
    setProgress(mergedWithArcTable);

    const remoteCompletedLessons = parseRemoteStringArray(data?.completed_lessons);
    const remoteClaimedChests = parseRemoteStringArray(data?.claimed_chests);
    const remoteAchievements = parseRemoteStringArray(data?.achievements);
    const remoteNeedsBackfill =
      !data
      || !includesAllEntries(remoteCompletedLessons, merged.completed_lessons)
      || JSON.stringify(mergedWithArcTable.arc_progress) !== JSON.stringify(parseRemoteJson(data?.arc_progress, {}))
      || JSON.stringify(mergedWithArcTable.active_lesson_session) !== JSON.stringify(parseRemoteJson(data?.active_lesson_session, null))
      || !includesAllEntries(remoteClaimedChests, mergedWithArcTable.claimed_chests)
      || !includesAllEntries(remoteAchievements, mergedWithArcTable.achievements)
      || mergedWithArcTable.xp > Number(data?.xp || 0)
      || mergedWithArcTable.streak > Number(data?.streak || 0)
      || mergedWithArcTable.gems > Number(data?.gems || 0)
      || mergedWithArcTable.best_streak > Number(data?.best_streak || 0)
      || mergedWithArcTable.today_xp > Number(data?.today_xp || 0)
      || mergedWithArcTable.today_lessons > Number(data?.today_lessons || 0)
      || mergedWithArcTable.today_perfect > Number(data?.today_perfect || 0)
      || (mergedWithArcTable.last_played && mergedWithArcTable.last_played !== data?.last_played)
      || (mergedWithArcTable.streak_last_activity_date && mergedWithArcTable.streak_last_activity_date !== data?.streak_last_activity_date)
      || (mergedWithArcTable.streak_timezone && mergedWithArcTable.streak_timezone !== data?.streak_timezone)
      || mergedWithArcTable.streak_activity_dates.length > parseRemoteStringArray(data?.streak_activity_dates).length
      || mergedWithArcTable.streak_protected_dates.length > parseRemoteStringArray(data?.streak_protected_dates).length
      || mergedWithArcTable.streak_freeze_reserved_for_date !== (typeof data?.streak_freeze_reserved_for_date === "string" ? data.streak_freeze_reserved_for_date : null)
      || mergedWithArcTable.streak_freeze_last_consumed_date !== (typeof data?.streak_freeze_last_consumed_date === "string" ? data.streak_freeze_last_consumed_date : null)
      || mergedWithArcTable.streak_protected_pending !== Boolean(data?.streak_protected_pending)
      || mergedWithArcTable.streak_protected_streak_value > Number(data?.streak_protected_streak_value || 0)
      || mergedWithArcTable.streak_protected_pending_date !== (typeof data?.streak_protected_pending_date === "string" ? data.streak_protected_pending_date : null)
      || mergedWithArcTable.streak_protected_pending_count > Number(data?.streak_protected_pending_count || 0)
      || mergedWithArcTable.streak_pending_milestone !== (data?.streak_pending_milestone ?? null)
      || mergedWithArcTable.streak_pending_daily_celebration !== Boolean(data?.streak_pending_daily_celebration)
      || mergedWithArcTable.streak_pending_daily_celebration_date !== (typeof data?.streak_pending_daily_celebration_date === "string" ? data.streak_pending_daily_celebration_date : null)
      || mergedWithArcTable.streak_pending_daily_streak_value > Number(data?.streak_pending_daily_streak_value || 0)
      || mergedWithArcTable.streak_seen_milestones.length > parseRemoteStringArray(data?.streak_seen_milestones).length
      || mergedWithArcTable.streak_lost_pending !== Boolean(data?.streak_lost_pending)
      || mergedWithArcTable.streak_lost_value > Number(data?.streak_lost_value || 0);

    if (remoteNeedsBackfill) {
      await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          userId,
          language,
          values: serializeProgressForRemote(mergedWithArcTable),
        }),
      }).catch(() => {
        console.warn("Merged progress backfill failed. Local cache remains ahead of remote.");
      });
    }
    if (Object.keys(mergedArcRecords).length > 0) {
      await upsertRemoteArcProgressRecords(userId, language, Object.values(mergedArcRecords));
    }
    return mergedWithArcTable;
  }, []);

  const warnRemoteCosmeticsFallback = useCallback((error: unknown) => {
    if (remoteCosmeticsWarnedRef.current) return;
    remoteCosmeticsWarnedRef.current = true;
    console.warn("Remote cosmetics sync failed. Falling back to local cache.", error);
  }, []);

  const fetchRemoteCosmetics = useCallback(async (userId: string) => {
    if (!remoteCosmeticsAvailableRef.current) return null;

    const { data, error } = await supabase
      .from(COSMETICS_REMOTE_TABLE)
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
      if (code === "42P01") {
        remoteCosmeticsAvailableRef.current = false;
      }
      warnRemoteCosmeticsFallback(error);
      return null;
    }

    return data?.state ? clearExpiredXpBoost(sanitizeCosmeticsState(data.state), Date.now()) : null;
  }, [warnRemoteCosmeticsFallback]);

  const persistRemoteCosmetics = useCallback(async (userId: string, state: CosmeticsState) => {
    if (!remoteCosmeticsAvailableRef.current) return false;

    const { error } = await supabase
      .from(COSMETICS_REMOTE_TABLE)
      .upsert(
        {
          user_id: userId,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
      if (code === "42P01") {
        remoteCosmeticsAvailableRef.current = false;
      }
      warnRemoteCosmeticsFallback(error);
      return false;
    }

    return true;
  }, [warnRemoteCosmeticsFallback]);

  const syncUserStoreProgress = useCallback((
    previousProgress: StoredLanguageProgress | null | undefined,
    nextProgress: StoredLanguageProgress,
    syncRemoteProfile = true,
  ) => {
    const store = useUserStore.getState();
    const xpDelta = nextProgress.xp - (previousProgress?.xp ?? 0);
    const nextTotalXp = Math.max(0, store.xp + xpDelta);
    const nextWeeklyXp = Math.max(0, store.weeklyXP + xpDelta);

    store.hydrate({
      xp: nextTotalXp,
      weeklyXP: nextWeeklyXp,
      streak: nextProgress.streak,
      lastActiveDate: nextProgress.last_played ?? nextProgress.streak_last_activity_date ?? store.lastActiveDate,
    });

    if (syncRemoteProfile) {
      void store.syncToServer();
    }
  }, []);

  const applyPersistedSnapshots = useCallback(async ({
    userId,
    language,
    previousProgress,
    nextProgress,
    nextCosmetics,
    syncRemoteProgress = true,
    syncRemoteCosmetics = true,
  }: {
    userId: string;
    language: LearningLanguage;
    previousProgress?: StoredLanguageProgress | null;
    nextProgress: StoredLanguageProgress;
    nextCosmetics: CosmeticsState;
    syncRemoteProgress?: boolean;
    syncRemoteCosmetics?: boolean;
  }) => {
    const stampedCosmetics = touchCosmeticsState(nextCosmetics);

    setStoredLanguageProgress(userId, language, nextProgress);
    if (activeLanguage === language) {
      setProgress(nextProgress);
    }
    syncUserStoreProgress(previousProgress, nextProgress, syncRemoteProgress);

    setStoredCosmetics(stampedCosmetics);
    setStoredCosmeticsState(userId, stampedCosmetics);

    const tasks: Promise<unknown>[] = [];

    if (syncRemoteProgress) {
      tasks.push(
        fetch("/api/progress", {
          method: "POST",
          body: JSON.stringify({
            userId,
            language,
            values: serializeProgressForRemote(nextProgress),
          }),
        }).catch(() => {
          console.warn("Progress sync failed after combined streak update.");
        }),
      );
    }

    if (syncRemoteCosmetics) {
      tasks.push(persistRemoteCosmetics(userId, stampedCosmetics));
    }

    await Promise.all(tasks);

    return {
      progress: nextProgress,
      cosmetics: stampedCosmetics,
    };
  }, [activeLanguage, persistRemoteCosmetics, syncUserStoreProgress]);

  const syncLoadedStreakState = useCallback(async (
    userId: string,
    language: LearningLanguage,
    loadedProgress: StoredLanguageProgress,
    baseCosmetics: CosmeticsState,
  ) => {
    const timezone = loadedProgress.streak_timezone ?? getLocalTimezone();
    const evaluation = evaluateStreakOnLoad(
      loadedProgress,
      baseCosmetics.functional.streakFreezes,
      new Date(),
      timezone,
    );
    const nextProgress = mergeProgressSnapshot(loadedProgress, language, evaluation.nextProgress);
    const nextCosmetics = syncBestStreak(
      setStreakFreezeCount(baseCosmetics, evaluation.nextFreezeCount),
      nextProgress.best_streak,
    );

    const progressChanged = JSON.stringify(nextProgress) !== JSON.stringify(loadedProgress);
    const cosmeticsChanged = !areCosmeticsStatesEqual(nextCosmetics, baseCosmetics);

    if (!progressChanged && !cosmeticsChanged) {
      return {
        progress: loadedProgress,
        cosmetics: baseCosmetics,
      };
    }

    return applyPersistedSnapshots({
      userId,
      language,
      previousProgress: loadedProgress,
      nextProgress,
      nextCosmetics,
      syncRemoteProgress: progressChanged,
      syncRemoteCosmetics: cosmeticsChanged,
    });
  }, [applyPersistedSnapshots]);

  const resetViewerState = useCallback(() => {
    hydrationRunRef.current += 1;
    setViewerId(null);
    setViewerName("Player");
    setActiveLanguage(null);
    setProgress(null);
    setStoredCosmetics(getDefaultCosmeticsState());
    setDevCheats(getDefaultDevCheatState());
    setLoading(false);
    setIsHydrating(false);
  }, []);

  const hydrateUserState = useCallback(async (user: ViewerUser) => {
    const hydrateId = hydrationRunRef.current + 1;
    hydrationRunRef.current = hydrateId;
    setIsHydrating(true);

    try {
      const language = await resolveActiveLanguage(user.id);
      if (hydrationRunRef.current !== hydrateId) return;

      setViewerId(user.id);
      setViewerName(getViewerDisplayName(user));
      setActiveLanguage(language);
      const loadedProgress = await loadForLanguage(user.id, language);
      if (hydrationRunRef.current !== hydrateId) return;

      const localCosmetics = clearExpiredXpBoost(getStoredCosmeticsState(user.id), Date.now());
      const remoteCosmetics = await fetchRemoteCosmetics(user.id);
      if (hydrationRunRef.current !== hydrateId) return;

      const mergedCosmetics = mergeCosmeticsStates(localCosmetics, remoteCosmetics);
      setStoredCosmetics(mergedCosmetics);
      setStoredCosmeticsState(user.id, mergedCosmetics);
      if (!areCosmeticsStatesEqual(remoteCosmetics, mergedCosmetics)) {
        await persistRemoteCosmetics(user.id, mergedCosmetics);
      }
      if (hydrationRunRef.current !== hydrateId) return;

      const mergedDevCheats = mergeDevCheatSources(getStoredDevCheats(user.id), user.user_metadata);
      setDevCheats(mergedDevCheats);
      setStoredDevCheats(user.id, mergedDevCheats);

      if (loadedProgress) {
        await syncLoadedStreakState(user.id, language, loadedProgress, mergedCosmetics);
      }
    } finally {
      if (hydrationRunRef.current === hydrateId) {
        setLoading(false);
        setIsHydrating(false);
      }
    }
  }, [fetchRemoteCosmetics, loadForLanguage, persistRemoteCosmetics, syncLoadedStreakState]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setIsHydrating(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        resetViewerState();
        return;
      }

      await hydrateUserState(user);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [hydrateUserState, resetViewerState]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        resetViewerState();
        return;
      }

      void hydrateUserState(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateUserState, resetViewerState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const cosmetics = useMemo(() => clearExpiredXpBoost(storedCosmetics, now), [storedCosmetics, now]);

  useEffect(() => {
    if (!viewerId) return;
    if (cosmetics !== storedCosmetics) {
      setStoredCosmeticsState(viewerId, cosmetics);
    }
  }, [cosmetics, storedCosmetics, viewerId]);

  useEffect(() => {
    if (!viewerId) return undefined;
    const currentViewerId = viewerId;

    function handleProgressEvent(event: Event) {
      const detail = (event as CustomEvent<LanguageProgressChangeDetail>).detail;
      if (!detail || detail.userId !== viewerId) return;
      if (activeLanguage && detail.language !== activeLanguage) return;
      setProgress(detail.progress);
    }

    function handleLanguageEvent(event: Event) {
      const detail = (event as CustomEvent<ActiveLanguageChangeDetail>).detail;
      if (!detail || detail.userId !== viewerId) return;
      setActiveLanguage(detail.language);
      void (async () => {
        const loadedProgress = await loadForLanguage(viewerId, detail.language);
        await syncLoadedStreakState(viewerId, detail.language, loadedProgress, storedCosmetics);
      })();
    }

    function handleCosmeticsEvent(event: Event) {
      const detail = (event as CustomEvent<{ userId: string; state: CosmeticsState }>).detail;
      if (!detail || detail.userId !== viewerId) return;
      setStoredCosmetics(detail.state);
    }

    function handleDevCheatEvent(event: Event) {
      const detail = (event as CustomEvent<{ userId: string; state: DevCheatState }>).detail;
      if (!detail || detail.userId !== viewerId) return;
      setDevCheats(detail.state);
    }

    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) return;

      if (event.key === getCosmeticsStorageKey(currentViewerId)) {
        setStoredCosmetics(getStoredCosmeticsState(currentViewerId));
      } else if (event.key === getDevCheatsStorageKey(currentViewerId)) {
        setDevCheats(getStoredDevCheats(currentViewerId));
      }
    }

    window.addEventListener(PICO_LANGUAGE_PROGRESS_EVENT, handleProgressEvent as EventListener);
    window.addEventListener(PICO_ACTIVE_LANGUAGE_EVENT, handleLanguageEvent as EventListener);
    window.addEventListener(PICO_COSMETICS_EVENT, handleCosmeticsEvent as EventListener);
    window.addEventListener(PICO_DEV_CHEATS_EVENT, handleDevCheatEvent as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PICO_LANGUAGE_PROGRESS_EVENT, handleProgressEvent as EventListener);
      window.removeEventListener(PICO_ACTIVE_LANGUAGE_EVENT, handleLanguageEvent as EventListener);
      window.removeEventListener(PICO_COSMETICS_EVENT, handleCosmeticsEvent as EventListener);
      window.removeEventListener(PICO_DEV_CHEATS_EVENT, handleDevCheatEvent as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [activeLanguage, loadForLanguage, storedCosmetics, syncLoadedStreakState, viewerId]);

  const updateProgress = useCallback(
    async (updates: Partial<StoredLanguageProgress>, options: ProgressUpdateOptions = {}) => {
      const targetLanguage = options.language ?? activeLanguage;
      if (!viewerId || !targetLanguage) return null;

      const baseProgress = targetLanguage === activeLanguage
        ? progress
        : getStoredLanguageProgress(viewerId, targetLanguage);
      const nextProgress = mergeProgressSnapshot(baseProgress, targetLanguage, updates);
      setStoredLanguageProgress(viewerId, targetLanguage, nextProgress);
      syncUserStoreProgress(baseProgress, nextProgress, options.syncRemote !== false);
      if (targetLanguage === activeLanguage) {
        setProgress(nextProgress);
      }

      if (options.syncRemote !== false) {
        const values = serializeProgressForRemote(updates);
        if (Object.keys(values).length > 0) {
          await fetch("/api/progress", {
            method: "POST",
            body: JSON.stringify({
              userId: viewerId,
              language: targetLanguage,
              values,
            }),
          }).catch(() => {
            console.warn("Progress sync failed after a local-only update.");
          });
        }
      }

      return nextProgress;
    },
    [activeLanguage, progress, syncUserStoreProgress, viewerId],
  );

  const saveProgressSnapshot = useCallback(
    async (snapshot: StoredLanguageProgress, options: ProgressUpdateOptions = {}) => {
      const targetLanguage = options.language ?? activeLanguage ?? snapshot.language;
      if (!viewerId || !targetLanguage) return null;
      const previousProgress = targetLanguage === activeLanguage
        ? progress
        : getStoredLanguageProgress(viewerId, targetLanguage);

      setStoredLanguageProgress(viewerId, targetLanguage, snapshot);
      syncUserStoreProgress(previousProgress, snapshot, options.syncRemote !== false);
      if (targetLanguage === activeLanguage) {
        setProgress(snapshot);
      }

      if (options.syncRemote !== false) {
        await fetch("/api/progress", {
          method: "POST",
          body: JSON.stringify({
            userId: viewerId,
            language: targetLanguage,
            values: serializeProgressForRemote(snapshot),
          }),
        }).catch(() => {
          console.warn("Progress snapshot sync failed.");
        });
      }

      return snapshot;
    },
    [activeLanguage, progress, syncUserStoreProgress, viewerId],
  );

  const persistCosmetics = useCallback(
    async (nextState: CosmeticsState) => {
      const stampedState = touchCosmeticsState(nextState);
      setStoredCosmetics(stampedState);
      if (viewerId) {
        setStoredCosmeticsState(viewerId, stampedState);
        await persistRemoteCosmetics(viewerId, stampedState);
      }
      return stampedState;
    },
    [persistRemoteCosmetics, viewerId],
  );

  const applyQualifiedStreakActivity = useCallback(async ({
    language,
    baseProgress,
  }: {
    language: LearningLanguage;
    baseProgress: StoredLanguageProgress;
  }) => {
    if (!viewerId) return null;

    const timezone = baseProgress.streak_timezone ?? getLocalTimezone();
    const evaluation = applyQualifiedActivity(
      baseProgress,
      cosmetics.functional.streakFreezes,
      new Date(),
      timezone,
    );

    let nextProgress = mergeProgressSnapshot(baseProgress, language, evaluation.nextProgress);
    let nextCosmetics = cosmetics;

    if (evaluation.milestoneReward) {
      nextProgress = mergeProgressSnapshot(nextProgress, language, {
        gems: nextProgress.gems + evaluation.milestoneReward.gems,
      });
    }

    nextCosmetics = syncBestStreak(
      setStreakFreezeCount(nextCosmetics, evaluation.nextFreezeCount),
      nextProgress.best_streak,
    );

    if (evaluation.refundedReservedFreeze) {
      showToast("Freeze returned. You kept the streak yourself.", "info");
    }

    if (evaluation.milestoneReward?.titleBadgeId) {
      nextCosmetics = grantTitleBadge(nextCosmetics, evaluation.milestoneReward.titleBadgeId);
    }

    await applyPersistedSnapshots({
      userId: viewerId,
      language,
      previousProgress: baseProgress,
      nextProgress,
      nextCosmetics,
      syncRemoteProgress: true,
      syncRemoteCosmetics: true,
    });

    return {
      progress: nextProgress,
      milestoneReward: evaluation.milestoneReward,
      refundedReservedFreeze: evaluation.refundedReservedFreeze,
    } satisfies QualifiedStreakActivityResult;
  }, [applyPersistedSnapshots, cosmetics, showToast, viewerId]);

  const dismissStreakMilestone = useCallback(async () => {
    if (!viewerId || !activeLanguage || !progress) return;
    const cleared = clearPendingMilestone(progress);
    if (!cleared.didChange) return;
    const nextProgress = mergeProgressSnapshot(progress, activeLanguage, cleared.nextProgress);
    await saveProgressSnapshot(nextProgress, { language: activeLanguage, syncRemote: true });
  }, [activeLanguage, progress, saveProgressSnapshot, viewerId]);

  const dismissDailyStreakCelebration = useCallback(async () => {
    if (!viewerId || !activeLanguage || !progress) return;
    const cleared = clearPendingDailyCelebration(progress);
    if (!cleared.didChange) return;
    const nextProgress = mergeProgressSnapshot(progress, activeLanguage, cleared.nextProgress);
    await saveProgressSnapshot(nextProgress, { language: activeLanguage, syncRemote: true });
  }, [activeLanguage, progress, saveProgressSnapshot, viewerId]);

  const dismissStreakProtectedNotice = useCallback(async () => {
    if (!viewerId || !activeLanguage || !progress) return;
    const cleared = clearProtectedPending(progress);
    if (!cleared.didChange) return;
    const nextProgress = mergeProgressSnapshot(progress, activeLanguage, cleared.nextProgress);
    await saveProgressSnapshot(nextProgress, { language: activeLanguage, syncRemote: true });
  }, [activeLanguage, progress, saveProgressSnapshot, viewerId]);

  const dismissStreakLoss = useCallback(async () => {
    if (!viewerId || !activeLanguage || !progress) return;
    const cleared = clearLostPending(progress);
    if (!cleared.didChange) return;
    const nextProgress = mergeProgressSnapshot(progress, activeLanguage, cleared.nextProgress);
    await saveProgressSnapshot(nextProgress, { language: activeLanguage, syncRemote: true });
  }, [activeLanguage, progress, saveProgressSnapshot, viewerId]);

  const reserveStreakFreezeForToday = useCallback(async () => {
    if (!viewerId || !activeLanguage || !progress) return false;
    if (cosmetics.functional.streakFreezes <= 0) return false;

    const reservation = reserveStreakFreezeProgress(progress, new Date(), progress.streak_timezone ?? getLocalTimezone());
    if (!reservation.didChange) return false;

    const nextProgress = mergeProgressSnapshot(progress, activeLanguage, reservation.nextProgress);
    const consumed = consumeStreakFreeze(cosmetics);
    if (!consumed.consumed) return false;

    await applyPersistedSnapshots({
      userId: viewerId,
      language: activeLanguage,
      previousProgress: progress,
      nextProgress,
      nextCosmetics: consumed.nextState,
      syncRemoteProgress: true,
      syncRemoteCosmetics: true,
    });

    showToast("Freeze armed for tonight", "info");
    return true;
  }, [activeLanguage, applyPersistedSnapshots, cosmetics, progress, showToast, viewerId]);

  useEffect(() => {
    if (isHydrating) return;
    if (!viewerId) return;
    if (!progress) return;
    const nextBestState = syncBestStreak(storedCosmetics, progress.best_streak);
    const nextStatsState = syncOpenedChestFloor(nextBestState, progress.claimed_chests.length);

    if (nextStatsState !== storedCosmetics) {
      queueMicrotask(() => {
        void persistCosmetics(nextStatsState);
      });
    }
  }, [isHydrating, persistCosmetics, progress, storedCosmetics, viewerId]);

  const purchaseEntry = useCallback(
    async (entryId: ShopEntryId) => {
      const result = purchaseShopEntry(
        cosmetics,
        progress?.gems ?? 0,
        entryId,
        new Date(),
        devCheats.infiniteGems
          ? {
              bypassCost: true,
              trackSpend: false,
            }
          : undefined,
      );
      if (!result.ok) return result;

      await persistCosmetics(result.nextState);
      if (!devCheats.infiniteGems) {
        await updateProgress({ gems: result.nextGems }, { syncRemote: true });
      }
      showToast(`${result.grantedLabel} added`, "success");
      return result;
    },
    [cosmetics, devCheats.infiniteGems, persistCosmetics, progress?.gems, showToast, updateProgress],
  );

  const openThemePack = useCallback(
    async (packId: PackId) => {
      const result = openThemePackPurchase(
        cosmetics,
        progress?.gems ?? 0,
        packId,
        new Date(),
        devCheats.infiniteGems
          ? {
              bypassCost: true,
              trackSpend: false,
            }
          : undefined,
      );

      if (!result.ok) return result;

      await persistCosmetics(result.nextState);
      if (!devCheats.infiniteGems || result.roll.duplicateCompensationGems > 0) {
        await updateProgress({ gems: result.nextGems }, { syncRemote: true });
      }
      return result;
    },
    [cosmetics, devCheats.infiniteGems, persistCosmetics, progress?.gems, updateProgress],
  );

  const equipTheme = useCallback(
    (themeId: PathThemeId) => {
      const nextState = equipThemeState(cosmetics, themeId);
      void persistCosmetics(nextState);
    },
    [cosmetics, persistCosmetics],
  );

  const equipItem = useCallback(
    (itemId: CosmeticItemId) => {
      const nextState = equipCosmeticItem(cosmetics, itemId);
      void persistCosmetics(nextState);
    },
    [cosmetics, persistCosmetics],
  );

  const consumeStreakFreezeCharge = useCallback(
    (message = "Streak protected by freeze") => {
      const result = consumeStreakFreeze(cosmetics);
      if (!result.consumed) return false;
      void persistCosmetics(result.nextState);
      showToast(message, "info");
      return true;
    },
    [cosmetics, persistCosmetics, showToast],
  );

  const spendPerfectRunToken = useCallback(() => {
    const result = consumePerfectRunToken(cosmetics);
    if (!result.consumed) return false;
    void persistCosmetics(result.nextState);
    return true;
  }, [cosmetics, persistCosmetics]);

  const consumeHeartRefillCharge = useCallback(
    (message = "Hearts refilled") => {
      const result = consumeHeartRefill(cosmetics);
      if (!result.consumed) return false;
      void persistCosmetics(result.nextState);
      showToast(message, "success");
      return true;
    },
    [cosmetics, persistCosmetics, showToast],
  );

  const consumeHintTokenCharge = useCallback(
    (message = "Hint token used") => {
      const result = consumeHintToken(cosmetics);
      if (!result.consumed) return false;
      void persistCosmetics(result.nextState);
      showToast(message, "info");
      return true;
    },
    [cosmetics, persistCosmetics, showToast],
  );

  const activateUnlimitedHeartsWithToken = useCallback(() => {
    const result = activateUnlimitedHeartsPassWithToken(cosmetics, new Date());
    if (!result.consumed) return false;
    void persistCosmetics(result.nextState);
    showToast("Unlimited hearts activated", "success");
    return true;
  }, [cosmetics, persistCosmetics, showToast]);

  const recordOpenedChest = useCallback((count = 1) => {
    void persistCosmetics(recordChestOpened(cosmetics, count));
  }, [cosmetics, persistCosmetics]);

  const appearance = useMemo(() => resolveAppearance(cosmetics), [cosmetics]);
  const xpBoostRemainingMs = getXpBoostRemainingMs(cosmetics, now);
  const xpBoostRunning = xpBoostRemainingMs > 0;
  const rawUnlimitedHeartsRemainingMs = getUnlimitedHeartsRemainingMs(cosmetics, now);
  const rawUnlimitedHeartsRunning = isUnlimitedHeartsActive(cosmetics, now);
  const unlimitedHeartsRemainingMs = Math.max(rawUnlimitedHeartsRemainingMs, xpBoostRemainingMs);
  const unlimitedHeartsRunning = rawUnlimitedHeartsRunning || xpBoostRunning;
  const streakTimezone = progress?.streak_timezone ?? getLocalTimezone();
  const weeklyStreak = useMemo(
    () => getWeeklyStreakDays(progress, new Date(now), streakTimezone),
    [now, progress, streakTimezone],
  );
  const streakRisk = useMemo(
    () => getStreakRiskState(progress, cosmetics.functional.streakFreezes, new Date(now), streakTimezone),
    [cosmetics.functional.streakFreezes, now, progress, streakTimezone],
  );
  const pendingStreakMilestone = useMemo(
    () => (progress?.streak_pending_milestone ? getMilestoneReward(progress.streak_pending_milestone) : null),
    [progress?.streak_pending_milestone],
  );
  const pendingDailyStreakCelebration = useMemo<PendingDailyStreakCelebration | null>(() => {
    if (!progress?.streak_pending_daily_celebration || (progress.streak_pending_daily_streak_value ?? 0) <= 0) {
      return null;
    }

    return {
      streak: progress.streak_pending_daily_streak_value,
      date: progress.streak_pending_daily_celebration_date,
    };
  }, [
    progress?.streak_pending_daily_celebration,
    progress?.streak_pending_daily_celebration_date,
    progress?.streak_pending_daily_streak_value,
  ]);
  const pendingStreakProtection = useMemo<PendingStreakProtection | null>(() => {
    if (!progress?.streak_protected_pending) return null;
    return {
      streak: progress.streak_protected_streak_value || progress.streak,
      date: progress.streak_protected_pending_date,
      count: progress.streak_protected_pending_count || 1,
      remainingFreezes: cosmetics.functional.streakFreezes,
    };
  }, [
    cosmetics.functional.streakFreezes,
    progress?.streak,
    progress?.streak_protected_pending,
    progress?.streak_protected_pending_count,
    progress?.streak_protected_pending_date,
    progress?.streak_protected_streak_value,
  ]);
  const pendingStreakLoss = useMemo<PendingStreakLoss | null>(() => {
    if (!progress?.streak_lost_pending || progress.streak_lost_value < 3) return null;
    return {
      streak: progress.streak_lost_value,
      bestStreak: progress.best_streak,
      nextMilestone: getNextStreakMilestone(progress.streak_lost_value),
    };
  }, [progress?.best_streak, progress?.streak_lost_pending, progress?.streak_lost_value]);

  const value = useMemo<CosmeticsContextValue>(
    () => ({
      viewerId,
      viewerName,
      activeLanguage,
      loading,
      isHydrating,
      cosmetics,
      appearance,
      progress,
      profileStats: cosmetics.stats,
      gemBalance: progress?.gems ?? 0,
      infiniteGemsEnabled: devCheats.infiniteGems,
      xp: progress?.xp ?? 0,
      streak: progress?.streak ?? 0,
      bestStreak: progress?.best_streak ?? cosmetics.stats.bestStreak,
      streakFreezeCount: cosmetics.functional.streakFreezes,
      heartRefillCount: cosmetics.functional.heartRefills,
      hintTokenCount: cosmetics.functional.hintTokens,
      streakRisk,
      weeklyStreak,
      streakReservedDate: progress?.streak_freeze_reserved_for_date ?? null,
      pendingStreakMilestone,
      pendingDailyStreakCelebration,
      pendingStreakProtection,
      pendingStreakLoss,
      perfectRunTokenCount: cosmetics.functional.perfectRunTokens,
      xpBoostActive: xpBoostRunning,
      xpBoostRemainingMs,
      xpBoostCountdown: xpBoostRunning ? formatBoostCountdown(xpBoostRemainingMs) : null,
      unlimitedHeartsActive: unlimitedHeartsRunning,
      unlimitedHeartsRemainingMs,
      unlimitedHeartsCountdown: unlimitedHeartsRunning ? formatBoostCountdown(unlimitedHeartsRemainingMs) : null,
      toast,
      dismissToast,
      openThemePack,
      purchaseEntry,
      equipTheme,
      equipItem,
      updateProgress,
      saveProgressSnapshot,
      applyQualifiedStreakActivity,
      dismissDailyStreakCelebration,
      dismissStreakMilestone,
      dismissStreakProtectedNotice,
      dismissStreakLoss,
      reserveStreakFreezeForToday,
      consumeStreakFreezeCharge,
      consumeHeartRefillCharge,
      consumeHintTokenCharge,
      spendPerfectRunToken,
      activateUnlimitedHeartsWithToken,
      recordOpenedChest,
      isXpBoostActiveAt: (timestamp: number) => getIsXpBoostActive(cosmetics, timestamp),
    }),
    [
      activeLanguage,
      appearance,
      cosmetics,
      devCheats.infiniteGems,
      dismissToast,
      dismissStreakLoss,
      dismissDailyStreakCelebration,
      dismissStreakMilestone,
      dismissStreakProtectedNotice,
      applyQualifiedStreakActivity,
      pendingDailyStreakCelebration,
      pendingStreakLoss,
      pendingStreakMilestone,
      pendingStreakProtection,
      openThemePack,
      equipItem,
      equipTheme,
      loading,
      isHydrating,
      progress,
      purchaseEntry,
      recordOpenedChest,
      reserveStreakFreezeForToday,
      saveProgressSnapshot,
      streakRisk,
      toast,
      updateProgress,
      weeklyStreak,
      spendPerfectRunToken,
      consumeHeartRefillCharge,
      consumeHintTokenCharge,
      consumeStreakFreezeCharge,
      activateUnlimitedHeartsWithToken,
      viewerId,
      viewerName,
      unlimitedHeartsRunning,
      unlimitedHeartsRemainingMs,
      xpBoostRunning,
      xpBoostRemainingMs,
    ],
  );

  return (
    <CosmeticsContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
          <div
            className={`rounded-[1.4rem] border px-4 py-3 text-sm font-bold shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${
              toast.tone === "info"
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-emerald-200 bg-white text-slate-900"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </CosmeticsContext.Provider>
  );
}

export function useCosmetics() {
  const value = useContext(CosmeticsContext);
  if (!value) {
    throw new Error("useCosmetics must be used within CosmeticsProvider");
  }
  return value;
}
