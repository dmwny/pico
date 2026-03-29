"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getLessonTopic, LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { resolveActiveLanguage, setStoredLanguageProgress, mergeProgressSources, getStoredLanguageProgress } from "@/lib/progress";

const TOTAL_QUESTIONS = 4;

function countBlankMarkers(codeLines: string[] = []) {
  return codeLines.reduce((count, line) => count + (line.match(/_{2,}/g) || []).length, 0);
}

function getArrangeBlankCount(question: any) {
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

// ── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  const colors = ["#58CC02", "#FFC800", "#FF4B4B", "#1CB0F6", "#CE82FF"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.5 + Math.random() * 1;
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
              transform: `rotate(${Math.random() * 360}deg)`,
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

// ── Achievement Toast ─────────────────────────────────────────────────────────
function AchievementToast({ achievement, onDone }: { achievement: string | null; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!achievement) { setVisible(false); return; }
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [achievement, onDone]);

  if (!achievement) return null;
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 transition-all duration-400 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)` }}
    >
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
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = params.unit as string;
  const lessonId = params.lesson as string;
  const requestedLanguageParam = searchParams.get("lang");
  const requestedLanguage = requestedLanguageParam ? normalizeLanguage(requestedLanguageParam) : null;
  const [currentLanguage, setCurrentLanguage] = useState<LearningLanguage | null>(null);

  // State
  const [phase, setPhase] = useState<"teaching" | "quiz" | "done">("teaching");
  const [teaching, setTeaching] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // Answer state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedFill, setSelectedFill] = useState<string | null>(null);
  const [arrangedTiles, setArrangedTiles] = useState<string[]>([]);
  const [availableArrangeTiles, setAvailableArrangeTiles] = useState<string[]>([]);

  // Game state
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());

  // UI state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(10);
  const [flashState, setFlashState] = useState<"none" | "correct" | "wrong">("none");
  const [shakeKey, setShakeKey] = useState(0);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [alreadyEarnedAchievements, setAlreadyEarnedAchievements] = useState<string[]>([]);

  // Load lesson + existing achievements
  useEffect(() => {
    loadLesson();
    loadEarnedAchievements();
  }, []);

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
      const shuffled = [...(q.tiles || [])].sort(() => Math.random() - 0.5);
      setAvailableArrangeTiles(shuffled);
      const blanks = getArrangeBlankCount(q);
      setArrangedTiles(new Array(blanks).fill(""));
    } else if (q.type === "fill" || q.type === "multiple_choice" || q.type === "output") {
      if (q.tiles) q.tiles = [...q.tiles].sort(() => Math.random() - 0.5);
      if (q.options) q.options = [...q.options].sort(() => Math.random() - 0.5);
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
    } catch {
      setQuestions([]);
    }
    setLoading(false);
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
      setXp((p) => p + earned);
      setXpAmount(earned);
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

  const getCorrectAnswerText = (q: any) => {
    if (!q) return "";

    if (q.type === "arrange" && Array.isArray(q.answer) && Array.isArray(q.codeLines)) {
      let index = 0;
      const maxBlanks = getArrangeBlankCount(q);
      return q.codeLines
        .map((line: string) =>
          line.replace(/_{2,}/g, () => {
            if (index >= maxBlanks) return "___";
            const replacement = q.answer[index++];
            return replacement !== undefined ? replacement : "___";
          })
        )
        .join("\n");
    }

    if (q.type === "fill" && q.codeLines && Array.isArray(q.codeLines)) {
      const answerText = Array.isArray(q.answer) ? q.answer.join(" ") : q.answer;
      return q.codeLines.map((line: string) => line.replace("___", answerText)).join("\n");
    }

    if (Array.isArray(q.answer)) {
      return q.answer.join(" ");
    }

    return String(q.answer);
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

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const perfect = correctCount === TOTAL_QUESTIONS;
    const localProgress = getStoredLanguageProgress(user.id, lessonLanguage);

    if (existing) {
      const completed: string[] = JSON.parse(existing.completed_lessons || "[]");
      const alreadyDone = completed.includes(lessonKey);
      if (!alreadyDone) completed.push(lessonKey);

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
      const today = new Date().toISOString().split("T")[0];
      const lastPlayed = existing.last_played || "";
      const isNewDay = lastPlayed !== today;
      const isConsecutive = (() => {
        if (!lastPlayed) return false;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return lastPlayed === yesterday.toISOString().split("T")[0];
      })();

      const newStreak = isNewDay
        ? isConsecutive ? (existing.streak || 0) + 1 : 1
        : existing.streak || 0;

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
      setStoredLanguageProgress(user.id, lessonLanguage, merged);

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
          const achievementData = ACHIEVEMENTS.find((a: any) => a.id === toShow[0]);
          if (achievementData) triggerAchievement(achievementData.title);
        }
      }
    } else {
      const today = new Date().toISOString().split("T")[0];
      const shouldEarn = checkAchievements([lessonKey], xp, 0, perfect, timeTaken, streak, perfect ? 1 : 0);

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
      setStoredLanguageProgress(user.id, lessonLanguage, merged);

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
        const achievementData = ACHIEVEMENTS.find((a: any) => a.id === shouldEarn[0]);
        if (achievementData) triggerAchievement(achievementData.title);
      }
    }
  };

  // ── Render: arrange code lines ──────────────────────────────────────────────
  const renderArrangeCode = (q: any) => {
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
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={goBack} className="text-gray-400 hover:text-gray-600 font-bold mb-8 block">
            Back
          </button>

          <div className="flex items-end gap-4 mb-6">
            <Pico size={100} mood="happy" />
            <div className="bg-green-500 rounded-3xl rounded-bl-none p-6 shadow-md flex-1">
              <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">
                Unit {unitId} · Lesson {lessonId}
              </p>
              <h1 className="text-2xl font-extrabold text-white">{teaching.title}</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8 mb-4 space-y-4">
            <p className="text-gray-700 font-semibold text-lg leading-relaxed">{teaching.explanation}</p>

            {teaching.example && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Example</p>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl font-mono text-sm overflow-x-auto">
                  {teaching.example}
                </pre>
              </div>
            )}

            {teaching.tip && (
              <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4">
                <p className="text-green-700 font-bold text-sm">Tip: {teaching.tip}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setPhase("quiz")}
            className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg"
          >
            Start Lesson
          </button>
        </div>
      </main>
    );
  }

  // ── Done phase ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const perfect = correctCount === TOTAL_QUESTIONS;
    return (
      <>
        <Confetti active={showConfetti} />
        <AchievementToast achievement={achievement} onDone={() => setAchievement(null)} />
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
              {perfect && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                  <p className="text-yellow-700 font-extrabold">No mistakes! Amazing work.</p>
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
  const bgClass =
    flashState === "correct"
      ? "bg-green-50"
      : flashState === "wrong"
      ? "bg-red-50"
      : "bg-gray-50";

  return (
    <>
      <XPFloat show={showXP} amount={xpAmount} />
      <AchievementToast achievement={achievement} onDone={() => setAchievement(null)} />

      <main className={`min-h-screen ${bgClass} transition-colors duration-300 flex flex-col`}>
        {/* Top bar */}
        <div className="max-w-2xl mx-auto w-full px-4 pt-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 font-extrabold text-xl w-8 h-8 flex items-center justify-center">
              ✕
            </button>
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-4 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-gray-500 font-bold text-sm">{current + 1}/{TOTAL_QUESTIONS}</span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 text-sm font-extrabold">
              <span className="text-green-500">{xp} XP</span>
              {streak >= 2 && <span className="text-orange-500">{streak} streak{streak >= 3 ? " 🔥" : ""}</span>}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={`text-xl ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-2xl mx-auto w-full px-4 flex-1" key={`${current}-${shakeKey}`}>
          <div className="flex items-end gap-3 mb-6">
            <Pico
              size={90}
              mood={feedback ? (feedback.correct ? "celebrate" : "sad") : "happy"}
            />
            <div className="relative bg-white border-2 border-gray-200 rounded-3xl rounded-bl-none px-5 py-4 shadow-sm flex-1">
              <p className="text-lg font-extrabold text-gray-900">{question?.instruction}</p>
            </div>
          </div>

          {/* Arrange */}
          {question?.type === "arrange" && (
            <>
              <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                {renderArrangeCode(question)}
              </div>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[48px]">
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
                    className="px-4 py-2 bg-white border-2 border-b-4 border-gray-200 rounded-xl font-mono font-bold text-gray-800 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {tile}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Fill in the blank */}
          {question?.type === "fill" && (
            <>
              {question.codeLines && (
                <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                  {question.codeLines.map((line: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-500 font-mono text-sm">{i + 1}</span>
                      <span className="text-green-400 font-mono text-sm">{line}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {(question.tiles || []).map((tile: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => !feedback && setSelectedFill(tile)}
                    disabled={!!feedback}
                    className={`px-4 py-2 border-2 border-b-4 rounded-xl font-mono font-bold transition ${
                      selectedFill === tile
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {tile}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Multiple choice / output */}
          {(question?.type === "multiple_choice" || question?.type === "output") && (
            <>
              {question.codeLines && (
                <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                  {question.codeLines.map((line: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-500 font-mono text-sm">{i + 1}</span>
                      <span className="text-green-400 font-mono text-sm">{line}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-3 mb-4">
                {(question.options || []).map((option: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => !feedback && setSelectedOption(option)}
                    disabled={!!feedback}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-b-4 font-bold transition ${
                      selectedOption === option
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`rounded-3xl p-6 mb-4 ${feedback.correct ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
              <p className={`font-extrabold text-lg mb-1 ${feedback.correct ? "text-green-600" : "text-red-600"}`}>
                {feedback.correct ? `Correct!${streak >= 3 ? " 🔥 Streak bonus!" : ""}` : "Not quite"}
              </p>
              <p className={`font-semibold ${feedback.correct ? "text-green-700" : "text-red-700"}`}>
                {feedback.explanation}
              </p>
              {!feedback.correct && (
                <div className="text-red-600 font-bold mt-2 text-sm">
                  <p>Correct answer:</p>
                  <pre className="font-mono bg-red-100 px-2 py-2 rounded-lg whitespace-pre-wrap">{getCorrectAnswerText(question)}</pre>
                </div>
              )}
              {feedback.correct && question?.consoleOutput && (
                <div className="mt-4">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Console output</p>
                  <div className="bg-gray-900 rounded-2xl p-4">
                    <p className="text-green-400 font-mono text-sm">{question.consoleOutput}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={feedback ? next : checkAnswer}
            disabled={
              checking ||
              (!feedback && question?.type === "arrange" && arrangedTiles.every((t) => !t)) ||
              (!feedback && question?.type === "fill" && !selectedFill) ||
              (!feedback && (question?.type === "multiple_choice" || question?.type === "output") && !selectedOption)
            }
            className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-40 text-lg"
          >
            {checking ? "Checking..." : feedback ? "Continue →" : "Check"}
          </button>

          {lives === 0 && !feedback && (
            <div className="bg-white rounded-3xl shadow p-8 text-center mb-4">
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
                }}
                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-extrabold"
              >
                Try Again
              </button>
            </div>
          )}

          <p className="text-center text-gray-300 text-xs font-semibold mt-2 mb-8">
            Press Enter to continue
          </p>
        </div>
      </main>
    </>
  );
}
