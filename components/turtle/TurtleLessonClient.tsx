"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import {
  fillTurtleCode,
  getCompletedTurtleKeys,
  getTurtleLesson,
  getTurtleLessonKey,
  getTurtleLessons,
  isTurtleLessonUnlocked,
} from "@/lib/turtleCourse";
import { runTurtleProgram, type TurtleRunResult } from "@/lib/turtleRuntime";

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

export default function TurtleLessonPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = Number(params.unit as string);
  const lessonId = Number(params.lesson as string);
  const lesson = useMemo(() => getTurtleLesson(unitId, lessonId), [lessonId, unitId]);
  const allLessons = useMemo(() => getTurtleLessons(), []);
  const lessonIndex = allLessons.findIndex((item) => item.unitId === unitId && item.lessonId === lessonId);
  const nextLesson = lessonIndex >= 0 ? allLessons[lessonIndex + 1] : null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<TurtleRunResult>({
    commands: 0,
    output: [],
    error: null,
  });

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
        .eq("language", "python")
        .maybeSingle();

      const parsed = getCompletedTurtleKeys(parseCompletedLessons(data?.completed_lessons));
      if (!isTurtleLessonUnlocked(parsed, unitId, lessonId)) {
        router.push("/labs/python/turtle");
        return;
      }

      setCompletedLessons(parsed);
      setLoading(false);
    }

    load();
  }, [lesson, lessonId, router, unitId]);

  useEffect(() => {
    if (!lesson || !canvasRef.current) return;
    const previewCode = fillTurtleCode(lesson.codeLines, selectedTiles, lesson.previewDefaults).join("\n");
    setResult(runTurtleProgram(previewCode, canvasRef.current));
  }, [lesson, selectedTiles]);

  if (!lesson) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">Turtle lesson not found.</p>
        </div>
      </main>
    );
  }

  const blankCount = lesson.answer.length;
  const availableTiles = lesson.tiles.filter((tile, index) => {
    const selectedCount = selectedTiles.filter((item) => item === tile).length;
    const tileCount = lesson.tiles.slice(0, index + 1).filter((item) => item === tile).length;
    return selectedCount < tileCount;
  });

  const filledCodeLines = fillTurtleCode(lesson.codeLines, selectedTiles, Array(blankCount).fill("___"));
  const progressPercent = ((lessonIndex + 1) / Math.max(allLessons.length, 1)) * 100;

  async function handleCorrect() {
    const key = getTurtleLessonKey(unitId, lessonId);
    if (completedLessons.includes(key)) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSaving(true);

    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", "python")
      .maybeSingle();

    const parsedLessons = parseCompletedLessons(data?.completed_lessons);
    const mergedLessons = [...new Set([...parsedLessons, key])];

    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        language: "python",
        values: {
          completed_lessons: JSON.stringify(mergedLessons),
          last_played: new Date().toISOString().split("T")[0],
        },
      }),
    });

    setCompletedLessons((current) => [...new Set([...current, key])]);
    setSaving(false);
  }

  async function checkAnswer() {
    if (!lesson) return;
    const correct = lesson.answer.every((value, index) => selectedTiles[index] === value);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      await handleCorrect();
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/labs/python/turtle")}
              className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-400 transition hover:text-gray-600"
            >
              Back
            </button>
            <a
              href="/learn"
              className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-400 transition hover:text-gray-600"
            >
              Exit mini course
            </a>
          </div>
          <div className="flex min-w-[16rem] items-center gap-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-sm font-extrabold text-gray-500">
              {lessonIndex + 1}/{allLessons.length}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <Pico size={100} mood="happy" />
              <div className="min-w-0 flex-1 rounded-[1.75rem] border border-gray-100 bg-white px-6 py-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-green-500">Unit {lesson.unitId}</p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">{lesson.title}</h1>
                <p className="mt-3 text-base font-semibold leading-7 text-gray-600">{lesson.prompt}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-gray-100 bg-[#161d2b] p-5 text-green-400 shadow-sm">
              {filledCodeLines.map((line, index) => (
                <div key={`${line}-${index}`} className="mb-1 flex gap-3 font-mono text-[15px] leading-7 last:mb-0">
                  <span className="w-5 text-right text-white/40">{index + 1}</span>
                  <span className="whitespace-pre-wrap">{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Answer slots</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {Array.from({ length: blankCount }, (_, index) => {
                  const value = selectedTiles[index];
                  return (
                    <button
                      key={`slot-${index}`}
                      type="button"
                      onClick={() => {
                        if (!value) return;
                        setSelectedTiles((current) => current.filter((_, tileIndex) => tileIndex !== index));
                        setFeedback("idle");
                      }}
                      className={`min-w-[6rem] rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-sm transition ${
                        value
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-300"
                      }`}
                    >
                      {value || "Select"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {availableTiles.map((tile, index) => (
                <button
                  key={`${tile}-${index}`}
                  type="button"
                  onClick={() => {
                    if (selectedTiles.length >= blankCount) return;
                    setSelectedTiles((current) => [...current, tile]);
                    setFeedback("idle");
                  }}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300"
                >
                  {tile}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={selectedTiles.length !== blankCount || saving || loading}
                onClick={checkAnswer}
                className="rounded-[1.4rem] bg-green-500 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-200"
              >
              {saving ? "Saving..." : "Check"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTiles([]);
                  setFeedback("idle");
                }}
                className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Reset
              </button>
              {feedback === "correct" ? (
                <a
                  href="/labs/python/turtle"
                  className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Finish lesson
                </a>
              ) : null}
              {feedback === "correct" && nextLesson ? (
                <a
                  href={`/labs/python/turtle/${nextLesson.unitId}/${nextLesson.lessonId}`}
                  className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Next
                </a>
              ) : null}
            </div>

            <div
              className={`mt-5 rounded-[1.5rem] border px-4 py-4 text-sm font-bold ${
                feedback === "correct"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : feedback === "wrong"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-gray-100 bg-gray-50 text-gray-500"
              }`}
            >
              {feedback === "correct"
                ? "Correct. The Turtle preview now matches the target move."
                : feedback === "wrong"
                  ? "Not quite. Watch the preview and compare the movement to the prompt."
                  : lesson.note}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-gray-100 bg-[#161d2b] p-5 text-white shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">Preview</p>
                  <h2 className="mt-3 text-3xl font-black">Turtle canvas</h2>
                </div>
                <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">
                  Live
                </span>
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#0f1520] p-3">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={480}
                  className="h-auto w-full rounded-[1rem] border border-white/10 bg-[#f7f3ea]"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Commands</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{result.commands}</p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Output</p>
                <p className="mt-2 text-sm font-bold text-gray-600">{result.output.length > 0 ? result.output.join(" | ") : "No print output."}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">How it reacts</p>
              <div className="mt-4 space-y-2 text-sm font-semibold leading-6 text-gray-600">
                <p>The preview uses your current tile selections, not just the final answer.</p>
                <p>If you pick the wrong turn or distance, the Turtle moves the wrong way immediately.</p>
                <p>That makes each lesson feel closer to the real drawing output instead of a static quiz.</p>
              </div>
            </div>

            {result.error ? (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700 shadow-sm">
                {result.error}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
