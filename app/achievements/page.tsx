"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ACHIEVEMENTS, Achievement } from "@/lib/achievements";
import { resolveActiveLanguage } from "@/lib/progress";
import MobileDock from "@/components/MobileDock";

// ── SVG Icon Map ──────────────────────────────────────────────────────────────
function AchievementIcon({ name, className = "" }: { name: string; className?: string }) {
  const props = { className: `${className}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "footprints":
      return <svg {...props}><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5 10 7.9 8 10 8 12h3c0-2 2-4 2-6.5 0-1.7-.63-3.5-2.5-3.5-3 0-4.47 3.28-4.5 6-.03 2.5 1 3.5 1 5.62V16" /><path d="M14 16v-1.83C14 12 16 10 16 7.5 16 5.8 15.37 4 13.5 4 10.5 4 9.03 7.28 9 10c-.03 2.5 1 3.5 1 5.62V18" /><path d="M4 22h4m6-6h4" /></svg>;
    case "flame":
      return <svg {...props}><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>;
    case "zap":
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "star":
      return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case "bolt":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "gem":
      return <svg {...props}><path d="M6 3h12l4 6-10 13L2 9z" /><path d="M11 3l1 10L2 9" /><path d="M13 3l-1 10 10-4" /><path d="M2 9h20" /></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>;
    case "moon":
      return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case "trophy":
      return <svg {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 22V14.5a2 2 0 0 0-2-2H6V4h12v8.5h-2a2 2 0 0 0-2 2V22" /></svg>;
    case "crown":
      return <svg {...props}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 16h14v4H5z" /></svg>;
    case "bullseye":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case "mountain":
      return <svg {...props}><path d="m8 3 4 8 5-5 5 15H2L8 3z" /><path d="m4.14 15.08 2.86-2.86" /></svg>;
    case "scroll":
      return <svg {...props}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" /><path d="M19 17V5a2 2 0 0 0-2-2H4" /></svg>;
    case "diamond":
      return <svg {...props}><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 8v8m-4-4h8" /></svg>;
  }
}

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common: { label: "Common", border: "border-gray-200", text: "text-gray-400", dot: "bg-gray-300" },
  rare: { label: "Rare", border: "border-blue-200", text: "text-blue-500", dot: "bg-blue-400" },
  epic: { label: "Epic", border: "border-purple-200", text: "text-purple-500", dot: "bg-purple-400" },
  legendary: { label: "Legendary", border: "border-amber-300", text: "text-amber-500", dot: "bg-amber-400" },
};

function AchievementCard({ achievement, isEarned }: { achievement: Achievement; isEarned: boolean }) {
  const rarity = RARITY_CONFIG[achievement.rarity];

  return (
    <div
      className={`group relative rounded-2xl border-2 p-5 transition-all duration-300 ${
        isEarned
          ? `bg-white ${rarity.border} shadow-sm hover:shadow-md hover:-translate-y-0.5`
          : "bg-gray-50/80 border-gray-100 opacity-45 grayscale"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
            isEarned ? `bg-gradient-to-br ${achievement.gradient} text-white shadow-lg` : "bg-gray-200 text-gray-400"
          }`}
          style={isEarned ? { boxShadow: "0 4px 14px rgba(0,0,0,0.12)" } : {}}
        >
          {isEarned ? (
            <AchievementIcon name={achievement.icon} className="w-6 h-6" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className={`font-extrabold text-sm leading-tight ${isEarned ? "text-gray-900" : "text-gray-400"}`}>
            {achievement.title}
          </p>
          <p className={`text-xs font-semibold mt-1 leading-snug ${isEarned ? "text-gray-500" : "text-gray-400"}`}>
            {achievement.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isEarned ? rarity.dot : "bg-gray-300"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isEarned ? rarity.text : "text-gray-400"}`}>
              {rarity.label}
            </span>
          </div>
        </div>

        {/* Earned checkmark */}
        {isEarned && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [earned, setEarned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const activeLanguage = await resolveActiveLanguage(user.id);
      const { data } = await supabase
        .from("pico_progress")
        .select("achievements")
        .eq("user_id", user.id)
        .eq("language", activeLanguage)
        .maybeSingle();
      if (data) setEarned(JSON.parse(data.achievements || "[]"));
      setLoading(false);
    };
    load();
  }, []);

  const earnedCount = ACHIEVEMENTS.filter((a) => earned.includes(a.id)).length;

  // Group by rarity, earned first in each group
  const rarityOrder: Achievement["rarity"][] = ["legendary", "epic", "rare", "common"];
  const groupedAchievements = rarityOrder.map((rarity) => ({
    rarity,
    config: RARITY_CONFIG[rarity],
    achievements: ACHIEVEMENTS.filter((a) => a.rarity === rarity).sort((a, b) => {
      const aEarned = earned.includes(a.id) ? 0 : 1;
      const bEarned = earned.includes(b.id) ? 0 : 1;
      return aEarned - bEarned;
    }),
  })).filter((g) => g.achievements.length > 0);

  return (
    <main className="min-h-screen mobile-dock-pad bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-xl font-black text-green-500">Pico</a>
          <a href="/learn" className="text-sm font-extrabold text-gray-400 hover:text-gray-600 transition">
            Open Learn
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-1">View Achievements</h1>
          <p className="text-gray-400 font-semibold">
            {loading ? "Loading..." : `${earnedCount} of ${ACHIEVEMENTS.length} unlocked`}
          </p>

          {/* Progress bar */}
          {!loading && (
            <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden w-full max-w-sm">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
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
          <div className="space-y-8">
            {groupedAchievements.map(({ rarity, config, achievements }) => (
              <div key={rarity}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <h2 className={`text-xs font-black uppercase tracking-widest ${config.text}`}>
                    {config.label}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isEarned={earned.includes(achievement.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileDock />
    </main>
  );
}
