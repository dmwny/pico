"use client";

import { useEffect, useMemo, useState } from "react";
import Pico from "@/components/Pico";
import { useThemeContext } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { withAlpha } from "@/lib/themes";
import {
  getCompletedRobloxCourseKeys,
  getRobloxCourseKey,
  getRobloxCourseQuestionCount,
  isRobloxCourseNodeUnlocked,
  robloxCapstone,
  robloxCourse,
} from "@/lib/robloxCourse";

const PATH_POSITIONS = ["ml-20", "ml-36", "ml-52", "ml-36", "ml-20"];

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

export default function RobloxStudioMapClient() {
  const { pathTheme } = useThemeContext();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("pico_progress")
        .select("completed_lessons")
        .eq("user_id", user.id)
        .eq("language", "lua")
        .maybeSingle();

      setCompletedLessons(getCompletedRobloxCourseKeys(parseCompletedLessons(data?.completed_lessons)));
      setLoading(false);
    }

    void loadProgress();
  }, []);

  const totalLessons = useMemo(
    () => robloxCourse.units.reduce((sum, unit) => sum + unit.nodes.length, 0),
    [],
  );
  const totalQuestions = useMemo(
    () =>
      robloxCourse.units.reduce(
        (sum, unit) => sum + unit.nodes.reduce((unitSum, node) => unitSum + getRobloxCourseQuestionCount(node.concept), 0),
        0,
      ),
    [],
  );

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: pathTheme.surfaceBackground }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <section
            className="rounded-[2rem] border p-6 shadow-sm"
            style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.28em]" style={{ color: pathTheme.accentColor }}>Mini course</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95]" style={{ color: pathTheme.surfaceText }}>
              {robloxCourse.title}
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>
              Studio tools, world building, scripting, players, UI, networking, persistence, polish, publishing, and an end-of-course capstone for Roblox Lua.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border p-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: withAlpha(pathTheme.accentColor, 0.1) }}>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>Units</p>
                <p className="mt-2 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{robloxCourse.units.length}</p>
              </div>
              <div className="rounded-[1.75rem] border p-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: withAlpha(pathTheme.surfaceBackground, 0.36) }}>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>Lessons</p>
                <p className="mt-2 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{totalLessons}</p>
              </div>
              <div className="rounded-[1.75rem] border p-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: withAlpha(pathTheme.surfaceBackground, 0.36) }}>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>Questions</p>
                <p className="mt-2 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{totalQuestions}</p>
              </div>
            </div>
          </section>

          <aside
            className="rounded-[2rem] border p-6 shadow-sm"
            style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>Track</p>
                <h2 className="mt-3 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>Recommended normal Lua progress</h2>
              </div>
              <Pico size={84} mood="happy" />
            </div>
            <div className="mt-6 rounded-[1.75rem] border p-4" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.12), background: withAlpha(pathTheme.surfaceBackground, 0.4) }}>
              <p className="text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>
                Each unit tells learners which normal Lua unit they should finish first. This Roblox track now follows the full journey from opening Studio to shipping a live game and then pushing into advanced systems.
              </p>
            </div>
            <a
              href="/labs/lua/roblox-studio/1/1"
              className="mt-6 inline-flex rounded-[1.4rem] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] shadow-sm transition"
              style={{ background: pathTheme.accentColor, color: pathTheme.accentContrast }}
            >
              Open first lesson
            </a>
            <a
              href="/learn?lang=lua"
              className="mt-3 inline-flex rounded-[1.4rem] border px-5 py-3 text-sm font-extrabold uppercase tracking-[0.18em] shadow-sm transition"
              style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), color: pathTheme.surfaceText, background: withAlpha(pathTheme.surfaceBackground, 0.3) }}
            >
              Exit mini course
            </a>
          </aside>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            {loading ? (
              <div className="flex min-h-[20rem] items-center justify-center rounded-[2rem] border shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), background: pathTheme.surfaceCard }}>
                <div className="text-sm font-bold" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>Loading Roblox Studio progress...</div>
              </div>
            ) : (
              robloxCourse.units.map((unit, unitIndex) => (
                <div key={unit.id} className="mb-10">
                  <div
                    className="mb-6 rounded-[2rem] px-6 py-5 text-white shadow-sm"
                    style={{ background: pathTheme.surfaceDark }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.accentColor, 0.78) }}>
                          Unit {unitIndex + 1}
                        </p>
                        <h3 className="mt-2 text-3xl font-black text-white">{unit.title}</h3>
                        <p className="mt-2 text-sm font-semibold text-white/82">{unit.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold" style={{ color: pathTheme.surfaceDark }}>
                        {unit.nodes.filter((_, nodeIndex) => completedLessons.includes(getRobloxCourseKey(unitIndex + 1, nodeIndex + 1))).length}/{unit.nodes.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {unit.nodes.map((node, nodeIndex) => {
                      const unitNumber = unitIndex + 1;
                      const lessonNumber = nodeIndex + 1;
                      const key = getRobloxCourseKey(unitNumber, lessonNumber);
                      const questionCount = getRobloxCourseQuestionCount(node.concept);
                      const isComplete = completedLessons.includes(key);
                      const isUnlocked = isRobloxCourseNodeUnlocked(completedLessons, unitNumber, lessonNumber);
                      const offset = PATH_POSITIONS[(nodeIndex + unitIndex) % PATH_POSITIONS.length];

                      return (
                        <div key={node.id} className={offset}>
                          {isUnlocked ? (
                            <a href={`/labs/lua/roblox-studio/${unitNumber}/${lessonNumber}`} className="group block w-fit">
                              <div
                                className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] shadow-lg transition"
                                style={{
                                  borderColor: isComplete ? pathTheme.accentColor : withAlpha(pathTheme.accentColor, 0.22),
                                  background: isComplete ? pathTheme.accentColor : pathTheme.surfaceCard,
                                  color: isComplete ? pathTheme.accentContrast : pathTheme.accentColor,
                                }}
                              >
                                {isComplete ? (
                                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="text-xl font-black">{lessonNumber}</span>
                                )}
                              </div>
                              <div className="mt-3 w-64 rounded-[1.5rem] border px-4 py-4 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: pathTheme.surfaceCard }}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-extrabold uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.45) }}>
                                    {node.label}
                                  </p>
                                  <span className="rounded-full px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.18em]" style={{ background: withAlpha(pathTheme.accentColor, 0.12), color: pathTheme.accentColor }}>
                                    {questionCount} Qs
                                  </span>
                                </div>
                                <p className="mt-1 text-xl font-black" style={{ color: pathTheme.surfaceText }}>{node.concept.replace(/-/g, " ")}</p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.62) }}>
                                  {node.nodeType === "teaching" ? "Introduces the concept." : "Applies the concept at higher difficulty."}
                                </p>
                              </div>
                            </a>
                          ) : (
                            <div className="w-fit opacity-60">
                              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] shadow-sm" style={{ borderColor: withAlpha(pathTheme.surfaceText, 0.14), background: withAlpha(pathTheme.surfaceBackground, 0.28), color: withAlpha(pathTheme.surfaceText, 0.35) }}>
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 10-8 0v4m-1 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                                </svg>
                              </div>
                              <div className="mt-3 w-64 rounded-[1.5rem] border px-4 py-4 shadow-sm" style={{ borderColor: withAlpha(pathTheme.surfaceText, 0.12), background: pathTheme.surfaceCard }}>
                                <p className="text-xs font-extrabold uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.3) }}>{node.label}</p>
                                <p className="mt-1 text-xl font-black" style={{ color: withAlpha(pathTheme.surfaceText, 0.44) }}>{node.concept.replace(/-/g, " ")}</p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.4) }}>Finish the earlier lesson first.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border p-5 shadow-sm lg:sticky lg:top-24" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: pathTheme.surfaceCard }}>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.45) }}>Course notes</p>
            <div className="mt-4 space-y-3 text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.66) }}>
              <p>Question counts now come from each concept file instead of assuming a fixed size.</p>
              <p>Every unit now maps to the full game-building arc instead of stopping halfway through the project.</p>
              <p>Scripting lessons use real Roblox APIs like `workspace`, `Instance.new()`, remotes, ScreenGui, TweenService, DataStoreService, raycasts, and tagging systems.</p>
            </div>
          </aside>
        </section>

        <section className="mt-12 rounded-[2rem] border p-6 shadow-sm" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: pathTheme.surfaceCard }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>Capstone</p>
              <h2 className="mt-2 text-3xl font-black" style={{ color: pathTheme.surfaceText }}>Build Your Own Game</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>
                After Unit 11, the course ends with a guided project-only capstone. These cards walk learners from a one-sentence idea all the way to a published original Roblox game.
              </p>
            </div>
            <div className="rounded-[1.4rem] border px-4 py-3 text-sm font-extrabold uppercase tracking-[0.18em]" style={{ borderColor: withAlpha(pathTheme.accentColor, 0.16), background: withAlpha(pathTheme.accentColor, 0.1), color: pathTheme.accentColor }}>
              {robloxCapstone.length} phases
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {robloxCapstone.map((card) => (
              <article
                key={card.id}
                className="rounded-[1.6rem] border p-5 shadow-sm"
                style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: withAlpha(pathTheme.surfaceBackground, 0.32) }}
              >
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.22em]" style={{ color: pathTheme.accentColor }}>
                  {card.phase}
                </p>
                <h3 className="mt-2 text-2xl font-black" style={{ color: pathTheme.surfaceText }}>{card.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>
                  {card.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em]"
                      style={{ background: withAlpha(pathTheme.accentColor, 0.1), color: pathTheme.accentColor }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <a
                  href={card.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-[1.1rem] border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                  style={{ borderColor: withAlpha(pathTheme.accentColor, 0.18), color: pathTheme.accentColor, background: withAlpha(pathTheme.accentColor, 0.08) }}
                >
                  Open docs
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
