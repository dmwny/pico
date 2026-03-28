"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const options = ["Hello, World!", "hello world", "SyntaxError", "Nothing"];
  const correctIndex = 0;

  const pick = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    setTimeout(() => {
      setSelected(null);
      setRevealed(false);
    }, 2800);
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-green-500 tracking-tight">Pico</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-600 font-bold text-sm px-4 py-2 rounded-xl border border-gray-200 hover:border-green-400 hover:text-green-600 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-green-500 text-white font-extrabold text-sm px-5 py-2 rounded-xl hover:bg-green-600 transition"
              style={{ boxShadow: "0 3px 0 #16a34a" }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Left */}
        <div>
          <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-3">
            Python for beginners
          </p>
          <h1 className="text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-5">
            Learn Python.<br />
            <span className="text-green-500">Actually finish it.</span>
          </h1>
          <p className="text-gray-500 font-semibold text-base leading-relaxed mb-8 max-w-sm">
            Short interactive lessons, instant feedback, and a streak to keep you honest. Zero to real Python — no setup needed.
          </p>

          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/learn"
              className="bg-green-500 text-white font-extrabold text-base px-8 py-3.5 rounded-2xl hover:bg-green-600 transition"
              style={{ boxShadow: "0 4px 0 #16a34a" }}
            >
              Start learning — free
            </Link>
            <Link
              href="/learn"
              className="text-green-600 font-bold text-sm border-b-2 border-green-200 hover:border-green-500 transition pb-0.5"
            >
              See the curriculum
            </Link>
          </div>

          <div className="flex gap-8 pt-6 border-t border-gray-100">
            {[["12", "Units"], ["60+", "Lessons"], ["2,400+", "Learners"], ["0", "Setup needed"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-xl font-black text-gray-900 tracking-tight">{n}</p>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — interactive mock lesson card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-extrabold text-orange-500 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl whitespace-nowrap">
              7 day streak
            </span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: "55%" }} />
            </div>
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="text-base">{"❤️"}</span>
              ))}
            </div>
          </div>

          <p className="text-xs font-extrabold text-green-500 uppercase tracking-widest mb-1">
            Unit 1 · Hello World
          </p>
          <p className="text-base font-extrabold text-gray-900 mb-3">
            What does this code output?
          </p>

          <div className="bg-gray-900 rounded-2xl px-4 py-3 mb-4 font-mono text-sm font-bold text-green-400">
            print(&quot;Hello, World!&quot;)
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {options.map((opt, i) => {
              let cls = "w-full text-left px-4 py-3 rounded-2xl border-2 border-b-4 text-sm font-bold transition ";
              if (!revealed) {
                cls += "border-gray-200 bg-white text-gray-800 hover:border-green-400 hover:bg-green-50 hover:text-green-700";
              } else if (i === correctIndex) {
                cls += "border-green-400 bg-green-50 text-green-700";
              } else if (i === selected) {
                cls += "border-red-400 bg-red-50 text-red-600";
              } else {
                cls += "border-gray-200 bg-white text-gray-400";
              }
              return (
                <button key={i} className={cls} onClick={() => pick(i)}>
                  {opt}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              selected === correctIndex
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {selected === correctIndex
                ? "Correct — the quotes aren't printed, only what's inside them."
                : `Not quite. The answer is "Hello, World!"`}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-2">Why Pico</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "You'll actually finish it",
                body: "Lessons take under 5 minutes. Streaks and XP create the habit loop that keeps you coming back until Python clicks.",
              },
              {
                num: "02",
                title: "Fresh questions every time",
                body: "AI generates unique challenges on every run — no memorising answers. Every attempt tests real understanding.",
              },
              {
                num: "03",
                title: "Start at the right level",
                body: "A 2-minute placement test skips what you already know and drops you straight into the unit that's actually challenging.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <p className="text-xs font-black text-gray-300 tracking-widest mb-3">{num}</p>
                <h3 className="text-base font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm font-semibold text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-10">
            Three steps to writing real Python
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                title: "Take the placement test",
                body: "2 minutes, 12 questions. We skip what you know and start you exactly where it makes sense.",
              },
              {
                n: "2",
                title: "Learn by doing",
                body: "Each lesson teaches one concept then drills it immediately — fill-in, arrange, and real code challenges.",
              },
              {
                n: "3",
                title: "Build the streak",
                body: "XP, streaks, and unit challenges make it hard to stop. Finish all 12 units to unlock daily coding challenges.",
              },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div
                  className="w-9 h-9 bg-green-500 rounded-full text-white font-black text-sm flex items-center justify-center mb-4"
                  style={{ boxShadow: "0 3px 0 #16a34a" }}
                >
                  {n}
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm font-semibold text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-green-500 py-16 text-center">
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          Your Python journey starts in 30 seconds.
        </h2>
        <p className="text-green-100 font-semibold text-base mb-8">
          Free to start. No credit card. No download.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-green-600 font-extrabold text-base px-10 py-4 rounded-2xl hover:bg-green-50 transition"
          style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.12)" }}
        >
          Start learning for free
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center">
        <p className="text-sm font-semibold text-gray-300">
          Pico — Learn to code, one lesson at a time. &nbsp;·&nbsp;{" "}
          <Link href="/login" className="text-green-500 hover:underline">
            Log in
          </Link>
        </p>
      </footer>

    </main>
  );
}