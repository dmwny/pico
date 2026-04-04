"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import AmbientEffectsLayer from "@/components/theme/AmbientEffectsLayer";
import MythicThemeLayer from "@/components/theme/MythicThemeLayer";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getCourseSections, getLessonTopic, LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { resolveActiveLanguage, setStoredLanguageProgress, mergeProgressSources, getStoredLanguageProgress } from "@/lib/progress";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
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
import { mixHex, withAlpha } from "@/lib/themes";
import { applyQualifiedActivity, getLocalTimezone } from "@/lib/streaks";

const TOTAL_QUESTIONS = 4;
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

function highlightCodeLine(line: string) {
  const tokenPattern = /(#[^\n]*$|\/\/[^\n]*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|const|let|var|def|class|return|if|else|for|while|print|await|async|new|function|true|false|null)\b|\b\d+\b)/g;
  const matches = [...line.matchAll(tokenPattern)];
  if (matches.length === 0) return [{ value: line, className: "text-slate-200" }];

  const segments: Array<{ value: string; className: string }> = [];
  let cursor = 0;

  matches.forEach((match) => {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ value: line.slice(cursor, index), className: "text-slate-200" });
    }
    segments.push({
      value: token,
      className: token.startsWith("#") || token.startsWith("//")
        ? "text-slate-500"
        : token.startsWith("\"") || token.startsWith("'")
          ? "text-amber-300"
          : /^\d+$/.test(token)
            ? "text-fuchsia-300"
            : "text-sky-300",
    });
    cursor = index + token.length;
  });

  if (cursor < line.length) {
    segments.push({ value: line.slice(cursor), className: "text-slate-200" });
  }

  return segments;
}

