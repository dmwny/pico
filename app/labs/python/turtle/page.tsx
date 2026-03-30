"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import { getCompletedTurtleKeys, getTurtleLessonKey, getTurtleUnits, isTurtleLessonUnlocked } from "@/lib/turtleCourse";

const PATH_POSITIONS = ["ml-20", "ml-36", "ml-52", "ml-36", "ml-20"];

export default function TurtleMapPage() {
  const units = useMemo(() => getTurtleUnits(), []);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
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

      const completed = (() => {
        if (!data?.completed_lessons) return [];
        try {
          const parsed = JSON.parse(data.completed_lessons);
          return Array.isArray(parsed) ? getCompletedTurtleKeys(parsed) : [];
        } catch {
          return [];
        }
      })();

      setCompletedLessons(completed);
      setLoading(false);
    }

    loadProgress();
  }, []);

  const completedCount = completedLessons.length;
  const totalLessons = units.flatMap((unit) => unit.lessons).length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-green-500">Mini course</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] text-gray-900">Turtle Graphics</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-gray-600">
              Learn Turtle with a short Python track and a live drawing preview in every lesson.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-gray-100 bg-green-50 p-4">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em] text-green-600">Units</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{units.length}</p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em] text-gray-400">Lessons</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{totalLessons}</p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em] text-gray-400">Complete</p>
                <p className="mt-2 text-3xl font-black text-gray-900">{completedCount}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-gray-400">Preview</p>
                <h2 className="mt-3 text-3xl font-black text-gray-900">Open the course map</h2>
              </div>
              <Pico size={84} mood="happy" />
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-gray-100 bg-gray-50 p-4">
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(completedCount / Math.max(totalLessons, 1)) * 100}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-gray-600">
                {completedCount}/{totalLessons} turtle lessons complete
              </p>
            </div>
            <a
              href={`/labs/python/turtle/1/1`}
              className="mt-6 inline-flex rounded-[1.4rem] bg-green-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-green-600"
            >
              Open first lesson
            </a>
            <a
              href="/learn"
              className="mt-3 inline-flex rounded-[1.4rem] border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Exit mini course
            </a>
          </aside>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            {loading ? (
              <div className="flex min-h-[20rem] items-center justify-center rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                <div className="text-sm font-bold text-gray-400">Loading Turtle progress...</div>
              </div>
            ) : (
              units.map((unit) => (
                <div key={unit.id} className="mb-10">
                  <div className="mb-6 rounded-[2rem] border border-green-200 bg-green-500 px-6 py-5 text-white shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-green-100">Unit {unit.id}</p>
                        <h3 className="mt-2 text-3xl font-black">{unit.title}</h3>
                        <p className="mt-2 text-sm font-semibold text-green-50">{unit.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-green-600">
                        {unit.lessons.filter((lesson) => completedLessons.includes(getTurtleLessonKey(unit.id, lesson.lessonId))).length}/{unit.lessons.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {unit.lessons.map((lesson, index) => {
                      const key = getTurtleLessonKey(unit.id, lesson.lessonId);
                      const isComplete = completedLessons.includes(key);
                      const isUnlocked = isTurtleLessonUnlocked(completedLessons, unit.id, lesson.lessonId);
                      const offset = PATH_POSITIONS[(index + unit.id) % PATH_POSITIONS.length];

                      return (
                        <div key={key} className={offset}>
                          {isUnlocked ? (
                            <a href={`/labs/python/turtle/${unit.id}/${lesson.lessonId}`} className="group block w-fit">
                              <div
                                className={`flex h-20 w-20 items-center justify-center rounded-full border-[6px] shadow-lg transition ${
                                  isComplete
                                    ? "border-green-600 bg-green-500 text-white"
                                    : "border-green-200 bg-white text-green-500 group-hover:-translate-y-1"
                                }`}
                              >
                                {isComplete ? (
                                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="text-2xl font-black">{lesson.lessonId}</span>
                                )}
                              </div>
                              <div className="mt-3 w-56 rounded-[1.5rem] border border-gray-100 bg-white px-4 py-4 shadow-sm">
                                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Lesson {lesson.lessonId}</p>
                                <p className="mt-1 text-xl font-black text-gray-900">{lesson.title}</p>
                                <p className="mt-1 text-sm font-semibold text-gray-500">{lesson.subtitle}</p>
                              </div>
                            </a>
                          ) : (
                            <div className="w-fit opacity-60">
                              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-gray-200 bg-gray-100 text-gray-400 shadow-sm">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 10-8 0v4m-1 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                                </svg>
                              </div>
                              <div className="mt-3 w-56 rounded-[1.5rem] border border-gray-100 bg-white px-4 py-4 shadow-sm">
                                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-300">Lesson {lesson.lessonId}</p>
                                <p className="mt-1 text-xl font-black text-gray-500">{lesson.title}</p>
                                <p className="mt-1 text-sm font-semibold text-gray-400">Finish the earlier lesson first.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-gray-400">Course notes</p>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-gray-600">
              <p>Each lesson asks one Turtle question.</p>
              <p>The preview canvas updates while you fill the blanks.</p>
              <p>Turtle progress saves into your Python progress row, so it can sync without a new table.</p>
            </div>
            <a
              href="/learn"
              className="mt-5 inline-flex rounded-[1.4rem] border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Exit mini course
            </a>
          </aside>
        </section>
      </div>
    </main>
  );
}
