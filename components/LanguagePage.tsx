"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import MobileDock from "@/components/MobileDock";
import { resolveActiveLanguage, setStoredActiveLanguage } from "@/lib/progress";
import { getLanguageLabel, getMiniCourses, languageHasPlacement, type LearningLanguage } from "@/lib/courseContent";

type LanguageCard = {
  id: string;
  label: string;
  description: string;
  tileClass: string;
  icon: "python" | "javascript" | "typescript" | "java" | "csharp" | "rust" | "lua";
  status: "live" | "reserve";
  footprint: string;
};

const LANGUAGE_CARDS: LanguageCard[] = [
  {
    id: "python",
    label: "Python",
    description: "Python for automation, data science, and scripting.",
    tileClass: "bg-[#3776AB] text-white",
    icon: "python",
    status: "live",
    footprint: "lg:col-span-2 lg:row-span-2",
  },
  {
    id: "javascript",
    label: "JavaScript",
    description: "JavaScript for web apps, DOM APIs, and UI logic.",
    tileClass: "bg-[#F7DF1E] text-[#1D2730]",
    icon: "javascript",
    status: "live",
    footprint: "lg:col-span-1 lg:row-span-2",
  },
  {
    id: "typescript",
    label: "TypeScript",
    description: "TypeScript for typed JavaScript and large applications.",
    tileClass: "bg-[#3178C6] text-white",
    icon: "typescript",
    status: "live",
    footprint: "lg:col-span-1",
  },
  {
    id: "java",
    label: "Java",
    description: "Java for backend systems and object-oriented development.",
    tileClass: "bg-[#EA7A2F] text-white",
    icon: "java",
    status: "live",
    footprint: "lg:col-span-1",
  },
  {
    id: "csharp",
    label: "C#",
    description: "C# for .NET applications, tools, and games.",
    tileClass: "bg-[#7C3AED] text-white",
    icon: "csharp",
    status: "live",
    footprint: "lg:col-span-1",
  },
  {
    id: "rust",
    label: "Rust",
    description: "Rust for systems programming and memory safety.",
    tileClass: "bg-[#2F2B28] text-white",
    icon: "rust",
    status: "live",
    footprint: "lg:col-span-1",
  },
  {
    id: "lua",
    label: "Lua",
    description: "Lua for scripting, mods, and compact game logic.",
    tileClass: "bg-[#000080] text-white",
    icon: "lua",
    status: "live",
    footprint: "lg:col-span-1",
  },
];

