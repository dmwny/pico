"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RewardChestArt } from "@/components/rewards/RewardChest";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { checkAchievements } from "@/lib/achievements";
import { evaluateQuestionAttempt } from "@/lib/lessonArc/engine";
import { isTrueFalseOptionTrue } from "@/lib/lessonArc/questionShuffle";
import { runPythonAgainstTests } from "@/lib/lessonArc/pythonRuntime";
import { getUnitMetaForChallenge, getUnitChallengeQuestions, getUnitChallengeXpReward, isUnitChallengeUnlocked } from "@/lib/lessonArc/unitChallenge";
import type {
  LessonArcQuestion,
  LessonCodeRunResult,
  QuestionAttemptAnswer,
  QuestionEvaluation,
} from "@/lib/lessonArc/types";
import { applyProgressPatch } from "@/lib/progress";
import { getChallengeChestDefinition } from "@/lib/rewardChests";
import LessonFeedbackBar from "./LessonFeedbackBar";
import QuestionRenderer, { isQuestionAnswerReady } from "./QuestionRenderer";

const PRAISE = ["Nice!", "Great job!", "You got it!", "Nailed it!", "Correct!", "Brilliant!"];
const CHALLENGE_HEARTS = 3;

type ChallengeScreenState = "loading" | "locked" | "challenge" | "complete" | "failed" | "error";

type ChallengeSession = {
  questionIndex: number;
  hearts: number;
  xpEarned: number;
  correctCount: number;
  wrongCount: number;
  perfectRun: boolean;
  questions: LessonArcQuestion[];
  startedAt: string;
  questionStartedAt: string;
};

type PendingChallengeAdvance =
  | { kind: "next"; nextSession: ChallengeSession }
  | { kind: "complete" }
  | { kind: "failed" };

type ChallengeSummary = {
  xpEarned: number;
  completionBonusXp: number;
  correctCount: number;
  totalQuestions: number;
  perfect: boolean;
  streakExtended: boolean;
  replayMode: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function getLocalDateKey(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function pickPraise(previous: string) {
  const options = PRAISE.filter((phrase) => phrase !== previous);
  return options[Math.floor(Math.random() * options.length)] ?? PRAISE[0];
}

function ChallengeHeart({
  filled,
  flash,
}: {
  filled: boolean;
  flash: boolean;
}) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
        filled
          ? "border-rose-400/50 bg-rose-500/18 text-rose-300"
          : "border-white/10 bg-white/5 text-white/25"
      } ${flash ? "animate-[challengeHeartLoss_420ms_ease-in-out]" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-6.7-4.35-9.2-8.37C.91 9.56 2.2 5.5 5.88 4.53A5.16 5.16 0 0 1 12 7.14a5.16 5.16 0 0 1 6.12-2.61c3.68.97 4.97 5.03 3.08 8.1C18.7 16.65 12 21 12 21Z" />
      </svg>
    </span>
  );
}

