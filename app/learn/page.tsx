"use client";

import { useState, useEffect, useMemo, Suspense, useSyncExternalStore, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import AppTopNav from "@/components/AppTopNav";
import AmbientEffectsLayer, { useAmbientEffectsPreference } from "@/components/theme/AmbientEffectsLayer";
import MythicThemeLayer from "@/components/theme/MythicThemeLayer";
import {
  CelestialConnector,
  CelestialNode,
  CelestialUnitBanner,
  VoidConnector,
  VoidNode,
  VoidUnitBanner,
} from "@/components/theme/MythicPathPrimitives";
import { ACHIEVEMENTS } from "@/lib/achievements";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileDock from "@/components/MobileDock";
import { getCourseSections, getLanguageLabel, getMiniCourses, languageHasPlacement, UnitMeta } from "@/lib/courseContent";
import { mergeProgressSources, resolveActiveLanguage, setStoredLanguageProgress, getStoredLanguageProgress } from "@/lib/progress";
import { ClosedChestNode, OpenChestNode } from "@/components/rewards/PathChestNode";
import { RewardChestArt } from "@/components/rewards/RewardChest";
import RewardChestModal from "@/components/rewards/RewardChestModal";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import {
  ChestRarity,
  RewardChest,
  createQuestRewardChest,
  createUnitRewardChest,
  getChestTheme,
  getUnitChestInsertionProgress,
  getQuestChestId,
  isUnitChestAvailable,
  getStoredRewardChests,
  mergeRewardChestsFromClaims,
  openRewardChest,
  progressRewardChest,
  setStoredRewardChests,
  upsertRewardChest,
} from "@/lib/rewardChests";
import { useThemeContext } from "@/contexts/ThemeContext";
import { withAlpha, type ThemeNodeShape } from "@/lib/themes";
import StreakProtectedBanner from "@/components/streak/StreakProtectedBanner";
import StreakRiskBanner from "@/components/streak/StreakRiskBanner";
import StreakWeeklyStrip from "@/components/streak/StreakWeeklyStrip";
import { StreakFlame, TrophyIcon } from "@/components/streak/StreakFlame";

const PATH_POSITIONS = ["ml-24", "ml-40", "ml-52", "ml-40", "ml-24"];

function subscribe() {
  return () => {};
}

type GuidebookExample = {
  title: string;
  code: string;
  explanation: string;
};

type GuidebookContent = {
  intro: string;
  whatIsIt: string;
  whyItMatters: string;
  howItWorks: string;
  examples?: GuidebookExample[];
  commonMistakes?: string[];
  tips?: string[];
};

type GuidebookState = {
  unitId: number;
  unitDescription: string;
  loading: boolean;
  content: GuidebookContent | null;
};

function formatCompactStat(value: number) {
  if (value < 1_000) return value.toString();
  if (value < 10_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 100) / 10}k`.replace(".0k", "k");
  return `${Math.round(value / 100_000) / 10}m`.replace(".0m", "m");
}

function formatRewardAmount(value: number) {
  return value.toLocaleString("en-US");
}

function getSidebarChestCardStyles(rarity: ChestRarity) {
  switch (rarity) {
    case "rare":
      return {
        shellClass: "border-sky-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.92),rgba(255,255,255,1)_62%)]",
        accentClass: "bg-sky-400",
        sparkle: false,
        elevated: false,
      };
    case "epic":
      return {
        shellClass: "border-violet-100 bg-[linear-gradient(180deg,rgba(245,243,255,0.96),rgba(255,255,255,1)_66%)]",
        accentClass: "bg-violet-400",
        sparkle: false,
        elevated: true,
      };
    case "legendary":
      return {
        shellClass: "border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,1)_68%)]",
        accentClass: "bg-amber-400",
        sparkle: true,
        elevated: true,
      };
    case "mythic":
      return {
        shellClass: "border-fuchsia-100 bg-[linear-gradient(135deg,rgba(253,242,248,0.98),rgba(245,243,255,0.98)_48%,rgba(239,246,255,0.96)_100%)]",
        accentClass: "bg-[linear-gradient(180deg,#ec4899_0%,#8b5cf6_48%,#3b82f6_100%)]",
        sparkle: true,
        elevated: true,
      };
    default:
      return {
        shellClass: "border-slate-200 bg-white",
        accentClass: "bg-slate-200",
        sparkle: false,
        elevated: false,
      };
  }
}

function getChestStatusBadgeClass(state: RewardChest["state"]) {
  return state === "opened"
    ? "border-slate-200/80 bg-white/80 text-slate-400"
    : "border-amber-200 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]";
}

function GemIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 4.8L12 10.2L15 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.8 10.2H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function getNodeShapePresentation(shape: ThemeNodeShape) {
  switch (shape) {
    case "circle":
      return { className: "rounded-full", style: undefined };
    case "hex":
      return { className: "", style: { clipPath: "polygon(25% 8%, 75% 8%, 100% 50%, 75% 92%, 25% 92%, 0% 50%)" } };
    case "diamond":
      return { className: "", style: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" } };
    case "marker":
      return { className: "", style: { clipPath: "polygon(50% 0%, 100% 40%, 100% 78%, 50% 100%, 0% 78%, 0% 40%)" } };
    case "fold":
      return { className: "rounded-[1rem]", style: { clipPath: "polygon(8% 0%, 100% 0%, 100% 84%, 84% 100%, 0% 100%, 0% 12%)" } };
    case "pixel":
      return { className: "rounded-none", style: { clipPath: "polygon(12% 0%, 88% 0%, 88% 12%, 100% 12%, 100% 88%, 88% 88%, 88% 100%, 12% 100%, 12% 88%, 0% 88%, 0% 12%, 12% 12%)" } };
    case "arch":
      return { className: "rounded-t-[1.4rem] rounded-b-[0.9rem]", style: undefined };
    case "orbital":
      return { className: "rounded-full", style: { boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)" } };
    case "crystal":
      return { className: "", style: { clipPath: "polygon(50% 0%, 86% 26%, 72% 100%, 28% 100%, 14% 26%)" } };
    case "star":
      return { className: "", style: { clipPath: "polygon(50% 0%, 61% 34%, 98% 36%, 68% 58%, 79% 92%, 50% 72%, 21% 92%, 32% 58%, 2% 36%, 39% 34%)" } };
    default:
      return { className: "rounded-[1.15rem]", style: undefined };
  }
}

const LOCKED_NODE_ICON_COLOR = "#9CA3AF";
const LOCKED_CONNECTOR_GRADIENT = "linear-gradient(180deg,#CBD5E1 0%,#94A3B8 100%)";
const LOCKED_CONNECTOR_SHADOW = "0 0 0 1px rgba(148,163,184,0.22), 0 6px 14px rgba(15,23,42,0.12)";

function NodeEffectPreview({
  color,
  motion,
}: {
  color: string;
  motion: ReturnType<typeof useThemeContext>["nodeEffect"]["motion"];
}) {
  if (motion === "none") return null;

  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full"
          style={{
            width: 4 + index,
            height: 4 + index,
            left: `${18 + index * 24}%`,
            top: motion === "rise" ? `${56 - index * 10}%` : `${18 + index * 12}%`,
            background: color,
            opacity: 0.74,
            animation:
              motion === "float"
                ? `learnNodeFloat ${3.1 + index * 0.3}s ease-in-out ${index * 0.15}s infinite`
                : motion === "fall"
                  ? `learnNodeFall ${2.8 + index * 0.2}s linear ${index * 0.1}s infinite`
                  : motion === "rise"
                    ? `learnNodeRise ${2.5 + index * 0.2}s ease-in ${index * 0.12}s infinite`
                    : `learnNodeTwinkle ${1.9 + index * 0.14}s ease-in-out ${index * 0.08}s infinite`,
          }}
        />
      ))}
    </>
  );
}

// ── Inner component that uses useSearchParams ─────────────────────────────────
function LearnInner() {
  const router = useRouter();
  const { pathTheme, nodeEffect } = useThemeContext();
  const {
    bestStreak,
    dismissStreakProtectedNotice,
    infiniteGemsEnabled,
    isHydrating,
    pendingStreakProtection,
    recordOpenedChest,
    reserveStreakFreezeForToday,
    streakRisk,
    updateProgress,
    weeklyStreak,
  } = useCosmetics();
  const { enabled: ambientEffectsEnabled, setEnabled: setAmbientEffectsEnabled, hydrated: ambientHydrated } = useAmbientEffectsPreference();
  const searchParams = useSearchParams();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gems, setGems] = useState(0);
  const [todayXp, setTodayXp] = useState(0);
  const [todayLessons, setTodayLessons] = useState(0);
  const [todayPerfect, setTodayPerfect] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [claimedChests, setClaimedChests] = useState<string[]>([]);
  const [rewardChests, setRewardChests] = useState<RewardChest[]>([]);
  const [selectedChest, setSelectedChest] = useState<RewardChest | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guidebook, setGuidebook] = useState<GuidebookState | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>("python");
  const [openMiniCourseMenu, setOpenMiniCourseMenu] = useState<string | null>(null);
  const [recentlyUnlockedKeys, setRecentlyUnlockedKeys] = useState<string[]>([]);
  const [recentlyCompletedKey, setRecentlyCompletedKey] = useState<string | null>(null);
  const [auroraBurstKey, setAuroraBurstKey] = useState(0);
  const [voidFlashKey, setVoidFlashKey] = useState(0);
  const [dismissedStreakRiskSessionKey, setDismissedStreakRiskSessionKey] = useState<string | null>(null);
  const pathAnimationReadyRef = useRef(false);
  const previousCompletedRef = useRef<Set<string>>(new Set());
  const previousUnlockedRef = useRef<Set<string>>(new Set());
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const sections = useMemo(() => getCourseSections(currentLanguage), [currentLanguage]);
  const miniCourses = useMemo(() => getMiniCourses(currentLanguage), [currentLanguage]);
  const todayKey = mounted ? new Date().toISOString().split("T")[0] : "";

  const QUEST_POOL = useMemo(() => [
    { id: "xp_50", label: "Earn 50 XP", current: () => Math.min(todayXp, 50), total: 50, color: "bg-yellow-400", rewardTier: 0 },
    { id: "xp_100", label: "Earn 100 XP", current: () => Math.min(todayXp, 100), total: 100, color: "bg-yellow-400", rewardTier: 1 },
    { id: "xp_200", label: "Earn 200 XP", current: () => Math.min(todayXp, 200), total: 200, color: "bg-yellow-400", rewardTier: 2 },
    { id: "les_1", label: "Complete 1 lesson", current: () => Math.min(todayLessons, 1), total: 1, color: "bg-green-500", rewardTier: 0 },
    { id: "les_3", label: "Complete 3 lessons", current: () => Math.min(todayLessons, 3), total: 3, color: "bg-green-500", rewardTier: 1 },
    { id: "les_5", label: "Complete 5 lessons", current: () => Math.min(todayLessons, 5), total: 5, color: "bg-green-500", rewardTier: 2 },
    { id: "perf_1", label: "Get 1 perfect lesson", current: () => Math.min(todayPerfect, 1), total: 1, color: "bg-blue-400", rewardTier: 1 },
    { id: "perf_2", label: "Get 2 perfect lessons", current: () => Math.min(todayPerfect, 2), total: 2, color: "bg-blue-400", rewardTier: 2 },
  ], [todayLessons, todayPerfect, todayXp]);

  const dailyQuests = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const seed = today.split("-").reduce((acc, n) => acc + parseInt(n), 0);

    const pool = [...QUEST_POOL];

    if (streak === 0) {
      pool.push({
        id: "streak_start",
        label: "Start a streak",
        current: () => Math.min(streak, 1),
        total: 1,
        color: "bg-orange-400",
        rewardTier: 0,
      });
    }

    const shuffled = pool
      .map((q, i) => ({ q, sort: (seed * (i + 1) * 2654435761) % pool.length }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q);

    const xp      = shuffled.find(q => q.id.startsWith("xp_"));
    const lessons = shuffled.find(q => q.id.startsWith("les_"));
    const perfect = shuffled.find(q => q.id.startsWith("perf_"));
    const streakQ = shuffled.find(q => q.id === "streak_start");

    return [xp, lessons, perfect, streakQ].filter(Boolean).slice(0, 3) as typeof QUEST_POOL;
  }, [QUEST_POOL, streak]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [loading]);

  useEffect(() => {
    const closeMiniCourseMenu = () => setOpenMiniCourseMenu(null);
    window.addEventListener("click", closeMiniCourseMenu);
    return () => window.removeEventListener("click", closeMiniCourseMenu);
  }, []);

  async function loadProgress() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setViewerId(null);
      setLoading(false);
      return;
    }
    const activeLanguage = await resolveActiveLanguage(user.id);
    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", activeLanguage)
      .maybeSingle();

    const localProgress = getStoredLanguageProgress(user.id, activeLanguage);
    const merged = mergeProgressSources(activeLanguage, data, localProgress);
    const storedRewardChests = mergeRewardChestsFromClaims(
      getStoredRewardChests(user.id, activeLanguage),
      merged.claimed_chests,
    );

    setViewerId(user.id);
    setCurrentLanguage(activeLanguage);
    setCompletedLessons(merged.completed_lessons);
    setXp(merged.xp);
    setStreak(merged.streak);
    setGems(merged.gems);
    setTodayXp(merged.today_xp);
    setTodayLessons(merged.today_lessons);
    setTodayPerfect(merged.today_perfect);
    setEarnedAchievements(merged.achievements);
    setClaimedChests(merged.claimed_chests);
    setRewardChests(storedRewardChests);
    setStoredLanguageProgress(user.id, activeLanguage, merged);
    setStoredRewardChests(user.id, activeLanguage, storedRewardChests);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadProgress();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const updateChestInventory = (nextChests: RewardChest[]) => {
    setRewardChests(nextChests);
    if (viewerId) {
      setStoredRewardChests(viewerId, currentLanguage, nextChests);
    }
  };

  const syncChestRewards = async (nextGems: number, nextClaimedChests: string[]) => {
    setGems(nextGems);
    setClaimedChests(nextClaimedChests);

    if (!viewerId) return;

    setStoredLanguageProgress(viewerId, currentLanguage, {
      gems: nextGems,
      claimed_chests: nextClaimedChests,
    });

    await updateProgress(
      {
        gems: nextGems,
        claimed_chests: nextClaimedChests,
      },
      { syncRemote: true },
    );
  };

  const handleChestOpened = async (result: { chestId: string; finalRarity: RewardChest["currentRarity"]; gemsAwarded: number; tapsUsed: number }) => {
    const alreadyClaimed = claimedChests.includes(result.chestId);
    const opened = openRewardChest(rewardChests, result);
    updateChestInventory(opened.chests);
    await syncChestRewards(
      gems + result.gemsAwarded,
      alreadyClaimed ? claimedChests : [...claimedChests, result.chestId],
    );
    if (!alreadyClaimed) {
      recordOpenedChest();
    }

    if (opened.chest) {
      setSelectedChest(opened.chest);
    }
  };

  const handleChestProgress = async (result: { chestId: string; currentRarity: RewardChest["currentRarity"]; tapsUsed: number }) => {
    const progressed = progressRewardChest(rewardChests, result);
    updateChestInventory(progressed.chests);
  };

  const ensureChestReady = (chest: RewardChest) => {
    const existing = rewardChests.find((entry) => entry.id === chest.id);
    if (existing) return existing;

    const next = upsertRewardChest(rewardChests, chest);
    updateChestInventory(next);
    return next.find((entry) => entry.id === chest.id) ?? chest;
  };

  const getDisplayChest = (chestId: string, fallback: RewardChest) => {
    return rewardChests.find((entry) => entry.id === chestId)
      ?? (claimedChests.includes(chestId) ? mergeRewardChestsFromClaims([], [chestId])[0] : null)
      ?? fallback;
  };

  const getLastLessonId = useCallback((unitId: number) => {
    const unit = sections.flatMap((section) => section.units).find((item) => item.id === unitId);
    return unit?.lessons[unit.lessons.length - 1]?.id ?? 1;
  }, [sections]);

  const isUnlocked = (unitId: number, lessonId: number) => {
    if (unitId === 1 && lessonId === 1) return true;
    const prevLesson = lessonId > 1 ? `${unitId}-${lessonId - 1}` : `${unitId - 1}-${getLastLessonId(unitId - 1)}`;
    return completedLessons.includes(prevLesson);
  };

  const isSectionUnlocked = (sectionId: number) => {
    if (sectionId === 1) return true;
    const prevSection = sections[sectionId - 2];
    return prevSection.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`)));
  };

  const allComplete = sections.every(s => s.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`))));

  const findCurrentLesson = () => {
    for (const section of sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          const key = `${unit.id}-${lesson.id}`;
          if (!completedLessons.includes(key) && isUnlocked(unit.id, lesson.id)) return key;
        }
      }
    }
    return null;
  };
  const currentLessonKey = findCurrentLesson();
  const startLessonHref = currentLessonKey
    ? `/learn/${currentLessonKey.split("-")[0]}/${currentLessonKey.split("-")[1]}?lang=${currentLanguage}`
    : "/learn";
  const currentWeekToday = weeklyStreak.find((day) => day.isToday)?.dateKey ?? "today";
  const streakRiskSessionKey = streakRisk ? `${currentLanguage}:${currentWeekToday}` : null;

  useEffect(() => {
    if (loading) return;

    const lessonKeys = sections.flatMap((section) =>
      section.units.flatMap((unit) => unit.lessons.map((lesson) => `${unit.id}-${lesson.id}`)),
    );
    const currentCompleted = new Set(completedLessons.filter((lessonKey) => lessonKeys.includes(lessonKey)));
    const currentUnlocked = new Set(
      sections.flatMap((section) =>
        section.units.flatMap((unit) =>
          unit.lessons
            .filter((lesson) => {
              if (unit.id === 1 && lesson.id === 1) return true;
              const prevLesson = lesson.id > 1
                ? `${unit.id}-${lesson.id - 1}`
                : `${unit.id - 1}-${getLastLessonId(unit.id - 1)}`;
              return completedLessons.includes(prevLesson);
            })
            .map((lesson) => `${unit.id}-${lesson.id}`),
        ),
      ),
    );

    if (!pathAnimationReadyRef.current) {
      previousCompletedRef.current = currentCompleted;
      previousUnlockedRef.current = currentUnlocked;
      pathAnimationReadyRef.current = true;
      return;
    }

    const previousCompleted = previousCompletedRef.current;
    const previousUnlocked = previousUnlockedRef.current;
    const newlyCompleted = [...currentCompleted].filter((key) => !previousCompleted.has(key));
    const newlyUnlocked = [...currentUnlocked].filter((key) => !previousUnlocked.has(key));

    if (newlyCompleted.length > 0) {
      const lastCompleted = newlyCompleted[newlyCompleted.length - 1];
      setRecentlyCompletedKey(lastCompleted);
      window.setTimeout(() => {
        setRecentlyCompletedKey((current) => (current === lastCompleted ? null : current));
      }, 1800);

      if (pathTheme.id === "celestial") {
        setAuroraBurstKey((value) => value + 1);
      }
    }

    if (newlyUnlocked.length > 0) {
      if (pathTheme.id === "the_void") {
        setVoidFlashKey((value) => value + 1);
      }

      setRecentlyUnlockedKeys(newlyUnlocked);
      const unlockTimeout = window.setTimeout(() => {
        setRecentlyUnlockedKeys((current) => current.filter((key) => !newlyUnlocked.includes(key)));
      }, 900);

      previousCompletedRef.current = currentCompleted;
      previousUnlockedRef.current = currentUnlocked;
      return () => window.clearTimeout(unlockTimeout);
    }

    previousCompletedRef.current = currentCompleted;
    previousUnlockedRef.current = currentUnlocked;
  }, [completedLessons, getLastLessonId, loading, pathTheme.id, sections]);

  const totalLessons = sections.flatMap(s => s.units.flatMap(u => u.lessons)).length;
  const completedCount = completedLessons.filter((lessonKey) => /^\d+-\d+$/.test(lessonKey)).length;
  const earnedAchievementCards = ACHIEVEMENTS
    .filter((achievement) => earnedAchievements.includes(achievement.id))
    .slice(-3)
    .reverse();

  const showResolvedSidebarContent = mounted && !loading;
  const showcasedChests = rewardChests.slice(0, 4);
  const panelBorder = withAlpha(pathTheme.accentColor, 0.22);
  const usingDefaultTheme = pathTheme.id === "default";
  const panelMutedText = usingDefaultTheme ? withAlpha("#F8FAFC", 0.8) : withAlpha(pathTheme.surfaceText, 0.62);
  const sidebarActiveText = usingDefaultTheme ? "#F8FAFC" : pathTheme.accentColor;
  const sidebarActiveBackground = usingDefaultTheme ? withAlpha("#22C55E", 0.2) : withAlpha(pathTheme.accentColor, 0.14);

  const openGuidebook = async (unit: UnitMeta) => {
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: true, content: null });
    const res = await fetch("/api/guidebook", { method: "POST", body: JSON.stringify({ unitTitle: unit.title, unitDescription: unit.description, language: currentLanguage }) });
    const data = await res.json();
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: false, content: data as GuidebookContent });
  };

  // ── Guidebook view ────────────────────────────────────────────────────────
  if (guidebook) {
    return (
      <main className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
        <AppTopNav />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
          <button onClick={() => setGuidebook(null)} className="font-bold mb-6 transition hover:brightness-110" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>Back</button>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: pathTheme.surfaceText }}>Unit {guidebook.unitId} {getLanguageLabel(currentLanguage)} Guidebook</h1>
          <p className="font-semibold mb-8" style={{ color: withAlpha(pathTheme.surfaceText, 0.7) }}>{guidebook.unitDescription}</p>
          {guidebook.loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Pico size={100} mood="happy" className="mb-4" />
              <div className="animate-spin h-10 w-10 border-4 border-t-transparent rounded-full mb-4" style={{ borderColor: pathTheme.accentColor, borderTopColor: "transparent" }} />
              <p className="font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>Generating guidebook...</p>
            </div>
          ) : guidebook.content ? (
            <div className="space-y-6">
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <p className="text-lg font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.84) }}>{guidebook.content.intro}</p>
              </div>
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <h2 className="text-xl font-extrabold mb-3" style={{ color: pathTheme.surfaceText }}>What is it?</h2>
                <p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>{guidebook.content.whatIsIt}</p>
              </div>
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <h2 className="text-xl font-extrabold mb-3" style={{ color: pathTheme.surfaceText }}>Why does it matter?</h2>
                <p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>{guidebook.content.whyItMatters}</p>
              </div>
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <h2 className="text-xl font-extrabold mb-3" style={{ color: pathTheme.surfaceText }}>How does it work?</h2>
                <p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>{guidebook.content.howItWorks}</p>
              </div>
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <h2 className="text-xl font-extrabold mb-4" style={{ color: pathTheme.surfaceText }}>Examples</h2>
                <div className="space-y-6">{guidebook.content.examples?.map((ex: GuidebookExample, i: number) => (<div key={i}><p className="font-extrabold mb-2" style={{ color: pathTheme.surfaceText }}>{ex.title}</p><pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-sm font-mono mb-3 overflow-x-auto">{ex.code}</pre><p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.76) }}>{ex.explanation}</p></div>))}</div>
              </div>
              <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
                <h2 className="text-xl font-extrabold mb-4" style={{ color: pathTheme.surfaceText }}>Common mistakes</h2>
                <ul className="space-y-3">{guidebook.content.commonMistakes?.map((m: string, i: number) => (<li key={i} className="flex gap-3"><span className="font-extrabold" style={{ color: "#ef4444" }}>!</span><p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>{m}</p></li>))}</ul>
              </div>
              <div className="rounded-3xl border-2 p-8" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: withAlpha(pathTheme.accentColor, 0.08) }}>
                <h2 className="text-xl font-extrabold mb-4" style={{ color: pathTheme.surfaceText }}>Tips</h2>
                <ul className="space-y-3">{guidebook.content.tips?.map((t: string, i: number) => (<li key={i} className="flex gap-3"><span className="font-extrabold" style={{ color: pathTheme.accentColor }}>✓</span><p className="font-semibold leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>{t}</p></li>))}</ul>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  // ── Main learn view ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(88,204,2,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(88,204,2,0); }
        }
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes sidebarChestSparkle {
          0%, 100% { opacity: 0.16; transform: translate3d(0, 0, 0) scale(0.92); }
          50% { opacity: 0.44; transform: translate3d(0, -5px, 0) scale(1.08); }
        }
        @keyframes learnNodeFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.56; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes learnNodeRise {
          0% { transform: translateY(5px); opacity: 0; }
          30% { opacity: 0.84; }
          100% { transform: translateY(-16px); opacity: 0; }
        }
        @keyframes learnNodeFall {
          0% { transform: translateY(-5px); opacity: 0; }
          30% { opacity: 0.76; }
          100% { transform: translateY(16px); opacity: 0; }
        }
        @keyframes learnNodeTwinkle {
          0%, 100% { transform: scale(0.8); opacity: 0.34; }
          50% { transform: scale(1.16); opacity: 1; }
        }
        .node-pulse { animation: pulse-node 2s ease-in-out infinite; }
        .pico-bob { animation: bob 2.4s ease-in-out infinite; }
      `}</style>

      <div className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.92 }} />
        {!isHydrating && ambientHydrated ? (
          pathTheme.id === "celestial" || pathTheme.id === "the_void" ? (
            ambientEffectsEnabled ? (
              <MythicThemeLayer
                themeId={pathTheme.id}
                auroraBurstKey={auroraBurstKey}
                voidFlashKey={voidFlashKey}
                className="opacity-80"
              />
            ) : null
          ) : (
            <AmbientEffectsLayer effects={pathTheme.ambientEffects} enabled={ambientEffectsEnabled} className="opacity-70" />
          )
        ) : null}

        <div className="relative z-10 flex min-h-screen flex-col">
        <AppTopNav />

        {/* ── Current unit banner removed as requested ── */}

        {/* ── 3-column layout ── */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-[240px_1fr_280px] gap-8 items-start">
          {(pendingStreakProtection || streakRisk) && (
            <div className="col-span-3 space-y-3">
              {pendingStreakProtection ? (
                <StreakProtectedBanner
                  streak={pendingStreakProtection.streak}
                  remainingFreezes={pendingStreakProtection.remainingFreezes}
                  count={pendingStreakProtection.count}
                  onDismiss={() => {
                    void dismissStreakProtectedNotice();
                  }}
                />
              ) : null}
              {streakRisk ? (
                <StreakRiskBanner
                  risk={streakRisk}
                  dismissed={streakRiskSessionKey !== null && dismissedStreakRiskSessionKey === streakRiskSessionKey}
                  reserved={Boolean(weeklyStreak.find((day) => day.isToday)?.state === "reserved")}
                  canUseFreeze={streakRisk.freezeCount > 0}
                  onDismiss={() => setDismissedStreakRiskSessionKey(streakRiskSessionKey)}
                  onStartLesson={() => router.push(startLessonHref)}
                  onUseFreeze={() => {
                    void reserveStreakFreezeForToday();
                  }}
                />
              ) : null}
            </div>
          )}

          {/* ── LEFT SIDEBAR ── */}
          <aside
            className="sticky top-32 space-y-2 rounded-[2rem] border p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            style={{ borderColor: panelBorder, background: pathTheme.surfaceDark }}
          >
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-sm transition hover:bg-white/8" style={{ color: panelMutedText }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Home
            </Link>
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 font-extrabold text-sm"
              style={{
                borderColor: panelBorder,
                background: sidebarActiveBackground,
                color: sidebarActiveText,
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Learn
            </div>
            <Link href="/daily" className="flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-sm transition hover:bg-white/8" style={{ color: panelMutedText }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Daily Challenge
            </Link>
            <Link href={languageHasPlacement(currentLanguage) ? "/placement" : "/learn"} className="flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-sm transition hover:bg-white/8" style={{ color: panelMutedText }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {languageHasPlacement(currentLanguage) ? "Placement Test" : "Course Start"}
            </Link>
            <Link href="/achievements" className="flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-sm transition hover:bg-white/8" style={{ color: panelMutedText }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Achievements
            </Link>

            {/* Overall progress */}
            <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: panelMutedText }}>Overall progress</p>
              <div className="h-2.5 rounded-full overflow-hidden mb-1" style={{ background: withAlpha("#ffffff", 0.08) }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedCount / totalLessons) * 100}%`, background: pathTheme.accentColor }} />
              </div>
              <p className="text-xs font-bold" style={{ color: panelMutedText }}>{completedCount} / {totalLessons} lessons</p>
            </div>
          </aside>

          {/* ── CENTER PATH ── */}
          <main className="min-h-screen">
            <div
              className="relative min-h-full overflow-hidden rounded-[2.4rem] border border-white/70 px-4 py-5 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:px-5"
              style={{
                background: isHydrating
                  ? "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)"
                  : pathTheme.id === "the_void"
                    ? "#000000"
                    : pathTheme.pageBackground,
                borderColor: panelBorder,
              }}
            >
              <div className="relative z-20 mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAmbientEffectsEnabled(!ambientEffectsEnabled)}
                  className="rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] shadow-sm backdrop-blur"
                  style={{
                    borderColor: withAlpha("#ffffff", 0.34),
                    background: withAlpha("#ffffff", 0.12),
                    color: withAlpha("#ffffff", 0.84),
                  }}
                >
                  {ambientEffectsEnabled ? "FX On" : "FX Off"}
                </button>
              </div>
              {isHydrating ? (
                <div className="relative z-10 space-y-6 py-4">
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-4 h-7 w-52 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                  </div>
                  <div className="flex flex-col gap-5 px-4 py-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                        <div className="relative">
                          <div className="h-14 w-14 animate-pulse rounded-[1.15rem] bg-slate-200 shadow-sm" />
                          {index < 4 && (
                            <span className="pointer-events-none absolute left-1/2 top-full h-7 w-[6px] -translate-x-1/2 rounded-full bg-slate-200" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <div className="relative z-10 flex flex-col items-center justify-center py-32">
                  <Pico size={100} mood="happy" />
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mt-6" />
                </div>
              ) : (
                <div className="relative z-10">
                {completedLessons.length === 0 && languageHasPlacement(currentLanguage) && (
                  <div className="bg-white rounded-3xl shadow-sm p-5 mb-8 border-2 border-green-100">
                    <p className="font-extrabold text-gray-900 mb-1">Already know some {getLanguageLabel(currentLanguage)}?</p>
                    <p className="text-gray-500 font-semibold text-sm mb-3">
                      Take a quick test to skip ahead.
                    </p>
                    <Link href="/placement" className="block w-full bg-green-500 text-white font-extrabold py-2.5 rounded-2xl hover:bg-green-600 transition text-center text-sm shadow-md">
                      Take placement test
                    </Link>
                  </div>
                )}

                {sections.map((section) => {
                  const sectionUnlocked = isSectionUnlocked(section.id);
                  const allLessons = section.units.flatMap(u => u.lessons.map(l => `${u.id}-${l.id}`));
                  const completedInSection = allLessons.filter(l => completedLessons.includes(l)).length;
                  const sectionComplete = completedInSection === allLessons.length;
                  const sectionHasCurrent = section.units.some(u => u.lessons.some(l => `${u.id}-${l.id}` === currentLessonKey));

                  return (
                    <div key={section.id} className="mb-6">
                      <div className={`rounded-3xl p-5 mb-6 border-2 ${
                        sectionComplete ? "bg-green-50 border-green-200"
                        : sectionUnlocked ? `${section.bgTheme} border-gray-100`
                        : "bg-gray-50 border-gray-100 opacity-50"
                      }`}>
                        <p className={`text-xs font-extrabold uppercase tracking-widest mb-1 ${sectionUnlocked ? section.textAccent : "text-gray-400"}`}>{section.level}</p>
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-extrabold text-gray-900">{section.title}</h2>
                          {sectionComplete && <span className="text-green-500 font-extrabold text-xs">Completed</span>}
                          {!sectionUnlocked && <span className="text-gray-400 font-bold text-xs">Locked</span>}
                        </div>
                        {sectionUnlocked && !sectionComplete && (
                          <div className="mt-2">
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                              <div className={`h-2 ${section.color} rounded-full transition-all`} style={{ width: `${(completedInSection / allLessons.length) * 100}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 font-semibold mt-1">{completedInSection}/{allLessons.length} lessons</p>
                          </div>
                        )}
                      </div>

                      {sectionUnlocked && !sectionComplete && sectionHasCurrent && (
                        <div className="flex items-end gap-3 mb-6 ml-6">
                          <Pico size={64} mood="happy" />
                          <div className="bg-white border-2 border-gray-100 rounded-3xl rounded-bl-none px-4 py-2.5 shadow-sm">
                            <p className="text-sm font-extrabold text-gray-700">{section.picoMessage}</p>
                          </div>
                        </div>
                      )}

                      {sectionUnlocked && section.units.map((unit) => {
                        const unitCompletedLessons = unit.lessons.filter((lesson) => completedLessons.includes(`${unit.id}-${lesson.id}`)).length;
                        const baseUnitChest = createUnitRewardChest(unit.id);
                        const chestInsertionProgress = getUnitChestInsertionProgress(unit.id, unit.lessons.length);
                        const chestVisible =
                          isUnitChestAvailable(unit.id, unit.lessons.length, unitCompletedLessons)
                          || rewardChests.some((entry) => entry.id === baseUnitChest.id)
                          || claimedChests.includes(baseUnitChest.id);
                        const pathChest = chestVisible ? getDisplayChest(baseUnitChest.id, baseUnitChest) : null;
                        const chestOpened = pathChest?.state === "opened" || claimedChests.includes(baseUnitChest.id);
                        const pathNodes = unit.lessons.flatMap((lesson, lessonIndex) => {
                          const nodes: Array<
                            { kind: "lesson"; lesson: typeof lesson } | { kind: "chest" }
                          > = [{ kind: "lesson", lesson }];
                          if (pathChest && lessonIndex + 1 === chestInsertionProgress) {
                            nodes.push({ kind: "chest" });
                          }
                          return nodes;
                        });
                        const displayPathNodes =
                          pathTheme.id === "the_void"
                            ? pathNodes.filter((node) =>
                                node.kind === "chest"
                                  ? Boolean(pathChest)
                                  : completedLessons.includes(`${unit.id}-${node.lesson.id}`) || isUnlocked(unit.id, node.lesson.id),
                              )
                            : pathNodes;

                        return (
                        <div key={unit.id} className="mb-6">
                          {pathTheme.id === "celestial" ? (
                            <div id={`unit-${unit.id}`}>
                              <CelestialUnitBanner
                                unitId={unit.id}
                                title={`Unit ${unit.id}: ${unit.title}`}
                                description={unit.description}
                                completedLessons={unitCompletedLessons}
                                totalLessons={unit.lessons.length}
                                onReview={() => openGuidebook(unit)}
                              />
                            </div>
                          ) : pathTheme.id === "the_void" ? (
                            <div id={`unit-${unit.id}`}>
                              <VoidUnitBanner
                                title={`Unit ${unit.id}: ${unit.title}`}
                                description={unit.description}
                                onReview={() => openGuidebook(unit)}
                              />
                            </div>
                          ) : (
                            <div
                              id={`unit-${unit.id}`}
                              className="mb-5 flex items-center justify-between rounded-[1.8rem] border px-5 py-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]"
                              style={{
                                background: `${pathTheme.bannerPattern}, ${pathTheme.unitBannerBackground}`,
                                borderColor: pathTheme.unitBannerBorder,
                              }}
                            >
                              <div>
                                <p className="font-extrabold" style={{ color: pathTheme.unitBannerText }}>
                                  Unit {unit.id}: {unit.title}
                                </p>
                                <p className="text-xs font-semibold" style={{ color: pathTheme.unitBannerSubtext }}>
                                  {unit.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <div
                                  className="rounded-xl px-3 py-0.5"
                                  style={{ background: pathTheme.unitBadgeBackground }}
                                >
                                  <span className="text-xs font-extrabold" style={{ color: pathTheme.unitBadgeText }}>
                                    {unitCompletedLessons}/{unit.lessons.length}
                                  </span>
                                </div>
                                <button
                                  onClick={() => openGuidebook(unit)}
                                  className="rounded-xl px-3 py-0.5 text-xs font-extrabold transition hover:brightness-105"
                                  style={{
                                    background: pathTheme.unitActionBackground,
                                    color: pathTheme.unitActionText,
                                  }}
                                >
                                  Review
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-3 mb-4">
                            {displayPathNodes.map((node, index) => {
                              if (node.kind === "lesson") {
                                const lesson = node.lesson;
                                const unlocked = isUnlocked(unit.id, lesson.id);
                                const completed = completedLessons.includes(`${unit.id}-${lesson.id}`);
                                const key = `${unit.id}-${lesson.id}`;
                                const isChallenge = lesson.title.toLowerCase().includes("challenge");
                                const isCurrent = key === currentLessonKey;
                                const hasNextNode = index < displayPathNodes.length - 1;
                                const nextNode = displayPathNodes[index + 1];
                                const nextLessonNode = nextNode?.kind === "lesson" ? nextNode.lesson : null;
                                const shouldAnimateConnector = nextLessonNode
                                  ? recentlyUnlockedKeys.includes(`${unit.id}-${nextLessonNode.id}`)
                                  : Boolean(nextNode?.kind === "chest" && pathChest && recentlyUnlockedKeys.includes(pathChest.id));
                                const nodeShape = getNodeShapePresentation(pathTheme.nodeShape);
                                const availableBackground = isChallenge
                                  ? "linear-gradient(135deg,#FACC15 0%,#F59E0B 100%)"
                                  : pathTheme.nodeAvailableBackground;
                                const availableBorder = isChallenge ? "#D97706" : pathTheme.nodeAvailableBorder;
                                const nodeBackground = completed
                                  ? pathTheme.nodeCompletedBackground
                                  : unlocked
                                    ? availableBackground
                                    : pathTheme.nodeLockedBackground;
                                const nodeBorder = completed
                                  ? pathTheme.nodeCompletedBorder
                                  : unlocked
                                    ? availableBorder
                                    : pathTheme.nodeLockedBorder;
                                const nodeTextColor = completed
                                  ? pathTheme.nodeCompletedText
                                  : unlocked
                                    ? pathTheme.nodeAvailableText
                                    : LOCKED_NODE_ICON_COLOR;

                                if (pathTheme.id === "the_void" && !completed && !unlocked) {
                                  return null;
                                }

                                if (pathTheme.id === "celestial" || pathTheme.id === "the_void") {
                                  return (
                                    <div key={lesson.id} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                                      <div className="relative">
                                        {tooltip === key && (
                                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-xl bg-gray-950 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-lg">
                                            {lesson.title}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
                                          </div>
                                        )}
                                        {isCurrent && (
                                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-lg bg-gray-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                              Start
                                            </span>
                                          </div>
                                        )}
                                        <a
                                          href={
                                            (unlocked || completed)
                                              ? (isChallenge
                                                  ? `/learn/${unit.id}/challenge?lang=${currentLanguage}`
                                                  : `/learn/${unit.id}/${lesson.id}?lang=${currentLanguage}`)
                                              : "#"
                                          }
                                          onMouseEnter={() => setTooltip(key)}
                                          onMouseLeave={() => setTooltip(null)}
                                          className={`relative flex h-14 w-14 items-center justify-center transition-all duration-150 ${unlocked || completed ? "hover:-translate-y-0.5" : "cursor-not-allowed"} ${pathTheme.id === "the_void" && recentlyUnlockedKeys.includes(key) ? "delay-[80ms]" : ""}`}
                                        >
                                          {pathTheme.id === "celestial" ? (
                                            <CelestialNode
                                              completed={completed}
                                              current={isCurrent}
                                              available={unlocked}
                                              animateBurst={recentlyCompletedKey === key}
                                            />
                                          ) : (
                                            <VoidNode
                                              completed={completed}
                                              current={isCurrent}
                                              available={unlocked}
                                              emerging={recentlyUnlockedKeys.includes(key)}
                                            />
                                          )}
                                        </a>
                                        {hasNextNode ? (
                                          pathTheme.id === "celestial" ? (
                                            <CelestialConnector className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2" active={completed || unlocked} animateDraw={shouldAnimateConnector} />
                                          ) : (
                                            <VoidConnector className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2" active={completed || unlocked} />
                                          )
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={lesson.id} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                                    <div className="relative">
                                      {tooltip === key && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap z-20 shadow-lg">
                                          {lesson.title}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                        </div>
                                      )}
                                      {isCurrent && (
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                          <span className="bg-gray-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                            Start
                                          </span>
                                        </div>
                                      )}
                                      <a
                                        href={
                                          (unlocked || completed)
                                            ? (isChallenge
                                                ? `/learn/${unit.id}/challenge?lang=${currentLanguage}`
                                                : `/learn/${unit.id}/${lesson.id}?lang=${currentLanguage}`)
                                            : "#"
                                        }
                                        onMouseEnter={() => setTooltip(key)}
                                        onMouseLeave={() => setTooltip(null)}
                                        className={`relative flex h-14 w-14 items-center justify-center border-b-4 font-extrabold transition-all duration-150 active:translate-y-1 ${nodeShape.className} ${
                                          isCurrent ? "node-pulse" : ""
                                        } ${unlocked || completed ? "hover:brightness-110" : "cursor-not-allowed"}`}
                                        style={{
                                          background: nodeBackground,
                                          borderColor: nodeBorder,
                                          color: nodeTextColor,
                                          ...nodeShape.style,
                                          boxShadow: isCurrent
                                            ? `0 0 0 6px ${pathTheme.nodeCurrentRing}, 0 18px 34px ${pathTheme.nodeGlow}`
                                            : `0 14px 26px ${completed ? pathTheme.nodeCompletedGlow : pathTheme.nodeGlow}`,
                                        }}
                                      >
                                        {completed && (
                                          <NodeEffectPreview color={nodeEffect.particleColor} motion={nodeEffect.motion} />
                                        )}
                                        {completed ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        ) : unlocked && isChallenge ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                        ) : unlocked ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        )}
                                      </a>
                                      {hasNextNode && (
                                        <span
                                          className="pointer-events-none absolute left-1/2 top-full h-6 w-[6px] -translate-x-1/2 rounded-full"
                                          style={{
                                            background: completed || unlocked ? pathTheme.trailGradient : LOCKED_CONNECTOR_GRADIENT,
                                            boxShadow: completed || unlocked ? `0 0 18px ${pathTheme.trailGlow}` : LOCKED_CONNECTOR_SHADOW,
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              if (!pathChest) return null;
                              const hasNextNode = index < displayPathNodes.length - 1;

                              return (
                                <div key={pathChest.id} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                                  <div className="relative">
                                    {tooltip === pathChest.id && (
                                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap z-20 shadow-lg">
                                        {chestOpened ? `${pathChest.title} claimed` : pathChest.title}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedChest(pathChest.state === "sealed" ? ensureChestReady(pathChest) : pathChest)}
                                      onMouseEnter={() => setTooltip(pathChest.id)}
                                      onMouseLeave={() => setTooltip(null)}
                                      aria-label={chestOpened ? `${pathChest.title} claimed` : `Open ${pathChest.title}`}
                                      className="group relative flex h-[4.6rem] w-[4.6rem] items-center justify-center transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
                                    >
                                      {chestOpened ? (
                                        <OpenChestNode rarity={pathChest.currentRarity} className="w-[4.1rem]" />
                                      ) : (
                                        <ClosedChestNode rarity={pathChest.currentRarity} className="w-[4.45rem]" />
                                      )}
                                    </button>
                                    {hasNextNode && (
                                      pathTheme.id === "celestial" ? (
                                        <CelestialConnector className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2" />
                                      ) : pathTheme.id === "the_void" ? (
                                        <VoidConnector className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2" />
                                      ) : (
                                        <span
                                          className="pointer-events-none absolute left-1/2 top-full h-6 w-[6px] -translate-x-1/2 rounded-full"
                                          style={{
                                            background: pathTheme.trailGradient,
                                            boxShadow: `0 0 18px ${pathTheme.trailGlow}`,
                                          }}
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        );
                      })}

                      {section.id < sections.length && (
                        <div className="flex items-center gap-4 my-8">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest">Next section</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className={`rounded-3xl p-5 mb-8 border-2 ${allComplete ? "bg-white border-gray-100" : "bg-gray-100 border-gray-200 opacity-60"}`}>
                  <p className="text-xs font-extrabold uppercase tracking-widest mb-1 text-green-500">Daily Refresh</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900 mb-0.5">Daily Challenge</h2>
                      <p className="text-gray-400 font-semibold text-sm">{allComplete ? "Keep your streak alive." : "Complete the full course to unlock."}</p>
                    </div>
                    {!allComplete && <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  </div>
                  {allComplete && <Link href="/daily" className="mt-4 block w-full bg-green-500 text-white font-extrabold py-3 rounded-2xl hover:bg-green-600 transition text-center shadow-md">Start Today&apos;s Challenge</Link>}
                </div>
                </div>
              )}
            </div>
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside
            className="sticky top-32 space-y-4 rounded-[2rem] border p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            style={{ borderColor: panelBorder, background: pathTheme.surfaceDark }}
          >

            {/* Language switcher */}
            {mounted && <LanguageSwitcher currentLanguage={currentLanguage} />}

            {/* XP & Streak */}
            <div className="rounded-2xl border p-4" style={{ borderColor: panelBorder, background: pathTheme.surfaceCard }}>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>
                Your stats
              </p>
              <div className="grid grid-cols-3" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
                {[
                  {
                    label: "XP",
                    value: formatCompactStat(xp),
                    title: xp.toLocaleString("en-US"),
                    valueColor: pathTheme.surfaceText,
                    icon: null,
                    footer: null,
                  },
                  {
                    label: "Streak",
                    value: formatCompactStat(streak),
                    title: streak.toLocaleString("en-US"),
                    valueColor: pathTheme.surfaceText,
                    icon: <StreakFlame streak={streak} freezeCount={0} size={24} showFreezeIndicator={false} />,
                    footer: (
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.42) }}>
                        <TrophyIcon className="h-3.5 w-3.5" />
                        <span>Best {bestStreak}</span>
                      </div>
                    ),
                  },
                  {
                    label: "Gems",
                    value: infiniteGemsEnabled ? "∞" : formatCompactStat(gems),
                    title: infiniteGemsEnabled ? "Infinite gems enabled" : gems.toLocaleString("en-US"),
                    valueColor: pathTheme.accentColor,
                    icon: null,
                    footer: null,
                  },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`min-w-0 px-2 py-4 text-center ${index === 0 ? "" : "border-l"}`}
                    style={{ borderColor: index === 0 ? "transparent" : withAlpha(pathTheme.accentColor, 0.12) }}
                  >
                    <p
                      className="truncate text-[2.2rem] font-semibold leading-none"
                      style={{ color: stat.valueColor }}
                      title={stat.title}
                    >
                      {stat.value}
                    </p>
                    {stat.icon ? <div className="mt-2 flex justify-center">{stat.icon}</div> : null}
                    <p
                      className="mt-3 whitespace-nowrap text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: withAlpha(pathTheme.surfaceText, 0.58) }}
                    >
                      {stat.label}
                    </p>
                    {stat.footer}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <StreakWeeklyStrip
                  days={weeklyStreak}
                  streak={streak}
                  accentColor={pathTheme.accentColor}
                  textColor={pathTheme.surfaceText}
                />
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.92)" }}>
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Reward chests</p>
              <div className="grid grid-cols-2 gap-3">
                {showcasedChests.map((chest) => {
                  const cardTone = getSidebarChestCardStyles(chest.currentRarity);
                  const elevatedCard = cardTone.elevated;

                  return (
                    <button
                      key={chest.id}
                      type="button"
                      onClick={() => setSelectedChest(chest)}
                      className={`relative flex flex-col overflow-hidden rounded-[1.5rem] border text-left shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
                        elevatedCard ? "min-h-[13.8rem] p-4" : "min-h-[12.8rem] p-3.5"
                      } ${cardTone.shellClass}`}
                    >
                      <span className={`pointer-events-none absolute inset-y-3 left-0 w-[4px] rounded-r-full ${cardTone.accentClass}`} />
                      {cardTone.sparkle && (
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                          <span
                            className="absolute right-4 top-5 h-1.5 w-1.5 rounded-full bg-white/70 blur-[0.5px]"
                            style={{ animation: "sidebarChestSparkle 3.8s ease-in-out infinite" }}
                          />
                          <span
                            className="absolute right-8 top-10 h-1 w-1 rounded-full bg-white/60"
                            style={{ animation: "sidebarChestSparkle 4.6s ease-in-out 0.8s infinite" }}
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90">
                            {chest.source === "quest" ? "Quest" : "Path"}
                          </p>
                          <p className="mt-2 text-[0.95rem] font-black leading-5 text-slate-900">{chest.title}</p>
                        </div>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${getChestStatusBadgeClass(chest.state)}`}>
                          {chest.state === "opened" ? "opened" : "ready"}
                        </span>
                      </div>

                      <RewardChestArt
                        rarity={chest.currentRarity}
                        opened={chest.state === "opened"}
                        skin="default_chest"
                        compact
                        prominent
                        className={`mx-auto mt-4 w-full ${elevatedCard ? "max-w-[6rem]" : "max-w-[5.3rem]"}`}
                      />

                      {chest.state === "opened" ? (
                        <div className="mt-auto flex items-center gap-2 pt-4 text-cyan-600">
                          <GemIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-lg font-black tracking-[-0.03em] text-cyan-700">
                            {formatRewardAmount(chest.gemAmount ?? 0)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-auto pt-4 text-[11px] font-semibold leading-5 text-slate-500">
                          {chest.sourceLabel}
                        </p>
                      )}
                    </button>
                  );
                })}

                {Array.from({ length: Math.max(0, 4 - showcasedChests.length) }).map((_, index) => (
                  <div
                    key={`empty-chest-placeholder-${index}`}
                    className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center"
                  >
                    <RewardChestArt rarity="common" skin="default_chest" compact className="mx-auto w-full max-w-[4.2rem] opacity-35 saturate-0" />
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-300">locked chest</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily quests */}
            <div className="rounded-2xl border p-4" style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.92)" }}>
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Daily quests</p>
              <div className="space-y-3">
                {mounted ? dailyQuests.map((quest) => (
                  (() => {
                    const questProgress = quest.current();
                    const questComplete = questProgress >= quest.total;
                    const questChestId = todayKey ? getQuestChestId(todayKey, quest.id) : null;
                    const baseQuestChest = todayKey
                      ? createQuestRewardChest(todayKey, quest.id, quest.label, quest.rewardTier)
                      : null;
                    const questChest = questChestId && baseQuestChest
                      ? getDisplayChest(questChestId, baseQuestChest)
                      : null;
                    const questTheme = questChest ? getChestTheme(questChest.currentRarity) : null;

                    return (
                      <div key={quest.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-3 py-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-extrabold text-gray-700">{quest.label}</p>
                          <p className="text-xs font-bold text-gray-400">{questProgress}/{quest.total}</p>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div
                            className={`h-full ${quest.color} rounded-full transition-all`}
                            style={{ width: `${(questProgress / quest.total) * 100}%` }}
                          />
                        </div>

                        {questComplete && questChest && questTheme ? (
                          <div className={`mt-3 rounded-[1.2rem] border p-3 ${questTheme.cardClass}`}>
                            <div className="flex items-center gap-3">
                              <RewardChestArt
                                rarity={questChest.currentRarity}
                                opened={questChest.state === "opened"}
                                skin="default_chest"
                                compact
                                className="w-[4.4rem] flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-black text-slate-900">
                                    {questChest.state === "opened" ? "Quest chest opened" : "Quest chest ready"}
                                  </p>
                                  <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] ${questTheme.chipClass}`}>
                                    {questTheme.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                                  {questChest.state === "opened"
                                    ? `Collected ${questChest.gemAmount ?? 0} gems`
                                    : "Tap through the lock to try for a higher rarity."}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextChest = questChest.state === "sealed" ? ensureChestReady(questChest) : questChest;
                                setSelectedChest(nextChest);
                              }}
                              className="mt-3 w-full rounded-[1rem] bg-slate-900 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800"
                            >
                              {questChest.state === "opened" ? "View reward" : "Open quest chest"}
                            </button>
                          </div>
                        ) : questComplete ? (
                          <div className="mt-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-3 py-3">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">Quest complete</p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-emerald-700">
                              Your chest is ready. Tap below to add it to the path rewards.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (!todayKey) return;
                                const unlockedChest = ensureChestReady(
                                  createQuestRewardChest(todayKey, quest.id, quest.label, quest.rewardTier),
                                );
                                setSelectedChest(unlockedChest);
                              }}
                              className="mt-3 w-full rounded-[1rem] bg-emerald-500 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-600"
                            >
                              Unlock quest chest
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()
                )) : (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mini courses */}
            <div className="rounded-2xl border p-4" style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.92)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Mini courses</p>
                  <p className="text-xs font-semibold text-gray-300 mt-1">
                    Small tracks for APIs, libraries, and tools
                  </p>
                </div>
                <span suppressHydrationWarning className="text-[11px] font-extrabold uppercase tracking-wider text-green-500">
                  {getLanguageLabel(currentLanguage)}
                </span>
              </div>
              <div className="space-y-3">
                {showResolvedSidebarContent ? miniCourses.map((course) => (
                  <div
                    key={course.id}
                    className="relative rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 flex-shrink-0 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xs font-black shadow-sm">
                        {course.badge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-gray-800">{course.title}</p>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMiniCourseMenu((current) => current === course.id ? null : course.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition"
                              aria-label={`Open ${course.title} menu`}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                              </svg>
                            </button>
                            {openMiniCourseMenu === course.id && (
                              <div
                                className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-gray-400">
                                  {course.status === "live" ? "Open module" : course.status === "coming_soon" ? "Coming soon" : "Planned"}
                                </div>
                                {course.status === "live" && course.href ? (
                                  <Link
                                    href={course.href}
                                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                  >
                                    Open module
                                  </Link>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setOpenMiniCourseMenu(null)}
                                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                      Save for later
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setOpenMiniCourseMenu(null)}
                                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                      Preview track
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-green-600 mt-0.5">{course.subtitle}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1 leading-5">{course.description}</p>
                        <span className={`inline-flex mt-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                          course.status === "live"
                            ? "bg-emerald-100 text-emerald-700"
                            : course.status === "coming_soon"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-600"
                        }`}>
                          {course.status === "live" ? "Open now" : course.status === "coming_soon" ? "Coming soon" : "Planned"}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <div className="animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-gray-200" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="h-4 w-28 rounded bg-gray-200" />
                              <div className="h-3 w-32 rounded bg-gray-200" />
                              <div className="h-3 w-full rounded bg-gray-200" />
                              <div className="h-3 w-5/6 rounded bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Achievements panel */}
            <div className="rounded-2xl border p-4" style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.92)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Achievements</p>
                <Link href="/achievements" className="text-xs font-extrabold text-green-500 hover:text-green-600 transition">
                  View all
                </Link>
              </div>
              {earnedAchievements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                  <p className="text-sm font-bold text-gray-400">No badges yet</p>
                  <p className="text-xs font-semibold text-gray-300 mt-1">Complete lessons to earn your first one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {earnedAchievementCards.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                    >
                      <div className={`h-11 w-11 flex-shrink-0 rounded-2xl bg-gradient-to-br ${achievement.gradient} shadow-sm flex items-center justify-center`}>
                        <span className="text-sm font-black text-white">
                          {achievement.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-800 truncate">{achievement.title}</p>
                        <p className="text-xs font-semibold text-gray-400 truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-green-50 px-3 py-2">
                <p className="text-xs font-bold text-green-700">{earnedAchievements.length} / {ACHIEVEMENTS.length} unlocked</p>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-green-500">
                  {Math.round((earnedAchievements.length / ACHIEVEMENTS.length) * 100)}%
                </p>
              </div>
            </div>

            {/* Streak card */}
            <div
              className="overflow-hidden rounded-[1.8rem] border p-4 text-center shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
              style={{
                borderColor: withAlpha(pathTheme.accentColor, 0.16),
                background: `linear-gradient(180deg, ${withAlpha(pathTheme.surfaceCard, 0.96)} 0%, rgba(255,255,255,0.92) 100%)`,
              }}
            >
              <div className="relative">
                <div
                  className="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full blur-2xl"
                  style={{ background: withAlpha(pathTheme.accentColor, 0.2) }}
                />
                <div className="relative flex items-center justify-center gap-3">
                  <StreakFlame streak={streak} freezeCount={weeklyStreak.find((day) => day.isToday)?.state === "reserved" ? 1 : 0} size={34} />
                  <div className="text-left">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>
                      Streak
                    </p>
                    <p className="text-2xl font-black" style={{ color: pathTheme.surfaceText }}>
                      {streak}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm font-extrabold" style={{ color: pathTheme.surfaceText }}>
                {streak >= 7 ? "You're on fire." : streak >= 3 ? "Momentum is building." : "Show up again tomorrow."}
              </p>
              <p className="mt-1 text-xs font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.52) }}>
                {streak > 0 ? `${streak} day streak active` : "Complete a lesson to start your streak"}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), color: withAlpha(pathTheme.surfaceText, 0.5) }}>
                <TrophyIcon className="h-3.5 w-3.5" />
                <span>Best {bestStreak}</span>
              </div>
            </div>

          </aside>
        </div>
        <MobileDock />
        <RewardChestModal
          key={selectedChest?.id ?? "learn-reward-empty"}
          chest={selectedChest}
          onClose={() => setSelectedChest(null)}
          onOpen={handleChestOpened}
          onProgress={handleChestProgress}
        />
        </div>
      </div>
    </>
  );
}

// ── Export: wrap in Suspense because useSearchParams requires it ───────────────
export default function Learn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <LearnInner />
    </Suspense>
  );
}
