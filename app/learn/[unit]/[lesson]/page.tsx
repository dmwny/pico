"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getCourseSections, getLessonTopic, LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { resolveActiveLanguage, setStoredLanguageProgress, mergeProgressSources, getStoredLanguageProgress } from "@/lib/progress";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { PERFECT_RUN_BONUS_XP } from "@/lib/cosmetics";
import { RewardChestArt } from "@/components/rewards/RewardChest";
import RewardChestModal from "@/components/rewards/RewardChestModal";
import {
  RewardChest,
  createUnitRewardChest,
  getChestTheme,
  getUnitChestInsertionProgress,
  getStoredRewardChests,
  mergeRewardChestsFromClaims,
  openRewardChest,
  progressRewardChest,
  setStoredRewardChests,
  upsertRewardChest,
} from "@/lib/rewardChests";

const TOTAL_QUESTIONS = 4;
const LESSON_TIME_LIMIT = 90;

type LessonQuestion = {
  type?: "arrange" | "fill" | "multiple_choice" | "output";
  instruction?: string;
  answer?: string | string[];
  explanation?: string;
  codeLines?: string[];
  tiles?: string[];
  options?: string[];
  consoleOutput?: string;
};

type TeachingContent = {
  title?: string;
  explanation?: string;
  example?: string;
  tip?: string;
};

function subscribe() {
  return () => {};
}

function countBlankMarkers(codeLines: string[] = []) {
  return codeLines.reduce((count, line) => count + (line.match(/_{2,}/g) || []).length, 0);
}

function rotateList<T>(items: T[], offset: number) {
  if (items.length === 0) return items;
  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function getArrangeBlankCount(question: LessonQuestion | null | undefined) {
  const markerCount = countBlankMarkers(question?.codeLines || []);
  const answerCount = Array.isArray(question?.answer) ? question.answer.length : 0;
  return answerCount > 0 ? Math.min(markerCount, answerCount) : markerCount;
}

function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const maybeError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const details = {
    message: maybeError.message || null,
    code: maybeError.code || null,
    details: maybeError.details || null,
    hint: maybeError.hint || null,
  };

  return Object.values(details).some(Boolean) ? details : null;
}

function getDayKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getDayGap(lastPlayed: string | null | undefined, todayKey: string) {
  if (!lastPlayed) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(lastPlayed)
    ? lastPlayed
    : (() => {
        const parsed = new Date(lastPlayed);
        return Number.isNaN(parsed.getTime()) ? null : getDayKey(parsed);
      })();

  if (!normalized) return null;

  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const previous = new Date(`${normalized}T00:00:00.000Z`);
  return Math.round((today.getTime() - previous.getTime()) / 86_400_000);
}

