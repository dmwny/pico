"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveActiveLanguage } from "@/lib/progress";

export default function DailyChallenge() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<any>(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<"python" | "javascript">("python");

  useEffect(() => {
    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
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

    const today = new Date().toDateString();
    if (data?.last_played === today) {
      setAlreadyDone(true);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/daily", { method: "POST" });
    const json = await res.json();
    setChallenge(json);
    setLoading(false);
  };

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
      await saveStreak();
      setDone(true);
    }
  };

  const saveStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", currentLanguage)
      .maybeSingle();

    if (existing) {
      const newStreak = existing.last_played === yesterday.toDateString()
        ? existing.streak + 1
        : 1;

      await supabase
        .from("pico_progress")
        .update({ streak: newStreak, last_played: today, xp: existing.xp + 50 })
        .eq("user_id", user.id)
        .eq("language", currentLanguage);
    }
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Already done today!</h2>
          <p className="text-gray-500 font-semibold mb-8">Come back tomorrow to keep your streak going.</p>
          <button onClick={() => router.push("/learn")} className="bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full">
            Back to Learn
          </button>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Streak kept alive!</h2>
          <p className="text-gray-500 font-semibold mb-2">You earned 50 XP</p>
          <button onClick={() => router.push("/learn")} className="mt-6 bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full">
            Back to Learn
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button onClick={() => router.push("/learn")} className="text-gray-400 hover:text-gray-600 font-bold mb-8 block">
          Back
        </button>

        <div className="bg-green-500 rounded-3xl p-6 mb-6 shadow-md">
          <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Daily Challenge</p>
          <h1 className="text-2xl font-extrabold text-white">{challenge?.title}</h1>
          <p className="text-green-100 font-semibold mt-1">Complete this to keep your streak alive!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Your task</h2>
          <pre className="text-gray-700 font-semibold text-sm whitespace-pre-wrap leading-relaxed">
            {challenge?.prompt}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Write your code</h2>
          <textarea
            className="w-full h-48 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            placeholder={`${currentLanguage === "python" ? "# Write your" : "// Write your"} ${currentLanguage === "python" ? "Python" : "JavaScript"} code here...`}
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
          {checking ? "Checking your code..." : "Submit Code"}
        </button>
      </div>
    </main>
  );
}
