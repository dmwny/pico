"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Pico from "@/components/Pico";
import { supabase } from "@/lib/supabase";
import {
  SUPPORTED_LANGUAGES,
  type LearningLanguage,
  getCourseSections,
  getMiniCourses,
} from "@/lib/courseContent";
import { getApiMiniCourseKey, getApiMiniCourseLessons } from "@/lib/apiMiniCourses";
import { enableInfiniteGems } from "@/lib/devCheats";
import { getTurtleLessonKey, getTurtleLessons } from "@/lib/turtleCourse";
import { setStoredActiveLanguage, setStoredLanguageProgress } from "@/lib/progress";

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

function unique(values: string[]) {
  return [...new Set(values)];
}

function getMainCourseKeys(language: LearningLanguage) {
  return getCourseSections(language).flatMap((section) =>
    section.units.flatMap((unit) => unit.lessons.map((lesson) => `${unit.id}-${lesson.id}`))
  );
}

function getMiniCourseKeys(language: LearningLanguage) {
  const liveCourses = getMiniCourses(language).filter((course) => course.status === "live");

  return liveCourses.flatMap((course) =>
    getApiMiniCourseLessons(language, course.id).map((lesson) =>
      getApiMiniCourseKey(language, course.id, lesson.unitId, lesson.lessonId)
    )
  );
}

function getLanguageCompletionKeys(language: LearningLanguage) {
  const keys = [...getMainCourseKeys(language), ...getMiniCourseKeys(language)];

  if (language === "python") {
    keys.push(...getTurtleLessons().map((lesson) => getTurtleLessonKey(lesson.unitId, lesson.lessonId)));
  }

  return unique(keys);
}

export default function CompleteAllClient() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Preparing your account...");

  useEffect(() => {
    let cancelled = false;

    async function unlockAll() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Sign in first, then open this page again.");
        }
        return;
      }

      setStoredActiveLanguage(user.id, "python");

      for (const language of SUPPORTED_LANGUAGES) {
        if (cancelled) return;

        setMessage(`Completing ${language}...`);

        const { data: existing } = await supabase
          .from("pico_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("language", language)
          .maybeSingle();

        const mergedLessons = unique([
          ...parseCompletedLessons(existing?.completed_lessons),
          ...getLanguageCompletionKeys(language),
        ]);

        const values = {
          completed_lessons: JSON.stringify(mergedLessons),
          last_played: new Date().toISOString().split("T")[0],
          xp: Number(existing?.xp || 0),
          streak: Number(existing?.streak || 0),
          achievements: typeof existing?.achievements === "string" ? existing.achievements : JSON.stringify(existing?.achievements ?? []),
          today_xp: Number(existing?.today_xp || 0),
          today_lessons: Number(existing?.today_lessons || 0),
          today_perfect: Number(existing?.today_perfect || 0),
        };

        const response = await fetch("/api/progress", {
          method: "POST",
          body: JSON.stringify({
            userId: user.id,
            language,
            values,
          }),
        });

        if (!response.ok) {
          if (!cancelled) {
            setStatus("error");
            setMessage(`Could not update ${language}.`);
          }
          return;
        }

        setStoredLanguageProgress(user.id, language, {
          language,
          completed_lessons: mergedLessons,
          xp: values.xp,
          streak: values.streak,
          achievements: parseCompletedLessons(values.achievements),
          today_xp: values.today_xp,
          today_lessons: values.today_lessons,
          today_perfect: values.today_perfect,
          last_played: values.last_played,
        });
      }

      enableInfiniteGems(user.id);

      if (!cancelled) {
        setStatus("success");
        setMessage("Your account now has every lesson marked complete and infinite gems enabled.");
      }
    }

    void unlockAll();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <Pico size={92} mood={status === "error" ? "sad" : "happy"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Account tools</p>
            <h1 className="mt-3 text-4xl font-black text-gray-900">Complete all lessons</h1>
            <p className="mt-3 text-base font-semibold leading-7 text-gray-600">{message}</p>
          </div>
        </div>

        <div className={`mt-8 rounded-[1.5rem] border px-4 py-4 text-sm font-bold ${
          status === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : status === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gray-100 bg-gray-50 text-gray-600"
        }`}>
          {status === "loading"
            ? "Updating your course rows in Supabase and local progress."
            : status === "success"
              ? "Done. Open Learn or Shop to use infinite gems."
              : "The unlock step did not finish."}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="rounded-[1.4rem] bg-green-500 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-green-600"
          >
            Open Learn
          </Link>
          <Link
            href="/"
            className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Open Home
          </Link>
        </div>
      </div>
    </main>
  );
}
