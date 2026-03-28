"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ACHIEVEMENTS } from "@/lib/achievements";

export default function AchievementsPage() {
  const [earned, setEarned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("pico_progress")
        .select("achievements")
        .eq("user_id", user.id)
        .single();
      if (data) setEarned(JSON.parse(data.achievements || "[]"));
      setLoading(false);
    };
    load();
  }, []);

  const earnedCount = ACHIEVEMENTS.filter(a => earned.includes(a.id)).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-xl font-black text-green-500">Pico</a>
          <a href="/learn" className="text-sm font-extrabold text-gray-400 hover:text-gray-600 transition">
            Back to Learn
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Achievements</h1>
          <p className="text-gray-400 font-semibold">
            {loading ? "Loading..." : `${earnedCount} of ${ACHIEVEMENTS.length} unlocked`}
          </p>

          {/* Progress bar */}
          {!loading && (
            <div className="mt-4 h-2.5 bg-gray-200 rounded-full overflow-hidden w-full max-w-sm">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = earned.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    isEarned
                      ? "bg-white border-gray-100 shadow-sm"
                      : "bg-gray-50 border-gray-100 opacity-50"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isEarned ? achievement.color : "bg-gray-200"
                  }`}>
                    {isEarned ? achievement.icon : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <p className={`font-extrabold text-sm ${isEarned ? "text-gray-900" : "text-gray-400"}`}>
                      {achievement.title}
                    </p>
                    <p className={`text-xs font-semibold mt-0.5 ${isEarned ? "text-gray-500" : "text-gray-400"}`}>
                      {achievement.description}
                    </p>
                  </div>

                  {/* Earned badge */}
                  {isEarned && (
                    <div className="ml-auto flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}