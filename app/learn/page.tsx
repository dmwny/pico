"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import { ACHIEVEMENTS } from "@/lib/achievements";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileDock from "@/components/MobileDock";
import { getCourseSections, getLanguageLabel, getMiniCourses, languageHasPlacement } from "@/lib/courseContent";
import { mergeProgressSources, resolveActiveLanguage, setStoredLanguageProgress, getStoredLanguageProgress } from "@/lib/progress";

const PATH_POSITIONS = ["ml-24", "ml-40", "ml-52", "ml-40", "ml-24"];

// ── Inner component that uses useSearchParams ─────────────────────────────────
function LearnInner() {
  const searchParams = useSearchParams();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayXp, setTodayXp] = useState(0);
  const [todayLessons, setTodayLessons] = useState(0);
  const [todayPerfect, setTodayPerfect] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guidebook, setGuidebook] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>("python");
  const [openMiniCourseMenu, setOpenMiniCourseMenu] = useState<string | null>(null);
  const sections = useMemo(() => getCourseSections(currentLanguage), [currentLanguage]);
  const miniCourses = useMemo(() => getMiniCourses(currentLanguage), [currentLanguage]);

  useEffect(() => setMounted(true), []);

  const QUEST_POOL = [
    { id: "xp_50",  label: "Earn 50 XP",           current: () => Math.min(todayXp, 50),  total: 50,  color: "bg-yellow-400" },
    { id: "xp_100", label: "Earn 100 XP",          current: () => Math.min(todayXp, 100), total: 100, color: "bg-yellow-400" },
    { id: "xp_200", label: "Earn 200 XP",          current: () => Math.min(todayXp, 200), total: 200, color: "bg-yellow-400" },
    { id: "les_1",  label: "Complete 1 lesson",     current: () => Math.min(todayLessons, 1), total: 1, color: "bg-green-500" },
    { id: "les_3",  label: "Complete 3 lessons",    current: () => Math.min(todayLessons, 3), total: 3, color: "bg-green-500" },
    { id: "les_5",  label: "Complete 5 lessons",    current: () => Math.min(todayLessons, 5), total: 5, color: "bg-green-500" },
    { id: "perf_1", label: "Get 1 perfect lesson",  current: () => Math.min(todayPerfect, 1), total: 1, color: "bg-blue-400" },
    { id: "perf_2", label: "Get 2 perfect lessons", current: () => Math.min(todayPerfect, 2), total: 2, color: "bg-blue-400" },
  ];

  const dailyQuests = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const seed = today.split("-").reduce((acc, n) => acc + parseInt(n), 0);

    const pool = [...QUEST_POOL];

    if (streak === 0) {
      pool.push({
        id: "streak_start",
        label: "Start a streak",
        current: () => Math.min(streak, 1),
        total: 1,
        color: "bg-orange-400",
      });
    }

    const shuffled = pool
      .map((q, i) => ({ q, sort: (seed * (i + 1) * 2654435761) % pool.length }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q);

    const xp      = shuffled.find(q => q.id.startsWith("xp_"));
    const lessons = shuffled.find(q => q.id.startsWith("les_"));
    const perfect = shuffled.find(q => q.id.startsWith("perf_"));
    const streakQ = shuffled.find(q => q.id === "streak_start");

    return [xp, lessons, perfect, streakQ].filter(Boolean).slice(0, 3) as typeof QUEST_POOL;
  }, [streak]);

  useEffect(() => {
    loadProgress();
  }, [searchParams]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [loading]);

  useEffect(() => {
    const closeMiniCourseMenu = () => setOpenMiniCourseMenu(null);
    window.addEventListener("click", closeMiniCourseMenu);
    return () => window.removeEventListener("click", closeMiniCourseMenu);
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const activeLanguage = await resolveActiveLanguage(user.id);
    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", activeLanguage)
      .maybeSingle();

    const localProgress = getStoredLanguageProgress(user.id, activeLanguage);
    const merged = mergeProgressSources(activeLanguage, data, localProgress);

    setCurrentLanguage(activeLanguage);
    setCompletedLessons(merged.completed_lessons);
    setXp(merged.xp);
    setStreak(merged.streak);
    setTodayXp(merged.today_xp);
    setTodayLessons(merged.today_lessons);
    setTodayPerfect(merged.today_perfect);
    setEarnedAchievements(merged.achievements);
    setStoredLanguageProgress(user.id, activeLanguage, merged);
    setLoading(false);
  };

  const getLastLessonId = (unitId: number) => {
    const unit = sections.flatMap((section) => section.units).find((item) => item.id === unitId);
    return unit?.lessons[unit.lessons.length - 1]?.id ?? 1;
  };

  const isUnlocked = (unitId: number, lessonId: number) => {
    if (unitId === 1 && lessonId === 1) return true;
    const prevLesson = lessonId > 1 ? `${unitId}-${lessonId - 1}` : `${unitId - 1}-${getLastLessonId(unitId - 1)}`;
    return completedLessons.includes(prevLesson);
  };

  const isSectionUnlocked = (sectionId: number) => {
    if (sectionId === 1) return true;
    const prevSection = sections[sectionId - 2];
    return prevSection.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`)));
  };

  const allComplete = sections.every(s => s.units.every(u => u.lessons.every(l => completedLessons.includes(`${u.id}-${l.id}`))));

  const findCurrentLesson = () => {
    for (const section of sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          const key = `${unit.id}-${lesson.id}`;
          if (!completedLessons.includes(key) && isUnlocked(unit.id, lesson.id)) return key;
        }
      }
    }
    return null;
  };
  const currentLessonKey = findCurrentLesson();

  const totalLessons = sections.flatMap(s => s.units.flatMap(u => u.lessons)).length;
  const completedCount = completedLessons.filter((lessonKey) => /^\d+-\d+$/.test(lessonKey)).length;
  const earnedAchievementCards = ACHIEVEMENTS
    .filter((achievement) => earnedAchievements.includes(achievement.id))
    .slice(-3)
    .reverse();

  const findCurrentUnit = () => {
    for (const section of sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (`${unit.id}-${lesson.id}` === currentLessonKey) return { section, unit };
        }
      }
    }
    return null;
  };
  const currentUnitInfo = findCurrentUnit();
  const showResolvedSidebarContent = mounted && !loading;

  const openGuidebook = async (unit: any) => {
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: true, content: null });
    const res = await fetch("/api/guidebook", { method: "POST", body: JSON.stringify({ unitTitle: unit.title, unitDescription: unit.description, language: currentLanguage }) });
    const data = await res.json();
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: false, content: data });
  };

  // ── Guidebook view ────────────────────────────────────────────────────────
  if (guidebook) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100">
          <a href="/" className="text-2xl font-extrabold text-green-500">Pico</a>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={() => setGuidebook(null)} className="text-gray-400 font-bold mb-6 hover:text-gray-600">Back</button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Unit {guidebook.unitId} {getLanguageLabel(currentLanguage)} Guidebook</h1>
          <p className="text-gray-500 font-semibold mb-8">{guidebook.unitDescription}</p>
          {guidebook.loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Pico size={100} mood="happy" className="mb-4" />
              <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-500 font-semibold">Generating guidebook...</p>
            </div>
          ) : guidebook.content ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm p-8"><p className="text-gray-700 font-semibold text-lg leading-relaxed">{guidebook.content.intro}</p></div>
              <div className="bg-white rounded-3xl shadow-sm p-8"><h2 className="text-xl font-extrabold text-gray-900 mb-3">What is it?</h2><p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.whatIsIt}</p></div>
              <div className="bg-white rounded-3xl shadow-sm p-8"><h2 className="text-xl font-extrabold text-gray-900 mb-3">Why does it matter?</h2><p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.whyItMatters}</p></div>
              <div className="bg-white rounded-3xl shadow-sm p-8"><h2 className="text-xl font-extrabold text-gray-900 mb-3">How does it work?</h2><p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.howItWorks}</p></div>
              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Examples</h2>
                <div className="space-y-6">{guidebook.content.examples?.map((ex: any, i: number) => (<div key={i}><p className="font-extrabold text-gray-900 mb-2">{ex.title}</p><pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-sm font-mono mb-3 overflow-x-auto">{ex.code}</pre><p className="text-gray-600 font-semibold leading-relaxed">{ex.explanation}</p></div>))}</div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Common mistakes</h2>
                <ul className="space-y-3">{guidebook.content.commonMistakes?.map((m: string, i: number) => (<li key={i} className="flex gap-3"><span className="text-red-500 font-extrabold">!</span><p className="text-gray-700 font-semibold leading-relaxed">{m}</p></li>))}</ul>
              </div>
              <div className="bg-green-50 border-2 border-green-100 rounded-3xl p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Tips</h2>
                <ul className="space-y-3">{guidebook.content.tips?.map((t: string, i: number) => (<li key={i} className="flex gap-3"><span className="text-green-500 font-extrabold">✓</span><p className="text-gray-700 font-semibold leading-relaxed">{t}</p></li>))}</ul>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  // ── Main learn view ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(88,204,2,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(88,204,2,0); }
        }
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .node-pulse { animation: pulse-node 2s ease-in-out infinite; }
        .pico-bob { animation: bob 2.4s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen mobile-dock-pad bg-gray-50 flex flex-col">

        {/* ── Top nav ── */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="text-xl font-black text-green-500">Pico</a>
            <div className="flex items-center gap-6 text-sm font-extrabold">
              <span className="text-green-500">{xp} XP</span>
              {streak > 0 ? (
                <span className="text-orange-400">{streak} day streak</span>
              ) : (
                <span className="text-gray-300 font-bold">No streak yet</span>
              )}
            </div>
          </div>
        </nav>

        {/* ── Current unit banner removed as requested ── */}

        {/* ── 3-column layout ── */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-[240px_1fr_280px] gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="sticky top-32 space-y-2">
            <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 font-extrabold text-sm hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Home
            </a>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 border-2 border-green-100 text-green-600 font-extrabold text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Learn
            </div>
            <a href="/daily" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 font-extrabold text-sm hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Daily Challenge
            </a>
            <a href={languageHasPlacement(currentLanguage) ? "/placement" : "/learn"} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 font-extrabold text-sm hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {languageHasPlacement(currentLanguage) ? "Placement Test" : "Course Start"}
            </a>
            <a href="/achievements" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 font-extrabold text-sm hover:bg-gray-100 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Achievements
            </a>

            {/* Overall progress */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Overall progress</p>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(completedCount / totalLessons) * 100}%` }} />
              </div>
              <p className="text-xs font-bold text-gray-400">{completedCount} / {totalLessons} lessons</p>
            </div>
          </aside>

          {/* ── CENTER PATH ── */}
          <main className="min-h-screen">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Pico size={100} mood="happy" />
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mt-6" />
              </div>
            ) : (
              <>
                {completedLessons.length === 0 && languageHasPlacement(currentLanguage) && (
                  <div className="bg-white rounded-3xl shadow-sm p-5 mb-8 border-2 border-green-100">
                    <p className="font-extrabold text-gray-900 mb-1">Already know some {getLanguageLabel(currentLanguage)}?</p>
                    <p className="text-gray-500 font-semibold text-sm mb-3">
                      Take a quick test to skip ahead.
                    </p>
                    <a href="/placement" className="block w-full bg-green-500 text-white font-extrabold py-2.5 rounded-2xl hover:bg-green-600 transition text-center text-sm shadow-md">
                      Take placement test
                    </a>
                  </div>
                )}

                {sections.map((section) => {
                  const sectionUnlocked = isSectionUnlocked(section.id);
                  const allLessons = section.units.flatMap(u => u.lessons.map(l => `${u.id}-${l.id}`));
                  const completedInSection = allLessons.filter(l => completedLessons.includes(l)).length;
                  const sectionComplete = completedInSection === allLessons.length;
                  const sectionHasCurrent = section.units.some(u => u.lessons.some(l => `${u.id}-${l.id}` === currentLessonKey));

                  return (
                    <div key={section.id} className="mb-6">
                      <div className={`rounded-3xl p-5 mb-6 border-2 ${
                        sectionComplete ? "bg-green-50 border-green-200"
                        : sectionUnlocked ? `${section.bgTheme} border-gray-100`
                        : "bg-gray-50 border-gray-100 opacity-50"
                      }`}>
                        <p className={`text-xs font-extrabold uppercase tracking-widest mb-1 ${sectionUnlocked ? section.textAccent : "text-gray-400"}`}>{section.level}</p>
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-extrabold text-gray-900">{section.title}</h2>
                          {sectionComplete && <span className="text-green-500 font-extrabold text-xs">Completed</span>}
                          {!sectionUnlocked && <span className="text-gray-400 font-bold text-xs">Locked</span>}
                        </div>
                        {sectionUnlocked && !sectionComplete && (
                          <div className="mt-2">
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                              <div className={`h-2 ${section.color} rounded-full transition-all`} style={{ width: `${(completedInSection / allLessons.length) * 100}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 font-semibold mt-1">{completedInSection}/{allLessons.length} lessons</p>
                          </div>
                        )}
                      </div>

                      {sectionUnlocked && !sectionComplete && sectionHasCurrent && (
                        <div className="flex items-end gap-3 mb-6 ml-6">
                          <Pico size={64} mood="happy" />
                          <div className="bg-white border-2 border-gray-100 rounded-3xl rounded-bl-none px-4 py-2.5 shadow-sm">
                            <p className="text-sm font-extrabold text-gray-700">{section.picoMessage}</p>
                          </div>
                        </div>
                      )}

                      {sectionUnlocked && section.units.map((unit) => (
                        <div key={unit.id} className="mb-6">
                          <div id={`unit-${unit.id}`} className={`${section.color} rounded-2xl px-5 py-3.5 mb-5 flex justify-between items-center shadow-md`}>
                            <div>
                              <p className="text-white font-extrabold">Unit {unit.id}: {unit.title}</p>
                              <p className="text-white text-xs font-semibold opacity-80">{unit.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="bg-white rounded-xl px-3 py-0.5">
                                <span className="text-green-600 text-xs font-extrabold">
                                  {unit.lessons.filter(l => completedLessons.includes(`${unit.id}-${l.id}`)).length}/{unit.lessons.length}
                                </span>
                              </div>
                              <button onClick={() => openGuidebook(unit)} className="bg-white text-green-600 text-xs font-extrabold px-3 py-0.5 rounded-xl hover:bg-green-50 transition">
                                Review
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 mb-4">
                            {unit.lessons.map((lesson, index) => {
                              const unlocked = isUnlocked(unit.id, lesson.id);
                              const completed = completedLessons.includes(`${unit.id}-${lesson.id}`);
                              const key = `${unit.id}-${lesson.id}`;
                              const isChallenge = lesson.title.toLowerCase().includes("challenge");
                              const isCurrent = key === currentLessonKey;

                              return (
                                <div key={lesson.id} className={`flex ${PATH_POSITIONS[index % PATH_POSITIONS.length]}`}>
                                  <div className="relative">
                                    {tooltip === key && (
                                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap z-20 shadow-lg">
                                        {lesson.title}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                      </div>
                                    )}
                                    {isCurrent && (
                                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="bg-gray-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                          Start
                                        </span>
                                      </div>
                                    )}
                                    <a
                                      href={
                                        (unlocked || completed)
                                          ? (isChallenge
                                              ? `/learn/${unit.id}/challenge?lang=${currentLanguage}`
                                              : `/learn/${unit.id}/${lesson.id}?lang=${currentLanguage}`)
                                          : "#"
                                      }
                                      onMouseEnter={() => setTooltip(key)}
                                      onMouseLeave={() => setTooltip(null)}
                                      className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold border-b-4 transition-all duration-150 active:border-b-0 active:translate-y-1 ${
                                        isCurrent
                                          ? `${section.color} ${section.borderColor} text-white shadow-lg node-pulse ring-4 ring-white ring-offset-2`
                                          : completed
                                          ? `${section.color} ${section.borderColor} text-white shadow-md`
                                          : unlocked
                                          ? isChallenge
                                            ? "bg-yellow-400 border-yellow-500 text-white shadow-md hover:brightness-110"
                                            : `${section.color} ${section.borderColor} text-white shadow-md hover:brightness-110`
                                          : "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      {completed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                      ) : unlocked && isChallenge ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                      ) : unlocked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      )}
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {section.id < sections.length && (
                        <div className="flex items-center gap-4 my-8">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs font-extrabold text-gray-300 uppercase tracking-widest">Next section</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className={`rounded-3xl p-5 mb-8 border-2 ${allComplete ? "bg-white border-gray-100" : "bg-gray-100 border-gray-200 opacity-60"}`}>
                  <p className="text-xs font-extrabold uppercase tracking-widest mb-1 text-green-500">Daily Refresh</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900 mb-0.5">Daily Challenge</h2>
                      <p className="text-gray-400 font-semibold text-sm">{allComplete ? "Keep your streak alive." : "Complete the full course to unlock."}</p>
                    </div>
                    {!allComplete && <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  </div>
                  {allComplete && <a href="/daily" className="mt-4 block w-full bg-green-500 text-white font-extrabold py-3 rounded-2xl hover:bg-green-600 transition text-center shadow-md">Start Today's Challenge</a>}
                </div>
              </>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="sticky top-32 space-y-4">

            {/* Language switcher */}
            {mounted && <LanguageSwitcher currentLanguage={currentLanguage} />}

            {/* XP & Streak */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Your stats</p>
              <div
                className="flex items-stretch"
                style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
              >
                <div className="flex-1 px-2 py-4">
                  <p className="text-[2.2rem] font-semibold leading-none text-[#1A1A1A]">{xp}</p>
                  <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#666666]">XP</p>
                </div>
                <div className="mx-4 w-px bg-[#E5E5E5]" />
                <div className="flex-1 px-2 py-4">
                  <p className="text-[2.2rem] font-semibold leading-none text-[#1A1A1A]">{streak}</p>
                  <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#666666]">Streak</p>
                </div>
              </div>
            </div>

            {/* Daily quests */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Daily quests</p>
              <div className="space-y-3">
                {mounted ? dailyQuests.map((quest) => (
                  <div key={quest.id}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-extrabold text-gray-700">{quest.label}</p>
                      <p className="text-xs font-bold text-gray-400">{quest.current()}/{quest.total}</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${quest.color} rounded-full transition-all`}
                        style={{ width: `${(quest.current() / quest.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mini courses */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Mini courses</p>
                  <p className="text-xs font-semibold text-gray-300 mt-1">
                    Small tracks for APIs, libraries, and tools
                  </p>
                </div>
                <span suppressHydrationWarning className="text-[11px] font-extrabold uppercase tracking-wider text-green-500">
                  {getLanguageLabel(currentLanguage)}
                </span>
              </div>
              <div className="space-y-3">
                {showResolvedSidebarContent ? miniCourses.map((course) => (
                  <div
                    key={course.id}
                    className="relative rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 flex-shrink-0 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xs font-black shadow-sm">
                        {course.badge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-gray-800">{course.title}</p>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMiniCourseMenu((current) => current === course.id ? null : course.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition"
                              aria-label={`Open ${course.title} menu`}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                              </svg>
                            </button>
                            {openMiniCourseMenu === course.id && (
                              <div
                                className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-gray-400">
                                  {course.status === "live" ? "Open module" : course.status === "coming_soon" ? "Coming soon" : "Planned"}
                                </div>
                                {course.status === "live" && course.href ? (
                                  <Link
                                    href={course.href}
                                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                  >
                                    Open module
                                  </Link>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setOpenMiniCourseMenu(null)}
                                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                      Save for later
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setOpenMiniCourseMenu(null)}
                                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                      Preview track
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-green-600 mt-0.5">{course.subtitle}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1 leading-5">{course.description}</p>
                        <span className={`inline-flex mt-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                          course.status === "live"
                            ? "bg-emerald-100 text-emerald-700"
                            : course.status === "coming_soon"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-600"
                        }`}>
                          {course.status === "live" ? "Open now" : course.status === "coming_soon" ? "Coming soon" : "Planned"}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <div className="animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-gray-200" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="h-4 w-28 rounded bg-gray-200" />
                              <div className="h-3 w-32 rounded bg-gray-200" />
                              <div className="h-3 w-full rounded bg-gray-200" />
                              <div className="h-3 w-5/6 rounded bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Achievements panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Achievements</p>
                <a href="/achievements" className="text-xs font-extrabold text-green-500 hover:text-green-600 transition">
                  View all
                </a>
              </div>
              {earnedAchievements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                  <p className="text-sm font-bold text-gray-400">No badges yet</p>
                  <p className="text-xs font-semibold text-gray-300 mt-1">Complete lessons to earn your first one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {earnedAchievementCards.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                    >
                      <div className={`h-11 w-11 flex-shrink-0 rounded-2xl bg-gradient-to-br ${achievement.gradient} shadow-sm flex items-center justify-center`}>
                        <span className="text-sm font-black text-white">
                          {achievement.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-800 truncate">{achievement.title}</p>
                        <p className="text-xs font-semibold text-gray-400 truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-green-50 px-3 py-2">
                <p className="text-xs font-bold text-green-700">{earnedAchievements.length} / {ACHIEVEMENTS.length} unlocked</p>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-green-500">
                  {Math.round((earnedAchievements.length / ACHIEVEMENTS.length) * 100)}%
                </p>
              </div>
            </div>

            {/* Pico card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center">
              <Pico size={90} mood={streak >= 3 ? "celebrate" : "happy"} />
              <p className="text-sm font-extrabold text-gray-700 mt-2">
                {streak >= 7 ? "You're on fire!" : streak >= 3 ? "Great streak!" : "Keep it up!"}
              </p>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                {streak >= 1
                  ? `${streak} day streak`
                  : "Complete a lesson to start your streak"}
              </p>
            </div>

          </aside>
        </div>
        <MobileDock />
      </div>
    </>
  );
}

// ── Export: wrap in Suspense because useSearchParams requires it ───────────────
export default function Learn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    }>
      <LearnInner />
    </Suspense>
  );
}
