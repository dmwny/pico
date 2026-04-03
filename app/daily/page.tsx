"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getStoredLanguageProgress,
  mergeProgressSources,
  resolveActiveLanguage,
  setStoredLanguageProgress,
} from "@/lib/progress";
import AppTopNav from "@/components/AppTopNav";
import MobileDock from "@/components/MobileDock";
import { getLanguageCommentPrefix, getLanguageLabel, type LearningLanguage } from "@/lib/courseContent";
import { useCosmetics } from "@/contexts/CosmeticsContext";

function getDayKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function normalizeDayKey(value: string | null | undefined) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : getDayKey(parsed);
}

function getDayGap(lastPlayed: string | null | undefined, todayKey: string) {
  const normalized = normalizeDayKey(lastPlayed);
  if (!normalized) return null;

  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const previous = new Date(`${normalized}T00:00:00.000Z`);
  return Math.round((today.getTime() - previous.getTime()) / 86_400_000);
}

export default function DailyChallenge() {
  const router = useRouter();
  const { consumeStreakFreezeCharge, isXpBoostActiveAt } = useCosmetics();
  const [challenge, setChallenge] = useState<{
    title: string;
    prompt: string;
    exampleOutput: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation?: string;
    hint?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LearningLanguage>("python");
  const [awardedXp, setAwardedXp] = useState(50);

  const checkAndLoad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const activeLanguage = await resolveActiveLanguage(user.id);
    setCurrentLanguage(activeLanguage);

    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", activeLanguage)
      .maybeSingle();
    const localProgress = getStoredLanguageProgress(user.id, activeLanguage);
    const merged = mergeProgressSources(activeLanguage, data, localProgress);
    setStoredLanguageProgress(user.id, activeLanguage, merged);

    const today = getDayKey();
    if (normalizeDayKey(merged.last_played) === today) {
      setAlreadyDone(true);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/daily", { method: "POST" });
    const json = await res.json();
    setChallenge(json);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void checkAndLoad();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [checkAndLoad]);

  const checkCode = async () => {
    if (!code.trim() || !challenge) return;
    setChecking(true);

    const res = await fetch("/api/challenge-check", {
      method: "POST",
      body: JSON.stringify({
        prompt: challenge.prompt,
        exampleOutput: challenge.exampleOutput,
        userCode: code,
      }),
    });
    const data = await res.json();
    setFeedback(data);
    setChecking(false);

    if (data.correct) {
      await saveStreak();
      setDone(true);
    }
  };

  const saveStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", currentLanguage)
      .maybeSingle();

    const today = getDayKey();
    const localProgress = getStoredLanguageProgress(user.id, currentLanguage);
    const merged = mergeProgressSources(currentLanguage, existing, localProgress);
    const dayGap = getDayGap(merged.last_played, today);
    const xpReward = isXpBoostActiveAt(Date.now()) ? 100 : 50;
    setAwardedXp(xpReward);

    let newStreak = merged.streak || 0;
    if (dayGap === 1) {
      newStreak += 1;
    } else if (dayGap === 2) {
      newStreak = consumeStreakFreezeCharge() ? merged.streak + 1 : 1;
    } else if (dayGap === 0) {
      newStreak = merged.streak;
    } else {
      newStreak = 1;
    }

    const nextProgress = {
      ...merged,
      xp: merged.xp + xpReward,
      streak: newStreak,
      today_xp: merged.today_xp + xpReward,
      today_lessons: merged.today_lessons + 1,
      last_played: today,
    };

    setStoredLanguageProgress(user.id, currentLanguage, nextProgress);

    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        language: currentLanguage,
        values: {
          xp: nextProgress.xp,
          streak: nextProgress.streak,
          today_xp: nextProgress.today_xp,
          today_lessons: nextProgress.today_lessons,
          last_played: today,
        },
      }),
    }).catch(() => {
      console.warn("Daily challenge progress sync failed after local save.");
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    );
  }

  if (alreadyDone) {
    return (
      <main className="min-h-screen mobile-dock-pad bg-gray-50">
        <AppTopNav />
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Return tomorrow.</h2>
            <p className="text-gray-500 font-semibold mb-8">Daily completion is already recorded.</p>
            <button onClick={() => router.push("/learn")} className="bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full">
              Open Learn
            </button>
          </div>
        </div>
        <MobileDock />
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen mobile-dock-pad bg-gray-50">
        <AppTopNav />
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Maintain streak.</h2>
            <p className="text-gray-500 font-semibold mb-2">Added {awardedXp} XP to progress.</p>
            <button onClick={() => router.push("/learn")} className="mt-6 bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full">
              Open Learn
            </button>
          </div>
        </div>
        <MobileDock />
      </main>
    );
  }

  return (
    <main className="min-h-screen mobile-dock-pad bg-gray-50">
      <AppTopNav />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button onClick={() => router.push("/learn")} className="text-gray-400 hover:text-gray-600 font-bold mb-8 block">
          Open Learn
        </button>

        <div className="bg-green-500 rounded-3xl p-6 mb-6 shadow-md">
          <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Daily</p>
          <h1 className="text-2xl font-extrabold text-white">{challenge?.title}</h1>
          <p className="text-green-100 font-semibold mt-1">Submit one solution today.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Read task</h2>
          <pre className="text-gray-700 font-semibold text-sm whitespace-pre-wrap leading-relaxed">
            {challenge?.prompt}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Write code</h2>
          <textarea
            className="w-full h-48 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            placeholder={`${getLanguageCommentPrefix(currentLanguage)} Write your ${getLanguageLabel(currentLanguage)} code here...`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {feedback && !feedback.correct && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-4">
            <p className="font-extrabold text-red-600 text-lg mb-1">Not quite!</p>
            <p className="text-red-700 font-semibold">{feedback.explanation}</p>
            {feedback.hint && (
              <p className="text-red-600 font-bold mt-2 text-sm">Hint: {feedback.hint}</p>
            )}
          </div>
        )}

        <button
          onClick={checkCode}
          disabled={checking || !code.trim()}
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-40 text-lg"
        >
          {checking ? "Verify Code..." : "Submit Code"}
        </button>
      </div>
      <MobileDock />
    </main>
  );
}