function UnitChallengeTopBar({
  accentColor,
  unitTitle,
  currentQuestion,
  totalQuestions,
  hearts,
  onClose,
  lossFlashKey,
}: {
  accentColor: string;
  unitTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  hearts: number;
  onClose: () => void;
  lossFlashKey: number;
}) {
  const progressPercent = totalQuestions <= 0 ? 0 : Math.min(100, Math.round((currentQuestion / totalQuestions) * 100));

  return (
    <div className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/78 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl">
      <style>{`
        @keyframes challengeHeartLoss {
          0% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.65; }
        }
      `}</style>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:bg-white/10"
          aria-label="Close challenge"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: accentColor,
                  boxShadow: `0 0 18px ${accentColor}`,
                }}
              />
            </div>
            <p className="min-w-[3.4rem] text-right text-xs font-black tracking-[0.18em] text-white/75">
              {Math.min(totalQuestions, currentQuestion)} / {totalQuestions}
            </p>
          </div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-white/58">
            Unit challenge · {unitTitle} · Question {Math.min(totalQuestions, currentQuestion)} / {totalQuestions}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: CHALLENGE_HEARTS }, (_, index) => (
            <ChallengeHeart
              key={`${index}-${lossFlashKey}`}
              filled={index < hearts}
              flash={lossFlashKey > 0 && index === hearts}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeCompleteScreen({
  unitNumber,
  unitTitle,
  summary,
  onContinue,
}: {
  unitNumber: number;
  unitTitle: string;
  summary: ChallengeSummary;
  onContinue: () => void;
}) {
  const chest = useMemo(() => getChallengeChestDefinition(unitNumber), [unitNumber]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/96 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-amber-400/16 text-amber-200 shadow-[0_0_80px_rgba(245,158,11,0.24)]">
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
            <path d="M12 2.5l2.66 5.39 5.95.86-4.3 4.2 1.01 5.93L12 16.35 6.68 18.88l1.02-5.93-4.3-4.2 5.95-.86L12 2.5Z" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.28em] text-white/40">
          {summary.replayMode ? "Challenge replay complete" : "Unit challenge complete"}
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">{unitTitle}</h1>
        <p className="mt-3 max-w-2xl text-lg text-white/72">
          {summary.replayMode
            ? "Replay cleared. You kept the practice, but the first-clear reward stays one-time."
            : "The gauntlet is clear. The challenge chest is ready and the unit badge is earned."}
        </p>

        <div className="mt-10 grid w-full gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 text-left">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-white/45">Challenge XP</p>
            <p className="mt-3 text-6xl font-black text-[#58CC02]">+{summary.xpEarned}</p>
            <p className="mt-4 text-sm font-semibold text-white/68">
              {summary.correctCount}/{summary.totalQuestions} correct
            </p>
            {summary.completionBonusXp > 0 ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
                </svg>
                Completion bonus +{summary.completionBonusXp}
              </div>
            ) : null}
            {summary.perfect ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-amber-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2.5l2.66 5.39 5.95.86-4.3 4.2 1.01 5.93L12 16.35 6.68 18.88l1.02-5.93-4.3-4.2 5.95-.86L12 2.5Z" />
                </svg>
                Perfect clear
              </div>
            ) : null}
            {summary.streakExtended ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2s4 2.64 4 7.1c0 2.1-.91 3.88-2.34 5.1 0-2.12-.88-3.3-1.66-4.24-.82 1.18-2 2.62-2 5.04A4 4 0 0 0 18 15c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-5.34 3.64-8.65 6-13Z" />
                </svg>
                Streak extended
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 p-6">
            <RewardChestArt rarity={chest.rarity} skin="default_chest" prominent className="w-full max-w-[7.2rem]" />
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white/45">
              {summary.replayMode ? "Replay reward" : "Challenge reward"}
            </p>
            <p className="mt-2 text-xl font-black text-white">{summary.replayMode ? "Practice only" : chest.title}</p>
            <p className="mt-2 text-sm font-semibold text-white/62">
              {summary.replayMode ? "No extra chest on replay." : "Guaranteed rare or better."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 flex h-14 w-full max-w-xl items-center justify-center rounded-[1.4rem] bg-[#58CC02] text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(88,204,2,0.28)] transition active:scale-[0.985]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ChallengeFailedScreen({
  currentQuestion,
  totalQuestions,
  onRetry,
  onExit,
}: {
  currentQuestion: number;
  totalQuestions: number;
  onRetry: () => void;
  onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/96 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/6 text-white/70">
          <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-6.7-4.35-9.2-8.37C.91 9.56 2.2 5.5 5.88 4.53A5.16 5.16 0 0 1 12 7.14a5.16 5.16 0 0 1 6.12-2.61c3.68.97 4.97 5.03 3.08 8.1C18.7 16.65 12 21 12 21Z" />
            <path d="M8 15c1-1 2-1.4 4-1.4s3 .4 4 1.4" />
          </svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight">Challenge failed</h1>
        <p className="mt-3 max-w-xl text-lg text-white/70">
          You ran out of hearts on question {currentQuestion}/{totalQuestions}. Restart the gauntlet to try again.
        </p>
        <div className="mt-10 w-full space-y-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex h-14 w-full items-center justify-center rounded-[1.4rem] bg-[#58CC02] text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(88,204,2,0.28)] transition active:scale-[0.985]"
          >
            Retry challenge
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex h-14 w-full items-center justify-center rounded-[1.4rem] border border-white/12 bg-white/6 text-base font-black uppercase tracking-[0.18em] text-white/84 transition active:scale-[0.985]"
          >
            Back to path
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnitChallengeClient({
  unitId,
  requestedLanguage,
}: {
  unitId: string;
  requestedLanguage: string | null;
}) {
  const router = useRouter();
  const { pathTheme } = useThemeContext();
  const {
    activeLanguage,
    loading,
    isHydrating,
    progress,
    saveProgressSnapshot,
    applyQualifiedStreakActivity,
    xpBoostActive,
  } = useCosmetics();

  const language = requestedLanguage ?? activeLanguage ?? "python";
  const unit = useMemo(() => getUnitMetaForChallenge(language, unitId), [language, unitId]);
  const challengeKey = unit ? `${unit.id}-7` : `${unitId}-7`;
  const challengeUnlocked = useMemo(
    () => (unit && progress ? isUnitChallengeUnlocked(unit, progress.completed_lessons) : false),
    [progress, unit],
  );
  const challengeCompleted = progress?.completed_lessons.includes(challengeKey) ?? false;
  const challengeQuestions = useMemo(
    () => (unit ? getUnitChallengeQuestions(language, unit.id).map((question) => ({ ...question, hint: undefined })) : []),
    [language, unit],
  );
  const challengeBonusXp = useMemo(
    () => (unit ? getUnitChallengeXpReward(unit.id) : 0),
    [unit],
  );

  const [screen, setScreen] = useState<ChallengeScreenState>("loading");
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [answer, setAnswer] = useState<QuestionAttemptAnswer>({});
  const [feedback, setFeedback] = useState<QuestionEvaluation | null>(null);
  const [feedbackLabel, setFeedbackLabel] = useState(PRAISE[0]);
  const [pendingAdvance, setPendingAdvance] = useState<PendingChallengeAdvance | null>(null);
  const [frozenQuestion, setFrozenQuestion] = useState<LessonArcQuestion | null>(null);
  const [runResult, setRunResult] = useState<LessonCodeRunResult | null>(null);
  const [lossFlashKey, setLossFlashKey] = useState(0);
  const [summary, setSummary] = useState<ChallengeSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastPraise, setLastPraise] = useState(PRAISE[0]);
  const bootRef = useRef<string | null>(null);

  const timezone = progress?.streak_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const replayMode = challengeCompleted;
  const activeQuestion = session ? session.questions[session.questionIndex] ?? null : null;
  const displayedQuestion = feedback && frozenQuestion ? frozenQuestion : activeQuestion;
  const answerReady = displayedQuestion ? isQuestionAnswerReady(displayedQuestion, answer, runResult) : false;
  const completionLocked = pendingAdvance?.kind === "complete" || screen === "complete" || Boolean(summary);

  const startSession = useCallback(() => {
    if (!unit) {
      setLoadError("This unit challenge could not be found.");
      setScreen("error");
      return;
    }
    if (!challengeUnlocked && !challengeCompleted) {
      setScreen("locked");
      return;
    }
    if (challengeQuestions.length < 12) {
      setLoadError("Not enough challenge questions are available for this unit yet.");
      setScreen("error");
      return;
    }

    setSession({
      questionIndex: 0,
      hearts: CHALLENGE_HEARTS,
      xpEarned: 0,
      correctCount: 0,
      wrongCount: 0,
      perfectRun: true,
      questions: challengeQuestions,
      startedAt: nowIso(),
      questionStartedAt: nowIso(),
    });
    setAnswer({});
    setFeedback(null);
    setPendingAdvance(null);
    setFrozenQuestion(null);
    setRunResult(null);
    setSummary(null);
    setLoadError(null);
    setScreen("challenge");
  }, [challengeCompleted, challengeQuestions, challengeUnlocked, unit]);

  useEffect(() => {
    if (loading || isHydrating || completionLocked) return;
    const bootKey = `${language}:${unitId}:${challengeCompleted ? "replay" : "first-clear"}:${progress?.completed_lessons.length ?? 0}:${challengeQuestions.length}`;
    if (bootRef.current === bootKey) return;
    bootRef.current = bootKey;
    startSession();
  }, [challengeCompleted, challengeQuestions.length, completionLocked, isHydrating, language, loading, progress?.completed_lessons.length, startSession, unitId]);

  useEffect(() => {
    setAnswer({});
    setRunResult(null);
  }, [session?.questionIndex]);

  const finalizeChallenge = useCallback(async (nextSession: ChallengeSession) => {
    if (!progress || !unit) {
      return {
        streakExtended: false,
        xpEarned: nextSession.xpEarned,
      };
    }

    const completionBonusXp = replayMode ? Math.max(1, Math.round(challengeBonusXp * 0.5)) : challengeBonusXp;
    const xpEarned = nextSession.xpEarned + completionBonusXp;
    const todayDate = getLocalDateKey(timezone);
    const completedLessons = replayMode
      ? progress.completed_lessons
      : [...new Set([...progress.completed_lessons, challengeKey])];

    const baseSnapshot = applyProgressPatch(progress, progress.language, {
      completed_lessons: completedLessons,
      active_lesson_session: null,
      xp: progress.xp + xpEarned,
      today_xp: progress.today_xp + xpEarned,
      today_lessons: progress.today_lessons + 1,
      last_played: todayDate,
    });

    const streakBefore = progress.streak;
    const streakResult = await applyQualifiedStreakActivity({
      language: baseSnapshot.language,
      baseProgress: baseSnapshot,
    });
    let persistedProgress = streakResult?.progress ?? await saveProgressSnapshot(baseSnapshot, {
      language: baseSnapshot.language,
      syncRemote: true,
    });

    if (persistedProgress) {
      const currentProgress = persistedProgress;
      const earnedNow = checkAchievements(
        currentProgress.completed_lessons,
        currentProgress.xp,
        currentProgress.streak,
        nextSession.perfectRun,
        Math.max(1, Math.round((Date.now() - Date.parse(nextSession.startedAt)) / 1000)),
        nextSession.correctCount,
        currentProgress.today_perfect,
      );
      const newAchievements = earnedNow.filter((id) => !currentProgress.achievements.includes(id));
      if (newAchievements.length > 0) {
        persistedProgress = applyProgressPatch(currentProgress, baseSnapshot.language, {
          achievements: [...currentProgress.achievements, ...newAchievements],
        });
        await saveProgressSnapshot(persistedProgress, {
          language: baseSnapshot.language,
          syncRemote: true,
        });
      }
    }

    return {
      streakExtended: (streakResult?.progress?.streak ?? streakBefore) > streakBefore,
      xpEarned,
      completionBonusXp,
    };
  }, [applyQualifiedStreakActivity, challengeBonusXp, challengeKey, progress, replayMode, saveProgressSnapshot, timezone, unit]);

  const handleCheck = useCallback(async () => {
    if (!displayedQuestion || !session) return;

    const elapsedMs = Math.max(0, Date.now() - Date.parse(session.questionStartedAt));
    let nextRunResult = runResult;
    const codeValue = answer.codeValue ?? "";

    if ((displayedQuestion.type === "complete_fn" || displayedQuestion.type === "debug") && displayedQuestion.testCases?.length) {
      if (language === "python" && codeValue) {
        nextRunResult = await runPythonAgainstTests(codeValue, displayedQuestion.testCases);
        setRunResult(nextRunResult);
      } else if (codeValue) {
        const codeMatches = codeValue.trim() === (displayedQuestion.correctAnswer ?? "").trim();
        nextRunResult = {
          ok: true,
          passed: codeMatches,
          output: "",
          tests: displayedQuestion.testCases.map((testCase) => ({
            input: testCase.input,
            expected: testCase.expected,
            actual: codeMatches ? testCase.expected : "Code did not match expected solution",
            passed: codeMatches,
          })),
        };
        setRunResult(nextRunResult);
      }
    }

    const rawEvaluation = evaluateQuestionAttempt(displayedQuestion, answer, elapsedMs, language, nextRunResult);
    const evaluation = xpBoostActive && rawEvaluation.correct
      ? {
          ...rawEvaluation,
          xpAwarded: rawEvaluation.xpAwarded * 2,
          speedBonusAwarded: rawEvaluation.speedBonusAwarded * 2,
        }
      : rawEvaluation;
    const isLastQuestion = session.questionIndex >= session.questions.length - 1;

    setFrozenQuestion(displayedQuestion);
    setFeedback(evaluation);

    if (evaluation.correct) {
      const praise = pickPraise(lastPraise);
      setLastPraise(praise);
      setFeedbackLabel(praise);

      const nextSession: ChallengeSession = {
        ...session,
        questionIndex: session.questionIndex + 1,
        xpEarned: session.xpEarned + evaluation.xpAwarded,
        correctCount: session.correctCount + 1,
        questionStartedAt: nowIso(),
      };
      setSession(nextSession);

      if (isLastQuestion) {
        const result = await finalizeChallenge(nextSession);
        setSummary({
          xpEarned: result.xpEarned,
          completionBonusXp: result.completionBonusXp ?? 0,
          correctCount: nextSession.correctCount,
          totalQuestions: nextSession.questions.length,
          perfect: nextSession.perfectRun,
          streakExtended: result.streakExtended,
          replayMode,
        });
        setPendingAdvance({ kind: "complete" });
        return;
      }

      setPendingAdvance({ kind: "next", nextSession });
      return;
    }

    setFeedbackLabel("Incorrect");
    setLossFlashKey((current) => current + 1);

    const nextHearts = Math.max(0, session.hearts - 1);
    const nextSession: ChallengeSession = {
      ...session,
      questionIndex: session.questionIndex + 1,
      hearts: nextHearts,
      wrongCount: session.wrongCount + 1,
      perfectRun: false,
      questionStartedAt: nowIso(),
    };
    setSession(nextSession);

    if (nextHearts <= 0) {
      setPendingAdvance({ kind: "failed" });
      return;
    }

    if (isLastQuestion) {
      const result = await finalizeChallenge(nextSession);
      setSummary({
        xpEarned: result.xpEarned,
        completionBonusXp: result.completionBonusXp ?? 0,
        correctCount: nextSession.correctCount,
        totalQuestions: nextSession.questions.length,
        perfect: false,
        streakExtended: result.streakExtended,
        replayMode,
      });
      setPendingAdvance({ kind: "complete" });
      return;
    }

    setPendingAdvance({ kind: "next", nextSession });
  }, [answer, displayedQuestion, finalizeChallenge, language, lastPraise, replayMode, runResult, session, xpBoostActive]);

  const handleFeedbackAdvance = useCallback(() => {
    if (!pendingAdvance) return;

    if (pendingAdvance.kind === "next") {
      setFeedback(null);
      setFrozenQuestion(null);
      setPendingAdvance(null);
      return;
    }

    if (pendingAdvance.kind === "complete") {
      setFeedback(null);
      setFrozenQuestion(null);
      setPendingAdvance(null);
      setScreen("complete");
      return;
    }

    setFeedback(null);
    setFrozenQuestion(null);
    setPendingAdvance(null);
    setScreen("failed");
  }, [pendingAdvance]);

  const returnToPath = useCallback(() => {
    const params = new URLSearchParams({ lang: language });
    if (!replayMode) {
      params.set("celebrateNode", challengeKey);
      params.set("openChallengeChest", String(unit?.id ?? unitId));
    }
    router.push(`/learn?${params.toString()}`);
  }, [challengeKey, language, replayMode, router, unit?.id, unitId]);

  useEffect(() => {
    if (!displayedQuestion || screen !== "challenge") return;

    const handler = (event: KeyboardEvent) => {
      if (feedback) {
        if (event.key === "Enter") {
          event.preventDefault();
          handleFeedbackAdvance();
        }
        return;
      }

      if (
        (displayedQuestion.type === "mc_concept"
          || displayedQuestion.type === "mc_output"
          || displayedQuestion.type === "true_false")
        && /^[1-4]$/.test(event.key)
      ) {
        const index = Number(event.key) - 1;
        const option = displayedQuestion.options?.[index];
        if (option) {
          setAnswer({ optionIndex: index, optionValue: option, booleanValue: isTrueFalseOptionTrue(option) });
        }
      }

      if (event.key === "Enter" && answerReady) {
        event.preventDefault();
        void handleCheck();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answerReady, displayedQuestion, feedback, handleCheck, handleFeedbackAdvance, screen]);

  if (loading || isHydrating || screen === "loading") {
    return (
      <div className="min-h-screen bg-[#101826] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-6 py-5 text-sm font-bold uppercase tracking-[0.22em] text-white/55">
            Loading challenge
          </div>
        </div>
      </div>
    );
  }

  if (screen === "locked") {
    return (
      <div className="min-h-screen bg-[#101826] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 px-6 py-8 text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-white/42">Challenge locked</p>
          <h1 className="mt-4 text-3xl font-black">Finish the arc first</h1>
          <p className="mt-3 text-base font-semibold leading-7 text-white/68">
            Complete every regular lesson arc in this unit to unlock the challenge gauntlet.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/learn?lang=${language}`)}
            className="mt-8 flex h-12 w-full items-center justify-center rounded-[1.2rem] bg-[#58CC02] text-sm font-black uppercase tracking-[0.18em] text-white"
          >
            Back to path
          </button>
        </div>
      </div>
    );
  }

  if (screen === "error" || !unit || !displayedQuestion || !session) {
    return (
      <div className="min-h-screen bg-[#101826] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 px-6 py-8 text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-white/42">Challenge unavailable</p>
          <h1 className="mt-4 text-3xl font-black">Could not load this challenge</h1>
          <p className="mt-3 text-base font-semibold leading-7 text-white/68">{loadError ?? "No challenge questions are available yet."}</p>
          <button
            type="button"
            onClick={() => router.push(`/learn?lang=${language}`)}
            className="mt-8 flex h-12 w-full items-center justify-center rounded-[1.2rem] bg-[#58CC02] text-sm font-black uppercase tracking-[0.18em] text-white"
          >
            Back to path
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionNumber = Math.min(session.questions.length, session.questionIndex + (feedback ? 0 : 1));

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#101826] text-white">
      <div className="relative flex min-h-screen flex-col bg-[#101826]">
        <UnitChallengeTopBar
          accentColor={pathTheme.accentColor}
          unitTitle={unit.title}
          currentQuestion={currentQuestionNumber}
          totalQuestions={session.questions.length}
          hearts={session.hearts}
          onClose={() => router.push(`/learn?lang=${language}`)}
          lossFlashKey={lossFlashKey}
        />

        <main className="flex-1 px-4 pb-36 pt-8 md:px-8">
          <QuestionRenderer
            question={displayedQuestion}
            answer={answer}
            setAnswer={setAnswer}
            feedback={feedback}
            runResult={runResult}
            onRunCode={async () => {
              const codeValue = answer.codeValue ?? "";
              if (!displayedQuestion.testCases?.length || !codeValue) return;
              if (language === "python") {
                setRunResult(await runPythonAgainstTests(codeValue, displayedQuestion.testCases));
              } else {
                const codeMatches = codeValue.trim() === (displayedQuestion.correctAnswer ?? "").trim();
                setRunResult({
                  ok: true,
                  passed: codeMatches,
                  output: "",
                  tests: displayedQuestion.testCases.map((testCase) => ({
                    input: testCase.input,
                    expected: testCase.expected,
                    actual: codeMatches ? testCase.expected : "Code did not match expected solution",
                    passed: codeMatches,
                  })),
                });
              }
            }}
            hintVisible={false}
            onRevealHint={() => {}}
            hintEnabled={false}
          />
        </main>

        <LessonFeedbackBar
          key={`${displayedQuestion.id}:${feedback ? (feedback.correct ? "correct" : "wrong") : "idle"}`}
          mode={feedback ? (feedback.correct ? "correct" : "wrong") : "idle"}
          accentColor={pathTheme.accentColor}
          disabled={!feedback && !answerReady}
          correctAnswer={feedback && !feedback.correct ? feedback.displayCorrectAnswer : undefined}
          xpAwarded={feedback?.xpAwarded}
          label={feedback ? feedbackLabel : displayedQuestion.type === "predict_type" || displayedQuestion.type === "fill_type" ? "Submit" : "Check"}
          explanation={feedback?.explanation}
          alwaysShowExplanation={feedback ? (!feedback.correct || displayedQuestion.type === "true_false") : false}
          primaryLabel={feedback ? (feedback.correct ? "Continue" : "Got it") : (displayedQuestion.type === "complete_fn" || displayedQuestion.type === "debug" ? "Check solution" : "Check")}
          onPrimaryAction={() => {
            if (feedback) {
              handleFeedbackAdvance();
              return;
            }
            void handleCheck();
          }}
        />
      </div>

      {screen === "complete" && summary ? (
        <ChallengeCompleteScreen
          unitNumber={unit.id}
          unitTitle={`Unit ${unit.id}: ${unit.title}`}
          summary={summary}
          onContinue={returnToPath}
        />
      ) : null}

      {screen === "failed" ? (
        <ChallengeFailedScreen
          currentQuestion={Math.min(session.questions.length, session.questionIndex)}
          totalQuestions={session.questions.length}
          onRetry={startSession}
          onExit={() => router.push(`/learn?lang=${language}`)}
        />
      ) : null}
    </div>
  );
}
