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
  DevCheatState,
  getDefaultDevCheatState,
  getDevCheatsStorageKey,
  getStoredDevCheats,
  PICO_DEV_CHEATS_EVENT,
} from "@/lib/devCheats";
import {
  clearExpiredXpBoost,
  consumePerfectRunToken,
  consumeStreakFreeze,
  CosmeticsState,
  CosmeticItemId,
  equipCosmeticItem,
  equipPackBundle,
  formatBoostCountdown,
  getDefaultCosmeticsState,
  getCosmeticsStorageKey,
  getStoredCosmeticsState,
  getXpBoostRemainingMs,
  isXpBoostActive as getIsXpBoostActive,
  PICO_COSMETICS_EVENT,
  ProfileStats,
  purchaseShopEntry,
  recordChestOpened,
  resolveAppearance,
  ResolvedCosmeticAppearance,
  setStoredCosmeticsState,
  ShopEntryId,
  syncBestStreak,
  syncOpenedChestFloor,
  PackId,
} from "@/lib/cosmetics";
import {
  getStoredLanguageProgress,
  mergeProgressSources,
  PICO_ACTIVE_LANGUAGE_EVENT,
  PICO_LANGUAGE_PROGRESS_EVENT,
  resolveActiveLanguage,
  setStoredLanguageProgress,
  type ActiveLanguageChangeDetail,
  type LanguageProgressChangeDetail,
  type StoredLanguageProgress,
} from "@/lib/progress";

type ToastTone = "info" | "success";

type AppToast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ProgressUpdateOptions = {
  syncRemote?: boolean;
};

type CosmeticsContextValue = {
  viewerId: string | null;
  viewerName: string;
  activeLanguage: LearningLanguage | null;
  loading: boolean;
  cosmetics: CosmeticsState;
  appearance: ResolvedCosmeticAppearance;
  progress: StoredLanguageProgress | null;
  profileStats: ProfileStats;
  gemBalance: number;
  infiniteGemsEnabled: boolean;
  xp: number;
  streak: number;
  streakFreezeCount: number;
  perfectRunTokenCount: number;
  xpBoostActive: boolean;
  xpBoostRemainingMs: number;
  xpBoostCountdown: string | null;
  toast: AppToast | null;
  dismissToast: () => void;
  purchaseEntry: (entryId: ShopEntryId) => Promise<ReturnType<typeof purchaseShopEntry>>;
  equipPack: (packId: PackId) => void;
  equipItem: (itemId: CosmeticItemId) => void;
  updateProgress: (updates: Partial<StoredLanguageProgress>, options?: ProgressUpdateOptions) => Promise<StoredLanguageProgress | null>;
  consumeStreakFreezeCharge: (message?: string) => boolean;
  spendPerfectRunToken: () => boolean;
  recordOpenedChest: (count?: number) => void;
  isXpBoostActiveAt: (timestamp: number) => boolean;
};

const CosmeticsContext = createContext<CosmeticsContextValue | null>(null);

function serializeRemoteProgressPatch(updates: Partial<StoredLanguageProgress>) {
  const values: Record<string, unknown> = {};

  if (updates.completed_lessons) values.completed_lessons = JSON.stringify(updates.completed_lessons);
  if (typeof updates.xp === "number") values.xp = updates.xp;
  if (typeof updates.streak === "number") values.streak = updates.streak;
  if (typeof updates.gems === "number") values.gems = updates.gems;
  if (updates.claimed_chests) values.claimed_chests = JSON.stringify(updates.claimed_chests);
  if (updates.achievements) values.achievements = JSON.stringify(updates.achievements);
  if (typeof updates.today_xp === "number") values.today_xp = updates.today_xp;
  if (typeof updates.today_lessons === "number") values.today_lessons = updates.today_lessons;
  if (typeof updates.today_perfect === "number") values.today_perfect = updates.today_perfect;
  if (typeof updates.last_played === "string" || updates.last_played === null) values.last_played = updates.last_played;

  return values;
}

