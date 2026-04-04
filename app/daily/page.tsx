"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppTopNav from "@/components/AppTopNav";
import MobileDock from "@/components/MobileDock";
import { getLanguageCommentPrefix, getLanguageLabel, type LearningLanguage } from "@/lib/courseContent";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { withAlpha } from "@/lib/themes";
import { getLocalDateKey, getLocalTimezone } from "@/lib/streaks";

export default function DailyChallenge() {
  const router = useRouter();
  const { pathTheme } = useThemeContext();
  const {
    activeLanguage,
    applyQualifiedStreakActivity,
    isHydrating,
    isXpBoostActiveAt,
    loading: cosmeticsLoading,
    progress: globalProgress,
  } = useCosmetics();
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
    if (cosmeticsLoading || isHydrating || !activeLanguage || !globalProgress) return;

    setCurrentLanguage(activeLanguage);

    const today = getLocalDateKey(new Date(), globalProgress.streak_timezone ?? getLocalTimezone());
    if (globalProgress.streak_activity_dates.includes(today)) {
      setAlreadyDone(true);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/daily", { method: "POST" });
    const json = await res.json();
    setChallenge(json);
    setLoading(false);
  }, [activeLanguage, cosmeticsLoading, globalProgress, isHydrating, router]);

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
    if (!activeLanguage || !globalProgress) return;
    const xpReward = isXpBoostActiveAt(Date.now()) ? 100 : 50;
    setAwardedXp(xpReward);

    const baseProgress = {
      ...globalProgress,
      xp: globalProgress.xp + xpReward,
      today_xp: globalProgress.today_xp + xpReward,
      today_lessons: globalProgress.today_lessons + 1,
    };

    await applyQualifiedStreakActivity({
      language: activeLanguage,
      baseProgress,
    });
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
        <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </main>
    );
  }

  if (alreadyDone) {
    return (
      <main className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
        <AppTopNav />
        <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border p-12 text-center shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceCard }}>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: pathTheme.surfaceText }}>Return tomorrow.</h2>
            <p className="font-semibold mb-8" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>Daily completion is already recorded.</p>
            <button onClick={() => router.push("/learn")} className="font-extrabold px-8 py-4 rounded-2xl transition shadow-md w-full text-white" style={{ background: pathTheme.accentColor }}>
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
      <main className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
        <AppTopNav />
        <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl border p-12 text-center shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceCard }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-white" style={{ background: pathTheme.accentColor }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: pathTheme.surfaceText }}>Maintain streak.</h2>
            <p className="font-semibold mb-2" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>Added {awardedXp} XP to progress.</p>
            <button onClick={() => router.push("/learn")} className="mt-6 font-extrabold px-8 py-4 rounded-2xl transition shadow-md w-full text-white" style={{ background: pathTheme.accentColor }}>
              Open Learn
            </button>
          </div>
        </div>
        <MobileDock />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen mobile-dock-pad overflow-hidden" style={{ background: pathTheme.surfaceBackground }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.9 }} />
      <AppTopNav />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <button onClick={() => router.push("/learn")} className="font-bold mb-8 block" style={{ color: withAlpha(pathTheme.surfaceText, 0.62) }}>
          Open Learn
        </button>

        <div className="rounded-3xl p-6 mb-6 shadow-md text-white" style={{ background: pathTheme.surfaceDark }}>
          <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Daily</p>
          <h1 className="text-2xl font-extrabold text-white">{challenge?.title}</h1>
          <p className="text-green-100 font-semibold mt-1">Submit one solution today.</p>
        </div>

        <div className="rounded-3xl border shadow-sm p-6 mb-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceCard }}>
          <h2 className="text-lg font-extrabold mb-3" style={{ color: pathTheme.surfaceText }}>Read task</h2>
          <pre className="font-semibold text-sm whitespace-pre-wrap leading-relaxed" style={{ color: withAlpha(pathTheme.surfaceText, 0.8) }}>
            {challenge?.prompt}
          </pre>
        </div>

        <div className="rounded-3xl border shadow-sm p-6 mb-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.22), background: pathTheme.surfaceCard }}>
          <h2 className="text-lg font-extrabold mb-3" style={{ color: pathTheme.surfaceText }}>Write code</h2>
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
          className="w-full text-white font-extrabold py-4 rounded-2xl transition shadow-md disabled:opacity-40 text-lg"
          style={{ background: pathTheme.accentColor }}
        >
          {checking ? "Verify Code..." : "Submit Code"}
        </button>
      </div>
      <MobileDock />
    </main>
  );
}
