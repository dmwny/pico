"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { checkAchievements } from "@/lib/achievements";
import {
  fetchRemoteArcProgressRecord,
  getStoredArcProgress,
  mergeArcProgressRecordMaps,
  toArcProgressRecord,
  toLessonArcNodeProgress,
  upsertRemoteArcProgress,
} from "@/lib/lessonArc/arcProgress";
import {
  applyQuestionEvaluation,
  consumeLessonHint,
  createEmptyNodeProgress,
  createLessonSession,
  evaluateQuestionAttempt,
  getActiveQuestion,
  restartLessonSession,
  refillLessonHearts,
  upsertNodeProgress,
} from "@/lib/lessonArc/engine";
import { resolveNodeDescriptor } from "@/lib/lessonArc/catalog";
import { sanitizeLessonArcQuestions } from "@/lib/lessonArc/promptSanitizer";
import { isTrueFalseOptionTrue, shuffleQuestionsForDelivery } from "@/lib/lessonArc/questionShuffle";
import { runPythonAgainstTests } from "@/lib/lessonArc/pythonRuntime";
import type {
  LessonAdvanceResult,
  LessonArcNodeProgress,
  LessonArcPayload,
  LessonArcQuestion,
  LessonArcSession,
  LessonCodeRunResult,
  QuestionAttemptAnswer,
  QuestionEvaluation,
} from "@/lib/lessonArc/types";
import { applyProgressPatch } from "@/lib/progress";
import LessonFeedbackBar from "./LessonFeedbackBar";
import { ArcCompleteScreen, LessonCompleteScreen, LessonFailedScreen } from "./LessonEndScreens";
import QuestionRenderer, { isQuestionAnswerReady } from "./QuestionRenderer";
import LessonTopBar from "./LessonTopBar";

const PRAISE = ["Nice!", "Great job!", "You got it!", "Nailed it!", "Correct!", "Brilliant!"];

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

function buildNodeProgressFromSession(session: LessonArcSession, current: LessonArcNodeProgress | null, questionIndex = session.questionIndex) {
  return {
    ...(current ?? createEmptyNodeProgress({
      nodeId: session.nodeId,
      unitId: session.unitId,
      lessonId: session.lessonId,
      language: session.language,
      unitTitle: "",
      lessonTitle: "",
      concept: session.concept,
      conceptSlug: session.nodeId,
      nodeType: "practice",
    })),
    lessonIndex: session.lessonIndex,
    questionIndex,
    hearts: session.hearts,
    status: "in_progress" as const,
    updatedAt: session.updatedAt,
  };
}

type ScreenState = "loading" | "lesson" | "lesson-complete" | "arc-complete" | "failed";

