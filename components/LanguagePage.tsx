"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import { resolveActiveLanguage, setStoredActiveLanguage } from "@/lib/progress";

const LANGUAGES = [
  {
    id: "python",
    label: "Python",
    description: "Great for beginners, data science, and automation",
    gradient: "from-blue-500 to-blue-600",
    border: "border-blue-400",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <path d="M24 4C17 4 17.5 7 17.5 7L17.51 10.12H24.13V11H13.5C13.5 11 10 10.6 10 17.67C10 24.74 13.05 24.5 13.05 24.5H15V21.26C15 21.26 14.84 18.21 17.93 18.21H24.5C24.5 18.21 27.35 18.26 27.35 15.5V8.5C27.35 8.5 27.81 4 24 4Z" fill="white"/>
        <path d="M24.5 44C31.5 44 31 41 31 41L30.99 37.88H24.37V37H35C35 37 38.5 37.4 38.5 30.33C38.5 23.26 35.45 23.5 35.45 23.5H33.5V26.74C33.5 26.74 33.66 29.79 30.57 29.79H24C24 29.79 21.15 29.74 21.15 32.5V39.5C21.15 39.5 20.69 44 24.5 44Z" fill="white" fillOpacity="0.7"/>
        <circle cx="21" cy="8" r="1.5" fill="white" fillOpacity="0.9"/>
        <circle cx="27.5" cy="40" r="1.5" fill="white" fillOpacity="0.6"/>
      </svg>
    ),
  },
  {
    id: "javascript",
    label: "JavaScript",
    description: "The language of the web - build anything in the browser",
    gradient: "from-yellow-400 to-yellow-500",
    border: "border-yellow-400",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
        <rect x="6" y="6" width="36" height="36" rx="4" fill="white" fillOpacity="0.2"/>
        <path d="M20 32.5C20 34.5 18.9 35.5 17.3 35.5C15.8 35.5 14.9 34.6 14.5 33.5L12.5 34.7C13.2 36.4 14.8 38 17.4 38C20.2 38 22.3 36.4 22.3 32.4V22H20V32.5Z" fill="white"/>
        <path d="M27.5 35.5C25.7 35.5 25 34.4 24.4 33.2L22.4 34.5C23.2 36.2 24.9 38 27.6 38C30.5 38 32.5 36.3 32.5 33.5C32.5 30.9 31 29.7 28.5 28.6L27.7 28.3C26.4 27.7 25.8 27.3 25.8 26.3C25.8 25.5 26.4 24.9 27.3 24.9C28.2 24.9 28.8 25.3 29.3 26.2L31.2 24.9C30.3 23.3 29.1 22.6 27.3 22.6C24.9 22.6 23.3 24.2 23.3 26.4C23.3 28.9 24.8 30.1 27 31.1L27.8 31.4C29.3 32.1 30 32.5 30 33.7C30 34.7 29.1 35.5 27.5 35.5Z" fill="white"/>
      </svg>
    ),
  },
] as const;

export default function LanguagePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const activeLanguage = await resolveActiveLanguage(user.id);
      setCurrentLanguage(activeLanguage);
      setSelected(activeLanguage);
    }

    load();
  }, [router]);

  async function handleConfirm() {
    if (!selected || !userId) return;
    setLoading(true);

    const isSameLanguage = selected === currentLanguage;

    if (!isSameLanguage) {
      const { data: savedProgress } = await supabase
        .from("pico_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("language", selected)
        .maybeSingle();

      if (!savedProgress) {
        await fetch("/api/progress", {
          method: "POST",
          body: JSON.stringify({
            userId,
            language: selected,
            values: {
              xp: 0,
              streak: 0,
              last_played: null,
              completed_lessons: JSON.stringify([]),
              achievements: JSON.stringify([]),
              today_xp: 0,
              today_lessons: 0,
              today_perfect: 0,
            },
          }),
        });
      }

      setStoredActiveLanguage(userId, selected);
      router.push(savedProgress ? "/learn" : "/placement");
      return;
    }

    setStoredActiveLanguage(userId, selected);
    router.push("/learn");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-10">
          <Pico size={96} mood="happy" />
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mt-4">
            What do you want to learn?
          </h1>
          <p className="text-gray-400 mt-2 text-center text-sm font-semibold">
            {currentLanguage
              ? "Switch language anytime - your progress for each language stays saved on this device."
              : "Choose a language to get started."}
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.id;
            const isCurrent = currentLanguage === lang.id;

            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-150 focus:outline-none ${
                  isSelected
                    ? `${lang.border} bg-green-50 shadow-md`
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lang.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    {lang.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">{lang.label}</span>
                      {isCurrent && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{lang.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {isSelected && !isCurrent && currentLanguage && (
                  <div className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Switching will load your saved {lang.label} track if you have one. Otherwise, you&apos;ll start with placement.
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg transition-colors duration-150 shadow-sm"
        >
          {loading
            ? "Loading..."
            : selected === currentLanguage
              ? "Continue learning"
              : "Start learning"}
        </button>
      </div>
    </div>
  );
}
