"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SECTIONS = [
  {
    id: 1,
    title: "Beginner",
    level: "Section 1",
    color: "bg-green-500",
    borderColor: "border-green-600",
    units: [
      {
        id: 1,
        title: "Hello World",
        description: "Your first lines of Python code",
        lessons: [
          { id: 1, title: "Your first print()" },
          { id: 2, title: "Printing numbers" },
          { id: 3, title: "Printing multiple things" },
          { id: 4, title: "Comments" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 2,
        title: "Variables",
        description: "Store and use information",
        lessons: [
          { id: 1, title: "Creating a variable" },
          { id: 2, title: "Variable names" },
          { id: 3, title: "Changing a variable" },
          { id: 4, title: "Printing variables" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 3,
        title: "User Input",
        description: "Let users interact with your code",
        lessons: [
          { id: 1, title: "The input() function" },
          { id: 2, title: "Storing input" },
          { id: 3, title: "Input with numbers" },
          { id: 4, title: "Using input in print" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 4,
        title: "Strings",
        description: "Work with text in Python",
        lessons: [
          { id: 1, title: "Joining strings" },
          { id: 2, title: "String length" },
          { id: 3, title: "Upper and lower case" },
          { id: 4, title: "f-strings" },
          { id: 5, title: "Unit challenge" },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Intermediate",
    level: "Section 2",
    color: "bg-blue-500",
    borderColor: "border-blue-600",
    units: [
      {
        id: 5,
        title: "Conditions",
        description: "Make decisions in your code",
        lessons: [
          { id: 1, title: "if statements" },
          { id: 2, title: "else statements" },
          { id: 3, title: "elif statements" },
          { id: 4, title: "Combining conditions" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 6,
        title: "Loops",
        description: "Repeat code automatically",
        lessons: [
          { id: 1, title: "while loops" },
          { id: 2, title: "for loops" },
          { id: 3, title: "range()" },
          { id: 4, title: "break and continue" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 7,
        title: "Functions",
        description: "Write reusable blocks of code",
        lessons: [
          { id: 1, title: "Defining a function" },
          { id: 2, title: "Calling a function" },
          { id: 3, title: "Parameters" },
          { id: 4, title: "Return values" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 8,
        title: "Lists",
        description: "Store multiple values together",
        lessons: [
          { id: 1, title: "Creating a list" },
          { id: 2, title: "Accessing items" },
          { id: 3, title: "Adding and removing" },
          { id: 4, title: "Looping through lists" },
          { id: 5, title: "Unit challenge" },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Advanced",
    level: "Section 3",
    color: "bg-purple-500",
    borderColor: "border-purple-600",
    units: [
      {
        id: 9,
        title: "Dictionaries",
        description: "Store data with keys and values",
        lessons: [
          { id: 1, title: "Creating a dictionary" },
          { id: 2, title: "Accessing values" },
          { id: 3, title: "Adding and updating" },
          { id: 4, title: "Looping through dicts" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 10,
        title: "File Handling",
        description: "Read and write files",
        lessons: [
          { id: 1, title: "Opening files" },
          { id: 2, title: "Reading files" },
          { id: 3, title: "Writing files" },
          { id: 4, title: "Closing files" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 11,
        title: "Classes",
        description: "Build your own data types",
        lessons: [
          { id: 1, title: "Defining a class" },
          { id: 2, title: "The __init__ method" },
          { id: 3, title: "Attributes" },
          { id: 4, title: "Methods" },
          { id: 5, title: "Unit challenge" },
        ],
      },
      {
        id: 12,
        title: "Final Project",
        description: "Build a real Python program",
        lessons: [
          { id: 1, title: "Planning your project" },
          { id: 2, title: "Building the structure" },
          { id: 3, title: "Adding features" },
          { id: 4, title: "Testing and fixing" },
          { id: 5, title: "Final challenge" },
        ],
      },
    ],
  },
];

const PATH_POSITIONS = ["ml-32", "ml-56", "ml-72", "ml-56", "ml-32"];

export default function Learn() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guidebook, setGuidebook] = useState<any>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }
}, [loading]);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setCompletedLessons(JSON.parse(data.completed_lessons || "[]"));
      setXp(data.xp || 0);
      setStreak(data.streak || 0);
    }
    setLoading(false);
  };

  const isUnlocked = (unitId: number, lessonId: number) => {
    if (unitId === 1 && lessonId === 1) return true;
    const prevLesson = lessonId > 1 ? `${unitId}-${lessonId - 1}` : `${unitId - 1}-5`;
    return completedLessons.includes(prevLesson);
  };

  const isSectionUnlocked = (sectionId: number) => {
    if (sectionId === 1) return true;
    const prevSection = SECTIONS[sectionId - 2];
    return prevSection.units.every(unit =>
      unit.lessons.every(lesson => completedLessons.includes(`${unit.id}-${lesson.id}`))
    );
  };

  const allComplete = SECTIONS.every(section =>
    section.units.every(unit =>
      unit.lessons.every(lesson => completedLessons.includes(`${unit.id}-${lesson.id}`))
    )
  );

  const openGuidebook = async (unit: any) => {
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: true, content: null });
    const res = await fetch("/api/guidebook", {
      method: "POST",
      body: JSON.stringify({ unitTitle: unit.title, unitDescription: unit.description }),
    });
    const data = await res.json();
    setGuidebook({ unitId: unit.id, unitDescription: unit.description, loading: false, content: data });
  };

  if (guidebook) {
    return (
      <main className="min-h-screen bg-gray-50">
        <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100">
          <a href="/" className="text-2xl font-extrabold text-green-500">Pico</a>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={() => setGuidebook(null)} className="text-gray-400 font-bold mb-6 hover:text-gray-600">
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Unit {guidebook.unitId} Guidebook</h1>
          <p className="text-gray-500 font-semibold mb-8">{guidebook.unitDescription}</p>

          {guidebook.loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500 font-semibold">Generating guidebook...</p>
            </div>
          ) : guidebook.content ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm p-8">
                <p className="text-gray-700 font-semibold text-lg leading-relaxed">{guidebook.content.intro}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-3">What is it?</h2>
                <p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.whatIsIt}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-3">Why does it matter?</h2>
                <p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.whyItMatters}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-3">How does it work?</h2>
                <p className="text-gray-700 font-semibold leading-relaxed">{guidebook.content.howItWorks}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Examples</h2>
                <div className="space-y-6">
                  {guidebook.content.examples?.map((ex: any, i: number) => (
                    <div key={i}>
                      <p className="font-extrabold text-gray-900 mb-2">{ex.title}</p>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-sm font-mono mb-3 overflow-x-auto">{ex.code}</pre>
                      <p className="text-gray-600 font-semibold leading-relaxed">{ex.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Common mistakes</h2>
                <ul className="space-y-3">
                  {guidebook.content.commonMistakes?.map((mistake: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-red-500 font-extrabold mt-0.5">!</span>
                      <p className="text-gray-700 font-semibold leading-relaxed">{mistake}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border-2 border-green-100 rounded-3xl p-8">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Tips</h2>
                <ul className="space-y-3">
                  {guidebook.content.tips?.map((tip: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-green-500 font-extrabold mt-0.5">✓</span>
                      <p className="text-gray-700 font-semibold leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <a href="/" className="text-2xl font-extrabold text-green-500">Pico</a>
        <div className="flex gap-6 text-sm font-bold text-gray-500">
          <span className="text-green-500 font-extrabold">{xp} XP</span>
          <span>{streak} day streak</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1 text-center">Python</h1>
        {completedLessons.length === 0 && !loading && (
  <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border-2 border-green-100">
    <p className="font-extrabold text-gray-900 mb-1">Already know some Python?</p>
    <p className="text-gray-500 font-semibold text-sm mb-4">Take a quick test to skip ahead to the right level.</p>
    <a href="/placement" className="block w-full bg-green-500 text-white font-extrabold py-3 rounded-2xl hover:bg-green-600 transition text-center shadow-md">
      Take placement test
    </a>
  </div>
)}
        <p className="text-gray-400 font-semibold mb-12 text-center">Your learning path</p>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {SECTIONS.map((section) => {
              const sectionUnlocked = isSectionUnlocked(section.id);
              const allLessons = section.units.flatMap(u => u.lessons.map(l => `${u.id}-${l.id}`));
              const completedInSection = allLessons.filter(l => completedLessons.includes(l)).length;
              const sectionComplete = completedInSection === allLessons.length;

              return (
                <div key={section.id} className="mb-12">
                  <div className={`rounded-3xl p-6 mb-8 ${sectionComplete ? "bg-green-50 border-2 border-green-200" : sectionUnlocked ? "bg-white border-2 border-gray-100" : "bg-gray-50 border-2 border-gray-100 opacity-60"} shadow-sm`}>
                    <p className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${sectionUnlocked ? "text-green-500" : "text-gray-400"}`}>
                      {section.level}
                    </p>
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-extrabold text-gray-900">{section.title}</h2>
                      {sectionComplete && <span className="text-green-500 font-extrabold text-sm">Completed!</span>}
                      {!sectionUnlocked && <span className="text-gray-400 font-bold text-sm">Locked</span>}
                    </div>
                    {sectionUnlocked && !sectionComplete && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${(completedInSection / allLessons.length) * 100}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-1">{completedInSection}/{allLessons.length} lessons</p>
                      </div>
                    )}
                  </div>

                  {sectionUnlocked && section.units.map((unit) => (
                    <div key={unit.id} className="mb-8">
                      <div id={`unit-${unit.id}`} className={`${section.color} rounded-2xl px-6 py-4 mb-6 flex justify-between items-center shadow-md`}>
                        <div>
                          <p className="text-white font-extrabold text-lg">Unit {unit.id}: {unit.title}</p>
                          <p className="text-white text-sm font-semibold opacity-80">{unit.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="bg-white rounded-xl px-3 py-1">
                            <span className="text-green-600 text-sm font-bold">
                              {unit.lessons.filter(l => completedLessons.includes(`${unit.id}-${l.id}`)).length}/{unit.lessons.length}
                            </span>
                          </div>
                          <button
                            onClick={() => openGuidebook(unit)}
                            className="bg-white text-green-600 text-xs font-extrabold px-3 py-1 rounded-xl hover:bg-green-50 transition"
                          >
                            Guidebook
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 mb-4">
                        {unit.lessons.map((lesson, index) => {
                          const unlocked = isUnlocked(unit.id, lesson.id);
                          const completed = completedLessons.includes(`${unit.id}-${lesson.id}`);
                          const key = `${unit.id}-${lesson.id}`;
                          const isChallenge = lesson.id === 5;

                          return (
                            <div key={lesson.id} className={`flex ${PATH_POSITIONS[index]}`}>
                              <div className="relative">
                                {tooltip === key && (
                                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap z-20 shadow-lg">
                                    {lesson.title}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                                <a
                                  href={(unlocked || completed) ? (isChallenge ? `/learn/${unit.id}/challenge` : `/learn/${unit.id}/${lesson.id}`) : "#"}
                                  onMouseEnter={() => setTooltip(key)}
                                  onMouseLeave={() => setTooltip(null)}
                                  className={`w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-lg border-b-4 transition-all duration-150 active:border-b-0 active:translate-y-1 ${
                                    completed
                                      ? `${section.color} ${section.borderColor} text-white shadow-lg`
                                      : unlocked
                                      ? isChallenge
                                        ? "bg-yellow-400 border-yellow-500 text-white shadow-lg hover:brightness-110"
                                        : `${section.color} ${section.borderColor} text-white shadow-lg hover:brightness-110`
                                      : "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  {completed ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : unlocked && isChallenge ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  ) : unlocked ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Daily Refresh */}
            <div className={`rounded-3xl p-6 mb-8 ${allComplete ? "bg-white border-2 border-gray-100" : "bg-gray-100 border-2 border-gray-200 opacity-70"} shadow-sm`}>
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1 text-green-500">Daily Refresh</p>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Daily Challenge</h2>
                  {allComplete ? (
                    <p className="text-gray-500 font-semibold text-sm">Keep your streak alive with a daily practice session.</p>
                  ) : (
                    <p className="text-gray-400 font-semibold text-sm">Complete the full course to unlock this!</p>
                  )}
                </div>
                {!allComplete && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              {allComplete && (
                <a href="/daily" className="mt-4 block w-full bg-green-500 text-white font-extrabold py-3 rounded-2xl hover:bg-green-600 transition text-center shadow-md">
                  Start Today's Challenge
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}