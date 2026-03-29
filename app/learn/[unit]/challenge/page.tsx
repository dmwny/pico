"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLanguageLabel, getUnitChallenge, LearningLanguage, normalizeLanguage } from "@/lib/courseContent";
import { getStoredLanguageProgress, mergeProgressSources, resolveActiveLanguage, setStoredLanguageProgress } from "@/lib/progress";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = params.unit as string;
  const requestedLanguageParam = searchParams.get("lang");
  const requestedLanguage = requestedLanguageParam ? normalizeLanguage(requestedLanguageParam) : null;
  const [currentLanguage, setCurrentLanguage] = useState<LearningLanguage | null>(null);

  const challenge = getUnitChallenge(currentLanguage ?? requestedLanguage ?? "python", unitId);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentLanguage(requestedLanguage ?? await resolveActiveLanguage(user.id));
    };
    loadLanguage();
  }, [requestedLanguage]);

  const checkCode = async () => {
    if (!code.trim()) return;
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
      await saveProgress();
      setDone(true);
    }
  };

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const challengeLanguage = currentLanguage ?? requestedLanguage ?? await resolveActiveLanguage(user.id);
    const localProgress = getStoredLanguageProgress(user.id, challengeLanguage);

    const lessonKey = `${unitId}-5`;

    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", challengeLanguage)
      .maybeSingle();

    if (existing) {
      const completed = JSON.parse(existing.completed_lessons || "[]");
      if (!completed.includes(lessonKey)) {
        completed.push(lessonKey);
      }
      const updatedProgress = {
        xp: existing.xp + 50,
        completed_lessons: JSON.stringify(completed),
      };

      await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          language: challengeLanguage,
          values: updatedProgress,
        }),
      });

      const merged = mergeProgressSources(challengeLanguage, { ...existing, ...updatedProgress }, localProgress);
      setStoredLanguageProgress(user.id, challengeLanguage, merged);
    } else {
      const insertedProgress = {
        user_id: user.id,
        xp: 50,
        streak: 0,
        completed_lessons: JSON.stringify([lessonKey]),
        language: challengeLanguage,
      };

      await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          language: challengeLanguage,
          values: {
            xp: 50,
            streak: 0,
            completed_lessons: JSON.stringify([lessonKey]),
          },
        }),
      });

      const merged = mergeProgressSources(challengeLanguage, insertedProgress, localProgress);
      setStoredLanguageProgress(user.id, challengeLanguage, merged);
    }
  };

  if (!challenge) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-semibold">Challenge not found.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Unit Complete!</h2>
          <p className="text-gray-500 font-semibold mb-2">You earned 50 XP</p>
          <p className="text-green-500 font-extrabold mb-8">Next unit unlocked!</p>
          <button
            onClick={() => router.push("/learn")}
            className="bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/learn")}
          className="text-gray-400 hover:text-gray-600 font-bold mb-8 block"
        >
          Back
        </button>

        <div className="bg-yellow-400 rounded-3xl p-6 mb-6 shadow-md">
          <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Unit Challenge</p>
          <h1 className="text-2xl font-extrabold text-white">{challenge.title}</h1>
          <p className="text-yellow-100 font-semibold mt-1">{challenge.description}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Your task</h2>
          <pre className="text-gray-700 font-semibold text-sm whitespace-pre-wrap leading-relaxed">
            {challenge.prompt}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Expected output</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-sm font-mono overflow-x-auto">
            {challenge.exampleOutput}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Write your code</h2>
          <textarea
            className="w-full h-48 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            placeholder={`${currentLanguage === "python" ? "# Write your" : "// Write your"} ${getLanguageLabel(currentLanguage)} code here...`}
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
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-lg"
        >
          {checking ? "Checking your code..." : "Submit Code"}
        </button>
      </div>
    </main>
  );
}