function getUnlockedUnitRewardChest(
  language: LearningLanguage,
  unitNumber: number,
  completedLessons: string[],
  claimedChests: string[],
  rewardChests: RewardChest[],
) {
  const unit = getCourseSections(language)
    .flatMap((section) => section.units)
    .find((entry) => entry.id === unitNumber);

  if (!unit) return null;

  const unitLessonKeys = unit.lessons.map((lesson) => `${unitNumber}-${lesson.id}`);
  const unitCompletedLessons = unitLessonKeys.filter((key) => completedLessons.includes(key)).length;
  const insertionProgress = getUnitChestInsertionProgress(unitNumber, unit.lessons.length);
  if (unitCompletedLessons < insertionProgress) return null;

  const reward = createUnitRewardChest(unitNumber);
  if (claimedChests.includes(reward.id) || rewardChests.some((entry) => entry.id === reward.id)) return null;

  return reward;
}

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = ["#58CC02", "#FFC800", "#FF4B4B", "#1CB0F6", "#CE82FF"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => {
        const color = colors[i % colors.length];
        const left = (i * 17) % 100;
        const delay = (i % 7) * 0.08;
        const duration = 1.5 + (i % 5) * 0.18;
        const rotation = (i * 37) % 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-10px",
              width: "10px",
              height: "10px",
              backgroundColor: color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              animation: `fall ${duration}s ease-in ${delay}s forwards`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── XP Float ─────────────────────────────────────────────────────────────────
function XPFloat({ show, amount }: { show: boolean; amount: number }) {
  if (!show) return null;
  return (
    <div
      className="fixed top-20 right-8 text-green-500 font-extrabold text-2xl z-40 pointer-events-none"
      style={{ animation: "floatUp 1.2s ease-out forwards" }}
    >
      +{amount} XP
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
      `}</style>
    </div>
  );
}

function GemFloat({ show, amount }: { show: boolean; amount: number }) {
  if (!show) return null;
  return (
    <div
      className="fixed top-32 right-8 z-40 pointer-events-none text-cyan-500 font-extrabold text-2xl"
      style={{ animation: "floatUp 1.2s ease-out forwards" }}
    >
      +{amount} gems
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
      `}</style>
    </div>
  );
}

// ── Achievement Toast ─────────────────────────────────────────────────────────
function AchievementToast({ achievement, onDone }: { achievement: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(() => {
      onDone();
    }, 3500);
    return () => clearTimeout(t);
  }, [achievement, onDone]);

  if (!achievement) return null;
  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="bg-gray-900 text-white pl-4 pr-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-bold border border-gray-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black">Achievement Unlocked</p>
          <p className="text-sm">{achievement}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LessonPage() {
  const {
    isXpBoostActiveAt,
    spendPerfectRunToken,
    perfectRunTokenCount,
    consumeStreakFreezeCharge,
    recordOpenedChest,
    infiniteGemsEnabled,
    updateProgress,
    progress: globalProgress,
  } = useCosmetics();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = params.unit as string;
  const lessonId = params.lesson as string;
  const requestedLanguageParam = searchParams.get("lang");
  const requestedLanguage = requestedLanguageParam ? normalizeLanguage(requestedLanguageParam) : null;
  const [currentLanguage, setCurrentLanguage] = useState<LearningLanguage | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  // State
  const [phase, setPhase] = useState<"teaching" | "quiz" | "done">("teaching");
  const [teaching, setTeaching] = useState<TeachingContent | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);

  // Answer state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedFill, setSelectedFill] = useState<string | null>(null);
  const [arrangedTiles, setArrangedTiles] = useState<string[]>([]);
  const [availableArrangeTiles, setAvailableArrangeTiles] = useState<string[]>([]);

  // Game state
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [xpBoostSnapshot, setXpBoostSnapshot] = useState(false);
  const [perfectRunConverted, setPerfectRunConverted] = useState(false);

  // UI state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(10);
  const [showGemBurst, setShowGemBurst] = useState(false);
  const [gemAmount, setGemAmount] = useState(0);
  const [flashState, setFlashState] = useState<"none" | "correct" | "wrong">("none");
  const [shakeKey, setShakeKey] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [alreadyEarnedAchievements, setAlreadyEarnedAchievements] = useState<string[]>([]);
  const [claimedChests, setClaimedChests] = useState<string[]>([]);
  const [rewardChests, setRewardChests] = useState<RewardChest[]>([]);
  const [chestReward, setChestReward] = useState<RewardChest | null>(null);
  const lessonMounted = useSyncExternalStore(subscribe, () => true, () => false);

  // Load lesson + existing achievements
  useEffect(() => {
    loadLesson();
    loadEarnedAchievements();
  }, []);

  useEffect(() => {
    if (!startTime || phase !== "quiz") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, startTime]);

  const loadEarnedAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const activeLanguage = await resolveActiveLanguage(user.id);
    const { data } = await supabase
      .from("pico_progress")
      .select("achievements")
      .eq("user_id", user.id)
      .eq("language", activeLanguage)
      .maybeSingle();
    if (data) {
      setAlreadyEarnedAchievements(JSON.parse(data.achievements || "[]"));
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (feedback) { next(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedback]);

  // Set up arrange tiles when question changes
  useEffect(() => {
    const q = questions[current];
    if (!q) return;
    if (q.type === "arrange") {
      const shuffled = rotateList(q.tiles || [], current + 1);
      setAvailableArrangeTiles(shuffled);
      const blanks = getArrangeBlankCount(q);
      setArrangedTiles(new Array(blanks).fill(""));
    } else if (q.type === "fill" || q.type === "multiple_choice" || q.type === "output") {
      if (q.tiles) q.tiles = rotateList(q.tiles, current + 1);
      if (q.options) q.options = rotateList(q.options, current + 2);
    }
  }, [current, questions]);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let lessonLanguage: LearningLanguage = "python";
      if (user) {
        lessonLanguage = requestedLanguage ?? await resolveActiveLanguage(user.id);
        setCurrentLanguage(lessonLanguage);
        setViewerId(user.id);
        const localProgress = getStoredLanguageProgress(user.id, lessonLanguage);
        const storedRewardChests = mergeRewardChestsFromClaims(
          getStoredRewardChests(user.id, lessonLanguage),
          localProgress?.claimed_chests ?? [],
        );
        setGems(localProgress?.gems ?? 0);
        setClaimedChests(localProgress?.claimed_chests ?? []);
        setRewardChests(storedRewardChests);
        setStoredRewardChests(user.id, lessonLanguage, storedRewardChests);
      }

      const res = await fetch("/api/lesson", {
        method: "POST",
        body: JSON.stringify({
          topic: getLessonTopic(lessonLanguage, unitId, lessonId),
          unitId,
          lessonId,
          count: TOTAL_QUESTIONS,
          language: lessonLanguage,
        }),
      });
      const data = await res.json();
      setTeaching(data.teaching);
      setQuestions(data.questions || []);
      setStartTime(null);
      setElapsedSeconds(0);
      setPerfectRunConverted(false);
      setXpBoostSnapshot(false);
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  };

  const updateChestInventory = (nextChests: RewardChest[]) => {
    setRewardChests(nextChests);
    if (viewerId && currentLanguage) {
      setStoredRewardChests(viewerId, currentLanguage, nextChests);
    }
  };

  const syncChestRewards = async (nextGems: number, nextClaimedChests: string[]) => {
    setGems(nextGems);
    setClaimedChests(nextClaimedChests);

    if (!viewerId || !currentLanguage) return;

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

  const handleChestOpened = async (result: {
    chestId: string;
    finalRarity: RewardChest["currentRarity"];
    gemsAwarded: number;
    tapsUsed: number;
  }) => {
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
    setGemAmount(result.gemsAwarded);
    setShowGemBurst(true);
    setTimeout(() => setShowGemBurst(false), 1400);

    if (opened.chest) {
      setChestReward(opened.chest);
    }
  };

  const handleChestProgress = async (result: {
    chestId: string;
    currentRarity: RewardChest["currentRarity"];
    tapsUsed: number;
  }) => {
    const progressed = progressRewardChest(rewardChests, result);
    updateChestInventory(progressed.chests);

    setChestReward((current) => {
      if (!current || current.id !== result.chestId || current.state === "opened") {
        return current;
      }

      return {
        ...current,
        currentRarity: result.currentRarity,
        tapsUsed: Math.max(current.tapsUsed, result.tapsUsed),
      };
    });
  };

  const checkAnswer = async () => {
    const q = questions[current];
    let userAnswer = "";
    if (q.type === "arrange") userAnswer = arrangedTiles.filter(Boolean).join(" ");
    else if (q.type === "fill") userAnswer = selectedFill || "";
    else userAnswer = selectedOption || "";

    if (!userAnswer.trim()) return;
    setChecking(true);

    const res = await fetch("/api/check-lesson", {
      method: "POST",
      body: JSON.stringify({
        question: q.instruction,
        correctAnswer: Array.isArray(q.answer) ? q.answer.join(" ") : q.answer,
        userAnswer,
      }),
    });
    const data = await res.json();
    setFeedback({ ...data, explanation: q.explanation });
    setChecking(false);

    if (data.correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectCount((p) => p + 1);
      const earned = newStreak >= 3 ? 20 : 10;
      const awardedXp = xpBoostSnapshot ? earned * 2 : earned;
      setXp((p) => p + awardedXp);
      setXpAmount(awardedXp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1200);
      setFlashState("correct");
      setTimeout(() => setFlashState("none"), 600);

      if (newStreak === 3 && !alreadyEarnedAchievements.includes("streak_3")) {
        triggerAchievement("On Fire");
        setAlreadyEarnedAchievements((prev) => [...prev, "streak_3"]);
      }
    } else {
      setStreak(0);
      setLives((p) => Math.max(0, p - 1));
      setFlashState("wrong");
      setShakeKey((k) => k + 1);
      setTimeout(() => setFlashState("none"), 600);
    }
  };

  const triggerAchievement = (name: string) => {
    setAchievement(name);
  };

  // ── FIXED: cache-busting navigation so learn page re-fetches on return ──
  const goBack = useCallback(() => {
    router.push(`/learn?t=${Date.now()}#unit-${unitId}`);
  }, [router, unitId]);

  const getCorrectAnswerText = (q: LessonQuestion | null | undefined) => {
    if (!q) return "";

    if (q.type === "arrange" && Array.isArray(q.answer) && Array.isArray(q.codeLines)) {
      const answers = q.answer;
      let index = 0;
      const maxBlanks = getArrangeBlankCount(q);
      return q.codeLines
        .map((line: string) =>
          line.replace(/_{2,}/g, () => {
            if (index >= maxBlanks) return "___";
            const replacement = answers[index++];
            return replacement !== undefined ? replacement : "___";
          })
        )
        .join("\n");
    }

    if (q.type === "fill" && q.codeLines && Array.isArray(q.codeLines)) {
      const answerText = Array.isArray(q.answer) ? q.answer.join(" ") : q.answer ?? "___";
      return q.codeLines.map((line: string) => line.replace("___", answerText)).join("\n");
    }

    if (Array.isArray(q.answer)) {
      return q.answer.join(" ");
    }

    return q.answer ? String(q.answer) : "";
  };

  const next = useCallback(async () => {
    if (current + 1 >= TOTAL_QUESTIONS) {
      await saveProgress();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      if (correctCount + (feedback?.correct ? 1 : 0) === TOTAL_QUESTIONS && !alreadyEarnedAchievements.includes("perfect_lesson")) {
        triggerAchievement("Flawless");
        setAlreadyEarnedAchievements((prev) => [...prev, "perfect_lesson"]);
      }
      setPhase("done");
    } else {
      setCurrent((p) => p + 1);
      setFeedback(null);
      setSelectedOption(null);
      setSelectedFill(null);
      setArrangedTiles([]);
    }
  }, [current, feedback, correctCount, alreadyEarnedAchievements]);

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const lessonLanguage = currentLanguage ?? requestedLanguage ?? await resolveActiveLanguage(user.id);
    const lessonKey = `${unitId}-${lessonId}`;
    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", lessonLanguage)
      .maybeSingle();

    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsedSeconds;
    const perfect = correctCount === TOTAL_QUESTIONS;
    const localProgress = getStoredLanguageProgress(user.id, lessonLanguage);
    const localClaimedChests = localProgress?.claimed_chests ?? [];
    const localRewardChests = mergeRewardChestsFromClaims(
      getStoredRewardChests(user.id, lessonLanguage),
      localClaimedChests,
    );
    const currentGems = localProgress?.gems ?? gems;

    if (existing) {
      const completed: string[] = JSON.parse(existing.completed_lessons || "[]");
      const alreadyDone = completed.includes(lessonKey);
      if (!alreadyDone) completed.push(lessonKey);
      const rewardChest = getUnlockedUnitRewardChest(lessonLanguage, Number(unitId), completed, localClaimedChests, localRewardChests);
      const nextRewardChests = rewardChest ? upsertRewardChest(localRewardChests, rewardChest) : localRewardChests;

      const newXp = existing.xp + xp;
      const alreadyEarned: string[] = JSON.parse(existing.achievements || "[]");

      const totalPerfect = (existing.today_perfect || 0) + (perfect ? 1 : 0);

      const shouldEarn = checkAchievements(
        completed,
        newXp,
        existing.streak || 0,
        perfect,
        timeTaken,
        streak,
        totalPerfect,
      );

      const newlyEarned = shouldEarn.filter((id: string) => !alreadyEarned.includes(id));
      const allEarned = [...alreadyEarned, ...newlyEarned];

      // ── Streak logic ────────────────────────────────────────────────────
      const today = getDayKey();
      const dayGap = getDayGap(existing.last_played, today);
      const newStreak =
        dayGap === 0
          ? existing.streak || 0
          : dayGap === 1
            ? (existing.streak || 0) + 1
            : dayGap === 2
              ? (consumeStreakFreezeCharge() ? (existing.streak || 0) + 1 : 1)
              : 1;

      const updatedProgress = {
        completed_lessons: JSON.stringify(completed),
        xp: newXp,
        streak: newStreak,
        achievements: JSON.stringify(allEarned),
        today_xp: (existing.today_xp || 0) + xp,
        today_lessons: (existing.today_lessons || 0) + 1,
        today_perfect: (existing.today_perfect || 0) + (perfect ? 1 : 0),
        last_played: today,
      };

      const syncResponse = await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          language: lessonLanguage,
          values: updatedProgress,
        }),
      });
      const { error } = await syncResponse.json();

      const merged = mergeProgressSources(lessonLanguage, { ...existing, ...updatedProgress }, localProgress);
      setStoredLanguageProgress(user.id, lessonLanguage, {
        ...merged,
        gems: currentGems,
        claimed_chests: localClaimedChests,
      });
      setStoredRewardChests(user.id, lessonLanguage, nextRewardChests);
      setRewardChests(nextRewardChests);

      if (error) {
        const details = getSupabaseErrorDetails(error);
        console.warn(
          details
            ? "Supabase progress sync failed. Local progress was saved, but cross-device sync may still be blocked."
            : "Supabase progress sync failed. Local progress was saved. If this keeps happening, the pico_progress table may still be missing the (user_id, language) unique constraint.",
          details ?? undefined
        );
      }

      // Only show toast for achievements not already triggered in-lesson
      if (newlyEarned.length > 0) {
        const alreadyTriggeredInLesson = ["streak_3", "perfect_lesson"];
        const toShow = newlyEarned.filter((id: string) => !alreadyTriggeredInLesson.includes(id) || !alreadyEarnedAchievements.includes(id));
        if (toShow.length > 0) {
          const achievementData = ACHIEVEMENTS.find((a) => a.id === toShow[0]);
          if (achievementData) triggerAchievement(achievementData.title);
        }
      }

      if (rewardChest) {
        setChestReward(nextRewardChests.find((entry) => entry.id === rewardChest.id) ?? rewardChest);
      }
    } else {
      const today = getDayKey();
      const shouldEarn = checkAchievements([lessonKey], xp, 0, perfect, timeTaken, streak, perfect ? 1 : 0);
      const rewardChest = getUnlockedUnitRewardChest(lessonLanguage, Number(unitId), [lessonKey], localClaimedChests, localRewardChests);
      const nextRewardChests = rewardChest ? upsertRewardChest(localRewardChests, rewardChest) : localRewardChests;

      const insertedProgress = {
        user_id: user.id,
        xp,
        streak: 1,
        last_played: today,
        completed_lessons: JSON.stringify([lessonKey]),
        achievements: JSON.stringify(shouldEarn),
        today_xp: xp,
        today_lessons: 1,
        today_perfect: perfect ? 1 : 0,
        language: lessonLanguage,
      };

      const syncResponse = await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          language: lessonLanguage,
          values: {
            xp,
            streak: 1,
            last_played: today,
            completed_lessons: JSON.stringify([lessonKey]),
            achievements: JSON.stringify(shouldEarn),
            today_xp: xp,
            today_lessons: 1,
            today_perfect: perfect ? 1 : 0,
          },
        }),
      });
      const { error } = await syncResponse.json();

      const merged = mergeProgressSources(lessonLanguage, insertedProgress, localProgress);
      setStoredLanguageProgress(user.id, lessonLanguage, {
        ...merged,
        gems: currentGems,
        claimed_chests: localClaimedChests,
      });
      setStoredRewardChests(user.id, lessonLanguage, nextRewardChests);
      setRewardChests(nextRewardChests);

      if (error) {
        const details = getSupabaseErrorDetails(error);
        console.warn(
          details
            ? "Supabase progress sync failed. Local progress was saved, but cross-device sync may still be blocked."
            : "Supabase progress sync failed. Local progress was saved. If this keeps happening, the pico_progress table may still be missing the (user_id, language) unique constraint.",
          details ?? undefined
        );
      }

      if (shouldEarn.length > 0) {
        const achievementData = ACHIEVEMENTS.find((a) => a.id === shouldEarn[0]);
        if (achievementData) triggerAchievement(achievementData.title);
      }

      if (rewardChest) {
        setChestReward(nextRewardChests.find((entry) => entry.id === rewardChest.id) ?? rewardChest);
      }
    }
  };

  // ── Render: arrange code lines ──────────────────────────────────────────────
  const renderArrangeCode = (q: LessonQuestion) => {
    const maxBlanks = getArrangeBlankCount(q);
    let blankIndex = 0;
    return (q.codeLines || []).map((line: string, li: number) => {
      const parts = line.split(/_{2,}/);
      return (
        <div key={li} className="flex gap-2 flex-wrap items-center">
          <span className="text-gray-500 font-mono text-sm select-none">{li + 1}</span>
          {parts.map((part: string, pi: number) => {
            const hasBlankAfter = pi < parts.length - 1;
            const currentBlank = blankIndex;
            const shouldRenderBlank = hasBlankAfter && blankIndex < maxBlanks;
            if (shouldRenderBlank) blankIndex++;
            return (
              <span key={pi} className="flex items-center gap-1">
                <span className="text-green-400 font-mono text-sm">{part}</span>
                {hasBlankAfter && shouldRenderBlank && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[60px] h-8 px-2 rounded-lg border-2 font-mono text-sm cursor-pointer transition ${
                      arrangedTiles[currentBlank]
                        ? "border-green-400 bg-green-900 text-green-300"
                        : "border-gray-600 bg-gray-800 text-gray-500"
                    }`}
                    onClick={() => {
                      if (feedback) return;
                      const word = arrangedTiles[currentBlank];
                      if (word) {
                        const newTiles = [...arrangedTiles];
                        newTiles[currentBlank] = "";
                        setArrangedTiles(newTiles);
                        setAvailableArrangeTiles((prev) => [...prev, word]);
                      }
                    }}
                  >
                    {arrangedTiles[currentBlank] || "___"}
                  </span>
                )}
                {hasBlankAfter && !shouldRenderBlank && (
                  <span className="text-green-400 font-mono text-sm">___</span>
                )}
              </span>
            );
          })}
        </div>
      );
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Pico size={100} mood="happy" className="mx-auto mb-2" />
          <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Preparing your lesson...</p>
        </div>
      </main>
    );
  }

  // ── Teaching phase ───────────────────────────────────────────────────────────
  if (phase === "teaching" && teaching) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_46%,_#f8fafc_100%)]">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <button onClick={goBack} className="text-gray-400 hover:text-gray-600 font-bold mb-8 block">
            Back
          </button>

          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-end gap-4">
                <Pico size={96} mood="happy" />
                <div className="rounded-[1.7rem] rounded-bl-sm bg-emerald-500 px-5 py-4 text-white shadow-sm">
                  <p className="text-xs font-extrabold uppercase tracking-wider mb-1">
                    Coach
                  </p>
                  <p className="text-sm font-bold leading-6">
                    Read the pattern first. Then the quiz narrows to one clear action at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                Unit {unitId} · Lesson {lessonId}
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900">{teaching.title}</h1>
              <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">{teaching.explanation}</p>

              {teaching.example && (
                <div className="mt-6">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Example</p>
                  <pre className="bg-slate-950 text-emerald-300 p-4 rounded-2xl font-mono text-sm overflow-x-auto">
                    {teaching.example}
                  </pre>
                </div>
              )}

              {teaching.tip && (
                <div className="mt-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4">
                  <p className="text-emerald-700 font-bold text-sm">Tip: {teaching.tip}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setStartTime(Date.now());
                  setElapsedSeconds(0);
                  setXpBoostSnapshot(isXpBoostActiveAt(Date.now()));
                  setPerfectRunConverted(false);
                  setPhase("quiz");
                }}
                className="mt-8 w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-600 transition shadow-md text-lg"
              >
                Start Lesson
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Done phase ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsedSeconds;
    const perfect = correctCount === TOTAL_QUESTIONS || perfectRunConverted;
    return (
      <>
        <Confetti active={showConfetti} />
        <GemFloat show={showGemBurst} amount={gemAmount} />
        <AchievementToast achievement={achievement} onDone={() => setAchievement(null)} />
        <RewardChestModal
          key={chestReward?.id ?? "lesson-done-reward-empty"}
          chest={chestReward}
          onClose={() => setChestReward(null)}
          onOpen={handleChestOpened}
          onProgress={handleChestProgress}
        />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <Pico size={150} mood={perfect ? "celebrate" : "happy"} className="mx-auto" />
            <div className="bg-white rounded-3xl shadow-sm py-10 px-12 -mt-6">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                {perfect ? "Perfect!" : "Lesson Complete!"}
              </h2>
              <p className="text-gray-500 font-semibold mb-6">
                {correctCount} of {TOTAL_QUESTIONS} correct · {timeTaken}s · +{xp} XP
              </p>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">streak</p>
                  <p className="mt-2 text-2xl font-extrabold text-orange-500">{streak}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">gems</p>
                  <p className="mt-2 text-2xl font-extrabold text-cyan-600">{infiniteGemsEnabled ? "∞" : gems}</p>
                </div>
              </div>
              {perfect && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                  <p className="text-yellow-700 font-extrabold">
                    {perfectRunConverted ? `Perfect restored with a token. +${PERFECT_RUN_BONUS_XP} XP added.` : "No mistakes! Amazing work."}
                  </p>
                </div>
              )}
              {!perfect && perfectRunTokenCount > 0 && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-600">Perfect Run Token</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
                    Spend one token to convert this lesson into a perfect run and claim the retroactive bonus XP.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!spendPerfectRunToken()) return;
                      setPerfectRunConverted(true);
                      setXp((value) => value + PERFECT_RUN_BONUS_XP);
                      setXpAmount(PERFECT_RUN_BONUS_XP);
                      setShowXP(true);
                      setTimeout(() => setShowXP(false), 1200);
                      void updateProgress(
                        {
                          xp: (globalProgress?.xp ?? 0) + PERFECT_RUN_BONUS_XP,
                          today_xp: (globalProgress?.today_xp ?? 0) + PERFECT_RUN_BONUS_XP,
                          today_perfect: (globalProgress?.today_perfect ?? 0) + 1,
                        },
                        { syncRemote: true },
                      );
                    }}
                    className="mt-4 w-full rounded-[1rem] bg-amber-500 py-3 text-sm font-extrabold text-white transition hover:bg-amber-600"
                  >
                    Use Token ({perfectRunTokenCount})
                  </button>
                </div>
              )}
              {chestReward && (
                <div className={`mb-6 rounded-[1.7rem] border p-4 ${getChestTheme(chestReward.currentRarity).cardClass}`}>
                  <div className="flex items-center gap-4">
                    <RewardChestArt
                      rarity={chestReward.currentRarity}
                      opened={chestReward.state === "opened"}
                      compact
                      className="w-[5.2rem] flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                        {chestReward.state === "opened" ? "Reward opened" : "Path reward unlocked"}
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-900">{chestReward.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        {chestReward.state === "opened"
                          ? `Locked in ${chestReward.gemAmount ?? 0} gems after ${chestReward.tapsUsed} taps.`
                          : "You found this unit chest on the path. Tap it to chase an upgrade before you open it."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChestReward(chestReward)}
                    className="mt-4 w-full rounded-[1.1rem] bg-slate-900 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
                  >
                    {chestReward.state === "opened" ? "View chest reward" : "Open reward chest"}
                  </button>
                </div>
              )}
              {/* FIXED: uses goBack with cache-bust so learn page re-fetches */}
              <button
                onClick={goBack}
                className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ── Quiz phase ───────────────────────────────────────────────────────────────
  const question = questions[current];
  const progress = ((current) / TOTAL_QUESTIONS) * 100;
  const answeredCount = feedback ? current + 1 : current;
  const taskProgress = (answeredCount / TOTAL_QUESTIONS) * 100;
  const secondsLeft = Math.max(0, LESSON_TIME_LIMIT - elapsedSeconds);
  const timerLow = secondsLeft <= 20;
  const bgClass =
    flashState === "correct"
      ? "bg-green-50"
      : flashState === "wrong"
      ? "bg-red-50"
      : "bg-gray-50";

  return (
      <>
        <XPFloat show={showXP} amount={xpAmount} />
        <GemFloat show={showGemBurst} amount={gemAmount} />
        <AchievementToast achievement={achievement} onDone={() => setAchievement(null)} />
        <RewardChestModal
          key={chestReward?.id ?? "lesson-quiz-reward-empty"}
          chest={chestReward}
          onClose={() => setChestReward(null)}
          onOpen={handleChestOpened}
          onProgress={handleChestProgress}
        />

      <main className={`min-h-screen ${bgClass} transition-colors duration-300 bg-[radial-gradient(circle_at_top,_rgba(240,249,255,0.9),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)]`}>
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-10">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[1.8rem] border border-white/80 bg-white/90 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <button onClick={goBack} className="text-gray-400 hover:text-gray-600 font-extrabold text-xl w-8 h-8 flex items-center justify-center">
                  ✕
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Lesson progress</p>
                    <span className="text-sm font-extrabold text-slate-500">{answeredCount}/{TOTAL_QUESTIONS}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#38bdf8)] transition-all duration-500"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">xp</p>
                  <p className="mt-2 text-xl font-extrabold text-emerald-600">{xp}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">streak</p>
                  <p className="mt-2 text-xl font-extrabold text-orange-500">{streak}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">gems</p>
                  <p className="mt-2 text-xl font-extrabold text-cyan-600">{infiniteGemsEnabled ? "∞" : gems}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${timerLow ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`text-[10px] font-extrabold uppercase tracking-[0.22em] ${timerLow ? "text-red-400" : "text-slate-400"}`}>timer</p>
                  <p className={`mt-2 text-xl font-extrabold ${timerLow ? "text-red-600 animate-pulse" : "text-slate-900"}`}>
                    {lessonMounted ? `${secondsLeft}s` : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[1.8rem] border border-white/80 bg-white/90 px-5 py-4 shadow-sm lg:w-[240px]">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">lives</p>
                <div className="mt-2 flex gap-1.5">
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={`text-xl transition ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
                  ))}
                </div>
              </div>
              {claimedChests.length > 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-600">chests</p>
                  <p className="mt-1 text-lg font-extrabold text-amber-700">{claimedChests.length}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div key={`${current}-${shakeKey}`}>
              <div className="relative rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-sm">
                <div className={`pointer-events-none absolute inset-0 rounded-[2rem] transition ${
                  flashState === "correct"
                    ? "bg-emerald-100/55 ring-2 ring-emerald-200"
                    : flashState === "wrong"
                      ? "bg-red-100/45 ring-2 ring-red-200"
                      : "bg-transparent"
                }`} />

                <div className="relative flex items-end gap-4">
                  <Pico
                    size={98}
                    mood={feedback ? (feedback.correct ? "celebrate" : "sad") : streak >= 3 ? "celebrate" : "happy"}
                  />
                  <div className="flex-1 rounded-[1.7rem] rounded-bl-sm border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Current task</p>
                    <p className="mt-2 text-2xl font-extrabold leading-9 text-slate-900">{question?.instruction}</p>
                  </div>
                </div>

                <div className="relative mt-6 rounded-[1.7rem] border-2 border-slate-100 bg-slate-950 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {question?.type === "arrange" && (
                    <>
                      <div className="mb-4">{renderArrangeCode(question)}</div>
                      <div className="flex flex-wrap gap-2 min-h-[48px]">
                        {availableArrangeTiles.map((tile, i) => (
                          <button
                            key={`${tile}-${i}`}
                            onClick={() => {
                              if (feedback) return;
                              const nextEmpty = arrangedTiles.findIndex((t) => !t);
                              if (nextEmpty === -1) return;
                              const newTiles = [...arrangedTiles];
                              newTiles[nextEmpty] = tile;
                              setArrangedTiles(newTiles);
                              setAvailableArrangeTiles((prev) => {
                                const copy = [...prev];
                                copy.splice(i, 1);
                                return copy;
                              });
                            }}
                            disabled={!!feedback}
                            className="px-4 py-2 bg-white border-2 border-b-4 border-slate-200 rounded-xl font-mono font-bold text-slate-800 hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            {tile}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {question?.type === "fill" && (
                    <>
                      {question.codeLines && (
                        <div className="mb-4 space-y-1.5">
                          {question.codeLines.map((line: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-slate-500 font-mono text-sm">{i + 1}</span>
                              <span className="text-emerald-300 font-mono text-sm">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(question.tiles || []).map((tile: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => !feedback && setSelectedFill(tile)}
                            disabled={!!feedback}
                            className={`px-4 py-2 border-2 border-b-4 rounded-xl font-mono font-bold transition ${
                              selectedFill === tile
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {tile}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {(question?.type === "multiple_choice" || question?.type === "output") && (
                    <>
                      {question.codeLines && (
                        <div className="mb-4 space-y-1.5">
                          {question.codeLines.map((line: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-slate-500 font-mono text-sm">{i + 1}</span>
                              <span className="text-emerald-300 font-mono text-sm">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-3">
                        {(question.options || []).map((option: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => !feedback && setSelectedOption(option)}
                            disabled={!!feedback}
                            className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-b-4 font-bold transition ${
                              selectedOption === option
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {feedback && (
                  <div className={`mt-5 rounded-[1.7rem] p-6 border-2 shadow-sm transition ${
                    feedback.correct
                      ? "bg-emerald-50 border-emerald-200 ring-4 ring-emerald-100"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-extrabold text-xl mb-1 ${feedback.correct ? "text-emerald-600" : "text-red-600"}`}>
                          {feedback.correct ? `Correct!${streak >= 3 ? " Streak bonus!" : ""}` : "Not quite"}
                        </p>
                        <p className={`font-semibold leading-7 ${feedback.correct ? "text-emerald-700" : "text-red-700"}`}>
                          {feedback.explanation}
                        </p>
                      </div>
                      {feedback.correct ? (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    {!feedback.correct && (
                      <div className="text-red-600 font-bold mt-4 text-sm">
                        <p>Correct answer:</p>
                        <pre className="mt-2 font-mono bg-red-100 px-3 py-3 rounded-xl whitespace-pre-wrap">{getCorrectAnswerText(question)}</pre>
                      </div>
                    )}
                    {feedback.correct && question?.consoleOutput && (
                      <div className="mt-4">
                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Mini run preview</p>
                        <div className="bg-slate-950 rounded-2xl p-4">
                          <p className="text-emerald-300 font-mono text-sm">{question.consoleOutput}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={feedback ? next : checkAnswer}
                  disabled={
                    checking ||
                    (!feedback && question?.type === "arrange" && arrangedTiles.every((t) => !t)) ||
                    (!feedback && question?.type === "fill" && !selectedFill) ||
                    (!feedback && (question?.type === "multiple_choice" || question?.type === "output") && !selectedOption)
                  }
                  className="mt-5 w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-600 transition shadow-md disabled:opacity-40 text-lg"
                >
                  {checking ? "Checking..." : feedback ? "Continue →" : "Check answer"}
                </button>
              </div>

              {lives === 0 && !feedback && (
                <div className="bg-white rounded-3xl shadow p-8 text-center mt-5">
                  <p className="text-4xl mb-3">{"💀"}</p>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Out of lives!</h2>
                  <p className="text-gray-500 font-semibold mb-6">Take a break and come back stronger.</p>
                  <button
                    onClick={() => {
                      setLives(3);
                      setStreak(0);
                      setCurrent(0);
                      setFeedback(null);
                      setSelectedOption(null);
                      setSelectedFill(null);
                      setArrangedTiles([]);
                      setAvailableArrangeTiles([]);
                      setStartTime(Date.now());
                      setElapsedSeconds(0);
                    }}
                    className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-extrabold"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <p className="text-center text-gray-300 text-xs font-semibold mt-3 mb-2">
                Press Enter to continue
              </p>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/80 bg-white/95 p-5 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Coach</p>
                <div className="mt-4 flex items-start gap-3">
                  <Pico size={72} mood={feedback ? (feedback.correct ? "celebrate" : "sad") : "happy"} />
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold text-slate-900">
                      {feedback
                        ? feedback.correct
                          ? "Nice. Lock it in."
                          : "Reset and read the shape."
                        : question?.type === "arrange"
                          ? "Place each piece into the blanks."
                          : question?.type === "fill"
                            ? "Pick the missing token."
                            : "Choose the best answer."}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {question?.type === "arrange"
                        ? "Start with the earliest blank. The order usually reveals itself."
                        : question?.type === "fill"
                          ? "Scan the code line first, then match the missing word."
                          : "Read the code, predict the result, then commit."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/80 bg-white/95 p-5 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Momentum</p>
                <div className="mt-4 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-slate-900">Question {current + 1}</p>
                    <span className="text-sm font-extrabold text-slate-400">{TOTAL_QUESTIONS - answeredCount} left</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#f59e0b)] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-extrabold text-slate-900">Reward track</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Finish units to earn chests, then tap through the lock for a shot at a higher rarity.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {rewardChests.slice(0, 4).map((rewardChest) => {
                      const theme = getChestTheme(rewardChest.currentRarity);

                      return (
                        <button
                          key={rewardChest.id}
                          type="button"
                          onClick={() => setChestReward(rewardChest)}
                          className={`rounded-[1.2rem] border p-3 text-left transition hover:-translate-y-0.5 ${theme.cardClass}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                              {rewardChest.state === "opened" ? "opened" : "ready"}
                            </p>
                            <span className={`rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] ${theme.chipClass}`}>
                              {theme.label}
                            </span>
                          </div>
                          <RewardChestArt
                            rarity={rewardChest.currentRarity}
                            opened={rewardChest.state === "opened"}
                            compact
                            className="mx-auto mt-2 w-full max-w-[4.2rem]"
                          />
                          <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                            {rewardChest.state === "opened"
                              ? `${rewardChest.gemAmount ?? 0} gems`
                              : rewardChest.sourceLabel}
                          </p>
                        </button>
                      );
                    })}

                    {Array.from({ length: Math.max(0, 4 - rewardChests.slice(0, 4).length) }).map((_, index) => (
                      <div
                        key={`lesson-reward-slot-${index}`}
                        className="rounded-[1.2rem] border border-dashed border-slate-200 bg-white px-3 py-3 text-center"
                      >
                        <RewardChestArt rarity="common" compact className="mx-auto w-full max-w-[4rem] opacity-30 saturate-0" />
                        <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-300">upcoming</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
