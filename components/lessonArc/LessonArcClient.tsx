"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { checkAchievements } from "@/lib/achievements";
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
}: {
  unitId: string;
  lessonId: string;
  requestedLanguage: string | null;
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
  } | null>(null);
  const bootstrapRef = useRef<string | null>(null);

  const activeQuestion = getActiveQuestion(session);
  const displayedQuestion = feedback && frozenQuestion ? frozenQuestion : activeQuestion;
  const answerReady = displayedQuestion ? isQuestionAnswerReady(displayedQuestion, answer, runResult) : false;
  const timezone = progress?.streak_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lessonUnlimitedHearts = unlimitedHeartsActive || xpBoostActive;
  const [loadError, setLoadError] = useState<string | null>(null);

  const persistArcState = useCallback(async (nextSession: LessonArcSession | null, nextNodeProgress: LessonArcNodeProgress, extra: Partial<typeof progress> = {}) => {
    if (!progress) return null;
    const nextArcProgress = upsertNodeProgress(progress.arc_progress, nextNodeProgress);
    return updateProgress(
      {
        arc_progress: nextArcProgress,
        active_lesson_session: nextSession,
        ...extra,
      },
      { syncRemote: true, language: node.language },
    );
  }, [node.language, progress, updateProgress]);

  const bootstrapLesson = useCallback(async () => {
    if (!viewerId || !progress) return;
    setLoadError(null);
    if (progress.completed_lessons.includes(node.nodeId) && !matchingSession) {
      console.warn("[lesson-arc] node is already marked completed; starting review session instead of redirecting", {
        nodeId: node.nodeId,
        concept: node.concept,
        difficulty: (nodeProgressFromStore?.lessonIndex ?? 0) + 1,
        completedLessons: progress.completed_lessons,
      });
    }

    if (matchingSession?.questions?.length) {
      const titlePayload: LessonArcPayload = {
        node,
        lessonIndex: matchingSession.lessonIndex,
        title: node.lessonTitle,
        subtitle: `Lesson ${matchingSession.lessonIndex + 1}`,
        questions: matchingSession.questions,
      };
      setPayload(titlePayload);
      setSession(matchingSession);
      setNodeProgress(nodeProgressFromStore ?? buildNodeProgressFromSession(matchingSession, nodeProgressFromStore));
      setScreen("lesson");
      return;
    }

    const lessonIndex = nodeProgressFromStore?.status === "in_progress" ? nodeProgressFromStore.lessonIndex : 0;
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
    });
    const nextNodeProgress = {
      ...(nodeProgressFromStore ?? createEmptyNodeProgress(node)),
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
    await persistArcState(nextSession, nextNodeProgress);
  }, [lessonId, matchingSession, node, nodeProgressFromStore, persistArcState, progress, unitId, viewerId]);

  useEffect(() => {
    if (loading || isHydrating || !viewerId || !progress) return;
    const bootKey = `${node.nodeId}:${matchingSession?.updatedAt ?? nodeProgressFromStore?.updatedAt ?? "fresh"}`;
    if (bootstrapRef.current === bootKey) return;
    bootstrapRef.current = bootKey;
    void bootstrapLesson();
  }, [bootstrapLesson, isHydrating, loading, matchingSession?.updatedAt, node.nodeId, nodeProgressFromStore?.updatedAt, progress, viewerId]);

  useEffect(() => {
    setAnswer({});
    setRunResult(null);
    setHintVisible(false);
  }, [session?.questionIndex]);

  const applyCompletionRewards = useCallback(async (advance: Extract<LessonAdvanceResult, { kind: "lesson_complete" }>) => {
    if (!progress) return { streakExtended: false };
    const lessonXp = advance.session.xpEarned + advance.perfectBonusXp;
    const completedLessons = advance.lessonPassed
      ? [...new Set([...progress.completed_lessons, node.nodeId])]
      : progress.completed_lessons;
    const todayDate = getLocalDateKey(timezone);
    const baseSnapshot = applyProgressPatch(progress, node.language, {
      arc_progress: upsertNodeProgress(progress.arc_progress, advance.nodeProgress),
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
    const persistedProgress = streakResult?.progress ?? await saveProgressSnapshot(baseSnapshot, { language: node.language, syncRemote: true });

    if (persistedProgress) {
      const earnedNow = checkAchievements(
        persistedProgress.completed_lessons,
        persistedProgress.xp,
        persistedProgress.streak,
        advance.perfectBonusXp > 0,
        Math.max(1, Math.round((Date.now() - Date.parse(advance.session.startedAt)) / 1000)),
        advance.session.correctCount,
        persistedProgress.today_perfect,
      );
      const newAchievements = earnedNow.filter((id) => !persistedProgress.achievements.includes(id));
      if (newAchievements.length > 0) {
        await updateProgress(
          { achievements: [...persistedProgress.achievements, ...newAchievements] },
          { language: node.language, syncRemote: true },
        );
      }
    }

    return {
      streakExtended: (streakResult?.progress?.streak ?? streakBefore) > streakBefore,
    };
  }, [applyQualifiedStreakActivity, node.language, node.nodeId, progress, saveProgressSnapshot, timezone, updateProgress]);

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
    const evaluation = xpBoostActive && rawEvaluation.correct
      ? {
          ...rawEvaluation,
          xpAwarded: rawEvaluation.xpAwarded * 2,
          speedBonusAwarded: rawEvaluation.speedBonusAwarded * 2,
        }
      : rawEvaluation;
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
      setLessonSummary({
        xpEarned: advance.session.xpEarned + advance.perfectBonusXp,
        correctCount: advance.session.correctCount,
        totalQuestions: advance.session.questions.length,
        perfect: advance.perfectBonusXp > 0,
        streakExtended: rewards.streakExtended,
        arcComplete: advance.lessonPassed,
      });
      return;
    }

    await persistArcState(advance.session, advance.nodeProgress);
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
    await persistArcState(nextSession, nextProgress);
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
    await persistArcState(nextSession, nextProgress);
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
    await persistArcState(result.session, nextProgress);

    if (result.failedLesson) {
      setScreen("failed");
    }
  }, [consumeHintTokenCharge, displayedQuestion, hintTokenCount, hintVisible, lessonUnlimitedHearts, nodeProgress, persistArcState, session]);

  const returnToLearnPath = useCallback(() => {
    const params = new URLSearchParams({
      lang: node.language,
      celebrateNode: node.nodeId,
      openChest: String(node.unitId),
    });
    router.push(`/learn?${params.toString()}`);
  }, [node.language, node.nodeId, node.unitId, router]);

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
          setAnswer({ optionIndex: index, optionValue: option, booleanValue: index === 0 });
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

      {screen === "lesson-complete" && lessonSummary ? (
        <LessonCompleteScreen
          lessonLabel={payload.subtitle}
          xpEarned={lessonSummary.xpEarned}
          correctCount={lessonSummary.correctCount}
          totalQuestions={lessonSummary.totalQuestions}
          perfect={lessonSummary.perfect}
          streakExtended={lessonSummary.streakExtended}
          onContinue={() => router.push(`/learn?lang=${node.language}`)}
        />
      ) : null}

      {screen === "arc-complete" && lessonSummary ? (
        <ArcCompleteScreen
          nodeTitle={node.lessonTitle}
          totalArcXp={(progress?.arc_progress?.[node.nodeId]?.totalArcXpEarned ?? nodeProgress.totalArcXpEarned) + (lessonSummary.perfect ? 25 : 0)}
          streakExtended={lessonSummary.streakExtended}
          onContinue={returnToLearnPath}
        />
      ) : null}

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
