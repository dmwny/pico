"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LessonFeedbackBar from "@/components/lessonArc/LessonFeedbackBar";
import QuestionRenderer, { isQuestionAnswerReady } from "@/components/lessonArc/QuestionRenderer";
import { useThemeContext } from "@/contexts/ThemeContext";
import type { QuestionAttemptAnswer, QuestionEvaluation } from "@/lib/lessonArc/types";
import { evaluateQuestionAttempt } from "@/lib/lessonArc/engine";
import { isQuestionContent } from "@/lib/robloxCourse/types";
import {
  getAllRobloxCourseLessons,
  getCompletedRobloxCourseKeys,
  getRobloxCourseKey,
  getRobloxCourseNode,
  isRobloxCourseNodeUnlocked,
} from "@/lib/robloxCourse";
import { supabase } from "@/lib/supabase";
import { withAlpha } from "@/lib/themes";

function parseCompletedLessons(raw: unknown) {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function RobloxStudioLessonClient() {
  const params = useParams();
  const router = useRouter();
  const { pathTheme } = useThemeContext();
  const unitNumber = Number(params.unit ?? 0);
  const lessonNumber = Number(params.lesson ?? 0);
  const lesson = useMemo(() => getRobloxCourseNode(unitNumber, lessonNumber), [lessonNumber, unitNumber]);

  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [contentIndex, setContentIndex] = useState(0);
  const [answer, setAnswer] = useState<QuestionAttemptAnswer>({});
  const [feedback, setFeedback] = useState<QuestionEvaluation | null>(null);
  const [frozenQuestionId, setFrozenQuestionId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContentIndex(0);
    setAnswer({});
    setFeedback(null);
    setFrozenQuestionId(null);
    setFinished(false);
  }, [lessonNumber, unitNumber]);

  useEffect(() => {
    async function load() {
      if (!lesson) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("pico_progress")
        .select("completed_lessons")
        .eq("user_id", user.id)
        .eq("language", "lua")
        .maybeSingle();

      const parsed = getCompletedRobloxCourseKeys(parseCompletedLessons(data?.completed_lessons));
      if (!isRobloxCourseNodeUnlocked(parsed, unitNumber, lessonNumber)) {
        router.push("/labs/lua/roblox-studio");
        return;
      }

      setCompletedLessons(parsed);
      setLoading(false);
    }

    void load();
  }, [lesson, lessonNumber, router, unitNumber]);

  const content = lesson?.content ?? [];
  const questions = useMemo(() => content.filter(isQuestionContent), [content]);
  const currentItem = content[contentIndex] ?? null;
  const currentQuestion = currentItem && isQuestionContent(currentItem) ? currentItem : null;
  const displayedQuestion = feedback && frozenQuestionId
    ? questions.find((question) => question.id === frozenQuestionId) ?? currentQuestion
    : currentQuestion;
  const answerReady = displayedQuestion ? isQuestionAnswerReady(displayedQuestion, answer, null) : false;
  const questionNumber = useMemo(() => {
    if (!currentItem) return 0;
    const priorQuestions = content.slice(0, contentIndex).filter(isQuestionContent).length;
    if (!isQuestionContent(currentItem)) return priorQuestions;
    return priorQuestions + 1;
  }, [content, contentIndex, currentItem]);

  const nextLesson = useMemo(() => {
    const lessons = getAllRobloxCourseLessons();
    const currentIndex = lessons.findIndex((item) => item.unitNumber === unitNumber && item.lessonNumber === lessonNumber);
    return currentIndex >= 0 ? lessons[currentIndex + 1] ?? null : null;
  }, [lessonNumber, unitNumber]);

  async function markComplete() {
    const key = getRobloxCourseKey(unitNumber, lessonNumber);
    if (completedLessons.includes(key)) {
      setFinished(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSaving(true);
    const { data } = await supabase
      .from("pico_progress")
      .select("completed_lessons")
      .eq("user_id", user.id)
      .eq("language", "lua")
      .maybeSingle();

    const parsedLessons = parseCompletedLessons(data?.completed_lessons);
    const mergedLessons = [...new Set([...parsedLessons, key])];

    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        language: "lua",
        values: {
          completed_lessons: JSON.stringify(mergedLessons),
          last_played: new Date().toISOString().split("T")[0],
        },
      }),
    });

    setCompletedLessons(getCompletedRobloxCourseKeys(mergedLessons));
    setSaving(false);
    setFinished(true);
  }

  function handleCheck() {
    if (!displayedQuestion) return;
    const evaluation = evaluateQuestionAttempt(displayedQuestion, answer, 0, "lua", null);
    setFeedback(evaluation);
    setFrozenQuestionId(displayedQuestion.id);
  }

  async function handleContinue() {
    if (!feedback) return;

    if (!feedback.correct) {
      setFeedback(null);
      setFrozenQuestionId(null);
      setAnswer({});
      return;
    }

    const nextContentIndex = contentIndex + 1;
    if (nextContentIndex >= content.length) {
      await markComplete();
      return;
    }

    setContentIndex(nextContentIndex);
    setAnswer({});
    setFeedback(null);
    setFrozenQuestionId(null);
  }

  function handleCardContinue() {
    const nextContentIndex = contentIndex + 1;
    if (nextContentIndex >= content.length) {
      void markComplete();
      return;
    }
    setContentIndex(nextContentIndex);
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: pathTheme.surfaceBackground }}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-[1.6rem] border px-6 py-5 text-sm font-bold uppercase tracking-[0.22em]" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard, color: withAlpha(pathTheme.surfaceText, 0.55) }}>
            Loading lesson
          </div>
        </div>
      </main>
    );
  }

  if (!lesson || !currentItem) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ background: pathTheme.surfaceBackground }}>
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center rounded-[2rem] border px-6 py-8 text-center" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.42) }}>Lesson unavailable</p>
          <h1 className="mt-4 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>Could not load this Roblox lesson</h1>
          <button
            type="button"
            onClick={() => router.push("/labs/lua/roblox-studio")}
            className="mt-8 flex h-12 w-full items-center justify-center rounded-[1.2rem] text-sm font-black uppercase tracking-[0.18em]"
            style={{ background: pathTheme.accentColor, color: pathTheme.accentContrast }}
          >
            Back to map
          </button>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ background: pathTheme.surfaceBackground }}>
        <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center rounded-[2rem] border px-6 py-8 text-center" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em]" style={{ color: pathTheme.accentColor }}>Lesson complete</p>
          <h1 className="mt-4 text-4xl font-black" style={{ color: pathTheme.surfaceText }}>{lesson.node.concept.replace(/-/g, " ")}</h1>
          <p className="mt-3 max-w-xl text-base font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.7) }}>
            Finished all {questions.length} Roblox-specific questions for this concept.
          </p>
          <div className="mt-8 flex w-full max-w-xl flex-col gap-3">
            {nextLesson ? (
              <button
                type="button"
                onClick={() => router.push(`/labs/lua/roblox-studio/${nextLesson.unitNumber}/${nextLesson.lessonNumber}`)}
                className="flex h-12 w-full items-center justify-center rounded-[1.2rem] text-sm font-black uppercase tracking-[0.18em]"
                style={{ background: pathTheme.accentColor, color: pathTheme.accentContrast }}
              >
                Open next lesson
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/labs/lua/roblox-studio")}
              className="flex h-12 w-full items-center justify-center rounded-[1.2rem] border text-sm font-black uppercase tracking-[0.18em]"
              style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: withAlpha(pathTheme.surfaceBackground, 0.32), color: pathTheme.surfaceText }}
            >
              Back to map
            </button>
          </div>
          {saving ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.56) }}>Saving progress...</p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-36" style={{ background: pathTheme.surfaceBackground, color: pathTheme.surfaceText }}>
      <div className="sticky top-0 z-30 border-b px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: withAlpha(pathTheme.surfaceDark, 0.86) }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/labs/lua/roblox-studio")}
            className="flex h-11 w-11 items-center justify-center rounded-full border transition"
            style={{ borderColor: withAlpha("#ffffff", 0.12), background: withAlpha("#ffffff", 0.06), color: "#ffffff" }}
            aria-label="Back to Roblox Studio map"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: withAlpha("#ffffff", 0.1) }}>
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${((Math.max(questionNumber - 1, 0) + (feedback?.correct ? 1 : 0)) / Math.max(questions.length, 1)) * 100}%`,
                    background: pathTheme.accentColor,
                    boxShadow: `0 0 18px ${pathTheme.accentColor}`,
                  }}
                />
              </div>
              <p className="min-w-[4.8rem] text-right text-xs font-black tracking-[0.18em]" style={{ color: withAlpha("#ffffff", 0.78) }}>
                {Math.max(questionNumber, 0)} / {questions.length}
              </p>
            </div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: withAlpha("#ffffff", 0.58) }}>
              Unit {unitNumber} · {lesson.node.label} · {lesson.node.concept.replace(/-/g, " ")}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
        <div className="mb-6 rounded-[1.8rem] border px-5 py-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>{lesson.unit.title}</p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{lesson.node.concept.replace(/-/g, " ")}</h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.66) }}>
            {lesson.unit.description}
          </p>
        </div>

        {currentQuestion && displayedQuestion ? (
          <QuestionRenderer
            question={displayedQuestion}
            answer={answer}
            setAnswer={setAnswer}
            feedback={feedback}
            runResult={null}
            onRunCode={async () => {}}
            hintVisible={false}
            onRevealHint={() => {}}
            hintEnabled={Boolean(displayedQuestion.hint)}
          />
        ) : null}

        {!currentQuestion && currentItem?.type === "explain" ? (
          <div className="rounded-[2rem] border p-6 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>
              {currentItem.position === "start" ? "Explain card" : "Next step"}
            </p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{currentItem.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-base font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>
              {currentItem.body}
            </p>
            {currentItem.code ? (
              <pre className="mt-5 overflow-x-auto rounded-[1.5rem] border px-4 py-4 font-mono text-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: pathTheme.surfaceDark, color: "#f8fafc" }}>
                <code>{currentItem.code}</code>
              </pre>
            ) : null}
            <a
              href={currentItem.docUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-[1.1rem] border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
              style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), color: pathTheme.accentColor, background: withAlpha(pathTheme.accentColor, 0.08) }}
            >
              Open docs
            </a>
            <button
              type="button"
              onClick={handleCardContinue}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[1.2rem] text-sm font-black uppercase tracking-[0.18em]"
              style={{ background: pathTheme.accentColor, color: pathTheme.accentContrast }}
            >
              Got it
            </button>
          </div>
        ) : null}

        {!currentQuestion && currentItem?.type === "mini_project" ? (
          <div className="rounded-[2rem] border p-6 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>Mini project</p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{currentItem.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-base font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>
              {currentItem.description}
            </p>
            <div className="mt-5 rounded-[1.4rem] border px-4 py-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: withAlpha(pathTheme.surfaceBackground, 0.4) }}>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.48) }}>Hint</p>
              <p className="mt-2 text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>{currentItem.hint}</p>
            </div>
            <a
              href={currentItem.docUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-[1.1rem] border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
              style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), color: pathTheme.accentColor, background: withAlpha(pathTheme.accentColor, 0.08) }}
            >
              Open docs
            </a>
            <button
              type="button"
              onClick={handleCardContinue}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[1.2rem] text-sm font-black uppercase tracking-[0.18em]"
              style={{ background: pathTheme.accentColor, color: pathTheme.accentContrast }}
            >
              Finish lesson
            </button>
          </div>
        ) : null}
      </div>

      {currentQuestion && displayedQuestion ? (
        <LessonFeedbackBar
          key={`${displayedQuestion.id}:${feedback ? (feedback.correct ? "correct" : "wrong") : "idle"}`}
          mode={feedback ? (feedback.correct ? "correct" : "wrong") : "idle"}
          accentColor={pathTheme.accentColor}
          disabled={!feedback && !answerReady}
          correctAnswer={feedback && !feedback.correct ? feedback.displayCorrectAnswer : undefined}
          xpAwarded={undefined}
          label={feedback ? (feedback.correct ? "Correct" : "Try again") : "Roblox Studio"}
          explanation={feedback?.explanation}
          alwaysShowExplanation={Boolean(feedback)}
          primaryLabel={feedback ? (feedback.correct ? "Continue" : "Retry") : "Check"}
          onPrimaryAction={() => {
            if (feedback) {
              void handleContinue();
              return;
            }
            handleCheck();
          }}
        />
      ) : null}
    </main>
  );
}
