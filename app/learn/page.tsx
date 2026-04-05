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
import {
  getCourseSections,
  getLanguageLabel,
  getMiniCourses,
  languageHasPlacement,
  type LessonMeta,
  type LessonNodeType,
  UnitMeta,
} from "@/lib/courseContent";
import { mergeProgressSources, resolveActiveLanguage, setStoredLanguageProgress, getStoredLanguageProgress } from "@/lib/progress";
import {
  arcRecordMapToNodeProgressMap,
  fetchRemoteArcProgressMap,
  getStoredArcProgressMap,
  mergeArcProgressRecordMaps,
  toArcProgressRecord,
  upsertRemoteArcProgressRecords,
} from "@/lib/lessonArc/arcProgress";
import { RewardChestArt } from "@/components/rewards/RewardChest";
import RewardChestModal from "@/components/rewards/RewardChestModal";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import {
  ChestRarity,
  RewardChest,
  createArcRewardChest,
  createChallengeRewardChest,
  createQuestRewardChest,
  getChestTheme,
  getQuestChestId,
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
import { isUnitChallengeUnlocked } from "@/lib/lessonArc/unitChallenge";
import type { LessonArcProgressMap } from "@/lib/lessonArc/types";

const PATH_POSITIONS = ["ml-24", "ml-40", "ml-52", "ml-40", "ml-24"];

function subscribe() {
  return () => {};
}

type OrderedPathNode = {
  unit: UnitMeta;
  lesson: LessonMeta;
  key: string;
};

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

function TeachingNodeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 7.5C4 6.672 4.672 6 5.5 6H11.5C12.328 6 13 6.672 13 7.5V18.5C13 17.672 12.328 17 11.5 17H5.5C4.672 17 4 17.672 4 18.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 7.5C20 6.672 19.328 6 18.5 6H12.5C11.672 6 11 6.672 11 7.5V18.5C11 17.672 11.672 17 12.5 17H18.5C19.328 17 20 17.672 20 18.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 8H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 8H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PracticeNodeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

function NodeTypeIcon({
  nodeType,
  className = "",
}: {
  nodeType: LessonNodeType;
  className?: string;
}) {
  if (nodeType === "teaching") {
    return <TeachingNodeIcon className={className} />;
  }

  return <PracticeNodeIcon className={className} />;
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
  const [arcProgress, setArcProgress] = useState<LessonArcProgressMap>({});
  const [activeSessionNodeId, setActiveSessionNodeId] = useState<string | null>(null);
  const [activeSessionSummary, setActiveSessionSummary] = useState<{
    nodeId: string;
    lessonIndex: number;
    questionIndex: number;
    mode: "progress" | "review";
    questionCount: number;
  } | null>(null);
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
  const pathCelebrationHandledRef = useRef<string | null>(null);
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
      setActiveSessionNodeId(null);
      setActiveSessionSummary(null);
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
    const cachedArcRecords = getStoredArcProgressMap(user.id, activeLanguage);
    const remoteArcRecords = await fetchRemoteArcProgressMap(user.id, activeLanguage);
    const compatArcRecords = Object.fromEntries(
      Object.values(merged.arc_progress).map((entry) => [entry.nodeId, toArcProgressRecord(entry)]),
    );
    const mergedArcRecords = mergeArcProgressRecordMaps(remoteArcRecords ?? {}, cachedArcRecords, compatArcRecords);
    const mergedWithArcTable = {
      ...merged,
      arc_progress: Object.keys(mergedArcRecords).length > 0
        ? arcRecordMapToNodeProgressMap(mergedArcRecords, merged.arc_progress)
        : merged.arc_progress,
    };
    const storedRewardChests = mergeRewardChestsFromClaims(
      getStoredRewardChests(user.id, activeLanguage),
      mergedWithArcTable.claimed_chests,
    );

    setViewerId(user.id);
    setCurrentLanguage(activeLanguage);
    setCompletedLessons(mergedWithArcTable.completed_lessons);
    setArcProgress(mergedWithArcTable.arc_progress);
    setActiveSessionNodeId(mergedWithArcTable.active_lesson_session?.nodeId ?? null);
    setActiveSessionSummary(
      mergedWithArcTable.active_lesson_session
        ? {
            nodeId: mergedWithArcTable.active_lesson_session.nodeId,
            lessonIndex: mergedWithArcTable.active_lesson_session.lessonIndex,
            questionIndex: mergedWithArcTable.active_lesson_session.questionIndex,
            mode: mergedWithArcTable.active_lesson_session.mode,
            questionCount: mergedWithArcTable.active_lesson_session.questions?.length ?? 0,
          }
        : null,
    );
    setXp(mergedWithArcTable.xp);
    setStreak(mergedWithArcTable.streak);
    setGems(mergedWithArcTable.gems);
    setTodayXp(mergedWithArcTable.today_xp);
    setTodayLessons(mergedWithArcTable.today_lessons);
    setTodayPerfect(mergedWithArcTable.today_perfect);
    setEarnedAchievements(mergedWithArcTable.achievements);
    setClaimedChests(mergedWithArcTable.claimed_chests);
    setRewardChests(storedRewardChests);
    setStoredLanguageProgress(user.id, activeLanguage, mergedWithArcTable);
    setStoredRewardChests(user.id, activeLanguage, storedRewardChests);
    if (Object.keys(mergedArcRecords).length > 0) {
      void upsertRemoteArcProgressRecords(user.id, activeLanguage, Object.values(mergedArcRecords));
    }
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

  const updateChestInventory = useCallback((nextChests: RewardChest[]) => {
    setRewardChests(nextChests);
    if (viewerId) {
      setStoredRewardChests(viewerId, currentLanguage, nextChests);
    }
  }, [currentLanguage, viewerId]);

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

  const ensureChestReady = useCallback((chest: RewardChest) => {
    const existing = rewardChests.find((entry) => entry.id === chest.id);
    if (existing) return existing;

    const next = upsertRewardChest(rewardChests, chest);
    updateChestInventory(next);
    return next.find((entry) => entry.id === chest.id) ?? chest;
  }, [rewardChests, updateChestInventory]);

  const getDisplayChest = (chestId: string, fallback: RewardChest) => {
    return rewardChests.find((entry) => entry.id === chestId)
      ?? (claimedChests.includes(chestId) ? mergeRewardChestsFromClaims([], [chestId])[0] : null)
      ?? fallback;
  };

  const orderedPathNodes = useMemo<OrderedPathNode[]>(
    () => sections.flatMap((section) => section.units.flatMap((unit) => unit.lessons.map((lesson) => ({
      unit,
      lesson,
      key: `${unit.id}-${lesson.id}`,
    })))),
    [sections],
  );

  const getNodeMeta = useCallback((unitId: number, lessonId: number) => {
    return orderedPathNodes.find((node) => node.unit.id === unitId && node.lesson.id === lessonId) ?? null;
  }, [orderedPathNodes]);

  const isUnlocked = useCallback((unitId: number, lessonId: number) => {
    const node = getNodeMeta(unitId, lessonId);
    if (!node) return false;
    const index = orderedPathNodes.findIndex((entry) => entry.key === node.key);
    if (index <= 0) return true;
    if (node.lesson.kind === "challenge") {
      return isUnitChallengeUnlocked(node.unit, completedLessons);
    }
    return completedLessons.includes(orderedPathNodes[index - 1]?.key ?? "");
  }, [completedLessons, getNodeMeta, orderedPathNodes]);

  const isSectionUnlocked = (sectionId: number) => {
    if (sectionId === 1) return true;
    const prevSection = sections[sectionId - 2];
    return prevSection.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`)));
  };

  const allComplete = sections.every(s => s.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`))));

  const findCurrentLesson = () => {
    for (const node of orderedPathNodes) {
      if (!completedLessons.includes(node.key) && isUnlocked(node.unit.id, node.lesson.id)) {
        return node.key;
      }
    }
    return null;
  };
  const currentLessonKey = activeSessionNodeId && !completedLessons.includes(activeSessionNodeId)
    ? activeSessionNodeId
    : findCurrentLesson();
  const currentNodeMeta = currentLessonKey
    ? orderedPathNodes.find((node) => node.key === currentLessonKey) ?? null
    : null;
  const startLessonHref = currentNodeMeta
    ? currentNodeMeta.lesson.kind === "challenge"
      ? `/learn/${currentNodeMeta.unit.id}/challenge?lang=${currentLanguage}`
      : `/learn/${currentNodeMeta.unit.id}/${currentNodeMeta.lesson.id}?lang=${currentLanguage}`
    : "/learn";
  const currentWeekToday = weeklyStreak.find((day) => day.isToday)?.dateKey ?? "today";
  const streakRiskSessionKey = streakRisk ? `${currentLanguage}:${currentWeekToday}` : null;

  useEffect(() => {
    if (loading) return;
    const celebrateNode = searchParams.get("celebrateNode");
    const openArcChestId = searchParams.get("openArcChest");
    const openChallengeChestUnit = searchParams.get("openChallengeChest");
    if (!celebrateNode && !openArcChestId && !openChallengeChestUnit) {
      pathCelebrationHandledRef.current = null;
      return;
    }

    const signature = `${celebrateNode ?? ""}:${openArcChestId ?? ""}:${openChallengeChestUnit ?? ""}:${currentLanguage}:${viewerId ?? "guest"}`;
    if (pathCelebrationHandledRef.current === signature) return;
    pathCelebrationHandledRef.current = signature;

    const kickoffId = window.setTimeout(() => {
      if (celebrateNode) {
        setRecentlyCompletedKey(celebrateNode);
        window.setTimeout(() => {
          setRecentlyCompletedKey((current) => (current === celebrateNode ? null : current));
        }, 2200);

        if (pathTheme.id === "celestial") {
          setAuroraBurstKey((value) => value + 1);
        } else if (pathTheme.id === "the_void") {
          setVoidFlashKey((value) => value + 1);
        }
      }

      if (openArcChestId) {
        const completedNode = orderedPathNodes.find((entry) => entry.key === openArcChestId);
        if (completedNode) {
          const chest = ensureChestReady(
            createArcRewardChest(completedNode.unit.id, completedNode.key, completedNode.lesson.title),
          );
          setSelectedChest(chest);
        }
      }

      if (openChallengeChestUnit) {
        const unitId = Number(openChallengeChestUnit);
        if (Number.isFinite(unitId) && unitId > 0) {
          setSelectedChest(ensureChestReady(createChallengeRewardChest(unitId)));
        }
      }
    }, 0);

    if (typeof window !== "undefined") {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("celebrateNode");
      nextParams.delete("openArcChest");
      nextParams.delete("openChallengeChest");
      const nextQuery = nextParams.toString();
      window.history.replaceState(null, "", nextQuery ? `/learn?${nextQuery}` : "/learn");
    }
    return () => window.clearTimeout(kickoffId);
  }, [currentLanguage, ensureChestReady, loading, orderedPathNodes, pathTheme.id, searchParams, viewerId]);

  useEffect(() => {
    if (loading) return;

    const lessonKeys = sections.flatMap((section) =>
      section.units.flatMap((unit) => unit.lessons.map((lesson) => `${unit.id}-${lesson.id}`)),
    );
    const currentCompleted = new Set(completedLessons.filter((lessonKey) => lessonKeys.includes(lessonKey)));
    const currentUnlocked = new Set(
      orderedPathNodes
        .filter((node) => isUnlocked(node.unit.id, node.lesson.id))
        .map((node) => node.key),
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
  }, [completedLessons, isUnlocked, loading, orderedPathNodes, pathTheme.id, sections]);

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
        @keyframes node-complete-bounce {
          0% { transform: translateY(0) scale(0.9); }
          40% { transform: translateY(-10px) scale(1.12); }
          72% { transform: translateY(2px) scale(0.98); }
          100% { transform: translateY(0) scale(1); }
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
        .node-complete-bounce { animation: node-complete-bounce 820ms cubic-bezier(0.22,1,0.36,1); }
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
                        const displayPathNodes = unit.lessons;

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
                            {displayPathNodes.map((lesson, index) => {
                              const key = `${unit.id}-${lesson.id}`;
                              const unlocked = isUnlocked(unit.id, lesson.id);
                              const completed = completedLessons.includes(key);
                              const isChallenge = lesson.kind === "challenge";
                              const nodeType: LessonNodeType = lesson.nodeType ?? "practice";
                              const nodeTypeLabel = nodeType === "teaching" ? "LEARN" : "PRACTICE";
                              const nodeArcProgress = arcProgress[key];
                              const completedArcLessons = isChallenge
                                ? 0
                                : completed
                                  ? 5
                                  : Math.min(5, nodeArcProgress?.completedLessonIndices?.length ?? 0);
                              const arcLessonIndex = nodeArcProgress?.lessonIndex ?? (completed ? 4 : 0);
                              const inProgressArc = !isChallenge && !completed && completedArcLessons > 0;
                              const isCurrent = key === currentLessonKey;
                              const hasNextNode = index < displayPathNodes.length - 1;
                              const nextLesson = displayPathNodes[index + 1];
                              const shouldAnimateConnector = Boolean(nextLesson && recentlyUnlockedKeys.includes(`${unit.id}-${nextLesson.id}`));
                              const nodeShape = getNodeShapePresentation(isChallenge ? "star" : pathTheme.nodeShape);
                              const actionLabel = completed
                                ? isChallenge
                                  ? "Replay"
                                  : "Review"
                                : isChallenge
                                  ? "Challenge"
                                  : inProgressArc
                                    ? "Continue"
                                    : "Start";
                              const tooltipLabel = isChallenge && !unlocked && !completed
                                ? "LOCKED — complete all lessons first"
                                : completed && !isChallenge
                                  ? `${lesson.title} · Review`
                                  : lesson.title;
                              const href = (unlocked || completed)
                                ? (isChallenge
                                    ? `/learn/${unit.id}/challenge?lang=${currentLanguage}`
                                    : completed
                                      ? `/learn/${unit.id}/${lesson.id}?lang=${currentLanguage}&mode=review`
                                      : `/learn/${unit.id}/${lesson.id}?lang=${currentLanguage}`)
                                : "#";
                              const logNodeActivation = () => {
                                if (process.env.NODE_ENV === "production" || (!unlocked && !completed)) return;
                                console.log("[learn-path] node activation", {
                                  nodeId: key,
                                  arcLessonIndex,
                                  activeSession: activeSessionSummary,
                                });
                              };

                              const regularCompletedBackground = pathTheme.nodeCompletedBackground;
                              const regularCompletedBorder = pathTheme.nodeCompletedBorder;
                              const challengeAvailableBackground = "linear-gradient(135deg,#FACC15 0%,#F59E0B 100%)";
                              const challengeLockedBackground = "linear-gradient(135deg,rgba(68,64,60,0.92) 0%,rgba(41,37,36,0.94) 100%)";
                              const challengeCompletedBackground = "linear-gradient(135deg,#FDE68A 0%,#F59E0B 100%)";
                              const nodeBackground = isChallenge
                                ? completed
                                  ? challengeCompletedBackground
                                  : unlocked
                                    ? challengeAvailableBackground
                                    : challengeLockedBackground
                                : completed
                                  ? regularCompletedBackground
                                  : unlocked
                                    ? pathTheme.nodeAvailableBackground
                                    : pathTheme.nodeLockedBackground;
                              const nodeBorder = isChallenge
                                ? completed
                                  ? "#D97706"
                                  : unlocked
                                    ? "#D97706"
                                    : "#78716C"
                                : completed
                                  ? regularCompletedBorder
                                  : unlocked
                                    ? pathTheme.nodeAvailableBorder
                                    : pathTheme.nodeLockedBorder;
                              const nodeTextColor = isChallenge
                                ? completed || unlocked ? "#FFFBEB" : "#D6D3D1"
                                : completed
                                  ? pathTheme.nodeCompletedText
                                  : unlocked
                                    ? pathTheme.nodeAvailableText
                                    : LOCKED_NODE_ICON_COLOR;

                              if ((pathTheme.id === "celestial" || pathTheme.id === "the_void") && !isChallenge) {
                                return (
                                  <div key={lesson.id} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                                    <div className="relative">
                                        {tooltip === key && (
                                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-xl bg-gray-950 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-lg">
                                          {tooltipLabel}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
                                          </div>
                                        )}
                                      {isCurrent && (
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                          <span className="rounded-lg bg-gray-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                            {actionLabel}
                                          </span>
                                        </div>
                                      )}
                                      <a
                                        href={href}
                                        onClick={logNodeActivation}
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
                                        {completed ? (
                                          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          </span>
                                        ) : (
                                          <span
                                            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                                            style={{ color: unlocked ? withAlpha(pathTheme.surfaceText, 0.92) : withAlpha(pathTheme.surfaceText, 0.58) }}
                                          >
                                            <NodeTypeIcon nodeType={nodeType} className="h-5 w-5" />
                                          </span>
                                        )}
                                      </a>
                                      {inProgressArc ? (
                                        <div className="absolute -bottom-2 -right-8 z-30 whitespace-nowrap">
                                          <span
                                            className="rounded-full bg-black/72 px-2 py-0.5 text-[11px] font-black tracking-[0.04em]"
                                            style={{ color: pathTheme.accentColor }}
                                          >
                                            {completedArcLessons}/5
                                          </span>
                                        </div>
                                      ) : null}
                                      {!isChallenge && !completed ? (
                                        <div className="pointer-events-none absolute left-[calc(100%+0.45rem)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap">
                                          <span
                                            className="text-[10px] font-black uppercase tracking-[0.16em]"
                                            style={{ color: unlocked ? withAlpha(pathTheme.surfaceText, 0.76) : withAlpha(pathTheme.surfaceText, 0.44) }}
                                          >
                                            {nodeTypeLabel}
                                          </span>
                                        </div>
                                      ) : null}
                                      {hasNextNode ? (
                                        pathTheme.id === "celestial" ? (
                                          <CelestialConnector className="pointer-events-none absolute left-1/2 top-full z-0 -translate-x-1/2" active={completed || unlocked} animateDraw={shouldAnimateConnector} />
                                        ) : (
                                          <VoidConnector className="pointer-events-none absolute left-1/2 top-full z-0 -translate-x-1/2" active={completed || unlocked} />
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
                                        {tooltipLabel}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                      </div>
                                    )}
                                    {isCurrent && (
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="bg-gray-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                          {actionLabel}
                                        </span>
                                      </div>
                                    )}
                                    <a
                                      href={href}
                                      onClick={logNodeActivation}
                                      onMouseEnter={() => setTooltip(key)}
                                      onMouseLeave={() => setTooltip(null)}
                                      className={`relative flex h-14 w-14 items-center justify-center border-b-4 font-extrabold transition-all duration-150 active:translate-y-1 ${nodeShape.className} ${
                                        isCurrent ? "node-pulse" : ""
                                      } ${recentlyCompletedKey === key ? "node-complete-bounce" : ""} ${unlocked || completed ? "hover:brightness-110" : "cursor-not-allowed"}`}
                                      style={{
                                        background: nodeBackground,
                                        borderColor: nodeBorder,
                                        color: nodeTextColor,
                                        ...nodeShape.style,
                                        boxShadow: isCurrent
                                          ? `0 0 0 6px ${pathTheme.nodeCurrentRing}, 0 18px 34px ${isChallenge ? "rgba(245,158,11,0.24)" : pathTheme.nodeGlow}`
                                          : `0 14px 26px ${completed && !isChallenge ? pathTheme.nodeCompletedGlow : isChallenge ? "rgba(245,158,11,0.22)" : pathTheme.nodeGlow}`,
                                      }}
                                    >
                                      {completed && !isChallenge ? (
                                        <NodeEffectPreview color={nodeEffect.particleColor} motion={nodeEffect.motion} />
                                      ) : null}
                                      {completed && isChallenge ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M17 3H7v4H3v3c0 2.8 2.2 5 5 5h.17A5.98 5.98 0 0 0 11 17.92V20H8v2h8v-2h-3v-2.08A5.98 5.98 0 0 0 15.83 15H16c2.8 0 5-2.2 5-5V7h-4V3Zm-8 9c-1.66 0-3-1.34-3-3V9h3v3Zm9-3c0 1.66-1.34 3-3 3V9h3v0Z" />
                                        </svg>
                                      ) : completed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                      ) : isChallenge && unlocked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 2.5l2.66 5.39 5.95.86-4.3 4.2 1.01 5.93L12 16.35 6.68 18.88l1.02-5.93-4.3-4.2 5.95-.86L12 2.5Z" />
                                        </svg>
                                      ) : isChallenge ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      ) : (
                                        <NodeTypeIcon nodeType={nodeType} className="h-5 w-5" />
                                      )}
                                    </a>
                                    {inProgressArc ? (
                                      <div className="absolute -bottom-2 -right-8 z-30 whitespace-nowrap">
                                        <span
                                          className="rounded-full bg-slate-950/92 px-2 py-0.5 text-[11px] font-black tracking-[0.04em]"
                                          style={{ color: unlocked ? pathTheme.accentColor : LOCKED_NODE_ICON_COLOR }}
                                        >
                                          {completedArcLessons}/5
                                        </span>
                                      </div>
                                    ) : null}
                                    {!isChallenge && !completed ? (
                                      <div className="pointer-events-none absolute left-[calc(100%+0.45rem)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap">
                                        <span
                                          className="text-[10px] font-black uppercase tracking-[0.16em]"
                                          style={{ color: unlocked ? withAlpha(pathTheme.surfaceText, 0.74) : withAlpha(pathTheme.surfaceText, 0.44) }}
                                        >
                                          {nodeTypeLabel}
                                        </span>
                                      </div>
                                    ) : null}
                                    {hasNextNode && (
                                      <span
                                        className="pointer-events-none absolute left-1/2 top-full z-0 h-6 w-[6px] -translate-x-1/2 rounded-full"
                                        style={{
                                          background: completed || unlocked ? pathTheme.trailGradient : LOCKED_CONNECTOR_GRADIENT,
                                          boxShadow: completed || unlocked ? `0 0 18px ${pathTheme.trailGlow}` : LOCKED_CONNECTOR_SHADOW,
                                        }}
                                      />
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
