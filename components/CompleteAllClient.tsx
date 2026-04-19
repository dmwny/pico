"use client";

import { useState } from "react";
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
import { buildUpdatedUserMetadata, enableInfiniteGems, getDefaultDevCheatState } from "@/lib/devCheats";
import { setStoredDevLeagueOverride } from "@/lib/devLeagueOverride";
import { getAllRobloxCourseLessons, getRobloxCourseKey } from "@/lib/robloxCourse";
import { getTurtleLessonKey, getTurtleLessons } from "@/lib/turtleCourse";
import { setStoredActiveLanguage, setStoredLanguageProgress } from "@/lib/progress";
import { useUserStore } from "@/store/userStore";

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

  const apiMiniCourseKeys = liveCourses
    .filter((course) => !(language === "lua" && course.id === "roblox-studio"))
    .flatMap((course) =>
    getApiMiniCourseLessons(language, course.id).map((lesson) =>
      getApiMiniCourseKey(language, course.id, lesson.unitId, lesson.lessonId)
    )
  );

  if (language !== "lua") return apiMiniCourseKeys;

  const robloxKeys = getAllRobloxCourseLessons().map((lesson) =>
    getRobloxCourseKey(lesson.unitNumber, lesson.lessonNumber)
  );

  return unique([...apiMiniCourseKeys, ...robloxKeys]);
}

function getLanguageCompletionKeys(language: LearningLanguage) {
  const keys = [...getMainCourseKeys(language), ...getMiniCourseKeys(language)];

  if (language === "python") {
    keys.push(...getTurtleLessons().map((lesson) => getTurtleLessonKey(lesson.unitId, lesson.lessonId)));
  }

  return unique(keys);
}