function LanguageLogo({ icon }: { icon: LanguageCard["icon"] }) {
  if (icon === "python") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <path fill="#FFE873" d="M63.9 12.2c-26.1 0-24.5 11.3-24.5 11.3l.03 11.7H64.3v3.5H29.5S12.8 36.8 12.8 63.5s14.6 26 14.6 26h8.7V77.3s-.47-14.6 14.4-14.6h24.8s13.9.23 13.9-13.5V26s2.1-13.8-25.3-13.8Zm-13.7 8c2.5 0 4.5 2.1 4.5 4.6 0 2.5-2 4.5-4.5 4.5s-4.6-2-4.6-4.5 2.1-4.6 4.6-4.6Z"/>
        <path fill="#306998" d="M64.6 114.8c26.1 0 24.5-11.3 24.5-11.3l-.03-11.7H64.2v-3.5H99s16.7 1.9 16.7-24.8-14.6-26-14.6-26h-8.7v12.2s.47 14.6-14.4 14.6H53.2s-13.9-.23-13.9 13.5V101s-2.1 13.8 25.3 13.8Zm13.7-8c-2.5 0-4.5-2.1-4.5-4.6 0-2.5 2-4.5 4.5-4.5s4.6 2 4.6 4.5-2.1 4.6-4.6 4.6Z"/>
      </svg>
    );
  }

  if (icon === "javascript") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <path fill="#F7DF1E" d="M1.4 1.4h125.2v125.2H1.4Z"/>
        <path d="M85.2 106.3c2.5 4.2 5.8 7.3 11.7 7.3 4.9 0 8-2.5 8-5.8 0-4-3.2-5.5-8.5-7.8l-2.9-1.2c-8.4-3.6-14-8.1-14-17.7 0-8.8 6.7-15.5 17.2-15.5 7.5 0 12.8 2.6 16.7 9.4l-9.1 5.8c-2-3.6-4.2-5-7.6-5-3.5 0-5.7 2.2-5.7 5 0 3.5 2.2 4.9 7.2 7.1l2.9 1.2c9.9 4.3 15.5 8.6 15.5 18.4 0 10.6-8.3 16.4-19.5 16.4-11 0-18.2-5.2-21.7-12.1ZM43.4 107.3c1.8 3.2 3.4 5.9 7.2 5.9 3.7 0 6-1.4 6-6.9V69.1h11.3v37.4c0 11.3-6.6 16.4-16.2 16.4-8.7 0-13.7-4.5-16.3-10l8-5.6Z"/>
      </svg>
    );
  }

  if (icon === "typescript") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <path fill="#3178C6" d="M2 2h124v124H2Z"/>
        <path fill="#FFF" d="M74.6 54.8v8.8H57v50.1H46.8V63.6H29.1v-8.8Zm25 0c10.9 0 18.7 5.6 18.7 14.7h-10.2c0-4.1-3.1-6.4-8.2-6.4-4.9 0-8.1 2.2-8.1 5.7 0 3.1 2.6 4.9 10.1 6.5 11.7 2.5 17 6.3 17 15.6 0 10-8.3 16.1-19.6 16.1-12.1 0-20-6-20.4-15.8h10.5c.4 4.8 4 7.5 10.3 7.5 5.9 0 9.2-2.3 9.2-6.1 0-3.3-2-5-9-6.5-12.4-2.7-18-6.5-18-15.8 0-9.3 8.1-15.5 18.7-15.5Z"/>
      </svg>
    );
  }

  if (icon === "java") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <path fill="#5382A1" d="M77.2 98.5c0 9.3-22.8 17.5-44.7 11.1 31.5 7.5 64.5-1.3 64.5-12.6 0-3.7-3.6-7.2-9.8-10.1 8.2 2.1 12.8 5.6 12.8 11.6Z"/>
        <path fill="#E76F00" d="M85 71.7c-6.9 4-17.8 6.2-27.4 4.8-6.1-.9-11.4-3.5-13.3-6.9-2.1-3.7.2-7.4 4.4-10.4-10.9 6-15.6 14.1-3.4 19.8 13.4 6.2 39.1 3.2 52.1-5.5 3.3-2.2 4.2-5.4 1.4-7.9 1.1 2.2.1 4.6-3.8 6.1Z"/>
        <path fill="#5382A1" d="M72 20.9c10.1 9.8-9.6 18.6-9.6 30 0 7 5.6 10.7 5.6 10.7s-15.2-7.7-8.2-17.7c10.3-14.9 19.4-13.6 12.2-23Z"/>
        <path fill="#5382A1" d="M76.6 0c13 13.1-12.3 24.8-12.3 40.1 0 9.4 7.5 14.3 7.5 14.3S52 44.8 61.4 31.4C75.3 11.8 87.6 13.3 76.6 0Z"/>
      </svg>
    );
  }

  if (icon === "csharp") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <path fill="#68217A" d="m112.8 37.5-38.4-22.2a20.8 20.8 0 0 0-20.8 0L15.2 37.5A20.8 20.8 0 0 0 4.8 55.6v44.8a20.8 20.8 0 0 0 10.4 18.1l38.4 22.2a20.8 20.8 0 0 0 20.8 0l38.4-22.2a20.8 20.8 0 0 0 10.4-18.1V55.6a20.8 20.8 0 0 0-10.4-18.1Z"/>
        <path fill="#FFF" d="M58.1 95.3c-17.9 0-31.1-10.4-31.1-29.4s13.2-29.4 31.1-29.4c11.4 0 19.1 4.8 24.3 12.2l-10.7 7.5c-3.3-4.7-7.4-7.7-13.6-7.7-10 0-17.2 6.7-17.2 17.4s7.2 17.4 17.2 17.4c6.6 0 10.6-2.9 14-7.8l10.7 7.3c-5.2 7.7-12.9 12.5-24.7 12.5Zm32.2-18.7V71h-5.6v-4.7h5.6v-5.5h4.9v5.5h5.7V71h-5.7v5.6Zm13 0V71h-5.6v-4.7h5.6v-5.5h4.9v5.5h5.7V71h-5.7v5.6Z"/>
      </svg>
    );
  }

  if (icon === "lua") {
    return (
      <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
        <circle cx="64" cy="64" r="54" fill="#000080" />
        <circle cx="84" cy="42" r="16" fill="#fff" opacity="0.95" />
        <circle cx="80" cy="42" r="16" fill="#000080" />
        <circle cx="96" cy="24" r="10" fill="#9bb1ff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 128 128" className="h-8 w-8" aria-hidden="true">
      <path fill="#FFF" d="M108.6 91.7c0 13.3-10.8 24.1-24.1 24.1s-24.1-10.8-24.1-24.1 10.8-24.1 24.1-24.1 24.1 10.8 24.1 24.1Zm-24.1-52.2A24.1 24.1 0 1 0 84.5 87.7 24.1 24.1 0 0 0 84.5 39.5Zm0-27.7a51.8 51.8 0 1 1 0 103.6 51.8 51.8 0 0 1 0-103.6Zm0 14.4a37.4 37.4 0 1 0 37.4 37.4A37.4 37.4 0 0 0 84.5 26.2Z"/>
      <path fill="#DEA584" d="M34.2 97.5c-5-4.3-7.8-9.5-8.2-15.5-.7-10.5 7.1-19.4 19.3-25.8-6.3 8-8.9 15-7.8 21 1 5.4 4.8 10 11.2 13.8-4.1 4.4-8.8 6.6-14.5 6.5Z"/>
    </svg>
  );
}