function mergeProgressSnapshot(
  current: StoredLanguageProgress | null,
  language: LearningLanguage,
  updates: Partial<StoredLanguageProgress>,
): StoredLanguageProgress {
  return {
    language,
    completed_lessons: updates.completed_lessons ?? current?.completed_lessons ?? [],
    xp: updates.xp ?? current?.xp ?? 0,
    streak: updates.streak ?? current?.streak ?? 0,
    gems: updates.gems ?? current?.gems ?? 0,
    claimed_chests: updates.claimed_chests ?? current?.claimed_chests ?? [],
    achievements: updates.achievements ?? current?.achievements ?? [],
    today_xp: updates.today_xp ?? current?.today_xp ?? 0,
    today_lessons: updates.today_lessons ?? current?.today_lessons ?? 0,
    today_perfect: updates.today_perfect ?? current?.today_perfect ?? 0,
    last_played: updates.last_played ?? current?.last_played ?? null,
  };
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
  const [toast, setToast] = useState<AppToast | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const toastTimeoutRef = useRef<number | null>(null);

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
    setStoredLanguageProgress(userId, language, merged);
    setProgress(merged);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setViewerId(null);
        setViewerName("Player");
        setActiveLanguage(null);
        setProgress(null);
        setStoredCosmetics(getDefaultCosmeticsState());
        setDevCheats(getDefaultDevCheatState());
        setLoading(false);
        return;
      }

      const language = await resolveActiveLanguage(user.id);
      if (cancelled) return;

      setViewerId(user.id);
      setViewerName(getViewerDisplayName(user));
      setActiveLanguage(language);
      await loadForLanguage(user.id, language);

      const storedCosmetics = clearExpiredXpBoost(getStoredCosmeticsState(user.id), Date.now());
      setStoredCosmetics(storedCosmetics);
      setStoredCosmeticsState(user.id, storedCosmetics);
      setDevCheats(getStoredDevCheats(user.id));
      setLoading(false);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadForLanguage]);

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
      void loadForLanguage(viewerId, detail.language);
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
  }, [activeLanguage, loadForLanguage, viewerId]);

  const updateProgress = useCallback(
    async (updates: Partial<StoredLanguageProgress>, options: ProgressUpdateOptions = {}) => {
      if (!viewerId || !activeLanguage) return null;

      const nextProgress = mergeProgressSnapshot(progress, activeLanguage, updates);
      setStoredLanguageProgress(viewerId, activeLanguage, nextProgress);
      setProgress(nextProgress);

      if (options.syncRemote !== false) {
        const values = serializeRemoteProgressPatch(updates);
        if (Object.keys(values).length > 0) {
          await fetch("/api/progress", {
            method: "POST",
            body: JSON.stringify({
              userId: viewerId,
              language: activeLanguage,
              values,
            }),
          }).catch(() => {
            console.warn("Progress sync failed after a local-only update.");
          });
        }
      }

      return nextProgress;
    },
    [activeLanguage, progress, viewerId],
  );

  const persistCosmetics = useCallback(
    (nextState: CosmeticsState) => {
      setStoredCosmetics(nextState);
      if (viewerId) {
        setStoredCosmeticsState(viewerId, nextState);
      }
    },
    [viewerId],
  );

  useEffect(() => {
    if (!viewerId) return;
    if (!progress) return;
    const nextBestState = syncBestStreak(storedCosmetics, progress.streak);
    const nextStatsState = syncOpenedChestFloor(nextBestState, progress.claimed_chests.length);

    if (nextStatsState !== storedCosmetics) {
      queueMicrotask(() => {
        persistCosmetics(nextStatsState);
      });
    }
  }, [persistCosmetics, progress, storedCosmetics, viewerId]);

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

      persistCosmetics(result.nextState);
      if (!devCheats.infiniteGems) {
        await updateProgress({ gems: result.nextGems }, { syncRemote: true });
      }
      showToast(`${result.grantedLabel} added`, "success");
      return result;
    },
    [cosmetics, devCheats.infiniteGems, persistCosmetics, progress?.gems, showToast, updateProgress],
  );

  const equipPack = useCallback(
    (packId: PackId) => {
      const nextState = equipPackBundle(cosmetics, packId);
      persistCosmetics(nextState);
    },
    [cosmetics, persistCosmetics],
  );

  const equipItem = useCallback(
    (itemId: CosmeticItemId) => {
      const nextState = equipCosmeticItem(cosmetics, itemId);
      persistCosmetics(nextState);
    },
    [cosmetics, persistCosmetics],
  );

  const consumeStreakFreezeCharge = useCallback(
    (message = "Streak protected by freeze") => {
      const result = consumeStreakFreeze(cosmetics);
      if (!result.consumed) return false;
      persistCosmetics(result.nextState);
      showToast(message, "info");
      return true;
    },
    [cosmetics, persistCosmetics, showToast],
  );

  const spendPerfectRunToken = useCallback(() => {
    const result = consumePerfectRunToken(cosmetics);
    if (!result.consumed) return false;
    persistCosmetics(result.nextState);
    return true;
  }, [cosmetics, persistCosmetics]);

  const recordOpenedChest = useCallback((count = 1) => {
    persistCosmetics(recordChestOpened(cosmetics, count));
  }, [cosmetics, persistCosmetics]);

  const appearance = useMemo(() => resolveAppearance(cosmetics), [cosmetics]);
  const xpBoostRemainingMs = getXpBoostRemainingMs(cosmetics, now);
  const xpBoostRunning = xpBoostRemainingMs > 0;

  const value = useMemo<CosmeticsContextValue>(
    () => ({
      viewerId,
      viewerName,
      activeLanguage,
      loading,
      cosmetics,
      appearance,
      progress,
      profileStats: cosmetics.stats,
      gemBalance: progress?.gems ?? 0,
      infiniteGemsEnabled: devCheats.infiniteGems,
      xp: progress?.xp ?? 0,
      streak: progress?.streak ?? 0,
      streakFreezeCount: cosmetics.functional.streakFreezes,
      perfectRunTokenCount: cosmetics.functional.perfectRunTokens,
      xpBoostActive: xpBoostRunning,
      xpBoostRemainingMs,
      xpBoostCountdown: xpBoostRunning ? formatBoostCountdown(xpBoostRemainingMs) : null,
      toast,
      dismissToast,
      purchaseEntry,
      equipPack,
      equipItem,
      updateProgress,
      consumeStreakFreezeCharge,
      spendPerfectRunToken,
      recordOpenedChest,
      isXpBoostActiveAt: (timestamp: number) => getIsXpBoostActive(cosmetics, timestamp),
    }),
    [
      activeLanguage,
      appearance,
      cosmetics,
      devCheats.infiniteGems,
      dismissToast,
      equipItem,
      equipPack,
      loading,
      progress,
      purchaseEntry,
      recordOpenedChest,
      toast,
      updateProgress,
      spendPerfectRunToken,
      consumeStreakFreezeCharge,
      viewerId,
      viewerName,
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