const DEV_LEAGUE_OPTIONS = [
  { id: 1, name: "Bronze" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Gold" },
  { id: 4, name: "Sapphire" },
  { id: 5, name: "Ruby" },
  { id: 6, name: "Emerald" },
  { id: 7, name: "Amethyst" },
  { id: 8, name: "Pearl" },
  { id: 9, name: "Obsidian" },
  { id: 10, name: "Diamond" },
] as const;

export default function CompleteAllClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Pick one action for this account.");
  const [activeAction, setActiveAction] = useState<"unlock" | "gems" | "league" | "nothing" | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(3);
  const hydrateUserStore = useUserStore((state) => state.hydrate);

  async function getSignedInUser() {
    const [{ data: authUser }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    const user = authUser.user;
    const accessToken = sessionData.session?.access_token ?? null;

    if (!user) {
      setStatus("error");
      setMessage("Sign in first, then open this page again.");
      return null;
    }

    return { user, accessToken };
  }

  async function handleUnlockAllCourses() {
    const auth = await getSignedInUser();
    if (!auth) return;
    const { user } = auth;

    setStatus("loading");
    setActiveAction("unlock");
    setMessage("Unlocking every course...");
    setStoredActiveLanguage(user.id, "python");

    for (const language of SUPPORTED_LANGUAGES) {
      setMessage(`Unlocking ${language}...`);

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
        setStatus("error");
        setMessage(`Could not update ${language}.`);
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

    setStatus("success");
    setMessage("Every course is now unlocked for this account.");
  }

  async function handleEnableInfiniteGems() {
    const auth = await getSignedInUser();
    if (!auth) return;
    const { user } = auth;

    setStatus("loading");
    setActiveAction("gems");
    setMessage("Enabling infinite gems...");

    const nextDevCheats = {
      ...getDefaultDevCheatState(),
      infiniteGems: true,
    };

    const { error: metadataError } = await supabase.auth.updateUser({
      data: buildUpdatedUserMetadata(user.user_metadata, nextDevCheats),
    });

    if (metadataError) {
      setStatus("error");
      setMessage("Infinite gems could not be synced to your account.");
      return;
    }

    enableInfiniteGems(user.id);
    setStatus("success");
    setMessage("Infinite gems are now enabled.");
  }

  async function handleSetLeagueTier() {
    const auth = await getSignedInUser();
    if (!auth) return;
    const { user, accessToken } = auth;

    const selectedLeague = DEV_LEAGUE_OPTIONS.find((league) => league.id === selectedLeagueId) ?? DEV_LEAGUE_OPTIONS[0];

    setStatus("loading");
    setActiveAction("league");
    setMessage(`Moving this account into ${selectedLeague.name} League...`);

    const lowerTier = selectedLeague.name.toLowerCase();
    const response = await fetch("/api/dev/set-league", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        leagueId: selectedLeague.id,
        leagueTier: lowerTier,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setStoredDevLeagueOverride(user.id, {
        leagueId: selectedLeague.id,
        leagueTier: lowerTier,
      });
      hydrateUserStore({
        leagueTier: lowerTier,
        highestLeagueTier: lowerTier,
      });
      setStatus("success");
      setMessage(payload?.error
        ? `Applied ${selectedLeague.name} locally for testing. Remote league sync still failed.`
        : `Applied ${selectedLeague.name} locally for testing.`);
      return;
    }
    const payload = await response.json().catch(() => null) as { warning?: string } | null;
    setStoredDevLeagueOverride(user.id, {
      leagueId: selectedLeague.id,
      leagueTier: lowerTier,
    });

    hydrateUserStore({
      leagueTier: lowerTier,
      highestLeagueTier: lowerTier,
    });

    setStatus("success");
    setMessage(payload?.warning ?? `This account is now set to ${selectedLeague.name} League.`);
  }

  function handleDoNothing() {
    setActiveAction("nothing");
    setStatus("success");
    setMessage("No changes made.");
  }

  const busy = status === "loading";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <Pico size={92} mood={status === "error" ? "sad" : "happy"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Account tools</p>
            <h1 className="mt-3 text-4xl font-black text-gray-900">Choose an action</h1>
            <p className="mt-3 text-base font-semibold leading-7 text-gray-600">{message}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void handleUnlockAllCourses()}
            disabled={busy}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              activeAction === "unlock"
                ? "border-green-300 bg-green-50"
                : "border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/50"
            } ${busy ? "cursor-wait opacity-70" : ""}`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-900">Unlock All Courses</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Marks all supported lessons and mini-courses complete.
            </p>
          </button>

          <button
            type="button"
            onClick={() => void handleEnableInfiniteGems()}
            disabled={busy}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              activeAction === "gems"
                ? "border-sky-300 bg-sky-50"
                : "border-gray-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
            } ${busy ? "cursor-wait opacity-70" : ""}`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-900">Infinite Gems</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Enables the dev cheat without changing course completion.
            </p>
          </button>

          <div
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              activeAction === "league"
                ? "border-violet-300 bg-violet-50"
                : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
            } ${busy ? "opacity-70" : ""}`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-900">Set League</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Force this account into a specific league tier for testing unlocks and league cosmetics.
            </p>
            <select
              value={selectedLeagueId}
              disabled={busy}
              onChange={(event) => setSelectedLeagueId(Number(event.target.value))}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800"
            >
              {DEV_LEAGUE_OPTIONS.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleSetLeagueTier()}
              disabled={busy}
              className={`mt-3 w-full rounded-[1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] ${
                busy ? "cursor-wait bg-violet-200 text-violet-700" : "bg-violet-500 text-white hover:bg-violet-600"
              }`}
            >
              Apply League
            </button>
          </div>

          <button
            type="button"
            onClick={handleDoNothing}
            disabled={busy}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              activeAction === "nothing"
                ? "border-gray-300 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            } ${busy ? "cursor-wait opacity-70" : ""}`}
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-900">Do Nothing</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
              Leaves the account exactly as it is.
            </p>
          </button>
        </div>

        <div className={`mt-8 rounded-[1.5rem] border px-4 py-4 text-sm font-bold ${
          status === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : status === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gray-100 bg-gray-50 text-gray-600"
        }`}>
          {status === "idle"
            ? "Choose one of the actions above."
            : status === "loading"
              ? activeAction === "unlock"
                ? "Updating your course rows in Supabase and local progress."
                : activeAction === "gems"
                  ? "Syncing your dev-cheat settings."
                  : "Updating your league membership and profile tier."
            : status === "success"
              ? activeAction === "unlock"
                ? "Done. Open Learn to see the unlocked course map."
                : activeAction === "gems"
                  ? "Done. Open Shop or Learn to use infinite gems."
                  : activeAction === "league"
                    ? "Done. Open Leagues or Shop to verify rank rewards and league cosmetics."
                  : "No account changes were applied."
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