function LibraryMenu({
  languageId,
  open,
  onToggle,
}: {
  languageId: LearningLanguage;
  open: boolean;
  onToggle: () => void;
}) {
  const courses = getMiniCourses(languageId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="flex h-9 w-9 items-center justify-center border border-[rgba(44,62,80,0.16)] bg-[#F8F5F0] text-[#2C3E50]"
        aria-label={`Open ${languageId} libraries`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-30 w-60 surface-sheet bg-[#F8F5F0] p-2"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">
            Libraries
          </p>
          <div className="space-y-1">
            {courses.map((course) => (
              course.status === "live" && course.href ? (
                <Link
                  key={course.id}
                  href={course.href}
                  className="block border border-transparent px-3 py-2 transition hover:border-[rgba(44,62,80,0.12)] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[#2C3E50]">{course.title}</p>
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#21623A]">
                      Open
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#687A89]">{course.subtitle}</p>
                </Link>
              ) : (
                <div key={course.id} className="border border-transparent px-3 py-2 hover:border-[rgba(44,62,80,0.12)] hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[#2C3E50]">{course.title}</p>
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#E67E22]">
                      {course.status === "coming_soon" ? "Soon" : "Planned"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#687A89]">{course.subtitle}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReserveOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[-8%] top-[46%] h-[2px] w-[116%] -rotate-[8deg] bg-[#8E99A3]" />
      <div className="absolute left-[55%] top-[-8%] h-[120%] w-[2px] rotate-[12deg] bg-[#8E99A3]" />
    </div>
  );
}

export default function LanguagePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [openLibraryMenu, setOpenLibraryMenu] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  useEffect(() => {
    const closeMenu = () => setOpenLibraryMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  async function openLanguage(languageId: string) {
    if (!userId) return;

    setSelected(languageId);
    setOpenLibraryMenu(null);
    setLoading(true);

    const isSameLanguage = languageId === currentLanguage;

    if (!isSameLanguage) {
      const { data: savedProgress } = await supabase
        .from("pico_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("language", languageId)
        .maybeSingle();

      if (!savedProgress) {
        await fetch("/api/progress", {
          method: "POST",
          body: JSON.stringify({
            userId,
            language: languageId,
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

      setStoredActiveLanguage(userId, languageId);
      router.push(savedProgress ? "/learn" : languageHasPlacement(languageId) ? "/placement" : "/learn");
      return;
    }

    setStoredActiveLanguage(userId, languageId);
    router.push("/learn");
  }

  async function handleConfirm() {
    if (!selected) return;
    await openLanguage(selected);
  }

  const activeCard = LANGUAGE_CARDS.find((card) => card.id === (selected ?? currentLanguage ?? "python")) ?? LANGUAGE_CARDS[0];
  const reserveCards = LANGUAGE_CARDS.filter((card) => card.status === "reserve").length;

  return (
    <div className="min-h-screen mobile-dock-pad px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="surface-sheet relative overflow-hidden px-6 py-8 sm:px-8">
            <div className="absolute right-0 top-0 h-24 w-24 border-l border-b border-[rgba(44,62,80,0.08)] bg-[rgba(230,126,34,0.08)]" />
            <p className="editorial-kicker">Courses</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.98] text-[#2C3E50] sm:text-6xl">
              Select a course.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#5A6A79]">
              Select Python or JavaScript. Open libraries from each card.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_0.9fr]">
              <div className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Current course</p>
                <p className="mt-3 text-3xl font-black text-[#2C3E50]">{getLanguageLabel(currentLanguage ?? "python")}</p>
              </div>
              <div className="border border-[rgba(44,62,80,0.12)] bg-[#2C3E50] p-4 text-[#ECF0F1] sm:translate-y-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#F4C28A]">Course count</p>
                <p className="mt-3 text-3xl font-black">{reserveCards + 2}</p>
              </div>
            </div>
          </article>

          <aside className="surface-sheet grid gap-5 px-6 py-8 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="editorial-kicker">Selection</p>
                <h2 className="mt-3 text-4xl font-black text-[#2C3E50]">Review {activeCard.label}</h2>
              </div>
              <Pico size={84} mood="happy" />
            </div>
            <p className="text-base font-semibold leading-7 text-[#5A6A79]">{activeCard.description}</p>
            <div className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Library menu</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#4E6070]">
                Open the top menu to view supported libraries.
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!selected || loading}
              className="ink-button px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] disabled:border-[#B7C0C7] disabled:bg-[#DDE2E6] disabled:text-[#738392]"
            >
              {loading ? "Open course..." : selected === currentLanguage ? "Open course" : "Select course"}
            </button>
          </aside>
        </section>

        <section className="grid auto-rows-[minmax(220px,auto)] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LANGUAGE_CARDS.map((language) => {
            const isLive = language.status === "live";
            const isSelected = selected === language.id;
            const isCurrent = currentLanguage === language.id;

            return (
              <article
                key={language.id}
                onClick={() => {
                  if (isLive && !loading) {
                    void openLanguage(language.id);
                  }
                }}
                onKeyDown={(event) => {
                  if (!isLive || loading) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openLanguage(language.id);
                  }
                }}
                role={isLive ? "button" : undefined}
                tabIndex={isLive ? 0 : undefined}
                aria-disabled={isLive ? loading : undefined}
                aria-label={isLive ? `Open ${language.label} course` : undefined}
                className={`surface-sheet relative overflow-hidden px-5 py-5 transition ${language.footprint} ${
                  isLive
                    ? isSelected
                      ? "cursor-pointer touch-manipulation border-[#2C3E50] bg-[#FBF8F4] shadow-[0_18px_40px_rgba(44,62,80,0.1)]"
                      : "cursor-pointer touch-manipulation hover:-translate-y-0.5"
                    : "bg-[#E7E3DC]"
                }`}
              >
                {!isLive && <ReserveOverlay />}

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center ${language.tileClass}`}>
                      <LanguageLogo icon={language.icon} />
                    </div>

                    {isLive ? (
                      <div className="flex items-start gap-2">
                        <LibraryMenu
                          languageId={language.id as LearningLanguage}
                          open={openLibraryMenu === language.id}
                          onToggle={() => setOpenLibraryMenu((current) => current === language.id ? null : language.id)}
                        />
                        <div className={`flex h-8 w-8 items-center justify-center border-2 ${
                          isSelected ? "border-[#2C3E50] bg-[#2C3E50] text-white" : "border-[#B7C0C7] bg-[#F8F5F0] text-transparent"
                        }`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <span className="border border-[rgba(44,62,80,0.16)] bg-[#F8F5F0] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#697A88]">
                        Not available
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-4xl font-black text-[#2C3E50]">
                      {isLive ? `Select ${language.label}` : `View ${language.label}`}
                    </h3>
                    <p className="mt-3 max-w-md text-base font-semibold leading-7 text-[#5A6A79]">
                      {language.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    {isLive ? (
                      <div className="flex items-center justify-between border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-4">
                        <div>
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">
                            {isCurrent ? "Current course" : "Available course"}
                          </p>
                          <p className="mt-2 text-sm font-bold text-[#2C3E50]">
                            {isCurrent ? "Open course" : "Select course"}
                          </p>
                        </div>
                        <span className="text-sm font-black text-[#E67E22]">{isSelected ? "Selected" : "Ready"}</span>
                      </div>
                    ) : (
                      <div className="border border-[rgba(44,62,80,0.12)] bg-[#F8F5F0] px-4 py-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Availability</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#566776]">
                          This course is not available yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <MobileDock />
    </div>
  );
}