function LessonCodeBlock({
  title,
  lines,
  footer,
}: {
  title: string;
  lines: string[];
  footer?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-slate-800/90 bg-[#07111f] shadow-[0_24px_60px_rgba(2,6,23,0.36)]">
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-slate-500">{title}</p>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
      </div>
      <div className="space-y-1.5 px-4 py-4 font-mono text-[0.95rem] leading-7">
        {lines.map((line, index) => (
          <div key={`${title}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3">
            <span className="select-none text-right text-[0.78rem] font-semibold text-slate-500">{index + 1}</span>
            <code className="whitespace-pre-wrap break-words">
              {highlightCodeLine(line).map((segment, segmentIndex) => (
                <span key={`${index}-${segmentIndex}`} className={segment.className}>{segment.value}</span>
              ))}
            </code>
          </div>
        ))}
      </div>
      {footer ? <div className="border-t border-white/6 px-4 py-3 text-xs font-semibold text-slate-400">{footer}</div> : null}
    </div>
  );
}

function QuestionPips({
  total,
  current,
  answered,
  accentColor,
  glowColor,
}: {
  total: number;
  current: number;
  answered: number;
  accentColor: string;
  glowColor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const complete = index < answered;
        const active = index === current;

        return (
          <span
            key={`lesson-pip-${index}`}
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: active ? 28 : 12,
              background: complete || active ? accentColor : "rgba(148,163,184,0.26)",
              boxShadow: complete || active ? `0 0 18px ${glowColor}` : "none",
              opacity: complete || active ? 1 : 0.72,
            }}
          />
        );
      })}
    </div>
  );
}

function LessonParticleBurst({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={`lesson-burst-${index}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 5 + (index % 3) * 2,
            height: 5 + (index % 3) * 2,
            background: color,
            boxShadow: `0 0 18px ${color}`,
            "--lesson-burst-x": `${Math.cos((index / 16) * Math.PI * 2) * (72 + (index % 4) * 10)}px`,
            "--lesson-burst-y": `${Math.sin((index / 16) * Math.PI * 2) * (56 + (index % 3) * 10)}px`,
            animation: `lessonBurst 620ms cubic-bezier(0.22,1,0.36,1) ${index * 12}ms forwards`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function RewardTrackStrip({
  chests,
  onSelect,
  accentColor,
  compact = false,
}: {
  chests: RewardChest[];
  onSelect: (chest: RewardChest) => void;
  accentColor: string;
  compact?: boolean;
}) {
  const visibleChests = chests.slice(0, 4);

  return (
    <div className={`flex gap-3 overflow-x-auto pb-1 ${compact ? "" : "pt-2"}`}>
      {visibleChests.map((rewardChest) => {
        const opened = rewardChest.state === "opened";

        return (
          <button
            key={rewardChest.id}
            type="button"
            onClick={() => onSelect(rewardChest)}
            className={`relative flex shrink-0 flex-col items-center rounded-[1.25rem] border px-3 py-3 text-center transition ${
              opened ? "opacity-55 saturate-75" : "hover:-translate-y-0.5"
            } ${opened ? "" : "animate-[lessonLockedPulse_3.2s_ease-in-out_infinite]"} ${compact ? "w-[5.6rem]" : "w-[6.2rem]"}`}
            style={{
              borderColor: opened ? "rgba(148,163,184,0.22)" : withAlpha(accentColor, 0.26),
              background: opened ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.88)",
            }}
          >
            <RewardChestArt
              rarity={rewardChest.currentRarity}
              opened={opened}
              compact
              className={`mx-auto ${compact ? "w-[3.6rem]" : "w-[4.1rem]"}`}
            />
            <p className="mt-2 text-[0.58rem] font-black uppercase tracking-[0.18em] text-slate-400">
              {opened ? "spent" : "ready"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LessonPage() {
  const { pathTheme, nodeEffect } = useThemeContext();
  const {
    isXpBoostActiveAt,
    spendPerfectRunToken,
    perfectRunTokenCount,
    recordOpenedChest,
    infiniteGemsEnabled,
    applyQualifiedStreakActivity,
    updateProgress,
    progress: globalProgress,
    streakFreezeCount,
    pendingDailyStreakCelebration,
    pendingStreakMilestone,
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
  const [visibleAchievement, setVisibleAchievement] = useState<string | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [holdAchievementToast, setHoldAchievementToast] = useState(false);
  const [alreadyEarnedAchievements, setAlreadyEarnedAchievements] = useState<string[]>([]);
  const [claimedChests, setClaimedChests] = useState<string[]>([]);
  const [rewardChests, setRewardChests] = useState<RewardChest[]>([]);
  const [chestReward, setChestReward] = useState<RewardChest | null>(null);
  const hasBlockingStreakOverlay = Boolean(pendingDailyStreakCelebration || pendingStreakMilestone);
  const sawBlockingStreakOverlayRef = useRef(false);

  useEffect(() => {
    if (!startTime || phase !== "quiz") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, startTime]);

  useEffect(() => {
    if (!hasBlockingStreakOverlay || !visibleAchievement) return;
    setAchievementQueue((currentQueue) => [visibleAchievement, ...currentQueue]);
    setVisibleAchievement(null);
  }, [hasBlockingStreakOverlay, visibleAchievement]);

  useEffect(() => {
    if (hasBlockingStreakOverlay) {
      sawBlockingStreakOverlayRef.current = true;
      return;
    }
    if (!holdAchievementToast || !sawBlockingStreakOverlayRef.current) return;
    sawBlockingStreakOverlayRef.current = false;
    setHoldAchievementToast(false);
  }, [hasBlockingStreakOverlay, holdAchievementToast]);

  useEffect(() => {
    if (hasBlockingStreakOverlay || holdAchievementToast || visibleAchievement || achievementQueue.length === 0) return;
    const [nextAchievement, ...remaining] = achievementQueue;
    setVisibleAchievement(nextAchievement);
    setAchievementQueue(remaining);
  }, [achievementQueue, hasBlockingStreakOverlay, holdAchievementToast, visibleAchievement]);

  const loadEarnedAchievements = useCallback(async () => {
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
  }, []);

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

  const loadLesson = useCallback(async () => {
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
  }, [lessonId, requestedLanguage, unitId]);

  // Load lesson + existing achievements
  useEffect(() => {
    void loadLesson();
    void loadEarnedAchievements();
  }, [loadEarnedAchievements, loadLesson]);

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
    setAchievementQueue((currentQueue) => [...currentQueue, name]);
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

  const saveProgress = useCallback(async () => {
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
    const mergedExisting = mergeProgressSources(lessonLanguage, existing, localProgress);
    const completed = mergedExisting.completed_lessons.includes(lessonKey)
      ? mergedExisting.completed_lessons
      : [...mergedExisting.completed_lessons, lessonKey];
    const rewardChest = getUnlockedUnitRewardChest(
      lessonLanguage,
      Number(unitId),
      completed,
      localClaimedChests,
      localRewardChests,
    );
    const nextRewardChests = rewardChest ? upsertRewardChest(localRewardChests, rewardChest) : localRewardChests;
    const totalPerfect = mergedExisting.today_perfect + (perfect ? 1 : 0);
    const baseProgressBeforeAchievements = {
      ...mergedExisting,
      completed_lessons: completed,
      xp: mergedExisting.xp + xp,
      gems: currentGems,
      claimed_chests: localClaimedChests,
      today_xp: mergedExisting.today_xp + xp,
      today_lessons: mergedExisting.today_lessons + 1,
      today_perfect: totalPerfect,
    };
    const streakPreview = applyQualifiedActivity(
      baseProgressBeforeAchievements,
      streakFreezeCount,
      new Date(),
      baseProgressBeforeAchievements.streak_timezone ?? getLocalTimezone(),
    );
    const shouldEarn = checkAchievements(
      completed,
      baseProgressBeforeAchievements.xp,
      streakPreview.nextProgress.streak ?? baseProgressBeforeAchievements.streak,
      perfect,
      timeTaken,
      streak,
      totalPerfect,
    );
    const alreadyEarned = mergedExisting.achievements;
    const newlyEarned = shouldEarn.filter((id: string) => !alreadyEarned.includes(id));
    const allEarned = [...alreadyEarned, ...newlyEarned];
    const baseProgress = {
      ...baseProgressBeforeAchievements,
      achievements: allEarned,
    };

    const streakResult = await applyQualifiedStreakActivity({
      language: lessonLanguage,
      baseProgress,
    });
    const nextProgress = streakResult?.progress ?? baseProgress;
    const streakOverlayQueued = Boolean(streakResult?.milestoneReward || nextProgress.streak_pending_daily_celebration);

    if (streakOverlayQueued) {
      setHoldAchievementToast(true);
    }

    setStoredRewardChests(user.id, lessonLanguage, nextRewardChests);
    setRewardChests(nextRewardChests);
    setGems(nextProgress.gems);

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
  }, [
    alreadyEarnedAchievements,
    applyQualifiedStreakActivity,
    correctCount,
    currentLanguage,
    elapsedSeconds,
    gems,
    lessonId,
    requestedLanguage,
    startTime,
    streakFreezeCount,
    streak,
    unitId,
    xp,
  ]);

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
  }, [alreadyEarnedAchievements, correctCount, current, feedback, saveProgress]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && feedback) {
        void next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedback, next]);

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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
        <div className="relative z-10 text-center">
          <Pico size={100} mood="happy" className="mx-auto mb-2" />
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: pathTheme.accentColor, borderTopColor: "transparent" }} />
          <p className="font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.7) }}>Preparing your lesson...</p>
        </div>
      </main>
    );
  }

  // ── Teaching phase ───────────────────────────────────────────────────────────
  if (phase === "teaching" && teaching) {
    return (
      <main className="relative min-h-screen overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.92 }} />
        {pathTheme.id === "celestial" || pathTheme.id === "the_void" ? (
          <MythicThemeLayer themeId={pathTheme.id} className="opacity-70" />
        ) : (
          <AmbientEffectsLayer effects={pathTheme.ambientEffects} enabled className="opacity-50" />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
          <button onClick={goBack} className="font-bold mb-8 block" style={{ color: withAlpha(pathTheme.surfaceText, 0.66) }}>
            Back
          </button>

          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-[2rem] border p-6 shadow-sm backdrop-blur" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceDark }}>
              <div className="flex items-end gap-4">
                <Pico size={96} mood="happy" />
                <div className="rounded-[1.7rem] rounded-bl-sm px-5 py-4 text-white shadow-sm" style={{ background: pathTheme.accentColor }}>
                  <p className="text-xs font-extrabold uppercase tracking-wider mb-1">
                    Coach
                  </p>
                  <p className="text-sm font-bold leading-6">
                    Read the pattern first. Then the quiz narrows to one clear action at a time.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border bg-white/92 p-8 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.2) }}>
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: pathTheme.accentColor }}>
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
                <div className="mt-6 rounded-2xl border-2 p-4" style={{ background: withAlpha(pathTheme.accentColor, 0.08), borderColor: withAlpha(pathTheme.accentColor, 0.18) }}>
                  <p className="font-bold text-sm" style={{ color: mixHex(pathTheme.accentColor, "#0f172a", 0.26) }}>Tip: {teaching.tip}</p>
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
                className="mt-8 w-full text-white font-extrabold py-4 rounded-2xl transition shadow-md text-lg"
                style={{ background: pathTheme.accentColor }}
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
        <AchievementToast achievement={visibleAchievement} onDone={() => setVisibleAchievement(null)} />
        <RewardChestModal
          key={chestReward?.id ?? "lesson-done-reward-empty"}
          chest={chestReward}
          onClose={() => setChestReward(null)}
          onOpen={handleChestOpened}
          onProgress={handleChestProgress}
        />
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4" style={{ background: pathTheme.surfaceBackground }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.92 }} />
          <div className="relative z-10 max-w-md w-full text-center">
            <Pico size={150} mood={perfect ? "celebrate" : "happy"} className="mx-auto" />
            <div className="rounded-3xl border shadow-sm py-10 px-12 -mt-6" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceCard }}>
              <h2 className="text-3xl font-extrabold mb-2" style={{ color: pathTheme.surfaceText }}>
                {perfect ? "Perfect!" : "Lesson Complete!"}
              </h2>
              <p className="font-semibold mb-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.66) }}>
                {correctCount} of {TOTAL_QUESTIONS} correct · {timeTaken}s · +{xp} XP
              </p>
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border px-4 py-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: withAlpha("#ffffff", 0.42) }}>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>streak</p>
                  <p className="mt-2 text-2xl font-extrabold text-orange-500">{streak}</p>
                </div>
                <div className="rounded-2xl border px-4 py-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: withAlpha("#ffffff", 0.42) }}>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>gems</p>
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
                    className="mt-4 w-full rounded-[1rem] py-3 text-sm font-extrabold text-white transition"
                    style={{ background: mixHex(pathTheme.accentColor, "#f59e0b", 0.46) }}
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
                className="w-full text-white font-extrabold py-4 rounded-2xl transition shadow-md text-lg"
                style={{ background: pathTheme.accentColor }}
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
  const answeredCount = feedback ? current + 1 : current;
  const taskProgress = (answeredCount / TOTAL_QUESTIONS) * 100;
  const coachTitle = feedback
    ? feedback.correct
      ? "Locked in."
      : "One more pass."
    : question?.type === "arrange"
      ? "Assemble the pattern."
      : question?.type === "fill"
        ? "Fill the exact gap."
        : "Read, predict, commit.";
  const coachTip = feedback
    ? feedback.correct
      ? "Keep the mental model. The next prompt will build on the same pattern."
      : "Slow the read-down. The blank or output usually reveals itself from the surrounding syntax."
    : question?.type === "arrange"
      ? "Start with the earliest blank and let each placement constrain the next one."
      : question?.type === "fill"
        ? "Scan the line around the blank before you touch the options."
        : "Read the code once for shape, then once for exact behavior.";
  const canSubmit =
    !!feedback
    || (question?.type === "arrange" && arrangedTiles.some((tile) => tile))
    || (question?.type === "fill" && !!selectedFill)
    || ((question?.type === "multiple_choice" || question?.type === "output") && !!selectedOption);

  return (
    <>
      <XPFloat show={showXP} amount={xpAmount} />
      <GemFloat show={showGemBurst} amount={gemAmount} />
      <AchievementToast achievement={visibleAchievement} onDone={() => setVisibleAchievement(null)} />
      <RewardChestModal
        key={chestReward?.id ?? "lesson-quiz-reward-empty"}
        chest={chestReward}
        onClose={() => setChestReward(null)}
        onOpen={handleChestOpened}
        onProgress={handleChestProgress}
      />

      <main className="relative min-h-screen overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <style>{`
          @keyframes lessonBurst {
            0% { transform: translate3d(0, 0, 0) scale(0.4); opacity: 0; }
            18% { opacity: 1; }
            100% { transform: translate3d(var(--lesson-burst-x), var(--lesson-burst-y), 0) scale(1.12); opacity: 0; }
          }
          @keyframes lessonWrongShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-7px); }
            80% { transform: translateX(7px); }
          }
          @keyframes lessonLockedPulse {
            0%, 100% { transform: translateY(0); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
            50% { transform: translateY(-3px); box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          }
        `}</style>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.92 }} />
        {pathTheme.id === "celestial" || pathTheme.id === "the_void" ? (
          <MythicThemeLayer themeId={pathTheme.id} className="opacity-70" />
        ) : (
          <AmbientEffectsLayer effects={pathTheme.ambientEffects} enabled className="opacity-45" />
        )}

        <div className="relative z-10 flex min-h-screen flex-col">
          <header
            className="sticky top-0 z-20 border-b backdrop-blur-xl"
            style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceDark }}
          >
            <div className="h-1.5 w-full overflow-hidden" style={{ background: withAlpha("#ffffff", 0.08) }}>
              <div className="h-full transition-all duration-500" style={{ width: `${taskProgress}%`, background: pathTheme.accentColor }} />
            </div>
            <div className="mx-auto w-full max-w-7xl px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-black transition hover:bg-white/8"
                  style={{ color: pathTheme.surfaceText }}
                >
                  ×
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={`lesson-heart-${index}`} className={`text-xl transition ${index < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "XP", value: xp.toString(), tone: "#34d399" },
                  { label: "Streak", value: streak.toString(), tone: "#fb923c" },
                  { label: "Gems", value: infiniteGemsEnabled ? "∞" : gems.toString(), tone: pathTheme.accentColor },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[1rem] border px-3 py-2.5" style={{ borderColor: withAlpha("#ffffff", 0.1), background: withAlpha("#ffffff", 0.05) }}>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.58) }}>{stat.label}</p>
                    <p className="mt-1 text-base font-black" style={{ color: stat.tone }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6">
            <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section key={`${current}-${shakeKey}`} className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <QuestionPips
                    total={TOTAL_QUESTIONS}
                    current={current}
                    answered={answeredCount}
                    accentColor={pathTheme.accentColor}
                    glowColor={nodeEffect.particleColor}
                  />
                  <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.56) }}>
                    {answeredCount}/{TOTAL_QUESTIONS}
                  </p>
                </div>

                <article
                  className={`relative overflow-hidden rounded-[2.3rem] border p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-7 ${flashState === "wrong" ? "animate-[lessonWrongShake_420ms_ease-in-out]" : ""}`}
                  style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: "rgba(255,255,255,0.94)" }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 transition"
                    style={{
                      background: flashState === "correct"
                        ? `radial-gradient(circle at top, ${withAlpha(pathTheme.accentColor, 0.18)} 0%, transparent 42%)`
                        : flashState === "wrong"
                          ? "radial-gradient(circle at top, rgba(248,113,113,0.18) 0%, transparent 42%)"
                          : "transparent",
                    }}
                  />
                  <LessonParticleBurst active={flashState === "correct"} color={nodeEffect.particleColor} />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.3em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.48) }}>
                        Exercise
                      </p>
                      <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-[2.2rem]">
                        {question?.instruction}
                      </h1>
                    </div>
                    <div className="hidden rounded-full border bg-white/70 p-2 shadow-sm sm:block" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18) }}>
                      <Pico
                        size={72}
                        mood={feedback ? (feedback.correct ? "celebrate" : "sad") : streak >= 3 ? "celebrate" : "happy"}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] border px-4 py-3 lg:hidden" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: withAlpha(pathTheme.accentColor, 0.08) }}>
                    <div className="flex items-center gap-3">
                      <Pico size={44} mood={feedback ? (feedback.correct ? "celebrate" : "sad") : "happy"} />
                      <p className="text-sm font-semibold leading-6 text-slate-700">{coachTip}</p>
                    </div>
                  </div>

                  <div className="relative mt-6 space-y-5">
                    {question?.type === "arrange" ? (
                      <>
                        <div className="overflow-hidden rounded-[1.7rem] border border-slate-800/90 bg-[#07111f] shadow-[0_24px_60px_rgba(2,6,23,0.36)]">
                          <div className="border-b border-white/6 px-4 py-3">
                            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-slate-500">Arrange The Code</p>
                          </div>
                          <div className="px-4 py-4">{renderArrangeCode(question)}</div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {availableArrangeTiles.map((tile, index) => (
                            <button
                              key={`${tile}-${index}`}
                              type="button"
                              onClick={() => {
                                if (feedback) return;
                                const nextEmpty = arrangedTiles.findIndex((entry) => !entry);
                                if (nextEmpty === -1) return;
                                const nextTiles = [...arrangedTiles];
                                nextTiles[nextEmpty] = tile;
                                setArrangedTiles(nextTiles);
                                setAvailableArrangeTiles((previous) => {
                                  const copy = [...previous];
                                  copy.splice(index, 1);
                                  return copy;
                                });
                              }}
                              disabled={!!feedback}
                              className="rounded-[1.2rem] border-2 border-b-4 bg-white px-4 py-4 text-left font-mono text-base font-bold text-slate-800 transition hover:-translate-y-0.5 disabled:opacity-50"
                              style={{ borderColor: "#dbe4ee" }}
                            >
                              {tile}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {question?.type === "fill" && question.codeLines ? (
                      <>
                        <LessonCodeBlock title="Complete The Snippet" lines={question.codeLines} />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {(question.tiles || []).map((tile, index) => (
                            <button
                              key={`${tile}-${index}`}
                              type="button"
                              onClick={() => !feedback && setSelectedFill(tile)}
                              disabled={!!feedback}
                              className={`rounded-[1.2rem] border-2 border-b-4 px-4 py-4 text-left font-mono text-base font-bold transition ${
                                selectedFill === tile ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-800"
                              }`}
                              style={{ borderColor: selectedFill === tile ? "#34d399" : "#dbe4ee" }}
                            >
                              {tile}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {(question?.type === "multiple_choice" || question?.type === "output") ? (
                      <>
                        {question.codeLines?.length ? (
                          <LessonCodeBlock
                            title={question.type === "output" ? "Read The Output Path" : "Read The Snippet"}
                            lines={question.codeLines}
                            footer={question.type === "output" ? "Predict the exact result before you choose." : null}
                          />
                        ) : null}
                        <div className="space-y-3">
                          {(question.options || []).map((option, index) => (
                            <button
                              key={`${option}-${index}`}
                              type="button"
                              onClick={() => !feedback && setSelectedOption(option)}
                              disabled={!!feedback}
                              className={`w-full rounded-[1.35rem] border-2 border-b-4 px-5 py-4 text-left text-lg font-bold transition ${
                                selectedOption === option ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-800"
                              }`}
                              style={{ borderColor: selectedOption === option ? "#34d399" : "#dbe4ee" }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>

                  {feedback ? (
                    <div
                      className="mt-5 rounded-[1.7rem] border-2 p-5 shadow-sm"
                      style={{
                        borderColor: feedback.correct ? withAlpha(pathTheme.accentColor, 0.26) : "rgba(248,113,113,0.32)",
                        background: feedback.correct ? withAlpha(pathTheme.accentColor, 0.08) : "rgba(254,242,242,0.92)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-xl font-black ${feedback.correct ? "text-emerald-600" : "text-red-600"}`}>
                            {feedback.correct ? `Correct!${streak >= 3 ? " Streak bonus." : ""}` : "Not quite."}
                          </p>
                          <p className={`mt-2 font-semibold leading-7 ${feedback.correct ? "text-emerald-700" : "text-red-700"}`}>
                            {feedback.explanation}
                          </p>
                        </div>
                        {feedback.correct ? (
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                            style={{ background: pathTheme.accentColor }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : null}
                      </div>

                      {!feedback.correct ? (
                        <div className="mt-4 rounded-[1.2rem] bg-red-100/80 px-4 py-4">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Correct Answer</p>
                          <pre className="mt-2 whitespace-pre-wrap font-mono text-sm font-bold text-red-700">{getCorrectAnswerText(question)}</pre>
                        </div>
                      ) : null}

                      {feedback.correct && question?.consoleOutput ? (
                        <div className="mt-4">
                          <LessonCodeBlock title="Mini Run Preview" lines={question.consoleOutput.split("\n")} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 lg:hidden">
                    <div className="rounded-[1.5rem] border px-4 py-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: "rgba(255,255,255,0.86)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.48) }}>Reward Track</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">Stay on the path and tap chests as they unlock.</p>
                        </div>
                      </div>
                      <RewardTrackStrip chests={rewardChests} onSelect={setChestReward} accentColor={pathTheme.accentColor} compact />
                    </div>
                  </div>

                  <button
                    onClick={feedback ? next : checkAnswer}
                    disabled={checking || !canSubmit}
                    className="mt-5 w-full rounded-[1.4rem] py-4 text-lg font-extrabold text-white transition disabled:opacity-40"
                    style={{ background: pathTheme.accentColor, boxShadow: `0 18px 36px ${withAlpha(pathTheme.accentColor, 0.26)}` }}
                  >
                    {checking ? "Checking..." : feedback ? "Continue" : "Check Answer"}
                  </button>
                </article>

                {lives === 0 && !feedback ? (
                  <div className="mt-5 rounded-[2rem] border bg-white/92 p-8 text-center shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18) }}>
                    <p className="mb-3 text-4xl">💀</p>
                    <h2 className="text-2xl font-extrabold text-gray-900">Out of lives.</h2>
                    <p className="mt-2 font-semibold text-gray-500">Reset and take another clean pass through the lesson.</p>
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
                      className="mt-6 rounded-[1rem] px-6 py-3 font-extrabold text-white"
                      style={{ background: pathTheme.accentColor }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : null}

                <p className="mt-3 text-center text-xs font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>
                  Press Enter to continue
                </p>
              </section>

              <aside className="hidden lg:flex lg:flex-col lg:gap-4">
                <div
                  className="rounded-[2rem] border p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
                  style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceDark }}
                >
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>Coach Tip</p>
                  <div className="mt-4 flex items-start gap-3">
                    <Pico size={72} mood={feedback ? (feedback.correct ? "celebrate" : "sad") : "happy"} />
                    <div className="min-w-0">
                      <p className="text-lg font-black" style={{ color: pathTheme.surfaceText }}>{coachTitle}</p>
                      <p className="mt-2 text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>{coachTip}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border bg-white/92 p-5 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18) }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>Reward Track</p>
                      <h2 className="mt-2 text-xl font-black text-slate-950">Path Momentum</h2>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), color: pathTheme.accentColor }}>
                      {rewardChests.length} tracked
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Locked chests pulse until they are spent. Opened chests stay muted so your next reward stands out immediately.
                  </p>
                  <RewardTrackStrip chests={rewardChests} onSelect={setChestReward} accentColor={pathTheme.accentColor} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