export default function LessonArcClient({
  unitId,
  lessonId,
  requestedLanguage,
  reviewMode = false,
}: {
  unitId: string;
  lessonId: string;
  requestedLanguage: string | null;
  reviewMode?: boolean;
}) {
  const router = useRouter();
  const { pathTheme } = useThemeContext();
  const {
    activeLanguage,
    loading,
    isHydrating,
    viewerId,
    progress,
    updateProgress,
    saveProgressSnapshot,
    applyQualifiedStreakActivity,
    heartRefillCount,
    hintTokenCount,
    xpBoostActive,
    unlimitedHeartsActive,
    consumeHeartRefillCharge,
    consumeHintTokenCharge,
  } = useCosmetics();

  const currentLanguage = requestedLanguage ?? activeLanguage ?? "python";
  const node = useMemo(() => resolveNodeDescriptor(currentLanguage, unitId, lessonId), [currentLanguage, lessonId, unitId]);
  const nodeProgressFromStore = progress?.arc_progress[node.nodeId] ?? null;
  const matchingSession = progress?.active_lesson_session?.nodeId === node.nodeId ? progress.active_lesson_session : null;

  const [screen, setScreen] = useState<ScreenState>("loading");
  const [payload, setPayload] = useState<LessonArcPayload | null>(null);
  const [session, setSession] = useState<LessonArcSession | null>(null);
  const [nodeProgress, setNodeProgress] = useState<LessonArcNodeProgress | null>(nodeProgressFromStore);
  const [answer, setAnswer] = useState<QuestionAttemptAnswer>({});
  const [feedback, setFeedback] = useState<QuestionEvaluation | null>(null);
  const [feedbackLabel, setFeedbackLabel] = useState("Check");
  const [pendingAdvance, setPendingAdvance] = useState<LessonAdvanceResult | null>(null);
  const [frozenQuestion, setFrozenQuestion] = useState<LessonArcQuestion | null>(null);
  const [runResult, setRunResult] = useState<LessonCodeRunResult | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [lossFlashKey, setLossFlashKey] = useState(0);
  const [lastPraise, setLastPraise] = useState(PRAISE[0]);
  const [lessonSummary, setLessonSummary] = useState<{
    xpEarned: number;
    correctCount: number;
    totalQuestions: number;
    perfect: boolean;
    streakExtended: boolean;
    arcComplete: boolean;
    reviewMode: boolean;
    lessonIndex: number;
    completedLessonCount: number;
  } | null>(null);
  const bootstrapRef = useRef<string | null>(null);
  const completionNavigationTimeoutRef = useRef<number | null>(null);

  const activeQuestion = getActiveQuestion(session);
  const displayedQuestion = feedback && frozenQuestion ? frozenQuestion : activeQuestion;
  const answerReady = displayedQuestion ? isQuestionAnswerReady(displayedQuestion, answer, runResult) : false;
  const timezone = progress?.streak_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lessonUnlimitedHearts = unlimitedHeartsActive || xpBoostActive;
  const [loadError, setLoadError] = useState<string | null>(null);
  const completionLocked =
    pendingAdvance?.kind === "lesson_complete"
    || screen === "lesson-complete"
    || screen === "arc-complete"
    || Boolean(lessonSummary);

  const persistArcState = useCallback(async (nextSession: LessonArcSession | null, nextNodeProgress: LessonArcNodeProgress, extra: Partial<typeof progress> = {}) => {
    if (!progress || !viewerId || reviewMode) return null;
    const nextArcProgress = upsertNodeProgress(progress.arc_progress, nextNodeProgress);
    const persisted = await updateProgress(
      {
        arc_progress: nextArcProgress,
        active_lesson_session: nextSession,
        ...extra,
      },
      { syncRemote: true, language: node.language },
    );
    await upsertRemoteArcProgress(viewerId, node.language, nextNodeProgress);
    return persisted;
  }, [node.language, progress, reviewMode, updateProgress, viewerId]);

  const bootstrapLesson = useCallback(async () => {
    if (!viewerId || !progress) return;
    setLoadError(null);
    const localArcRecord = getStoredArcProgress(viewerId, node.language, node.nodeId);
    const remoteArcRecord = await fetchRemoteArcProgressRecord(viewerId, node.language, node.nodeId);
    const mergedArcRecord = mergeArcProgressRecordMaps(
      localArcRecord ? { [node.nodeId]: localArcRecord } : {},
      remoteArcRecord ? { [node.nodeId]: remoteArcRecord } : {},
      nodeProgressFromStore ? { [node.nodeId]: toArcProgressRecord(nodeProgressFromStore) } : {},
    )[node.nodeId];
    const resolvedNodeProgress = mergedArcRecord
      ? toLessonArcNodeProgress(mergedArcRecord, nodeProgressFromStore)
      : nodeProgressFromStore;

    if (progress.completed_lessons.includes(node.nodeId) && !matchingSession && !reviewMode) {
      console.warn("[lesson-arc] node is already marked completed; starting review session instead of redirecting", {
        nodeId: node.nodeId,
        concept: node.concept,
        difficulty: (resolvedNodeProgress?.lessonIndex ?? 0) + 1,
        completedLessons: progress.completed_lessons,
      });
    }

    const lessonIndex = reviewMode
      ? 0
      : resolvedNodeProgress?.status === "in_progress"
        ? resolvedNodeProgress.lessonIndex
        : 0;

    const shouldResumeSession = matchingSession?.questions?.length
      && matchingSession.mode === (reviewMode ? "review" : "progress")
      && matchingSession.lessonIndex === lessonIndex
      && matchingSession.questionIndex < matchingSession.questions.length;

    if (matchingSession && !shouldResumeSession && !reviewMode) {
      console.warn("[lesson-arc] discarding stale active session", {
        nodeId: node.nodeId,
        activeSessionLessonIndex: matchingSession.lessonIndex,
        expectedLessonIndex: lessonIndex,
        activeSessionQuestionIndex: matchingSession.questionIndex,
        activeSessionQuestionCount: matchingSession.questions.length,
      });
      await updateProgress(
        { active_lesson_session: null },
        { syncRemote: true, language: node.language },
      );
    }

    if (shouldResumeSession) {
      const resumedQuestions = shuffleQuestionsForDelivery(sanitizeLessonArcQuestions(matchingSession.questions));
      const resumedSession = {
        ...matchingSession,
        questions: resumedQuestions,
        questionOrder: resumedQuestions.map((question) => question.id),
      } satisfies LessonArcSession;
      const titlePayload: LessonArcPayload = {
        node,
        lessonIndex: resumedSession.lessonIndex,
        title: node.lessonTitle,
        subtitle: `Lesson ${resumedSession.lessonIndex + 1}`,
        questions: resumedSession.questions,
      };
      setPayload(titlePayload);
      setSession(resumedSession);
      setNodeProgress(resolvedNodeProgress ?? buildNodeProgressFromSession(resumedSession, resolvedNodeProgress));
      setScreen("lesson");
      return;
    }
    console.log("[lesson-arc] requesting lesson payload", {
      concept: node.concept,
      conceptSlug: node.conceptSlug,
      difficulty: lessonIndex + 1,
      language: node.language,
      unitId,
      lessonId,
    });
    const response = await fetch("/api/lesson-arc", {
      method: "POST",
      body: JSON.stringify({
        unitId,
        lessonId,
        language: node.language,
        lessonIndex,
      }),
    });
    const data = await response.json();
    console.log("[lesson-arc] lesson payload fetch result", {
      concept: node.concept,
      difficulty: lessonIndex + 1,
      resultCount: Array.isArray(data?.questions) ? data.questions.length : 0,
      results: Array.isArray(data?.questions) ? data.questions : [],
      source: data?.source ?? null,
      status: response.status,
      error: data?.error ?? null,
    });
    if (!response.ok) {
      setLoadError(typeof data?.error === "string" ? data.error : "Unable to load lesson content.");
      return;
    }

    const nextPayload = data as LessonArcPayload;
    if (!Array.isArray(nextPayload.questions) || nextPayload.questions.length === 0) {
      console.warn("[lesson-arc] no questions available after fetch; showing lesson error state", {
        concept: node.concept,
        difficulty: lessonIndex + 1,
        payload: data,
      });
      setLoadError("No questions available for this lesson yet.");
      return;
    }
    const nextSession = createLessonSession({
      node,
      lessonIndex: nextPayload.lessonIndex,
      questions: nextPayload.questions,
      mode: reviewMode ? "review" : "progress",
    });
    const nextNodeProgress = {
      ...(resolvedNodeProgress ?? createEmptyNodeProgress(node)),
      lessonIndex: nextPayload.lessonIndex,
      questionIndex: 0,
      hearts: nextSession.hearts,
      status: "in_progress" as const,
      updatedAt: nextSession.updatedAt,
    };

    setPayload(nextPayload);
    setSession(nextSession);
    setNodeProgress(nextNodeProgress);
    setScreen("lesson");
    if (!reviewMode) {
      await persistArcState(nextSession, nextNodeProgress);
    }
  }, [lessonId, matchingSession, node, nodeProgressFromStore, persistArcState, progress, reviewMode, unitId, updateProgress, viewerId]);

  useEffect(() => {
    if (loading || isHydrating || !viewerId || !progress || completionLocked) return;
    const bootKey = `${node.nodeId}:${reviewMode ? "review" : "progress"}:${matchingSession?.updatedAt ?? nodeProgressFromStore?.updatedAt ?? "fresh"}`;
    if (bootstrapRef.current === bootKey) return;
    bootstrapRef.current = bootKey;
    void bootstrapLesson();
  }, [bootstrapLesson, completionLocked, isHydrating, loading, matchingSession?.updatedAt, node.nodeId, nodeProgressFromStore?.updatedAt, progress, reviewMode, viewerId]);

  useEffect(() => {
    setAnswer({});
    setRunResult(null);
    setHintVisible(false);
  }, [session?.questionIndex]);

  const applyCompletionRewards = useCallback(async (advance: Extract<LessonAdvanceResult, { kind: "lesson_complete" }>) => {
    if (!progress) {
      return {
        streakExtended: false,
        arcBonusXp: 0,
        rewardedNodeProgress: advance.nodeProgress,
      };
    }
    const reviewSession = advance.session.mode === "review";
    const arcBonusXp = !reviewSession && advance.lessonPassed ? 50 : 0;
    const lessonXp = advance.session.xpEarned + advance.perfectBonusXp + arcBonusXp;
    const rewardedNodeProgress = reviewSession
      ? advance.nodeProgress
      : {
          ...advance.nodeProgress,
          xpEarned: advance.nodeProgress.totalArcXpEarned + advance.perfectBonusXp + arcBonusXp,
          totalArcXpEarned: advance.nodeProgress.totalArcXpEarned + advance.perfectBonusXp + arcBonusXp,
          updatedAt: new Date().toISOString(),
        };
    const completedLessons = !reviewSession && advance.lessonPassed
      ? [...new Set([...progress.completed_lessons, node.nodeId])]
      : progress.completed_lessons;
    const todayDate = getLocalDateKey(timezone);
    const baseSnapshot = applyProgressPatch(progress, node.language, {
      arc_progress: reviewSession
        ? progress.arc_progress
        : upsertNodeProgress(progress.arc_progress, rewardedNodeProgress),
      active_lesson_session: null,
      completed_lessons: completedLessons,
      xp: progress.xp + lessonXp,
      today_xp: progress.today_xp + lessonXp,
      today_lessons: progress.today_lessons + 1,
      today_perfect: progress.today_perfect + (advance.perfectBonusXp > 0 ? 1 : 0),
      last_played: todayDate,
    });

    const streakBefore = progress.streak;
    const streakResult = await applyQualifiedStreakActivity({
      language: node.language,
      baseProgress: baseSnapshot,
    });
    let persistedProgress = streakResult?.progress ?? await saveProgressSnapshot(baseSnapshot, { language: node.language, syncRemote: true });

    if (!reviewSession && viewerId) {
      await upsertRemoteArcProgress(viewerId, node.language, rewardedNodeProgress);
    }

    if (persistedProgress) {
      const currentProgress = persistedProgress;
      const earnedNow = checkAchievements(
        currentProgress.completed_lessons,
        currentProgress.xp,
        currentProgress.streak,
        advance.perfectBonusXp > 0,
        Math.max(1, Math.round((Date.now() - Date.parse(advance.session.startedAt)) / 1000)),
        advance.session.correctCount,
        currentProgress.today_perfect,
      );
      const newAchievements = earnedNow.filter((id) => !currentProgress.achievements.includes(id));
      if (newAchievements.length > 0) {
        persistedProgress = applyProgressPatch(currentProgress, node.language, {
          achievements: [...currentProgress.achievements, ...newAchievements],
        });
        await saveProgressSnapshot(persistedProgress, { language: node.language, syncRemote: true });
      }
    }

    return {
      streakExtended: (streakResult?.progress?.streak ?? streakBefore) > streakBefore,
      arcBonusXp,
      rewardedNodeProgress,
    };
  }, [applyQualifiedStreakActivity, node.language, node.nodeId, progress, saveProgressSnapshot, timezone, viewerId]);

  const handleCheck = useCallback(async () => {
    if (!displayedQuestion || !session || !nodeProgress) return;
    const elapsedMs = Math.max(0, Date.now() - Date.parse(session.questionStartedAt));
    let nextRunResult = runResult;
    const codeValue = answer.codeValue ?? "";

    if ((displayedQuestion.type === "complete_fn" || displayedQuestion.type === "debug") && displayedQuestion.testCases?.length) {
      if (node.language === "python" && codeValue) {
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

    const rawEvaluation = evaluateQuestionAttempt(displayedQuestion, answer, elapsedMs, node.language, nextRunResult);
    let evaluation = xpBoostActive && rawEvaluation.correct
      ? {
          ...rawEvaluation,
          xpAwarded: rawEvaluation.xpAwarded * 2,
          speedBonusAwarded: rawEvaluation.speedBonusAwarded * 2,
        }
      : rawEvaluation;

    if (session.mode === "review" && evaluation.correct) {
      evaluation = {
        ...evaluation,
        xpAwarded: Math.max(1, Math.round(evaluation.xpAwarded * 0.5)),
        speedBonusAwarded: Math.round(evaluation.speedBonusAwarded * 0.5),
      };
    }
    const advance = applyQuestionEvaluation({
      session,
      progress: nodeProgress,
      node,
      question: displayedQuestion,
      evaluation,
      unlimitedHearts: lessonUnlimitedHearts,
    });

    setFrozenQuestion(displayedQuestion);
    setFeedback(evaluation);
    const praise = evaluation.correct ? pickPraise(lastPraise) : "Incorrect";
    setFeedbackLabel(praise);
    if (evaluation.correct) {
      setLastPraise(praise);
    } else if (!lessonUnlimitedHearts) {
      setLossFlashKey((current) => current + 1);
    }

    setSession(advance.session);
    setNodeProgress(advance.nodeProgress);
    setPendingAdvance(advance);

    if (advance.kind === "lesson_complete") {
      const rewards = await applyCompletionRewards(advance);
      setNodeProgress(rewards.rewardedNodeProgress);
      const completedLessonCount = advance.lessonPassed
        ? 5
        : Math.min(5, rewards.rewardedNodeProgress.completedLessonIndices.length);
      setLessonSummary({
        xpEarned: advance.session.xpEarned + advance.perfectBonusXp + rewards.arcBonusXp,
        correctCount: advance.session.correctCount,
        totalQuestions: advance.session.questions.length,
        perfect: advance.perfectBonusXp > 0,
        streakExtended: rewards.streakExtended,
        arcComplete: advance.lessonPassed,
        reviewMode: advance.session.mode === "review",
        lessonIndex: advance.session.lessonIndex + 1,
        completedLessonCount,
      });
      return;
    }

    if (advance.session.mode !== "review") {
      await persistArcState(advance.session, advance.nodeProgress);
    }
  }, [answer, applyCompletionRewards, displayedQuestion, lastPraise, lessonUnlimitedHearts, node, nodeProgress, persistArcState, runResult, session, xpBoostActive]);

  const handleFeedbackAdvance = useCallback(async () => {
    if (!pendingAdvance) return;

    if (pendingAdvance.kind === "lesson_failed") {
      setScreen("failed");
    } else if (pendingAdvance.kind === "lesson_complete") {
      setScreen(pendingAdvance.lessonPassed ? "arc-complete" : "lesson-complete");
    }

    setFeedback(null);
    setFrozenQuestion(null);
    setPendingAdvance(null);
  }, [pendingAdvance]);

  const handleRetryLesson = useCallback(async () => {
    if (!session || !nodeProgress) return;
    const nextSession = restartLessonSession(session);
    const nextProgress = {
      ...nodeProgress,
      questionIndex: 0,
      hearts: nextSession.hearts,
      status: "in_progress" as const,
      updatedAt: nextSession.updatedAt,
    };
    setSession(nextSession);
    setNodeProgress(nextProgress);
    setAnswer({});
    setRunResult(null);
    setScreen("lesson");
    if (nextSession.mode !== "review") {
      await persistArcState(nextSession, nextProgress);
    }
  }, [nodeProgress, persistArcState, session]);

  const handleUseHeartRefill = useCallback(async () => {
    if (!session || !nodeProgress || !consumeHeartRefillCharge()) return;
    const nextSession = refillLessonHearts(session);
    const nextProgress = {
      ...nodeProgress,
      hearts: nextSession.hearts,
      updatedAt: nextSession.updatedAt,
    };
    setSession(nextSession);
    setNodeProgress(nextProgress);
    setScreen("lesson");
    if (nextSession.mode !== "review") {
      await persistArcState(nextSession, nextProgress);
    }
  }, [consumeHeartRefillCharge, nodeProgress, persistArcState, session]);

  const handleRevealHint = useCallback(async () => {
    if (!session || !displayedQuestion?.hint || hintVisible || !nodeProgress) return;

    const result = consumeLessonHint(session, displayedQuestion.id, {
      freeHintAvailable: hintTokenCount > 0 && !session.freeHintUsed,
      unlimitedHearts: lessonUnlimitedHearts,
    });

    if (result.consumedFreeHint) {
      consumeHintTokenCharge();
    }
    if (result.consumedHeart) {
      setLossFlashKey((current) => current + 1);
    }

    const nextProgress = {
      ...nodeProgress,
      hearts: result.session.hearts,
      updatedAt: result.session.updatedAt,
    };

    setSession(result.session);
    setNodeProgress(nextProgress);
    setHintVisible(true);
    if (result.session.mode !== "review") {
      await persistArcState(result.session, nextProgress);
    }

    if (result.failedLesson) {
      setScreen("failed");
    }
  }, [consumeHintTokenCharge, displayedQuestion, hintTokenCount, hintVisible, lessonUnlimitedHearts, nodeProgress, persistArcState, session]);

  const returnToLearnPath = useCallback(() => {
    const params = new URLSearchParams({ lang: node.language });
    if (!reviewMode) {
      params.set("celebrateNode", node.nodeId);
    }
    if (!reviewMode && lessonSummary?.arcComplete) {
      params.set("openArcChest", node.nodeId);
    }
    const href = `/learn?${params.toString()}`;

    if (typeof window !== "undefined") {
      if (completionNavigationTimeoutRef.current !== null) {
        window.clearTimeout(completionNavigationTimeoutRef.current);
      }
      completionNavigationTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, 3000);
    }

    void (async () => {
      try {
        await Promise.resolve();
        router.push(href);
      } catch (error) {
        console.error("[lesson-arc] failed to navigate back to learn", error);
        if (typeof window !== "undefined") {
          window.location.assign(href);
        }
      }
    })();
  }, [lessonSummary?.arcComplete, node.language, node.nodeId, reviewMode, router]);

  useEffect(() => {
    return () => {
      if (completionNavigationTimeoutRef.current !== null) {
        window.clearTimeout(completionNavigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!displayedQuestion || screen !== "lesson") return;
    const handler = (event: KeyboardEvent) => {
      if (feedback) {
        if (event.key === "Enter") {
          event.preventDefault();
          void handleFeedbackAdvance();
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 px-6 py-8 text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-white/42">Lesson unavailable</p>
          <h1 className="mt-4 text-3xl font-black">Could not load this lesson</h1>
          <p className="mt-3 text-base font-semibold leading-7 text-white/68">{loadError}</p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                bootstrapRef.current = null;
                setScreen("loading");
                void bootstrapLesson();
              }}
              className="flex h-12 flex-1 items-center justify-center rounded-[1.2rem] bg-[#58CC02] text-sm font-black uppercase tracking-[0.18em] text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.push(`/learn?lang=${node.language}`)}
              className="flex h-12 flex-1 items-center justify-center rounded-[1.2rem] border border-white/12 bg-white/6 text-sm font-black uppercase tracking-[0.18em] text-white/82"
            >
              Back to path
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "lesson-complete" && lessonSummary) {
    return (
      <LessonCompleteScreen
        lessonLabel={payload?.subtitle ?? node.lessonTitle}
        lessonNumber={lessonSummary.lessonIndex}
        completedLessonCount={lessonSummary.completedLessonCount}
        xpEarned={lessonSummary.xpEarned}
        correctCount={lessonSummary.correctCount}
        totalQuestions={lessonSummary.totalQuestions}
        perfect={lessonSummary.perfect}
        streakExtended={lessonSummary.streakExtended}
        reviewMode={lessonSummary.reviewMode}
        onContinue={returnToLearnPath}
      />
    );
  }

  if (screen === "arc-complete" && lessonSummary) {
    return (
      <ArcCompleteScreen
        nodeTitle={node.lessonTitle}
        totalArcXp={nodeProgress?.totalArcXpEarned ?? 0}
        streakExtended={lessonSummary.streakExtended}
        arcBonusXp={50}
        onContinue={returnToLearnPath}
      />
    );
  }

  if (loading || isHydrating || screen === "loading" || !displayedQuestion || !session || !payload || !nodeProgress) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-6 py-5 text-sm font-bold uppercase tracking-[0.22em] text-white/55">
            Loading lesson
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionNumber = Math.min(session.questions.length, session.questionIndex + (feedback ? 0 : 1));

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#101826] text-white"
      style={{
        color: pathTheme.surfaceText,
      }}
    >
      <div className="relative flex min-h-screen flex-col bg-[#101826]">
        <LessonTopBar
          accentColor={pathTheme.accentColor}
          lessonIndex={session.lessonIndex + 1}
          totalLessons={5}
          currentQuestion={currentQuestionNumber}
          totalQuestions={session.questions.length}
          hearts={session.hearts}
          unlimitedHearts={lessonUnlimitedHearts}
          onClose={() => router.push(`/learn?lang=${node.language}`)}
          lossFlashKey={lossFlashKey}
        />

        <main className="flex-1 px-4 pb-36 pt-8 md:px-8">
          <QuestionRenderer
            question={displayedQuestion}
            answer={answer}
            onChange={setAnswer}
            feedback={feedback}
            runResult={runResult}
            onRunCode={async () => {
              const codeValue = answer.codeValue ?? "";
              if (!displayedQuestion.testCases?.length || !codeValue) return;
              if (node.language === "python") {
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
            hintVisible={hintVisible}
            onRevealHint={handleRevealHint}
            hintEnabled={!session.usedHintQuestionIds.includes(displayedQuestion.id)}
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
              void handleFeedbackAdvance();
              return;
            }
            void handleCheck();
          }}
        />
      </div>

      {screen === "failed" ? (
        <LessonFailedScreen
          currentQuestion={Math.min(session.questions.length, session.questionIndex + 1)}
          totalQuestions={session.questions.length}
          hasHeartRefill={heartRefillCount > 0}
          onRetry={() => void handleRetryLesson()}
          onUseHeartRefill={() => void handleUseHeartRefill()}
        />
      ) : null}
    </div>
  );
}
